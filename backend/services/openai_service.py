from openai import AsyncOpenAI
from decouple import config
from fastapi import HTTPException

OPENAI_API_KEY = config('OPENAI_API_KEY', default='')

client = AsyncOpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

async def generate_response(prompt: str) -> str:
    if not client:
        raise HTTPException(status_code=500, detail="OpenAI API Key not configured in .env file")
    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
