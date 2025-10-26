from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import logging

try:
    from bytez import Bytez
except ImportError:
    Bytez = None

router = APIRouter()

# Setup logger
logger = logging.getLogger("bytez_flashcard")
logging.basicConfig(level=logging.INFO)

# Set your Bytez API key here or via environment variable
BYTEZ_API_KEY = os.environ.get("BYTEZ_KEY", "YOUR_BYTEZ_KEY_HERE")

class FlashcardImageRequest(BaseModel):
    topic: str

@router.post("/api/flashcard/generate-image")
async def generate_flashcard_image(request: FlashcardImageRequest):
    # Normalize topic to avoid duplicate images for similar strings
    normalized_topic = request.topic.strip().lower()
    logger.info(f"Received image generation request for topic: {normalized_topic}")
    
    if Bytez is None:
        logger.error("Bytez SDK is not installed.")
        raise HTTPException(status_code=500, detail="Bytez SDK is not installed. Please install with 'pip install bytez'.")
    
    if not BYTEZ_API_KEY or BYTEZ_API_KEY == "YOUR_BYTEZ_KEY_HERE":
        logger.error("Bytez API key is not set.")
        raise HTTPException(status_code=500, detail="Bytez API key is not set.")
    
    try:
        sdk = Bytez(BYTEZ_API_KEY)
        model = sdk.model("dreamlike-art/dreamlike-photoreal-2.0")
        prompt = f"An image representing: {normalized_topic}"
        logger.info(f"Calling Bytez API with prompt: {prompt}")
        error, output = model.run(prompt)
        
        # If error is a valid URL, treat as success
        if error:
            if isinstance(error, str) and error.startswith("http"):
                logger.info(f"Bytez returned image URL in error: {error}")
                return {"image_url": error}
            logger.error(f"Bytez error: {error}")
            raise HTTPException(status_code=500, detail=f"Bytez error: {error}")
        
        logger.info(f"Bytez output: {output}")
        return {"image_url": output.get('output')}
    except Exception as e:
        logger.exception(f"Exception during Bytez image generation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")