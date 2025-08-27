from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from database import get_user_collection, get_module_sessions_collection, get_message_collection

router = APIRouter()

@router.get("/api/students")
async def get_students():
    """Get all students for instructor"""
    try:
        user_collection = get_user_collection()
        students = list(user_collection.find({"role": {"$regex": "^student$", "$options": "i"}}))
        
        # Format student data
        formatted_students = []
        for student in students:
            formatted_students.append({
                "_id": str(student["_id"]),
                "name": f"{student.get('firstname', '')} {student.get('lastname', '')}".strip(),
                "studentNo": student.get("id_number", ""),
                "email": student.get("email", ""),
                "contact_number": student.get("contact_number", ""),
                "is_verified": student.get("is_verified", False)
            })
        
        return {"success": True, "students": formatted_students}
    except Exception as e:
        return {"success": False, "error": str(e), "students": []}

@router.get("/api/instructor/dashboard")
async def get_instructor_dashboard():
    """Get instructor dashboard data"""
    try:
        user_collection = get_user_collection()
        module_collection = get_module_sessions_collection()
        
        # Get total students count
        total_students = user_collection.count_documents({"role": "Student"})
        
        # Get modules
        modules = list(module_collection.find({}, {"title": 1}))
        formatted_modules = [{"_id": str(module["_id"]), "title": module.get("title", "")} for module in modules]
        
        # Mock engagement rate and attendance data for now
        engagement_rate = 78
        attendance_data = [70, 50, 90, 60, 40, 85, 75]
        
        return {
            "success": True,
            "stats": {
                "totalStudents": total_students,
                "engagementRate": engagement_rate
            },
            "modules": formatted_modules,
            "attendanceData": attendance_data
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/api/instructor/conversations")
async def get_instructor_conversations():
    """Get instructor conversations"""
    try:
        message_collection = get_message_collection()
        
        # Get recent conversations - this is a simplified version
        # In a real implementation, you'd aggregate messages by conversation/user
        conversations = {
            "instructor-1": {
                "name": "Dr. Reyes (Prof Ed)",
                "messages": [
                    {
                        "id": 1,
                        "sender": "student",
                        "text": "Hi Dr. Reyes, I have a question about Piaget's stages.",
                    },
                    {
                        "id": 2,
                        "sender": "instructor",
                        "text": "Of course, I can help with that. What is your question?",
                    },
                ],
            }
        }
        
        return {"success": True, "conversations": conversations}
    except Exception as e:
        return {"success": False, "error": str(e), "conversations": {}}
