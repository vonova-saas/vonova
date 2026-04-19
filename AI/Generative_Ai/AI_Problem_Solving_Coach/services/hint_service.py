import json
from AI_Problem_Solving_Coach.agents.gemini_client import GeminiClient
from AI_Problem_Solving_Coach.agents.Prompts.hint_prompt import HintPrompts

class HintService:
    def __init__(self):
        self.client = GeminiClient(system_instruction=HintPrompts.SYSTEM_PROMPT)

    def get_testcase_hint(self, problem: str, submit_code: str, testcase_fail: str, testCases: str = None, language_hint: str = "english") -> dict:
        prompt = HintPrompts.testcase_hint_prompt(problem, submit_code, testcase_fail, testCases, language_hint)
        raw_json = self.client.generate(prompt)
        try:
            return json.loads(raw_json)
        except json.JSONDecodeError:
            raise ValueError(f"Model returned invalid JSON: {raw_json}")

    def generate_solution(self, problem: str, language: str, testCases: str = None, language_explanation: str = "english") -> dict:
        prompt = HintPrompts.solution_prompt(problem, language, testCases, language_explanation)
        raw_json = self.client.generate(prompt)
        try:
            return json.loads(raw_json)
        except json.JSONDecodeError:
            raise ValueError(f"Model returned invalid JSON: {raw_json}")
