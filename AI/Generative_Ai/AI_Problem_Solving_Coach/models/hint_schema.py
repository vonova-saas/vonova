from pydantic import BaseModel
from typing import Optional

class ErrorHintRequest(BaseModel):
    problem: str
    submit_code: str
    testCases: Optional[str] = None
    testcase_fail: str
    language_hint: str = "english"

class SolutionRequest(BaseModel):
    problem: str
    testCases: Optional[str] = None
    language: str
    language_explanation: str = "english"


class SolutionResponse(BaseModel):
    solution: str
    explanation: str

class HintResponse(BaseModel):
    hint: str
