from models.roadmap_schema import RoadmapData
from utils.logging_utils import setup_ai_logger
from services.cohere_api_client import CohereAPIClient
from services.roadmap_formatter import RoadmapFormatter
import json
import re

class RoadmapGenerator:
    def __init__(self, api_key, cohere_model_name='command-r-plus-08-2024'):
        self.cohere_client = CohereAPIClient(api_key, model_name=cohere_model_name, log_level="INFO")
        self.formatter = RoadmapFormatter(log_level="INFO")
        self.logger = setup_ai_logger(__name__, "roadmap_generator.log", "INFO")
        self.logger.info("RoadmapGenerator initialized")

    def generate_roadmap(self, topic, skill_level, duration_weeks):
        self.logger.info(f"Starting roadmap generation for topic: {topic}, skill_level: {skill_level}, duration: {duration_weeks} weeks")
        
        prompt = f"""
        ***
        SYSTEM INSTRUCTION: You are an expert learning roadmap generator. Your task is to generate a comprehensive, structured learning plan based on the user's request.
        ***

        Create a {duration_weeks}-week {topic} roadmap for a {skill_level} level learner.

        **STRICT OUTPUT REQUIREMENT:**
        Return a single, complete, and valid JSON object that **strictly adheres** to the specified format. **Do not include any text, narrative, markdown formatting (like ```json), or commentary outside of the JSON object itself.**

        **JSON SCHEMA CONSTRAINTS:**
        1. The "weeks" array must contain **exactly {duration_weeks}** elements, numbered sequentially from 1 to {duration_weeks}.
        2. The `estimated_hours` value must be an integer between 6 and 15.
        3. Every `milestones` week number must match an existing week in the `weeks` array.

        **REQUIRED JSON FORMAT:**
        {{
            "title": "{topic} Learning Roadmap: {skill_level.title()}",
            "overview": "A concise summary of this learning path.",
            "prerequisites": ["list", "of", "prerequisites"],
            "weeks": [
                {{
                    "week": 1,
                    "title": "Week 1 Title (e.g., Foundation & Setup)",
                    "objectives": ["list of goals for the week"],
                    "topics": ["list of specific concepts to cover"],
                    "resources": ["Concrete resource 1 (e.g., Book or Link)", "Concrete resource 2"],
                    "projects": ["list of practical exercises or mini-projects"],
                    "estimated_hours": 8 
                }}
                // ... all {duration_weeks} weeks
            ],
            "milestones": [
                {{
                    "week": 4, 
                    "milestone": "Milestone Name (e.g., Core Competency Achieved)",
                    "deliverable": "A tangible outcome"
                }}
            ],
            "final_project": "Detailed description of the capstone project",
            "next_steps": ["Next step 1", "Next step 2"]
        }}
        """
        
        roadmap_data = None
        try:
            response_text = self.cohere_client.chat_with_model(prompt)
            self.logger.info("Received response from Cohere API (via client)")

            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                
                try:
                    roadmap_data = json.loads(json_str)
                    self.logger.info("Successfully parsed JSON from response")
                except json.JSONDecodeError as e:
                    self.logger.error(f"JSON parsing failed: {str(e)}. Cannot generate roadmap.")
                    raise ValueError("Failed to parse AI response into valid JSON. (Parsing error was not recoverable)")
                
                if roadmap_data and 'milestones' in roadmap_data and 'weeks' in roadmap_data and roadmap_data['weeks']:
                    valid_weeks = {w['week'] for w in roadmap_data['weeks']}
                    roadmap_data['milestones'] = [
                        m for m in roadmap_data.get('milestones', [])
                        if m.get('week') in valid_weeks
                    ]
                else:
                    self.logger.error("Parsed data is incomplete or empty. Cannot proceed without full data structure.")
                    raise ValueError("AI response structure is critically incomplete.")

            else:
                self.logger.error("No JSON pattern found in AI response. Cannot generate roadmap.")
                raise ValueError("AI response did not contain the expected JSON structure.")
                
            if roadmap_data:
                try:
                    validated_roadmap = RoadmapData(**roadmap_data)
                    self.logger.info("Roadmap successfully validated with Pydantic schema.")
                    return self.formatter.generate_json_response(validated_roadmap, topic, skill_level, duration_weeks)
                except Exception as e:
                    self.logger.error(f"Pydantic validation failed: {str(e)}. Cannot generate roadmap.", exc_info=True)
                    raise ValueError(f"Roadmap failed Pydantic validation: {str(e)}")

        except Exception as e:
            self.logger.error(f"Critical error during roadmap generation: {str(e)}", exc_info=True)
            raise RuntimeError(f"Roadmap generation failed completely: {str(e)}")
