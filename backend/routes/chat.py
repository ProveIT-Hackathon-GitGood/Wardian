from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas.chat import ChatRequest
from services.chat import ChatService

db_dependency = Annotated[Session, Depends(get_db)]

chat_service = ChatService()

chat_router = APIRouter(prefix="/api/v1/chat", tags=["chat"])


@chat_router.post("")
async def chat_with_copilot(request: ChatRequest, db: db_dependency):
    return await chat_service.generate_response(db, request.patient_id, request.messages)

