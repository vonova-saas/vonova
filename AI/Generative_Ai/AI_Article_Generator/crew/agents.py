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
            allow_delegation=True, 
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
                "You are a fact-driven planner who researches trends, key players, "
                "and trustworthy sources. Your outlines must be structured and based on real data."
            ),
            llm=llm,
            tools=[] 
        )

class WriterAgent(BaseAgent):
    def __init__(self, llm):
        super().__init__(
            role="Content Writer for {topic}",
            goal="Write insightful, clear, and factually accurate blog posts about {topic}",
            backstory=(
                "You expand the planner's outline into a detailed blog article. "
                "Your writing is professional yet engaging, and includes SEO keywords naturally. "
                "You cite facts, balance opinions, and proofread carefully."
            ),
            llm=llm,
            tools=[] 
        )

class EditorAgent(BaseAgent):
    def __init__(self, llm):
        super().__init__(
            role="Editor for {topic}",
            goal="Polish and fact-check the blog post for accuracy, grammar, and style",
            backstory=(
                "You ensure the final blog post is accurate, professional, and free from errors. "
                "You rewrite weak sentences and maintain a balanced, neutral tone."
            ),
            llm=llm,
            tools=[]
        )
