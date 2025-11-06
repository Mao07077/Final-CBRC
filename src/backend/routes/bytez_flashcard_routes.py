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
		result = model.run(prompt)
		# model.run can return many shapes depending on SDK/version: (err, out), out, dict, list, or str
		logger.info(f"Raw Bytez run result: {type(result)}")
		# Normalize into (error, output)
		error = None
		output = None
		try:
			if isinstance(result, (list, tuple)):
				if len(result) == 2:
					error, output = result
				elif len(result) == 1:
					output = result[0]
				else:
					# multiple items: prefer the last as the output
					output = result[-1]
			elif isinstance(result, dict):
				# common keys: 'error', 'output', 'outputs', 'url'
				error = result.get('error') if 'error' in result else None
				if 'output' in result:
					output = result.get('output')
				elif 'outputs' in result and isinstance(result.get('outputs'), (list, tuple)) and len(result['outputs'])>0:
					output = result['outputs'][0]
				elif 'url' in result:
					output = result.get('url')
				else:
					output = result
			elif isinstance(result, str):
				# Sometimes the SDK returns a direct URL string
				output = result
			else:
				# Fallback: treat result as output
				output = result
		except Exception as e:
			logger.warning(f"Error normalizing Bytez result: {e}; raw result type: {type(result)}")
			output = result

		# If error is a valid URL, treat as success (Bytez sometimes returns image URL in error)
		if error:
			if isinstance(error, str) and error.startswith("http"):
				logger.info(f"Bytez returned image URL in error: {error}")
				return {"image_url": error}
			logger.error(f"Bytez error: {error}")
			raise HTTPException(status_code=500, detail=f"Bytez error: {error}")

		logger.info(f"Normalized Bytez output type: {type(output)}")
		# Extract a usable URL/string from the output
		image_url = None
		if isinstance(output, str):
			image_url = output
		elif isinstance(output, dict):
			# look for common places
			if 'url' in output and isinstance(output['url'], str):
				image_url = output['url']
			elif 'image' in output and isinstance(output['image'], str):
				image_url = output['image']
			elif 'data' in output and isinstance(output['data'], str):
				image_url = output['data']
			elif 'output' in output and isinstance(output['output'], str):
				image_url = output['output']
			# if outputs is nested list
			elif 'outputs' in output and isinstance(output['outputs'], (list, tuple)) and len(output['outputs'])>0:
				first = output['outputs'][0]
				if isinstance(first, str):
					image_url = first
				elif isinstance(first, dict) and 'url' in first:
					image_url = first.get('url')
		elif isinstance(output, (list, tuple)) and len(output) > 0:
			first = output[0]
			if isinstance(first, str):
				image_url = first
			elif isinstance(first, dict) and 'url' in first:
				image_url = first.get('url')

		if image_url and isinstance(image_url, str):
			logger.info(f"Bytez resolved image URL: {image_url}")
			return {"image_url": image_url}
		# Nothing usable
		logger.error(f"Unable to extract image URL from Bytez output: {output}")
		raise HTTPException(status_code=500, detail="Bytez returned an unexpected output shape; see server logs")
	except Exception as e:
		logger.exception(f"Exception during Bytez image generation: {str(e)}")
		raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
