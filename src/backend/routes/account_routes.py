from fastapi import APIRouter, HTTPException, Query, Body
from database import users_collection, scores_collection
from bson import ObjectId
from config import logger
import random
from utils import hash_password

router = APIRouter()

@router.post("/api/admin/accounts")
def create_account(payload: dict = Body(...)):
    try:
        required = ["firstname", "lastname", "email", "role", "id_number"]
        missing = [k for k in required if not payload.get(k)]
        if missing:
            raise HTTPException(status_code=400, detail=f"Missing fields: {', '.join(missing)}")

        email = payload.get("email").strip().lower()
        id_number = payload.get("id_number").strip()

        # Unique constraints: email and id_number
        existing = users_collection.find_one({"$or": [{"email": email}, {"id_number": id_number}]})
        if existing:
            raise HTTPException(status_code=409, detail="Email or ID number already exists")

        role = payload.get("role", "student")
        doc = {
            "firstname": payload.get("firstname", ""),
            "lastname": payload.get("lastname", ""),
            "program": payload.get("program", ""),
            "email": email,
            "role": role,
            "id_number": id_number,
            # Default verification: admins/instructors verified, students false unless provided
            "is_verified": bool(payload.get("is_verified", payload.get("role") in {"admin", "instructor"})),
            # Require initial password change for non-admin accounts by default
            "mustChangePassword": bool(payload.get("mustChangePassword", role in {"student", "instructor"})),
        }

        password = payload.get("password")
        if password:
            doc["password"] = hash_password(password)

        res = users_collection.insert_one(doc)
        acc_id = str(res.inserted_id)
        created = users_collection.find_one({"_id": ObjectId(acc_id)})
        return {
            "success": True,
            "account": {
                "_id": acc_id,
                "role": created.get("role"),
                "id_number": created.get("id_number"),
                "firstname": created.get("firstname"),
                "lastname": created.get("lastname"),
                "program": created.get("program"),
                "email": created.get("email"),
                "is_verified": created.get("is_verified", False),
                "mustChangePassword": created.get("mustChangePassword", False),
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating account: {e}")

@router.get("/api/admin/accounts")
def get_all_accounts():
    # Return full account data including _id for admin editing
    accounts = []
    for doc in users_collection.find():
        acc = {
            "_id": str(doc.get("_id")),
            "role": doc.get("role"),
            "id_number": doc.get("id_number"),
            "firstname": doc.get("firstname"),
            "lastname": doc.get("lastname"),
            "program": doc.get("program"),
            "email": doc.get("email"),
            "is_verified": doc.get("is_verified", False)
        }
        accounts.append(acc)
    return {"success": True, "accounts": accounts}

@router.put("/api/admin/accounts/{account_id}")
def update_account(account_id: str, payload: dict = Body(...)):
    try:
        # Accept partial updates; restrict editable fields
        editable = {k: v for k, v in payload.items() if k in {"firstname", "lastname", "program", "email", "role", "id_number", "is_verified", "mustChangePassword"}}
        if not editable:
            raise HTTPException(status_code=400, detail="No editable fields provided")
        res = users_collection.update_one({"_id": ObjectId(account_id)}, {"$set": editable})
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Account not found")
        updated = users_collection.find_one({"_id": ObjectId(account_id)})
        return {"success": True, "account": {
            "_id": account_id,
            "role": updated.get("role"),
            "id_number": updated.get("id_number"),
            "firstname": updated.get("firstname"),
            "lastname": updated.get("lastname"),
            "program": updated.get("program"),
            "email": updated.get("email"),
            "is_verified": updated.get("is_verified", False),
            "mustChangePassword": updated.get("mustChangePassword", False)
        }}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating account: {e}")

@router.delete("/api/admin/accounts/{account_id}")
async def delete_account(account_id: str):
    try:
        result = users_collection.delete_one({"_id": ObjectId(account_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Account not found")
        return {"success": True, "message": "Account deleted"}
    except HTTPException:
        raise
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