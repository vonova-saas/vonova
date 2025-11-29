import logging
import sys
from logging.handlers import RotatingFileHandler
from dotenv import load_dotenv
import os

def setup_ai_logger(name: str, log_file: str = None, level: str = "INFO") -> logging.Logger:
    load_dotenv()
    log_file = log_file or os.getenv("LOG_FILE", "feedback.log")
    logger = logging.getLogger(name)
    log_level = getattr(logging, level.upper(), logging.INFO)
    logger.setLevel(log_level)

    if logger.hasHandlers():
        logger.handlers.clear()

    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s', 
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    try:
        file_handler = RotatingFileHandler(
            log_file, maxBytes=10*1024*1024, backupCount=5, encoding='utf-8'
        )
        file_handler.setLevel(log_level)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    except Exception as e:
        logger.warning(f"Could not set up file logging to {log_file}: {e}")

    logger.propagate = False

    return logger
