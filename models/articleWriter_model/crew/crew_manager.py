from crewai import Crew, Process
from llm.cohere_llm import LLMConfig
from crew.agents import PlannerAgent, WriterAgent, EditorAgent
from crew.tasks import PlanningTask, WritingTask, EditingTask
from utils.logging_utils import setup_ai_logger

class CrewManager:

    def __init__(self):
        self.llm = LLMConfig().get_llm()
        self.logger = setup_ai_logger("crew_manager")
        
    def run_crew(self, topic):
        self.logger.info(f"Initializing crew for topic: {topic}")

        planner_agent = PlannerAgent(llm=self.llm).create_agent(topic=topic)
        writer_agent = WriterAgent(llm=self.llm).create_agent(topic=topic)
        editor_agent = EditorAgent(llm=self.llm).create_agent(topic=topic)

        
        task_plan = PlanningTask(agent=planner_agent, topic=topic).create_task()
        task_write = WritingTask(agent=writer_agent, topic=topic, context=[task_plan]).create_task()
        task_edit = EditingTask(agent=editor_agent, topic=topic, context=[task_write]).create_task()
        
        crew = Crew(
            agents=[
                planner_agent,
                writer_agent,
                editor_agent
            ],
            tasks=[
                task_plan,
                task_write,
                task_edit
            ],
            memory=False, 
            process=Process.sequential,
            verbose=True
        )

        self.logger.info(f"Starting crew execution for topic: {topic}")
        result = crew.kickoff()

        self.logger.info(f"Completed crew execution for topic: {topic}")
        return result
