from fastapi import APIRouter, HTTPException, BackgroundTasks
from models import SignupData, LoginRequest, ForgotPasswordData, ConfirmResetCodeData, ResetPasswordData
from database import users_collection
from utils import hash_password, verify_password, send_email
import random
from datetime import datetime, timedelta

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
    # Force first login password change before survey
    user_doc["mustChangePassword"] = True
    users_collection.insert_one(user_doc)
    return {"success": True, "message": "Signup successful!"}

@router.post("/api/login")
def login(data: LoginRequest):
    user = users_collection.find_one({"id_number": data.idNumber})
    if user and user.get("archived"):
        raise HTTPException(status_code=403, detail="Your account is no longer accessible in this system.")
    if user and verify_password(data.password, user["password"]):
        return {
            "success": True,
            "id_number": user.get("id_number", ""),
            "role": user.get("role", ""),
            "program": user.get("program", ""),
            "firstname": user.get("firstname", ""),
            "lastname": user.get("lastname", ""),
            "hoursActivity": user.get("hoursActivity", 0),
            "surveyCompleted": user.get("surveyCompleted", False),
            "mustChangePassword": user.get("mustChangePassword", False)
        }
    raise HTTPException(status_code=401, detail="Invalid credentials")

@router.post("/api/forgot_password")
def forgot_password(data: ForgotPasswordData, background_tasks: BackgroundTasks):
    user = users_collection.find_one({"id_number": data.id_number, "email": data.email})
    if not user:
        return {"success": False, "message": "No user found with that ID number and email."}
    # Simple rate limiting: max 5 requests per hour per user
    window_start = user.get("forgot_pw_window_start")
    count = int(user.get("forgot_pw_count", 0) or 0)
    now = datetime.utcnow()
    if window_start and isinstance(window_start, datetime) and (now - window_start) < timedelta(hours=1):
        if count >= 5:
            return {"success": False, "message": "Too many reset attempts. Please try again in about an hour."}
        else:
            count += 1
    else:
        # Reset window
        window_start = now
        count = 1
    reset_code = str(random.randint(100000, 999999))
    users_collection.update_one(
        {"id_number": data.id_number},
        {"$set": {
            "reset_code": reset_code,
            "reset_code_created": now,
            "forgot_pw_window_start": window_start,
            "forgot_pw_count": count
        }}
    )
    # Try sending the email and report status back to client
    email_ok = send_email(data.email, "Password Reset Code", f"Your reset code is: {reset_code}")
    if not email_ok:
        return {"success": False, "message": "Failed to send email. Please check your email address or try again later."}
    return {"success": True, "message": "Reset code sent to your email."}

@router.post("/api/confirm_reset_code")
async def confirm_reset_code(data: ConfirmResetCodeData):
    user = users_collection.find_one({"id_number": data.id_number, "email": data.email})
    if not user or user.get("reset_code") != data.reset_code:
        raise HTTPException(status_code=400, detail="Invalid reset code")
    # Optional: expire codes after 15 minutes
    created = user.get("reset_code_created")
    if created and isinstance(created, datetime):
        if datetime.utcnow() - created > timedelta(minutes=15):
            raise HTTPException(status_code=400, detail="Reset code expired. Please request a new one.")
    return {"success": True, "message": "Reset code confirmed. You can now reset your password."}

@router.post("/api/reset_password")
async def reset_password(data: ResetPasswordData):
    user = users_collection.find_one({"id_number": data.id_number})
    if user and user.get("reset_code") == data.reset_code:
        hashed_password = hash_password(data.new_password)
        users_collection.update_one(
            {"id_number": data.id_number},
            {"$set": {"password": hashed_password, "reset_code": None, "reset_code_created": None}}
        )
        return {"success": True, "message": "Password has been reset successfully."}
    raise HTTPException(status_code=400, detail="Invalid reset code")

@router.post("/api/first_password_change")
def first_password_change(payload: dict):
    """Change the auto-generated / initial password and clear mustChangePassword flag.
    Expects: { id_number, old_password, new_password }
    """
    id_number = payload.get("id_number")
    old_password = payload.get("old_password")
    new_password = payload.get("new_password")
    if not all([id_number, old_password, new_password]):
        raise HTTPException(status_code=400, detail="Missing required fields")
    user = users_collection.find_one({"id_number": id_number})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(old_password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Old password incorrect")
    if not user.get("mustChangePassword", False):
        return {"success": False, "message": "Password change not required."}
    hashed = hash_password(new_password)
    users_collection.update_one({"_id": user["_id"]}, {"$set": {"password": hashed, "mustChangePassword": False}})
    return {"success": True, "message": "Password updated. Continue to survey.", "surveyCompleted": user.get("surveyCompleted", False)}