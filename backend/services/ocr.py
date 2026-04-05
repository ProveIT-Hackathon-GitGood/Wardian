import json

from decouple import config
from openai import AsyncOpenAI

OPENAI_API_KEY = config('OPENAI_API_KEY', default='')

client = AsyncOpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None


class OcrService:
    async def extract_vitals_from_image(self, image: str, content_type: str = "image/jpeg"):
        prompt = """
            You are an expert medical data extractor. Look at this patient chart.
            Extract the latest values for: Heart Rate (HR), Mean Arterial Pressure (MAP), and Lactate.
            Return ONLY a valid JSON object. Do not include markdown formatting like ```json.
            Example output format: {"hr": 95, "map": 65, "lactate": 2.1}
            """

        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:{content_type};base64,{image}"}
                        }
                    ]
                }
            ]
        )

        raw_json_string = response.choices[0].message.content.strip()

        try:
            extracted_data = json.loads(raw_json_string)
            return {"status": "success", "data": extracted_data}
        except Exception as e:
            return {"status": "error", "message": "Failed to parse OCR data"}
