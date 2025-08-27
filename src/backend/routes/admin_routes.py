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

# Fetch account update requests with current user data
@router.get("/api/admin/account-requests")
async def get_account_update_requests():
    user_collection = get_user_collection()
    # Assume requests are stored in a collection called 'account_update_requests'
    from database import account_update_requests_collection
    requests = list(account_update_requests_collection.find({}))
    result = []
    for req in requests:
        user = user_collection.find_one({"id_number": req["id_number"]})
        req_data = {
            "_id": str(req["_id"]),
            "id_number": req["id_number"],
            "update_data": req["update_data"],
        }
        # Add current user fields
        if user:
            for field in req["update_data"].keys():
                req_data[field] = user.get(field, "N/A")
            req_data["firstname"] = user.get("firstname", "")
            req_data["lastname"] = user.get("lastname", "")
        result.append(req_data)
    return {"success": True, "requests": result}

# Accept account update request
@router.post("/api/admin/account-requests/{request_id}/accept")
async def accept_account_update_request(request_id: str):
    from database import account_update_requests_collection, get_user_collection
    req = account_update_requests_collection.find_one({"_id": ObjectId(request_id)})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    user_collection = get_user_collection()
    # Update user fields
    user_collection.update_one({"id_number": req["id_number"]}, {"$set": req["update_data"]})
    # Remove request
    account_update_requests_collection.delete_one({"_id": ObjectId(request_id)})
    return {"success": True}

# Decline account update request
@router.post("/api/admin/account-requests/{request_id}/decline")
async def decline_account_update_request(request_id: str):
    from database import account_update_requests_collection
    result = account_update_requests_collection.delete_one({"_id": ObjectId(request_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    return {"success": True}
from fastapi import APIRouter, Body, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any
from bson import ObjectId
from database import get_user_collection, get_reports_collection, posts_collection

class StatusUpdate(BaseModel):
    status: str
# Admin: Get all posts
@router.get("/api/admin/posts")
async def get_admin_posts():
    posts = list(posts_collection.find({}))
    for post in posts:
        post["_id"] = str(post["_id"])
    return posts
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
        "totalUsers": total_users,
        "totalStudents": total_students,
        "totalInstructors": total_instructors,
        "totalAdmins": total_admins,
        "reportsThisWeek": reports_this_week
    }


from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from bson import ObjectId
from database import get_user_collection, get_reports_collection

router = APIRouter()

@router.get("/api/admin/dashboard")
async def get_admin_dashboard():
    user_collection = get_user_collection()
    total_users = user_collection.count_documents({})
    total_students = user_collection.count_documents({"role": {"$regex": "^student$", "$options": "i"}})
    total_instructors = user_collection.count_documents({"role": {"$regex": "^instructor$", "$options": "i"}})
    total_admins = user_collection.count_documents({"role": {"$regex": "^admin$", "$options": "i"}})
    return {
        "totalUsers": total_users,
        "totalStudents": total_students,
        "totalInstructors": total_instructors,
        "totalAdmins": total_admins,
    }

@router.get("/api/admin/accounts")
async def get_accounts():
    """Get all user accounts for admin"""
    try:
        user_collection = get_user_collection()
        accounts = list(user_collection.find({}))
        
        # Format account data
        formatted_accounts = []
        for account in accounts:
            formatted_accounts.append({
                "_id": str(account["_id"]),
                "firstname": account.get("firstname", ""),
                "lastname": account.get("lastname", ""),
                "id_number": account.get("id_number", ""),
                "role": account.get("role", ""),
                "email": account.get("email", ""),
                "contact_number": account.get("contact_number", ""),
                "is_verified": account.get("is_verified", False)
            })
        
        return {"success": True, "accounts": formatted_accounts}
    except Exception as e:
        return {"success": False, "error": str(e), "accounts": []}

@router.get("/api/admin/reports")
async def get_reports():
    """Get all reports for admin"""
    try:
        reports_collection = get_reports_collection()
        user_collection = get_user_collection()
        reports = list(reports_collection.find({}))
        formatted_reports = []
        for report in reports:
            # Try to get student name from user collection if studentId is present
            student_name = ""
            if report.get("studentId"):
                student = user_collection.find_one({"id_number": report["studentId"]})
                if student:
                    student_name = f"{student.get('firstname', '')} {student.get('lastname', '')}".strip()
            # Use student field as fallback
            if not student_name:
                student_name = report.get("student", "")
            formatted_reports.append({
                "_id": str(report["_id"]),
                "student": student_name,
                "studentId": report.get("studentId", ""),
                "issue": report.get("issue", ""),
                "status": report.get("status", "Pending"),
                "createdAt": report.get("createdAt"),
                "messages": report.get("messages", []),
                "screenshot": report.get("screenshot", None)
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

@router.delete("/api/admin/reports/{report_id}")
async def delete_report(report_id: str):
    """Delete a report"""
    try:
        reports_collection = get_reports_collection()
        result = reports_collection.delete_one({"_id": ObjectId(report_id)})
        
        if result.deleted_count > 0:
            return {"success": True}
        else:
            return {"success": False, "error": "Report not found"}
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
@router.get("/api/admin/account-requests")
async def get_account_update_requests():
    """Get all account update requests for admin"""
    try:
        from database import request_collection
        requests = list(request_collection.find({}))
        formatted_requests = []
        for req in requests:
            formatted_requests.append({
                "_id": str(req.get("_id")),
                "id_number": req.get("id_number", ""),
                "firstname": req.get("firstname", ""),
                "lastname": req.get("lastname", ""),
                "email": req.get("email", ""),
                "contact_number": req.get("contact_number", ""),
                "role": req.get("role", ""),
                "request_type": req.get("request_type", ""),
                "current_data": req.get("current_data", {}),
                "update_data": req.get("update_data", {}),
                "createdAt": req.get("createdAt", None),
            })
        return {"success": True, "requests": formatted_requests}
    except Exception as e:
        return {"success": False, "error": str(e), "requests": []}