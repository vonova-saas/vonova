import uuid
import time
from typing import Optional
from datetime import datetime, timedelta
from AI_PDF_Summary_QA.agents.llm_agent import GeminiAnswerAgent, load_gemini_model
from AI_PDF_Summary_QA.services.proccesing import extract_text_from_pdf, clean_text
from AI_PDF_Summary_QA.services.embedding_index import smart_chunk_text
from AI_PDF_Summary_QA.services.session_storage import store_session, get_session, delete_session, session_exists
from AI_PDF_Summary_QA.services.query_history_storage import store_query_history, delete_query_history

model = None
bot = None

def initialize_ai_wizard():
    global model, bot
    try:
        model = load_gemini_model()
        bot = GeminiAnswerAgent(model)
        return True
    except Exception:
        return False

def handle_upload(file_bytes: bytes, filename: str, language: Optional[str] = None) -> dict:
    if not bot:
        raise ConnectionError("AI wizard is not initialized.")

    start_time = time.time()
    
    text, page_count = extract_text_from_pdf(file_bytes)
    cleaned_text = clean_text(text)
    chunks = smart_chunk_text(cleaned_text, max_tokens=300)
    
    session_id = str(uuid.uuid4())
    file_size = len(file_bytes)
    
    brief = bot.summarize_short(cleaned_text)
    
    session_data = {
        "full_text": cleaned_text[:500000],
        "chunks": chunks,
        "filename": filename,
        "summary": brief,
        "summary_type": "brief",
        "file_size": file_size,
        "page_count": page_count,
        "language": language or "en",
        "status": "completed",
        "processing_time": time.time() - start_time
    }
    
    store_session(session_id, session_data)
    
    return {
        "session_id": session_id,
        "brief_summary": brief,
        "file_size": file_size,
        "page_count": page_count,
        "language": language or "en"
    }

def handle_summarize(session_id: str, summary_type: str) -> dict:
    if not bot:
        raise ConnectionError("AI wizard is not initialized.")
    
    data = get_session(session_id)
    if not data:
        raise ValueError("Session not found.")

    full_text = data.get("full_text", "")
    filename = data.get("filename", "Unknown")
    
    stored_summary = data.get("summary")
    stored_summary_type = data.get("summary_type")
    
    if stored_summary and summary_type == stored_summary_type:
        return {
            "summary": stored_summary,
            "summary_type": summary_type,
            "filename": filename,
            "cached": True
        }

    summary = bot.summarize_document(full_text, summary_type=summary_type)
    
    data["summary"] = summary
    data["summary_type"] = summary_type
    store_session(session_id, data)
    
    return {
        "summary": summary,
        "summary_type": summary_type,
        "filename": filename,
        "cached": False
    }

def handle_ask(session_id: str, question: str) -> dict:
    if not bot:
        raise ConnectionError("AI wizard is not initialized.")
    
    data = get_session(session_id)
    if not data:
        raise ValueError("Session not found.")

    chunks = data.get("chunks", [])
    filename = data.get("filename", "Unknown")
    
    chunks_used = chunks[:15]
    start_time = time.time()
    
    answer = bot.answer_question(question, chunks_used)
    
    response_time = time.time() - start_time
    
    try:
        store_query_history(
            session_id=session_id,
            query_text=question,
            response=answer,
            chunks_used=[str(chunk) for chunk in chunks_used],
            tokens_used=0,
            model_used="gemini",
            response_time=response_time
        )
    except Exception:
        pass  # silent fallback

    return {
        "answer": answer,
        "session_id": session_id,
        "filename": filename,
        "chunks_used": len(chunks_used),
        "response_time": response_time
    }

def handle_delete_session(session_id: str) -> bool:
    try:
        if not session_exists(session_id):
            return False
        
        deleted = delete_session(session_id)
        
        try:
            delete_query_history(session_id)
        except Exception:
            pass
        
        return deleted
    except Exception:
        return False
