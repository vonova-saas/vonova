import logging
from pathlib import Path
from datetime import datetime

def setup_logger(name: str, level: str = "INFO") -> logging.Logger:
    """
    Set up a logger with console and file handlers.

    Args:
        name (str): The name for the logger.
        level (str): The logging level (e.g., "INFO", "DEBUG").

    Returns:
        logging.Logger: The configured logger instance.
    """
    logger = logging.getLogger(name)
    log_level = getattr(logging, level.upper(), logging.INFO)
    logger.setLevel(log_level)

    # Avoid adding duplicate handlers
    if logger.handlers:
        return logger

    # Create logs directory if it doesn't exist
    logs_dir = Path(__file__).resolve().parent.parent / "logs"
    logs_dir.mkdir(exist_ok=True)

    # Define log file path
    current_date = datetime.now().strftime("%Y-%m-%d")
    log_file = logs_dir / f"pdf_service_{current_date}.log"

    # Define formatter
    formatter = logging.Formatter(
        '%(asctime)s | %(name)s | %(levelname)s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # File Handler
    file_handler = logging.FileHandler(log_file, encoding='utf-8')
    file_handler.setFormatter(formatter)
    
    # Console Handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)

    # Add handlers
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger

# Initialize and export the logger instance for the app to use
logger = setup_logger("PDF_Service")
