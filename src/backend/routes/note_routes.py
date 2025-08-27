from fastapi import APIRouter, HTTPException, Body
from models import SaveNoteRequest, UpdateNoteRequest, DeleteNoteRequest, NoteModel
from database import users_collection, notes_collection

router = APIRouter()

@router.get("/get_notes/{id_number}")
def get_notes(id_number: str):
    user = users_collection.find_one({"id_number": id_number})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    notes = user.get("notes", [])
    return {"notes": notes}

@router.post("/save_note")
def save_note(id_number: str = Body(...), note: dict = Body(...)):
    user = users_collection.find_one({"id_number": id_number})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    notes = user.get("notes", [])
    notes.insert(0, note)
    users_collection.update_one({"id_number": id_number}, {"$set": {"notes": notes}})
    return {"success": True, "message": "Note saved successfully!"}

@router.post("/update_note")
async def update_note(req: UpdateNoteRequest):
    id_number = req.id_number
    index = req.index
    note = req.note
    user = notes_collection.find_one({"id_number": id_number})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    notes = user.get("notes", [])
    if index < 0 or index >= len(notes):
        raise HTTPException(status_code=400, detail="Invalid note index")
    notes[index] = note
    notes_collection.update_one(
        {"id_number": id_number},
        {"$set": {"notes": notes}}
    )
    return {"success": True}

@router.post("/delete_note")
async def delete_note(req: DeleteNoteRequest):
    id_number = req.id_number
    index = req.index
    user = notes_collection.find_one({"id_number": id_number})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    notes = user.get("notes", [])
    if index < 0 or index >= len(notes):
        raise HTTPException(status_code=400, detail="Invalid note index")
    notes.pop(index)
    notes_collection.update_one(
        {"id_number": id_number},
        {"$set": {"notes": notes}}
    )
    return {"success": True}