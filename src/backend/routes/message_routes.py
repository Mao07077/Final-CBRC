from fastapi import APIRouter, HTTPException, Body
from database import messages_collection, users_collection
from datetime import datetime
from bson import ObjectId

router = APIRouter()

@router.get("/api/messages/{sender}/{receiver}")
def get_messages(sender: str, receiver: str):
    """Get conversation between two users"""
    messages = list(messages_collection.find({
        "$or": [
            {"sender_id": sender, "receiver_id": receiver},
            {"sender_id": receiver, "receiver_id": sender}
        ]
    }).sort("timestamp", 1))
    
    # Convert ObjectId to string for JSON serialization
    for message in messages:
        message["_id"] = str(message["_id"])
    
    return messages

@router.post("/api/send-message")
def send_message(message_data: dict = Body(...)):
    """Send a message between users"""
    required_fields = ["sender_id", "receiver_id", "message"]
    if not all(field in message_data for field in required_fields):
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    # Verify both users exist
    sender = users_collection.find_one({"id_number": message_data["sender_id"]})
    receiver = users_collection.find_one({"id_number": message_data["receiver_id"]})
    
    if not sender:
        raise HTTPException(status_code=404, detail="Sender not found")
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")
    
    # Create message document
    message_doc = {
        "sender_id": message_data["sender_id"],
        "receiver_id": message_data["receiver_id"],
        "message": message_data["message"],
        "timestamp": datetime.utcnow(),
        "read": False
    }
    
    result = messages_collection.insert_one(message_doc)
    message_doc["_id"] = str(result.inserted_id)
    
    return {"success": True, "message": message_doc}

@router.get("/api/conversations/student/{student_id}")
def get_student_conversations(student_id: str):
    """Get all instructors for student to chat with"""
    # Verify student exists
    student = users_collection.find_one({"id_number": student_id, "role": {"$regex": "^student$", "$options": "i"}})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get all instructors
    instructors = list(users_collection.find({"role": {"$regex": "^instructor$", "$options": "i"}}))
    
    conversations = {}
    for instructor in instructors:
        instructor_id = instructor["id_number"]
        instructor_name = f"{instructor.get('firstname', '')} {instructor.get('lastname', '')}".strip()
        
        # Get messages between student and this instructor
        messages = list(messages_collection.find({
            "$or": [
                {"sender_id": student_id, "receiver_id": instructor_id},
                {"sender_id": instructor_id, "receiver_id": student_id}
            ]
        }).sort("timestamp", 1))
        
        # Convert ObjectId to string
        for message in messages:
            message["_id"] = str(message["_id"])
        
        conversations[instructor_id] = {
            "id": instructor_id,
            "name": instructor_name,
            "role": "instructor",
            "messages": messages,
            "lastMessage": messages[-1] if messages else None
        }
    
    return conversations

@router.get("/api/conversations/instructor/{instructor_id}")
def get_instructor_conversations(instructor_id: str):
    """Get only students who have messaged this instructor"""
    # Verify instructor exists
    instructor = users_collection.find_one({"id_number": instructor_id, "role": {"$regex": "^instructor$", "$options": "i"}})
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found")
    
    # Get all unique students who have sent messages to this instructor
    pipeline = [
        {
            "$match": {
                "$or": [
                    {"sender_id": instructor_id},
                    {"receiver_id": instructor_id}
                ]
            }
        },
        {
            "$group": {
                "_id": {
                    "$cond": {
                        "if": {"$eq": ["$sender_id", instructor_id]},
                        "then": "$receiver_id",
                        "else": "$sender_id"
                    }
                }
            }
        }
    ]
    
    student_ids_result = list(messages_collection.aggregate(pipeline))
    student_ids = [item["_id"] for item in student_ids_result]
    
    conversations = {}
    for student_id in student_ids:
        # Get student info
        student = users_collection.find_one({"id_number": student_id, "role": {"$regex": "^student$", "$options": "i"}})
        if not student:
            continue
            
        student_name = f"{student.get('firstname', '')} {student.get('lastname', '')}".strip()
        
        # Get messages between instructor and this student
        messages = list(messages_collection.find({
            "$or": [
                {"sender_id": instructor_id, "receiver_id": student_id},
                {"sender_id": student_id, "receiver_id": instructor_id}
            ]
        }).sort("timestamp", 1))
        
        # Convert ObjectId to string
        for message in messages:
            message["_id"] = str(message["_id"])
        
        conversations[student_id] = {
            "id": student_id,
            "name": student_name,
            "role": "student",
            "messages": messages,
            "lastMessage": messages[-1] if messages else None
        }
    
    return conversations

@router.get("/api/instructors")
def get_instructors():
    """Get all instructors (for student chat)"""
    instructors = list(users_collection.find({"role": {"$regex": "^instructor$", "$options": "i"}}))
    return [
        {
            "firstname": instructor.get("firstname", ""),
            "lastname": instructor.get("lastname", ""),
            "id_number": instructor.get("id_number", ""),
            "program": instructor.get("program", "")
        }
        for instructor in instructors
    ]