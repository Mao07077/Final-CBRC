
# Student: Get study activity report

from fastapi import APIRouter, Body, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any
from bson import ObjectId
from database import get_user_collection, get_reports_collection, posts_collection


# Account Update Requests Models
class AccountUpdateRequest(BaseModel):
    _id: str
    id_number: str
    update_data: dict

router = APIRouter()



# Unified account update requests endpoint (supports legacy and new collections)
@router.get("/api/admin/account-requests")
async def get_account_update_requests():
    """Get all account update requests for admin (legacy + new schema)."""
    try:
        from database import request_collection, get_user_collection, db as mongo_db
        user_collection = get_user_collection()
        legacy_requests = list(mongo_db["account_update_requests"].find({}))
        new_requests = list(request_collection.find({}))
        combined = []
        for raw in legacy_requests + new_requests:
            changes = raw.get("update_data") or raw.get("requested_changes") or {}
            id_number = raw.get("id_number", "")
            user = user_collection.find_one({"id_number": id_number}) or {}
            current_data = {field: user.get(field, "") for field in changes.keys()}
            firstname = user.get("firstname", raw.get("firstname", ""))
            lastname = user.get("lastname", raw.get("lastname", ""))
            program = user.get("program", raw.get("program", ""))
            created_at = raw.get("created_at") or raw.get("createdAt")
            combined.append({
                "_id": str(raw.get("_id")),
                "id_number": id_number,
                "firstname": firstname,
                "lastname": lastname,
                "program": program,
                "email": user.get("email", raw.get("email", "")),
                "contact_number": user.get("contact_number", raw.get("contact_number", "")),
                "role": user.get("role", raw.get("role", "")),
                "request_type": raw.get("request_type", "account_update"),
                "current_data": current_data,
                "update_data": changes,
                "requested_changes": raw.get("requested_changes", {}),
                "createdAt": created_at,
            })
        return {"success": True, "requests": combined}
    except Exception as e:
        return {"success": False, "error": str(e), "requests": []}

# Student: Submit account update request
@router.post("/api/admin/account-requests")
async def submit_account_update_request(id_number: str = Body(...), update_data: dict = Body(...)):
    from database import account_update_requests_collection
    # Check for existing request for this user
    existing = account_update_requests_collection.find_one({"id_number": id_number})
    if existing:
        raise HTTPException(status_code=400, detail="Request already exists for this user.")
    req = {
        "id_number": id_number,
        "update_data": update_data
    }
    result = account_update_requests_collection.insert_one(req)
    req["_id"] = str(result.inserted_id)
    return {"success": True, "request": req}

# Accept account update request (supports legacy and new collections, string/ObjectId _id)
@router.post("/api/admin/account-requests/{request_id}/accept")
async def accept_account_update_request(request_id: str):
    print(f"[ACCEPT] Incoming request_id: {request_id}")
    from database import account_update_requests_collection, request_collection, get_user_collection

    def find_in_collection(coll):
        # Try ObjectId first
        if ObjectId.is_valid(request_id):
            obj_id = ObjectId(request_id)
            doc = coll.find_one({"_id": obj_id})
            if doc:
                return doc, obj_id
        # Then try plain string id (some legacy docs may have string _id)
        doc = coll.find_one({"_id": request_id})
        if doc:
            return doc, request_id
        return None, None

    # Try legacy collection
    req, delete_id = find_in_collection(account_update_requests_collection)
    source = "account_update_requests"
    if not req:
        # Try new requests collection
        req, delete_id = find_in_collection(request_collection)
        source = "requests"

    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    user_collection = get_user_collection()
    id_number = req.get("id_number")
    if not id_number:
        raise HTTPException(status_code=400, detail="Request missing id_number")

    # Determine changes field name
    changes = req.get("update_data") or req.get("requested_changes") or {}
    if not isinstance(changes, dict) or not changes:
        raise HTTPException(status_code=400, detail="No changes to apply")

    # Apply updates
    user_collection.update_one({"id_number": id_number}, {"$set": changes})
    # Mark account update status for student notification
    from datetime import datetime
    user_collection.update_one(
        {"id_number": id_number},
        {"$set": {"accountUpdateStatus": "accepted", "accountUpdateAt": datetime.utcnow(), "accountUpdateUnread": True}}
    )

    # Delete the processed request
    coll = account_update_requests_collection if source == "account_update_requests" else request_collection
    result = coll.delete_one({"_id": delete_id})
    if result.deleted_count == 0:
        # Fallback: attempt delete by alternate id type
        alt_id = request_id if isinstance(delete_id, ObjectId) else (ObjectId(request_id) if ObjectId.is_valid(request_id) else None)
        if alt_id is not None:
            coll.delete_one({"_id": alt_id})

    return {"success": True, "source": source}

# Decline account update request (supports legacy and new collections, string/ObjectId _id)
@router.post("/api/admin/account-requests/{request_id}/decline")
async def decline_account_update_request(request_id: str):
    print(f"[DECLINE] Incoming request_id: {request_id}")
    from database import account_update_requests_collection, request_collection, get_user_collection

    def find_doc(coll):
        if ObjectId.is_valid(request_id):
            obj_id = ObjectId(request_id)
            doc = coll.find_one({"_id": obj_id})
            if doc:
                return doc, obj_id
        doc = coll.find_one({"_id": request_id})
        if doc:
            return doc, request_id
        return None, None

    # Fetch request before deletion to get id_number
    doc, del_id = find_doc(account_update_requests_collection)
    source = "account_update_requests"
    if not doc:
        doc, del_id = find_doc(request_collection)
        source = "requests"
    if not doc:
        raise HTTPException(status_code=404, detail="Request not found")

    # Delete the request
    coll = account_update_requests_collection if source == "account_update_requests" else request_collection
    coll.delete_one({"_id": del_id})

    # Flag user's account update status as declined
    try:
        id_number = doc.get("id_number")
        if id_number:
            user_collection = get_user_collection()
            from datetime import datetime
            user_collection.update_one(
                {"id_number": id_number},
                {"$set": {"accountUpdateStatus": "declined", "accountUpdateAt": datetime.utcnow(), "accountUpdateUnread": True}}
            )
    except Exception:
        pass
    return {"success": True, "source": source}
from fastapi import APIRouter, Body, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any
from bson import ObjectId
from database import get_user_collection, get_reports_collection, posts_collection

class StatusUpdate(BaseModel):
    status: str

# Admin: Get all posts (exclude archived)
@router.get("/api/admin/posts")
async def get_admin_posts():
    posts = list(posts_collection.find({"archived": {"$ne": True}}))
    for post in posts:
        post["_id"] = str(post["_id"])
    return posts

# Admin: Create a new post
@router.post("/api/admin/posts")
async def create_admin_post(title: str = Body(...), content: str = Body(...), image: str = Body(None)):
    post_data = {
        "title": title,
        "content": content,
        "createdAt": None,
        "image": image,
    }
    from datetime import datetime
    post_data["createdAt"] = datetime.utcnow()
    result = posts_collection.insert_one(post_data)
    post_data["_id"] = str(result.inserted_id)
    return post_data

# Admin: Update a post
@router.put("/api/admin/posts/{post_id}")
async def update_admin_post(post_id: str, title: str = Body(None), content: str = Body(None), image: str = Body(None)):
    update_data = {}
    if title is not None:
        update_data["title"] = title
    if content is not None:
        update_data["content"] = content
    if image is not None:
        update_data["image"] = image
    result = posts_collection.update_one({"_id": ObjectId(post_id)}, {"$set": update_data})
    if result.modified_count > 0:
        return {"success": True}
    else:
        return {"success": False, "error": "Post not found"}

# Admin: Archive a post
@router.put("/api/admin/posts/{post_id}/archive")
async def archive_admin_post(post_id: str):
    try:
        res = posts_collection.update_one({"_id": ObjectId(post_id)}, {"$set": {"archived": True}})
        return {"success": res.matched_count > 0}
    except Exception as e:
        return {"success": False, "error": str(e)}

# Admin: Unarchive a post
@router.put("/api/admin/posts/{post_id}/unarchive")
async def unarchive_admin_post(post_id: str):
    try:
        res = posts_collection.update_one({"_id": ObjectId(post_id)}, {"$set": {"archived": False}})
        return {"success": res.matched_count > 0}
    except Exception as e:
        return {"success": False, "error": str(e)}

# Admin: List archived posts
@router.get("/api/admin/posts/archived")
async def get_archived_posts():
    try:
        posts = list(posts_collection.find({"archived": True}))
        for post in posts:
            post["_id"] = str(post["_id"])
        return {"success": True, "posts": posts}
    except Exception as e:
        return {"success": False, "error": str(e), "posts": []}


# (Removed duplicate router redefinition to ensure all routes are registered on a single router)

@router.get("/api/admin/dashboard")
async def get_admin_dashboard():
    user_collection = get_user_collection()
    reports_collection = get_reports_collection()
    import datetime
    today = datetime.datetime.now()
    start_of_week = today - datetime.timedelta(days=today.weekday())
    end_of_week = start_of_week + datetime.timedelta(days=6)
    total_users = user_collection.count_documents({})
    total_students = user_collection.count_documents({"role": {"$regex": "^student$", "$options": "i"}})
    total_instructors = user_collection.count_documents({"role": {"$regex": "^instructor$", "$options": "i"}})
    total_admins = user_collection.count_documents({"role": {"$regex": "^admin$", "$options": "i"}})
    reports_this_week = reports_collection.count_documents({
        "createdAt": {
            "$gte": start_of_week,
            "$lte": end_of_week
        }
    })
    return {
        "success": True,
        "stats": {
            "totalUsers": total_users,
            "totalStudents": total_students,
            "totalInstructors": total_instructors,
            "totalAdmins": total_admins,
            "reportsThisWeek": reports_this_week
        }
    }

@router.get("/api/admin/accounts")
async def get_accounts():
    """Get all user accounts for admin"""
    try:
        user_collection = get_user_collection()
        # Exclude archived accounts from main list; use /api/admin/accounts/archived for archived
        accounts = list(user_collection.find({"archived": {"$ne": True}}))
        
        # Format account data
        formatted_accounts = []
        for account in accounts:
            # Derive createdAt from explicit field or ObjectId timestamp
            created_at = account.get("createdAt")
            try:
                if not created_at and account.get("_id"):
                    created_at = account["_id"].generation_time
            except Exception:
                created_at = None
            flow = account.get("examFlow", {})
            formatted_accounts.append({
                "_id": str(account["_id"]),
                "firstname": account.get("firstname", ""),
                "lastname": account.get("lastname", ""),
                "id_number": account.get("id_number", ""),
                "role": account.get("role", ""),
                "email": account.get("email", ""),
                "contact_number": account.get("contact_number", ""),
                "is_verified": account.get("is_verified", False),
                "createdAt": created_at,
                "examFlow": {
                    "status": flow.get("status"),
                    "promptScheduleAt": flow.get("promptScheduleAt"),
                    "examDate": flow.get("examDate"),
                    "declineReason": flow.get("declineReason"),
                    "feedback": flow.get("feedback"),
                    "result": flow.get("result"),
                    "resultAt": flow.get("resultAt"),
                    "lastPromptAt": flow.get("lastPromptAt"),
                }
            })
        
        return {"success": True, "accounts": formatted_accounts}
    except Exception as e:
        return {"success": False, "error": str(e), "accounts": []}

@router.put("/api/admin/accounts/{id_number}/exam-prompt")
async def set_exam_prompt_schedule(id_number: str, payload: Dict[str, Any] = Body(...)):
    """Admin schedules the initial exam intent prompt for a student."""
    try:
        user_collection = get_user_collection()
        # Accept either promptDate (YYYY-MM-DD) or promptScheduleAt (ISO datetime)
        prompt_date = payload.get("promptDate")
        when = payload.get("promptScheduleAt")
        from datetime import datetime, timezone
        when_dt = None
        if prompt_date:
            try:
                # Parse date-only and set to start of day UTC
                y, m, d = [int(x) for x in str(prompt_date).split("-")]
                when_dt = datetime(y, m, d, 0, 0, 0, tzinfo=timezone.utc)
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid promptDate format (expected YYYY-MM-DD)")
        elif when:
            # Accept both ISO string and datetime
            if isinstance(when, str):
                try:
                    # fromisoformat handles offsets; add Z handling
                    when_dt = datetime.fromisoformat(when.replace("Z", "+00:00"))
                    if when_dt.tzinfo is None:
                        when_dt = when_dt.replace(tzinfo=timezone.utc)
                except Exception:
                    raise HTTPException(status_code=400, detail="Invalid promptScheduleAt format")
            elif isinstance(when, datetime):
                when_dt = when if when.tzinfo else when.replace(tzinfo=timezone.utc)
        if when_dt is None:
            raise HTTPException(status_code=400, detail="promptDate (YYYY-MM-DD) or promptScheduleAt is required")

        update = {
            "$set": {
                "examFlow.promptScheduleAt": when_dt,
                "examFlow.status": "scheduled",
            },
            "$unset": {
                "examFlow.declineReason": "",
                "examFlow.examDate": "",
                "examFlow.feedback": "",
                "examFlow.result": "",
                "examFlow.resultAt": "",
            }
        }
        res = user_collection.update_one({"id_number": id_number}, update)
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/api/admin/reports")
async def get_reports():
    """Get all reports for admin"""
    try:
        reports_collection = get_reports_collection()
        user_collection = get_user_collection()
        reports = list(reports_collection.find({"archived": {"$ne": True}}))
        formatted_reports = []
        for report in reports:
            # Map MongoDB fields to frontend fields
            formatted_reports.append({
                "_id": str(report["_id"]),
                "student": report.get("id_number", ""),
                "studentId": report.get("id_number", ""),
                "issue": report.get("title", ""),
                "status": report.get("status", "Pending"),
                "createdAt": report.get("created_at", None),
                "messages": [report.get("content", "")] if report.get("content") else [],
                "screenshot": report.get("screenshot_url", None),
                "feedback": report.get("feedback"),
                "feedbackAt": report.get("feedback_at"),
                "feedbackRead": report.get("feedback_read", False),
            })
        return {"success": True, "reports": formatted_reports}
    except Exception as e:
        return {"success": False, "error": str(e), "reports": []}

@router.get("/api/admin/reports/archived")
async def get_archived_reports():
    """Get archived reports for admin"""
    try:
        reports_collection = get_reports_collection()
        reports = list(reports_collection.find({"archived": True}))
        formatted_reports = []
        for report in reports:
            formatted_reports.append({
                "_id": str(report["_id"]),
                "student": report.get("id_number", ""),
                "studentId": report.get("id_number", ""),
                "issue": report.get("title", ""),
                "status": report.get("status", "Pending"),
                "createdAt": report.get("created_at", None),
                "messages": [report.get("content", "")] if report.get("content") else [],
                "screenshot": report.get("screenshot_url", None),
                "feedback": report.get("feedback"),
                "feedbackAt": report.get("feedback_at"),
                "feedbackRead": report.get("feedback_read", False),
                "archived": True,
            })
        return {"success": True, "reports": formatted_reports}
    except Exception as e:
        return {"success": False, "error": str(e), "reports": []}

@router.put("/api/admin/reports/{report_id}")
async def update_report_status(report_id: str, status_data: StatusUpdate):
    """Update report status"""
    try:
        reports_collection = get_reports_collection()
        result = reports_collection.update_one(
            {"_id": ObjectId(report_id)},
            {"$set": {"status": status_data.status}}
        )
        
        if result.modified_count > 0:
            return {"success": True}
        else:
            return {"success": False, "error": "Report not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}
@router.get("/api/admin/attendance-summary")
async def get_attendance_summary():
    """Get overall attendance summary for all students"""
    try:
        user_collection = get_user_collection()
        # Example: Count students with attendance records
        students = list(user_collection.find({"role": {"$regex": "student", "$options": "i"}}))
        total_students = len(students)
        attended = sum(1 for s in students if s.get("attendance", 0) > 0)
        avg_attendance = (
            sum(s.get("attendance", 0) for s in students) / total_students if total_students > 0 else 0
        )
        return {
            "success": True,
            "summary": {
                "totalStudents": total_students,
                "attended": attended,
                "averageAttendance": avg_attendance,
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
@router.get("/api/admin/performance-summary")
async def get_performance_summary():
    """Get overall performance summary for all students"""
    try:
        user_collection = get_user_collection()
        from database import modules_collection, scores_collection, pre_test_collection, post_test_collection
        students = list(user_collection.find({"role": {"$regex": "student", "$options": "i"}}))
        total_students = len(students)
        all_performance = []
        all_scores = []
        for s in students:
            id_number = s.get("id_number", "")
            name = f"{s.get('firstname', '')} {s.get('lastname', '')}".strip()
            program = s.get("program", "All Programs")
            query = {}
            if program and program != "All Programs":
                query["program"] = program
            modules = list(modules_collection.find(query))
            scores = list(scores_collection.find({"user_id": id_number}))
            pre_tests = []
            post_tests = []
            for module in modules:
                module_id = str(module["_id"])
                module_title = module["title"]
                pre_score = next((sc for sc in scores if sc["module_id"] == module_id and sc.get("test_type") == "pretest"), None)
                post_score = next((sc for sc in scores if sc["module_id"] == module_id and sc.get("test_type") == "posttest"), None)
                # Pre-test
                if pre_score:
                    pre_test = pre_test_collection.find_one({"module_id": module_id})
                    pre_test_title = pre_test["title"] if pre_test else f"Pre-Test for {module_title}"
                    pre_tests.append({
                        "module_id": module_id,
                        "pre_test_title": pre_test_title,
                        "correct": pre_score["correct"],
                        "incorrect": pre_score["incorrect"],
                        "total_questions": pre_score["total_questions"],
                        "score": (pre_score["correct"] / max(pre_score["total_questions"], 1)) * 100,
                        "time_spent": pre_score.get("time_spent", 0)
                    })
                    all_scores.append((pre_score["correct"] / max(pre_score["total_questions"], 1)) * 100)
                # Post-test
                if post_score:
                    post_test = post_test_collection.find_one({"module_id": module_id})
                    post_test_title = post_test["title"] if post_test else f"Post-Test for {module_title}"
                    post_tests.append({
                        "module_id": module_id,
                        "post_test_title": post_test_title,
                        "correct": post_score["correct"],
                        "incorrect": post_score["incorrect"],
                        "total_questions": post_score["total_questions"],
                        "score": (post_score["correct"] / max(post_score["total_questions"], 1)) * 100,
                        "time_spent": post_score.get("time_spent", 0)
                    })
                    all_scores.append((post_score["correct"] / max(post_score["total_questions"], 1)) * 100)
            all_performance.append({
                "id_number": id_number,
                "name": name,
                "program": program,
                "pre_tests": pre_tests,
                "post_tests": post_tests,
            })
        avg_score = sum(all_scores) / len(all_scores) if all_scores else 0
        max_score = max(all_scores) if all_scores else 0
        min_score = min(all_scores) if all_scores else 0
        return {
            "success": True,
            "summary": {
                "averageScore": avg_score,
                "maxScore": max_score,
                "minScore": min_score,
                "totalStudents": total_students,
                "students": all_performance
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.put("/api/admin/reports/{report_id}/archive")
async def admin_archive_report(report_id: str):
    try:
        reports_collection = get_reports_collection()
        res = reports_collection.update_one({"_id": ObjectId(report_id)}, {"$set": {"archived": True}})
        return {"success": res.matched_count > 0}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.put("/api/admin/reports/{report_id}/unarchive")
async def admin_unarchive_report(report_id: str):
    try:
        reports_collection = get_reports_collection()
        res = reports_collection.update_one({"_id": ObjectId(report_id)}, {"$set": {"archived": False}})
        return {"success": res.matched_count > 0}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.put("/api/admin/reports/{report_id}/feedback")
async def admin_set_feedback(report_id: str, payload: Dict[str, Any] = Body(...)):
    try:
        feedback = payload.get("feedback")
        if feedback is None:
            raise HTTPException(status_code=400, detail="feedback is required")
        from datetime import datetime
        reports_collection = get_reports_collection()
        res = reports_collection.update_one(
            {"_id": ObjectId(report_id)},
            {"$set": {"feedback": feedback, "feedback_at": datetime.utcnow(), "feedback_read": False}}
        )
        return {"success": res.matched_count > 0}
    except HTTPException:
        raise
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/api/admin/student-performance/{student_id}")
async def get_student_performance(student_id: str):
    """Get detailed student performance data"""
    try:
        from database import scores_collection, pre_test_collection, post_test_collection, modules_collection, get_user_collection
        user_collection = get_user_collection()
        student = user_collection.find_one({"id_number": student_id})
        if not student:
            return {"success": False, "error": "Student not found"}
        modules = list(modules_collection.find({}))
        scores = list(scores_collection.find({"user_id": student_id}))
        preTests = []
        postTests = []
        for module in modules:
            module_id = str(module["_id"])
            module_title = module["title"]
            pre_score = next((sc for sc in scores if sc["module_id"] == module_id and sc.get("test_type") == "pretest"), None)
            post_score = next((sc for sc in scores if sc["module_id"] == module_id and sc.get("test_type") == "posttest"), None)
            if pre_score:
                pre_test = pre_test_collection.find_one({"module_id": module_id})
                pre_test_title = pre_test["title"] if pre_test else f"Pre-Test for {module_title}"
                preTests.append({
                    "module_id": module_id,
                    "pre_test_title": pre_test_title,
                    "correct": pre_score["correct"],
                    "incorrect": pre_score["incorrect"],
                    "total_questions": pre_score["total_questions"],
                    "score": (pre_score["correct"] / max(pre_score["total_questions"], 1)) * 100,
                    "time_spent": pre_score.get("time_spent", 0)
                })
            if post_score:
                post_test = post_test_collection.find_one({"module_id": module_id})
                post_test_title = post_test["title"] if post_test else f"Post-Test for {module_title}"
                postTests.append({
                    "module_id": module_id,
                    "post_test_title": post_test_title,
                    "correct": post_score["correct"],
                    "incorrect": post_score["incorrect"],
                    "total_questions": post_score["total_questions"],
                    "score": (post_score["correct"] / max(post_score["total_questions"], 1)) * 100,
                    "time_spent": post_score.get("time_spent", 0)
                })
        details = {
            "preTests": preTests,
            "postTests": postTests,
            "studyHabits": [] # Add real study habits if available
        }
        return {"success": True, "details": details}
    except Exception as e:
        return {"success": False, "error": str(e)}
# (Removed duplicate second definition of /api/admin/account-requests)
    
@router.get("/api/student/{id_number}/study-activity-report")
async def get_study_activity_report(id_number: str):
    """Return study activity counts for flashcards and study sessions only.
    Notes are removed per requirement.
    Flashcards are counted by generated_by == id_number.
    Study sessions are derived from session_logs_collection by user_id == id_number.
    """
    from database import flashcards_collection, session_logs_collection
    try:
        # Flashcards generated by the student (all-time)
        flashcards_count = flashcards_collection.count_documents({"generated_by": id_number})
        flashcards = list(
            flashcards_collection.find(
                {"generated_by": id_number},
                {"_id": 0, "question": 1, "created_at": 1, "module_id": 1}
            ).sort("created_at", -1).limit(50)
        )

        # Study sessions from logs (all-time entries for the user)
        sessions_count = session_logs_collection.count_documents({"user_id": id_number})
        sessions_cursor = session_logs_collection.find({"user_id": id_number}).sort("left_at", -1).limit(50)
        sessions = []
        for log in sessions_cursor:
            sessions.append({
                "group_id": log.get("group_id"),
                "joined_at": log.get("joined_at"),
                "left_at": log.get("left_at"),
                "duration_seconds": log.get("duration_seconds")
            })

        # Compute total session hours across all logs (apply a reasonable cap per log to avoid anomalies)
        total_seconds = 0
        from datetime import datetime
        all_logs_cursor = session_logs_collection.find(
            {"user_id": id_number}, {"duration_seconds": 1, "joined_at": 1, "left_at": 1}
        )
        for log in all_logs_cursor:
            dur = log.get("duration_seconds")
            if isinstance(dur, (int, float)) and dur is not None:
                seconds = max(0, int(dur))
            else:
                joined = log.get("joined_at")
                left = log.get("left_at")
                if joined and left and isinstance(joined, datetime) and isinstance(left, datetime):
                    seconds = max(0, int((left - joined).total_seconds()))
                else:
                    seconds = 0
            # Optional safety cap of 2 hours per log to avoid inflated durations from stale sessions
            seconds = min(seconds, 2 * 60 * 60)
            total_seconds += seconds
        session_hours = round(total_seconds / 3600, 2)

        return {
            "flashcards_count": int(flashcards_count),
            "flashcards": flashcards,
            "sessions_count": int(sessions_count),
            "study_sessions": sessions,
            "session_hours": session_hours
        }
    except Exception as e:
        return {"flashcards_count": 0, "flashcards": [], "sessions_count": 0, "study_sessions": [], "error": str(e)}