from fastapi import FastAPI, HTTPException
from starlette.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
import uvicorn
from fastapi.concurrency import run_in_threadpool

from crew.crew_manager import CrewManager
from utils.logging_utils import setup_ai_logger
from utils.translation_utils import translate, detect_language
from models.article_schema import ArticleRequest

load_dotenv()

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
AI_SERVICE_HOST = os.getenv("AI_SERVICE_HOST", "127.0.0.1")
AI_SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT", "5010"))

logger = setup_ai_logger("article_api")

logger.info("Loading environment variables...")
logger.info(f"Log level: {LOG_LEVEL}")
logger.info(f"AI Service Host: {AI_SERVICE_HOST}")
logger.info(f"AI Service Port: {AI_SERVICE_PORT}")

app = FastAPI(title="Article Generation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=os.getenv("CORS_ALLOW_CREDENTIALS", "true").lower() == "true",
    allow_methods=os.getenv("CORS_ALLOW_METHODS", "GET,POST").split(","),
    allow_headers=os.getenv("CORS_ALLOW_HEADERS", "*").split(","),
)

crew_manager = CrewManager()

@app.post("/generate_article")
async def generate_article(request: ArticleRequest):
    original_topic = request.topic
    
    try:
        lang = await detect_language(original_topic)
        topic_for_crew = original_topic

        if lang == 'ar':
            logger.info(f"Arabic topic detected: '{original_topic}'")
            topic_for_crew = await translate(
                text=original_topic,
                target_language='English',
                source_language='Arabic'
            )
            logger.info(f"Translated topic for crew: '{topic_for_crew}'")
        
        result = await run_in_threadpool(crew_manager.run_crew, topic_for_crew)
        
        english_article = result.raw
        
        unwanted_ending = "This comprehensive blog post is optimized for SEO"
        if english_article.strip().endswith(unwanted_ending):
            english_article = english_article.strip()[:-len(unwanted_ending)].strip()
        
        final_article_content = english_article
        if lang == 'ar':
            logger.info("Translating final article from English back to Arabic.")
            final_article_content = await translate(
                text=english_article,
                target_language='Arabic',
                source_language='English'
            )
        
        logger.info(f"Successfully generated article for original topic: {original_topic}")
        return {"article": final_article_content}
        
    except ValueError as ve:
        logger.error(f"Configuration or validation error for topic {original_topic}: {str(ve)}")
        raise HTTPException(status_code=400, detail=f"Invalid input or configuration error: {str(ve)}")
    
    except Exception as e:
        logger.error(f"Error generating article for topic {original_topic}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal service error during article generation: {str(e)}")

@app.get("/health")
async def health_check():
    logger.info("Health check requested")
    return {"status": "healthy", "service": "article_generation_api"}

if __name__ == "__main__":
    logger.info(f"Starting Uvicorn server on {AI_SERVICE_HOST}:{AI_SERVICE_PORT}")
    uvicorn.run(app, host=AI_SERVICE_HOST, port=AI_SERVICE_PORT, reload=False)
