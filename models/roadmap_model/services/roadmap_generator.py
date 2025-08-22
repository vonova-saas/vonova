from asyncio.log import logger
from models.roadmap import RoadmapData
from utils.logging_utils import setup_ai_logger
import cohere
import json
import re
import uuid

class RoadmapGenerator:
    def __init__(self, api_key):
        self.co = cohere.Client(api_key)
    
    def _sanitize_json(self, json_string):
        """Convert single quotes to double quotes and handle common JSON formatting issues"""
        try:
            # First try to parse as-is
            json.loads(json_string)
            return json_string
        except json.JSONDecodeError:
            # If parsing fails, try to sanitize
            sanitized = json_string
            
            # Replace single quotes with double quotes for property names
            sanitized = re.sub(r"(\w+)\s*:\s*'", r'"\1": "', sanitized)
            sanitized = re.sub(r",\s*'", ', "', sanitized)
            sanitized = re.sub(r"{\s*'", '{ "', sanitized)
            sanitized = re.sub(r"'\s*}", '" }', sanitized)
            sanitized = re.sub(r"'\s*,", '",', sanitized)
            sanitized = re.sub(r"'\s*:", '":', sanitized)
            
            logger.info("Sanitized JSON attempt")
            return sanitized
        except Exception as e:
            logger.error(f"Error sanitizing JSON: {str(e)}")
            return json_string

    def generate_roadmap(self, topic, skill_level="beginner", duration_weeks=12, focus_areas=None):
        logger.info(f"Starting roadmap generation for topic: {topic}, skill_level: {skill_level}, duration: {duration_weeks} weeks")
        
        focus_text = f" with focus on {', '.join(focus_areas)}" if focus_areas else ""
        logger.info(f"Focus areas: {focus_areas}")
        
        prompt = f"""
        Create a detailed {duration_weeks}-week learning roadmap for {topic} at {skill_level} level{focus_text}.
        Structure the response as a JSON with this exact format:
        {{
            "title": "Learning Roadmap Title",
            "overview": "Brief description of what will be learned",
            "prerequisites": ["prerequisite1", "prerequisite2"],
            "weeks": [
                {{
                    "week": 1,
                    "title": "Week Title",
                    "objectives": ["objective1", "objective2"],
                    "topics": ["topic1", "topic2", "topic3"],
                    "resources": ["resource1", "resource2"],
                    "projects": ["project1"],
                    "estimated_hours": 8
                }}
            ],
            "milestones": [
                {{
                    "week": 4,
                    "milestone": "First major milestone",
                    "deliverable": "What should be completed"
                }}
            ],
            "final_project": "Description of capstone project",
            "next_steps": ["What to learn next", "Advanced topics"]
        }}
        Make sure each week has 3-5 specific topics, realistic time estimates, and practical projects.
        Ensure milestones reference weeks that exist within the {duration_weeks}-week timeline.
        """
        
        logger.info("Sending request to Cohere API")
        try:
            response = self.co.generate(
                model='command-r-plus',
                prompt=prompt,
                max_tokens=2000,
                temperature=0.3,
                frequency_penalty=0.3, 
                presence_penalty=0.2,          
            )
            response_text = response.generations[0].text
            logger.info("Received response from Cohere API")
            
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                logger.info("Found JSON pattern in response")
                json_str = json_match.group()
                logger.info(f"Raw JSON string: {json_str[:200]}...")  # Log first 200 chars for debugging
                
                try:
                    # First try to parse the JSON as-is
                    roadmap_data = json.loads(json_str)
                    logger.info("Successfully parsed JSON from response")
                except json.JSONDecodeError as e:
                    logger.warning(f"JSON parsing failed: {str(e)}, attempting sanitization")
                    
                    # Try to sanitize the JSON
                    sanitized_json = self._sanitize_json(json_str)
                    try:
                        roadmap_data = json.loads(sanitized_json)
                        logger.info("Successfully parsed sanitized JSON")
                    except json.JSONDecodeError as e2:
                        logger.error(f"Sanitized JSON also failed: {str(e2)}, using fallback parsing")
                        logger.info(f"Sanitized JSON attempt: {sanitized_json[:200]}...")
                        roadmap_data = self._parse_text_response(response_text, topic, duration_weeks)
                
                # Validate and filter milestones
                if 'milestones' in roadmap_data and 'weeks' in roadmap_data:
                    roadmap_data['milestones'] = [
                        m for m in roadmap_data['milestones']
                        if m['week'] in [w['week'] for w in roadmap_data['weeks']]
                    ]
                    logger.info(f"Generated roadmap with {len(roadmap_data.get('weeks', []))} weeks")
                else:
                    logger.warning("Missing required fields in roadmap data, using fallback")
                    roadmap_data = self._parse_text_response(response_text, topic, duration_weeks)
            else:
                logger.warning("Failed to find JSON pattern in response, using fallback parsing")
                roadmap_data = self._parse_text_response(response_text, topic, duration_weeks)
            
            return roadmap_data
            
        except Exception as e:
            logger.error(f"Error generating roadmap: {str(e)}", exc_info=True)
            logger.info("Using fallback roadmap")
            return self._create_fallback_roadmap(topic, skill_level, duration_weeks)

    def _parse_text_response(self, text, topic, duration_weeks):
        milestones = []
        if duration_weeks >= 3:
            milestones.append({
                "week": duration_weeks // 3,
                "milestone": "Foundation Complete",
                "deliverable": "Basic project"
            })
        if duration_weeks >= 6:
            milestones.append({
                "week": 2 * duration_weeks // 3,
                "milestone": "Intermediate Level",
                "deliverable": "Complex project"
            })
        estimated_hours = 11 if topic == "AI Foundations" and duration_weeks == 3 else 8
        return {
            "title": f"{topic} Learning Roadmap",
            "overview": f"Comprehensive {duration_weeks}-week learning path for {topic}",
            "prerequisites": ["Basic computer skills", "Motivation to learn"],
            "weeks": [
                {
                    "week": i,
                    "title": f"Week {i}: Foundation" if i <= 2 else f"Week {i}: Advanced Topics",
                    "objectives": [f"Learn core concepts for week {i}"],
                    "topics": [f"Topic {i}.1", f"Topic {i}.2", f"Topic {i}.3"],
                    "resources": ["Online tutorials", "Documentation"],
                    "projects": [f"Week {i} project"],
                    "estimated_hours": estimated_hours if i <= duration_weeks - 1 else 32 - (duration_weeks - 1) * estimated_hours
                }
                for i in range(1, duration_weeks + 1)
            ],
            "milestones": milestones,
            "final_project": f"Comprehensive {topic} application",
            "next_steps": ["Advanced topics", "Specialization areas"]
        }
        
    def _create_fallback_roadmap(self, topic, skill_level, duration_weeks):
        milestones = []
        if duration_weeks >= 4:
            milestones.append({
                "week": max(1, duration_weeks // 3),
                "milestone": "Foundation Established",
                "deliverable": "Basic competency"
            })
        if duration_weeks >= 8:
            milestones.append({
                "week": max(1, 2 * duration_weeks // 3),
                "milestone": "Intermediate Proficiency",
                "deliverable": "Complex project"
            })
        estimated_hours = 11 if topic == "AI Foundations" and duration_weeks == 3 else 8
        return {
            "title": f"{topic} Learning Roadmap - {skill_level.title()} Level",
            "overview": f"A structured {duration_weeks}-week journey to master {topic}",
            "prerequisites": ["Basic understanding of related concepts"],
            "weeks": [
                {
                    "week": i,
                    "title": f"Week {i}: {'Fundamentals' if i <= 3 else 'Advanced Applications'}",
                    "objectives": [f"Master week {i} concepts"],
                    "topics": [f"{topic} Basics", "Practical Applications", "Hands-on Practice"],
                    "resources": ["Official documentation", "Online courses", "Practice exercises"],
                    "projects": [f"Week {i} hands-on project"],
                    "estimated_hours": estimated_hours if i <= duration_weeks - 1 else 32 - (duration_weeks - 1) * estimated_hours
                }
                for i in range(1, duration_weeks + 1)
            ],
            "milestones": milestones,
            "final_project": f"Capstone {topic} project demonstrating mastery",
            "next_steps": [f"Advanced {topic} concepts", "Related technologies", "Professional applications"]
        }

    def generate_json_response(self, roadmap_data, topic, skill_level, duration_weeks):
        total_weeks = len(roadmap_data['weeks'])
        phase_size = max(1, total_weeks // 4)
        chapters = {
            "First Steps": [],
            "Core Concepts": [],
            "Interactivity": [],
            "Advanced": []
        }
        for i, week in enumerate(roadmap_data['weeks']):
            phase = (
                "First Steps" if i < phase_size else
                "Core Concepts" if i < 2 * phase_size else
                "Interactivity" if i < 3 * phase_size else
                "Advanced"
            )
            chapters[phase].extend(week['topics'])
        tree = [{
            "name": topic,
            "children": [
                {"name": "First Steps", "children": [{"name": topic} for topic in chapters["First Steps"]]},
                {"name": "Core Concepts", "children": [{"name": topic} for topic in chapters["Core Concepts"]]},
                {"name": "Interactivity", "children": [{"name": topic} for topic in chapters["Interactivity"]]},
                {"name": "Advanced", "children": [{"name": topic} for topic in chapters["Advanced"]]}
            ]
        }]
        total_hours = sum(week['estimated_hours'] for week in roadmap_data['weeks'])
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
                "summary": f"{duration_weeks} weeks, {total_hours} total hours"
            }
        }
        return response