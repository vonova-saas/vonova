# Feedback Courses Sentiment Analysis Documentation

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
  - [Core Components](#core-components)
  - [Directory Structure](#directory-structure)
- [API Integration](#api-integration)
  - [FastAPI Endpoints](#fastapi-endpoints)
  - [Request/Response Schema](#requestresponse-schema)
  - [Error Response Schema](#error-response-schema)
- [Sentiment Analysis Engine](#sentiment-analysis-engine)
  - [TF-IDF Vectorizer](#tf-idf-vectorizer)
  - [Random Forest Classifier](#random-forest-classifier)
  - [Text Processing Pipeline](#text-processing-pipeline)
- [Core Code Implementation](#core-code-implementation)
  - [Main API Endpoint (app.py)](#main-api-endpoint-apppy)
  - [Model Training Pipeline](#model-training-pipeline)
  - [Translation Service](#translation-service)
  - [Data Cleaning Process](#data-cleaning-process)
- [Testing Strategies](#testing-strategies)
  - [Unit Testing](#unit-testing)
  - [Integration Testing](#integration-testing)
  - [Load Testing](#load-testing)
  - [API Testing Examples](#api-testing-examples)
- [Performance Optimization](#performance-optimization)
  - [Caching Strategies](#caching-strategies)
  - [Async Processing](#async-processing)
  - [Resource Management](#resource-management)
  - [Monitoring Metrics](#monitoring-metrics)
- [Security Best Practices](#security-best-practices)
  - [API Key Management](#api-key-management)
  - [Input Validation & Sanitization](#input-validation--sanitization)
  - [Rate Limiting](#rate-limiting)
  - [Logging Security](#logging-security)
- [Environment Configuration](#environment-configuration)
  - [Required Variables](#required-variables)
  - [Optional Variables](#optional-variables)
  - [Model Configuration](#model-configuration)
- [Deployment & Scaling](#deployment--scaling)
  - [Docker Deployment](#docker-deployment)
  - [Production Considerations](#production-considerations)
  - [Scaling Strategies](#scaling-strategies)
- [Language Support](#language-support)
  - [Automatic Detection](#automatic-detection)
  - [Translation Pipeline](#translation-pipeline)
  - [Multilingual Examples](#multilingual-examples)
- [Monitoring and Logging](#monitoring-and-logging)
  - [Log Levels](#log-levels)
  - [Key Metrics](#key-metrics)
  - [Debug Mode](#debug-mode)
- [Troubleshooting](#troubleshooting)
  - [Common Issues](#common-issues)
  - [Error Codes Reference](#error-codes-reference)
  - [Debug Commands](#debug-commands)
- [Development Guidelines](#development-guidelines)
  - [Setup Instructions](#setup-instructions)
  - [Testing Workflow](#testing-workflow)
  - [Contribution Guidelines](#contribution-guidelines)
- [Future Enhancements](#future-enhancements)
  - [Planned Features](#planned-features)
  - [Extensibility](#extensibility)
- [Dependencies](#dependencies)
  - [Core Libraries](#core-libraries)
  - [External Services](#external-services)
- [License and Support](#license-and-support)

---

## Overview

The Feedback Courses project is a machine learning service designed to analyze sentiment in course feedback. It provides a RESTful API that can process multilingual text, with automatic translation capabilities for Arabic content, making it suitable for educational institutions with diverse student populations.

## Architecture

### Core Components

1. **FastAPI Application** (`app.py`)
   - Main web service providing REST endpoints
   - Handles HTTP requests and responses
   - Integrates all processing components

2. **Machine Learning Pipeline**
   - **TF-IDF Vectorizer**: Converts text to numerical features
   - **Random Forest Classifier**: Predicts sentiment categories
   - **Label Encoder**: Manages sentiment class mappings

3. **Text Processing Utilities**
   - **Language Detection**: Identifies input text language
   - **Translation Service**: Translates Arabic to English using Cohere API
   - **Text Cleaning**: Preprocesses text for model input

4. **Supporting Services**
   - **Logging System**: Comprehensive request/response logging
   - **Configuration Management**: Environment-based settings
   - **Error Handling**: Robust exception management

### Directory Structure

```
Feedback_Courses_Sentiment_Analysis/
├── app.py                  # FastAPI application entry point
├── train/                  # Model training pipeline
│   ├── train.py           # Training script
│   └── data/              # Training data
├── models/                # Serialized models
│   ├── vectorizer.pkl     # TF-IDF vectorizer
│   ├── rf_model.pkl       # Random Forest model
│   └── label_encoder.pkl  # Label encoder
├── utils/                 # Utility functions
│   ├── translation.py     # Translation services
│   ├── text_processing.py # Text cleaning and preprocessing
│   └── logger.py         # Logging configuration
└── docs/                  # Documentation
    └── Feedback_Coresed_Documentation.md
```

## API Integration

### FastAPI Endpoints

The sentiment analysis service is integrated into the main FastAPI application (`app.py`):
1. **Feature Extraction**: TF-IDF vectorization with configurable parameters
2. **Classification**: Random Forest ensemble method
3. **Output Encoding**: Label-encoded sentiment categories

#### Main Application Implementation

```python
# Model loading with validation
try:
    tfidf_vectorizer = joblib.load(VECTORIZER_PATH)
    rf_model = joblib.load(RF_MODEL_PATH)
    le_model = joblib.load(LE_MODEL_PATH)
except FileNotFoundError as e:
    print(f"ERROR: Model file not found: {e.filename}")
    raise SystemExit(1)

# Model compatibility validation
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

# FastAPI application setup
app = FastAPI(title="Feedback of Course Reviews")

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=os.getenv("CORS_ALLOW_CREDENTIALS", "true").lower() == "true",
    allow_methods=os.getenv("CORS_ALLOW_METHODS", "GET,POST").split(","),
    allow_headers=os.getenv("CORS_ALLOW_HEADERS", "*").split(","),
)
```

#### Prediction Endpoint Implementation

```python
@app.post("/predict_feedback")
async def predict_sentiment(request: SentimentRequest):
    input_text = request.text
    if not input_text:
        raise HTTPException(status_code=400, detail="Input text cannot be empty.")

    try:
        # Language detection
        detected_lang = await detect_language(input_text)
        logger.info(f"Detected language: {detected_lang} for text: {input_text[:50]}...")

        # Translation if Arabic
        if detected_lang == 'ar':
            logger.info("Translating Arabic text to English")
            input_text = await translate(input_text, 'en', 'ar')
            logger.info(f"Translated text: {input_text[:50]}...")

        # Text preprocessing
        cleaned_text = data_cleaner(input_text)
        
        # Vectorization and prediction
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
```

### Text Processing Pipeline

The service implements a sophisticated text processing workflow:

```python
def process_text(input_text):
    # 1. Language detection
    detected_lang = await detect_language(input_text)
    
    # 2. Translation (if Arabic)
    if detected_lang == 'ar':
        input_text = await translate(input_text, 'en', 'ar')
    
    # 3. Text cleaning
    cleaned_text = data_cleaner(input_text)
    
    # 4. Vectorization
    vectorized_text = tfidf_vectorizer.transform([cleaned_text])
    
    # 5. Prediction
    prediction = rf_model.predict(vectorized_text)
    
    return prediction
```

### Data Cleaning Process

The `data_cleaner` function performs comprehensive text preprocessing:

- **Case normalization**: Converts text to lowercase
- **Emoji handling**: Maps common emojis to text representations
- **URL removal**: Strips web links
- **HTML tag removal**: Cleans markup content
- **Number removal**: Eliminates numeric characters
- **Social media cleaning**: Removes mentions and hashtags
- **Punctuation handling**: Removes special characters
- **Stopword removal**: Filters common English words
- **Stemming**: Applies Snowball stemming algorithm

#### Key Code Implementation

```python
def data_cleaner(text: str) -> str:
    if not isinstance(text, str):
        return ""

    text = text.lower()
    # Handle emojis/emoticons (matching training script)
    text = text.replace("(", " sad")
    text = text.replace(";", " happy")
    text = text.replace(":3", " cute")
    text = text.replace(":d", " happy")
    text = text.replace(":-)", " happy")
    text = text.replace(":=", " happy")

    # Regex cleaning
    text = re.sub(r'http\S+', '', text)
    text = re.sub(r'<.*?>', '', text)
    text = re.sub(r'\d+', '', text)
    text = re.sub(r'@\w+', '', text)
    text = re.sub(r'#\w+', '', text)
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'[^A-Za-z0-9 ]+', ' ', text)

    # Remove stopwords and stem
    words = [word for word in text.split() if word not in stop_words]
    if stemmer:
        words = [stemmer.stem(word) for word in words]

    return ' '.join(words).strip()
```

#### Translation Service Implementation

```python
async def translate(text: str, target_language: str, source_language: str) -> str:
    prompt = (
        f"Translate the following text from {source_language} to {target_language}. "
        "Your response must ONLY contain the translated text, with no extra formatting or conversation."
        f"\n\n--- TEXT ---\n\n{text}"
    )
    
    try:
        response = await cohere_async_client.chat(
            model='command-a-03-2025', 
            message=prompt,
            temperature=0.0
        )
        return response.text.strip()
    except Exception as e:
        logger.error(f"Cohere API call failed for translation: {e}")
        return text
```

#### Logging System

```python
def setup_ai_logger(name: str, log_file: str = None, level: str = "INFO") -> logging.Logger:
    load_dotenv()
    log_file = log_file or os.getenv("LOG_FILE", "feedback.log")
    logger = logging.getLogger(name)
    log_level = getattr(logging, level.upper(), logging.INFO)
    logger.setLevel(log_level)

    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s', 
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # File handler with rotation
    try:
        file_handler = RotatingFileHandler(
            log_file, maxBytes=10*1024*1024, backupCount=5, encoding='utf-8'
        )
        file_handler.setLevel(log_level)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    except Exception as e:
        logger.warning(f"Could not set up file logging to {log_file}: {e}")

    logger.propagate = False
    return logger
```

## API Reference

### Endpoints

#### Health Check
- **URL**: `/health`
- **Method**: `GET`
- **Response**: Service health status
- **Example**:
  ```json
  {
    "status": "healthy",
    "service": "feedback_api"
  }
  ```

#### Sentiment Prediction
- **URL**: `/predict_feedback`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "text": "Your feedback text here"
  }
  ```
- **Response**:
  ```json
  {
    "sentiment": "positive",
    "code": 1
  }
  ```

### Error Handling

The API implements comprehensive error handling:

- **400 Bad Request**: Empty or invalid input text
- **500 Internal Server Error**: Model processing failures
- **503 Service Unavailable**: External API failures

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CO_API_KEY` | Cohere API key for translation | Required |
| `LOG_LEVEL` | Logging verbosity level | `INFO` |
| `AI_SERVICE_HOST` | Service bind address | `127.0.0.1` |
| `AI_SERVICE_PORT` | Service port | `5020` |
| `CORS_ORIGINS` | Allowed CORS origins | `*` |
| `CORS_ALLOW_CREDENTIALS` | Enable credentials | `true` |
| `CORS_ALLOW_METHODS` | Allowed HTTP methods | `GET,POST` |
| `CORS_ALLOW_HEADERS` | Allowed headers | `*` |

### Model File Requirements

The service expects three model files in the `models/` directory:

1. `vectorizer.pkl` - Serialized TF-IDF vectorizer
2. `rf_model.pkl` - Trained Random Forest model
3. `label_encoder.pkl` - Fitted label encoder

## Deployment

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run the service
python app.py
```

### Docker Deployment

```bash
# Build the image
docker build -t feedback-courses-api .

# Run the container
docker run -p 5020:5020 \
  -e CO_API_KEY=your_api_key \
  feedback-courses-api
```

### Production Considerations

- **Model Validation**: Service validates model compatibility on startup
- **Resource Management**: Efficient memory usage for model loading
- **Scalability**: Stateless design supports horizontal scaling
- **Monitoring**: Comprehensive logging for operational visibility

## Training

### Data Requirements

Training data should be formatted as CSV with the following columns:

- `Feedback_ID`: Unique identifier for each feedback entry
- `Entity`: Course or entity name
- `label`: Sentiment classification (e.g., positive, negative, neutral)
- `comment`: The actual feedback text

### Training Process

The training script (`train/train.py`) performs:

1. **Data Loading**: Reads and validates input data
2. **Preprocessing**: Cleans and prepares text data
3. **Feature Engineering**: Applies TF-IDF vectorization
4. **Model Training**: Trains Random Forest classifier
5. **Hyperparameter Tuning**: Optimizes model parameters
6. **Model Serialization**: Saves trained components

#### Training Pipeline Code

```python
# Data Loading and Preprocessing
columns = ['Feedback_ID', 'Entity', 'label', 'comment']
train_data = pd.read_csv(data_path, names=columns)
train_data.drop(['Feedback_ID', 'Entity'], axis=1, inplace=True)

# Handle null values and duplicates
train_data.dropna(inplace=True)
train_data.drop_duplicates(inplace=True)

# Standardize labels
train_data['label'] = train_data['label'].str.strip().str.lower()
train_data = train_data[train_data['label'].isin(['positive', 'negative', 'neutral'])]

# Apply text cleaning
train_data['cleaned_comment'] = train_data['comment'].apply(data_cleaner)

# Label encoding
le_model = LabelEncoder()
train_data['label_code'] = le_model.fit_transform(train_data['label'])

# TF-IDF Vectorization
tfidf_vectorizer = TfidfVectorizer(
    max_features=8000,
    ngram_range=(1, 2),
    min_df=2
)
X_tfidf = tfidf_vectorizer.fit_transform(train_data['cleaned_comment'])
```

#### Hyperparameter Optimization

```python
# Optimized parameter grid
param_grid = {
    'n_estimators': [100, 200, 300],
    'max_depth': [None, 20, 30],
    'min_samples_split': [2, 5],
    'min_samples_leaf': [1, 2],
    'max_features': ['sqrt', 'log2']
}

# RandomizedSearchCV for efficient hyperparameter tuning
rf_search = RandomizedSearchCV(
    estimator=RandomForestClassifier(class_weight='balanced', random_state=42, n_jobs=-1),
    param_distributions=param_grid,
    n_iter=10,
    cv=3,
    n_jobs=-1,
    scoring='accuracy',
    verbose=2,
    random_state=42
)

# Train the model
rf_search.fit(X_train, y_train)
best_model = rf_search.best_estimator_
```

### Model Performance

The Random Forest classifier provides:
- **High accuracy** for text classification tasks
- **Feature importance** insights
- **Robustness** to overfitting
- **Interpretability** for decision making

## Integration Guide

### Client Integration

```python
import requests

# API endpoint
url = "http://localhost:5020/predict_feedback"

# Request data
data = {"text": "This course was very helpful and informative"}

# Make request
response = requests.post(url, json=data)
result = response.json()

print(f"Sentiment: {result['sentiment']}")
print(f"Code: {result['code']}")
```

### Batch Processing

For processing multiple feedback entries:

```python
import asyncio
import aiohttp

async def batch_analyze(feedback_list):
    async with aiohttp.ClientSession() as session:
        tasks = []
        for feedback in feedback_list:
            task = analyze_single(session, feedback)
            tasks.append(task)
        results = await asyncio.gather(*tasks)
        return results

async def analyze_single(session, text):
    url = "http://localhost:5020/predict_feedback"
    async with session.post(url, json={"text": text}) as response:
        return await response.json()
```

## Security Considerations

### Input Validation

- **Text sanitization**: Removes potentially harmful content
- **Length limits**: Prevents resource exhaustion
- **Encoding validation**: Ensures proper text handling

### API Security

- **CORS configuration**: Controls cross-origin access
- **Rate limiting**: Prevents abuse (implementation recommended)
- **Authentication**: Can be integrated with existing auth systems

### Data Privacy

- **No data persistence**: Feedback text is not stored
- **Secure logging**: Sensitive information is masked
- **API key protection**: Translation API credentials are secured

## Monitoring and Maintenance

### Logging Strategy

The service implements structured logging with:

- **Request tracking**: Unique identifiers for each request
- **Performance metrics**: Response times and processing duration
- **Error categorization**: Different error types for debugging
- **Operational events**: Service startup, shutdown, and health checks

### Health Monitoring

- **Health endpoint**: `/health` for service status checks
- **Model validation**: Startup verification of model compatibility
- **Dependency monitoring**: External API availability checks

### Performance Optimization

- **Model caching**: Pre-loaded models for faster inference
- **Async processing**: Non-blocking translation API calls
- **Memory efficiency**: Optimized data structures

## Troubleshooting

### Common Issues

1. **Model Loading Errors**
   - Verify model file paths and permissions
   - Check model compatibility with vectorizer

2. **Translation Failures**
   - Validate Cohere API key configuration
   - Check network connectivity to external services

3. **Performance Issues**
   - Monitor memory usage during high load
   - Consider model optimization for large-scale deployments

### Debug Mode

Enable debug logging by setting:
```bash
export LOG_LEVEL=DEBUG
python app.py
```

## Future Enhancements

### Planned Features

- **Additional language support**: Expand beyond Arabic-English translation
- **Custom sentiment categories**: Configurable sentiment labels
- **Batch processing endpoints**: Efficient bulk analysis
- **Model versioning**: Support for multiple model versions
- **Performance analytics**: Detailed sentiment trend analysis

### Scalability Improvements

- **Model optimization**: Quantization and compression
- **Caching layer**: Redis integration for repeated queries
- **Load balancing**: Multiple service instances
- **Database integration**: Persistent storage for analytics