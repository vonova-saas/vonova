import uuid
from agents.llm_agent import GeminiAnswerAgent, load_gemini_model
from services.proccesing import extract_text_from_pdf, clean_text
from services.embedding_index import smart_chunk_text
from utils.utils import logger

model = None
bot = None
session_store = {}

def initialize_ai_wizard():
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

def handle_upload(file_bytes: bytes, filename: str) -> dict:
    if not bot:
        raise ConnectionError("AI wizard is not initialized.")

    logger.info(f"Processing PDF: {filename}")
    
    text = extract_text_from_pdf(file_bytes)
    cleaned_text = clean_text(text)
    chunks = smart_chunk_text(cleaned_text, max_tokens=300)
    
    session_id = str(uuid.uuid4())
    session_store[session_id] = {
        "full_text": cleaned_text[:500000],
        "chunks": chunks,
        "filename": filename
    }
    logger.info(f"New session created: {session_id} for file {filename}")

    brief = bot.summarize_short(cleaned_text)
    logger.info(f"Brief summary generated for session: {session_id}")

    return {
        "session_id": session_id,
        "brief_summary": brief
    }

def handle_summarize(session_id: str, summary_type: str) -> dict:
    if not bot:
        raise ConnectionError("AI wizard is not initialized.")
    if session_id not in session_store:
        raise ValueError("Session not found.")

    data = session_store[session_id]
    full_text = data["full_text"]
    filename = data.get("filename", "Unknown")

    logger.info(f"Generating '{summary_type}' summary for session: {session_id}")
    summary = bot.summarize_document(full_text, summary_type=summary_type)
    
    return {
        "summary": summary,
        "summary_type": summary_type,
        "filename": filename
    }

def handle_ask(session_id: str, question: str) -> dict:
    if not bot:
        raise ConnectionError("AI wizard is not initialized.")
    if session_id not in session_store:
        raise ValueError("Session not found.")

    data = session_store[session_id]
    chunks = data["chunks"]
    filename = data.get("filename", "Unknown")

    logger.info(f"Answering question for session {session_id}: '{question[:50]}...'")
    answer = bot.answer_question(question, chunks[:15])

    return {
        "answer": answer,
        "session_id": session_id,
        "filename": filename
    }
