from fastapi import APIRouter
from schemas.openai import PromptRequest, PromptResponse
from services.openai_service import generate_response

router = APIRouter(
    prefix="/ai",
    tags=["OpenAI"]
)

@router.post("/prompt", response_model=PromptResponse)
async def ask_openai(request: PromptRequest):
    response_text = await generate_response(request.prompt)
    return PromptResponse(response=response_text)
