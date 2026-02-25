import os
from dotenv import load_dotenv
from Config.logging_utils import setup_ai_logger

# Load environment variables
load_dotenv()

# API Keys
CO_API_KEY = os.getenv("CO_API_KEY")
COHERE_API_KEY = os.getenv("COHERE_API_KEY")

# Service Configuration
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

def validate_environment():
    missing = []
    if not CO_API_KEY and not COHERE_API_KEY:
        missing.append("COHERE_API_KEY or CO_API_KEY")
    
    if missing:
        raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")
    
    effective_api_key = CO_API_KEY or COHERE_API_KEY
    if not effective_api_key:
        raise RuntimeError("Either CO_API_KEY or COHERE_API_KEY environment variable is required")
    
    return effective_api_key
