from fastapi import APIRouter, HTTPException, Query, Request
from database import users_collection, modules_collection, scores_collection, pre_test_collection, post_test_collection
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
def dashboard(id_number: str):
    user = users_collection.find_one({"id_number": str(id_number)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    program = user.get("program", "All Programs")
    query = {}
    if program and program != "All Programs":
        query["program"] = program
    modules = list(modules_collection.find(query))
    modules_list = [{"_id": str(module["_id"]), "title": module["title"], "image_url": module.get("image_url", "")} for module in modules]
    scores = list(scores_collection.find({"user_id": id_number}))
    pre_tests = []
    post_tests = []
    module_completion = set()
    study_hour = 0
    assessment_results = []
    streak_days = set()
    daily_progress = {}
    subject_scores = {}
    total_questions = 0
    correct_answers = 0
    flashcard_time = user.get("flashcard_time", 0)

    for module in modules:
        module_id = str(module["_id"])
        module_title = module["title"]
        # Pre-test
        pre_score = next((s for s in scores if s["module_id"] == module_id and s.get("test_type") == "pretest"), None)
        post_score = next((s for s in scores if s["module_id"] == module_id and s.get("test_type") == "posttest"), None)
        # Pre-test metrics
        if pre_score:
            time_spent = min(pre_score.get("time_spent", 0), 600)
            study_hour += time_spent / 60
            total_questions += pre_score.get("total_questions", 0)
            correct_answers += pre_score.get("correct", 0)
            date_taken = pre_score.get("date_taken")
            if date_taken:
                day = date_taken.split("T")[0]
                daily_progress.setdefault(day, {"hours": 0, "score": 0, "count": 0})
                daily_progress[day]["hours"] += time_spent / 60
                daily_progress[day]["score"] += (pre_score.get("correct", 0) / max(pre_score.get("total_questions", 1), 1)) * 100
                daily_progress[day]["count"] += 1
                if daily_progress[day]["hours"] >= 1:
                    streak_days.add(day)
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
            date_taken = post_score.get("date_taken")
            if date_taken:
                day = date_taken.split("T")[0]
                daily_progress.setdefault(day, {"hours": 0, "score": 0, "count": 0})
                daily_progress[day]["hours"] += time_spent / 60
                daily_progress[day]["score"] += (post_score.get("correct", 0) / max(post_score.get("total_questions", 1), 1)) * 100
                daily_progress[day]["count"] += 1
                if daily_progress[day]["hours"] >= 1:
                    streak_days.add(day)
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

        # Add flashcard time to study hour
        study_hour += flashcard_time / 60

        # Module completion: only modules with post-test done
        completed_modules = len(module_completion)
        total_modules = len(modules)

        # Weekly progress (last 7 days)
        import datetime
        today = datetime.date.today()
        weekly_progress = []
        for i in range(6, -1, -1):
            day = (today - datetime.timedelta(days=i)).isoformat()
            data = daily_progress.get(day, {"hours": 0, "score": 0, "count": 0})
            avg_score = (data["score"] / data["count"]) if data["count"] > 0 else 0
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

        # Detailed metrics
        accuracy = (correct_answers / max(total_questions, 1)) * 100

        # Assessment breakdown
        pre_test_count = len(pre_tests)
        post_test_count = len(post_tests)

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

        return {
            "modules": modules_list,
            "completedModules": completed_modules,
            "totalModules": total_modules,
            "studyHours": round(study_hour, 2),
            "learningStreak": len(streak_days),
            "weeklyProgress": weekly_progress,
            "subjectPerformance": subject_performance,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "detailedMetrics": {
                "totalQuestions": total_questions,
                "correctAnswers": correct_answers,
                "accuracy": round(accuracy, 2)
            },
            "assessmentBreakdown": assessment_results,
            "preTestCount": pre_test_count,
            "postTestCount": post_test_count,
            "recommendedPages": recommended_pages
        }
    
    # Generate recommended pages based on user's study habits
    recommended_pages = []
    if user.get("top3Habits"):
        # Map survey habits to page recommendations
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
        
        # First, add pages based on user's top habits
        for habit in user.get("top3Habits", []):
            page = habit_to_page.get(habit)
            if page and page not in recommended_pages:
                recommended_pages.append(page)
        
        # If we don't have 3 recommendations, fill with defaults
        default_pages = ["modules", "scheduler", "flashcards", "learn-together", "notes", "music"]
        for page in default_pages:
            if len(recommended_pages) >= 3:
                break
            if page not in recommended_pages:
                recommended_pages.append(page)
    else:
        # Default recommendations if no survey completed
        recommended_pages = ["notes", "scheduler", "flashcards"]
    
    return {
        "modules": modules_list,
        "preTests": pre_tests,
        "postTests": post_tests,
        "recommendedPages": recommended_pages
    }

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

        # Calculate engagement rate: (total submissions / total questions) for posttests
        total_submissions = 0
        total_questions = 0
        for student in students:
            scores = scores_collection.find({"user_id": student["id_number"], "test_type": "posttest"})
            for score in scores:
                total_submissions += score.get("correct", 0) + score.get("incorrect", 0)
                total_questions += score.get("total_questions", 0)
        engagement_rate = (total_submissions / total_questions * 100) if total_questions > 0 else 0

        # Attendance: streak days for each student
        attendance_data = []
        for student in students:
            scores = list(scores_collection.find({"user_id": student["id_number"]}))
            streak_days = set()
            for score in scores:
                date_taken = score.get("date_taken")
                time_spent = min(score.get("time_spent", 0), 600)
                if date_taken:
                    day = date_taken.split("T")[0]
                    if time_spent >= 60:
                        streak_days.add(day)
            attendance_count = len(streak_days)
            attendance_data.append({
                "studentName": f"{student.get('firstname', '')} {student.get('lastname', '')}".strip(),
                "attendanceDays": attendance_count,
                "attendanceHours": attendance_count,  # 1 streak = 1hr
            })
        return {
            "stats": {
                "totalStudents": total_students,
                "engagementRate": round(engagement_rate, 2),
            },
            "modules": modules_list,
            "attendance": attendance_data,
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