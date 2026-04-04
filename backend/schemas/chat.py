from pydantic import BaseModel
from typing import List, Dict


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    patient_id: int
    messages: List[ChatMessage]
