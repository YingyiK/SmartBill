"""
Google Gemini OCR engine
Uses Gemini API for text extraction from images
"""
import logging
import requests
from PIL import Image
import io
import base64
import json
from dotenv import load_dotenv

# Load environment variables
# Try loading from current directory first, then from project root
import os
load_dotenv()  # Current directory
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '..', '.env'))  # Project root

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GeminiOCREngine:
    """
    OCR engine using Google Gemini API
    """
    
    # Gemini API endpoint - using Gemini 2.5 Flash-Lite
    # Available models: gemini-2.5-flash-lite, gemini-1.5-flash-latest, gemini-1.5-pro-latest
    MODEL_NAME = "gemini-2.5-flash-lite"  # Fast and efficient for OCR
    BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"
    
    def __init__(self, api_key=None, model_name=None):
        """
        Initialize Gemini API engine
        
        Args:
            api_key: Google Gemini API key (required)
            model_name: Optional model name override (e.g., "gemini-1.5-pro-latest")
        """
        self.api_key = api_key or self._get_api_key_from_env()
        
        if not self.api_key:
            raise ValueError(
                "Gemini API key is required. "
                "Set GEMINI_API_KEY environment variable or pass it to __init__"
            )
        
        # Allow model name override
        if model_name:
            self.MODEL_NAME = model_name
        
        logger.info(f"Gemini OCR Engine initialized with model: {self.MODEL_NAME}")
    
    @property
    def API_URL(self):
        """Get the API URL for the current model"""
        return f"{self.BASE_URL}/{self.MODEL_NAME}:generateContent"
    
    @staticmethod
    def _get_api_key_from_env():
        """Get API key from environment variable"""
        import os
        return os.getenv("GEMINI_API_KEY")
    
    def extract_text(self, image):
        """
        Extract text using Gemini API
        
        Args:
            image: PIL Image, numpy array, or bytes
            
        Returns:
            Extracted text as string
        """
        try:
            # Convert to PIL Image if needed
            if isinstance(image, bytes):
                image = Image.open(io.BytesIO(image))
            elif hasattr(image, 'shape'):  # numpy array
                from PIL import Image as PILImage
                image = PILImage.fromarray(image)
            
            # Convert image to base64
            buffered = io.BytesIO()
            image.save(buffered, format="PNG")
            image_bytes = buffered.getvalue()
            image_base64 = base64.b64encode(image_bytes).decode()
            
            # Prepare the request payload
            payload = {
                "contents": [{
                    "parts": [
                        {
                            "text": "Extract all text from this receipt image. Return only the raw text content, preserving line breaks and structure."
                        },
                        {
                            "inline_data": {
                                "mime_type": "image/png",
                                "data": image_base64
                            }
                        }
                    ]
                }],
                "generationConfig": {
                    "temperature": 0.1,
                    "topK": 1,
                    "topP": 1,
                    "maxOutputTokens": 2048,
                }
            }
            
            logger.info("Sending request to Gemini API...")
            
            import time
            max_retries = 3
            retry_delay = 2  # Start with 2 seconds

            for attempt in range(max_retries):
                try:
                    # Send request to Gemini API
                    response = requests.post(
                        f"{self.API_URL}?key={self.api_key}",
                        headers={"Content-Type": "application/json"},
                        json=payload,
                        timeout=60
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        text = self._parse_gemini_response(result)
                        logger.info(f"Successfully extracted {len(text)} characters")
                        return text.strip()
                        
                    elif response.status_code == 503:
                        # Service unavailable / overloaded - Retry
                        if attempt < max_retries - 1:
                            logger.warning(f"Gemini API overloaded (503). Retrying in {retry_delay}s... (Attempt {attempt+1}/{max_retries})")
                            time.sleep(retry_delay)
                            retry_delay *= 2  # Exponential backoff
                            continue
                        else:
                            raise Exception("Gemini API overloaded. Max retries exceeded.")
                            
                    elif response.status_code == 429:
                        # Rate limit exceeded - Retry
                        if attempt < max_retries - 1:
                            logger.warning(f"Rate limit exceeded (429). Retrying in {retry_delay}s... (Attempt {attempt+1}/{max_retries})")
                            time.sleep(retry_delay)
                            retry_delay *= 2
                            continue
                        else:
                            raise Exception("Rate limit exceeded. Please try again later.")

                    elif response.status_code == 400:
                        error_detail = response.text
                        logger.error(f"Bad request: {error_detail}")
                        raise Exception(f"Gemini API error: Invalid request. {error_detail}")
                    elif response.status_code == 401:
                        logger.error("Unauthorized - check your API key")
                        raise Exception("Gemini API error: Invalid API key")
                    elif response.status_code == 404:
                        error_detail = response.text
                        logger.error(f"Model not found (404): {error_detail}")
                        raise Exception(
                            f"Gemini model '{self.MODEL_NAME}' not found. "
                            f"Please check available models at: https://ai.google.dev/models/gemini"
                        )
                    else:
                        error_detail = response.text[:200] if response.text else "No error details"
                        logger.error(f"API error {response.status_code}: {error_detail}")
                        raise Exception(f"Gemini API error {response.status_code}: {error_detail}")

                except requests.exceptions.Timeout:
                    if attempt < max_retries - 1:
                        logger.warning(f"Request timeout. Retrying in {retry_delay}s...")
                        time.sleep(retry_delay)
                        retry_delay *= 2
                        continue
                    logger.error("Request timeout")
                    raise Exception("Request timeout")
                except Exception as e:
                    # Don't retry on other exceptions unless it's the last attempt
                    if attempt == max_retries - 1:
                        logger.error(f"OCR extraction failed: {str(e)}")
                        raise
                    # If it's a transient network error, maybe retry? 
                    # For now, let's re-raise non-status-code errors immediately to fail fast on logic bugs
                    if "API error" in str(e) or "overloaded" in str(e):
                         raise # Re-raise known API errors that we already handled/retried logic for
                    
                    # For unexpected errors, maybe retry
                    logger.warning(f"Unexpected error: {str(e)}. Retrying...")
                    time.sleep(retry_delay)
                    retry_delay *= 2
        
        except Exception as e:
            # Catch-all for any errors outside the loop (shouldn't happen with current logic but good for safety)
            logger.error(f"OCR extraction failed fatally: {str(e)}")
            raise


    
    def _parse_gemini_response(self, response_json):
        """
        Parse Gemini API response to extract text
        
        Args:
            response_json: JSON response from Gemini API
            
        Returns:
            Extracted text string
        """
        try:
            # Gemini response structure:
            # {
            #   "candidates": [{
            #     "content": {
            #       "parts": [{"text": "..."}]
            #     }
            #   }]
            # }
            candidates = response_json.get("candidates", [])
            
            if not candidates:
                logger.warning("No candidates in Gemini response")
                return ""
            
            # Get the first candidate
            candidate = candidates[0]
            content = candidate.get("content", {})
            parts = content.get("parts", [])
            
            # Extract text from parts
            text_parts = []
            for part in parts:
                if "text" in part:
                    text_parts.append(part["text"])
            
            if not text_parts:
                logger.warning("No text found in Gemini response")
                return ""
            
            # Join all text parts
            text = "\n".join(text_parts)
            return text
            
        except Exception as e:
            logger.error(f"Error parsing Gemini response: {str(e)}")
            # Fallback: try to extract any text from the response
            return str(response_json)

