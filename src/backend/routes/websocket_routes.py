from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from collections import defaultdict
import json
import uuid
from datetime import datetime
from config import logger
from database import study_groups_collection, users_collection
from bson import ObjectId

router = APIRouter()

# Store active rooms and their participants
rooms = defaultdict(list)
student_info = defaultdict(dict)
room_metadata = defaultdict(dict)  # Store room-specific data like study group info

@router.websocket("/ws/{call_id}")
async def websocket_endpoint(websocket: WebSocket, call_id: str):
    await websocket.accept()
    student_id = str(uuid.uuid4())
    data = await websocket.receive_text()
    try:
        msg = json.loads(data)
        id_number = msg.get("id_number", "")
        name = msg.get("firstname", "Anonymous")
    except Exception:
        id_number = ""
        name = "Anonymous"
    rooms[call_id].append(websocket)
    student_info[call_id][websocket] = {
        "id": student_id,
        "name": name,
        "muted": False,
        "camera_off": False,
        "id_number": id_number,
    }

    async def broadcast_active_students():
        students = [
            {
                "id": info["id"],
                "name": info["name"],
                "muted": info.get("muted", False),
                "camera_off": info.get("camera_off", False),
            }
            for info in student_info[call_id].values()
        ]
        for ws in rooms[call_id]:
            await ws.send_text(json.dumps({
                "type": "active_students",
                "students": students,
            }))

    try:
        await websocket.send_text(json.dumps({
            "type": "student_id",
            "studentId": student_id,
            "callId": call_id
        }))
        await broadcast_active_students()
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
            except Exception:
                msg = {"type": "unknown", "message": data}
            
            if msg.get("type") == "status_update":
                info = student_info[call_id][websocket]
                info["muted"] = msg.get("muted", False)
                info["camera_off"] = msg.get("camera_off", False)
                await broadcast_active_students()
                continue
            elif msg.get("type") == "chat":
                chat_message = {
                    "type": "chat",
                    "message": {
                        "sender_name": student_info[call_id][websocket]["name"],
                        "timestamp": datetime.utcnow().isoformat(),
                        "message": msg.get("message", "")
                    }
                }
                for ws in rooms[call_id]:
                    await ws.send_text(json.dumps(chat_message))
            elif msg.get("type") in ["offer", "answer", "ice-candidate"]:
                target_id = msg.get("target")
                if target_id:
                    for ws in rooms[call_id]:
                        if student_info[call_id][ws]["id"] == target_id:
                            await ws.send_text(json.dumps({
                                "type": msg["type"],
                                "from": student_id,
                                msg["type"]: msg.get(msg["type"]),
                            }))
                            break
            else:
                for ws in rooms[call_id]:
                    if ws != websocket:
                        await ws.send_text(json.dumps(msg))
    except WebSocketDisconnect:
        rooms[call_id].remove(websocket)
        student_info[call_id].pop(websocket, None)
        await broadcast_active_students()
        logger.info(f"WebSocket disconnected: {call_id}")

@router.websocket("/ws/study-group/{group_id}")
async def study_group_websocket(websocket: WebSocket, group_id: str):
    """WebSocket endpoint specifically for study group sessions"""
    await websocket.accept()
    
    # Generate unique participant ID
    participant_id = str(uuid.uuid4())
    
    # Wait for initial connection data
    try:
        data = await websocket.receive_text()
        msg = json.loads(data)
        user_id = msg.get("user_id", "")
        user_name = msg.get("user_name", "Anonymous")
    except Exception as e:
        logger.error(f"Failed to parse initial connection data: {e}")
        await websocket.close()
        return
    
    # Verify study group exists (remove membership check for password-protected rooms)
    try:
        study_group = study_groups_collection.find_one({"_id": ObjectId(group_id)})
        if not study_group:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": "Study group not found"
            }))
            await websocket.close()
            return
        
        # For password-protected groups, anyone can join if they have the password
        # The password check will be handled by the frontend before connecting
        logger.info(f"User {user_id} connecting to study group {group_id}")
            
    except Exception as e:
        logger.error(f"Database error verifying group: {e}")
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": "Failed to verify study group"
        }))
        await websocket.close()
        return
    
    # Add to room
    room_key = f"group_{group_id}"
    rooms[room_key].append(websocket)
    student_info[room_key][websocket] = {
        "id": participant_id,
        "user_id": user_id,
        "name": user_name,
        "muted": True,  # Start muted by default
        "camera_off": True,  # Start with camera off by default
        "joined_at": datetime.utcnow().isoformat(),
        "is_screen_sharing": False
    }
    
    # Store room metadata
    if room_key not in room_metadata:
        room_metadata[room_key] = {
            "group_id": group_id,
            "group_title": study_group.get("title", "Study Session"),
            "group_subject": study_group.get("subject", ""),
            "session_started": datetime.utcnow().isoformat(),
            "chat_history": []
        }

    async def broadcast_participants():
        """Broadcast current participants to all users in the room"""
        participants = []
        for info in student_info[room_key].values():
            participants.append({
                "id": info["id"],
                "user_id": info["user_id"], 
                "name": info["name"],
                "muted": info.get("muted", True),
                "camera_off": info.get("camera_off", True),
                "is_screen_sharing": info.get("is_screen_sharing", False),
                "joined_at": info.get("joined_at")
            })
        
        message = {
            "type": "participants_update",
            "participants": participants,
            "room_info": room_metadata[room_key]
        }
        
        for ws in rooms[room_key]:
            try:
                await ws.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Failed to send participants update: {e}")

    async def broadcast_chat_message(sender_info, message_text):
        """Broadcast chat message to all participants"""
        chat_message = {
            "id": str(uuid.uuid4()),
            "sender_id": sender_info["user_id"],
            "sender_name": sender_info["name"],
            "message": message_text,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Store in room history
        room_metadata[room_key]["chat_history"].append(chat_message)
        
        message = {
            "type": "chat_message",
            "message": chat_message
        }
        
        for ws in rooms[room_key]:
            try:
                await ws.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Failed to send chat message: {e}")

    try:
        # Send initial connection confirmation
        await websocket.send_text(json.dumps({
            "type": "connection_established",
            "participant_id": participant_id,
            "room_info": room_metadata[room_key]
        }))
        
        # Broadcast updated participants list
        await broadcast_participants()
        
        # Send chat history to new participant
        if room_metadata[room_key]["chat_history"]:
            await websocket.send_text(json.dumps({
                "type": "chat_history",
                "messages": room_metadata[room_key]["chat_history"]
            }))
        
        # Main message handling loop
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                msg_type = msg.get("type", "unknown")
                
                if msg_type == "status_update":
                    # Update participant status (mute/unmute, camera on/off, screen share)
                    info = student_info[room_key][websocket]
                    info["muted"] = msg.get("muted", info["muted"])
                    info["camera_off"] = msg.get("camera_off", info["camera_off"]) 
                    info["is_screen_sharing"] = msg.get("is_screen_sharing", info["is_screen_sharing"])
                    await broadcast_participants()
                
                elif msg_type == "chat_message":
                    # Handle chat messages
                    message_text = msg.get("message", "").strip()
                    if message_text:
                        sender_info = student_info[room_key][websocket]
                        await broadcast_chat_message(sender_info, message_text)
                
                elif msg_type in ["webrtc_offer", "webrtc_answer", "webrtc_ice_candidate"]:
                    # Handle WebRTC signaling for peer-to-peer connections
                    target_participant_id = msg.get("target_participant_id")
                    if target_participant_id:
                        # Find target websocket and forward the message
                        for ws in rooms[room_key]:
                            if student_info[room_key][ws]["id"] == target_participant_id:
                                try:
                                    await ws.send_text(json.dumps({
                                        "type": msg_type,
                                        "from_participant_id": participant_id,
                                        "data": msg.get("data", {})
                                    }))
                                except Exception as e:
                                    logger.error(f"Failed to forward WebRTC message: {e}")
                                break
                
                elif msg_type == "hand_raise":
                    # Handle hand raising for asking questions
                    info = student_info[room_key][websocket]
                    hand_raised = msg.get("hand_raised", False)
                    
                    message = {
                        "type": "hand_raise_update",
                        "participant_id": participant_id,
                        "participant_name": info["name"],
                        "hand_raised": hand_raised,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    
                    for ws in rooms[room_key]:
                        try:
                            await ws.send_text(json.dumps(message))
                        except Exception as e:
                            logger.error(f"Failed to send hand raise update: {e}")
                
                elif msg_type == "speaking_update":
                    # Broadcast speaking status to all participants
                    info = student_info[room_key][websocket]
                    is_speaking = msg.get("is_speaking", False)
                    message = {
                        "type": "speaking_update",
                        "from_user_id": info["user_id"],
                        "is_speaking": is_speaking,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    for ws in rooms[room_key]:
                        try:
                            await ws.send_text(json.dumps(message))
                        except Exception as e:
                            logger.error(f"Failed to send speaking update: {e}")
                
                else:
                    logger.warning(f"Unknown message type: {msg_type}")
                    
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse message: {e}")
            except Exception as e:
                logger.error(f"Error handling message: {e}")
                
    except WebSocketDisconnect:
        # Clean up when participant leaves
        if websocket in rooms[room_key]:
            rooms[room_key].remove(websocket)
        if websocket in student_info[room_key]:
            del student_info[room_key][websocket]
        
        # Broadcast updated participants list
        if rooms[room_key]:  # If there are still participants
            await broadcast_participants()
        else:
            # Remove room metadata if no participants left
            if room_key in room_metadata:
                del room_metadata[room_key]
        
        logger.info(f"Study group participant disconnected: {group_id}, user: {user_id}")
    
    except Exception as e:
        logger.error(f"Study group WebSocket error: {e}")
        if websocket in rooms[room_key]:
            rooms[room_key].remove(websocket)
        if websocket in student_info[room_key]:
            del student_info[room_key][websocket]

# Store dashboard connections for live updates
dashboard_connections = []

@router.websocket("/ws/dashboard")
async def dashboard_websocket(websocket: WebSocket):
    """WebSocket endpoint for live dashboard updates"""
    await websocket.accept()
    dashboard_connections.append(websocket)
    
    try:
        # Send initial data
        await send_dashboard_update(websocket)
        
        # Keep connection alive and handle any incoming messages
        while True:
            try:
                data = await websocket.receive_text()
                # Dashboard doesn't need to send messages, just receive updates
            except WebSocketDisconnect:
                break
    except WebSocketDisconnect:
        pass
    finally:
        if websocket in dashboard_connections:
            dashboard_connections.remove(websocket)

async def send_dashboard_update(websocket=None):
    """Send updated group info to dashboard"""
    try:
        # Get all active groups with current participant counts
        active_groups = list(study_groups_collection.find({"is_session_active": True}))
        
        groups_data = []
        for group in active_groups:
            group_data = {
                "id": str(group["_id"]),
                "title": group.get("title", ""),
                "subject": group.get("subject", ""),
                "participant_count": len(group.get("active_participants", [])),
                "active_participants": group.get("active_participants", []),
                "creator_id": group.get("creator_id", ""),
                "session_started_at": group.get("session_started_at"),
                "last_activity": group.get("last_activity")
            }
            groups_data.append(group_data)
        
        update_message = {
            "type": "dashboard_update",
            "groups": groups_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Send to specific websocket or all dashboard connections
        if websocket:
            await websocket.send_text(json.dumps(update_message))
        else:
            # Broadcast to all dashboard connections
            disconnected = []
            for ws in dashboard_connections:
                try:
                    await ws.send_text(json.dumps(update_message))
                except:
                    disconnected.append(ws)
            
            # Remove disconnected clients
            for ws in disconnected:
                dashboard_connections.remove(ws)
                
    except Exception as e:
        logger.error(f"Error sending dashboard update: {e}")

async def broadcast_participant_change(group_id):
    """Broadcast participant count changes to dashboard"""
    await send_dashboard_update()