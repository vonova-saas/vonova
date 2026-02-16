import os
import cohere
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('COHERE_API_KEY')

if not api_key:
    raise ValueError("COHERE_API_KEY is not set properly in environment variables")

cohere_async_client = cohere.AsyncClient(api_key)

async def translate(text: str, target_language: str, source_language: str) -> str:
    prompt = (
        f"Translate the following text from {source_language} to {target_language}. "
        "Your response must ONLY contain the translated text, with no extra formatting or conversation."
        f"\n\n--- TEXT ---\n\n{text}"
    )
    try:
        response = await cohere_async_client.chat(
            model='command-a-translate-08-2025',
            message=prompt,
            temperature=0.0
        )
        return response.text.strip()
    except Exception:
        return text  # silent fallback

async def detect_language(text: str) -> str:
    if not any(c.isalpha() for c in text):
        return "en"
    
    prompt = (
        "Detect the language of the following text. Respond ONLY with the two-letter "
        "ISO 639-1 code (e.g., 'en', 'ar')."
        f"\n\n--- TEXT ---\n\n{text}"
    )
    try:
        response = await cohere_async_client.chat(
            model='command-a-translate-08-2025',
            message=prompt,
            temperature=0.0
        )
        lang_code = response.text.strip().lower()
        if len(lang_code) == 2 and lang_code.isalpha():
            return lang_code
        return "en"
    except Exception:
        return "en"

async def process_user_input(user_input: str) -> str:
    lang = await detect_language(user_input)
    translated_input = await translate(user_input, "en", lang)
    return translated_input
