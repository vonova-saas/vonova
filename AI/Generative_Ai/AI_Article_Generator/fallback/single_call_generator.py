import logging
from AI_Article_Generator.llm.cohere_client import LLMConfig

logger = logging.getLogger(__name__)

class CohereArticleGenerator:
    def __init__(self):
        self.llm = LLMConfig().get_llm()
    
    def generate_article(self, topic: str) -> str:
        """Generate a complete article using Cohere LLM in a single call."""
        try:
            prompt = self._create_comprehensive_prompt(topic)
            
            response = self.llm.invoke(prompt)
            article_content = response.content.strip()
            
            unwanted_phrases = [
                "This comprehensive blog post is optimized for SEO",
                "I hope this helps!",
                "Let me know if you'd like any changes."
            ]
            for phrase in unwanted_phrases:
                if article_content.endswith(phrase):
                    article_content = article_content[:-len(phrase)].strip()
            
            return article_content
            
        except Exception as e:
            logger.error(f"Article generation failed: {str(e)}")
            logger.error(f"Topic: {topic}")
            return f"""# {topic}

We encountered an issue generating your article. Please try again later.
This may be due to API limitations or temporary service issues.
"""
    
    def _create_comprehensive_prompt(self, topic: str) -> str:
        return f"""You are a professional content writer and editor.

Write a high-quality, engaging blog post in markdown format about:

**Topic:** {topic}

Requirements:
- Catchy H1 title at the top
- 150–300 word introduction that hooks the reader
- 3–6 well-structured sections with clear ## H2 headings
- Use natural, flowing language — professional yet approachable
- Naturally include 4–8 relevant SEO keywords
- Add 3–6 credible reference links (real URLs) in a References section at the end
- End with a strong, concise conclusion
- Perfect grammar, no repetition, good flow

Return **ONLY** the final markdown article — no explanations, no notes, no meta comments.
"""
