import logging
from AI_Article_Generator.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

class WriterAgent(BaseAgent):
    """Agent responsible for writing content."""
    
    def __init__(self):
        super().__init__(
            role="Content Writer",
            goal="Write engaging, clear, and well-structured blog posts",
            backstory=(
                "You create professional, reader-friendly articles. "
                "You follow provided outlines exactly and write naturally. "
                "You include credible sources and recent data to support your content."
            )
        )
    
    def create_prompt(self, topic: str, context: str = None) -> str:
        plan_context = f"\n\nHere is content plan to follow:\n{context}" if context else ""
        
        return f"""
You are a professional Content Writer.

Write a complete, engaging blog post in markdown format about "{topic}".

Follow these rules exactly:
{plan_context}

Instructions:
1. Strictly follow the structure from the plan (if provided)
2. Use clear ## H2 and ### H3 headings
3. Write naturally — engaging and reader-friendly tone
4. Include relevant, credible references (3–6 real links)
5. Put references in a proper "References" section at the end
6. End with a short, powerful conclusion

Return ONLY clean markdown article — nothing else before or after.
"""
    
    def parse_response(self, response: str) -> str:
        unwanted_ending = "This comprehensive blog post is optimized for SEO"
        if response.strip().endswith(unwanted_ending):
            response = response.strip()[:-len(unwanted_ending)].strip()
        return response.strip()
