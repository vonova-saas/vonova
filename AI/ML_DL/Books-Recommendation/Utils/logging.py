import logging
import sys
from logging.handlers import RotatingFileHandler
from dotenv import load_dotenv
import os

load_dotenv()

def setup_logger(name="recommendation.log"):
    logger = logging.getLogger(name)
    logger.setLevel(os.getenv("LOG_LEVEL", "INFO"))
    if logger.handlers:
        logger.handlers.clear()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    console = logging.StreamHandler(sys.stdout)
    console.setFormatter(formatter)
    logger.addHandler(console)
    try:
        file_handler = RotatingFileHandler(
            os.getenv("LOG_FILE", "recommendation.log"),
            maxBytes=10*1024*1024,
            backupCount=5,
            encoding='utf-8'
        )
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    except:
        pass
    return logger

def setup_ai_logger(name="ai"):
    return setup_logger(name)