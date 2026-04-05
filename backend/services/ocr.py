import json

from decouple import config
from openai import AsyncOpenAI

OPENAI_API_KEY = config('OPENAI_API_KEY', default='')

client = AsyncOpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None


class OcrService:
    async def extract_vitals_from_image(self, image: str, content_type: str = "image/jpeg"):
        prompt = """
You are an expert medical data extractor. Analyze this patient monitor/chart image carefully.
Extract ALL visible vital signs and lab values. Use EXACTLY these canonical keys when the corresponding measurement is present (do NOT invent values that are not visible):

HR (Heart Rate), O2Sat (SpO2/Oxygen Saturation), Temp (Temperature),
SBP (Systolic Blood Pressure), MAP (Mean Arterial Pressure), DBP (Diastolic Blood Pressure),
Resp (Respiratory Rate), EtCO2, BaseExcess, HCO3, FiO2, pH, PaCO2, SaO2,
AST, BUN, Alkalinephos, Calcium, Chloride, Creatinine, Bilirubin_direct,
Glucose, Lactate, Magnesium, Phosphate, Potassium, Bilirubin_total,
TroponinI, Hct, Hgb, PTT, WBC, Fibrinogen, Platelets

Return ONLY a valid JSON object with the detected keys and their numeric values.
Do NOT include markdown formatting like ```json.
Only include keys for values that are clearly visible in the image.

Example: {"HR": 95, "MAP": 65, "SBP": 120, "DBP": 80, "O2Sat": 98, "Resp": 16}
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
