from model import RoadmapGenerator
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
API_KEY = os.getenv("COHERE_API_KEY")
generator = RoadmapGenerator(API_KEY)

@app.post("/generate-roadmap")
async def generate_roadmap_api(request: Request):
    try:
        data = await request.json()
        topic = data.get("topic")
        skill_level = data.get("skill_level", "beginner")
        duration_weeks = int(data.get("duration_weeks", 12))
        focus_areas = data.get("focus_areas")
        if focus_areas is not None and isinstance(focus_areas, str):
            focus_areas = [area.strip() for area in focus_areas.split(",") if area.strip()]
        roadmap = generator.generate_roadmap(
            topic=topic,
            skill_level=skill_level,
            duration_weeks=duration_weeks,
            focus_areas=focus_areas
        )
        json_response = generator.generate_json_response(roadmap, topic, skill_level, duration_weeks)
        return JSONResponse(content=json_response)
    except Exception as e:
        return JSONResponse(content={"status": False, "error": str(e)}, status_code=400)

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "api":
        uvicorn.run("main:app", host="127.0.0.1", port=5000, reload=True)