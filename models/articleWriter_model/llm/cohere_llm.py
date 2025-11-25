from langchain_cohere import ChatCohere
from dotenv import load_dotenv
import os
from utils.logging_utils import setup_ai_logger

class LLMConfig:
    def __init__(self):
        load_dotenv()
        self.logger = setup_ai_logger("cohere_llm")
        api_key = os.getenv('CO_API_KEY')
        if not api_key:
            self.logger.error("CO_API_KEY is not set properly")
            raise ValueError("CO_API_KEY is not set properly in environment variables")

        self.logger.info("Initializing Cohere model for CrewAI")

        try:
            self.llm = ChatCohere(
                model='command-r-plus-08-2024',
                temperature=0.0,
                max_tokens=4000,
                api_key=api_key
            )
        except Exception as e:
            self.logger.error(f"Failed to initialize Cohere LLM: {str(e)}")
            raise

    def get_llm(self):
        return self.llm
