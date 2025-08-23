from services.roadmap_generator import RoadmapGenerator
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from dotenv import load_dotenv
from utils.logging_utils import setup_ai_logger
import os

load_dotenv()

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
AI_SERVICE_HOST = os.getenv("AI_SERVICE_HOST", "127.0.0.1")
AI_SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT", "5000"))
COHERE_API_KEY = os.getenv("COHERE_API_KEY")

logger = setup_ai_logger(__name__, "roadmap_ai.log", LOG_LEVEL)

logger.info("Starting Roadmap AI Application")
logger.info(f"Log level: {LOG_LEVEL}")
logger.info(f"Service host: {AI_SERVICE_HOST}")
logger.info(f"Service port: {AI_SERVICE_PORT}")

if not COHERE_API_KEY:
    logger.error("COHERE_API_KEY not found in environment variables")
    raise RuntimeError("COHERE_API_KEY environment variable is required")

logger.info("API key loaded successfully")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
        
        roadmap = generator.generate_roadmap(
            topic=request.topic,
            skill_level=request.skill_level,
            duration_weeks=request.duration_weeks,
        )
        
        logger.info("Roadmap generated successfully")
        json_response = generator.generate_json_response(
            roadmap,
            request.topic,
            request.skill_level,
            request.duration_weeks
        )
        
        logger.info(f"Response prepared with roadmap ID: {json_response.get('roadmapId')}")
        return JSONResponse(content=json_response)
    
    except Exception as e:
        logger.error(f"Error in generate_roadmap_api: {str(e)}", exc_info=True)
        return JSONResponse(content={"status": False, "error": str(e)}, status_code=400)

@app.get("/health")
async def health_check():
    logger.info("Health check endpoint accessed")
    return JSONResponse(content={
        "status": "healthy", 
        "service": "roadmap-ai",
        "version": "1.0.0",
        "api_key_configured": bool(COHERE_API_KEY)
    })

if __name__ == "__main__":
    import sys
    logger.info("Starting FastAPI server")
    if len(sys.argv) > 1 and sys.argv[1] == "api":
        uvicorn.run(
            "main:app", 
            host=AI_SERVICE_HOST, 
            port=AI_SERVICE_PORT, 
            reload=True,
            log_level=LOG_LEVEL.lower()
        )
