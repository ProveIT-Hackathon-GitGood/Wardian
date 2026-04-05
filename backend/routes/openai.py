import base64

from fastapi import APIRouter, UploadFile, File

from schemas.openai import PromptRequest, PromptResponse
from services.chat import ChatService
from services.ocr import OcrService

router = APIRouter(prefix="/ai", tags=["OpenAI"])

chat_service = ChatService()
ocr_service = OcrService()


@router.post("/prompt", response_model=PromptResponse)
async def ask_openai(request: PromptRequest):
    response_text = await chat_service.generate_response(request.prompt)
    return PromptResponse(response=response_text)


@router.post("/ocr-vitals")
async def extract_vitals_from_image(file: UploadFile = File(...)):
    image_data = await file.read()
    base64_image = base64.b64encode(image_data).decode('utf-8')

    return await ocr_service.extract_vitals_from_image(base64_image)
