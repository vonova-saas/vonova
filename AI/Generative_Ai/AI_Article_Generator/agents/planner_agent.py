import logging
from AI_Article_Generator.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

class PlannerAgent(BaseAgent):
    """Agent responsible for creating content plans."""
    
    def __init__(self):
        super().__init__(
            role="Content Planner",
            goal="Plan detailed, accurate, and structured content",
            backstory=(
                "You are a fact-driven planner who creates clear, logical outlines "
                "based on current knowledge and best practices. "
                "You create comprehensive content plans that guide the writing process."
            )
        )
    
    def create_prompt(self, topic: str, context: str = None) -> str:
        return f"""Create a content plan for a blog post about "{topic}".

Include:
1. Target audience
2. 3-5 SEO keywords
3. Article structure with brief descriptions

Format:
**Target Audience:** [description]
**SEO Keywords:** [keywords]
**Structure:**
- Introduction: [description]
- Section 1: [title] - [key points]
- Section 2: [title] - [key points]
- Section 3: [title] - [key points]
- Conclusion: [description]"""
    
    def parse_response(self, response: str) -> str:
        return response.strip()
