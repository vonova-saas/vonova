import os
from contextlib import asynccontextmanager
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File, Query, Form, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
import uvicorn
from pydantic import BaseModel

from AI_Article_Generator.orchestrator.multi_agent_pipeline import AgentManager
from AI_Article_Generator.utils.translation_utils import translate, detect_language
from AI_Article_Generator.schemas.article_request import ArticleRequest

from AI_Quiz_Generator.model.quiz_schema import QuizRequest, QuizResponse
from AI_Quiz_Generator.llm.cohere_llm import generate_quiz
from AI_Quiz_Generator.utils.translation_utils import process_user_input

from AI_Roadmap_Generator.services.roadmap_generator import RoadmapGenerator

from AI_PDF_Summary_QA.models.pdf_schema import AskResponse, UploadResponse, SummaryResponse
from AI_PDF_Summary_QA.services.pdf_service import (
    initialize_ai_wizard,
    handle_upload,
    handle_summarize,
    handle_ask,
    handle_delete_session
)

from Config.logging_utils import setup_ai_logger

# Environment setup
load_dotenv()

CO_API_KEY = os.getenv("CO_API_KEY")
COHERE_API_KEY = os.getenv("COHERE_API_KEY")

missing = []
if not CO_API_KEY and not COHERE_API_KEY:
    missing.append("COHERE_API_KEY or CO_API_KEY")

if missing:
    raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")

# Use whichever API key is available for services
effective_api_key = CO_API_KEY or COHERE_API_KEY

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
AI_SERVICE_HOST = os.getenv("AI_SERVICE_HOST", "0.0.0.0")
AI_SERVICE_PORT = int(os.getenv("PORT", os.getenv("AI_SERVICE_PORT", "5010")))

logger = setup_ai_logger(__name__, "Agents.log", LOG_LEVEL)

logger.info("Loading environment variables")
logger.info(f"Log level: {LOG_LEVEL}")
logger.info(f"AI Service Host: {AI_SERVICE_HOST}")
logger.info(f"AI Service Port: {AI_SERVICE_PORT}")

if not effective_api_key:
    logger.error("No valid API key found (CO_API_KEY or COHERE_API_KEY)")
    raise RuntimeError("Either CO_API_KEY or COHERE_API_KEY environment variable is required")
logger.info("API key loaded successfully")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing AI services...")
    try:
        if not initialize_ai_wizard():
            logger.warning("AI wizard initialization failed - PDF services will be unavailable")
        else:
            logger.info("AI wizard initialized successfully")
    except Exception as e:
        logger.error(f"Error during AI wizard initialization: {str(e)}")
        logger.warning("PDF services will be unavailable")
    
    logger.info("Application startup complete")
    yield
    logger.info("Application shutdown complete")

app = FastAPI(title="Agents API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=os.getenv("CORS_ALLOW_CREDENTIALS", "true").lower() == "true",
    allow_methods=os.getenv("CORS_ALLOW_METHODS", "GET,POST").split(","),
    allow_headers=os.getenv("CORS_ALLOW_HEADERS", "*").split(","),
)

agent_manager = AgentManager()

generator = RoadmapGenerator(effective_api_key)
class RoadmapRequest(BaseModel):
    topic: str
    skill_level: str
    duration_weeks: int

# Roadmap Endpoint
@app.post("/generate-roadmap", tags=["Roadmap"])
async def generate_roadmap_api(request: RoadmapRequest):
    try:
        json_response = generator.generate_roadmap(
            topic=request.topic,
            skill_level=request.skill_level,
            duration_weeks=request.duration_weeks,
        )
        return JSONResponse(content=json_response)
        
    except Exception as e:
        return JSONResponse(
            content={"status": False, "error": str(e)},
            status_code=500
        )

# Article Endpoint
@app.post("/generate_article", tags=["Article"])
async def generate_article(request: ArticleRequest):
    original_topic = request.topic
    
    try:
        lang = await detect_language(original_topic)
        topic_for_crew = original_topic

        if lang == 'ar':
            topic_for_crew = await translate(
                text=original_topic,
                target_language='English',
                source_language='Arabic'
            )
        
        result = await run_in_threadpool(agent_manager.generate_article, topic_for_crew)
        
        english_article = result
        
        unwanted_ending = "This comprehensive blog post is optimized for SEO"
        if english_article.strip().endswith(unwanted_ending):
            english_article = english_article.strip()[:-len(unwanted_ending)].strip()
        
        final_article_content = english_article
        if lang == 'ar':
            final_article_content = await translate(
                text=english_article,
                target_language='Arabic',
                source_language='English'
            )
        
        return {"article": final_article_content}
        
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=f"Invalid input or configuration error: {str(ve)}")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal service error during article generation: {str(e)}")

# Quiz Endpoint 
@app.post("/generate-quiz", response_model=QuizResponse, tags=["Quiz"])
async def create_quiz(request: QuizRequest):
    english_topic = await process_user_input(request.topic)
    english_level_raw = await process_user_input(request.level)
    
    level_map = {
        "easy": "easy", "beginner": "easy",
        "medium": "medium", "متوسط": "medium", "average": "medium",
        "hard": "hard", "صعب": "hard", "advanced": "hard"
    }
    english_level = level_map.get(english_level_raw.lower(), "medium")

    if request.mc_questions + request.tf_questions != request.total_questions:
        adjusted_tf = request.total_questions - request.mc_questions
        if adjusted_tf < 0:
            adjusted_tf = 0
            request.mc_questions = request.total_questions
        request.tf_questions = adjusted_tf

    try:
        quiz = await generate_quiz(
            topic=request.topic,
            total_questions=request.total_questions,
            mc_questions=request.mc_questions,
            tf_questions=request.tf_questions,
            level=english_level
        )
        return quiz
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to generate quiz")

# PDF EndPoint
@app.post("/upload", response_model=UploadResponse, tags=["PDF Summary"])
async def upload_pdf(
    file: UploadFile = File(...),
    language: Optional[str] = Form(None),
    auto_summarize: Optional[bool] = Form(None)
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
    
    try:
        file_bytes = await file.read()
        result = handle_upload(file_bytes, file.filename, language=language)
        return {
            **result,
            "magic_level": "MAXIMUM",
            "enchantment_status": "SUCCESS",
            "message": "Your PDF has been successfully processed!",
            "language": language or "en"
        }
    except ConnectionError:
        raise HTTPException(status_code=503, detail="AI service is not available.")
    except Exception:
        raise HTTPException(status_code=500, detail="An internal error occurred.")

@app.get("/summarize", response_model=SummaryResponse, tags=["PDF Summary"])
async def summarize(session_id: str = Query(...), summary_type: str = Query("detailed")):
    try:
        result = handle_summarize(session_id, summary_type)
        return {
            **result,
            "magic_level": "MAXIMUM",
            "ai_wizard_status": "SUCCESS"
        }
    except ValueError:
        raise HTTPException(status_code=404, detail="Session not found.")
    except ConnectionError:
        raise HTTPException(status_code=503, detail="AI service is not available.")
    except Exception:
        raise HTTPException(status_code=500, detail="An internal error occurred.")

@app.post("/ask", response_model=AskResponse, tags=["PDF Summary"])
async def ask_question(request: Request, session_id: Optional[str] = Form(None), question: Optional[str] = Form(None)):
    if session_id is None or question is None:
        try:
            json_data = await request.json()
            session_id = json_data.get("session_id")
            question = json_data.get("question")
        except Exception:
            pass
    
    if not session_id or not question:
        raise HTTPException(status_code=422, detail="Both 'session_id' and 'question' are required.")

    try:
        result = handle_ask(session_id, question)
        return {
            **result,
            "magic_level": "MAXIMUM",
            "ai_wizard_status": "SUCCESS",
            "message": "Your question has been answered!"
        }
    except ValueError:
        raise HTTPException(status_code=404, detail="Session not found.")
    except ConnectionError:
        raise HTTPException(status_code=503, detail="AI service is not available.")
    except Exception:
        raise HTTPException(status_code=500, detail="An internal error occurred.")

@app.delete("/session/{session_id}", status_code=204, tags=["PDF Summary"])
async def delete_session(session_id: str):
    try:
        deleted = handle_delete_session(session_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Session not found.")
        return None
    except ValueError:
        raise HTTPException(status_code=404, detail="Session not found.")
    except Exception:
        raise HTTPException(status_code=500, detail="An internal error occurred.")

# Health Endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Agents_api"}

if __name__ == "__main__":
    uvicorn.run(app, host=AI_SERVICE_HOST, port=AI_SERVICE_PORT, reload=False)
