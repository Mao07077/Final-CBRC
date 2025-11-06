from fastapi import APIRouter, HTTPException, Query
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
	logger.info(f"Received image generation request for topic: {request.topic}")
	if Bytez is None:
		logger.error("Bytez SDK is not installed.")
		raise HTTPException(status_code=500, detail="Bytez SDK is not installed. Please install with 'pip install bytez'.")
	if not BYTEZ_API_KEY or BYTEZ_API_KEY == "YOUR_BYTEZ_KEY_HERE":
		logger.error("Bytez API key is not set.")
		raise HTTPException(status_code=500, detail="Bytez API key is not set.")
	try:
		sdk = Bytez(BYTEZ_API_KEY)
		model = sdk.model("dreamlike-art/dreamlike-photoreal-2.0")
		prompt = f"An image representing: {request.topic}"
		logger.info(f"Calling Bytez API with prompt: {prompt}")
		# model.run may return different shapes depending on SDK version / API response
		result = model.run(prompt)
		logger.debug(f"Raw Bytez model.run result: {repr(result)}")
		# Normalize result into (error, output) where possible
		error = None
		output = None
		try:
			if isinstance(result, (list, tuple)):
				if len(result) == 0:
					error = None
					output = None
				elif len(result) == 1:
					# single return, treat as output
					output = result[0]
				else:
					# take first two values; ignore extras
					error, output = result[0], result[1]
			elif isinstance(result, dict):
				# common keys to look for
				error = result.get('error') or result.get('err')
				output = result.get('output') or result.get('data') or result.get('url') or result.get('image_url') or result.get('result')
			elif isinstance(result, str):
				# string result -> treat as output URL or base64
				output = result
			else:
				# fallback: try to use it directly as output
				output = result
		except Exception:
			logger.exception("Error normalizing Bytez result")
			# keep error/output as-is (None or whatever was set)

		# If Bytez returns an image URL in the 'error' position, accept it
		if error:
			if isinstance(error, str) and error.startswith("http"):
				logger.info(f"Bytez returned image URL in error: {error}")
				return {"image_url": error}
			# If error exists and is not an URL, log and raise
			logger.error(f"Bytez error: {error}")
			raise HTTPException(status_code=500, detail=f"Bytez error: {error}")

		# Extract image URL from output if possible
		if isinstance(output, dict):
			# prefer common keys
			img_url = output.get('output') or output.get('url') or output.get('image_url') or output.get('image') or output.get('result')
			if img_url:
				logger.info(f"Bytez output URL extracted: {img_url}")
				return {"image_url": img_url}
		elif isinstance(output, str):
			if output.startswith('http'):
				logger.info(f"Bytez output URL string: {output}")
				return {"image_url": output}
			# maybe base64 or other string; return as-is in a key
			logger.info("Bytez output is a string but not an http URL; returning raw output")
			return {"image_raw": output}

		# If we get here, result shape was unexpected
		logger.error(f"Unable to extract image URL from Bytez response: {repr(result)}")
		raise HTTPException(status_code=500, detail="Internal server error: unable to extract image URL from Bytez response")
	except Exception as e:
		logger.exception(f"Exception during Bytez image generation: {str(e)}")
		raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
