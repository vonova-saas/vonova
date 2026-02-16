from pydantic import BaseModel, Field, conint, constr

class QuizRequest(BaseModel):
    topic: constr(min_length=1, strip_whitespace=True) = Field(..., description="Quiz topic in any language")
    total_questions: conint(ge=1, le=50) = Field(..., description="Total number of questions")
    mc_questions: conint(ge=0, le=50) = Field(..., description="Number of multiple-choice questions")
    tf_questions: conint(ge=0, le=50) = Field(..., description="Number of true/false questions")
    level: constr(min_length=1) = Field(..., description="Difficulty level in any language")

class QuizResponse(BaseModel):
    topic: str
    level: str
    total_questions: int
    questions: list
