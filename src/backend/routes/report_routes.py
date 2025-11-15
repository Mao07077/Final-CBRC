from bson import ObjectId

from fastapi import APIRouter, HTTPException, Query, Form, File, UploadFile, Path, Body
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
        "created_at": datetime.utcnow(),
        "status": "Pending",
        "archived": False,
        "feedback": None,
        "feedback_at": None,
        "feedback_read": False,
    }
    if screenshot:
        file_bytes = await screenshot.read()
        result = cloudinary.uploader.upload(io.BytesIO(file_bytes), folder="report_screenshots")
        report["screenshot_url"] = result["secure_url"]
    reports_collection.insert_one(report)
    return {"message": "Report submitted successfully!"}

@router.get("/api/reports", response_model=List[ReportResponse])
async def get_reports(search: Optional[str] = Query(None), status: Optional[str] = Query(None), id_number: Optional[str] = Query(None)):
    query = {"archived": {"$ne": True}}
    if search:
        query["$or"] = [
            {"id_number": {"$regex": search, "$options": "i"}},
            {"title": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}},
        ]
    if id_number:
        query["id_number"] = id_number
    if status and status != "All":
        query["status"] = status
    reports = list(reports_collection.find(query))
    resp: List[ReportResponse] = []
    for report in reports:
        # Prefer cloudinary URL if present; fallback to legacy filename
        screenshot_url = report.get("screenshot_url")
        if not screenshot_url and report.get("screenshot_filename"):
            screenshot_url = f"uploads/{report['screenshot_filename']}"

        resp.append(
            ReportResponse(
                id=str(report["_id"]),
                student=report.get("id_number", ""),
                issue=report.get("title", ""),
                date=report.get("created_at", "").strftime("%Y-%m-%d %H:%M") if report.get("created_at") else "",
                status=report.get("status", "Pending"),
                content=report.get("content"),
                screenshot=screenshot_url,
                feedback=report.get("feedback"),
                feedbackAt=report.get("feedback_at"),
                feedbackRead=report.get("feedback_read", False),
            )
        )
    return resp

@router.put("/api/reports/{report_id}/archive")
def archive_report(report_id: str = Path(...)):
    res = reports_collection.update_one({"_id": ObjectId(report_id)}, {"$set": {"archived": True}})
    if res.matched_count:
        return {"success": True}
    raise HTTPException(status_code=404, detail="Report not found")

@router.put("/api/reports/{report_id}/unarchive")
def unarchive_report(report_id: str = Path(...)):
    res = reports_collection.update_one({"_id": ObjectId(report_id)}, {"$set": {"archived": False}})
    if res.matched_count:
        return {"success": True}
    raise HTTPException(status_code=404, detail="Report not found")

@router.put("/api/reports/{report_id}/feedback")
def set_feedback(report_id: str = Path(...), feedback: str = Body(..., embed=True)):
    now = datetime.utcnow()
    res = reports_collection.update_one(
        {"_id": ObjectId(report_id)},
        {"$set": {"feedback": feedback, "feedback_at": now, "feedback_read": False}}
    )
    if res.matched_count:
        return {"success": True}
    raise HTTPException(status_code=404, detail="Report not found")

@router.put("/api/reports/{report_id}/feedback/read")
def mark_feedback_read(report_id: str = Path(...)):
    res = reports_collection.update_one({"_id": ObjectId(report_id)}, {"$set": {"feedback_read": True}})
    if res.matched_count:
        return {"success": True}
    raise HTTPException(status_code=404, detail="Report not found")