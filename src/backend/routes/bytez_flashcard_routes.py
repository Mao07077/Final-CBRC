from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import os
import logging
import asyncio

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
		# Try a list of model IDs in order (fallback if a model is missing or returns 404/500)
		MODEL_CANDIDATES = [
			"dreamlike-art/dreamlike-photoreal-2.0",
			"stable-diffusion-v1-5/stable-diffusion-v1-5",
		]
		model = None
		last_model_error = None
		for mid in MODEL_CANDIDATES:
			try:
				logger.info(f"Attempting to use Bytez model: {mid}")
				model = sdk.model(mid)
				# If model() didn't raise, assume it's available and break
				break
			except Exception as me:
				# record and try next candidate
				logger.warning(f"Failed to initialize Bytez model {mid}: {me}")
				last_model_error = me
				model = None
				continue
		if model is None:
			logger.error(f"No Bytez model could be initialized. Last error: {last_model_error}")
			raise HTTPException(status_code=502, detail=f"No Bytez model available: {last_model_error}")
		prompt = f"An image representing: {request.topic}"
		logger.info(f"Calling Bytez API with prompt: {prompt}")
		# model.run may return different shapes depending on SDK version / API response
		# Call model.run in a thread to avoid blocking the event loop and support retries
		async def call_model():
			return await asyncio.to_thread(model.run, prompt)

		max_retries = 3
		backoff = [0.5, 1.0, 2.0]
		result = None
		last_raw = None
		for attempt in range(max_retries):
			try:
				result = await call_model()
				logger.debug(f"Raw Bytez model.run result (attempt {attempt+1}): {repr(result)}")
				last_raw = result
				# quick heuristic: if result is a string containing known transient error, retry
				if isinstance(result, str):
					low = result.lower()
					if 'inference failed' in low or 'fetch failed' in low or 'timeout' in low:
						logger.warning(f"Bytez returned transient failure message on attempt {attempt+1}: {result}")
						# if not last attempt, sleep then retry
						if attempt < max_retries - 1:
							await asyncio.sleep(backoff[attempt])
							continue
					# else fall through to normalization and error handling
				# if result looks like an error tuple/dict we will handle below
			except Exception as e:
				logger.exception(f"Exception while calling Bytez model.run on attempt {attempt+1}: {e}")
				# if not last attempt, wait and retry
				if attempt < max_retries - 1:
					await asyncio.sleep(backoff[attempt])
					continue
				# else re-raise to be caught by outer handler
				raise
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
			raise HTTPException(status_code=502, detail=f"Bytez error: {error}")

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

		# If we get here, result shape was unexpected or contained transient failure text
		logger.error(f"Unable to extract image URL from Bytez response after {max_retries} attempts. Raw: {repr(last_raw)}")
		raise HTTPException(status_code=502, detail=f"Bytez inference failed after {max_retries} attempts")
	except Exception as e:
		logger.exception(f"Exception during Bytez image generation: {str(e)}")
		raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
