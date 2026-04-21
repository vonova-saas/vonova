import os
from dotenv import load_dotenv
from Config.logging_utils import setup_ai_logger

load_dotenv()

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
AI_SERVICE_HOST = os.getenv("AI_SERVICE_HOST", "0.0.0.0")
AI_SERVICE_PORT = int(os.getenv("PORT", os.getenv("AI_SERVICE_PORT", "5010")))

def setup_app_logger():
    logger = setup_ai_logger(__name__, "Agents.log", LOG_LEVEL)
    
    logger.info("Loading environment variables")
    logger.info(f"Log level: {LOG_LEVEL}")
    logger.info(f"AI Service Host: {AI_SERVICE_HOST}")
    logger.info(f"AI Service Port: {AI_SERVICE_PORT}")
    
    return logger
