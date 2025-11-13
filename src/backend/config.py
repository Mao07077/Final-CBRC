import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging early
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Fetch core environment variables
MONGO_URI = os.getenv("MONGO_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME")
COLLECTION_NAME = os.getenv("COLLECTION_NAME")

# Email configuration (supports SMTP and API providers)
EMAIL_PROVIDER = (os.getenv("EMAIL_PROVIDER") or "").lower()  # "sendgrid" | "resend" | "" (smtp)
FROM_EMAIL = os.getenv("FROM_EMAIL")  # optional explicit from; falls back to EMAIL_HOST_USER

# SMTP settings
EMAIL_HOST = os.getenv("EMAIL_HOST")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 587))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")

# Provider API keys
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
RESEND_API_KEY = os.getenv("RESEND_API_KEY")

# Validate environment variables
if not all([MONGO_URI, DATABASE_NAME, COLLECTION_NAME]):
    logger.error("Missing MongoDB environment variables.")
    raise RuntimeError("Missing MongoDB environment variables.")

if EMAIL_PROVIDER in ("sendgrid", "resend"):
    # Validate API provider config
    if EMAIL_PROVIDER == "sendgrid" and not SENDGRID_API_KEY:
        logger.error("EMAIL_PROVIDER=sendgrid but SENDGRID_API_KEY is missing")
        raise RuntimeError("Missing SENDGRID_API_KEY for SendGrid email provider")
    if EMAIL_PROVIDER == "resend" and not RESEND_API_KEY:
        logger.error("EMAIL_PROVIDER=resend but RESEND_API_KEY is missing")
        raise RuntimeError("Missing RESEND_API_KEY for Resend email provider")
    if not (FROM_EMAIL or EMAIL_HOST_USER):
        logger.error("FROM_EMAIL or EMAIL_HOST_USER must be set for email provider sending")
        raise RuntimeError("Missing FROM_EMAIL (or EMAIL_HOST_USER) for email provider")
    # Advisory: Resend requires a verified domain-based sender address (no free webmail like Gmail/Yahoo)
    if EMAIL_PROVIDER == "resend" and FROM_EMAIL and any(FROM_EMAIL.lower().endswith(d) for d in ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"]):
        logger.warning(
            "FROM_EMAIL appears to be a free webmail address. Resend will reject emails unless you verify and use a domain-based sender (e.g., noreply@yourdomain.com)."
        )
else:
    # Validate SMTP config
    if not all([EMAIL_HOST, EMAIL_PORT, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD]):
        logger.error("Missing SMTP email environment variables.")
        raise RuntimeError("Missing SMTP email environment variables.")