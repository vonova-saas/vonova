from services.roadmap_generator import RoadmapGenerator
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from utils.logging_utils import setup_ai_logger
import os
import uvicorn

load_dotenv()

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
COHERE_API_KEY = os.getenv("COHERE_API_KEY")
AI_SERVICE_HOST = os.getenv("AI_SERVICE_HOST")
AI_SERVICE_PORT = os.getenv("AI_SERVICE_PORT")
logger = setup_ai_logger(__name__, "roadmap_ai.log", LOG_LEVEL)

logger.info("Starting Roadmap AI Application")
logger.info("Loading environment variables")
logger.info(f"Log level: {LOG_LEVEL}")
logger.info(f"AI Service Host: {AI_SERVICE_HOST}")
logger.info(f"AI Service Port: {AI_SERVICE_PORT}")

if not COHERE_API_KEY:
    logger.error("COHERE_API_KEY not found in environment variables")
    raise RuntimeError("COHERE_API_KEY environment variable is required")

logger.info("API key loaded successfully")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=os.getenv("CORS_ALLOW_CREDENTIALS", "true").lower() == "true",
    allow_methods=os.getenv("CORS_ALLOW_METHODS", "*").split(","),
    allow_headers=os.getenv("CORS_ALLOW_HEADERS", "*").split(","),
)

logger.info("CORS middleware configured")

generator = RoadmapGenerator(COHERE_API_KEY)
logger.info("RoadmapGenerator initialized")

class RoadmapRequest(BaseModel):
    topic: str
    skill_level: str
    duration_weeks: int

@app.post("/generate-roadmap")
async def generate_roadmap_api(request: RoadmapRequest):
    try:
        logger.info(f"Received generate-roadmap request: {request.topic}, {request.skill_level}, {request.duration_weeks} weeks")

        json_response = generator.generate_roadmap(
            topic=request.topic,
            skill_level=request.skill_level,
            duration_weeks=request.duration_weeks,
        )

        logger.info(f"Roadmap generated successfully: {request.topic}, {request.skill_level}, {request.duration_weeks} weeks")
        logger.info(f"Response prepared with roadmap ID: {json_response.get('roadmapId')}")
        return JSONResponse(content=json_response)
        
    except Exception as e:
        logger.error(f"Error in generate_roadmap_api: {str(e)}", exc_info=True)
        return JSONResponse(content={"status": False, "error": str(e)}, status_code=500)

@app.get("/health")
async def health_check():
    logger.info("Health check endpoint accessed")
    return JSONResponse(content={"status": "healthy", "service": "roadmap-ai"})

if __name__ == "__main__":
    uvicorn.run(app, host=AI_SERVICE_HOST , port=AI_SERVICE_PORT, reload=False)
