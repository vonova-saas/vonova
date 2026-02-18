import logging
from abc import ABC, abstractmethod
from AI_Article_Generator.llm.cohere_client import LLMConfig
from typing import Optional

logger = logging.getLogger(__name__)

class BaseAgent(ABC):
    """Base class for all custom agents."""
    
    def __init__(self, role: str, goal: str, backstory: str):
        self.role = role
        self.goal = goal
        self.backstory = backstory
        self.llm = LLMConfig().get_llm()
    
    @abstractmethod
    def create_prompt(self, topic: str, context: Optional[str] = None) -> str:
        """Create prompt for this agent."""
        pass
    
    @abstractmethod
    def parse_response(self, response: str) -> str:
        """Parse and clean the response from the agent."""
        pass
    
    def execute(self, topic: str, context: Optional[str] = None) -> str:
        """Execute the agent's task."""
        try:
            prompt = self.create_prompt(topic, context)
            logger.info(f"{self.role} executing with prompt length: {len(prompt)}")
            response = self.llm.invoke(prompt)
            logger.info(f"{self.role} received response: {response.content[:100]}...")
            return self.parse_response(response.content)
        except Exception as e:
            logger.error(f"Agent {self.role} execution failed: {str(e)}")
            logger.error(f"Topic: {topic}")
            logger.error(f"Context: {context}")
            return f"Error in {self.role}: {str(e)}"
