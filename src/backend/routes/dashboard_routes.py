from fastapi import APIRouter, HTTPException, Query, Request
from database import (
    users_collection,
    modules_collection,
    scores_collection,
    pre_test_collection,
    post_test_collection,
    session_logs_collection,  # Added for collaborative session hour aggregation
    flashcards_collection,    # For flashcard generation counts
)
from bson import ObjectId
from config import logger
from typing import Optional

router = APIRouter()

# Endpoint: Get all modules posted by the instructor
@router.get("/api/instructor/modules")
async def get_instructor_modules(request: Request):
    # Optionally, get instructor_id from query params or session
    instructor_id = request.query_params.get("instructor_id")
    query = {}
    if instructor_id:
        query["id_number"] = instructor_id
    modules = list(modules_collection.find(query))
    modules_list = [
        {
            "_id": str(module["_id"]),
            "title": module["title"],
            "description": module.get("description", ""),
            "file": module.get("file", ""),
            "subject": module.get("subject", ""),
            "program": module.get("program", ""),
            "image_url": module.get("image_url", ""),
        }
        for module in modules
    ]
    return modules_list

@router.get("/api/dashboard/{id_number}")
def dashboard(id_number: str, mode: Optional[str] = Query("current", description="Score set: current | previous | combined")):
    import datetime  # Move any other imports up if needed
    user = users_collection.find_one({"id_number": str(id_number)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    import datetime
    today = datetime.date.today().isoformat()
    # Ensure login_history exists and is a list
    login_history = user.get("login_history", [])
    if not isinstance(login_history, list):
        login_history = []
    # If today is not in login_history, add it and update user doc
    if today not in login_history:
        login_history.append(today)
        users_collection.update_one({"_id": user["_id"]}, {"$set": {"login_history": login_history}})
    program = user.get("program", "All Programs")
    query = {}
    if program and program != "All Programs":
        query["program"] = program
    modules_in_program = list(modules_collection.find(query))
    # Collect ALL scores (for all-time average that never resets)
    all_scores = list(scores_collection.find({"user_id": id_number}))
    # Determine score filtering based on mode
    mode_norm = (mode or "current").lower()
    score_filter = {"user_id": id_number}
    if mode_norm == "current":
        score_filter["archived"] = {"$ne": True}
    elif mode_norm == "previous":
        score_filter["archived"] = True
    # combined -> no archived filter (both current + previous)
    scores = list(scores_collection.find(score_filter))
    # Collect all module_ids from scores (pretest or posttest)
    answered_module_ids = set(str(s["module_id"]) for s in scores)
    # Get all modules the user has answered (even if not in program)
    answered_modules = list(modules_collection.find({"_id": {"$in": [ObjectId(mid) for mid in answered_module_ids]}})) if answered_module_ids else []
    # Combine and deduplicate modules (by _id)
    all_modules_dict = {str(module["_id"]): module for module in modules_in_program}
    for module in answered_modules:
        all_modules_dict[str(module["_id"])] = module
    # Also, for any module_id in scores that is not found in modules_collection, create a placeholder
    for mid in answered_module_ids:
        if mid not in all_modules_dict:
            # Try to get from modules_collection, if not found, create minimal placeholder
            module = modules_collection.find_one({"_id": ObjectId(mid)})
            if module:
                all_modules_dict[mid] = module
            else:
                # Placeholder if module is missing from collection
                all_modules_dict[mid] = {"_id": mid, "title": f"Module {mid}", "image_url": ""}
    modules = list(all_modules_dict.values())
    modules_list = [{"_id": str(module["_id"]), "title": module.get("title", f"Module {module['_id']}"), "image_url": module.get("image_url", "")} for module in modules]
    print("[DEBUG] All module _id values:", [str(module["_id"]) for module in modules])
    print("[DEBUG] All score module_id values:", [str(s["module_id"]) for s in scores])
    pre_tests = []
    post_tests = []
    module_completion = set()
    study_hour = 0
    assessment_results = []
    # Calculate learning streak: consecutive days up to today in login_history
    login_history_sorted = sorted(set(login_history), reverse=True)
    streak = 0
    current = datetime.date.today()
    for day_str in login_history_sorted:
        try:
            day = datetime.date.fromisoformat(day_str)
        except Exception:
            continue
        if day == current:
            streak += 1
            current -= datetime.timedelta(days=1)
        else:
            break
    daily_progress = {}
    subject_scores = {}
    total_questions = 0
    correct_answers = 0
    flashcard_time = user.get("flashcard_time", 0)
    weekly_flashcard_hours = flashcard_time / 60  # Legacy minutes-based measure (deprecated for habits)
    weekly_flashcard_count = 0  # New: count of flashcards generated in last 7 days
    weekly_session_hours = 0  # Aggregate of Learn Together sessions for the week

    print("[DEBUG] All scores for user:", scores)
    for module in modules:
        module_id = str(module["_id"])
        module_title = module["title"]
        print(f"[DEBUG] Checking module: {module_title} (module_id={module_id})")
        # Pre-test
        pre_score = next((s for s in scores if str(s["module_id"]) == module_id and s.get("test_type") == "pretest"), None)
        post_score = next((s for s in scores if str(s["module_id"]) == module_id and s.get("test_type") == "posttest"), None)
        print(f"[DEBUG]  pre_score: {pre_score}")
        print(f"[DEBUG]  post_score: {post_score}")
        # Pre-test metrics
        if pre_score:
            time_spent = min(pre_score.get("time_spent", 0), 600)
            study_hour += time_spent / 60
            total_questions += pre_score.get("total_questions", 0)
            correct_answers += pre_score.get("correct", 0)
            # Robust date handling (supports datetime and alt fields)
            raw_date = pre_score.get("date_taken") or pre_score.get("submitted_at") or pre_score.get("created_at") or pre_score.get("createdAt")
            day = None
            try:
                import datetime as _dt
                if raw_date is None:
                    day = None
                elif isinstance(raw_date, _dt.datetime):
                    day = raw_date.date().isoformat()
                elif isinstance(raw_date, str):
                    day = raw_date.split("T")[0]
            except Exception:
                day = None
            if day:
                daily_progress.setdefault(day, {"hours": 0, "correct": 0, "questions": 0})
                daily_progress[day]["hours"] += time_spent / 60
                daily_progress[day]["correct"] += pre_score.get("correct", 0)
                daily_progress[day]["questions"] += pre_score.get("total_questions", 0)
            pre_test = pre_test_collection.find_one({"module_id": module_id})
            pre_test_title = pre_test["title"] if pre_test else f"Pre-Test for {module_title}"
            pre_tests.append({
                "module_id": module_id,
                "pre_test_title": pre_test_title,
                "correct": pre_score["correct"],
                "incorrect": pre_score["incorrect"],
                "total_questions": pre_score["total_questions"],
                "time_spent": time_spent
            })
            assessment_results.append({
                "module": module_title,
                "type": "Pre-Test",
                "score": (pre_score["correct"] / max(pre_score["total_questions"], 1)) * 100,
                "duration": time_spent,
            })
        else:
            pre_tests.append({
                "module_id": module_id,
                "pre_test_title": f"Pre-Test for {module_title}",
                "correct": 0,
                "incorrect": 0,
                "total_questions": 0,
                "time_spent": 0
            })
        # Post-test metrics
        if post_score:
            time_spent = min(post_score.get("time_spent", 0), 600)
            study_hour += time_spent / 60
            total_questions += post_score.get("total_questions", 0)
            correct_answers += post_score.get("correct", 0)
            # Robust date handling (supports datetime and alt fields)
            raw_date = post_score.get("date_taken") or post_score.get("submitted_at") or post_score.get("created_at") or post_score.get("createdAt")
            day = None
            try:
                import datetime as _dt
                if raw_date is None:
                    day = None
                elif isinstance(raw_date, _dt.datetime):
                    day = raw_date.date().isoformat()
                elif isinstance(raw_date, str):
                    day = raw_date.split("T")[0]
            except Exception:
                day = None
            if day:
                daily_progress.setdefault(day, {"hours": 0, "correct": 0, "questions": 0})
                daily_progress[day]["hours"] += time_spent / 60
                daily_progress[day]["correct"] += post_score.get("correct", 0)
                daily_progress[day]["questions"] += post_score.get("total_questions", 0)
            post_test = post_test_collection.find_one({"module_id": module_id})
            post_test_title = post_test["title"] if post_test else f"Post-Test for {module_title}"
            post_tests.append({
                "module_id": module_id,
                "post_test_title": post_test_title,
                "correct": post_score["correct"],
                "incorrect": post_score["incorrect"],
                "total_questions": post_score["total_questions"],
                "time_spent": time_spent
            })
            module_completion.add(module_id)
            assessment_results.append({
                "module": module_title,
                "type": "Post-Test",
                "score": (post_score["correct"] / max(post_score["total_questions"], 1)) * 100,
                "duration": time_spent,
            })
        else:
            post_tests.append({
                "module_id": module_id,
                "post_test_title": f"Post-Test for {module_title}",
                "correct": 0,
                "incorrect": 0,
                "total_questions": 0,
                "time_spent": 0
            })
        # Subject performance
        subject_scores.setdefault(module_title, {"score": 0, "count": 0})
        if pre_score:
            subject_scores[module_title]["score"] += pre_score.get("correct", 0)
            subject_scores[module_title]["count"] += pre_score.get("total_questions", 0)
        if post_score:
            subject_scores[module_title]["score"] += post_score.get("correct", 0)
            subject_scores[module_title]["count"] += post_score.get("total_questions", 0)

    # Add flashcard time to study hour (once, after loop) and distribute it to today's daily progress bucket
    study_hour += weekly_flashcard_hours

    # Ensure today's bucket exists and add flashcard hours there for weekly progress visibility
    today_str = datetime.date.today().isoformat()
    daily_progress.setdefault(today_str, {"hours": 0, "correct": 0, "questions": 0})
    daily_progress[today_str]["hours"] += weekly_flashcard_hours

    # ---- Flashcard Generation Count (last 7 days) ----
    try:
        from datetime import timedelta
        seven_days_ago = datetime.datetime.utcnow() - timedelta(days=6)
        weekly_flashcard_count = flashcards_collection.count_documents({
            "generated_by": id_number,
            "created_at": {"$gte": seven_days_ago}
        })
    except Exception as e:
        print(f"[WARN] Failed flashcard count aggregation: {e}")

    # ---- Collaborative Session Time Aggregation ----
    # Aggregate per-user session logs (join/leave durations) for the last 7 days and inject into daily_progress
    try:
        from datetime import timedelta
        week_start_dt = datetime.datetime.utcnow() - timedelta(days=6)
        # session_logs store left_at & joined_at as datetimes; filter by user and left_at >= week_start
        session_logs_cursor = session_logs_collection.find({
            "user_id": id_number,
            "left_at": {"$gte": week_start_dt}
        })
        for log in session_logs_cursor:
            left_at = log.get("left_at")
            joined_at = log.get("joined_at")
            duration_seconds = log.get("duration_seconds")
            # Fallback compute if missing
            if duration_seconds is None and joined_at and left_at:
                try:
                    duration_seconds = int((left_at - joined_at).total_seconds())
                except Exception:
                    duration_seconds = 0
            if not left_at or not duration_seconds:
                continue
            # Cap any single session at 2 hours to avoid inflating (safeguard)
            capped_seconds = min(duration_seconds, 7200)
            hours = capped_seconds / 3600.0
            day_str = left_at.date().isoformat()
            daily_progress.setdefault(day_str, {"hours": 0, "correct": 0, "questions": 0})
            daily_progress[day_str]["hours"] += hours
            weekly_session_hours += hours
            study_hour += hours  # Contribute to overall study hour total
    except Exception as e:
        print(f"[WARN] Failed session hour aggregation: {e}")

    # Module completion: only modules with post-test done
    completed_modules = len(module_completion)
    total_modules = len(modules)

    # Weekly progress (last 7 days)
    today_dt = datetime.date.today()
    weekly_progress = []
    for i in range(6, -1, -1):
        day = (today_dt - datetime.timedelta(days=i)).isoformat()
        data = daily_progress.get(day, {"hours": 0, "correct": 0, "questions": 0})
        avg_score = (data["correct"] / max(data["questions"], 1)) * 100 if data["questions"] > 0 else 0
        weekly_progress.append({"day": day, "hours": round(data["hours"], 2), "score": round(avg_score, 2)})

    # Subject performance pie chart
    subject_performance = []
    strengths = []
    weaknesses = []
    for module_title, stats in subject_scores.items():
        percent = (stats["score"] / max(stats["count"], 1)) * 100
        subject_performance.append({"subject": module_title, "score": round(percent, 2)})
    # Strengths/weaknesses
    passed = [sp for sp in subject_performance if sp["score"] >= 50]
    failed = [sp for sp in subject_performance if sp["score"] < 50]
    if passed:
        strengths = [max(passed, key=lambda x: x["score"])]
    if failed:
        weaknesses = [min(failed, key=lambda x: x["score"])]

    # Detailed metrics for current mode filter
    accuracy = (correct_answers / max(total_questions, 1)) * 100

    # All-time (combined) average score (never resets): based on all_scores
    total_questions_all = sum(s.get("total_questions", 0) for s in all_scores)
    correct_answers_all = sum(s.get("correct", 0) for s in all_scores)
    all_time_accuracy = (correct_answers_all / max(total_questions_all, 1)) * 100 if total_questions_all > 0 else 0

    # Assessment counts (non-archived only)
    pre_test_count = sum(1 for s in scores if s.get("test_type") == "pretest")
    post_test_count = sum(1 for s in scores if s.get("test_type") == "posttest")

    # Generate recommended pages based on user's study habits
    recommended_pages = []
    if user.get("top3Habits"):
        habit_to_page = {
            "Study with Friends": "learn-together",
            "Asking for Help": "messages",
            "Test Yourself Periodically": "modules",
            "Creating a Study Schedule": "scheduler",
            "Setting Study Goals": "notes",
            "Organizing Notes": "notes",
            "Teach What You've Learned": "learn-together",
            "Use of Flashcards": "flashcards",
            "Using Aromatherapy, Plants, or Music": "music"
        }
        for habit in user.get("top3Habits", []):
            page = habit_to_page.get(habit)
            if page and page not in recommended_pages:
                recommended_pages.append(page)
        default_pages = ["modules", "scheduler", "flashcards", "learn-together", "notes", "music"]
        for page in default_pages:
            if len(recommended_pages) >= 3:
                break
            if page not in recommended_pages:
                recommended_pages.append(page)
    else:
        recommended_pages = ["notes", "scheduler", "flashcards"]

    # ---- Study Habit Classification ----
    habit_categories = []
    # Active Recall now based on generating at least 10 flashcards in last 7 days
    if weekly_flashcard_count >= 10:
        habit_categories.append("Active Recall")
    if weekly_session_hours >= 0.5:  # >= 30 minutes collaborative sessions
        habit_categories.append("Collaborative Study")
    if streak >= 3:
        habit_categories.append("Consistent Streak")
    if "Active Recall" in habit_categories and "Collaborative Study" in habit_categories:
        habit_categories.append("Balanced Learning")

    habit_suggestions = []
    if "Active Recall" not in habit_categories:
        habit_suggestions.append("Generate at least 10 new flashcards this week to strengthen recall.")
    if "Collaborative Study" not in habit_categories:
        habit_suggestions.append("Join a Learn Together session to boost engagement and retention.")
    if streak < 3:
        habit_suggestions.append("Log in and study daily to build a longer learning streak.")
    if not habit_suggestions:
        habit_suggestions.append("Great balance! Maintain your current study habits.")

    response = {
        "modules": modules_list,
        "completedModules": completed_modules,
        "totalModules": total_modules,
        "studyHours": round(study_hour, 2),
    "weeklyFlashcardHours": round(weekly_flashcard_hours, 2),  # retained for backward compatibility
    "weeklyFlashcardCount": weekly_flashcard_count,
        "weeklySessionHours": round(weekly_session_hours, 2),
        "learningStreak": streak,
        "weeklyProgress": weekly_progress,
        "subjectPerformance": subject_performance,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "totalQuestions": total_questions,
        "correctAnswers": correct_answers,
        "accuracy": round(accuracy, 2),
        # All assessments (all cycles) average score that never resets
        "averageScore": round(all_time_accuracy, 2),
        "detailedMetrics": {
            "totalQuestions": total_questions,
            "correctAnswers": correct_answers,
            "accuracy": round(accuracy, 2)
        },
        "assessmentBreakdown": assessment_results,
        "preTestCount": pre_test_count,
        "postTestCount": post_test_count,
        "recommendedPages": recommended_pages,
        "preTests": pre_tests,
        "postTests": post_tests,
        "loginHistory": login_history
        ,
        "studyHabits": {
            "categories": habit_categories,
            "weeklyFlashcardHours": round(weekly_flashcard_hours, 2),
            "weeklySessionHours": round(weekly_session_hours, 2),
            "suggestions": habit_suggestions
        }
    }
    response["mode"] = mode_norm
    # If combined, also include separated current vs previous summary for comparison
    if mode_norm == "combined":
        current_scores = list(scores_collection.find({"user_id": id_number, "archived": {"$ne": True}}))
        previous_scores = list(scores_collection.find({"user_id": id_number, "archived": True}))
        def _aggregate(score_list):
            tq = sum(s.get("total_questions", 0) for s in score_list)
            ca = sum(s.get("correct", 0) for s in score_list)
            acc = (ca / max(tq, 1)) * 100 if tq > 0 else 0
            return {"totalQuestions": tq, "correctAnswers": ca, "accuracy": round(acc, 2)}
        response["cycleComparison"] = {
            "current": _aggregate(current_scores),
            "previous": _aggregate(previous_scores)
        }
    return response

@router.get("/api/instructor/dashboard/{instructor_id}")
async def get_instructor_dashboard(instructor_id: str, program: Optional[str] = Query(None)):
    try:
        instructor = users_collection.find_one({"id_number": instructor_id, "role": {"$regex": "^instructor$", "$options": "i"}})
        if not instructor:
            raise HTTPException(status_code=404, detail="Instructor not found")
        # Get all students for the instructor's program
        students_query = {"role": {"$regex": "^student$", "$options": "i"}}
        if program:
            students_query["program"] = program
        students = list(users_collection.find(students_query))
        total_students = len(students)

        # Get all modules posted by this instructor
        modules_query = {"id_number": instructor_id}
        if program:
            modules_query["program"] = program
        modules = list(modules_collection.find(modules_query))
        modules_list = [
            {
                "_id": str(module["_id"]),
                "title": module["title"],
                "image_url": module.get("image_url", ""),
                "program": module.get("program", ""),
            } for module in modules
        ]
        module_ids = [str(m["_id"]) for m in modules]

        # Calculate engagement rate: completed current post-tests / (total students * total modules)
        # A completion is counted once per (student, module) pair where a non-archived posttest exists
        completed_pairs = set()
        for student in students:
            cursor = scores_collection.find({
                "user_id": student["id_number"],
                "test_type": "posttest",
                "archived": {"$ne": True},
                "module_id": {"$in": module_ids}
            })
            for score in cursor:
                completed_pairs.add((student["id_number"], str(score.get("module_id"))))
        total_possible = (len(students) * len(module_ids)) if module_ids else 0
        engagement_rate = (len(completed_pairs) / total_possible * 100) if total_possible > 0 else 0

        # Attendance & study hours per student (last 7 days) using sessions + test durations
        import datetime as _dt
        from datetime import timedelta
        week_start_dt = _dt.datetime.utcnow() - timedelta(days=6)
        attendance_data = []
        hours_hist_buckets = {"<0.5h": 0, "0.5-2h": 0, "2-5h": 0, ">5h": 0}
        top_module_counts = {mid: 0 for mid in module_ids}
        class_acc_sum = 0.0
        class_acc_count = 0

        for student in students:
            sid = student.get("id_number")
            # Study hours from session logs
            study_hours_7d = 0.0
            daily_hours = {}
            # Session logs
            try:
                sessions = session_logs_collection.find({
                    "user_id": sid,
                    "left_at": {"$gte": week_start_dt}
                })
                for log in sessions:
                    left_at = log.get("left_at")
                    joined_at = log.get("joined_at")
                    dur = log.get("duration_seconds")
                    if dur is None and joined_at and left_at:
                        try:
                            dur = int((left_at - joined_at).total_seconds())
                        except Exception:
                            dur = 0
                    if not left_at or not dur:
                        continue
                    dur = min(dur, 2*60*60)
                    day = left_at.date().isoformat()
                    daily_hours[day] = daily_hours.get(day, 0) + (dur/3600.0)
            except Exception:
                pass

            # Test durations
            try:
                recent_scores = scores_collection.find({
                    "user_id": sid,
                    "$or": [
                        {"created_at": {"$gte": week_start_dt}},
                        {"createdAt": {"$gte": week_start_dt}},
                        {"submitted_at": {"$gte": week_start_dt}},
                        {"date_taken": {"$gte": week_start_dt}},
                    ]
                })
                for sc in recent_scores:
                    raw_date = sc.get("date_taken") or sc.get("submitted_at") or sc.get("created_at") or sc.get("createdAt")
                    day = None
                    try:
                        import datetime as _dt2
                        if raw_date is None:
                            day = None
                        elif isinstance(raw_date, _dt2.datetime):
                            day = raw_date.date().isoformat()
                        elif isinstance(raw_date, str):
                            day = raw_date.split("T")[0]
                    except Exception:
                        day = None
                    tsec = min(sc.get("time_spent", 0), 600)
                    if day and tsec:
                        daily_hours[day] = daily_hours.get(day, 0) + (tsec/3600.0)
            except Exception:
                pass

            # Tally
            study_hours_7d = round(sum(daily_hours.values()), 2)
            attendance_days = sum(1 for h in daily_hours.values() if h >= 0.5)

            # Current accuracy for class average (non-archived)
            try:
                cur_scores = list(scores_collection.find({"user_id": sid, "archived": {"$ne": True}}))
                tq = sum(s.get("total_questions", 0) for s in cur_scores)
                ca = sum(s.get("correct", 0) for s in cur_scores)
                acc = (ca / max(tq,1))*100 if tq>0 else 0
                class_acc_sum += acc
                class_acc_count += 1
            except Exception:
                pass

            # Top modules by completion (current post-test)
            try:
                cur_posts = scores_collection.find({
                    "user_id": sid,
                    "test_type": "posttest",
                    "archived": {"$ne": True},
                    "module_id": {"$in": module_ids}
                })
                for sc in cur_posts:
                    mid = str(sc.get("module_id"))
                    if mid in top_module_counts:
                        top_module_counts[mid] += 1
            except Exception:
                pass

            # Hours histogram bucket
            if study_hours_7d < 0.5:
                hours_hist_buckets["<0.5h"] += 1
            elif study_hours_7d < 2:
                hours_hist_buckets["0.5-2h"] += 1
            elif study_hours_7d < 5:
                hours_hist_buckets["2-5h"] += 1
            else:
                hours_hist_buckets[">5h"] += 1

            attendance_data.append({
                "studentName": f"{student.get('firstname','')} {student.get('lastname','')}".strip(),
                "attendanceDays": int(attendance_days),
                "studyHours7d": study_hours_7d,
            })

        # Build module completions list
        module_completions = []
        mid_to_title = {str(m["_id"]): m.get("title", "") for m in modules}
        for mid, count in top_module_counts.items():
            module_completions.append({"moduleId": mid, "title": mid_to_title.get(mid, f"Module {mid}"), "completions": count})
        # Sort desc and take top 10
        module_completions.sort(key=lambda x: x["completions"], reverse=True)
        module_completions = module_completions[:10]

        class_avg_acc = round((class_acc_sum / class_acc_count), 2) if class_acc_count else 0
        avg_hours_7d = round(sum(a["studyHours7d"] for a in attendance_data) / len(attendance_data), 2) if attendance_data else 0

        return {
            "stats": {
                "totalStudents": total_students,
                "engagementRate": round(engagement_rate, 2),
                "classAverageAccuracy": class_avg_acc,
                "avgStudyHours7d": avg_hours_7d,
            },
            "modules": modules_list,
            "attendance": attendance_data,
            "hoursHistogram": [{"bucket": k, "count": v} for k,v in hours_hist_buckets.items()],
            "moduleCompletions": module_completions,
        }
    except Exception as e:
        logger.error(f"Error fetching instructor dashboard data: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard data")

@router.get("/api/engagement-rate")
async def get_engagement_rate(instructor_id: str = Query(None), program: str = Query(None)):
    try:
        query = {}
        if instructor_id:
            query["id_number"] = instructor_id
        if program:
            query["program"] = program
        modules = list(modules_collection.find(query))
        total_modules = len(modules)
        students_query = {"role": {"$regex": "^student$", "$options": "i"}}
        if program:
            students_query["program"] = program
        students = list(users_collection.find(students_query))
        total_students = len(students)
        completed_post_tests = 0
        for student in students:
            post_test_results = scores_collection.find({
                "user_id": student["id_number"],
                "test_type": "posttest",
                "module_id": {"$in": [str(module["_id"]) for module in modules]}
            })
            completed_post_tests += len(list(post_test_results))
        total_possible_completions = total_students * total_modules
        engagement_rate = (completed_post_tests / total_possible_completions * 100) if total_possible_completions > 0 else 0
        return {
            "engagementRate": round(engagement_rate, 1),
            "totalStudents": total_students,
            "totalModules": total_modules,
            "completedPostTests": completed_post_tests
        }
    except Exception as e:
        logger.error(f"Error calculating engagement rate: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate engagement rate")

@router.get("/api/progress/{user_id}")
async def get_progress(user_id: str):
    try:
        user = users_collection.find_one({"id_number": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        program = user["program"]
        modules = list(modules_collection.find({"program": program}))
        total_modules = len(modules)
        post_test_results = list(scores_collection.find({"user_id": user_id, "test_type": "posttest"}))
        completed_post_tests = len(post_test_results)
        progress = (completed_post_tests / total_modules * 100) if total_modules > 0 else 0
        return {
            "progress": round(progress, 0),
            "totalModules": total_modules,
            "completedPostTests": completed_post_tests
        }
    except Exception as e:
        logger.error(f"Error calculating progress for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate progress")