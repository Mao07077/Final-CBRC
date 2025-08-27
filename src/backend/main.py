from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from apscheduler.schedulers.background import BackgroundScheduler
from config import logger
from database import users_collection, schedule_collection
from utils import check_schedule_and_notify
import os

# FastAPI app setup
app = FastAPI(title="CBRCS API", description="CBRC Students Platform API", version="1.0.0")

# Mount static files
app.mount("/uploads", StaticFiles(directory=os.path.abspath("uploads")), name="uploads")
app.mount("/static/picture", StaticFiles(directory=os.path.abspath("picture")), name="picture")

# Get CORS origins from environment variable or use defaults
cors_origins_env = os.getenv("CORS_ORIGINS", 
    "http://localhost:3000,http://localhost:5173,http://localhost:5174,http://127.0.0.1:3000,http://127.0.0.1:5173,http://127.0.0.1:5174"
)
cors_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

# Add production origins (excluding wildcard patterns)
cors_origins.extend([
    "https://cbrcs-final.vercel.app",
    "https://cbrcs.vercel.app",
    "https://cbrcs-git-aaron-maos-projects-a7ae5dee.vercel.app",
    "http://frontend",  # Docker service name
    "http://localhost",  # Docker frontend
])

# Remove duplicates and filter out empty strings
cors_origins = list(set([origin for origin in cors_origins if origin and not origin.startswith("https://*")]))

# CORS middleware with regex for Vercel subdomains
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Scheduler setup
scheduler = BackgroundScheduler()
scheduler.add_job(lambda: check_schedule_and_notify(users_collection, schedule_collection), 'interval', minutes=1)

# Add cleanup job for inactive study groups (runs every 5 minutes)
def cleanup_inactive_study_groups():
    try:
        from database import study_groups_collection
        from datetime import datetime, timedelta
        
        # Find groups that are older than 10 minutes with no active participants
        cutoff_time = datetime.utcnow() - timedelta(minutes=10)
        
        # More comprehensive query - find truly inactive groups
        inactive_groups = study_groups_collection.find({
            "is_session_active": True,
            "last_activity": {"$lt": cutoff_time},
            "$or": [
                {"active_participants": {"$size": 0}},
                {"active_participants": {"$exists": False}},
                {"active_participants": []}  # Explicitly empty array
            ]
        })
        
        deleted_count = 0
        deleted_groups = []
        
        for group in inactive_groups:
            # Triple check - make sure it's really been 10 minutes and no participants
            participants = group.get("active_participants", [])
            last_activity = group.get("last_activity")
            
            if len(participants) == 0 and last_activity and last_activity < cutoff_time:
                result = study_groups_collection.delete_one({"_id": group["_id"]})
                if result.deleted_count > 0:
                    deleted_count += 1
                    group_info = {
                        "title": group.get('title', 'Unknown'),
                        "id": str(group['_id']),
                        "last_activity": last_activity.isoformat() if last_activity else "N/A"
                    }
                    deleted_groups.append(group_info)
                    print(f"🗑️ Auto-deleted inactive group: {group_info['title']} (ID: {group_info['id']}) - Empty for 10+ minutes")
        
        if deleted_count > 0:
            logger.info(f"🧹 Cleaned up {deleted_count} inactive study groups: {[g['title'] for g in deleted_groups]}")
        else:
            print("✅ No inactive groups found for cleanup")
            
    except Exception as e:
        logger.error(f"❌ Error in cleanup job: {str(e)}")

scheduler.add_job(cleanup_inactive_study_groups, 'interval', minutes=5)

# Import and register routes
from routes.auth_routes import router as auth_router
from routes.profile_routes import router as profile_router
from routes.module_routes import router as module_router
from routes.test_routes import router as test_router
from routes.dashboard_routes import router as dashboard_router
from routes.note_routes import router as note_router
from routes.report_routes import router as report_router
from routes.flashcard_routes import router as flashcard_router
from routes.survey_routes import router as survey_router
from routes.message_routes import router as message_router
from routes.account_routes import router as account_router
from routes.schedule_routes import router as schedule_router
from routes.post_routes import router as post_router
from routes.websocket_routes import router as websocket_router
from routes.misc_routes import router as misc_router
from routes.study_group_routes import router as study_group_router
from routes.music_routes import router as music_router
from routes.landing_routes import router as landing_router
from routes.instructor_routes import router as instructor_router
from routes.admin_routes import router as admin_router

app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(module_router)
app.include_router(test_router)
app.include_router(dashboard_router)
app.include_router(note_router)
app.include_router(report_router)
app.include_router(flashcard_router)
app.include_router(survey_router)
app.include_router(message_router)
app.include_router(account_router)
app.include_router(schedule_router)
app.include_router(post_router)
app.include_router(websocket_router)
app.include_router(misc_router)
app.include_router(study_group_router)
app.include_router(music_router)
app.include_router(landing_router)
app.include_router(instructor_router)
app.include_router(admin_router)

# Health check endpoint for Docker
@app.get("/health")
async def health_check():
    """Health check endpoint for Docker and monitoring"""
    try:
        # Test database connection
        users_collection.find_one({})
        return {
            "status": "healthy",
            "message": "API is running and database is accessible",
            "version": "1.0.0"
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Service unavailable")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "CBRCS API is running",
        "docs": "/docs",
        "health": "/health"
    }

@app.on_event("startup")
async def startup_event():
    if not scheduler.running:
        logger.info("FastAPI app has started. Scheduler will now check schedules every minute.")
        scheduler.start()
    else:
        logger.info("Scheduler is already running.")

if __name__ == "__main__":
    import uvicorn
    # Use environment variables for host and port, with defaults
    host = os.getenv("HOST", "0.0.0.0")  # Changed to 0.0.0.0 for Docker
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host=host, port=port)