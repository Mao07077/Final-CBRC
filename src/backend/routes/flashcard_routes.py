from fastapi import APIRouter, HTTPException
from database import flashcards_collection, modules_collection, users_collection
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
    
    modules_list = [
        {
            "_id": str(module["_id"]),
            "title": module["title"]
        }
        for module in modules
    ]
    
    return {
        "success": True,
        "modules": modules_list,
        "decks": decks
    }

            # This function retrieves flashcards for a specific module
@router.get("/api/flashcards/module/{module_id}")
def get_flashcards(module_id: str):
    flashcards = list(flashcards_collection.find({"module_id": module_id}))
            # This function generates flashcards based on a module's PDF
    return {"success": True, "flashcards": [{**flashcard, "_id": str(flashcard["_id"])} for flashcard in flashcards]}

