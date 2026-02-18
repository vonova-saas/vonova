from langchain_cohere import ChatCohere
from dotenv import load_dotenv
import os

class LLMConfig:
    def __init__(self):
        load_dotenv()

        api_key = os.getenv('CO_API_KEY')
        if not api_key:
            raise ValueError("CO_API_KEY is not set properly in environment variables")

        self.llm = ChatCohere(
            model='command-a-03-2025',
            temperature=0.35,
            max_tokens=4000,
            api_key=api_key,
            max_retries=3,
            retry_delay=2
        )

    def get_llm(self):
        return self.llm
