from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from collections import defaultdict
import json
from datetime import datetime
from config import logger
from database import users_collection, messages_collection

router = APIRouter()

# Track online users and their websockets
global_online_users = defaultdict(dict)  # {user_id: {"websocket": ws, "name": name}}

# Track chat message status (delivered/seen)
chat_status = defaultdict(dict)  # {chat_id: {user_id: "delivered"/"seen"}}

@router.websocket("/ws/chat")
async def chat_websocket(websocket: WebSocket):
    logger.info("[WS] /ws/chat connection attempt")
    await websocket.accept()
    user_id = None
    user_name = ""
    try:
        data = await websocket.receive_text()
        msg = json.loads(data)
        user_id = msg.get("user_id")
        user_name = msg.get("user_name", "Anonymous")
        global_online_users[user_id] = {"websocket": websocket, "name": user_name}
        # Broadcast online status
        await broadcast_presence()
    except Exception as e:
        logger.error(f"Chat WS initial connect error: {e}")
        await websocket.close()
        return

    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            msg_type = msg.get("type")

            if msg_type == "chat_message":
                # Broadcast message to recipient (and sender for echo)
                chat_id = msg.get("chat_id")
                recipient_id = msg.get("recipient_id")
                message_text = msg.get("message")
                timestamp = datetime.utcnow()
                message = {
                    "type": "chat_message",
                    "chat_id": chat_id,
                    "sender_id": user_id,
                    "sender_name": user_name,
                    "recipient_id": recipient_id,
                    "message": message_text,
                    "timestamp": timestamp.isoformat(),
                }

                # Save to database (messages_collection)
                try:
                    db_message = {
                        "sender_id": user_id,
                        "receiver_id": recipient_id,
                        "message": message_text,
                        "timestamp": timestamp,
                        "read": False
                    }
                    result = messages_collection.insert_one(db_message)
                    message["_id"] = str(result.inserted_id)
                    logger.info(f"[WS] Saved chat message to DB: {db_message}")
                except Exception as e:
                    logger.error(f"Failed to save chat message to DB: {e}")

                # Mark as delivered for recipient
                chat_status[chat_id][recipient_id] = "delivered"
                # Send to recipient if online
                if recipient_id in global_online_users:
                    await global_online_users[recipient_id]["websocket"].send_text(json.dumps(message))
                # Echo to sender
                await websocket.send_text(json.dumps(message))
            elif msg_type == "seen":
                chat_id = msg.get("chat_id")
                chat_status[chat_id][user_id] = "seen"
                # Notify sender (if online)
                sender_id = msg.get("sender_id")
                if sender_id in global_online_users:
                    await global_online_users[sender_id]["websocket"].send_text(json.dumps({
                        "type": "seen",
                        "chat_id": chat_id,
                        "seen_by": user_id
                    }))
            elif msg_type == "get_presence":
                # Send current online users
                await websocket.send_text(json.dumps({
                    "type": "presence",
                    "online_users": list(global_online_users.keys())
                }))
    except WebSocketDisconnect:
        if user_id in global_online_users:
            del global_online_users[user_id]
        await broadcast_presence()
        logger.info(f"Chat WebSocket disconnected: {user_id}")
    except Exception as e:
        logger.error(f"Chat WebSocket error: {e}")
        if user_id in global_online_users:
            del global_online_users[user_id]
        await broadcast_presence()

async def broadcast_presence():
    # Notify all users of current online users
    online_list = list(global_online_users.keys())
    for user in global_online_users.values():
        try:
            await user["websocket"].send_text(json.dumps({
                "type": "presence",
                "online_users": online_list
            }))
        except Exception as e:
            logger.error(f"Failed to broadcast presence: {e}")
