from services.roadmap_generator import RoadmapGenerator
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
import os
from utils.logging_utils import setup_ai_logger

logger = setup_ai_logger(__name__, "roadmap_ai.log", "INFO")
load_dotenv()

logger.info("Starting Roadmap AI Application")
logger.info("Loading environment variables")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger.info("CORS middleware configured")

API_KEY = os.getenv("COHERE_API_KEY")
if API_KEY:
    logger.info("API key loaded successfully")
else:
    logger.warning("COHERE_API_KEY not found in environment variables")

generator = RoadmapGenerator(API_KEY)
logger.info("RoadmapGenerator initialized")

@app.post("/generate-roadmap")
async def generate_roadmap_api(request: Request):
    try:
        logger.info("Received generate-roadmap request")
        
        data = await request.json()
        topic = data.get("topic")
        skill_level = data.get("skill_level", "beginner")
        duration_weeks = int(data.get("duration_weeks", 12))
        focus_areas = data.get("focus_areas")
        
        logger.info(f"Request parameters - topic: {topic}, skill_level: {skill_level}, duration_weeks: {duration_weeks}")
        
        if focus_areas is not None and isinstance(focus_areas, str):
            focus_areas = [area.strip() for area in focus_areas.split(",") if area.strip()]
            logger.info(f"Parsed focus areas: {focus_areas}")
        
        roadmap = generator.generate_roadmap(
            topic=topic,
            skill_level=skill_level,
            duration_weeks=duration_weeks,
            focus_areas=focus_areas
        )
        
        logger.info("Roadmap generated successfully")
        json_response = generator.generate_json_response(roadmap, topic, skill_level, duration_weeks)
        
        logger.info(f"Response prepared with roadmap ID: {json_response.get('roadmapId')}")
        return JSONResponse(content=json_response)
    
    except Exception as e:
        logger.error(f"Error in generate_roadmap_api: {str(e)}", exc_info=True)
        return JSONResponse(content={"status": False, "error": str(e)}, status_code=400)

@app.get("/health")
async def health_check():
    logger.info("Health check endpoint accessed")
    return JSONResponse(content={"status": "healthy", "service": "roadmap-ai"})

if __name__ == "__main__":
    import sys
    logger.info("Starting FastAPI server")
    if len(sys.argv) > 1 and sys.argv[1] == "api":
        uvicorn.run("main:app", host="127.0.0.1", port=5000, reload=True)
