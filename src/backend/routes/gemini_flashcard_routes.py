import os
import requests
import re
from fastapi import APIRouter, HTTPException, Request
from datetime import datetime
from typing import List, Tuple, Union

# DB collections
from database import flashcards_collection, db, modules_collection
from bson import ObjectId
from config import logger

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

def _chunk_text(text: str, chunk_size: int = 3000, overlap: int = 200) -> List[str]:
    """Split large text into overlapping chunks to fit LLM context better."""
    if not text:
        return []
    chunks = []
    start = 0
    n = len(text)
    while start < n:
        end = min(n, start + chunk_size)
        chunk = text[start:end]
        chunks.append(chunk)
        if end >= n:
            break
        start = max(0, end - overlap)
    return chunks

def _call_groq_generate(api_key: str, text: str, num: int) -> str:
    """Call Groq API and return raw content string."""
    endpoint = "https://api.groq.com/openai/v1/chat/completions"
    prompt = (
        f"Create {num} unique flashcards in Q&A format from this text. "
        "Each flashcard should cover a different key concept, fact, or section. "
        "Do not repeat questions. Cover as many distinct topics as possible from the text. "
        "Format each as 'Q: ... A: ...':\n"
        f"{text}"
    )
    response = requests.post(
        endpoint,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        },
        json={
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": "You are a helpful assistant that generates flashcards in Q&A format."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 1024,
            "temperature": 0.7
        },
        timeout=60
    )
    logger.info("[Groq API] Status: %s", response.status_code)
    logger.debug("[Groq API] Response: %s", response.text)
    response.raise_for_status()
    result = response.json()
    choices = result.get("choices", [])
    if not choices:
        raise HTTPException(status_code=500, detail="No choices returned from Groq API")
    return choices[0]["message"]["content"]

@router.post("/generate-flashcards")
async def generate_flashcards(request: Request):
    """
    Generate flashcards using Groq/Gemini endpoint and persist them when requested.
    Optional JSON body fields:
      - text: source text
      - num: number of cards
      - module_id: (optional) module id to associate with generated cards
      - generated_by: (optional) id_number of the user who requested generation
    Returns generated flashcards and inserted_ids when persisted.
    """
    data = await request.json()
    text = data.get("text")
    num = data.get("num", 3)
    module_id = data.get("module_id")
    generated_by = data.get("generated_by")

    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise HTTPException(status_code=500, detail="Groq API key not set")

    try:
        all_flashcards = []
        # handle 'auto' mode: chunk text and iterate until exhausted or limit reached
        if isinstance(num, str) and num.lower() == "auto":
            chunks = _chunk_text(text, chunk_size=3000, overlap=250)
            seen_questions = set()
            max_total = 60  # safety cap to prevent excessive generation
            per_chunk = 6   # request up to 6 per chunk
            for chunk in chunks:
                if len(all_flashcards) >= max_total:
                    break
                try:
                    raw = _call_groq_generate(api_key, chunk, per_chunk)
                    fc = parse_flashcards(raw)
                    for item in fc:
                        q = (item.get("question") or "").strip()
                        a = (item.get("answer") or "").strip()
                        if not q or not a:
                            continue
                        if q in seen_questions:
                            continue
                        seen_questions.add(q)
                        all_flashcards.append({"question": q, "answer": a})
                        if len(all_flashcards) >= max_total:
                            break
                except Exception as e:
                    logger.error("Chunk generation failed: %s", e)
                    continue
            flashcards = all_flashcards
        else:
            # single-shot mode
            try:
                requested = int(num)
            except Exception:
                requested = 3
            raw_text = _call_groq_generate(api_key, text, requested)
            flashcards = parse_flashcards(raw_text)

        # If the caller provided module_id or generated_by, persist the generated flashcards
        inserted_ids = []
        if flashcards:
            now = datetime.utcnow()
            try:
                for fc in flashcards:
                    doc = {
                        "module_id": module_id,
                        "question": fc.get("question"),
                        "answer": fc.get("answer"),
                        "created_at": now,
                        "source": "generated_via_gemini",
                        "generated_by": generated_by
                    }
                    res = flashcards_collection.insert_one(doc)
                    inserted_ids.append(str(res.inserted_id))

                # write a single generation audit record for the entire run
                try:
                    module_title = None
                    module_topic = None
                    if module_id:
                      try:
                        mod = modules_collection.find_one({"_id": ObjectId(module_id)})
                        if mod:
                          module_title = mod.get("title")
                          module_topic = mod.get("topic")
                      except Exception:
                        pass

                    gen_log = {
                        "module_id": module_id,
                        "module_title": module_title,
                        "module_topic": module_topic,
                        "generated_by": generated_by,
                        "generated_count": len(inserted_ids),
                        "inserted_ids": inserted_ids,
                        "timestamp": now
                    }
                    db["flashcard_generation_logs"].insert_one(gen_log)
                except Exception as e:
                    logger.error("Failed to write flashcard_generation_logs: %s", e)
            except Exception as e:
                logger.error("Failed to persist Gemini-generated flashcards: %s", e)

        return {"flashcards": flashcards, "inserted_ids": inserted_ids}

    except requests.exceptions.HTTPError as http_err:
        logger.error("[Groq API] HTTP error: %s", str(http_err))
        logger.error("[Groq API] Response: %s", getattr(response, 'text', 'No response'))
        raise HTTPException(status_code=response.status_code, detail="Groq API error: " + str(http_err))
    except Exception as e:
        logger.error("[Groq API] Exception: %s", str(e))
        raise HTTPException(status_code=500, detail="Unexpected error: " + str(e))