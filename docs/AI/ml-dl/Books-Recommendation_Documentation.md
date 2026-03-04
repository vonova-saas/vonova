# Books Recommendation System Documentation

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
  - [Core Components](#core-components)
  - [Directory Structure](#directory-structure)
- [API Integration](#api-integration)
  - [FastAPI Endpoints](#fastapi-endpoints)
  - [Request/Response Schema](#requestresponse-schema)
  - [Error Response Schema](#error-response-schema)
- [Recommendation Engine](#recommendation-engine)
  - [TF-IDF Vectorizer](#tf-idf-vectorizer)
  - [Cosine Similarity](#cosine-similarity)
  - [Search Algorithm](#search-algorithm)
- [Core Code Implementation](#core-code-implementation)
  - [Main API Endpoint (main.py)](#main-api-endpoint-mainpy)
  - [Data Processing Pipeline](#data-processing-pipeline)
  - [Translation Service](#translation-service)
  - [Model Training](#model-training)
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

The Books Recommendation System is a content-based recommendation engine that provides intelligent book suggestions using TF-IDF vectorization and cosine similarity. The system processes a comprehensive dataset of technical books and offers both search functionality and similarity-based recommendations with multilingual support.

## Architecture

### Core Components

1. **FastAPI Application** (`main.py`)
   - RESTful API service with health check and recommendation endpoints
   - CORS-enabled for cross-origin requests
   - Comprehensive error handling and logging

2. **Recommendation Engine**
   - **TF-IDF Vectorizer**: Converts book metadata to feature vectors
   - **Cosine Similarity Matrix**: Pre-computed similarity scores for efficient recommendations
   - **Search Algorithm**: Combined title and author search with rating-based ranking

3. **Data Processing Pipeline**
   - **Kaggle Integration**: Automated dataset download and processing
   - **Quality Filtering**: Books with ≥3⭐ rating and ≥5 reviews
   - **Technical Categorization**: Intelligent classification into technical tracks

4. **Translation Service**
   - **Arabic-to-English Translation**: Automatic translation for multilingual queries
   - **Cohere API Integration**: High-quality translation services
   - **Language Detection**: Automatic detection of Arabic text

### Directory Structure

```
Books_Recommendation_System/
├── main.py                 # FastAPI application entry point
├── training/               # Model training pipeline
│   ├── train.py           # Training script
│   └── data/              # Training data
├── model_files/           # Serialized models
│   ├── tfidf_vectorizer.pkl
│   ├── cosine_similarity_matrix.pkl
│   └── books_data.pkl
├── utils/                 # Utility functions
│   ├── translation.py    # Translation services
│   └── data_processing.py # Data cleaning and preprocessing
└── docs/                  # Documentation
    └── Books-Recommendation_Documentation.md
```

### API Integration

#### FastAPI Endpoints

The recommendation system is integrated into the main FastAPI application (`main.py`):

- **POST /recommend** - Main endpoint for book recommendations
- **GET /health** - Health check endpoint
- **Language Support** - Automatic detection and translation for Arabic/English
- **Error Handling** - Comprehensive error responses with proper HTTP status codes

#### Request/Response Schema

##### RecommendRequest Schema

```python
from pydantic import BaseModel, validator
import re

class RecommendRequest(BaseModel):
    """
    Request model for book recommendations.
    
    Attributes:
        text: Search query or book title (max 500 characters)
    """
    text: str
    
    @validator('text')
    def validate_text(cls, v):
        """Validate and sanitize text input"""
        if not v or len(v.strip()) == 0:
            raise ValueError('Search text cannot be empty')
            
        if len(v) > 500:
            raise ValueError('Search text too long (max 500 characters)')
            
        # Remove potentially harmful characters
        sanitized = re.sub(r'[<>&"\'\']', '', v.strip())
        if not sanitized:
            raise ValueError('Invalid search text format')
            
        return sanitized
```

#### Response Schema

```json
{
    "search_results": [
        {
            "title": "Python Crash Course",
            "author": "Eric Matthes",
            "rating": 4.5,
            "image": "https://...",
            "link": "https://..."
        }
    ],
    "recommendations": [
        {
            "title": "Deep Learning with Python",
            "author": "François Chollet",
            "rating": 4.8,
            "image": "https://...",
            "link": "https://..."
        }
    ],
    "metadata": {
        "query_processed": "python machine learning",
        "language_detected": "en",
        "total_results": 20,
        "recommendations_count": 12,
        "processing_time_ms": 45.2,
        "similarity_threshold": 0.1
    }
}
```

#### Error Response Schema

```json
{
    "status": false,
    "error": {
        "code": "RECOMMENDATION_FAILED",
        "message": "Failed to process recommendation request",
        "details": {
            "stage": "similarity_calculation",
            "query": "python machine learning",
            "original_error": "Cosine similarity matrix not loaded"
        }
    },
    "timestamp": "2024-01-01T12:00:00Z"
}
```

#### API Usage Examples

##### Basic Book Recommendation

```bash
curl -X POST "http://localhost:5030/recommend" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Python machine learning"
  }'
```

##### Arabic Book Recommendation

```bash
curl -X POST "http://localhost:5030/recommend" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "التعلم الآلي بايثون"
  }'
```

##### With Error Handling

```bash
# Test empty search text
curl -X POST "http://localhost:5030/recommend" \
  -H "Content-Type: application/json" \
  -d '{
    "text": ""
  }' | jq

# Test malformed request
curl -X POST "http://localhost:5030/recommend" \
  -H "Content-Type: application/json" \
  -d '{
    "invalid_field": "test"
  }' | jq
```

## Recommendation Engine

### TF-IDF Vectorizer

**Responsibility**: Convert book metadata into numerical feature vectors

**Process**:
1. Combine title, author, and category text
2. Apply TF-IDF transformation with optimized parameters
3. Generate sparse matrix for efficient computation
4. Support for unigrams and bigrams

**Configuration**:
- `max_features`: 8000 top features
- `ngram_range`: (1, 2) for unigrams and bigrams
- `min_df`: 2 minimum document frequency
- `stop_words`: English stopwords removal

### Cosine Similarity

**Responsibility**: Compute similarity scores between books

**Process**:
1. Pre-compute similarity matrix during training
2. Use cosine similarity for normalized distance measurement
3. Apply similarity threshold (0.1) for quality filtering
4. Return top-K most similar books

**Optimization**:
- Pre-computed matrix for real-time performance
- Sparse matrix operations for memory efficiency
- Threshold filtering to reduce noise

### Search Algorithm

**Responsibility**: Direct search functionality with ranking

**Process**:
1. Case-insensitive title and author matching
2. Rating-based sorting for quality results
3. Limit to top 20 search results
4. Fallback to similarity recommendations

**Features**:
- String contains matching
- Rating-weighted ranking
- Combined title/author search
- Efficient pandas operations

## Technical Implementation

### Dependencies

```python
fastapi==0.115.0              # Web framework
uvicorn[standard]==0.32.0    # ASGI server
pandas==2.2.3                 # Data manipulation
scikit-learn==1.5.2           # Machine learning
python-dotenv==1.0.1          # Environment management
cohere==5.11.1               # Translation API
joblib==1.4.2                # Model serialization
kaggle>=1.5.0                # Dataset download
```

### Data Pipeline Architecture

The system follows a comprehensive data processing workflow:

```python
def process_books_pipeline():
    # 1. Dataset Download
    download_dataset()  # Kaggle API integration
    
    # 2. Data Preprocessing
    preprocess_data()    # Clean and categorize
    
    # 3. Feature Engineering
    create_text_features()  # Combine title, author, category
    
    # 4. Vectorization
    train_tfidf_vectorizer()  # TF-IDF feature extraction
    
    # 5. Similarity Computation
    compute_cosine_similarity()  # Pre-compute similarity matrix
    
    # 6. Model Serialization
    save_models()  # Persist for production use
```

### Recommendation Algorithm

The core recommendation logic combines search and similarity:

```python
@app.post("/recommend")
async def recommend(request: RecommendRequest):
    # 1. Translate query if needed
    query_en = await translate_to_english(request.text)
    
    # 2. Direct Search
    mask = (
        books_df["title"].str.contains(query_en, case=False, na=False) |
        books_df["author"].str.contains(query_en, case=False, na=False)
    )
    search_results = books_df[mask].nlargest(20, "rating")[["title", "author", "rating", "image", "link"]].to_dict("records")
    
    # 3. Similarity-based Recommendations
    match = books_df[books_df["title"].str.contains(query_en, case=False, na=False)]
    recommendations = []
    if not match.empty:
        idx = match.index[0]
        scores = cosine_sim[idx]
        indices = scores.argsort()[-13:-1][::-1]
        for i in indices:
            if scores[i] > 0.1:  # Similarity threshold
                b = books_df.iloc[i]
                recommendations.append({
                    "title": b["title"],
                    "author": b["author"],
                    "rating": float(b["rating"]),
                    "image": b["image"],
                    "link": b["link"]
                })
    
    return {"search_results": search_results, "recommendations": recommendations}
```

### Translation Service Implementation

```python
async def translate_to_english(text: str) -> str:
    if not co or not text.strip():
        return text
    if not any("\u0600" <= c <= "\u06FF" for c in text):  # Check for Arabic
        return text
    try:
        response = await co.chat(
            model="command-a-03-2025",
            message=f"Translate this Arabic text to English. Return ONLY the translation:\n\n{text}",
            temperature=0.0
        )
        return response.text.strip()
    except Exception as e:
        logger.error(f"Translation error: {e}")
        return text
```

## Data Processing

### Dataset Information

- **Source**: Amazon Kindle Books Dataset (130K+ books)
- **Filtered Dataset**: 9,237 high-quality technical books
- **Quality Criteria**: ≥3⭐ rating and ≥5 reviews
- **Categories**: Machine Learning, Programming, Computer Science, Mathematics, Statistics

### Technical Categorization

Books are automatically categorized into technical tracks:

```python
def get_track(cat):
    cat = str(cat).lower()
    if any(word in cat for word in ['math', 'statistics', 'probability', 'algebra', 'calculus', 'geometry']):
        return 'Mathematics & Statistics'
    elif any(word in cat for word in ['machine learning', 'deep learning', 'data science', 'artificial intelligence', 'python', 'programming', 'software', 'algorithm']):
        return 'Machine Learning & Programming'
    elif any(word in cat for word in ['computer', 'technology', 'network', 'security', 'database', 'cloud']):
        return 'Computer Science & Technology'
    elif any(word in cat for word in ['education', 'teaching', 'learning', 'pedagogy']):
        return 'Education & Teaching'
    else:
        return 'Science & Engineering'
```

### Feature Engineering

Text features are created by combining multiple book attributes:

```python
df["text_for_similarity"] = (
    df["title"].fillna("") + " " +
    df["author"].fillna("") + " " +
    df["category_name"].fillna("")
)
```

### TF-IDF Vectorization

```python
tfidf = TfidfVectorizer(
    max_features=8000,
    ngram_range=(1, 2),
    min_df=2,
    stop_words='english'
)

# Create feature matrix
tfidf_matrix = tfidf.fit_transform(books_df["text_for_similarity"])

# Compute cosine similarity
cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)
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
    "service": "recommendation_api"
  }
  ```

#### Book Recommendations
- **URL**: `/recommend`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "text": "Python machine learning"
  }
  ```
- **Response**:
  ```json
  {
    "search_results": [
      {
        "title": "Python Crash Course",
        "author": "Eric Matthes",
        "rating": 4.5,
        "image": "https://...",
        "link": "https://..."
      }
    ],
    "recommendations": [
      {
        "title": "Deep Learning with Python",
        "author": "François Chollet",
        "rating": 4.8,
        "image": "https://...",
        "link": "https://..."
      }
    ]
  }
  ```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `KAGGLE_API_TOKEN` | Kaggle API token for dataset download | Yes |
| `CO_API_KEY` | Cohere API key for translation | Yes |
| `AI_SERVICE_HOST` | Service bind address | No (default: 127.0.0.1) |
| `AI_SERVICE_PORT` | Service port | No (default: 5030) |
| `LOG_LEVEL` | Logging verbosity | No (default: INFO) |

### Kaggle API Setup

```python
def setup_kaggle():
    """Setup Kaggle API using environment variables"""
    kaggle_token = os.getenv('KAGGLE_API_TOKEN')
    if not kaggle_token:
        print("KAGGLE_API_TOKEN not found in environment variables.")
        return False
    
    # Create kaggle directory and config file
    kaggle_dir = os.path.expanduser("~/.kaggle")
    os.makedirs(kaggle_dir, exist_ok=True)
    
    # Write kaggle.json from environment variable
    kaggle_json_path = os.path.join(kaggle_dir, "kaggle.json")
    with open(kaggle_json_path, 'w') as f:
        f.write(kaggle_token)
    
    # Set proper permissions
    os.chmod(kaggle_json_path, 0o600)
    
    return True
```

## Model Architecture

### Vectorization Strategy

- **Algorithm**: TF-IDF (Term Frequency-Inverse Document Frequency)
- **Parameters**: 
  - `max_features`: 8000 (top features by frequency)
  - `ngram_range`: (1, 2) (unigrams and bigrams)
  - `min_df`: 2 (minimum document frequency)
- **Features**: Combined title, author, and category text

### Similarity Computation

- **Metric**: Cosine Similarity
- **Matrix**: Pre-computed for efficiency
- **Threshold**: 0.1 minimum similarity score
- **Top-K**: 12 most similar books per query

### Search Algorithm

- **Direct Search**: Title and author string matching
- **Ranking**: By rating (highest first)
- **Limit**: Top 20 search results
- **Case Insensitive**: Robust text matching

## Deployment

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your API keys

# Train models
python training/train.py

# Start server
uvicorn main:app --reload --host 127.0.0.1 --port 5030
```

### Docker Deployment

```bash
# Build image
docker build -t books-recommendation-api .

# Run container
docker run -p 5030:5030 \
  -e KAGGLE_API_TOKEN=your_token \
  -e CO_API_KEY=your_key \
  books-recommendation-api
```

### Production Considerations

- **Model Loading**: Multiple fallback methods (joblib/pickle)
- **Error Handling**: Comprehensive exception management
- **Logging**: Structured logging with rotation
- **Memory Management**: Efficient sparse matrix handling
- **CORS**: Configurable cross-origin support

## Performance Metrics

### System Performance

- **Startup Time**: <2 seconds
- **Search Response**: <50ms per query
- **Recommendation Generation**: <100ms per query
- **Memory Usage**: ~500MB (including similarity matrix)
- **Concurrent Requests**: Supported via async FastAPI

### Dataset Statistics

- **Total Books Processed**: 130,000+ (raw dataset)
- **Filtered Books**: 9,237 (high-quality technical books)
- **Feature Dimensions**: 8,000 TF-IDF features
- **Similarity Matrix**: 9,237 × 9,237 sparse matrix

## Integration Guide

### Client Integration

```python
import requests

class BooksRecommendationClient:
    def __init__(self, base_url="http://127.0.0.1:5030"):
        self.base_url = base_url
    
    def health_check(self):
        response = requests.get(f"{self.base_url}/health")
        return response.json()
    
    def get_recommendations(self, query):
        response = requests.post(
            f"{self.base_url}/recommend",
            json={"text": query}
        )
        return response.json()

# Usage
client = BooksRecommendationClient()
result = client.get_recommendations("Python programming")
print(f"Found {len(result['search_results'])} search results")
print(f"Generated {len(result['recommendations'])} recommendations")
```

### Batch Processing

```python
async def batch_recommendations(queries):
    async with aiohttp.ClientSession() as session:
        tasks = []
        for query in queries:
            task = get_recommendation(session, query)
            tasks.append(task)
        results = await asyncio.gather(*tasks)
        return results

async def get_recommendation(session, query):
    url = "http://127.0.0.1:5030/recommend"
    async with session.post(url, json={"text": query}) as response:
        return await response.json()
```

## Security Considerations

### Input Validation

- **Text Sanitization**: Automatic handling of special characters
- **Length Limits**: Reasonable query length constraints
- **Encoding Support**: UTF-8 text processing

### API Security

- **CORS Configuration**: Configurable origin restrictions
- **Rate Limiting**: Can be implemented via middleware
- **Authentication**: Can be integrated with existing auth systems

### Data Privacy

- **No Data Persistence**: Queries are not stored
- **API Key Security**: Environment variable management
- **Logging Privacy**: Sensitive information is masked

## Monitoring and Maintenance

### Logging Strategy

```python
def setup_ai_logger(log_file: str = None, level: str = "INFO"):
    logger = logging.getLogger("recommendation")
    log_level = getattr(logging, level.upper(), logging.INFO)
    logger.setLevel(log_level)
    
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # File handler with rotation
    file_handler = RotatingFileHandler(
        log_file or "recommendation.log",
        maxBytes=10*1024*1024,
        backupCount=5
    )
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    return logger
```

### Health Monitoring

- **Health Endpoint**: Service availability check
- **Model Validation**: Startup verification of model files
- **Performance Metrics**: Response time tracking
- **Error Rates**: Exception monitoring

### Maintenance Tasks

- **Model Updates**: Periodic retraining with new data
- **Dataset Refresh**: Monthly Kaggle dataset updates
- **Dependency Updates**: Regular package updates
- **Performance Optimization**: Memory and speed improvements

## Troubleshooting

### Common Issues

1. **Model Loading Failures**
   - Verify model files exist in `model_files/`
   - Check file permissions and paths
   - Run training script to regenerate models

2. **Kaggle Download Issues**
   - Validate `KAGGLE_API_TOKEN` format
   - Check network connectivity
   - Verify Kaggle account permissions

3. **Translation Service Failures**
   - Confirm `CO_API_KEY` is valid
   - Check Cohere API quota limits
   - Verify network connectivity

4. **Memory Issues**
   - Monitor similarity matrix size
   - Consider reducing `max_features`
   - Implement memory-efficient alternatives

### Debug Mode

```bash
export LOG_LEVEL=DEBUG
uvicorn main:app --reload --port 5030
```

### Performance Tuning

- **Vectorization**: Adjust `max_features` for memory/speed trade-off
- **Similarity Threshold**: Tune minimum similarity score
- **Caching**: Implement Redis for frequent queries
- **Batch Processing**: Optimize for bulk operations

## Future Enhancements

### Planned Features

- **Collaborative Filtering**: User behavior-based recommendations
- **Hybrid Approach**: Combine content and collaborative methods
- **Personalization**: User preference learning
- **Advanced Search**: Category filtering and sorting options
- **Analytics Dashboard**: Recommendation performance metrics

### Scalability Improvements

- **Microservices Architecture**: Separate recommendation and search services
- **Database Integration**: PostgreSQL for book metadata
- **Caching Layer**: Redis for query result caching
- **Load Balancing**: Multiple service instances
- **Cloud Deployment**: AWS/GCP container orchestration

### Algorithm Enhancements

- **Word Embeddings**: BERT/Word2Vec for semantic similarity
- **Neural Networks**: Deep learning recommendation models
- **Ensemble Methods**: Multiple algorithm combination
- **Real-time Updates**: Dynamic model updating