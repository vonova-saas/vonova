# Vonova Chatbot Documentation

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
  - [Core Components](#core-components)
  - [Directory Structure](#directory-structure)
- [API Integration](#api-integration)
  - [FastAPI Endpoints](#fastapi-endpoints)
  - [Request/Response Schema](#requestresponse-schema)
  - [Error Response Schema](#error-response-schema)
- [Chatbot Engine](#chatbot-engine)
  - [Sentence Transformers](#sentence-transformers)
  - [Intent Classification](#intent-classification)
  - [Language Detection](#language-detection)
- [Core Code Implementation](#core-code-implementation)
  - [Main API Endpoint (main.py)](#main-api-endpoint-mainpy)
  - [Model Training Pipeline](#model-training-pipeline)
  - [Intent Processing](#intent-processing)
  - [Response Generation](#response-generation)
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

The Vonova Chatbot is a sophisticated multilingual intent-based chatbot system built with FastAPI and PyTorch. It leverages SentenceTransformers for semantic understanding and supports both English and Arabic languages with dedicated intent models.

## Architecture

### Core Components

1. **FastAPI Server** (`main.py`)
   - Main API entry point
   - Handles HTTP requests and responses
   - Manages model lifecycle with lifespan context

2. **Training Module** (`src/training/train.py`)
   - Processes intent data from JSON files
   - Generates embeddings using SentenceTransformers
   - Creates pickle files for efficient model loading

3. **Intent Data** (`src/data/`)
   - `en_intents.json` - English intent patterns and responses
   - `ar_intents.json` - Arabic intent patterns and responses
   - Generated pickle files for pre-computed embeddings

### Key Code Components

#### Model Initialization (main.py)
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    global model_en, model_ar, intents_en, intents_ar, data_en, data_ar
    print("Initializing Vonova AI Engine...")
    
    # Load sentence transformer models
    model_en = SentenceTransformer('all-MiniLM-L6-v2')
    model_ar = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
    
    # Load intent data
    with open(DATA_DIR / "en_intents.json", "r", encoding="utf-8") as f:
        intents_en = json.load(f)
    with open(DATA_DIR / "ar_intents.json", "r", encoding="utf-8") as f:
        intents_ar = json.load(f)
```

#### Language Detection
```python
def detect_language(text: str) -> str:
    for ch in text:
        if "\u0600" <= ch <= "\u06FF": return "ar"
    return "en"
```

#### Intent Classification Logic
```python
def get_response(user_input: str) -> dict:
    lang = detect_language(user_input)
    
    # Select language-specific model and data
    if lang == "ar":
        curr_model, curr_data, curr_intents = model_ar, data_ar, intents_ar
        fallback_msg = "مش قادر أفهمك أوي، ممكن توضح سؤالك؟"
    else:
        curr_model, curr_data, curr_intents = model_en, data_en, intents_en
        fallback_msg = "I'm sorry, I don't quite understand. Could you rephrase?"
    
    # Generate embedding and calculate similarity
    user_embedding = curr_model.encode(user_input, convert_to_tensor=True)
    cos_scores = util.cos_sim(user_embedding, curr_data["embeddings"])[0]
    
    top_score, top_idx = torch.max(cos_scores, dim=0)
    tag = curr_data["tags"][top_idx.item()]
    confidence = top_score.item()
    
    # Return response if confidence threshold is met
    if confidence > 0.60:
        predicted_intent = tag
        for intent in curr_intents:
            if intent["tag"] == tag:
                res_obj = intent["responses"][0]
                response_text = res_obj["text"]
                image_link = res_obj.get("image")
                break
```

#### Training Process (train.py)
```python
def process_and_save(model, json_filename, pkl_filename):
    # Load intent data
    with open(json_path, "r", encoding="utf-8") as f:
        intents = json.load(f)
    
    data_pkl = {"embeddings": [], "tags": []}
    
    # Generate embeddings for all patterns
    for intent in intents:
        tag = intent['tag']
        patterns = intent.get('patterns', [])
        
        if patterns:
            embeddings = model.encode(patterns, convert_to_tensor=True)
            data_pkl["embeddings"].append(embeddings)
            data_pkl["tags"].extend([tag] * len(patterns))
    
    # Concatenate and save embeddings

The chatbot service is integrated into main FastAPI application (`main.py`):

- **POST /chat** - Main endpoint for chat interactions
- **GET /health** - Health check endpoint
- **Language Support** - Automatic detection and response in English/Arabic
- **Error Handling** - Comprehensive error responses with proper HTTP status codes

### Request/Response Schema

#### ChatRequest Schema

```python
from pydantic import BaseModel, validator
import re

class ChatRequest(BaseModel):
    """
    Request model for chat interactions.
    
    Attributes:
        message: User message (max 1000 characters)
    """
    message: str
    
    @validator('message')
    def validate_message(cls, v):
        """Validate and sanitize message input"""
        if not v or len(v.strip()) == 0:
            raise ValueError('Message cannot be empty')
            
        if len(v) > 1000:
            raise ValueError('Message too long (max 1000 characters)')
            
        # Remove potentially harmful characters
        sanitized = re.sub(r'[<>&"\'\']', '', v.strip())
        if not sanitized:
            raise ValueError('Invalid message format')
            
        return sanitized
```

#### Response Schema

```json
{
    "bot": "Vonova",
    "intent": "greeting",
    "confidence": 0.8542,
    "reply": "Hello! How can I help you today?",
    "image": null,
    "lang": "en",
    "metadata": {
        "message_processed": "hello how can you help me",
        "language_detected": "en",
        "model_used": "all-MiniLM-L6-v2",
        "processing_time_ms": 15.7,
        "embedding_dimension": 384,
        "similarity_threshold": 0.60
    }
}
```

#### Error Response Schema

```json
{
    "status": false,
    "error": {
        "code": "CHAT_PROCESSING_FAILED",
        "message": "Failed to process chat message",
        "details": {
            "stage": "intent_classification",
            "message_preview": "hello...",
            "original_error": "Model not initialized"
        }
    },
    "timestamp": "2024-01-01T12:00:00Z"
}
```

### API Usage Examples

#### Basic Chat Interaction

```bash
curl -X POST "http://localhost:5090/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, how can you help me?"
  }'
```

#### Arabic Chat Interaction

```bash
curl -X POST "http://localhost:5090/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "مرحبا، كيف يمكنني مساعدتك؟"
  }'
```

#### With Error Handling

```bash
# Test empty message
curl -X POST "http://localhost:5090/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": ""
  }' | jq

# Test malformed request
curl -X POST "http://localhost:5090/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "invalid_field": "test"
  }' | jq
```

## Chatbot Engine

### Sentence Transformers

**Responsibility**: Generate semantic embeddings for text understanding

**Process**:
1. Load pre-trained models for English and Arabic
2. Generate 384-dimensional embeddings for input text
3. Support for multilingual semantic understanding
4. Fast inference with tensor operations

**Configuration**:
- **English Model**: `all-MiniLM-L6-v2`
- **Arabic Model**: `paraphrase-multilingual-MiniLM-L12-v2`
- **Embedding Dimension**: 384
- **Similarity Metric**: Cosine similarity

### Intent Classification

**Responsibility**: Match user input to predefined intents

**Process**:
1. Generate embedding for user message
2. Calculate cosine similarity with stored patterns
3. Select best match based on confidence threshold
4. Return appropriate response or fallback

**Features**:
- Pre-computed embeddings for efficiency
- Confidence threshold filtering (0.60)
- Language-specific intent matching
- Fallback responses for low confidence

### Language Detection

**Responsibility**: Automatically detect input language

**Process**:
1. Analyze Unicode character ranges
2. Detect Arabic characters (U+0600 to U+06FF)
3. Default to English for non-Arabic text
4. Route to appropriate model and response set

**Features**:
- Character-based detection
- Support for Arabic script
- Fast and lightweight implementation
- Automatic model selection

---

## Model Architecture

### Sentence Transformers

The chatbot uses two pre-trained models:

1. **English Model**: `all-MiniLM-L6-v2`
   - Optimized for English semantic understanding
   - 384-dimensional embeddings
   - Fast inference speed

2. **Arabic Model**: `paraphrase-multilingual-MiniLM-L12-v2`
   - Multilingual capabilities with Arabic support
   - 384-dimensional embeddings
   - Cross-lingual understanding

### Intent Classification Process

1. **Input Processing**
   - User message received via API
   - Language detection (implicit through model selection)
   - Sentence embedding generation

2. **Similarity Matching**
   - Cosine similarity between input and stored patterns
   - Best match selection based on similarity threshold
   - Intent identification

3. **Response Generation**
   - Random response selection from matched intent
   - Language-appropriate response formatting

## API Reference

### Endpoints

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "message": "Vonova Chatbot API is running"
}
```

#### Chat
```http
POST /chat
```

**Request Body:**
```json
{
  "message": "Hello, how can you help me?"
}
```

**Response:**
```json
{
  "bot": "Vonova",
  "intent": "greeting",
  "confidence": 0.8542,
  "reply": "Hello! How can I help you today?",
  "image": null,
  "lang": "en"
}
```

### Error Handling

The API implements comprehensive error handling:

- **400 Bad Request**: Invalid message format
- **500 Internal Server Error**: Model loading or processing errors
- **503 Service Unavailable**: Models not initialized

## Data Structures

### Intent JSON Format

```json
[
  {
    "tag": "student_update_email",
    "patterns": [
      "Change my email", "Update email address", "New email", "Edit contact info"
    ],
    "responses": [
      {
        "text": "Update your email address securely here: https://student.vonova.tech/settings/account",
        "image": "https://drive.google.com/file/d/1pPEJ0vYdYVxjqZzAunH-MB_Uu-Cu1MzE/preview"
      }
    ]
  }
]
```

### Pickle Data Structure

Generated pickle files contain:
```python
{
  "embeddings": tensor([[...], [...], ...]),  # Concatenated sentence embeddings
  "tags": ["student_update_email", "greeting", ...]  # Corresponding intent tags
}
```

### API Response Structure

```python
{
  "bot": "Vonova",           # Bot name
  "intent": "predicted_tag", # Detected intent
  "confidence": 0.8542,      # Confidence score (0-1)
  "reply": "Response text",  # Bot response
  "image": null,            # Optional image URL
  "lang": "en"              # Detected language
}
```

### Confidence Threshold

- **Minimum Confidence**: 0.60
- **Fallback Response**: Used when confidence < 0.60
- **Language-specific Fallbacks**:
  - English: "I'm sorry, I don't quite understand. Could you rephrase?"
  - Arabic: "مش قادر أفهمك أوي، ممكن توضح سؤالك؟"

## Deployment

### Development Setup

1. **Environment Preparation**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # or
   venv\Scripts\activate     # Windows
   ```

2. **Dependency Installation**
   ```bash
   pip install -r requirements.txt
   ```

3. **Model Training**
   ```bash
   python src/training/train.py
   ```

4. **Server Launch**
   ```bash
   python main.py
   ```

### Docker Deployment

1. **Image Building**
   ```bash
   docker build -t vonova-chatbot .
   ```

2. **Container Execution**
   ```bash
   docker run -p 5090:5090 --env-file .env vonova-chatbot
   ```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_SERVICE_HOST` | 127.0.0.1 | Server bind address |
| `AI_SERVICE_PORT` | 5090 | Server port |
| `LOG_LEVEL` | INFO | Logging verbosity |

## Performance Considerations

### Model Loading

- Models are loaded during application startup
- Pre-computed embeddings reduce inference time
- Memory usage optimized for production deployment

### Scalability

- FastAPI's async nature supports concurrent requests
- Model caching prevents redundant loading
- Stateless design enables horizontal scaling

### Optimization Tips

1. **Memory Management**
   - Monitor model memory usage
   - Consider model quantization for resource-constrained environments

2. **Response Time**
   - Pre-compute embeddings during training
   - Use efficient similarity search algorithms

3. **Batch Processing**
   - Implement batch inference for high-throughput scenarios

## Monitoring and Logging

### Log Levels

- **INFO**: General operational information
- **WARNING**: Non-critical issues
- **ERROR**: Application errors
- **DEBUG**: Detailed debugging information

### Key Metrics

- Request response time
- Model inference latency
- Memory usage
- Error rates

## Security Considerations

### Input Validation

- Message length limits
- Content sanitization
- Rate limiting implementation

### Model Security

- Secure model file storage
- Access control for training data
- Regular model updates and validation

## Future Enhancements

### Planned Features

1. **Advanced NLP**
   - Context awareness
   - Conversation history
   - Entity recognition

2. **Multi-language Support**
   - Additional languages
   - Automatic language detection
   - Cross-lingual translation

3. **Performance Improvements**
   - Model optimization
   - Caching strategies
   - Load balancing

### Extension Points

- Custom intent classifiers
- Plugin architecture
- Third-party integrations

## Troubleshooting

### Common Issues

1. **Model Loading Failures**
   - Verify pickle files exist
   - Check file permissions
   - Validate JSON format

2. **Memory Errors**
   - Reduce model size
   - Increase system memory
   - Optimize batch processing

3. **Performance Issues**
   - Monitor system resources
   - Check network latency
   - Profile model inference

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=DEBUG python main.py
```

## Contributing

### Development Guidelines

1. Follow existing code style
2. Add comprehensive tests
3. Update documentation
4. Validate model performance

### Testing

```bash
# Run unit tests
python -m pytest tests/

# Run integration tests
python -m pytest tests/integration/
```

## License

This feature is part of the Vonova AI project and is licensed under the Apache License.