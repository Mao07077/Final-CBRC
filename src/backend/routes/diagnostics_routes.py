from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from utils import send_email, last_scheduler_run, reminder_emails_sent_success, reminder_emails_failed
from config import EMAIL_HOST, EMAIL_PORT, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD
import socket
import ssl

router = APIRouter()

@router.get("/api/diagnostics/email-config")
def email_config_status():
    """Return sanitized email configuration to verify env is loaded."""
    try:
        return {
            "success": True,
            "config": {
                "host": EMAIL_HOST,
                "port": EMAIL_PORT,
                "user": EMAIL_HOST_USER,
                "has_password": bool(EMAIL_HOST_PASSWORD),
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Config error: {e}")

@router.get("/api/diagnostics/email-connectivity")
def email_connectivity():
    """Try plain TCP connect to 587 and 465 to detect egress blocks."""
    results = {}
    for host, port in [(EMAIL_HOST, EMAIL_PORT or 587), (EMAIL_HOST, 465)]:
        key = f"{host}:{port}"
        try:
            with socket.create_connection((host, int(port)), timeout=8) as s:
                if int(port) == 465:
                    ctx = ssl.create_default_context()
                    with ctx.wrap_socket(s, server_hostname=host) as ss:
                        results[key] = "connect_ok_tls"
                else:
                    results[key] = "connect_ok"
        except Exception as e:
            results[key] = f"connect_error: {repr(e)}"

    return {
        "success": True,
        "connectivity": results
    }

@router.get("/api/diagnostics/email-test")
def email_test(to: str = Query(..., description="Destination email address")):
    """Attempt to send a simple test email using current SMTP config."""
    try:
        ok = send_email(to, "CBRC Email Test", "This is a test email from CBRC diagnostics endpoint.")
        return {"success": ok}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Email test error: {e}")

@router.get("/api/diagnostics/scheduler")
def scheduler_diag():
    """Expose scheduler metrics tracked in utils."""
    return {
        "success": True,
        "last_scheduler_run": last_scheduler_run.isoformat() if last_scheduler_run else None,
        "reminder_emails": {
            "sent_success": reminder_emails_sent_success,
            "sent_failed": reminder_emails_failed,
        }
    }
