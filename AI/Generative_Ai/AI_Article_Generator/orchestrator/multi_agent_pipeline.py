import logging
from AI_Article_Generator.agents.planner_agent import PlannerAgent
from AI_Article_Generator.agents.writer_agent import WriterAgent
from AI_Article_Generator.agents.editor_agent import EditorAgent

logger = logging.getLogger(__name__)

class AgentManager:
    """Custom multi-agent manager that coordinates agents without CrewAI."""
    
    def __init__(self):
        self.planner = PlannerAgent()
        self.writer = WriterAgent()
        self.editor = EditorAgent()
    
    def generate_article(self, topic: str) -> str:
        """Generate an article using the multi-agent pipeline."""
        try:
            logger.info(f"Starting multi-agent article generation for topic: {topic}")
            
            # Step 1: Planning phase
            logger.info("Step 1: Planning content...")
            plan = self.planner.execute(topic)
            logger.info("Planning completed successfully")
            
            # Step 2: Writing phase
            logger.info("Step 2: Writing content...")
            draft = self.writer.execute(topic, plan)
            logger.info("Writing completed successfully")
            
            # Step 3: Editing phase
            logger.info("Step 3: Editing and polishing...")
            final_article = self.editor.execute(topic, draft)
            logger.info("Editing completed successfully")
            
            logger.info("Multi-agent article generation completed successfully")
            return final_article
            
        except Exception as e:
            logger.error(f"Multi-agent pipeline failed: {str(e)}")
            logger.error(f"Topic: {topic}")
            
            # Fallback response
            fallback_article = f"""# {topic}

We encountered an issue generating your article using our multi-agent system. Please try again later. This may be due to API limitations or temporary service issues.

Our team is working to resolve this issue. Thank you for your patience.
"""
            return fallback_article
    
    def get_agent_status(self) -> dict:
        """Get status of all agents."""
        return {
            "planner": "ready",
            "writer": "ready", 
            "editor": "ready",
            "system": "operational"
        }
