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

@router.get("/api/flashcards/module/{module_id}")
def get_flashcards(module_id: str):
    flashcards = list(flashcards_collection.find({"module_id": module_id}))
    return {"success": True, "flashcards": [{**flashcard, "_id": str(flashcard["_id"])} for flashcard in flashcards]}

@router.post("/api/generate-flashcards/{module_id}")
async def generate_flashcards(module_id: str):
    if not ObjectId.is_valid(module_id):
        raise HTTPException(status_code=400, detail="Invalid module ID format")
    existing_flashcards = list(flashcards_collection.find({"module_id": module_id}))
    if existing_flashcards:
        return {
            "success": True,
            "flashcards": [{**flashcard, "_id": str(flashcard["_id"])} for flashcard in existing_flashcards]
        }
    try:
        module = modules_collection.find_one({"_id": ObjectId(module_id)})
        if not module:
            raise HTTPException(status_code=404, detail="Module not found")
        document_url = module.get("document_url")
        if not document_url or not document_url.endswith(".pdf"):
            raise HTTPException(status_code=400, detail="No valid PDF found for this module")
        pdf_text = module.get("cached_text")
        if not pdf_text:
            pdf_text = extract_text_from_pdf(document_url)
            if not pdf_text.strip():
                raise HTTPException(status_code=400, detail="No text extracted from PDF")
            modules_collection.update_one(
                {"_id": ObjectId(module_id)},
                {"$set": {"cached_text": pdf_text}}
            )
        new_flashcards = await generate_flashcards_with_ollama(pdf_text, module_id)
        if not new_flashcards:
            logger.warning(f"Ollama failed, falling back to text-based flashcard generation for module {module_id}")
            new_flashcards = generate_flashcards_from_text(pdf_text, module_id)
        if not new_flashcards or len(new_flashcards) < 10:
            raise HTTPException(status_code=400, detail="Could not generate 10 flashcards")
        flashcard_dicts = [flashcard.dict() for flashcard in new_flashcards]
        flashcards_collection.insert_many(flashcard_dicts)
        saved_flashcards = list(flashcards_collection.find({"module_id": module_id}))
        return {
            "success": True,
            "flashcards": [{**flashcard, "_id": str(flashcard["_id"])} for flashcard in saved_flashcards]
        }
    except Exception as e:
        logger.error(f"Error generating flashcards for module {module_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating flashcards: {str(e)}")