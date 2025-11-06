import os
import requests
import re
from fastapi import APIRouter, HTTPException, Request
from datetime import datetime
import base64

# DB collections
from database import flashcards_collection, db, modules_collection
from bson import ObjectId
from config import logger

router = APIRouter()

# Optional Bytez SDK for module-level image generation
try:
    from bytez import Bytez
except Exception:
    Bytez = None

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
    attach_module_image = data.get("attach_module_image", False)

    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise HTTPException(status_code=500, detail="Groq API key not set")

    endpoint = "https://api.groq.com/openai/v1/chat/completions"
    prompt = (
        f"Create {num} unique flashcards in Q&A format from this text. "
        "Each flashcard should cover a different key concept, fact, or section. "
        "Do not repeat questions. Cover as many distinct topics as possible from the text. "
        "Format each as 'Q: ... A: ...':\n"
        f"{text}"
    )

    try:
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

        raw_text = choices[0]["message"]["content"]
        flashcards = parse_flashcards(raw_text)

        # If requested, generate one module-level image and attach to each flashcard
        module_image_url = None
        if attach_module_image or module_id:
            try:
                BYTEZ_API_KEY = os.environ.get("BYTEZ_KEY")
                if Bytez is None or not BYTEZ_API_KEY:
                    logger.info("Bytez SDK or API key not available; skipping module image generation")
                else:
                    # build a concise prompt: prefer module title/topic when available
                    prompt_source = None
                    try:
                        if module_id:
                            mod = modules_collection.find_one({"_id": ObjectId(module_id)})
                            if mod:
                                prompt_source = mod.get('title') or mod.get('topic')
                    except Exception:
                        prompt_source = None
                    if not prompt_source:
                        # fallback to short excerpt from the provided text
                        prompt_source = (text or '')[:400]

                    img_prompt = f"A single clean illustrative image representing the following module content or topic: {prompt_source}. Keep it simple and iconic, suitable as a thumbnail."
                    try:
                        sdk = Bytez(BYTEZ_API_KEY)
                        model = sdk.model("dreamlike-art/dreamlike-photoreal-2.0")
                        img_result = model.run(img_prompt)
                        # normalize simple shapes: if tuple/list take last, if dict look for url/output, if str use directly
                        img_output = None
                        if isinstance(img_result, (list, tuple)):
                            img_output = img_result[-1]
                        else:
                            img_output = img_result

                        if isinstance(img_output, dict):
                            module_image_url = img_output.get('url') or img_output.get('output') or (img_output.get('outputs')[0] if img_output.get('outputs') and isinstance(img_output.get('outputs'), (list,tuple)) else None)
                        elif isinstance(img_output, str):
                            module_image_url = img_output
                        elif isinstance(img_output, (bytes, bytearray)):
                            b64 = base64.b64encode(img_output).decode('ascii')
                            module_image_url = f"data:image/png;base64,{b64}"
                        else:
                            module_image_url = None
                        logger.info(f"Module image generation result: type={type(img_output)}, url_set={bool(module_image_url)}")
                    except Exception as e:
                        logger.error("Module image generation failed: %s", e)
            except Exception as e:
                logger.error("Unexpected error while attempting module image generation: %s", e)

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
                        "image_url": module_image_url,
                        "created_at": now,
                        "source": "generated_via_gemini",
                        "generated_by": generated_by
                    }
                    res = flashcards_collection.insert_one(doc)
                    inserted_ids.append(str(res.inserted_id))

                # write a generation audit record; try to fill module title/topic if module_id provided
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
                            # leave title/topic as None if lookup fails (invalid id format or not found)
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

        return {"flashcards": flashcards, "inserted_ids": inserted_ids, "module_image_url": module_image_url}

    except requests.exceptions.HTTPError as http_err:
        logger.error("[Groq API] HTTP error: %s", str(http_err))
        logger.error("[Groq API] Response: %s", getattr(response, 'text', 'No response'))
        raise HTTPException(status_code=response.status_code, detail="Groq API error: " + str(http_err))
    except Exception as e:
        logger.error("[Groq API] Exception: %s", str(e))
        raise HTTPException(status_code=500, detail="Unexpected error: " + str(e))