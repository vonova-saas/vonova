import os
from crewai import Agent as CrewAIAgent

def _get_search_tools():
    serper_key = os.getenv("SERPER_API_KEY")
    if serper_key:
        try:
            from crewai_tools import SerperDevTool
            os.environ["SERPER_API_KEY"] = serper_key
            return [SerperDevTool()]
        except ImportError:
            pass
    return []

SEARCH_TOOLS = _get_search_tools()


class BaseAgent:
    def __init__(self, role: str, goal: str, backstory: str, llm: object, tools: list = []):
        self.role = role
        self.goal = goal
        self.backstory = backstory
        self.llm = llm
        self.tools = tools

    def create_agent(self, topic: str):
        return CrewAIAgent(
            role=self.role.format(topic=topic),
            goal=self.goal.format(topic=topic),
            backstory=self.backstory,
            allow_delegation=False,
            verbose=True,
            llm=self.llm,
            tools=self.tools
        )


class PlannerAgent(BaseAgent):
    def __init__(self, llm):
        super().__init__(
            role="Content Planner for {topic}",
            goal="Plan detailed, accurate, and structured content on {topic}",
            backstory=(
                "You are a fact-driven planner who creates clear, logical outlines "
                "based on current knowledge and best practices. "
                "Use web search to find the latest trends, statistics, and best practices "
                "related to the topic before building the content plan."
            ),
            llm=llm,
            tools=SEARCH_TOOLS 
        )


class WriterAgent(BaseAgent):
    def __init__(self, llm):
        super().__init__(
            role="Content Writer for {topic}",
            goal="Write engaging, clear, and well-structured blog posts about {topic}",
            backstory=(
                "You create professional, reader-friendly articles. "
                "Follow the provided outline exactly and write naturally. "
                "Use web search to find credible sources, recent data, and real reference "
                "links to include in the article."
            ),
            llm=llm,
            tools=SEARCH_TOOLS  
        )


class EditorAgent(BaseAgent):
    def __init__(self, llm):
        super().__init__(
            role="Editor for {topic}",
            goal="Polish and finalize the blog post – return only the cleaned article",
            backstory=(
                "You are a professional editor. "
                "Always return the FULL polished article in clean markdown. "
                "Never write explanations, questions, apologies or comments like 'I don't understand'. "
                "Output ONLY the article – nothing else."
            ),
            llm=llm,
            tools=[]  
        )
