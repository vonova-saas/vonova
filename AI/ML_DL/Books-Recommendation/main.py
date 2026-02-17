from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import pickle
import joblib
from dotenv import load_dotenv
import os
import warnings
from Utils.logging import setup_ai_logger
from Utils.translation import translate_to_english
from Schemas.recommend_schema import RecommendRequest
from sklearn.exceptions import InconsistentVersionWarning
warnings.filterwarnings("ignore", category=InconsistentVersionWarning)
import uvicorn

load_dotenv()

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
AI_SERVICE_HOST = os.getenv("AI_SERVICE_HOST", "127.0.0.1")
AI_SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT", "5030"))

logger = setup_ai_logger("recommendation.log")
logger.info("Loading environment variables...")
logger.info(f"Log level: {LOG_LEVEL}")
logger.info(f"AI Service Host: {AI_SERVICE_HOST}")
logger.info(f"AI Service Port: {AI_SERVICE_PORT}")

app = FastAPI(title="Books Recommendation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load data and models with error handling
try:
    logger.info("Loading books data...")
    books_df = pd.read_csv("model_files/FINAL_BOOKS_CLEAN.csv")
    logger.info(f"Loaded {len(books_df)} books")
except FileNotFoundError as e:
    logger.error(f"Books data file not found: {e}")
    raise
except Exception as e:
    logger.error(f"Error loading books data: {e}")
    raise

# Load vectorizer with multiple fallback methods for compatibility
try:
    logger.info("Loading vectorizer model...")
    vectorizer_path = "model_files/vectorizer.pkl"
    if not os.path.exists(vectorizer_path):
        raise FileNotFoundError(f"Vectorizer file not found: {vectorizer_path}")
    
    # Try joblib first (better compatibility), then pickle
    try:
        tfidf = joblib.load(vectorizer_path)
        logger.info("Vectorizer loaded using joblib")
    except Exception as joblib_error:
        logger.warning(f"Joblib load failed, trying pickle: {joblib_error}")
        with open(vectorizer_path, "rb") as f:
            tfidf = pickle.load(f)
        logger.info("Vectorizer loaded using pickle")
except Exception as e:
    logger.error(f"Error loading vectorizer: {e}")
    raise

# Load similarity matrix with multiple fallback methods
try:
    logger.info("Loading similarity matrix...")
    similarity_path = "model_files/similarity_sparse.pkl"
    if not os.path.exists(similarity_path):
        raise FileNotFoundError(f"Similarity matrix file not found: {similarity_path}")
    
    # Try joblib first (better compatibility), then pickle
    try:
        cosine_sim = joblib.load(similarity_path)
        logger.info("Similarity matrix loaded using joblib")
    except Exception as joblib_error:
        logger.warning(f"Joblib load failed, trying pickle: {joblib_error}")
        with open(similarity_path, "rb") as f:
            cosine_sim = pickle.load(f)
        logger.info("Similarity matrix loaded using pickle")
except Exception as e:
    logger.error(f"Error loading similarity matrix: {e}")
    raise

logger.info("All models loaded successfully!")
books_df = pd.read_csv("model_files/FINAL_BOOKS_CLEAN.csv")
with open("model_files/vectorizer.pkl", "rb") as f:
    tfidf = pickle.load(f)
with open("model_files/similarity_sparse.pkl", "rb") as f:
    cosine_sim = pickle.load(f)

@app.get("/health")
async def health_check():
    logger.info("Health check requested")
    return {"status": "healthy", "service": "recommendation_api"}

@app.post("/recommend")
async def recommend(request: RecommendRequest):
    query_en = await translate_to_english(request.text)
    # Perform search
    mask = (
        books_df["title"].str.contains(query_en, case=False, na=False) |
        books_df["author"].str.contains(query_en, case=False, na=False)
    )
    search_results = books_df[mask].nlargest(20, "rating")[["title", "author", "rating", "image", "link"]].to_dict("records")
    
    # Perform similar recommendations
    match = books_df[books_df["title"].str.contains(query_en, case=False, na=False)]
    recommendations = []
    if not match.empty:
        idx = match.index[0]
        scores = cosine_sim[idx]
        indices = scores.argsort()[-13:-1][::-1]
        for i in indices:
            if scores[i] > 0.1:
                b = books_df.iloc[i]
                recommendations.append({
                    "title": b["title"],
                    "author": b["author"],
                    "rating": float(b["rating"]),
                    "image": b["image"],
                    "link": b["link"]
                })
    
    return {"search_results": search_results, "recommendations": recommendations}

if __name__ == "__main__":
    uvicorn.run(app, host=AI_SERVICE_HOST, port=AI_SERVICE_PORT, reload=False)
