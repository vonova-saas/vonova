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
            expected_output="A structured content plan with outline, SEO keywords, audience analysis, and sources.",
            **data
        )

    def get_description(self):
        return (
            f"Research {self.topic} and create a comprehensive content plan:\n"
            "1. Identify latest trends, key players, and credible sources\n"
            "2. Analyze target audience interests and challenges\n"
            "3. Create structured outline with introduction, main points, and conclusion\n"
            "4. Suggest relevant SEO keywords and trusted references"
        )

class WritingTask(BaseTask):
    def __init__(self, **data):
        super().__init__(
            expected_output="A detailed blog post in markdown format (2-3 paragraphs per section), based on the provided plan.",
            **data
        )

    def get_description(self):
        return (
            f"Write a comprehensive blog post about {self.topic} based on the plan provided in the context:\n"
            "1. Expand the plan into detailed, engaging content\n"
            "2. Naturally integrate all suggested SEO keywords\n"
            "3. Use engaging section headings and follow the structured outline\n"
            "4. Structure the output clearly with intro, body, and conclusion\n"
            "5. Ensure factual accuracy and cite external sources/references where needed\n"
            "6. Proofread for grammar and clarity before submitting the draft"
        )

class EditingTask(BaseTask):
    def __init__(self, **data):
        super().__init__(
            expected_output=(
                "The final, polished blog post in markdown format. "
                "The output should ONLY contain the article content. "
                "All sources in the 'References' section must be formatted as clickable Markdown links "
                "(e.g., `[Title](https://example.com)`)."
            ),
            **data
        )

    def get_description(self):     
        return (
            f"Review and finalize the draft blog post about {self.topic} provided in the context:\n"
            "1. **Fact-check** all claims and data points, using search tools if necessary.\n"
            "2. Improve grammar, punctuation, and writing style.\n"
            "3. Ensure the tone is consistent, balanced, and professional.\n"
            "4. Verify the document's structure and flow (intro, body, conclusion, references section).\n"
            "5. Check for overall clarity and readability for the target audience.\n"
            "6. **Crucial:** Use the search tool to find the URLs for all sources listed in the 'References' section. "
            "Format these sources as clickable Markdown links (`[Title](URL)`)."
        )
