"""
Main FastAPI application for OCR service
Handles receipt image upload and text extraction
"""
from fastapi import FastAPI, File, UploadFile, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import os
from typing import Optional
from dotenv import load_dotenv

from models import OCRResponse, ErrorResponse, TestRequest
from gemini_ocr_engine import GeminiOCREngine as OCREngine
from parser import ReceiptParser

# Load environment variables from .env file
# Try loading from current directory first, then from project root
load_dotenv()  # Current directory (ocr_service/)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '..', '.env'))  # Project root

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="SmartBill OCR API",
    description="AI-powered receipt OCR service for expense splitting",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OCR engine (lazy loaded)
ocr_engine: Optional[OCREngine] = None

def get_ocr_engine():
    """Lazy initialization of OCR engine"""
    global ocr_engine
    if ocr_engine is None:
        logger.info("Initializing Gemini OCR engine...")
        
        # Read API key from environment
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY environment variable is required. "
                "Get your API key from: https://makersuite.google.com/app/apikey"
            )
        
        ocr_engine = OCREngine(api_key=api_key)
        logger.info("OCR engine initialized")
    return ocr_engine

@app.get("/")
def root():
    """Health check endpoint"""
    return {
        "service": "SmartBill OCR API",
        "status": "running",
        "version": "1.0.0",
        "ocr_engine": "Google Gemini"
    }

@app.get("/health")
def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "ocr_engine": "ready" if ocr_engine else "not_initialized"
    }

@app.post("/api/ocr/upload", response_model=OCRResponse)
async def upload_receipt(image: UploadFile = File(...)):
    """
    Upload and process a receipt image
    
    Args:
        image: Receipt image file (JPEG, PNG, etc.)
        
    Returns:
        OCRResponse with extracted items and metadata
    """
    if not image.content_type.startswith('image/'):
        raise HTTPException(
            status_code=400,
            detail="File must be an image (JPEG, PNG, etc.)"
        )
    
    try:
        logger.info(f"Processing receipt: {image.filename}")
        
        # Read image bytes
        image_bytes = await image.read()
        
        # Extract text using OCR
        logger.info("Running OCR via Gemini API...")
        engine = get_ocr_engine()
        raw_text = engine.extract_text(image_bytes)
        
        if not raw_text:
            return OCRResponse(
                success=False,
                raw_text="",
                items=[],
                total=None,
                subtotal=None,
                tax_amount=None,
                store_name=None,
                tax_rate=ReceiptParser.TAX_RATE
            )
        
        # Parse text into structured data
        logger.info("Parsing receipt data...")
        items, total, store_name = ReceiptParser.parse(raw_text)
        subtotal = ReceiptParser._extract_subtotal(raw_text)
        tax_amount = ReceiptParser._extract_tax(raw_text)
        
        # Debug logging
        logger.info(f"Extracted total: {total}, subtotal: {subtotal}, tax: {tax_amount}")
        
        logger.info(f"Successfully extracted {len(items)} items")
        
        return OCRResponse(
            success=True,
            raw_text=raw_text,
            items=items,
            total=total,
            subtotal=subtotal,
            tax_amount=tax_amount,
            store_name=store_name,
            tax_rate=ReceiptParser.TAX_RATE
        )
        
    except Exception as e:
        logger.error(f"OCR processing failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process receipt: {str(e)}"
        )

@app.post("/api/ocr/test", response_model=OCRResponse)
async def test_parser(
    request: Optional[TestRequest] = Body(None),
    text: Optional[str] = Query(None)
):
    """
    Test endpoint: Parse text directly without OCR
    
    Supports both JSON body and query parameter:
    - JSON body: {"text": "receipt text..."}
    - Query parameter: ?text=receipt text...
    
    Args:
        request: TestRequest with "text" field (JSON body, optional)
        text: Raw receipt text as query parameter (optional)
        
    Returns:
        OCRResponse with parsed data
    """
    try:
        # Get text from either JSON body or query parameter
        if request and request.text:
            receipt_text = request.text
        elif text:
            receipt_text = text
        else:
            raise HTTPException(
                status_code=400,
                detail="Missing 'text' field. Provide either JSON body with 'text' field or 'text' query parameter."
            )
        
        items, total, store_name = ReceiptParser.parse(receipt_text)
        subtotal = ReceiptParser._extract_subtotal(receipt_text)
        tax_amount = ReceiptParser._extract_tax(receipt_text)
        
        return OCRResponse(
            success=True,
            raw_text=receipt_text,
            items=items,
            total=total,
            subtotal=subtotal,
            tax_amount=tax_amount,
            store_name=store_name,
            tax_rate=ReceiptParser.TAX_RATE
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse text: {str(e)}"
        )

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "An unexpected error occurred"
        }
    )
