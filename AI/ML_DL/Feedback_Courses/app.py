import joblib
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import warnings
from sklearn.exceptions import InconsistentVersionWarning
warnings.filterwarnings("ignore", category=InconsistentVersionWarning)

from utils.processing_utils import data_cleaner
from dotenv import load_dotenv
import os
from schemas.feedback_schema import SentimentRequest 
from utils.logging_utils import setup_ai_logger
from utils.translation_utils import translate, detect_language

load_dotenv()

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
AI_SERVICE_HOST = os.getenv("AI_SERVICE_HOST", "127.0.0.1")
AI_SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT", "5020"))

logger = setup_ai_logger("feedback.log")

logger.info("Loading environment variables...")
logger.info(f"Log level: {LOG_LEVEL}")
logger.info(f"AI Service Host: {AI_SERVICE_HOST}")
logger.info(f"AI Service Port: {AI_SERVICE_PORT}")


VECTORIZER_PATH = r'models/vectorizer.pkl'
RF_MODEL_PATH = r'models/rf_model.pkl'
LE_MODEL_PATH = r'models/label_encoder.pkl'

try:
    tfidf_vectorizer = joblib.load(VECTORIZER_PATH)
    rf_model = joblib.load(RF_MODEL_PATH)
    le_model = joblib.load(LE_MODEL_PATH)
except FileNotFoundError as e:
    print(f"ERROR: Model file not found: {e.filename}. Please ensure model files exist at the specified absolute paths.")
    raise SystemExit(1)
except Exception as e:
    print(f"ERROR: Failed to load model components: {e}")
    raise SystemExit(1)

try:
    vec_size = len(getattr(tfidf_vectorizer, 'vocabulary_', []))
    model_expected = getattr(rf_model, 'n_features_in_', None)
    if model_expected is not None and vec_size != model_expected:
        msg = (
            f"Model / Vectorizer mismatch detected:\n"
            f" - vectorizer features: {vec_size}\n"
            f" - model.n_features_in_: {model_expected}\n\n"
            "This indicates the vectorizer used at inference doesn't match the model's training features."
        )
        print(msg)
        raise SystemExit(1)
except Exception as e:
    print(f"ERROR while validating model artifacts: {e}")
    raise SystemExit(1)

app = FastAPI(title="Feedback of Course Reviews")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=os.getenv("CORS_ALLOW_CREDENTIALS", "true").lower() == "true",
    allow_methods=os.getenv("CORS_ALLOW_METHODS", "GET,POST").split(","),
    allow_headers=os.getenv("CORS_ALLOW_HEADERS", "*").split(","),
)

@app.get("/health")
async def health_check():
    logger.info("Health check requested")
    return {"status": "healthy", "service": "feedback_api"}

@app.post("/predict_feedback")
async def predict_sentiment(request: SentimentRequest):
    input_text = request.text
    if not input_text:
        raise HTTPException(status_code=400, detail="Input text cannot be empty.")

    try:
        detected_lang = await detect_language(input_text)
        logger.info(f"Detected language: {detected_lang} for text: {input_text[:50]}...")

        if detected_lang == 'ar':
            logger.info("Translating Arabic text to English")
            input_text = await translate(input_text, 'en', 'ar')
            logger.info(f"Translated text: {input_text[:50]}...")

        cleaned_text = data_cleaner(input_text)
        vectorized_text = tfidf_vectorizer.transform([cleaned_text])
        predicted_index = rf_model.predict(vectorized_text)[0]
        sentiment_label = le_model.inverse_transform([predicted_index])[0]
        return {
            "sentiment": sentiment_label,
            "code": int(predicted_index)
        }

    except Exception as e:
        logger.error(f"Prediction failed for text '{input_text}': {e}")
        raise HTTPException(status_code=500, detail="Internal server error during prediction")

if __name__ == "__main__":
    logger.info(f"Starting Uvicorn server on {AI_SERVICE_HOST}:{AI_SERVICE_PORT}")
    uvicorn.run(app, host=AI_SERVICE_HOST, port=AI_SERVICE_PORT, reload=False)
