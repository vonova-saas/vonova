from crewai import Task as CrewAITask
from pydantic import BaseModel, ConfigDict
from typing import List, Optional

class BaseTask(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    agent: object
    expected_output: str
    topic: str
    context: Optional[List[CrewAITask]] = None

    def create_task(self):
        return CrewAITask(
            description=self.get_description(),
            expected_output=self.expected_output,
            agent=self.agent,
            context=self.context 
        )

    def get_description(self):
        raise NotImplementedError("Subclasses must implement get_description()")

class PlanningTask(BaseTask):
    def __init__(self, **data):
        super().__init__(
            expected_output="A structured content plan including outline, main sections, SEO keywords and target audience summary.",
            **data
        )

    def get_description(self):
        return (
            f"Create a clear content plan for a blog post about {self.topic}:\n"
            "1. Define target audience and their main interests\n"
            "2. Suggest good structure: introduction, main sections, conclusion\n"
            "3. List 5–8 important SEO keywords (primary + secondary)\n"
            "4. Keep it realistic and well organized"
        )

class WritingTask(BaseTask):
    def __init__(self, **data):
        super().__init__(
            expected_output="A complete blog post draft in markdown format, following the plan.",
            **data
        )

    def get_description(self):
        return (
            f"Write a full, engaging blog post about {self.topic} based on the plan in context.\n"
            "Follow the outline structure.\n"
            "Use natural language, include the suggested keywords naturally.\n"
            "Write clear section headings.\n"
            "Include 3-5 relevant reference links to credible sources (industry reports, academic papers, reputable websites).\n"
            "Add these references at the end of the article in a 'References' section with proper formatting.\n"
            "End with a short conclusion.\n"
            "Output the article in clean markdown format."
        )

class EditingTask(BaseTask):
    def __init__(self, **data):
        super().__init__(
            expected_output=(
                "The final polished blog post in markdown format. "
                "Output MUST contain ONLY the article — no extra text, no comments, no questions."
            ),
            **data
        )

    def get_description(self):     
        return (
            f"Polish and finalize the blog post draft about {self.topic} provided in context.\n"
            "Your tasks:\n"
            "1. Fix grammar, spelling and punctuation\n"
            "2. Improve sentence flow and readability\n"
            "3. Make tone consistent, professional and engaging\n"
            "4. Check structure: good intro → clear sections → strong conclusion\n"
            "5. Ensure reference links are properly formatted and relevant\n"
            "6. Add a 'References' section at the end if not already present\n"
            "7. Return ONLY the final cleaned article in markdown format.\n"
            "Do NOT add explanations, questions, notes or any text outside the article itself."
        )
