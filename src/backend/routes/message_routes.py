from fastapi import APIRouter, HTTPException, Body
import asyncio
from database import messages_collection, users_collection
import json
from fastapi import Request
import sys
sys.path.append('..')
try:
    from routes.chat_websocket import global_online_users
except ImportError:
    global_online_users = None
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
def send_message(message_data: dict = Body(...), request: Request = None):
    """Send a message between users. Accepts either receiver_id or receiver_name."""
    required_fields = ["sender_id", "message"]
    if not any(["receiver_id" in message_data, "receiver_name" in message_data]):
        raise HTTPException(status_code=400, detail="Missing receiver_id or receiver_name")
    if not all(field in message_data for field in required_fields):
        raise HTTPException(status_code=400, detail="Missing required fields")

    # Verify sender exists
    sender = users_collection.find_one({"id_number": message_data["sender_id"]})
    if not sender:
        raise HTTPException(status_code=404, detail="Sender not found")

    # Get receiver_id from name if needed
    receiver_id = message_data.get("receiver_id")
    if not receiver_id:
        receiver_name = message_data.get("receiver_name")
        if not receiver_name:
            raise HTTPException(status_code=400, detail="Missing receiver_name")
        # Try to find user by full name (case-insensitive)
        receiver = users_collection.find_one({
            "$expr": {
                "$regexMatch": {
                    "input": {"$concat": ["$firstname", " ", "$lastname"]},
                    "regex": f"^{receiver_name}$",
                    "options": "i"
                }
            }
        })
        if not receiver:
            raise HTTPException(status_code=404, detail=f"Receiver '{receiver_name}' not found")
        receiver_id = receiver["id_number"]
    else:
        receiver = users_collection.find_one({"id_number": receiver_id})
        if not receiver:
            raise HTTPException(status_code=404, detail="Receiver not found")

    # Create message document
    message_doc = {
        "sender_id": message_data["sender_id"],
        "receiver_id": receiver_id,
        "message": message_data["message"],
        "timestamp": datetime.utcnow(),
        "read": False
    }

    result = messages_collection.insert_one(message_doc)
    message_doc["_id"] = str(result.inserted_id)

    # Broadcast to sender and receiver via WebSocket if online
    ws_message = {
        "type": "chat_message",
        "chat_id": message_data.get("chat_id", ""),
        "sender_id": message_data["sender_id"],
        "sender_name": sender.get("firstname", "") + " " + sender.get("lastname", ""),
        "recipient_id": receiver_id,
        "message": message_data["message"],
        "timestamp": message_doc["timestamp"].isoformat(),
        "_id": message_doc["_id"]
    }
    # Use asyncio.create_task to avoid blocking
    async def send_ws():
        if global_online_users:
            for uid in [message_data["sender_id"], receiver_id]:
                user_ws = global_online_users.get(uid, {}).get("websocket")
                if user_ws:
                    try:
                        await user_ws.send_text(json.dumps(ws_message))
                    except Exception:
                        pass
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(send_ws())
        else:
            loop.run_until_complete(send_ws())
    except Exception:
        pass

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