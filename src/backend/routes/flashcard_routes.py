from fastapi import APIRouter, HTTPException
from database import flashcards_collection, modules_collection, users_collection, db
from utils import extract_text_from_pdf, generate_flashcards_with_ollama, generate_flashcards_from_text
from bson import ObjectId
from config import logger

router = APIRouter()

@router.get("/api/flashcards/{user_id}")
def get_user_flashcards(user_id: str):
    # Get user to find their program
    user = users_collection.find_one({"id_number": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    program = user.get("program", "All Programs")
    
    # Get modules for user's program
    query = {}
    if program and program != "All Programs":
        query["program"] = program
    
    modules = list(modules_collection.find(query))
    
    # Get flashcards for each module
    decks = {}
    for module in modules:
        module_id = str(module["_id"])
        flashcards = list(flashcards_collection.find({"module_id": module_id}))
        decks[module_id] = [
            {
                "id": str(flashcard["_id"]),
                "question": flashcard.get("question", ""),
                "answer": flashcard.get("answer", "")
            }
            for flashcard in flashcards
        ]
    
    # Compute per-module generation attempt counts for this user
    generation_counts = {}
    try:
        pipeline = [
            {"$match": {"generated_by": user_id}},
            {"$group": {"_id": "$module_id", "count": {"$sum": 1}}}
        ]
        for row in db["flashcard_generation_logs"].aggregate(pipeline):
            mid = row.get("_id")
            if mid:
                generation_counts[mid] = row.get("count", 0)
    except Exception as e:
        logger.error("Failed to aggregate flashcard generation counts: %s", e)

    modules_list = []
    for module in modules:
        m = dict(module)
        m["_id"] = str(m["_id"])
        # Optionally, remove MongoDB ObjectId fields from nested objects if any
        modules_list.append(m)
    return {
        "success": True,
        "modules": modules_list,
        "decks": decks,
        "generationCounts": generation_counts
    }

            # This function retrieves flashcards for a specific module
@router.get("/api/flashcards/module/{module_id}")
def get_flashcards(module_id: str):
    flashcards = list(flashcards_collection.find({"module_id": module_id}))
            # This function generates flashcards based on a module's PDF
    return {"success": True, "flashcards": [{**flashcard, "_id": str(flashcard["_id"])} for flashcard in flashcards]}

