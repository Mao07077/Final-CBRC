from fastapi import APIRouter, HTTPException, Query
from database import users_collection, scores_collection
from bson import ObjectId
from config import logger
import random

router = APIRouter()

@router.get("/api/accounts")
def get_all_accounts():
    accounts = list(users_collection.find({}, {
        "_id": 0,
        "role": 1,
        "id_number": 1,
        "firstname": 1,
        "lastname": 1,
        "program": 1,
        "email": 1,
    }))
    return {"accounts": accounts}

@router.delete("/api/accounts/{account_id}")
async def delete_account(account_id: str):
    try:
        result = users_collection.delete_one({"_id": ObjectId(account_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Account not found")
        return {"message": "Account deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting account: {e}")

@router.get("/api/attendance")
def get_attendance(program: str = Query(None)):
    try:
        query = {}
        if program:
            query["program"] = program
        scores = scores_collection.find(query)
        attendance_data = []
        for score in scores:
            user = users_collection.find_one({"id_number": score["user_id"]})
            if user:
                attendance_data.append({
                    "student_id": score["user_id"],
                    "name": f"{user['firstname']} {user['lastname']}",
                    "module_id": score["module_id"],
                    "attendance_percentage": random.randint(50, 100),
                })
        return attendance_data
    except Exception as e:
        logger.error(f"Error fetching attendance data: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch attendance data")