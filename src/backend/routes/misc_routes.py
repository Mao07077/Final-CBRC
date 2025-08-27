from fastapi import APIRouter, HTTPException
from database import client
from config import logger

router = APIRouter()

@router.get("/")
def root():
    return {"message": "FastAPI Backend is Running!"}

@router.get("/api/status")
async def health_check():
    try:
        client.admin.command('ping')
        return {"success": True, "message": "API and database are operational."}
    except Exception as e:
        logger.error(f"Database connection issue: {e}")
        raise HTTPException(status_code=500, detail="Database connection failed.")