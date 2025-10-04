
from fastapi import APIRouter, HTTPException, Query, Form, File, UploadFile
from database import modules_collection, post_test_collection
from bson import ObjectId
from config import logger
import os
from typing import Optional
import re
import random
from textblob import TextBlob
import nltk
nltk.download('punkt', quiet=True)

router = APIRouter()

@router.post("/api/generate-flashcards/{module_id}")
def generate_flashcards_post(module_id: str, num_cards: int = 5):
    try:
        if not ObjectId.is_valid(module_id):
            logger.error(f"Invalid module ID format: {module_id}")
            raise HTTPException(status_code=400, detail="Invalid module ID format.")
        module = modules_collection.find_one({"_id": ObjectId(module_id)})
        if not module:
            logger.error(f"Module not found for ID: {module_id}")
            raise HTTPException(status_code=404, detail="Module not found")
        flashcards = []
        # Try to extract text from PDF if document_url exists
        pdf_text = ""
        if module.get("document_url") and module["document_url"].endswith(".pdf"):
            import requests
            from PyPDF2 import PdfReader
            try:
                response = requests.get(module["document_url"])
                response.raise_for_status()
                from io import BytesIO
                pdf_file = BytesIO(response.content)
                reader = PdfReader(pdf_file)
                for page in reader.pages:
                    pdf_text += page.extract_text() or ""
            except Exception as e:
                logger.error(f"PDF extraction failed: {e}")
        # Use PDF text if available, else fallback to description
        content_text = pdf_text if pdf_text.strip() else module.get("description", "")
        blob = TextBlob(content_text)
        sentences = blob.sentences
        # Add sentence-based cards
        for s in sentences:
            s_text = str(s)
            if len(s_text) > 20:
                flashcards.append({
                    "question": f"Explain: '{s_text[:40]}...'" if len(s_text) > 40 else f"Explain: '{s_text}'",
                    "answer": s_text
                })
        # Add noun phrase cards
        for np in blob.noun_phrases:
            if len(np) > 2:
                flashcards.append({
                    "question": f"What is '{np}'?",
                    "answer": f"'{np}' is mentioned in the module content."
                })
        # Fill with extra info if needed
        if len(flashcards) < num_cards:
            extra = [module.get("program", ""), module.get("id_number", "")]
            for e in extra:
                if e and len(flashcards) < num_cards:
                    flashcards.append({
                        "question": "Additional info:",
                        "answer": e
                    })
        # Limit to num_cards
        flashcards = flashcards[:num_cards]
        if not flashcards:
            flashcards = [{"question": "No content available.", "answer": "No content available."}]
        return {"flashcards": flashcards}
    except Exception as e:
        logger.error(f"Error in generate_flashcards_post: {e}")
        raise HTTPException(status_code=500, detail=f"Flashcard generation failed: {str(e)}")

@router.get("/api/instructor/modules")
def get_instructor_modules():
    modules = list(modules_collection.find({}))
    for module in modules:
        module["_id"] = str(module["_id"])
    return modules

# Edit (update) module endpoint
@router.put("/api/modules/{module_id}")
async def update_module(
    module_id: str,
    title: str = Form(...),
    topic: str = Form(...),
    description: str = Form(...),
    program: str = Form(...),
    id_number: str = Form(...),
    document: UploadFile = File(None),
    picture: UploadFile = File(None),
):
    try:
        update_data = {
            "title": title,
            "topic": topic,
            "description": description,
            "program": program,
            "id_number": id_number,
        }
        # If new document uploaded, upload to Cloudinary as raw (public PDF)
        if document:
            import cloudinary.uploader, io
            pdf_bytes = await document.read()
            filename = document.filename if document.filename.lower().endswith('.pdf') else document.filename + '.pdf'
            public_id = filename
            pdf_result = cloudinary.uploader.upload(
                io.BytesIO(pdf_bytes),
                folder="module_pdfs",
                resource_type="raw",
                public_id=public_id,
                format="pdf"
            )
            document_url = pdf_result["secure_url"] + '?attachment=false'
            update_data["document_url"] = document_url
        # If new picture uploaded, upload to Cloudinary
        if picture:
            import cloudinary.uploader, io
            picture_bytes = await picture.read()
            picture_result = cloudinary.uploader.upload(
                io.BytesIO(picture_bytes),
                folder="module_pics",
                type="upload",
                resource_type="auto"
            )
            picture_url = picture_result["secure_url"]
            update_data["image_url"] = picture_url
        result = modules_collection.update_one({"_id": ObjectId(module_id)}, {"$set": update_data})
        if result.modified_count > 0:
            return {"success": True, "message": "Module updated successfully!"}
        raise HTTPException(status_code=404, detail="Module not found or no changes made.")
    except Exception as e:
        logger.error(f"Error updating module: {e}")
        raise HTTPException(status_code=500, detail="Module update failed")

@router.post("/api/create_module")
async def create_module(
    title: str = Form(...),
    topic: str = Form(...),
    description: str = Form(...),
    program: str = Form(...),
    id_number: str = Form(...),
    document: UploadFile = File(...),
    picture: UploadFile = File(...),
):
    try:
        import cloudinary.uploader, io
        pdf_bytes = await document.read()
        filename = document.filename if document.filename.lower().endswith('.pdf') else document.filename + '.pdf'
        public_id = filename[:-4] if filename.lower().endswith('.pdf') else filename
        pdf_result = cloudinary.uploader.upload(
            io.BytesIO(pdf_bytes),
            folder="module_pdfs",
            resource_type="raw",
            public_id=public_id,
            format="pdf"
        )
        document_url = pdf_result["secure_url"] + '?attachment=false'

        picture_bytes = await picture.read()
        picture_result = cloudinary.uploader.upload(
            io.BytesIO(picture_bytes),
            folder="module_pics",
            type="upload",
            resource_type="auto"
        )
        picture_url = picture_result["secure_url"]

        module_data = {
            "title": title,
            "topic": topic,
            "description": description,
            "program": program,
            "id_number": id_number,
            "document_url": document_url,
            "image_url": picture_url,
        }
        result = modules_collection.insert_one(module_data)
        if result.inserted_id:
            return {
                "success": True,
                "message": "Module created successfully!",
                "module_id": str(result.inserted_id)
            }
        raise HTTPException(status_code=500, detail="Failed to create module")
    except Exception as e:
        logger.error(f"Error creating module: {e}")
        raise HTTPException(status_code=500, detail="Module creation failed")

@router.get("/api/modules")
def get_modules(program: Optional[str] = Query(None)):
    query = {}
    if program and program != "All Programs":
        query["program"] = program
    modules = list(modules_collection.find(query))
    for module in modules:
        module["_id"] = str(module["_id"])
    return modules

@router.get("/api/modules/{module_id}")
def get_module_by_id(module_id: str):
    try:
        module = modules_collection.find_one({"_id": ObjectId(module_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid module ID format")
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    module["_id"] = str(module["_id"])
    return module

@router.delete("/api/modules/{module_id}")
async def delete_module(module_id: str):
    try:
        if not ObjectId.is_valid(module_id):
            logger.error(f"Invalid module ID format: {module_id}")
            raise HTTPException(status_code=400, detail="Invalid module ID format.")
        delete_result = modules_collection.delete_one({"_id": ObjectId(module_id)})
        if delete_result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Module not found.")
        post_test_collection.delete_many({"module_id": module_id})
        return {"success": True, "message": "Module and associated post-tests deleted successfully!"}
    except Exception as e:
        logger.error(f"Error deleting module with ID {module_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete module.")