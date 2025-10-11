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
    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise HTTPException(status_code=500, detail="Groq API key not set")

    endpoint = "https://api.groq.com/openai/v1/chat/completions"
    prompt = f"Create {num} flashcards in Q&A format from this text. Format each as 'Q: ... A: ...':\n{text}"

    try:
        response = requests.post(
            endpoint,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            },
            json={
                "model": "llama-3-8b-8192",
                "messages": [
                    {"role": "system", "content": "You are a helpful assistant that generates flashcards in Q&A format."},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 1024,
                "temperature": 0.7
            },
            timeout=60
        )

        print("[Groq API] Status:", response.status_code)
        print("[Groq API] Response:", response.text)
        response.raise_for_status()

        result = response.json()
        choices = result.get("choices", [])
        if not choices:
            raise HTTPException(status_code=500, detail="No choices returned from Groq API")

        raw_text = choices[0]["message"]["content"]
        flashcards = parse_flashcards(raw_text)
        return {"flashcards": flashcards}

    except requests.exceptions.HTTPError as http_err:
        print("[Groq API] HTTP error:", str(http_err))
        print("[Groq API] Response:", getattr(response, 'text', 'No response'))
        raise HTTPException(status_code=response.status_code, detail="Groq API error: " + str(http_err))
    except Exception as e:
        print("[Groq API] Exception:", str(e))
        raise HTTPException(status_code=500, detail="Unexpected error: " + str(e))