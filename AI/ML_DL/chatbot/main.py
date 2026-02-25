import json
import pickle
import torch
from pathlib import Path
from sentence_transformers import SentenceTransformer, util
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "src" / "data"

bot_name = "Vonova"


@asynccontextmanager
async def lifespan(app: FastAPI):
  global model_en, model_ar, intents_en, intents_ar, data_en, data_ar
  print("Initializing Vonova AI Engine...")


  model_en = SentenceTransformer('all-MiniLM-L6-v2')
  model_ar = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')


  with open(DATA_DIR / "en_intents.json", "r", encoding="utf-8") as f:
    intents_en = json.load(f)
  with open(DATA_DIR / "ar_intents.json", "r", encoding="utf-8") as f:
    intents_ar = json.load(f)


  def load_pkl(filename):
    with open(DATA_DIR / filename, "rb") as f:
      return pickle.load(f)

  try:
    data_en = load_pkl("en_data.pkl")
    data_ar = load_pkl("ar_data.pkl")
  except FileNotFoundError:
    print("Error: .pkl files not found! Please run src/training/train.py first.")
    exit()

  print("Vonova Chatbot API is Ready!")
  yield
  print("Shutting down Vonova API...")



app = FastAPI(title="Vonova Chatbot API", lifespan=lifespan)



class ChatRequest(BaseModel):
  message: str


def detect_language(text: str) -> str:

  for ch in text:
    if "\u0600" <= ch <= "\u06FF": return "ar"
  return "en"


def get_response(user_input: str) -> dict:
  lang = detect_language(user_input)


  if lang == "ar":
    curr_model, curr_data, curr_intents = model_ar, data_ar, intents_ar
    fallback_msg = "مش قادر أفهمك أوي، ممكن توضح سؤالك؟"
  else:
    curr_model, curr_data, curr_intents = model_en, data_en, intents_en
    fallback_msg = "I'm sorry, I don't quite understand. Could you rephrase?"


  user_embedding = curr_model.encode(user_input, convert_to_tensor=True)
  cos_scores = util.cos_sim(user_embedding, curr_data["embeddings"])[0]

  top_score, top_idx = torch.max(cos_scores, dim=0)
  tag = curr_data["tags"][top_idx.item()]
  confidence = top_score.item()


  print(f"[DEBUG] Input: {user_input} | Tag: {tag} | Score: {confidence:.4f} | Lang: {lang}")

  response_text = fallback_msg
  image_link = None
  predicted_intent = "unknown"


  if confidence > 0.60:
    predicted_intent = tag
    for intent in curr_intents:
      if intent["tag"] == tag:
        res_obj = intent["responses"][0]
        response_text = res_obj["text"]
        image_link = res_obj.get("image")
        break

  return {
    "bot": bot_name,
    "intent": predicted_intent,
    "confidence": round(confidence, 4),
    "reply": response_text,
    "image": image_link,
    "lang": lang
  }



@app.post("/chat")
def chat_endpoint(request: ChatRequest):
  message = request.message.strip()
  if not message:
    raise HTTPException(status_code=400, detail="Empty message")
  return get_response(message)


@app.get("/health")
def health_check():
  return {"status": "success", "service": "Vonova Chatbot"}


if __name__ == "__main__":
  import uvicorn

  uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
