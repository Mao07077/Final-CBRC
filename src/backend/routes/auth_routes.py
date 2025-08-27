from fastapi import APIRouter, HTTPException, BackgroundTasks
from models import SignupData, LoginRequest, ForgotPasswordData, ConfirmResetCodeData, ResetPasswordData
from database import users_collection
from utils import hash_password, verify_password, send_email
import random
from datetime import datetime

router = APIRouter()

@router.post("/api/signup")
def signup(data: SignupData):
    if users_collection.find_one({"id_number": data.id_number}):
        return {"success": False, "message": "ID number already registered."}
    if users_collection.find_one({"email": data.email}):
        return {"success": False, "message": "Email already registered."}
    hashed_pw = hash_password(data.password)
    user_doc = data.dict()
    user_doc["password"] = hashed_pw
    user_doc["hoursActivity"] = 0
    user_doc["surveyCompleted"] = False
    user_doc["notes"] = []
    users_collection.insert_one(user_doc)
    return {"success": True, "message": "Signup successful!"}

@router.post("/api/login")
def login(data: LoginRequest):
    user = users_collection.find_one({"id_number": data.idNumber})
    if user and verify_password(data.password, user["password"]):
        return {
            "success": True,
            "id_number": user.get("id_number", ""),
            "role": user.get("role", ""),
            "program": user.get("program", ""),
            "firstname": user.get("firstname", ""),
            "lastname": user.get("lastname", ""),
            "hoursActivity": user.get("hoursActivity", 0),
            "surveyCompleted": user.get("surveyCompleted", False)
        }
    raise HTTPException(status_code=401, detail="Invalid credentials")

@router.post("/api/forgot_password")
def forgot_password(data: ForgotPasswordData, background_tasks: BackgroundTasks):
    user = users_collection.find_one({"id_number": data.id_number, "email": data.email})
    if not user:
        return {"success": False, "message": "No user found with that ID number and email."}
    reset_code = str(random.randint(100000, 999999))
    users_collection.update_one(
        {"id_number": data.id_number},
        {"$set": {"reset_code": reset_code, "reset_code_created": datetime.utcnow()}}
    )
    send_email(data.email, "Password Reset Code", f"Your reset code is: {reset_code}")
    return {"success": True, "message": "Reset code sent to your email."}

@router.post("/api/confirm_reset_code")
async def confirm_reset_code(data: ConfirmResetCodeData):
    user = users_collection.find_one({"id_number": data.id_number, "email": data.email})
    if user and user.get("reset_code") == data.reset_code:
        return {"success": True, "message": "Reset code confirmed. You can now reset your password."}
    raise HTTPException(status_code=400, detail="Invalid reset code")

@router.post("/api/reset_password")
async def reset_password(data: ResetPasswordData):
    user = users_collection.find_one({"id_number": data.id_number})
    if user and user.get("reset_code") == data.reset_code:
        hashed_password = hash_password(data.new_password)
        users_collection.update_one(
            {"id_number": data.id_number},
            {"$set": {"password": hashed_password, "reset_code": None}}
        )
        return {"success": True, "message": "Password has been reset successfully."}
    raise HTTPException(status_code=400, detail="Invalid reset code")