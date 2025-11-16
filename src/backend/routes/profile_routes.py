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
    from database import scores_collection, modules_collection, flashcards_collection, session_logs_collection
    import datetime
    from datetime import timedelta

    # Pull all scores for the user
    scores = list(scores_collection.find({"user_id": id_number}))

    # Prepare helper: map module_id -> title for any referenced modules
    module_ids = set()
    for s in scores:
        try:
            if s.get("module_id"):
                module_ids.add(str(s.get("module_id")))
        except Exception:
            pass
    module_title_map = {}
    try:
        if module_ids:
            mods = list(modules_collection.find({"_id": {"$in": [ObjectId(mid) for mid in module_ids if ObjectId.is_valid(mid)]}}))
            for m in mods:
                module_title_map[str(m["_id"])] = m.get("title", f"Module {m['_id']}")
    except Exception:
        pass

    # Build activity buckets for last 7 days
    today = datetime.date.today()
    week_start = today - timedelta(days=6)
    daily_activity = {}
    for i in range(7):
        day = (week_start + timedelta(days=i)).isoformat()
        daily_activity[day] = {
            "hours": 0.0,
            "modules": [],
            "flashcardsGenerated": 0,
            "sessionHours": 0.0,
        }

    # From test scores: accumulate hours and modules per day (robust date handling)
    for score in scores:
        raw_date = score.get("date_taken") or score.get("submitted_at") or score.get("created_at") or score.get("createdAt")
        time_spent = min(score.get("time_spent", 0), 600)  # cap at 10 mins (0.1667h)
        day = None
        try:
            if raw_date is None:
                day = None
            # raw_date can be a datetime.datetime in Mongo; ensure correct isinstance check
            elif isinstance(raw_date, datetime.datetime):
                day = raw_date.date().isoformat()
            elif isinstance(raw_date, str):
                # Expected ISO with 'T', otherwise assume yyyy-mm-dd
                day = raw_date.split("T")[0]
            else:
                day = None
        except Exception:
            day = None
        if day and day in daily_activity:
            daily_activity[day]["hours"] += time_spent / 60.0
            module_id = str(score.get("module_id")) if score.get("module_id") is not None else None
            if module_id:
                title = module_title_map.get(module_id, f"Module {module_id}")
                if title not in daily_activity[day]["modules"]:
                    daily_activity[day]["modules"].append(title)

    # From Learn Together session logs: add session hours per day (based on left_at date)
    try:
        session_logs = session_logs_collection.find({
            "user_id": id_number,
            "left_at": {"$gte": datetime.datetime.combine(week_start, datetime.time.min)}
        })
        for log in session_logs:
            left_at = log.get("left_at")
            joined_at = log.get("joined_at")
            duration_seconds = log.get("duration_seconds")
            # Fallback compute if needed
            if duration_seconds is None and joined_at and left_at:
                try:
                    duration_seconds = int((left_at - joined_at).total_seconds())
                except Exception:
                    duration_seconds = 0
            if not left_at or not duration_seconds:
                continue
            day = left_at.date().isoformat()
            if day in daily_activity:
                hours = min(duration_seconds, 7200) / 3600.0  # cap single session at 2h
                daily_activity[day]["sessionHours"] += hours
                daily_activity[day]["hours"] += hours
    except Exception as e:
        print(f"[WARN] Failed to aggregate session logs for profile: {e}")

    # Flashcards generated per day (count by created_at, generated_by) with robust date handling
    try:
        week_start_dt = datetime.datetime.combine(week_start, datetime.time.min)
        # First try direct query by created_at >= start
        flash_logs = list(flashcards_collection.find({
            "generated_by": id_number,
            "created_at": {"$gte": week_start_dt}
        }))
        # If none found, fallback to scanning and parsing potential alternate fields or string timestamps
        if not flash_logs:
            flash_logs = list(flashcards_collection.find({"generated_by": id_number}))
        for fc in flash_logs:
            ts = fc.get("created_at") or fc.get("createdAt") or fc.get("timestamp")
            if not ts:
                continue
            if isinstance(ts, datetime.datetime):
                dt_val = ts
            elif isinstance(ts, str):
                dt_val = None
                for fmt in ("%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
                    try:
                        dt_val = datetime.datetime.strptime(ts, fmt)
                        break
                    except Exception:
                        continue
            else:
                dt_val = None
            if dt_val and dt_val >= week_start_dt:
                day = dt_val.date().isoformat()
                if day in daily_activity:
                    daily_activity[day]["flashcardsGenerated"] += 1
    except Exception as e:
        print(f"[WARN] Failed to aggregate flashcard generation logs for profile: {e}")

    # Add flashcard_time (cumulative) to most recent day as before to maintain legacy behavior
    flashcard_time = user.get("flashcard_time", 0)
    if daily_activity:
        latest_day = max(daily_activity.keys())
        daily_activity[latest_day]["hours"] += flashcard_time / 60.0

    # Prepare graph data: last 7 days
    # Prepare graph data from structured daily_activity
    graph_data = []
    total_week = 0.0
    peak_hour = 0.0
    peak_day = ""
    active_days = 0
    for i in range(6, -1, -1):
        day = (today - datetime.timedelta(days=i)).isoformat()
        data = daily_activity.get(day, {"hours": 0.0, "modules": [], "flashcardsGenerated": 0, "sessionHours": 0.0})
        hours = round(float(data.get("hours", 0.0)), 2)
        entry = {
            "day": day,
            "hours": hours,
            "modules": data.get("modules", []),
            "flashcardsGenerated": int(data.get("flashcardsGenerated", 0)),
            "sessionHours": round(float(data.get("sessionHours", 0.0)), 2),
        }
        graph_data.append(entry)
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
        "accountUpdateStatus": user.get("accountUpdateStatus"),
        "accountUpdateUnread": user.get("accountUpdateUnread"),
        "createdAt": user.get("createdAt") or (user.get("_id").generation_time if user.get("_id") else None),
        "dailyActivity": graph_data,
        "totalWeek": round(total_week, 2),
        "peakHour": peak_hour,
        "peakDay": peak_day,
        "activeDays": active_days
    }

@router.put("/api/profile/{id_number}/account-update/read")
def mark_account_update_read(id_number: str):
    user = users_collection.find_one({"id_number": id_number})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    users_collection.update_one({"id_number": id_number}, {"$set": {"accountUpdateUnread": False}})
    return {"success": True}

@router.get("/students/{id_number}/recommended-pages", response_model=Dict[str, List[str]])
def get_recommended_pages(id_number: str):
    user = users_collection.find_one({"id_number": id_number})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    top3_habits = user.get("top3Habits", [])
    habit_to_page = {
        "Study with Friends": "learn-together",
        # Align with frontend routesConfig (messages)
        "Asking for Help": "instructor-chat",
        "Test Yourself Periodically": "modules",
        "Creating a Study Schedule": "scheduler",
        "Setting Study Goals": "notes",
        "Organizing Notes": "notes",
        "Teach What You've Learned": "learn-together",
        # Standardize slug naming to match dashboard & pageDetails (plural + music-player)
        "Use of Flashcards": "flashcards",
        "Using Aromatherapy, Plants, or Music": "music-player"
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

# --- Student Exam Flow Endpoints ---
@router.get("/api/student/exam-flow/{id_number}")
def get_exam_flow(id_number: str):
    user = users_collection.find_one({"id_number": id_number})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    flow = user.get("examFlow", {})
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    # Normalize datetimes to aware UTC
    def aware(dt):
        try:
            if dt is None:
                return None
            if hasattr(dt, "tzinfo") and dt.tzinfo:
                return dt
            # treat naive as UTC
            return dt.replace(tzinfo=timezone.utc)
        except Exception:
            return None
    status = flow.get("status")
    prompt_at = aware(flow.get("promptScheduleAt"))
    exam_date = aware(flow.get("examDate"))
    last_prompt = aware(flow.get("lastPromptAt"))
    def same_day(a, b):
        try:
            return a.date() == b.date()
        except Exception:
            return False
    should_prompt = False
    prompt_type = None
    if status == "scheduled" and prompt_at and now >= prompt_at and not (last_prompt and same_day(last_prompt, now)):
        should_prompt = True
        prompt_type = "initial"
    elif status in ("exam_scheduled", "awaiting_result"):
        # Prompt for result on the exam day and afterward, once per day
        if (exam_date and (now.date() >= exam_date.date())) and not (last_prompt and same_day(last_prompt, now)):
            should_prompt = True
            prompt_type = "result"
    data = {
        "status": status,
        "promptScheduleAt": prompt_at,
        "examDate": exam_date,
        "result": flow.get("result"),
        "feedback": flow.get("feedback"),
        "declineReason": flow.get("declineReason"),
        "lastPromptAt": last_prompt,
        "shouldPrompt": should_prompt,
        "promptType": prompt_type,
    }
    return {"success": True, "flow": data}

@router.put("/api/student/exam-flow/{id_number}/decision")
def submit_exam_decision(id_number: str, payload: dict = Body(...)):
    user = users_collection.find_one({"id_number": id_number})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    will_take = payload.get("willTake")
    if will_take is None:
        raise HTTPException(status_code=400, detail="willTake is required")
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    update = {}
    if will_take is False:
        reason = payload.get("reason", "")
        update.update({
            "examFlow.status": "declined",
            "examFlow.declineReason": reason,
            "examFlow.lastPromptAt": now,
            "examFlow.decisionAt": now,
            "examFlow.declinedAt": now,
        })
    else:
        exam_date = payload.get("examDate")
        if not exam_date:
            raise HTTPException(status_code=400, detail="examDate is required when willTake is true")
        # Parse ISO date
        try:
            from datetime import datetime, timezone
            if isinstance(exam_date, str):
                # Accept date-only (YYYY-MM-DD) and ISO datetime
                if len(exam_date) == 10:
                    y, m, d = [int(x) for x in exam_date.split('-')]
                    exam_dt = datetime(y, m, d, 0, 0, 0, tzinfo=timezone.utc)
                else:
                    exam_dt = datetime.fromisoformat(exam_date.replace("Z", "+00:00"))
                    if exam_dt.tzinfo is None:
                        exam_dt = exam_dt.replace(tzinfo=timezone.utc)
            else:
                exam_dt = exam_date if exam_date.tzinfo else exam_date.replace(tzinfo=timezone.utc)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid examDate format")
        update.update({
            "examFlow.status": "exam_scheduled",
            "examFlow.examDate": exam_dt,
            "examFlow.decisionAt": now,
            "examFlow.examScheduledAt": now,
        })
    users_collection.update_one({"id_number": id_number}, {"$set": update})
    return {"success": True}

@router.put("/api/student/exam-flow/{id_number}/result")
def submit_exam_result(id_number: str, payload: dict = Body(...)):
    user = users_collection.find_one({"id_number": id_number})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    result = payload.get("result")  # 'pass' | 'fail' | 'no_result_yet'
    feedback = payload.get("feedback", "")
    if result not in ("pass", "fail", "no_result_yet"):
        raise HTTPException(status_code=400, detail="Invalid result value")
    # Require feedback when final result provided (pass/fail)
    if result in ("pass", "fail") and (not isinstance(feedback, str) or not feedback.strip()):
        raise HTTPException(status_code=400, detail="Feedback is required when result is pass or fail")
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    update = {
        "examFlow.feedback": feedback,
        "examFlow.lastPromptAt": now,
    }
    if result == "no_result_yet":
        update.update({
            "examFlow.status": "awaiting_result",
            "examFlow.result": result,
        })
    else:
        update.update({
            "examFlow.status": "result_provided",
            "examFlow.result": result,
            "examFlow.resultAt": now,
        })
    users_collection.update_one({"id_number": id_number}, {"$set": update})
    return {"success": True}

@router.put("/api/student/exam-flow/{id_number}/read")
def mark_exam_prompt_read(id_number: str):
    user = users_collection.find_one({"id_number": id_number})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    users_collection.update_one({"id_number": id_number}, {"$set": {"examFlow.lastPromptAt": now}})
    return {"success": True}