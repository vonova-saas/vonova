from AI_Roadmap_Generator.models.roadmap_schema import RoadmapData
from AI_Roadmap_Generator.services.roadmap_formatter import RoadmapFormatter
from AI_Roadmap_Generator.llm.cohere_llm import CohereAPIClient
import json
import re


class RoadmapGenerator:
    def __init__(self, cohere_model_name='command-r-plus-08-2024'):
        self.model_name = cohere_model_name
        self.cohere_client = CohereAPIClient(model_name=cohere_model_name)
        self.formatter = RoadmapFormatter()

    def generate_roadmap(self, topic, skill_level, duration_weeks):
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
            response_text = self.cohere_client.chat_with_model(
                message=prompt,
                max_tokens=4000,
                temperature=0.0
            )

            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                
                try:
                    roadmap_data = json.loads(json_str)
                except json.JSONDecodeError:
                    raise ValueError("Failed to parse AI response into valid JSON")

                if roadmap_data and 'milestones' in roadmap_data and 'weeks' in roadmap_data and roadmap_data['weeks']:
                    valid_weeks = {w['week'] for w in roadmap_data['weeks']}
                    roadmap_data['milestones'] = [
                        m for m in roadmap_data.get('milestones', [])
                        if m.get('week') in valid_weeks
                    ]
                else:
                    raise ValueError("AI response structure is incomplete")

            else:
                raise ValueError("AI response did not contain the expected JSON structure")
                
            if roadmap_data:
                try:
                    validated_roadmap = RoadmapData(**roadmap_data)
                    return self.formatter.generate_json_response(
                        validated_roadmap, topic, skill_level, duration_weeks
                    )
                except Exception as e:
                    raise ValueError(f"Roadmap failed Pydantic validation: {str(e)}")

        except Exception as e:
            raise RuntimeError(f"Roadmap generation failed: {str(e)}")
