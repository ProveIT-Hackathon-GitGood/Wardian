from fastapi import APIRouter

from schemas.openai import PromptRequest, PromptResponse
from services.chat import ChatService

router = APIRouter(prefix="/ai", tags=["OpenAI"])

chat_service = ChatService()


@router.post("/prompt", response_model=PromptResponse)
async def ask_openai(request: PromptRequest):
    response_text = await chat_service.generate_response(request.prompt)
    return PromptResponse(response=response_text)
