import logging
from AI_Article_Generator.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

class EditorAgent(BaseAgent):
    """Agent responsible for editing and polishing content."""
    
    def __init__(self):
        super().__init__(
            role="Editor",
            goal="Polish and finalize blog posts",
            backstory=(
                "You are a professional editor. "
                "You ensure perfect grammar, spelling, and flow. "
                "You always return ONLY the final polished article - no explanations."
            )
        )
    
    def create_prompt(self, topic: str, context: str = None) -> str:
        return f"""
You are a professional Editor. Polish and finalize the blog post about "{topic}" provided below.

Your tasks:
1. Fix grammar, spelling and punctuation
2. Improve sentence flow and readability
3. Make tone consistent, professional and engaging
4. Check structure: good intro → clear sections → strong conclusion
5. Ensure reference links are properly formatted and relevant
6. Add a 'References' section at the end if not already present

IMPORTANT: Return ONLY the final cleaned article in markdown format.
Do NOT add explanations, questions, notes or any text outside the article itself.

Article to edit:
{context}
"""
    
    def parse_response(self, response: str) -> str:
        return response.strip()
