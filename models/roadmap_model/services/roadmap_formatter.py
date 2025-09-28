import uuid
from utils.logging_utils import setup_ai_logger

class RoadmapFormatter:
    def __init__(self, log_level="INFO"):
        self.logger = setup_ai_logger(__name__, "roadmap_formatter.log", log_level)
        self.logger.info("RoadmapFormatter initialized")

    def generate_json_response(self, roadmap_data, topic, skill_level, duration_weeks):
        if hasattr(roadmap_data, 'dict'):
            roadmap_data = roadmap_data.dict()

        total_weeks = len(roadmap_data.get('weeks', []))
        if total_weeks == 0:
            self.logger.warning("Roadmap data contains no weeks, generating response with empty chapters/tree.")
            return {
                "status": True,
                "text": {"query": topic, "chapters": {}},
                "tree": [{"name": topic, "children": []}],
                "roadmapId": str(uuid.uuid4()),
                "metadata": {
                    "generated": f"{topic}: A {duration_weeks}-Week {skill_level.title()} Roadmap",
                    "summary": "No detailed roadmap generated. Please try again."
                }
            }

        chapters = {
            "Introduction & Basics": [],
            "Core Development": [],
            "Advanced Topics": [],
            "Specialization & Project": []
        }
        
        for i, week in enumerate(roadmap_data['weeks']):
            week_topics = week.get('topics', [])
            if i < total_weeks * 0.25: 
                chapters["Introduction & Basics"].extend(week_topics)
            elif i < total_weeks * 0.5: 
                chapters["Core Development"].extend(week_topics)
            elif i < total_weeks * 0.75: 
                chapters["Advanced Topics"].extend(week_topics)
            else:
                chapters["Specialization & Project"].extend(week_topics)

        for key in chapters:
            chapters[key] = sorted(list(set(chapters[key])))

        tree = [{
            "name": topic,
            "children": [
                {"name": chapter_name, "children": [{"name": t} for t in topics]}
                for chapter_name, topics in chapters.items() if topics
            ]
        }]
        
        total_hours = sum(week.get('estimated_hours', 0) for week in roadmap_data.get('weeks', []))
        response = {
            "status": True,
            "text": {
                "query": topic,
                "chapters": chapters
            },
            "tree": tree,
            "roadmapId": str(uuid.uuid4()),
            "metadata": {
                "generated": f"{topic}: A {duration_weeks}-Week {skill_level.title()} Roadmap",
                "summary": f"{duration_weeks} weeks, {total_hours} total estimated hours"
            }
        }
        self.logger.info(f"Generated final JSON response for roadmap ID: {response['roadmapId']}")
        return response
