from fastapi import APIRouter, HTTPException, Query, Form, File, UploadFile
from database import modules_collection, post_test_collection
from bson import ObjectId
from config import logger
import os
from typing import Optional
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

router = APIRouter()

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

from fastapi import APIRouter, HTTPException, Query, Form, File, UploadFile
from database import modules_collection, post_test_collection
from bson import ObjectId
from config import logger
import os
from typing import Optional
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google_auth_oauthlib.flow import InstalledAppFlow



SCOPES = ['https://www.googleapis.com/auth/drive.file']
CREDENTIALS_FILE = 'client_secret.json'  # Use OAuth2 client secret file
DRIVE_FOLDER_ID = '1KvA0Z0PJ_1n1YN0zRhI8FKfgbt7YayGm'  # Your shared folder ID


router = APIRouter()
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
        # If new document uploaded, upload to Drive
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

def authenticate_drive():
    flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
    creds = flow.run_local_server(port=0)
    return creds

def upload_pdf_to_drive(file_path, creds):
    service = build('drive', 'v3', credentials=creds)
    file_metadata = {
        'name': os.path.basename(file_path),
        'parents': [DRIVE_FOLDER_ID]
    }
    media = MediaFileUpload(file_path, mimetype='application/pdf')
    file = service.files().create(body=file_metadata, media_body=media, fields='id').execute()
    # Make file public
    service.permissions().create(fileId=file['id'], body={'role': 'reader', 'type': 'anyone'}).execute()
    link = f"https://drive.google.com/file/d/{file['id']}/view?usp=sharing"
    return link

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
        # Upload PDF to Cloudinary as raw (public PDF)
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

        # Upload picture to Cloudinary (keep existing logic)
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