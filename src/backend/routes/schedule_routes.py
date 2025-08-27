
from fastapi import APIRouter, HTTPException
from models import ScheduleEntry
from database import schedule_collection

router = APIRouter()

@router.post("/create_schedule")
def create_schedule(data: ScheduleEntry):
    existing = schedule_collection.find_one({"id_number": data.id_number})
    if existing:
        schedule_collection.update_one(
            {"id_number": data.id_number},
            {"$set": {"schedule": data.schedule, "times": data.times}}
        )
    else:
        schedule_collection.insert_one(data.dict())
    return {"success": True, "message": "Schedule saved successfully"}

@router.post("/save_schedule")
def save_schedule(data: ScheduleEntry):
    existing = schedule_collection.find_one({"id_number": data.id_number})
    if existing:
        schedule_collection.update_one(
            {"id_number": data.id_number},
            {"$set": {"schedule": data.schedule, "times": data.times}}
        )
    else:
        schedule_collection.insert_one(data.dict())
    return {"success": True, "message": "Schedule saved successfully"}

@router.get("/get_schedule/{id_number}")
def get_schedule(id_number: str):
    schedule = schedule_collection.find_one({"id_number": id_number})
    if not schedule:
        raise HTTPException(status_code=404, detail="No schedule found.")
    # Return just the array of events for frontend compatibility
    return schedule["schedule"]