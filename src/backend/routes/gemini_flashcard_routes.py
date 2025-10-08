import os
import requests
from fastapi import APIRouter, HTTPException, Request

router = APIRouter()

@router.post("/generate-flashcards")
async def generate_flashcards(request: Request):
    data = await request.json()
    text = data.get("text")
    num = data.get("num", 3)
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API key not set")
    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}"
    prompt = f"Create {num} flashcards in Q&A format from this text:\n{text}"
    try:
        response = requests.post(
            endpoint.strip(),
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{"parts": [{"text": prompt}]}]
            }
        )
        # Debug logging: print status and response body
        print("[Gemini API] Status:", response.status_code)
        print("[Gemini API] Response:", response.text)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        # Print the error for debugging
        print("[Gemini API] Exception:", str(e))
        raise HTTPException(status_code=500, detail=str(e))
