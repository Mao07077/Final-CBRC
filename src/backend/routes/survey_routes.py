from fastapi import APIRouter, HTTPException, Body
from database import users_collection

router = APIRouter()

@router.post("/submit-survey")
def submit_survey(data: dict = Body(...)):
    id_number = data.get("id_number")
    categoryScores = data.get("categoryScores", {})
    top3Habits = data.get("top3Habits", [])
    surveyCompleted = data.get("surveyCompleted", False)
    user = users_collection.find_one({"id_number": id_number})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    users_collection.update_one(
        {"id_number": id_number},
        {
            "$set": {
                "surveyCompleted": surveyCompleted,
                "categoryScores": categoryScores,
                "top3Habits": top3Habits,
            }
        }
    )
    return {"success": True, "message": "Survey submitted successfully!"}