from pydantic import BaseModel

class ArticleRequest(BaseModel):
    topic: str
