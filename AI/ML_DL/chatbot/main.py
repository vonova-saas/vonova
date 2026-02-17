import json
import logging
import os
import random
import sys
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import torch

from src.model.model import NeuralNet
from src.utils.nltk_utils import bag_of_words, tokenize


load_dotenv()

logger = logging.getLogger("vonova_chatbot")


def _configure_logging() -> None:
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] [vonova_chatbot] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    handler.setFormatter(formatter)

    logger.setLevel(logging.INFO)
    logger.handlers.clear()
    logger.addHandler(handler)


def _health_payload(service_name: str) -> dict:
    return {
        "service": service_name,
        "message": "healthy",
        "status": "success",
        "version": "1.0.0",
    }


device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

BASE_DIR = Path(__file__).resolve().parent
SRC_DIR = BASE_DIR / "src"
DATA_DIR = SRC_DIR / "data"
INTENTS_PATH = DATA_DIR / "intents.json"
MODEL_PATH = DATA_DIR / "data.pth"

with open(INTENTS_PATH, "r", encoding="utf-8") as json_data:
    intents = json.load(json_data)

if not MODEL_PATH.exists():
    logger.error("Model file not found at %s. Train the model first.", MODEL_PATH)
    raise FileNotFoundError(f"Model file not found at {MODEL_PATH}.")

checkpoint = torch.load(MODEL_PATH, map_location=device)

input_size = checkpoint["input_size"]
hidden_size = checkpoint["hidden_size"]
output_size = checkpoint["output_size"]
all_words = checkpoint["all_words"]
tags = checkpoint["tags"]
model_state = checkpoint["model_state"]

model = NeuralNet(input_size, hidden_size, output_size).to(device)
model.load_state_dict(model_state)
model.eval()

bot_name = "Vonova"

SUPPORTED_LANGS = {"en", "ar"}


def detect_lang_from_text(text: str) -> str:
    """Very simple heuristic: Arabic chars -> 'ar', otherwise 'en'."""
    for ch in text:
        if "\u0600" <= ch <= "\u06FF":
            return "ar"
    return "en"


def normalize_lang(lang: Optional[str], message: str) -> str:
    if lang in SUPPORTED_LANGS:
        return lang
    return detect_lang_from_text(message)


def infer(message: str, lang: Optional[str] = None) -> dict:
    # Normalize/auto-detect language
    lang = normalize_lang(lang, message)

    tokens = tokenize(message)
    X = bag_of_words(tokens, all_words)
    X = X.reshape(1, X.shape[0])
    X = torch.from_numpy(X).to(device)

    with torch.no_grad():
        output = model(X)
        _, predicted = torch.max(output, dim=1)
        probs = torch.softmax(output, dim=1)
        confidence = probs[0][predicted.item()].item()

    tag = tags[predicted.item()]

    response = "I do not understand..."
    images: list[str] = []

    if confidence > 0.75:
        for intent in intents["intents"]:
            if tag == intent["tag"]:
                # responses is now a dict: { "en": [...], "ar": [...] }
                responses_by_lang = intent.get("responses", {})
                # Prefer requested lang, else fall back to English, then any available
                resp_list = responses_by_lang.get(lang) or responses_by_lang.get("en")
                if not resp_list:
                    for _l, lst in responses_by_lang.items():
                        if lst:
                            resp_list = lst
                            break
                if resp_list:
                    response = random.choice(resp_list)
                images = intent.get("images", []) or []
                break

    return {
        "bot": bot_name,
        "intent": tag,
        "confidence": round(confidence, 4),
        "reply": response,
        "images": images,
        "lang": lang,
    }


class ChatRequest(BaseModel):
    message: str
    lang: Optional[str] = None


class ChatResponse(BaseModel):
    bot: str
    intent: str
    confidence: float
    reply: str
    images: list[str]
    lang: str


class HealthResponse(BaseModel):
    service: str
    message: str
    status: str
    version: str


app = FastAPI(title="Vonova Chatbot API")


@app.on_event("startup")
def on_startup() -> None:
    _configure_logging()
    logger.info("Bootstrapping Vonova Chatbot service (FastAPI mode)...")


@app.get("/health", response_model=HealthResponse)
def get_health() -> dict:
    return _health_payload("Vonova Chatbot")


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> dict:
    message = (request.message or "").strip()
    lang = request.lang

    if not message:
        raise HTTPException(status_code=400, detail="Missing 'message' in request body")

    result = infer(message, lang)
    return result


@app.post("/chat/stream", response_model=ChatResponse)
def chat_stream(request: ChatRequest) -> dict:
    message = (request.message or "").strip()
    lang = request.lang

    if not message:
        raise HTTPException(status_code=400, detail="Missing 'message' in request body")

    result = infer(message, lang)
    result["stream"] = True
    result["stream_type"] = "word_by_word"
    return result


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "7860"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
