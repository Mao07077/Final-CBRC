
import os
import re
from fastapi import APIRouter, HTTPException, Request
from cerebras.cloud.sdk import Cerebras

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
    api_key = os.getenv("CEREBRAS_API_KEY")

    if not api_key:
        raise HTTPException(status_code=500, detail="Cerebras API key not set")

    client = Cerebras(api_key=api_key)
    prompt = f"Create {num} flashcards in Q&A format from this text. Format each as 'Q: ... A: ...':\n{text}"

    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful assistant that generates flashcards in Q&A format."},
                {"role": "user", "content": prompt}
            ],
            model="qwen-3-235b-a22b-instruct-2507",
            max_completion_tokens=1024,
            temperature=0.7,
            top_p=0.8
        )
        result = response.choices[0].message.content
        flashcards = parse_flashcards(result)
        return {"flashcards": flashcards}
    except Exception as e:
        print("[Cerebras API] Exception:", str(e))
        raise HTTPException(status_code=500, detail="Cerebras API error: " + str(e))        git add . ; git commit -m "feat: switch flashcard generation to Cerebras API and update requirements.txt" ; git push