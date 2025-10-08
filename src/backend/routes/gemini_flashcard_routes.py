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

    # ✅ Use the updated Gemini endpoint
    endpoint = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={api_key}"

    prompt = f"Create {num} flashcards in Q&A format from this text:\n{text}"

    try:
        response = requests.post(
            endpoint,
            headers={"Content-Type": "application/json"},
            json={"contents": [{"parts": [{"text": prompt}]}]},
            timeout=60
        )

        print("[Gemini API] Status:", response.status_code)
        print("[Gemini API] Response:", response.text)
        response.raise_for_status()

        return response.json()

    except Exception as e:
        print("[Gemini API] Exception:", str(e))
        raise HTTPException(status_code=500, detail=str(e))
