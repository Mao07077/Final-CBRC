from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import os

try:
	from bytez import Bytez
except ImportError:
	Bytez = None

router = APIRouter()

# Set your Bytez API key here or via environment variable
BYTEZ_API_KEY = os.environ.get("BYTEZ_KEY", "YOUR_BYTEZ_KEY_HERE")

class FlashcardImageRequest(BaseModel):
	topic: str

@router.post("/api/flashcard/generate-image")
async def generate_flashcard_image(request: FlashcardImageRequest):
	if Bytez is None:
		raise HTTPException(status_code=500, detail="Bytez SDK is not installed. Please install with 'pip install bytez'.")
	if not BYTEZ_API_KEY or BYTEZ_API_KEY == "YOUR_BYTEZ_KEY_HERE":
		raise HTTPException(status_code=500, detail="Bytez API key is not set.")
	sdk = Bytez(BYTEZ_API_KEY)
	model = sdk.model("dreamlike-art/dreamlike-photoreal-2.0")
	prompt = f"An image representing: {request.topic}"
	error, output = model.run(prompt)
	if error:
		raise HTTPException(status_code=500, detail=f"Bytez error: {error}")
	# output['output'] is expected to be the image URL or data
	return {"image_url": output.get('output')}
