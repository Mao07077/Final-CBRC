from fastapi import APIRouter, HTTPException, Body

import requests
import os

router = APIRouter()

API_URL = "https://api-inference.huggingface.co/models/Vamsi/T5_Paraphrase_Paws"
API_TOKEN = os.getenv("HUGGINGFACE_API_KEY", "")

@router.post("/api/paraphrase")
def paraphrase_question(data: dict = Body(...)):
    question = data.get("question")
    if not question:
        raise HTTPException(status_code=400, detail="Missing 'question' field")
    headers = {"Authorization": f"Bearer {API_TOKEN}"}
    payload = {
        "inputs": f"paraphrase: {question}",
        "parameters": {"num_beams": 5, "num_return_sequences": 1}
    }
    response = requests.post(API_URL, headers=headers, json=payload)
    try:
        result = response.json()
        if isinstance(result, list) and len(result) > 0:
            return {"paraphrased": result[0]["generated_text"]}
        else:
            raise HTTPException(status_code=500, detail="No paraphrased result returned")
    except Exception:
        raise HTTPException(status_code=500, detail="Error from Hugging Face API")
