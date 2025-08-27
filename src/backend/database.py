from pymongo import MongoClient
import certifi
from config import MONGO_URI, DATABASE_NAME, COLLECTION_NAME, logger

# MongoDB setup with SSL
try:
    client = MongoClient(MONGO_URI, tls=True, tlsCAFile=certifi.where())
    client.admin.command('ping')
    logger.info("MongoDB connection successful")
except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {e}")
    raise RuntimeError(f"Failed to connect to MongoDB: {e}")

# Database collections
db = client[DATABASE_NAME]
users_collection = db[COLLECTION_NAME]
modules_collection = db["modules"]
pre_test_collection = db["pre_tests"]
post_test_collection = db["post_tests"]
scores_collection = db["scores"]
playlists_collection = db["playlists"]
user_playlists_collection = db["user_playlists"]
flashcards_collection = db["flashcards"]
request_collection = db["requests"]
messages_collection = db["messages"]
schedule_collection = db["schedules"]
notes_collection = db["notes"]
calls_collection = db["calls"]
posts_collection = db["posts"]
reports_collection = db["reports"]
study_groups_collection = db["study_groups"]

# Getter functions for collections
def get_user_collection():
    return users_collection

def get_module_sessions_collection():
    return modules_collection

def get_message_collection():
    return messages_collection

def get_reports_collection():
    return reports_collection