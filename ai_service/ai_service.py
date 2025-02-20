from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import openai
import base64
from pydantic import BaseModel
from fastapi.responses import JSONResponse
import os

api_url = os.getenv("OPENAI_API_KEY", "error")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = openai.OpenAI(api_key=api_url)

class ConversationRequest(BaseModel):
    prompt: str  

class TTSPayload(BaseModel):
    text: str  

@app.post("/generate-response")
async def generate_response(request: ConversationRequest):
    try:
        response = client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {"role": "system", "content": "Sen günlük konuşma yapan, kısa ve öz yanıtlar veren bir İngilizce öğretmenisin. Karmaşık cümlelerden kaçın, kısa ve samimi cevaplar ver. Kullanıcıdan gelen mesajda herhangi bir gramer hatası varsa, onu düzelt."},
                {"role": "user", "content": request.prompt}
            ],
            max_tokens=50,
            stream=True
        )

        full_response = ""
        for chunk in response:
            if chunk.choices and chunk.choices[0].delta.content:
                full_response += chunk.choices[0].delta.content

        return {"aiText": full_response.strip()}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": str(e)}
        )


@app.post("/text-to-speech")
async def text_to_speech(payload: TTSPayload):
    try:
        response = client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=payload.text
        )

        return {"audio": base64.b64encode(response.content).decode()}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": f"TTS Error: {str(e)}"}
        )