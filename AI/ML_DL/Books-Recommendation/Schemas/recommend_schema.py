from pydantic import BaseModel

class RecommendRequest(BaseModel):
    text: str
