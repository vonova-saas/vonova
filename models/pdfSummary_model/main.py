import logging
import uuid
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Optional
from pydantic import BaseModel
from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Form, Request

from agents.llm_agent import GeminiAnswerAgent, load_gemini_model
from services.proccesing import extract_text_from_pdf, clean_text
from services.embedding_index import smart_chunk_text
from utils.utils import (
    log_event, log_upload, log_chat, log_magic_moment, 
    log_user_mood, log_ai_creativity, logger, log_error
)

# Response Models for API Documentation
class AskResponse(BaseModel):
    """Response model for the /ask endpoint"""
    answer: str
    session_id: str
    filename: str
    ai_wizard_status: str
    magic_level: str
    message: str

class UploadResponse(BaseModel):
    """Response model for the /upload endpoint"""
    session_id: str
    brief_summary: str
    magic_level: str
    enchantment_status: str
    message: str

class SummaryResponse(BaseModel):
    """Response model for the /summarize endpoint"""
    summary: str
    summary_type: str
    filename: str
    magic_level: str
    ai_wizard_status: str

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown"""
    # Startup
    if not initialize_ai_wizard():
        log_error("AI wizard initialization failed", "startup")
        raise RuntimeError("Failed to initialize AI wizard")
    yield
    # Shutdown (if needed in the future)

# Create our magical FastAPI application
app = FastAPI(
    title="Magical PDF Chat & Summarization AI",
    description="Transform any PDF into your intelligent conversation partner with AI magic!",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Load our AI wizard once (the magical model) - moved to startup
model = None
bot = None

# In-memory session storage (our magical vault)
session_store = {}

def initialize_ai_wizard():
    """Initialize the AI wizard when the server starts"""
    global model, bot
    try:
        logger.info("Loading the magical Gemini AI model...")
        model = load_gemini_model()
        bot = GeminiAnswerAgent(model)
        logger.info("AI wizard successfully loaded and ready for magic!")
        return True
    except Exception as e:
        logger.error(f"Failed to load AI wizard: {e}")
        return False

def process_pdf(file_bytes: bytes):
    """Process PDF with magical text extraction and chunking"""
    logger.info("Starting magical PDF processing...")
    
    # Extract text from the enchanted document
    text = extract_text_from_pdf(file_bytes)
    logger.info("Text extracted from PDF successfully!")
    
    # Clean the text with our magical cleaning spell
    cleaned_text = clean_text(text)
    logger.info("Text cleaned and purified!")
    
    # Create intelligent chunks for better understanding
    chunks = smart_chunk_text(cleaned_text, max_tokens=300)
    logger.info(f"Created {len(chunks)} magical text chunks!")
    
    # Generate a unique session ID for this magical conversation
    session_id = str(uuid.uuid4())
    logger.info(f"New magical session created: {session_id}")
    
    return session_id, cleaned_text[:500000], chunks


@app.get("/")
async def root():
    """Welcome to our magical realm!"""
    log_magic_moment("Root endpoint accessed - Welcome to the magical realm!")
    logger.info(f"Current working directory: {Path.cwd()}")
    logger.info(f"Log file path: {Path('logs').absolute()}")
    
    return {
        "message": "Welcome to the Magical PDF Chat & Summarization AI Realm!",
        "magic_level": "MAXIMUM",
        "creativity_boost": "ENABLED",
        "ai_wizard_status": "READY" if bot else "LOADING",
        "available_spells": ["upload", "summarize", "ask", "health"]
    }

@app.get("/health")
async def health():
    """Check if our magical system is healthy and ready!"""
    log_magic_moment("Health check performed - Magic system status verified!")
    
    return {
        "status": "HEALTHY",
        "service": "Magical PDF Chat & Summarization AI",
        "version": "1.0.0",
        "magic_level": "MAXIMUM",
        "ai_wizard_status": "ACTIVE" if bot else "LOADING",
        "creativity_boost": "ENABLED",
        "system_message": "All systems are go! The magic is flowing!"
    }

@app.post("/upload", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    """
    Upload a PDF and get enchanted with brief summary + session_id
    (full text is NOT returned, but stored in our magical vault for future conversations).
    """
    if not bot:
        raise HTTPException(status_code=503, detail="AI wizard is still loading... Please wait a moment!")
    
    log_magic_moment(f"New PDF upload request received: {file.filename}")
    
    if file.content_type != "application/pdf":
        log_error("Invalid file type attempted", "upload")
        raise HTTPException(
            status_code=400, 
            detail="Only PDF files can be enchanted! Please upload a PDF document."
        )

    # Read the magical document
    file_bytes = await file.read()
    logger.info(f"PDF file read successfully: {len(file_bytes)} bytes")
    
    # Process the PDF with our magical spells
    session_id, full_text, chunks = process_pdf(file_bytes)
    
    # Store in our magical vault
    session_store[session_id] = {
        "full_text": full_text,
        "chunks": chunks,
        "filename": file.filename
    }
    logger.info(f"Document stored in magical vault: {session_id}")

    # Generate a brief summary with our AI wizard
    logger.info("AI wizard is crafting a brief summary...")
    brief = bot.summarize_short(full_text)
    logger.info("Brief summary created successfully!")
    
    # Log the successful upload
    log_upload(session_id, file.filename, len(file_bytes))
    log_magic_moment(f"PDF successfully enchanted and ready for conversation! Session: {session_id}")

    return {
        "session_id": session_id,
        "brief_summary": brief,
        "magic_level": "MAXIMUM",
        "enchantment_status": "SUCCESS",
        "message": "Your PDF has been successfully enchanted! Ready for magical conversations!"
    }

@app.get("/summarize", response_model=SummaryResponse)
async def summarize(
    session_id: str = Query(...),
    summary_type: str = Query("detailed")
):
    """
    Return a full summary (detailed or brief) from our magical vault.
    """
    if not bot:
        raise HTTPException(status_code=503, detail="AI wizard is still loading... Please wait a moment!")
    
    log_magic_moment(f"Summary request for session: {session_id}, type: {summary_type}")
    
    if session_id not in session_store:
        log_error(f"Invalid session_id: {session_id}", "summarize")
        raise HTTPException(
            status_code=404, 
            detail="Session not found! The magic has expired. Please upload your PDF again."
        )

    full_text = session_store[session_id]["full_text"]
    filename = session_store[session_id].get("filename", "Unknown")
    
    logger.info(f"AI wizard is crafting a {summary_type} summary for: {filename}")
    summary = bot.summarize_document(full_text, summary_type=summary_type)
    logger.info(f"{summary_type.capitalize()} summary created successfully!")
    
    log_magic_moment(f"Summary generated successfully for session: {session_id}")
    
    return {
        "summary": summary,
        "summary_type": summary_type,
        "filename": filename,
        "magic_level": "MAXIMUM",
        "ai_wizard_status": "SUCCESS"
    }

@app.post("/ask", response_model=AskResponse)
async def ask_question(
    request: Request,
    # Form data parameters (optional)
    session_id: Optional[str] = Form(None, description="Session ID from PDF upload"),
    question: Optional[str] = Form(None, description="Your question about the PDF content")
):
    """
    Ask a question about the enchanted PDF using our AI wizard.
    
    This endpoint supports multiple data formats for maximum flexibility:
    
    **Form Data (x-www-form-urlencoded):**
    - Content-Type: application/x-www-form-urlencoded
    - Parameters: session_id, question
    
    **JSON:**
    - Content-Type: application/json
    - Body: {"session_id": "uuid", "question": "your question"}
    
    **Example Form Data:**
    ```
    session_id=abc123-def456&question=What is the main topic?
    ```
    
    **Example JSON:**
    ```json
    {
      "session_id": "abc123-def456",
      "question": "What is the main topic?"
    }
    ```
    
    **Response:**
    Returns AI-generated answer based on the PDF content.
    """
    if not bot:
        raise HTTPException(status_code=503, detail="AI wizard is still loading... Please wait a moment!")
    
    # Try to get data from JSON if form data is not provided
    if session_id is None or question is None:
        try:
            json_data = await request.json()
            session_id = json_data.get("session_id")
            question = json_data.get("question")
        except:
            pass
    
    # Validate required fields
    if not session_id or not question:
        raise HTTPException(
            status_code=422, 
            detail="Both session_id and question are required"
        )
    
    log_magic_moment(f"Question asked in session: {session_id}")
    log_user_mood("Curious and engaged")
    
    if session_id not in session_store:
        log_error(f"Invalid session_id: {session_id}", "ask_question")
        raise HTTPException(
            status_code=404, 
            detail="Session not found! The magic has expired. Please upload your PDF again."
        )

    chunks = session_store[session_id]["chunks"]
    filename = session_store[session_id].get("filename", "Unknown")
    
    logger.info(f"AI wizard is pondering your question about: {filename}")
    logger.info(f"Question: {question[:100]}...")
    
    # Get answer from our AI wizard
    answer = bot.answer_question(question, chunks[:15])
    logger.info(f"AI wizard has crafted a response!")
    
    # Log the chat interaction
    log_chat(session_id, question, answer)
    log_ai_creativity("HIGH - Engaging and helpful response generated")
    
    return {
        "answer": answer,
        "session_id": session_id,
        "filename": filename,
        "ai_wizard_status": "SUCCESS",
        "magic_level": "MAXIMUM",
        "message": "Your question has been answered by our AI wizard!"
    }

if __name__ == "__main__":
    # Launch our magical server!
    import uvicorn
    
    print("Starting the Magical PDF Chat & Summarization AI Server...")
    print("API Documentation: http://127.0.0.1:5001/docs")
    print("Health Check: http://127.0.0.1:5001/health")
    print("Press Ctrl+C to stop the magical server")
    print("-" * 50)
    
    uvicorn.run("main:app", host="127.0.0.1", port=5001, reload=False)
    