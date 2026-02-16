from AI_Roadmap_Generator.models.roadmap_schema import RoadmapData
from AI_Roadmap_Generator.services.roadmap_formatter import RoadmapFormatter
import cohere
import json
import re


class RoadmapGenerator:
    def __init__(self, api_key, cohere_model_name='command-r-plus-08-2024'):
        self.api_key = api_key
        self.model_name = cohere_model_name
        self.cohere_client = cohere.ClientV2(api_key=api_key)
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
            response = self.cohere_client.chat(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}]
            )
            response_text = response.message.content[0].text

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

        except cohere.CohereError as e:
            raise RuntimeError(f"Cohere API error: {str(e)}")
        except Exception as e:
            raise RuntimeError(f"Roadmap generation failed: {str(e)}")
