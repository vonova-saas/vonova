import os
import io
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, UploadFile, File, Query, Form, Request
from fastapi.responses import JSONResponse , StreamingResponse
from fastapi.concurrency import run_in_threadpool
import uvicorn

from AI_Article_Generator.manager.multi_agent_pipeline import AgentManager
from AI_Article_Generator.utils.translation_utils import translate, detect_language
from AI_Article_Generator.schemas.article_request import ArticleRequest

from AI_Quiz_Generator.model.quiz_schema import QuizRequest, QuizResponse
from AI_Quiz_Generator.llm.cohere_llm import generate_quiz
from AI_Quiz_Generator.utils.translation_utils import process_user_input

from AI_Roadmap_Generator.services.roadmap_generator import RoadmapGenerator
from AI_Roadmap_Generator.models.roadmap_schema import RoadmapRequest

from AI_PDF_Summary_QA.models.pdf_schema import AskResponse, UploadResponse, SummaryResponse
from AI_PDF_Summary_QA.services.pdf_service import (
    initialize_ai_wizard,
    handle_upload,
    handle_summarize,
    handle_ask
)
from AI_PDF_Summary_QA.services.Stt_service import transcribe_audio
from AI_PDF_Summary_QA.services.Tts_service import synthesize_speech
from AI_PDF_Summary_QA.helpers.utils import SUPPORTED_AUDIO_TYPES, resolve_audio_format
from AI_PDF_Summary_QA.helpers.prompts import get_voice_instruction_prompt

from AI_Problem_Solving_Coach.models.hint_schema import ErrorHintRequest, SolutionRequest, HintResponse, SolutionResponse
from AI_Problem_Solving_Coach.services.hint_service import HintService

from Config.config import validate_environment, setup_app_logger
from Config.middleware import setup_cors_middleware

# Validate environment and setup logger
effective_api_key = validate_environment()
logger = setup_app_logger()
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

# Setup middleware
setup_cors_middleware(app)

agent_manager = AgentManager()

generator = RoadmapGenerator(effective_api_key)

hint_service = HintService()

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

# PDF Voice Endpoints
@app.post("/voice/ask", tags=["PDF Summary"])
async def voice_ask(
    audio: UploadFile = File(...),
    session_id: str = Form(...),
):

    if audio.content_type not in SUPPORTED_AUDIO_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported audio format. Supported: mp3, wav, ogg, webm, m4a.")

    try:
        audio_bytes = await audio.read()
        audio_format = resolve_audio_format(audio.content_type, audio.filename or "")

        # Transcribe with accurate language detection
        transcribed_text, whisper_language, _ = transcribe_audio(audio_bytes, audio_format)
        if not transcribed_text.strip():
            raise HTTPException(status_code=422, detail="Could not transcribe audio. Speak clearly.")

        detected_language = whisper_language if whisper_language else "en"

        logger.debug(f"[VOICE] User spoke in: {detected_language} | Text: {transcribed_text[:150]}...")

        # Generate instruction prompt for AI responses
        instruction = get_voice_instruction_prompt(detected_language)

        full_prompt = instruction + transcribed_text

        logger.debug(f"[VOICE] Prompt to Gemini: {full_prompt[:200]}...")
        result = handle_ask(session_id, full_prompt)
        answer_text = result["answer"].strip()

        # Extra safety: remove any markdown that Gemini might add
        answer_text = answer_text.replace("*", "").replace("**", "").replace("###", "").replace("##", "").replace("-", "").replace("\n\n", " ").strip()

        logger.debug(f"[VOICE] Gemini answer: {answer_text[:200]}... (should be in {detected_language})")

        filename = result.get("filename", "")

        audio_response = await synthesize_speech(answer_text, detected_language)

        return StreamingResponse(
            io.BytesIO(audio_response),
            media_type="audio/mpeg",
            headers={
                "X-Session-Id": session_id,
                "X-Filename": filename,
                "X-Detected-Language": detected_language,
                "Content-Disposition": f"attachment; filename=response-{detected_language}.mp3",
            },
        )

    except HTTPException:
        raise
    except ValueError:
        raise HTTPException(status_code=404, detail="Session not found.")
    except ConnectionError:
        raise HTTPException(status_code=503, detail="AI service is not available.")
    except Exception as e:
        logger.error(f"Voice ask error: {str(e)}")
        raise HTTPException(status_code=500, detail="An internal error occurred.")

# Problem Solving Coach Endpoints
@app.post("/generate/hint", response_model=HintResponse, tags=["Problem Solving Coach"])
async def get_error_hint(request: ErrorHintRequest):
    try:
        return hint_service.get_testcase_hint(
            request.problem,
            request.submit_code,
            request.testcase_fail,
            request.testCases,
            request.language_hint
        )
    except (ValueError, RuntimeError) as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate/solution", response_model=SolutionResponse, tags=["Problem Solving Coach"])
async def generate_solution(request: SolutionRequest):
    try:
        return hint_service.generate_solution(
            request.problem,
            request.language,
            request.testCases,
            request.language_explanation
        )
    except (ValueError, RuntimeError) as e:
        raise HTTPException(status_code=500, detail=str(e))

# Health Endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Agents_api"}

if __name__ == "__main__":
    uvicorn.run(app, host=AI_SERVICE_HOST, port=AI_SERVICE_PORT, reload=False)
