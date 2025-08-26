import logging
import os
import sys
from pathlib import Path
from datetime import datetime

def setup_logging():
    """Configure creative and colorful logging to file and console"""
    try:
        # Get the project root directory
        project_root = Path(__file__).resolve().parent.parent
        logs_dir = project_root / "logs"
        
        # Create logs directory if it doesn't exist
        logs_dir.mkdir(exist_ok=True, parents=True)
        
        # Set up log file path with creative naming (Windows-safe)
        current_date = datetime.now().strftime("%Y-%m-%d")
        log_file = logs_dir / f"magical_pdf_chat_{current_date}.log"
        
        # Creative logging configuration with emojis and fun formatting (Windows-safe)
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s | %(name)s | %(levelname)s |%(message)s',
            datefmt='%Y-%m-%d %H:%M:%S',
            handlers=[
                logging.FileHandler(log_file, encoding='utf-8'),
                logging.StreamHandler()
            ]
        )
        
        logger = logging.getLogger("PDF_Chat_Magician")
        logger.info("Magical logging system activated!")
        logger.info(f"Log file location: {log_file.absolute()}")
        logger.info("Let the PDF conversation magic begin!")
        
        return logger
        
    except Exception as e:
        print(f"Critical error setting up magical logging: {e}")
        # Fallback to basic console logging
        logging.basicConfig(level=logging.INFO)
        return logging.getLogger("chat_logger_emergency")

# Initialize logger
logger = setup_logging()

def log_event(event: str):
    """Record any magical public events with creative flair"""
    logger.info(f"Event: {event}")

def log_chat(session_id: str, question: str, answer: str):
    """Creative chat logging with conversation magic"""
    logger.info(f"Chat Magic - Session: {session_id}")
    logger.info(f"Question: {question[:100]}...")
    logger.info(f"AI Response: {answer[:100]}...")
    logger.info("Conversation sparkles added!")

def log_upload(session_id: str, filename: str, file_size: int):
    """Creative upload logging with file magic"""
    logger.info(f"File Upload Magic - Session: {session_id}")
    logger.info(f"Document: {filename}")
    logger.info(f"Size: {file_size} bytes")
    logger.info("Document successfully enchanted!")

def log_error(error: str, context: str = ""):
    """Creative error logging with magical error handling"""
    if context:
        logger.error(f"Oops! Magic went wrong in {context}: {error}")
    else:
        logger.error(f"Unexpected magical mishap: {error}")
    logger.error("Don't worry, the magic will be restored!")

def log_magic_moment(moment: str):
    """Log special magical moments in the PDF chat journey"""
    logger.info(f"Magical Moment: {moment}")

def log_user_mood(mood: str):
    """Log user mood and interaction style"""
    logger.info(f"User Mood: {mood} - Spreading positive vibes!")

def log_ai_creativity(creativity_level: str):
    """Log AI creativity levels and artistic responses"""
    logger.info(f"AI Creativity Level: {creativity_level} - Painting with words!")
