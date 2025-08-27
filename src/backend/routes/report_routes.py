from bson import ObjectId

from fastapi import APIRouter, HTTPException, Query, Form, File, UploadFile, Path
router = APIRouter()
from models import ReportResponse
from database import reports_collection
from typing import Optional, List
import io
import cloudinary
import cloudinary.uploader
import os
import shutil
from datetime import datetime


cloudinary.config(
    cloud_name = 'dvdsn3v1l',
    api_key = '268751277619354',
    api_secret = 'd9aIRSb6pS083AiBpWRd-EAF62Y'
)

@router.post("/api/reports")
async def submit_report(
    id_number: str = Form(...),
    title: str = Form(...),
    content: str = Form(...),
    screenshot: Optional[UploadFile] = File(None)
):
    report = {
        "id_number": id_number,
        "title": title,
        "content": content,
        "created_at": datetime.utcnow()
    }
    if screenshot:
        file_bytes = await screenshot.read()
        result = cloudinary.uploader.upload(io.BytesIO(file_bytes), folder="report_screenshots")
        report["screenshot_url"] = result["secure_url"]
    reports_collection.insert_one(report)
    return {"message": "Report submitted successfully!"}

@router.get("/api/reports", response_model=List[ReportResponse])
async def get_reports(search: Optional[str] = Query(None), status: Optional[str] = Query(None)):
    query = {}
    if search:
        query["$or"] = [
            {"id_number": {"$regex": search, "$options": "i"}},
            {"title": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}},
        ]
    if status and status != "All":
        query["status"] = status
    reports = list(reports_collection.find(query))
    return [
        ReportResponse(
            id=str(report["_id"]),
            student=report.get("id_number", ""),
            issue=report.get("title", ""),
            date=report.get("created_at", "").strftime("%Y-%m-%d %H:%M") if report.get("created_at") else "",
            status=report.get("status", "Pending"),
            content=report.get("content"),
            screenshot=f"uploads/{report['screenshot_filename']}" if report.get("screenshot_filename") else None,
        ) for report in reports
    ]

@router.delete("/api/reports/{report_id}")
def delete_report(report_id: str = Path(...)):
    result = reports_collection.delete_one({"_id": ObjectId(report_id)})
    if result.deleted_count == 1:
        return {"success": True, "message": "Report deleted successfully."}
    raise HTTPException(status_code=404, detail="Report not found")