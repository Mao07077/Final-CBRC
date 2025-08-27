import io
import cloudinary
import cloudinary.uploader

cloudinary.config(
    cloud_name = 'dvdsn3v1l',
    api_key = '268751277619354',
    api_secret = 'd9aIRSb6pS083AiBpWRd-EAF62Y'
)
from fastapi import APIRouter, HTTPException, Body, Path, UploadFile, File
import os
from fastapi.responses import JSONResponse
from models import ProfileData, UserSettings
from database import users_collection, request_collection
from bson import ObjectId
from datetime import datetime
from typing import Dict, List


router = APIRouter()

@router.put("/api/profile/{id_number}/image")
async def upload_profile_image(id_number: str, profileImage: UploadFile = File(...)):
    user = users_collection.find_one({"id_number": id_number})
    if not user:
        print(f"[DEBUG] User not found for id_number: {id_number}")
        raise HTTPException(status_code=404, detail="User not found")
    # Read file bytes and upload to Cloudinary as a file-like object
    file_bytes = await profileImage.read()
    result = cloudinary.uploader.upload(io.BytesIO(file_bytes), folder="profile_pics")
    image_url = result["secure_url"]
    print(f"[DEBUG] Cloudinary upload result for {id_number}: {result}")
    update_result = users_collection.update_one({"id_number": id_number}, {"$set": {"profileImageUrl": image_url}})
    print(f"[DEBUG] MongoDB update result for {id_number}: {update_result.raw_result}")
    user_after = users_collection.find_one({"id_number": id_number})
    print(f"[DEBUG] User after update for {id_number}: {user_after}")
    return JSONResponse({"success": True, "profileImageUrl": image_url})

@router.put("/api/profile/{id_number}")
def update_profile(id_number: str, data: dict = Body(...)):
    user = users_collection.find_one({"id_number": id_number})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Only allow updating certain fields
    allowed_fields = ["firstname", "lastname", "program", "hoursActivity", "email", "birthdate", "middlename", "suffix", "username"]
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    users_collection.update_one({"id_number": id_number}, {"$set": update_data})
    return {"success": True, "message": "Profile updated successfully."}

@router.get("/api/profile/{id_number}", response_model=ProfileData)
def get_profile(id_number: str):
    user = users_collection.find_one({"id_number": id_number})
    print(f"[DEBUG] get_profile for {id_number}: {user}")
    if not user:
        print(f"[DEBUG] User not found for id_number: {id_number}")
        raise HTTPException(status_code=404, detail="User not found")

    # Aggregate daily study activity from scores and flashcard time
    from database import scores_collection, modules_collection
    import datetime
    scores = list(scores_collection.find({"user_id": id_number}))
    daily_activity = {}
    flashcard_time = user.get("flashcard_time", 0)
    for score in scores:
        date_taken = score.get("date_taken")
        time_spent = min(score.get("time_spent", 0), 600)  # max 10 mins per test
        if date_taken:
            day = date_taken.split("T")[0]
            daily_activity.setdefault(day, 0)
            daily_activity[day] += time_spent / 60
    # Add flashcard time to the most recent day
    if daily_activity:
        latest_day = max(daily_activity.keys())
        daily_activity[latest_day] += flashcard_time / 60

    # Prepare graph data: last 7 days
    today = datetime.date.today()
    graph_data = []
    total_week = 0
    peak_hour = 0
    peak_day = ""
    active_days = 0
    for i in range(6, -1, -1):
        day = (today - datetime.timedelta(days=i)).isoformat()
        hours = round(daily_activity.get(day, 0), 2)
        graph_data.append({"day": day, "hours": hours})
        total_week += hours
        if hours > peak_hour:
            peak_hour = hours
            peak_day = day
        if hours >= 1:
            active_days += 1

    return {
        "firstname": user.get("firstname", ""),
        "lastname": user.get("lastname", ""),
        "id_number": user.get("id_number", ""),
        "program": user.get("program", ""),
        "hoursActivity": user.get("hoursActivity", 0),
        "profileImageUrl": user.get("profileImageUrl", ""),
        "dailyActivity": graph_data,
        "totalWeek": round(total_week, 2),
        "peakHour": peak_hour,
        "peakDay": peak_day,
        "activeDays": active_days
    }

@router.get("/students/{id_number}/recommended-pages", response_model=Dict[str, List[str]])
def get_recommended_pages(id_number: str):
    user = users_collection.find_one({"id_number": id_number})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    top3_habits = user.get("top3Habits", [])
    habit_to_page = {
        "Study with Friends": "learn-together",
        "Asking for Help": "instructor-chat",
        "Test Yourself Periodically": "modules",
        "Creating a Study Schedule": "scheduler",
        "Setting Study Goals": "notes",
        "Organizing Notes": "notes",
        "Teach What You've Learned": "learn-together",
        "Use of Flashcards": "flashcard",
        "Using Aromatherapy, Plants, or Music": "music"
    }
    recommended_pages = []
    for habit in top3_habits:
        page = habit_to_page.get(habit)
        if page and page not in recommended_pages:
            recommended_pages.append(page)
    return {"recommendedPages": recommended_pages}

@router.get("/user/settings/{id_number}")
async def get_user_settings(id_number: str):
    user = users_collection.find_one({"id_number": id_number})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "success": True,
        "data": {
            "firstname": user.get("firstname", ""),
            "middlename": user.get("middlename", ""),
            "lastname": user.get("lastname", ""),
            "suffix": user.get("suffix", ""),
            "birthdate": user.get("birthdate", ""),
            "email": user.get("email", ""),
            "program": user.get("program", ""),
            "username": user.get("username", ""),
        },
    }

@router.post("/user/settings/request/{id_number}")
async def request_settings_change(id_number: str, data: dict = Body(...)):
    request_collection.insert_one({
        "id_number": id_number,
        "requested_changes": data,
        "created_at": datetime.utcnow()
    })
    return {"success": True, "message": "Request sent to admin."}

@router.get("/admin/requests")
def get_settings_requests():
    requests = list(request_collection.find())
    result = []
    for req in requests:
        result.append({
            "_id": str(req.get("_id", "")),
            "id_number": req.get("id_number", ""),
            "firstname": req.get("requested_changes", {}).get("firstname", ""),
            "lastname": req.get("requested_changes", {}).get("lastname", ""),
            "program": req.get("requested_changes", {}).get("program", ""),
            "update_data": req.get("requested_changes", {}),
        })
    return {"success": True, "data": result}

@router.post("/admin/requests/accept/{request_id}")
def accept_settings_request(request_id: str = Path(...), update_data: dict = Body(...)):
    req = request_collection.find_one({"_id": ObjectId(request_id)})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    id_number = req.get("id_number")
    users_collection.update_one({"id_number": id_number}, {"$set": update_data})
    request_collection.delete_one({"_id": ObjectId(request_id)})
    return {"success": True, "message": "Request accepted and changes applied."}

@router.delete("/admin/requests/decline/{request_id}")
def decline_settings_request(request_id: str = Path(...)):
    result = request_collection.delete_one({"_id": ObjectId(request_id)})
    if result.deleted_count == 1:
        return {"success": True, "message": "Request declined and removed."}
    raise HTTPException(status_code=404, detail="Request not found")