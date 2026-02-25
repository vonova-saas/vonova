from pydantic import BaseModel
from typing import List

class RoadmapRequest(BaseModel):
    topic: str
    skill_level: str
    duration_weeks: int

class Week(BaseModel):
    week: int
    title: str
    objectives: List[str]
    topics: List[str]
    resources: List[str]
    projects: List[str]
    estimated_hours: int

class Milestone(BaseModel):
    week: int
    milestone: str
    deliverable: str

class RoadmapData(BaseModel):
    title: str
    overview: str
    prerequisites: List[str]
    weeks: List[Week]
    milestones: List[Milestone]
    final_project: str
    next_steps: List[str]
