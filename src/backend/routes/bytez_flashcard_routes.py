from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import os
import logging
import base64

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
		logger.info(f"Raw Bytez run result type: {type(result)}")
		# Log a truncated repr for debugging (avoid huge binary dumps)
		try:
			raw_repr = repr(result)
			if len(raw_repr) > 2000:
				raw_repr = raw_repr[:2000] + '...<truncated>'
			logger.debug(f"Raw Bytez run result repr: {raw_repr}")
		except Exception:
			logger.debug("Failed to repr Bytez result for logging")
		# Normalize into (error, output)
		error = None
		output = None
		try:
			# If result is a Response-like object from the SDK, try to extract common attributes
			# (some versions of bytez return a bytez.client.Response instance)
			if not isinstance(result, (list, tuple, dict, str, bytes, bytearray)):
				# try json()
				try:
					if hasattr(result, 'json') and callable(result.json):
						j = result.json()
						logger.debug("Extracted JSON from Bytez Response-like object")
						# prefer the json payload as the output
						result = j
					elif hasattr(result, 'content'):
						logger.debug("Extracted content from Bytez Response-like object")
						result = result.content
					elif hasattr(result, 'data'):
						logger.debug("Extracted data attr from Bytez Response-like object")
						result = result.data
					elif hasattr(result, 'output'):
						logger.debug("Extracted output attr from Bytez Response-like object")
						result = result.output
					elif hasattr(result, 'text'):
						logger.debug("Extracted text attr from Bytez Response-like object")
						result = result.text
				except Exception as _e:
					logger.debug(f"Failed to extract from Response-like object: {_e}")

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
		# If output is raw bytes, encode to a data URL
		try:
			if isinstance(output, (bytes, bytearray)) and len(output) > 0:
				b64 = base64.b64encode(output).decode('ascii')
				data_url = f"data:image/png;base64,{b64}"
				logger.info("Bytez returned raw bytes; encoded as data URL")
				return {"image_url": data_url}
			# If output is a dict containing base64 image
			if isinstance(output, dict):
				for key in ('b64', 'base64', 'image_base64', 'data'):
					val = output.get(key)
					if isinstance(val, (bytes, bytearray)):
						b64 = base64.b64encode(val).decode('ascii')
						return {"image_url": f"data:image/png;base64,{b64}"}
					if isinstance(val, str) and len(val) > 0 and all(c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=' for c in val.strip()):
						# heuristic: looks like base64 string
						return {"image_url": f"data:image/png;base64,{val.strip()}"}
		except Exception as e:
			logger.warning(f"Error while attempting to coerce Bytez output into image data URL: {e}")

		logger.error(f"Unable to extract image URL from Bytez output; type={type(output)}; see debug repr in logs")
		raise HTTPException(status_code=500, detail="Internal server error: 500: Bytez returned an unexpected output shape; see server logs")
	except Exception as e:
		logger.exception(f"Exception during Bytez image generation: {str(e)}")
		raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# -- Helper: async image generator for other routes ---------------------------------
def _normalize_bytez_result(raw_result):
	"""Given a raw result from model.run, try to extract an image URL or base64 data.
	Returns a string image_url if found, otherwise None.
	"""
	try:
		# Reuse normalization logic above but in a compact form
		result = raw_result
		# If it's a Response-like object, try to extract
		if not isinstance(result, (list, tuple, dict, str, bytes, bytearray)):
			try:
				if hasattr(result, 'json') and callable(result.json):
					result = result.json()
				elif hasattr(result, 'content'):
					result = result.content
				elif hasattr(result, 'data'):
					result = result.data
				elif hasattr(result, 'output'):
					result = result.output
				elif hasattr(result, 'text'):
					result = result.text
			except Exception:
				pass

		# tuple/list handling
		if isinstance(result, (list, tuple)):
			if len(result) == 2:
				err, out = result
				if isinstance(out, (str, dict)):
					result = out
			elif len(result) >= 1:
				result = result[-1]

		# dict handling
		if isinstance(result, dict):
			# direct url
			for k in ('url', 'image', 'output', 'data'):
				val = result.get(k)
				if isinstance(val, str) and val.startswith('http'):
					return val
				if isinstance(val, (bytes, bytearray)):
					return f"data:image/png;base64,{base64.b64encode(val).decode('ascii')}"
				if isinstance(val, str) and len(val) > 100 and all(c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=' for c in val.strip()):
					return f"data:image/png;base64,{val.strip()}"
			# outputs array
			if 'outputs' in result and isinstance(result['outputs'], (list, tuple)) and result['outputs']:
				first = result['outputs'][0]
				if isinstance(first, str) and first.startswith('http'):
					return first
		# string URL
		if isinstance(result, str) and result.startswith('http'):
			return result
		# bytes -> base64 data URL
		if isinstance(result, (bytes, bytearray)) and len(result) > 0:
			return f"data:image/png;base64,{base64.b64encode(result).decode('ascii')}"
	except Exception as e:
		logger.debug(f"_normalize_bytez_result exception: {e}")
	return None


async def generate_image_for_prompt(prompt: str, retries: int = 2, model_name: str = "dreamlike-art/dreamlike-photoreal-2.0") -> str:
	"""High-level helper: call Bytez for prompt with retries and return an image_url or raise.
	This runs blocking SDK calls in a thread via asyncio.to_thread.
	"""
	if Bytez is None:
		raise RuntimeError("Bytez SDK not available")
	attempt = 0
	backoff = 0.8
	last_exc = None
	while attempt <= retries:
		try:
			def _call():
				sdk = Bytez(BYTEZ_API_KEY)
				model = sdk.model(model_name)
				return model.run(prompt)

			raw = await __import__('asyncio').to_thread(_call)
			logger.debug(f"generate_image_for_prompt raw type: {type(raw)}")
			image_url = _normalize_bytez_result(raw)
			if image_url:
				return image_url
			# If normalization failed, raise to trigger retry
			raise RuntimeError("Bytez returned no usable image data")
		except Exception as e:
			last_exc = e
			logger.warning(f"Bytez image attempt {attempt} failed: {e}")
			attempt += 1
			await __import__('asyncio').sleep(backoff * attempt)
	raise RuntimeError(f"Bytez image generation failed after {retries+1} attempts: {last_exc}")
