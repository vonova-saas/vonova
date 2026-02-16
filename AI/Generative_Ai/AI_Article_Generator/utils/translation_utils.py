import os
import cohere
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('CO_API_KEY')

if not api_key:
    raise ValueError("CO_API_KEY is not set properly in environment variables")

cohere_async_client = cohere.AsyncClient(api_key)

async def translate(text: str, target_language: str, source_language: str) -> str:
    prompt = (
        f"Translate the following text from {source_language} to {target_language}. "
        "Your response must ONLY contain the translated text, with no extra formatting or conversation."
        f"\n\n--- TEXT ---\n\n{text}"
    )
    
    try:
        response = await cohere_async_client.chat(
            model='command-a-03-2025', 
            message=prompt,
            temperature=0.0
        )
        return response.text.strip()
    except Exception:
        return text

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
            model='command-a-03-2025', 
            message=prompt,
            temperature=0.0
        )
        
        lang_code = response.text.strip().lower()
        if len(lang_code) == 2 and lang_code.isalpha():
            return lang_code
            
        return "en"
    except Exception:
        return "en"
