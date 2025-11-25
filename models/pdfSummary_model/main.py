import os
from contextlib import asynccontextmanager
from typing import Optional
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Form, Request
from fastapi.middleware.cors import CORSMiddleware

from models.pdf_schema import AskResponse, UploadResponse, SummaryResponse
from services.pdf_service import (
    initialize_ai_wizard,
    handle_upload,
    handle_summarize,
    handle_ask
)
from utils.utils import logger
import uvicorn

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    if not initialize_ai_wizard():
        raise RuntimeError("Failed to initialize AI wizard. Application startup failed.")
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ALLOW_ORIGINS", "*").split(","),
    allow_credentials=os.getenv("CORS_ALLOW_CREDENTIALS", "true").lower() == "true",
    allow_methods=os.getenv("CORS_ALLOW_METHODS", "*").split(","),
    allow_headers=os.getenv("CORS_ALLOW_HEADERS", "*").split(","),
)

@app.post("/upload", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
    
    try:
        file_bytes = await file.read()
        result = handle_upload(file_bytes, file.filename)
        return {
            **result,
            "magic_level": "MAXIMUM",
            "enchantment_status": "SUCCESS",
            "message": "Your PDF has been successfully processed!"
        }
    except ConnectionError as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=503, detail="AI service is not available.")
    except Exception as e:
        logger.error(f"An unexpected error occurred during upload: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred.")

@app.get("/summarize", response_model=SummaryResponse)
async def summarize(session_id: str = Query(...), summary_type: str = Query("detailed")):
    try:
        result = handle_summarize(session_id, summary_type)
        return {
            **result,
            "magic_level": "MAXIMUM",
            "ai_wizard_status": "SUCCESS"
        }
    except ValueError:
        raise HTTPException(status_code=404, detail="Session not found.")
    except ConnectionError as e:
        logger.error(f"Summarize failed: {e}")
        raise HTTPException(status_code=503, detail="AI service is not available.")
    except Exception as e:
        logger.error(f"An unexpected error occurred during summary: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred.")

@app.post("/ask", response_model=AskResponse)
async def ask_question(request: Request, session_id: Optional[str] = Form(None), question: Optional[str] = Form(None)):
    if session_id is None or question is None:
        try:
            json_data = await request.json()
            session_id = json_data.get("session_id")
            question = json_data.get("question")
        except Exception:
            pass
    
    if not session_id or not question:
        raise HTTPException(status_code=422, detail="Both 'session_id' and 'question' are required.")

    try:
        result = handle_ask(session_id, question)
        return {
            **result,
            "magic_level": "MAXIMUM",
            "ai_wizard_status": "SUCCESS",
            "message": "Your question has been answered!"
        }
    except ValueError:
        raise HTTPException(status_code=404, detail="Session not found.")
    except ConnectionError as e:
        logger.error(f"Ask failed: {e}")
        raise HTTPException(status_code=503, detail="AI service is not available.")
    except Exception as e:
        logger.error(f"An unexpected error occurred during ask: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred.")

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Magical AI service is running."}

if __name__ == "__main__":
    logger.info("Starting Magical PDF Chat & Summarization AI Server...")
    uvicorn.run("main:app", host="127.0.0.1", port=5001, reload=False)
