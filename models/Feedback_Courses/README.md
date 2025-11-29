# Feedback Sentiment Analysis API

A FastAPI-based web service for analyzing sentiment in course feedback text. The API supports both English and Arabic languages, automatically detecting and translating Arabic text to English for accurate sentiment prediction.

## Features

- **Sentiment Analysis**: Predicts positive, negative, or neutral sentiment from feedback text
- **Multilingual Support**: Automatically detects Arabic text and translates it to English
- **RESTful API**: Clean, documented endpoints using FastAPI
- **Machine Learning**: Uses pre-trained Random Forest model with TF-IDF vectorization
- **Text Preprocessing**: Includes cleaning, stemming, and stopword removal
- **Logging**: Comprehensive logging for monitoring and debugging
- **CORS Support**: Configurable CORS for web applications
- **Docker Ready**: Containerized deployment support

## Installation

### Prerequisites

- Python 3.8+
- pip
- Cohere API key (for translation)

### Local Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd feedback-sentiment-api
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
Create a `.env` file in the root directory:
```env
CO_API_KEY=your-cohere-api-key-here
LOG_LEVEL=INFO
AI_SERVICE_HOST=127.0.0.1
AI_SERVICE_PORT=5020
LOG_FILE=feedback.log
CORS_ORIGINS=*
CORS_ALLOW_CREDENTIALS=true
CORS_ALLOW_METHODS=GET,POST
CORS_ALLOW_HEADERS=*
```

5. Ensure model files are in place:
- `models/vectorizer.pkl`
- `models/rf_model.pkl`
- `models/label_encoder.pkl`

### Docker Setup

Build and run with Docker:
```bash
docker build -t feedback-api .
docker run -p 5020:5020 --env-file .env feedback-api
```

## Usage

### Starting the Server

Run the application:
```bash
python app.py
```
**Using uvicorn directly (recommended for development)**:
```bash
uvicorn app:app --reload --port 5020
```
The API will be available at `http://127.0.0.1:5020`

### API Documentation

Visit `http://127.0.0.1:5020/docs` for interactive Swagger UI documentation.

### Endpoints

#### Health Check
- **GET** `/health`
- Returns service health status

**Response:**
```json
{
  "status": "healthy",
  "service": "feedback_api"
}
```

#### Sentiment Prediction
- **POST** `/predict_feedback`
- Analyzes sentiment of input text

**English Request :**
```json
{
  "text": "I love this course!"
}
```

**Response :**
```json
{
  "sentiment": "positive"
}
```

**Arabic Request :**
```json
{
  "text": "المحاضر يشرح المواد بشكل ممتاز"
}
```

**Response :**
```json
{
  "sentiment": "positive"
}
```

### Example Usage

#### English Text
```bash
curl -X POST "http://127.0.0.1:5020/predict_feedback" \
     -H "Content-Type: application/json" \
     -d '{"text": "This course is amazing!"}'
```

#### Arabic Text
```bash
curl -X POST "http://127.0.0.1:5020/predict_feedback" \
     -H "Content-Type: application/json" \
     -d '{"text": "أحب هذا الدورة!"}'
```





## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CO_API_KEY` | - | Cohere API key for translation |
| `LOG_LEVEL` | INFO | Logging level (DEBUG, INFO, WARNING, ERROR) |
| `AI_SERVICE_HOST` | 127.0.0.1 | Server host |
| `AI_SERVICE_PORT` | 5020 | Server port |
| `LOG_FILE` | feedback.log | Log file path |
| `CORS_ORIGINS` | * | Allowed CORS origins |
| `CORS_ALLOW_CREDENTIALS` | true | Allow credentials in CORS |
| `CORS_ALLOW_METHODS` | GET,POST | Allowed HTTP methods |
| `CORS_ALLOW_HEADERS` | * | Allowed headers |

## Project Structure

```
├── app.py                      # Main FastAPI application
├── requirements.txt            # Python dependencies
├── Dockerfile                  # Docker configuration
├── README.md                   # This file
├── data/
│   └── Feedback_Training.csv   # Training data
├── models/
│   ├── vectorizer.pkl          # TF-IDF vectorizer
│   ├── rf_model.pkl            # Random Forest model
│   └── label_encoder.pkl       # Label encoder
├── utils/
│   ├── __init__.py
│   ├── logging_utils.py        # Logging configuration
│   ├── processing_utils.py     # Text preprocessing
│   └── translation_utils.py    # Language detection and translation
└── schemas/
    ├── __init__.py
    └── feedback_schema.py      # Pydantic models
```

## Model Training

The sentiment analysis model was trained on course feedback data using:
- TF-IDF vectorization
- Random Forest classifier
- NLTK for text preprocessing

## Dependencies

- **fastapi**: Web framework
- **uvicorn**: ASGI server
- **scikit-learn**: Machine learning
- **joblib**: Model serialization
- **cohere**: AI translation service
- **nltk**: Natural language processing
- **python-dotenv**: Environment management
# Feedback_Courses
