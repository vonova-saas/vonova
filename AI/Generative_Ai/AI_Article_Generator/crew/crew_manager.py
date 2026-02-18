from crewai import Crew, Process
from AI_Article_Generator.llm.cohere_llm import LLMConfig
from AI_Article_Generator.crew.agents import PlannerAgent, WriterAgent, EditorAgent
from AI_Article_Generator.crew.tasks import PlanningTask, WritingTask, EditingTask

class CrewManager:
    def __init__(self):
        self.llm = LLMConfig().get_llm()
        
    def run_crew(self, topic):
        planner_agent = PlannerAgent(llm=self.llm).create_agent(topic=topic)
        writer_agent  = WriterAgent(llm=self.llm).create_agent(topic=topic)
        editor_agent  = EditorAgent(llm=self.llm).create_agent(topic=topic)

        task_plan   = PlanningTask(agent=planner_agent, topic=topic).create_task()
        task_write  = WritingTask(agent=writer_agent, topic=topic, context=[task_plan]).create_task()
        task_edit   = EditingTask(agent=editor_agent, topic=topic, context=[task_write]).create_task()
        
        crew = Crew(
            agents=[planner_agent, writer_agent, editor_agent],
            tasks=[task_plan, task_write, task_edit],
            memory=False, 
            process=Process.sequential,
            verbose=True,
            llm=self.llm                    
        )

        result = crew.kickoff()
        return result
