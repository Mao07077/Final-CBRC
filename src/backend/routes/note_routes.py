from fastapi import APIRouter, HTTPException, Body
from models import SaveNoteRequest, UpdateNoteRequest, DeleteNoteRequest, NoteModel
from database import users_collection, notes_collection
from datetime import datetime

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
    # Normalize incoming note to dict and add timestamps if missing
    incoming = note if isinstance(note, dict) else {}
    if "_id" not in incoming:
        incoming["_id"] = str(int(datetime.utcnow().timestamp()*1000))
    now_iso = datetime.utcnow().isoformat()
    incoming.setdefault("created_at", now_iso)
    incoming["updated_at"] = now_iso
    notes.insert(0, incoming)
    users_collection.update_one({"id_number": id_number}, {"$set": {"notes": notes}})
    return {"success": True, "message": "Note saved successfully!"}

@router.post("/update_note")
async def update_note(req: UpdateNoteRequest):
    id_number = req.id_number
    index = req.index
    note = req.note
    # Use users_collection to keep notes in the same place as get/save
    user = users_collection.find_one({"id_number": id_number})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    notes = user.get("notes", [])
    if index < 0 or index >= len(notes):
        raise HTTPException(status_code=400, detail="Invalid note index")
    # Ensure we're storing plain dicts, not Pydantic models
    try:
        incoming = note.dict() if hasattr(note, "dict") else dict(note)
    except Exception:
        incoming = {"title": getattr(note, "title", None), "content": getattr(note, "content", None)}

    existing = notes[index] if isinstance(notes[index], dict) else {}
    # Merge to preserve fields like _id/created_at if they exist
    updated = {**existing, **incoming}
    # Touch updated_at
    updated["updated_at"] = datetime.utcnow().isoformat()
    notes[index] = updated
    users_collection.update_one(
        {"id_number": id_number},
        {"$set": {"notes": notes}}
    )
    return {"success": True}

@router.post("/delete_note")
async def delete_note(req: DeleteNoteRequest):
    id_number = req.id_number
    index = req.index
    # Use users_collection to keep notes in the same place as get/save
    user = users_collection.find_one({"id_number": id_number})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    notes = user.get("notes", [])
    if index < 0 or index >= len(notes):
        raise HTTPException(status_code=400, detail="Invalid note index")
    notes.pop(index)
    users_collection.update_one(
        {"id_number": id_number},
        {"$set": {"notes": notes}}
    )
    return {"success": True}