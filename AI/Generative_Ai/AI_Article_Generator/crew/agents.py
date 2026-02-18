from crewai import Agent as CrewAIAgent

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
                "based on current knowledge and best practices."
            ),
            llm=llm,
            tools=[]
        )

class WriterAgent(BaseAgent):
    def __init__(self, llm):
        super().__init__(
            role="Content Writer for {topic}",
            goal="Write engaging, clear, and well-structured blog posts about {topic}",
            backstory=(
                "You create professional, reader-friendly articles. "
                "Follow the provided outline exactly and write naturally."
            ),
            llm=llm,
            tools=[]
        )

class EditorAgent(BaseAgent):
    def __init__(self, llm):
        super().__init__(
            role="Editor for {topic}",
            goal="Polish and finalize the blog post — return only the cleaned article",
            backstory=(
                "You are a professional editor. "
                "Always return the FULL polished article in clean markdown. "
                "Never write explanations, questions, apologies or comments like 'I don't understand'. "
                "Output ONLY the article — nothing else."
            ),
            llm=llm,
            tools=[]
        )
