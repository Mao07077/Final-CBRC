import os
import requests
import re
from fastapi import APIRouter, HTTPException, Request

router = APIRouter()

def parse_flashcards(text: str):
    """
    Extract Q&A pairs from raw Gemini response text.
    Format expected: Q: ... A: ...
    """
    flashcards = []
    matches = re.findall(r"Q:\s*(.*?)\s*A:\s*(.*?)(?=\nQ:|\Z)", text, re.DOTALL)
    for q, a in matches:
        flashcards.append({
            "question": q.strip(),
            "answer": a.strip()
        })
    return flashcards

@router.post("/generate-flashcards")
async def generate_flashcards(request: Request):
    data = await request.json()
    text = data.get("text")
    num = data.get("num", 3)
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API key not set")

    endpoint = f"https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key={api_key}"
    prompt = f"Create {num} flashcards in Q&A format from this text:\n{text}"

    try:
        response = requests.post(
            endpoint,
            headers={"Content-Type": "application/json"},
            json={"contents": [{"parts": [{"text": prompt}]}]},
            timeout=60
        )

        print("[Gemini API] Status:", response.status_code)
        response.raise_for_status()

        result = response.json()
        raw_text = (
            result.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "")
        )

        flashcards = parse_flashcards(raw_text)
        return {"flashcards": flashcards}

    except Exception as e:
        print("[Gemini API] Exception:", str(e))
        raise HTTPException(status_code=500, detail=str(e))
