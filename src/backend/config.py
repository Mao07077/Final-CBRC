import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Fetch environment variables
MONGO_URI = os.getenv("MONGO_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME")
COLLECTION_NAME = os.getenv("COLLECTION_NAME")
EMAIL_HOST = os.getenv("EMAIL_HOST")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 587))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")

# Validate environment variables
if not all([MONGO_URI, DATABASE_NAME, COLLECTION_NAME]):
    logging.error("Missing MongoDB environment variables.")
    raise RuntimeError("Missing MongoDB environment variables.")
if not all([EMAIL_HOST, EMAIL_PORT, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD]):
    logging.error("Missing email environment variables.")
    raise RuntimeError("Missing email environment variables.")

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)