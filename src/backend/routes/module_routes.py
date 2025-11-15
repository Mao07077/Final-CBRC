
from fastapi import APIRouter, HTTPException, Query, Form, File, UploadFile
from database import modules_collection, post_test_collection, flashcards_collection, db
from bson import ObjectId
from config import logger
from datetime import datetime
import os
from typing import Optional
import re
import random
from textblob import TextBlob, download_corpora
import nltk
nltk.download('punkt', quiet=True)
# Automatically download TextBlob corpora if missing
try:
    download_corpora.download_all()
except Exception as e:
    print(f"TextBlob corpora download error: {e}")

router = APIRouter()

@router.post("/api/generate-flashcards/{module_id}")
def generate_flashcards_post(module_id: str, num_cards: int = 5, generated_by: str = None):
    try:
        if not ObjectId.is_valid(module_id):
            logger.error(f"Invalid module ID format: {module_id}")
            raise HTTPException(status_code=400, detail="Invalid module ID format.")
        module = modules_collection.find_one({"_id": ObjectId(module_id)})
        if not module:
            logger.error(f"Module not found for ID: {module_id}")
            raise HTTPException(status_code=404, detail="Module not found")
        flashcards = []
        # Only extract text from PDF if document_url exists and is a PDF
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
                raise HTTPException(status_code=500, detail=f"PDF extraction failed: {e}")
        else:
            logger.error("No PDF file found for module.")
            raise HTTPException(status_code=400, detail="No PDF file found for module.")
        # If PDF text is empty, return error
        if not pdf_text.strip():
            logger.error("PDF file is empty or unreadable.")
            raise HTTPException(status_code=400, detail="PDF file is empty or unreadable.")
        # Generate flashcards only from PDF text
        blob = TextBlob(pdf_text)
        sentences = blob.sentences
        for s in sentences:
            s_text = str(s)
            if len(s_text) > 20:
                flashcards.append({
                    "question": f"Explain: '{s_text[:40]}...'" if len(s_text) > 40 else f"Explain: '{s_text}'",
                    "answer": s_text
                })
        for np in blob.noun_phrases:
            if len(np) > 2:
                flashcards.append({
                    "question": f"What is '{np}'?",
                    "answer": f"'{np}' is mentioned in the module content."
                })
        # Limit to num_cards
        flashcards = flashcards[:num_cards]
        if not flashcards:
            flashcards = [{"question": "No content available in PDF.", "answer": "No content available in PDF."}]

        # Persist generated flashcards into the flashcards collection for monitoring/usage
        try:
            inserted_ids = []
            now = datetime.utcnow()
            for fc in flashcards:
                doc = {
                    "module_id": module_id,
                    "question": fc.get("question"),
                    "answer": fc.get("answer"),
                    "created_at": now,
                    "source": "generated_via_endpoint",
                    "generated_by": generated_by
                }
                res = flashcards_collection.insert_one(doc)
                inserted_ids.append(str(res.inserted_id))

            # Write an audit/log entry for monitoring
            try:
                gen_log = {
                    "module_id": module_id,
                    "module_title": module.get("title"),
                    "module_topic": module.get("topic"),
                    "generated_by": generated_by,
                    "generated_count": len(inserted_ids),
                    "inserted_ids": inserted_ids,
                    "timestamp": now
                }
                db["flashcard_generation_logs"].insert_one(gen_log)
            except Exception as e:
                logger.error(f"Failed to write flashcard generation log: {e}")

        except Exception as e:
            logger.error(f"Failed to persist generated flashcards: {e}")

        return {"flashcards": flashcards, "inserted_ids": inserted_ids}
    except Exception as e:
        logger.error(f"Error in generate_flashcards_post: {e}")
        raise HTTPException(status_code=500, detail=f"Flashcard generation failed: {str(e)}")

@router.get("/api/instructor/modules")
def get_instructor_modules():
    modules = list(modules_collection.find({}))
    for module in modules:
        module["_id"] = str(module["_id"])
    return modules

# New: Get modules assigned to a specific instructor (by id_number)
@router.get("/api/instructor/assigned-modules")
def get_instructor_assigned_modules(instructor_id: str = Query(...)):
    try:
        query = {
            "$and": [
                {"archived": {"$ne": True}},
                {"$or": [
                    {"assigned_instructor_ids": instructor_id},
                    {"assigned_instructor_ids": {"$elemMatch": {"$eq": instructor_id}}},
                ]}
            ]
        }
        modules = list(modules_collection.find(query))
        for module in modules:
            module["_id"] = str(module["_id"])
        return modules
    except Exception as e:
        logger.error(f"Error fetching assigned modules for instructor {instructor_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch assigned modules")

# Edit (update) module endpoint
@router.put("/api/modules/{module_id}")
async def update_module(
    module_id: str,
    title: str = Form(...),
    topic: str = Form(...),
    description: str = Form(...),
    program: str = Form(...),
    id_number: str = Form(...),
    assigned_instructor_ids: Optional[str] = Form(None),  # comma-separated id_numbers
    publish_at: Optional[str] = Form(None),
    is_published: Optional[bool] = Form(None),
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
        # Optional: assignment and scheduling
        if assigned_instructor_ids is not None:
            try:
                lst = [s.strip() for s in assigned_instructor_ids.split(',') if s.strip()]
            except Exception:
                lst = []
            update_data["assigned_instructor_ids"] = lst
        # publish_at and is_published
        if publish_at:
            try:
                # Expect ISO string
                dt = datetime.fromisoformat(publish_at.replace('Z', '+00:00'))
                update_data["publish_at"] = dt
            except Exception:
                logger.warning(f"Invalid publish_at format provided: {publish_at}")
        if is_published is not None:
            update_data["is_published"] = bool(is_published)
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
    assigned_instructor_ids: Optional[str] = Form(None),  # comma-separated id_numbers
    publish_at: Optional[str] = Form(None),
    is_published: Optional[bool] = Form(None),
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
            "id_number": id_number,  # creator id (admin/instructor)
            "document_url": document_url,
            "image_url": picture_url,
        }
        # Assignment
        try:
            if assigned_instructor_ids:
                module_data["assigned_instructor_ids"] = [s.strip() for s in assigned_instructor_ids.split(',') if s.strip()]
        except Exception:
            module_data["assigned_instructor_ids"] = []
        # Scheduling flags
        publish_dt = None
        if publish_at:
            try:
                publish_dt = datetime.fromisoformat(publish_at.replace('Z', '+00:00'))
            except Exception:
                logger.warning(f"Invalid publish_at format provided: {publish_at}")
        if publish_dt:
            module_data["publish_at"] = publish_dt
        # Default visibility: if explicitly set, honor; else treat as published when no scheduling provided
        if is_published is not None:
            module_data["is_published"] = bool(is_published)
        else:
            # Default: modules are NOT published until explicitly scheduled or published
            module_data["is_published"] = False
        module_data["archived"] = False
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
        return {"success": True, "message": "Module hard-deleted; prefer using archive endpoint for reversible removal."}
    except Exception as e:
        logger.error(f"Error deleting module with ID {module_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete module.")

# --- New: Assign instructors to a module ---
@router.put("/api/modules/{module_id}/assign")
async def assign_instructors(module_id: str, assigned_instructor_ids: str = Form(...)):
    try:
        if not ObjectId.is_valid(module_id):
            raise HTTPException(status_code=400, detail="Invalid module ID format.")
        lst = [s.strip() for s in assigned_instructor_ids.split(',') if s.strip()]
        res = modules_collection.update_one(
            {"_id": ObjectId(module_id)},
            {"$set": {"assigned_instructor_ids": lst}}
        )
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Module not found.")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error assigning instructors for module {module_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to assign instructors")

# --- New: Schedule module publish (set a future datetime) ---
@router.put("/api/modules/{module_id}/schedule")
async def schedule_publish(module_id: str, publish_at: str = Form(...)):
    try:
        if not ObjectId.is_valid(module_id):
            raise HTTPException(status_code=400, detail="Invalid module ID format.")
        try:
            dt = datetime.fromisoformat(publish_at.replace('Z', '+00:00'))
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid publish_at datetime format. Use ISO 8601.")
        res = modules_collection.update_one(
            {"_id": ObjectId(module_id)},
            {"$set": {"publish_at": dt, "is_published": False}}
        )
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Module not found.")
        return {"success": True, "publish_at": dt.isoformat()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error scheduling publish for module {module_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to schedule module publish")

# --- New: Publish module immediately ---
@router.post("/api/modules/{module_id}/publish-now")
async def publish_now(module_id: str):
    try:
        if not ObjectId.is_valid(module_id):
            raise HTTPException(status_code=400, detail="Invalid module ID format.")
        now = datetime.utcnow()
        res = modules_collection.update_one(
            {"_id": ObjectId(module_id)},
            {"$set": {"is_published": True, "publish_at": now}}
        )
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Module not found.")
        return {"success": True, "published_at": now.isoformat()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error publishing module {module_id} now: {e}")
        raise HTTPException(status_code=500, detail="Failed to publish module")

# --- New: Admin batch create modules ---
@router.post("/api/admin/modules/batch_create")
async def batch_create_modules(
    titles: list[str] = Form(...),
    topics: list[str] = Form(...),
    descriptions: list[str] = Form(...),
    programs: list[str] = Form(...),
    id_number: str = Form(...),  # creator (admin)
    assigned_instructor_ids: Optional[list[str]] = Form(None),  # parallel arrays of comma-separated strings
    publish_ats: Optional[list[str]] = Form(None),
    is_published_list: Optional[list[bool]] = Form(None),
    documents: list[UploadFile] = File(...),
    pictures: list[UploadFile] = File(...),
):
    try:
        import cloudinary.uploader, io
        n = len(titles)
        if not (len(topics) == len(descriptions) == len(programs) == len(documents) == len(pictures) == n):
            raise HTTPException(status_code=400, detail="All lists must have the same length")
        docs = []
        for i in range(n):
            # Upload document
            pdf_bytes = await documents[i].read()
            filename = documents[i].filename if documents[i].filename.lower().endswith('.pdf') else documents[i].filename + '.pdf'
            public_id = filename[:-4] if filename.lower().endswith('.pdf') else filename
            pdf_result = cloudinary.uploader.upload(
                io.BytesIO(pdf_bytes),
                folder="module_pdfs",
                resource_type="raw",
                public_id=public_id,
                format="pdf"
            )
            document_url = pdf_result["secure_url"] + '?attachment=false'
            # Upload picture
            picture_bytes = await pictures[i].read()
            picture_result = cloudinary.uploader.upload(
                io.BytesIO(picture_bytes),
                folder="module_pics",
                type="upload",
                resource_type="auto"
            )
            picture_url = picture_result["secure_url"]

            module_data = {
                "title": titles[i],
                "topic": topics[i],
                "description": descriptions[i],
                "program": programs[i],
                "id_number": id_number,
                "document_url": document_url,
                "image_url": picture_url,
            }
            # Assignment per index
            if assigned_instructor_ids and i < len(assigned_instructor_ids) and assigned_instructor_ids[i]:
                module_data["assigned_instructor_ids"] = [s.strip() for s in assigned_instructor_ids[i].split(',') if s.strip()]
            # Scheduling per index
            publish_dt = None
            if publish_ats and i < len(publish_ats) and publish_ats[i]:
                try:
                    publish_dt = datetime.fromisoformat(publish_ats[i].replace('Z', '+00:00'))
                except Exception:
                    logger.warning(f"Invalid publish_at format provided at index {i}: {publish_ats[i]}")
            if publish_dt:
                module_data["publish_at"] = publish_dt
            if is_published_list and i < len(is_published_list) and is_published_list[i] is not None:
                module_data["is_published"] = bool(is_published_list[i])
            else:
                # Default: not published until explicitly published or time reached
                module_data["is_published"] = False
            module_data["archived"] = False

            docs.append(module_data)

        res = modules_collection.insert_many(docs)
        return {"success": True, "inserted_ids": [str(x) for x in res.inserted_ids]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in batch_create_modules: {e}")
        raise HTTPException(status_code=500, detail="Batch module creation failed")

# --- Archive / Unarchive endpoints ---
@router.put("/api/modules/{module_id}/archive")
async def archive_module(module_id: str):
    try:
        if not ObjectId.is_valid(module_id):
            raise HTTPException(status_code=400, detail="Invalid module ID format.")
        res = modules_collection.update_one({"_id": ObjectId(module_id)}, {"$set": {"archived": True}})
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Module not found.")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error archiving module {module_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to archive module")

@router.put("/api/modules/{module_id}/unarchive")
async def unarchive_module(module_id: str):
    try:
        if not ObjectId.is_valid(module_id):
            raise HTTPException(status_code=400, detail="Invalid module ID format.")
        res = modules_collection.update_one({"_id": ObjectId(module_id)}, {"$set": {"archived": False}})
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Module not found.")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unarchiving module {module_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to unarchive module")