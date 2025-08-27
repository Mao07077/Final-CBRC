from fastapi import APIRouter, HTTPException, Body
from database import study_groups_collection, users_collection
from bson import ObjectId
from datetime import datetime
from typing import List, Dict

router = APIRouter()

@router.get("/api/study-groups/active")
def get_active_study_sessions():
    """Get only active study sessions (live meetings)"""
    try:
        print("Fetching active study sessions...")  # Debug log
        
        # First, let's see all groups in the database
        all_groups = list(study_groups_collection.find({}))
        print(f"Total groups in database: {len(all_groups)}")  # Debug log
        
        for group in all_groups:
            print(f"Group: {group.get('title', 'No title')} - is_session_active: {group.get('is_session_active')} - type: {type(group.get('is_session_active'))}")
        
        # Now find only active groups
        groups = list(study_groups_collection.find({"is_session_active": True}))
        print(f"Found {len(groups)} active groups")  # Debug log
        
        # Also try with different query variations
        groups_alt1 = list(study_groups_collection.find({"is_session_active": {"$eq": True}}))
        print(f"Alt query 1 found {len(groups_alt1)} groups")  # Debug log
        
        groups_alt2 = list(study_groups_collection.find({"is_session_active": {"$ne": False}}))
        print(f"Alt query 2 found {len(groups_alt2)} groups")  # Debug log
        
        # Convert ObjectId to string and format data
        formatted_groups = []
        for group in groups:
            participant_count = len(group.get("active_participants", []))
            group["id"] = str(group["_id"])
            del group["_id"]
            formatted_groups.append(group)
            print(f"📊 Active group: {group['title']} - ID: {group['id']} - Participants: {participant_count} - List: {group.get('active_participants', [])}")  # Enhanced debug log
        
        return {
            "success": True,
            "groups": formatted_groups
        }
    except Exception as e:
        print(f"Error in get_active_study_sessions: {str(e)}")  # Debug log
        raise HTTPException(status_code=500, detail=f"Failed to fetch active sessions: {str(e)}")

@router.get("/api/study-groups/debug")
def debug_all_groups():
    """Debug endpoint to see all groups in database"""
    try:
        all_groups = list(study_groups_collection.find({}))
        formatted_groups = []
        for group in all_groups:
            # Keep the original _id for debugging
            group_copy = group.copy()
            group_copy["id"] = str(group_copy["_id"])
            group_copy["_id"] = str(group_copy["_id"])  # Keep both for debugging
            formatted_groups.append(group_copy)
        
        return {
            "success": True,
            "total_groups": len(formatted_groups),
            "groups": formatted_groups,
            "debug_info": {
                "collection_name": study_groups_collection.name,
                "database_name": study_groups_collection.database.name
            }
        }
    except Exception as e:
        return {"error": str(e), "error_type": type(e).__name__}

@router.get("/api/study-groups")
def get_all_study_groups():
    """Get all available study groups"""
    try:
        groups = list(study_groups_collection.find({}))
        
        # Convert ObjectId to string and format data
        formatted_groups = []
        for group in groups:
            group["id"] = str(group["_id"])
            del group["_id"]
            formatted_groups.append(group)
        
        return {
            "success": True,
            "groups": formatted_groups
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch study groups: {str(e)}")

@router.get("/api/study-groups/{user_id}")
def get_user_study_groups(user_id: str):
    """Get all study groups for a user"""
    try:
        # Find groups where user is a member
        groups = list(study_groups_collection.find({
            "members": user_id
        }))
        
        # Convert ObjectId to string and format data
        formatted_groups = []
        for group in groups:
            group["id"] = str(group["_id"])
            del group["_id"]
            formatted_groups.append(group)
        
        return {
            "success": True,
            "groups": formatted_groups
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch study groups: {str(e)}")

@router.post("/api/study-groups")
def create_study_group(data: dict = Body(...)):
    """Create a new study group and immediately start as live session"""
    try:
        creator_id = data.get("creator_id")
        if not creator_id:
            raise HTTPException(status_code=400, detail="Creator ID is required")
            
        print(f"Creating study group for creator_id: {creator_id}")  # Debug log
        
        group_data = {
            "title": data.get("title", ""),
            "subject": data.get("subject", ""),
            "schedule": data.get("schedule", ""),
            "password": data.get("password", ""),  # Add password field
            "creator_id": creator_id,
            "members": [creator_id],
            "created_at": datetime.utcnow(),
            "max_members": data.get("max_members", 10),
            "is_session_active": True,  # Start as active session immediately
            "session_started_at": datetime.utcnow(),
            "active_participants": [creator_id],  # Creator is first active participant
            "last_activity": datetime.utcnow(),  # Track activity for auto-cleanup
            "auto_delete_minutes": 10  # Auto-delete after 10 minutes of inactivity
        }
        
        print(f"Group data to insert: {group_data}")  # Debug log
        
        result = study_groups_collection.insert_one(group_data)
        
        # Get the inserted document to ensure we have all fields correctly
        inserted_group = study_groups_collection.find_one({"_id": result.inserted_id})
        print(f"Inserted group from DB: {inserted_group}")  # Debug log

        if inserted_group:
            inserted_group["id"] = str(inserted_group["_id"])
            del inserted_group["_id"]

            # Ensure is_session_active is always present
            if "is_session_active" not in inserted_group:
                inserted_group["is_session_active"] = True

            print(f"Group created with id: {inserted_group['id']}")  # Debug log
            print(f"Group is_session_active: {inserted_group.get('is_session_active')}")  # Debug log

            return {
                "success": True,
                "group": inserted_group,
                "message": "Study group created successfully"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to retrieve created group")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create study group: {str(e)}")

@router.post("/api/study-groups/{group_id}/join")
def join_study_group(group_id: str, data: dict = Body(...)):
    """Join a study group"""
    try:
        user_id = data.get("user_id")
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID is required")
        
        # Check if group exists
        group = study_groups_collection.find_one({"_id": ObjectId(group_id)})
        if not group:
            raise HTTPException(status_code=404, detail="Study group not found")
        
        # Check if user is already a member
        if user_id in group.get("members", []):
            return {"success": True, "message": "Already a member of this group"}
        
        # Add user to group
        study_groups_collection.update_one(
            {"_id": ObjectId(group_id)},
            {"$push": {"members": user_id}}
        )
        
        return {
            "success": True,
            "message": "Successfully joined the study group"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to join study group: {str(e)}")

@router.delete("/api/study-groups/{group_id}/leave")
def leave_study_group(group_id: str, data: dict = Body(...)):
    """Leave a study group"""
    try:
        user_id = data.get("user_id")
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID is required")
        
        # Remove user from group
        study_groups_collection.update_one(
            {"_id": ObjectId(group_id)},
            {"$pull": {"members": user_id}}
        )
        
        return {
            "success": True,
            "message": "Successfully left the study group"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to leave study group: {str(e)}")

@router.get("/api/study-groups/{group_id}/session-info")
def get_study_group_session_info(group_id: str):
    """Get current session information for a study group"""
    try:
        # Check if group exists
        group = study_groups_collection.find_one({"_id": ObjectId(group_id)})
        if not group:
            raise HTTPException(status_code=404, detail="Study group not found")
        
        # Format group data
        group["id"] = str(group["_id"])
        del group["_id"]
        
        # Get member details
        members_info = []
        for member_id in group.get("members", []):
            user = users_collection.find_one({"id_number": member_id})
            if user:
                members_info.append({
                    "id_number": user["id_number"],
                    "name": f"{user.get('firstname', '')} {user.get('lastname', '')}".strip(),
                    "program": user.get("program", "")
                })
        
        return {
            "success": True,
            "group": group,
            "members": members_info,
            "websocket_url": f"/ws/study-group/{group_id}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch session info: {str(e)}")

@router.post("/api/study-groups/{group_id}/start-session")
def start_study_session(group_id: str, data: dict = Body(...)):
    """Start a live study session"""
    try:
        user_id = data.get("user_id")
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID is required")
        
        # Check if group exists
        group = study_groups_collection.find_one({"_id": ObjectId(group_id)})
        if not group:
            raise HTTPException(status_code=404, detail="Study group not found")
        
        # Check if user is a member
        if user_id not in group.get("members", []):
            raise HTTPException(status_code=403, detail="You must be a member to start a session")
        
        # Update group to mark session as active with only the starter as active participant
        study_groups_collection.update_one(
            {"_id": ObjectId(group_id)},
            {
                "$set": {
                    "is_session_active": True,
                    "session_started_at": datetime.utcnow(),
                    "last_activity": datetime.utcnow(),  # Track activity for auto-cleanup
                    "active_participants": [user_id]  # Reset to only the starter
                }
            }
        )
        
        return {
            "success": True,
            "message": "Study session started successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start session: {str(e)}")

@router.post("/api/study-groups/{group_id}/end-session")
def end_study_session(group_id: str, data: dict = Body(...)):
    """End a live study session and optionally delete the group"""
    try:
        user_id = data.get("user_id")
        delete_group = data.get("delete_group", True)  # Default to deleting the group
        
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID is required")
        
        # Check if group exists
        group = study_groups_collection.find_one({"_id": ObjectId(group_id)})
        if not group:
            raise HTTPException(status_code=404, detail="Study group not found")
        
        if delete_group:
            # Delete the entire group when session ends
            study_groups_collection.delete_one({"_id": ObjectId(group_id)})
            return {
                "success": True,
                "message": "Study session ended and group deleted",
                "group_deleted": True
            }
        else:
            # Just mark session as inactive
            study_groups_collection.update_one(
                {"_id": ObjectId(group_id)},
                {
                    "$set": {
                        "is_session_active": False,
                        "session_started_at": None,
                        "active_participants": []
                    }
                }
            )
            return {
                "success": True,
                "message": "Study session ended",
                "group_deleted": False
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to end session: {str(e)}")

@router.post("/api/study-groups/{group_id}/verify-password")
def verify_group_password(group_id: str, data: dict = Body(...)):
    """Verify password for joining a study group"""
    try:
        password = data.get("password", "")
        
        # Check if group exists
        group = study_groups_collection.find_one({"_id": ObjectId(group_id)})
        if not group:
            raise HTTPException(status_code=404, detail="Study group not found")
        
        # Check if session is active
        if not group.get("is_session_active", False):
            raise HTTPException(status_code=400, detail="Study session is not active")
        
        # Verify password (empty password means no password required)
        group_password = group.get("password", "")
        if group_password and group_password != password:
            raise HTTPException(status_code=403, detail="Incorrect password")
        
        return {
            "success": True,
            "message": "Password verified successfully",
            "group": {
                "id": str(group["_id"]),
                "title": group.get("title", ""),
                "subject": group.get("subject", ""),
                "creator_id": group.get("creator_id", ""),
                "active_participants": len(group.get("active_participants", []))
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify password: {str(e)}")

@router.post("/api/study-groups/{group_id}/join-session")
async def join_study_session(group_id: str, data: dict = Body(...)):
    """Join an active study session"""
    try:
        user_id = data.get("user_id")
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID is required")
        
        # Check if group exists
        group = study_groups_collection.find_one({"_id": ObjectId(group_id)})
        if not group:
            raise HTTPException(status_code=404, detail="Study group not found")
        
        # Check if session is active
        if not group.get("is_session_active", False):
            raise HTTPException(status_code=400, detail="No active session to join")
        
        current_participants = group.get("active_participants", [])
        print(f"🔍 JOIN DEBUG - Group: {group.get('title', 'Unknown')}")
        print(f"🔍 User trying to join: {user_id}")
        print(f"🔍 Current participants before join: {current_participants}")
        
        # Add user to active participants if not already there
        if user_id not in current_participants:
            study_groups_collection.update_one(
                {"_id": ObjectId(group_id)},
                {
                    "$addToSet": {"active_participants": user_id},
                    "$set": {"last_activity": datetime.utcnow()}  # Reset timer - cancel auto-delete
                }
            )
            print(f"✅ User {user_id} added to participants - auto-delete timer reset")
        else:
            print(f"⚠️ User {user_id} already in participants list - not adding again")
        
        # Verify the final state
        updated_group = study_groups_collection.find_one({"_id": ObjectId(group_id)})
        final_participants = updated_group.get("active_participants", [])
        print(f"🔍 Final participants after join: {final_participants}")
        
        # Broadcast participant change to dashboard
        try:
            from routes.websocket_routes import broadcast_participant_change
            await broadcast_participant_change(group_id)
        except Exception as e:
            print(f"Warning: Could not broadcast participant change: {e}")
        
        return {
            "success": True,
            "message": "Successfully joined the study session",
            "participant_count": len(final_participants),
            "participants": final_participants
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to join session: {str(e)}")

@router.post("/api/study-groups/{group_id}/leave-session")
async def leave_study_session(group_id: str, data: dict = Body(...)):
    """Leave an active study session"""
    try:
        user_id = data.get("user_id")
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID is required")
        
        # Get current state before leaving
        group = study_groups_collection.find_one({"_id": ObjectId(group_id)})
        if not group:
            raise HTTPException(status_code=404, detail="Study group not found")
            
        current_participants = group.get("active_participants", [])
        print(f"🔍 LEAVE DEBUG - Group: {group.get('title', 'Unknown')}")
        print(f"🔍 User trying to leave: {user_id}")
        print(f"🔍 Current participants before leave: {current_participants}")
        
        # Remove user from active participants
        study_groups_collection.update_one(
            {"_id": ObjectId(group_id)},
            {"$pull": {"active_participants": user_id}}
        )
        
        # Check if no participants are left
        updated_group = study_groups_collection.find_one({"_id": ObjectId(group_id)})
        final_participants = updated_group.get("active_participants", [])
        print(f"🔍 Final participants after leave: {final_participants}")
        
        if updated_group and len(final_participants) == 0:
            # Update last_activity when room becomes empty - this triggers 10min auto-delete
            print(f"🕒 No participants left, starting 10-minute countdown for auto-deletion")
            study_groups_collection.update_one(
                {"_id": ObjectId(group_id)},
                {
                    "$set": {
                        "is_session_active": True,  # Keep it active for now
                        "active_participants": [],  # Empty but trackable
                        "last_activity": datetime.utcnow()  # Start the 10-minute timer
                    }
                }
            )
            
            # Broadcast participant change to dashboard
            try:
                from routes.websocket_routes import broadcast_participant_change
                await broadcast_participant_change(group_id)
            except Exception as e:
                print(f"Warning: Could not broadcast participant change: {e}")
                
            return {
                "success": True,
                "message": "Left session but keeping it active for others to join",
                "group_deleted": False,
                "participant_count": 0,
                "participants": []
            }
        
        # Broadcast participant change to dashboard (for non-empty rooms too)
        try:
            from routes.websocket_routes import broadcast_participant_change
            await broadcast_participant_change(group_id)
        except Exception as e:
            print(f"Warning: Could not broadcast participant change: {e}")
        
        return {
            "success": True,
            "message": "Successfully left the study session",
            "group_deleted": False,
            "participant_count": len(final_participants),
            "participants": final_participants
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to leave session: {str(e)}")

@router.post("/api/study-groups/{group_id}/force-cleanup")
def force_cleanup_participants(group_id: str):
    """Force cleanup of participants - remove all and reset to empty"""
    try:
        # Get current state
        group = study_groups_collection.find_one({"_id": ObjectId(group_id)})
        if not group:
            raise HTTPException(status_code=404, detail="Study group not found")
            
        current_participants = group.get("active_participants", [])
        print(f"🧹 FORCE CLEANUP - Group: {group.get('title', 'Unknown')}")
        print(f"🧹 Current participants before cleanup: {current_participants}")
        
        # Force reset participants to empty array
        study_groups_collection.update_one(
            {"_id": ObjectId(group_id)},
            {
                "$set": {
                    "active_participants": [],
                    "last_activity": datetime.utcnow()
                }
            }
        )
        
        print(f"✅ Force cleanup completed - participants reset to empty")
        
        return {
            "success": True,
            "message": "Participants list force-cleaned",
            "previous_count": len(current_participants),
            "previous_participants": current_participants,
            "new_count": 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to force cleanup: {str(e)}")

@router.post("/api/study-groups/test-create")
def test_create_group():
    """Test endpoint to create a simple group and immediately check if it exists"""
    try:
        # First check what's in the database before creating
        before_groups = list(study_groups_collection.find({}))
        before_active = list(study_groups_collection.find({"is_session_active": True}))
        
        # Create a simple test group
        test_group = {
            "title": "TEST GROUP",
            "subject": "TEST",
            "schedule": "NOW",
            "creator_id": "TEST_USER",
            "members": ["TEST_USER"],
            "created_at": datetime.utcnow(),
            "max_members": 10,
            "is_session_active": True,
            "session_started_at": datetime.utcnow(),
            "active_participants": ["TEST_USER"]
        }
        
        # Insert the group
        result = study_groups_collection.insert_one(test_group)
        print(f"Test group inserted with ID: {result.inserted_id}")
        
        # Immediately check what's in the database after creating
        after_groups = list(study_groups_collection.find({}))
        after_active = list(study_groups_collection.find({"is_session_active": True}))
        
        # Try to find our specific group
        found_group = study_groups_collection.find_one({"_id": result.inserted_id})
        print(f"Found group: {found_group}")
        
        # Clean up - delete the test group
        delete_result = study_groups_collection.delete_one({"_id": result.inserted_id})
        print(f"Delete result: {delete_result.deleted_count}")
        
        # Check after cleanup
        final_groups = list(study_groups_collection.find({}))
        final_active = list(study_groups_collection.find({"is_session_active": True}))
        
        return {
            "success": True,
            "database_info": {
                "collection_name": study_groups_collection.name,
                "database_name": study_groups_collection.database.name
            },
            "before_create": {
                "total_groups": len(before_groups),
                "active_groups": len(before_active)
            },
            "after_create": {
                "total_groups": len(after_groups),
                "active_groups": len(after_active)
            },
            "after_delete": {
                "total_groups": len(final_groups), 
                "active_groups": len(final_active)
            },
            "test_group": {
                "inserted_id": str(result.inserted_id),
                "found_group": bool(found_group),
                "deleted_count": delete_result.deleted_count
            }
        }
    except Exception as e:
        return {"error": str(e), "error_type": type(e).__name__}

@router.post("/api/study-groups/cleanup-inactive")
def cleanup_inactive_groups():
    """Clean up groups that have been inactive for more than 5 minutes"""
    try:
        from datetime import timedelta
        
        # Find groups that are older than 5 minutes with no active participants
        cutoff_time = datetime.utcnow() - timedelta(minutes=5)
        
        inactive_groups = study_groups_collection.find({
            "is_session_active": True,
            "last_activity": {"$lt": cutoff_time},
            "$or": [
                {"active_participants": {"$size": 0}},
                {"active_participants": {"$exists": False}}
            ]
        })
        
        deleted_count = 0
        for group in inactive_groups:
            # Double check - make sure it's really been 5 minutes and no participants
            if len(group.get("active_participants", [])) == 0:
                result = study_groups_collection.delete_one({"_id": group["_id"]})
                if result.deleted_count > 0:
                    deleted_count += 1
                    print(f"Auto-deleted inactive group: {group.get('title', 'Unknown')} - ID: {group['_id']}")
        
        return {
            "success": True,
            "deleted_count": deleted_count,
            "message": f"Cleaned up {deleted_count} inactive groups"
        }
    except Exception as e:
        return {"error": str(e), "error_type": type(e).__name__}

@router.post("/api/study-groups/cleanup-all-inactive")
def cleanup_all_inactive_groups():
    """Clean up ALL inactive groups (with no active participants)"""
    try:
        # Find all groups with no active participants or empty active_participants
        inactive_groups = study_groups_collection.find({
            "$or": [
                {"active_participants": {"$size": 0}},
                {"active_participants": {"$exists": False}},
                {"is_session_active": False},
                {"is_session_active": {"$exists": False}}
            ]
        })
        
        deleted_groups = []
        deleted_count = 0
        
        for group in inactive_groups:
            # Check if group has no active participants
            active_participants = group.get("active_participants", [])
            is_session_active = group.get("is_session_active", False)
            
            if len(active_participants) == 0 or not is_session_active:
                group_info = {
                    "id": str(group["_id"]),
                    "title": group.get("title", "Unknown"),
                    "subject": group.get("subject", "Unknown"),
                    "creator_id": group.get("creator_id", "Unknown"),
                    "is_session_active": is_session_active,
                    "active_participants_count": len(active_participants)
                }
                
                result = study_groups_collection.delete_one({"_id": group["_id"]})
                if result.deleted_count > 0:
                    deleted_count += 1
                    deleted_groups.append(group_info)
                    print(f"Deleted inactive group: {group_info['title']} - ID: {group_info['id']}")
        
        return {
            "success": True,
            "deleted_count": deleted_count,
            "deleted_groups": deleted_groups,
            "message": f"Cleaned up {deleted_count} inactive groups"
        }
    except Exception as e:
        return {"error": str(e), "error_type": type(e).__name__}

@router.post("/api/study-groups/update-activity")
def update_group_activity(data: dict = Body(...)):
    """Update last activity timestamp for a group"""
    try:
        group_id = data.get("group_id")
        if not group_id:
            raise HTTPException(status_code=400, detail="Group ID is required")
        
        # Update the group's last activity time
        result = study_groups_collection.update_one(
            {"_id": ObjectId(group_id)},
            {"$set": {"last_activity": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Study group not found")
        
        return {
            "success": True,
            "message": "Activity updated successfully"
        }
    except Exception as e:
        return {"error": str(e), "error_type": type(e).__name__}

@router.delete("/api/study-groups/delete-all")
def delete_all_study_groups():
    """Delete all study groups - WARNING: This will delete all meetings permanently"""
    try:
        # Get count before deletion for reporting
        total_count = study_groups_collection.count_documents({})
        
        # Delete all documents in the collection
        result = study_groups_collection.delete_many({})
        
        print(f"Deleted {result.deleted_count} study groups out of {total_count} total")
        
        return {
            "success": True,
            "message": f"Successfully deleted all {result.deleted_count} study groups",
            "deleted_count": result.deleted_count,
            "total_count": total_count
        }
    except Exception as e:
        print(f"Error deleting all groups: {str(e)}")
        return {"error": str(e), "error_type": type(e).__name__}

@router.get("/api/study-groups/status")
def get_groups_status():
    """Debug endpoint to check all groups and their auto-delete status"""
    try:
        from datetime import datetime, timedelta
        
        cutoff_time = datetime.utcnow() - timedelta(minutes=10)
        all_groups = list(study_groups_collection.find({}))
        
        status_info = {
            "total_groups": len(all_groups),
            "active_groups": 0,
            "empty_groups": 0,
            "groups_for_deletion": 0,
            "groups_details": []
        }
        
        for group in all_groups:
            participants = group.get("active_participants", [])
            last_activity = group.get("last_activity")
            is_active = group.get("is_session_active", False)
            
            # Calculate if this group would be deleted
            will_be_deleted = (
                is_active and 
                len(participants) == 0 and 
                last_activity and 
                last_activity < cutoff_time
            )
            
            group_detail = {
                "title": group.get("title", "Unknown"),
                "id": str(group["_id"]),
                "is_session_active": is_active,
                "participant_count": len(participants),
                "participants": participants,
                "last_activity": last_activity.isoformat() if last_activity else None,
                "minutes_since_activity": int((datetime.utcnow() - last_activity).total_seconds() / 60) if last_activity else None,
                "will_be_auto_deleted": will_be_deleted
            }
            
            status_info["groups_details"].append(group_detail)
            
            if is_active:
                status_info["active_groups"] += 1
            if len(participants) == 0:
                status_info["empty_groups"] += 1
            if will_be_deleted:
                status_info["groups_for_deletion"] += 1
        
        return {
            "success": True,
            "status": status_info,
            "cutoff_time": cutoff_time.isoformat(),
            "current_time": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")
