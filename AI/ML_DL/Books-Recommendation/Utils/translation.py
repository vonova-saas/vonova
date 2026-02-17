import os
import cohere
from dotenv import load_dotenv
from .logging import setup_ai_logger

load_dotenv()

logger = setup_ai_logger("translation")
api_key = os.getenv("CO_API_KEY")

co = None
if api_key:
    try:
        co = cohere.AsyncClient(api_key)
        logger.info("Cohere AsyncClient initialized")
    except Exception as e:
        logger.error(f"Cohere init failed: {e}")
else:
    logger.warning("CO_API_KEY not set – translation disabled")

async def translate_to_english(text: str) -> str:
    if not co or not text.strip():
        return text
    if not any("\u0600" <= c <= "\u06FF" for c in text):
        return text
    try:
        response = await co.chat(
            model="command-a-03-2025",
            message=f"Translate this Arabic text to English. Return ONLY the translation:\n\n{text}",
            temperature=0.0
        )
        return response.text.strip()
    except Exception as e:
        logger.error(f"Translation error: {e}")
        return text