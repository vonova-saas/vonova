from pydantic import BaseModel

class AskResponse(BaseModel):
    answer: str
    session_id: str
    filename: str
    ai_wizard_status: str
    magic_level: str
    message: str

class UploadResponse(BaseModel):
    session_id: str
    brief_summary: str
    magic_level: str
    enchantment_status: str
    message: str

class SummaryResponse(BaseModel):
    summary: str
    summary_type: str
    filename: str
    magic_level: str
    ai_wizard_status: str
