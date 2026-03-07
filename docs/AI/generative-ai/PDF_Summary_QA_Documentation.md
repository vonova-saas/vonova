# PDF Summary & QA System Documentation

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Core Services](#core-services)
  - [PDF Service](#pdf-service)
  - [LLM Agent](#llm-agent)
  - [Text Processing](#text-processing)
  - [Session Management](#session-management)
  - [Voice Services](#voice-services)
- [Data Models](#data-models)
  - [Response Schemas](#response-schemas)
- [Integration Guide](#integration-guide)
  - [Basic Integration](#basic-integration)
  - [FastAPI Integration Example](#fastapi-integration-example)
  - [Voice Integration Example](#voice-integration-example)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
  - [Dependencies](#dependencies)
- [Performance Considerations](#performance-considerations)
  - [Text Chunking Strategy](#text-chunking-strategy)
  - [Session Management](#session-management-1)
  - [AI Optimization](#ai-optimization)
- [Error Handling](#error-handling)
  - [Common Error Scenarios](#common-error-scenarios)
- [Security Considerations](#security-considerations)
  - [Data Privacy](#data-privacy)
  - [API Key Management](#api-key-management)
  - [File Upload Security](#file-upload-security)
- [Monitoring and Logging](#monitoring-and-logging)
  - [Key Metrics to Track](#key-metrics-to-track)
  - [Logging Strategy](#logging-strategy)
- [Testing](#testing)
  - [Unit Testing Example](#unit-testing-example)
  - [Integration Testing](#integration-testing)
- [Deployment](#deployment)
  - [Docker Configuration](#docker-configuration)
  - [Production Considerations](#production-considerations)
- [Production Readiness](#production-readiness)
  - [Monitoring Setup](#monitoring-setup)
  - [Security Implementation](#security-implementation)
  - [Scaling Strategies](#scaling-strategies)
  - [Backup and Recovery](#backup-and-recovery)
  - [Environment Configuration](#environment-configuration)
- [Future Enhancements](#future-enhancements)
  - [Planned Features](#planned-features)
  - [Extension Points](#extension-points)
- [Support and Contributing](#support-and-contributing)

## Overview

The PDF Summary & QA system is a comprehensive service layer that provides intelligent document processing and natural language interaction capabilities. This document outlines the architecture, services, and integration patterns for building applications that can chat with PDF documents.

## Architecture

The system follows a modular service-oriented architecture with clear separation of concerns:

**Application Layer**
- FastAPI, Flask, Django, or any web framework
- Handles HTTP requests and responses
- Provides API endpoints for client applications

**PDF Service Interface**
- handle_upload: Processes uploaded PDF files
- handle_ask: Answers questions about documents
- handle_summarize: Generates document summaries

**Core Services**
- LLM Agent: Manages AI interactions with Gemini
- PDF Process: Handles text extraction and processing
- Session Management: Tracks user sessions and document state
- Storage: Manages document chunks and metadata

**External Services**
- Gemini AI: Provides natural language processing and generation
- spaCy: Handles NLP processing and text analysis
- PyPDF2: Extracts text from PDF documents
- STT/TTS: Speech-to-Text and Text-to-Speech services

## Core Services

### 1. PDF Service (`AI/Generative_Ai/AI_PDF_Summary_QA/services/pdf_service.py`)

The main orchestrator that coordinates all PDF processing operations.

#### Key Functions

**`initialize_ai_wizard()`**
- Initializes the Gemini AI model and agent
- Returns boolean success status
- Must be called before any other operations

**`handle_upload(file_bytes, filename, language=None)`**
- Processes uploaded PDF files
- Extracts text and creates intelligent chunks
- Generates brief summary
- Returns session ID and metadata

**`handle_ask(session_id, question)`**
- Answers questions about uploaded documents
- Uses relevant text chunks for context
- Tracks query history
- Returns structured response with metadata

**`handle_summarize(session_id, summary_type)`**
- Generates document summaries
- Supports 'brief' and 'detailed' summary types
- Caches summaries for performance
- Returns summary with metadata

### 2. LLM Agent (`AI/Generative_Ai/AI_PDF_Summary_QA/agents/llm_agent.py`)

Handles all interactions with Google's Gemini AI.

#### Capabilities
- Document summarization (brief and detailed)
- Question answering with context
- Intelligent text analysis
- Token usage optimization

### 3. Text Processing (`AI/Generative_Ai/AI_PDF_Summary_QA/services/embedding_index.py`)

Manages text chunking and intelligent segmentation.

#### Features
- Smart chunking based on token limits
- Context-aware text segmentation
- Optimal chunk size for AI processing
- Preserves document structure

### 4. Session Management (`AI/Generative_Ai/AI_PDF_Summary_QA/services/session_storage.py`)

Handles user sessions and document storage.

#### Functionality
- Session creation and retrieval
- Document metadata storage
- Processing state tracking
- Session expiration management

### 5. Voice Services

#### Speech-to-Text (`AI/Generative_Ai/AI_PDF_Summary_QA/services/Stt_service.py`)
- Audio transcription capabilities
- Multiple format support
- Integration ready for voice questions

#### Text-to-Speech (`AI/Generative_Ai/AI_PDF_Summary_QA/services/Tts_service.py`)
- Convert AI responses to speech
- Natural voice synthesis
- Multiple audio format output

## Data Models

### Response Schemas (`AI/Generative_Ai/AI_PDF_Summary_QA/models/pdf_schema.py`)

**AskResponse**
```python
class AskResponse(BaseModel):
    answer: str
    session_id: str
    filename: str
    ai_wizard_status: str
    magic_level: str
    message: str
```

**UploadResponse**
```python
class UploadResponse(BaseModel):
    session_id: str
    brief_summary: str
    magic_level: str
    enchantment_status: str
    message: str
```

**SummaryResponse**
```python
class SummaryResponse(BaseModel):
    summary: str
    summary_type: str
    filename: str
    magic_level: str
    ai_wizard_status: str
```

## Integration Guide

### Basic Integration

```python
from AI.Generative_Ai.AI_PDF_Summary_QA.services.pdf_service import (
    initialize_ai_wizard, 
    handle_upload, 
    handle_ask, 
    handle_summarize
)

# Initialize services
if not initialize_ai_wizard():
    raise Exception("Failed to initialize AI services")

# Process PDF
with open('document.pdf', 'rb') as f:
    file_bytes = f.read()

upload_result = handle_upload(file_bytes, 'document.pdf')
session_id = upload_result['session_id']

# Interactive chat
while True:
    question = input("Ask about the document: ")
    if question.lower() == 'quit':
        break
    
    response = handle_ask(session_id, question)
    print(f"AI: {response['answer']}")
```

### FastAPI Integration Example

```python
from fastapi import FastAPI, UploadFile, File, HTTPException
from AI.Generative_Ai.AI_PDF_Summary_QA.services.pdf_service import (
    initialize_ai_wizard, 
    handle_upload, 
    handle_ask, 
    handle_summarize
)

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    if not initialize_ai_wizard():
        raise Exception("AI services initialization failed")

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    file_bytes = await file.read()
    result = handle_upload(file_bytes, file.filename)
    return result

@app.post("/ask")
async def ask_question(session_id: str, question: str):
    try:
        result = handle_ask(session_id, question)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/summarize")
async def summarize_document(session_id: str, summary_type: str = "brief"):
    try:
        result = handle_summarize(session_id, summary_type)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
```

### Voice Integration Example

```python
from AI.Generative_Ai.AI_PDF_Summary_QA.services.Stt_service import transcribe_audio
from AI.Generative_Ai.AI_PDF_Summary_QA.services.Tts_service import text_to_speech

async def voice_chat_interface(session_id: str, audio_file: str):
    # Transcribe voice input
    transcribed_text = transcribe_audio(audio_file)
    
    # Get AI response
    response = handle_ask(session_id, transcribed_text)
    
    # Convert response to speech
    audio_response = text_to_speech(response['answer'])
    
    return {
        "transcribed_question": transcribed_text,
        "text_answer": response['answer'],
        "audio_answer": audio_response
    }
```

## Configuration

### Environment Variables

```env
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional
AI_HOST=127.0.0.1
AI_PORT=5001
CORS_ALLOW_ORIGINS=http://localhost:3000,http://localhost:4000
CORS_ALLOW_CREDENTIALS=true
LOG_LEVEL=INFO
SPACY_MODEL=en_core_web_sm
```

### Dependencies

```bash
# Core dependencies
pip install google-generativeai PyPDF2 spacy python-dotenv

# Language model
python -m spacy download en_core_web_sm

# Optional for voice features
pip install speechrecognition pyttsx3
```

## Performance Considerations

### Text Chunking Strategy
- Documents are chunked into 300-token segments
- Chunks are optimized for AI context windows
- Overlapping chunks preserve context continuity

### Session Management
- Sessions are stored in memory for fast access
- Automatic cleanup of expired sessions
- Efficient caching of summaries and responses

### AI Optimization
- Intelligent prompt engineering for optimal responses
- Token usage monitoring and optimization
- Context-aware question answering

## Error Handling

### Common Error Scenarios

**AI Service Not Initialized**
```python
if not initialize_ai_wizard():
    # Handle initialization failure
    logger.error("Failed to initialize AI services")
```

**Session Not Found**
```python
try:
    result = handle_ask(session_id, question)
except ValueError as e:
    if "Session not found" in str(e):
        # Handle missing session
        return {"error": "Invalid session ID"}
```

**PDF Processing Errors**
```python
try:
    result = handle_upload(file_bytes, filename)
except Exception as e:
    # Handle PDF processing errors
    logger.error(f"PDF processing failed: {e}")
    return {"error": "Failed to process PDF"}
```

## Security Considerations

### Data Privacy
- All processing happens on your server
- No data is sent to third-party services except Gemini AI
- Session data can be encrypted for additional security

### API Key Management
- Store Gemini API key securely in environment variables
- Implement API key rotation if needed
- Monitor API usage for unusual activity

### File Upload Security
- Validate file types and sizes
- Scan uploaded files for malware
- Implement rate limiting for uploads

## Monitoring and Logging

### Key Metrics to Track
- Request count and duration
- PDF processing time by file size
- AI response latency
- Active sessions count
- Token usage tracking
- Error rates and types

### Logging Strategy
```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Log key events
logger.info(f"Document uploaded: {filename}, pages: {page_count}")
logger.info(f"Query processed: session_id={session_id}, response_time={response_time}")
logger.info(f"Summary generated: type={summary_type}, tokens_used={tokens}")
```

## Testing

### Unit Testing Example

```python
import pytest
from AI.Generative_Ai.AI_PDF_Summary_QA.services.pdf_service import handle_ask

def test_handle_ask_valid_session():
    # Setup test session
    session_id = create_test_session()
    
    # Test question
    result = handle_ask(session_id, "What is this document about?")
    
    assert 'answer' in result
    assert result['session_id'] == session_id
    assert len(result['answer']) > 0

def test_handle_ask_invalid_session():
    with pytest.raises(ValueError, match="Session not found"):
        handle_ask("invalid_session", "Test question")
```

### Integration Testing

```python
def test_pdf_processing_workflow():
    # Initialize services
    assert initialize_ai_wizard()
    
    # Upload PDF
    with open('test_document.pdf', 'rb') as f:
        file_bytes = f.read()
    
    upload_result = handle_upload(file_bytes, 'test_document.pdf')
    session_id = upload_result['session_id']
    
    # Test Q&A
    qa_result = handle_ask(session_id, "Summarize this document")
    assert 'answer' in qa_result
    
    # Test summarization
    summary_result = handle_summarize(session_id, 'brief')
    assert 'summary' in summary_result
```

## Deployment

### Docker Configuration

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt
RUN python -m spacy download en_core_web_sm

COPY . .

EXPOSE 5001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5001"]
```

### Production Considerations
- Use environment-specific configuration
- Implement proper logging and monitoring
- Set up database for persistent session storage
- Configure load balancing for high availability
- Implement backup and recovery procedures

## Production Readiness

### Monitoring Setup

**Enable Monitoring**
```python
from monitoring import setup_monitoring, monitor, health_checker

# Setup monitoring endpoints
setup_monitoring(port=8001)

# Add custom health checks
def check_database_connection():
    # Check your database connection
    return True

health_checker.add_check("database", check_database_connection)

# Monitor function performance
@monitor.monitor_performance
def process_large_document(file_bytes):
    # Your processing logic
    pass
```

**Key Metrics Available**
- Request count and duration
- PDF processing time by file size
- AI response latency
- Active sessions count
- Token usage tracking
- Error rates and types

### Security Implementation

**File Upload Security**
```python
from security import FileValidator, rate_limiter, audit_logger

# Validate file upload
def secure_upload(file_bytes, filename, user_id):
    # Check file size
    if not FileValidator.validate_file_size(len(file_bytes)):
        raise SecurityError("File too large")
    
    # Scan for malware
    if not FileValidator.scan_for_malware(file_bytes):
        raise SecurityError("Malicious content detected")
    
    # Generate file hash for audit
    file_hash = FileValidator.generate_file_hash(file_bytes)
    
    # Log upload event
    audit_logger.log_file_upload(user_id, filename, file_hash, len(file_bytes))
    
    return file_hash
```

**Rate Limiting**
```python
# Apply rate limiting
@monitor.monitor_performance
def api_endpoint(user_id: str):
    if not rate_limiter.is_allowed(user_id):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    # Your API logic
    pass
```

**Session Encryption**
```python
from security import session_encryption

# Encrypt sensitive session data
encrypted_data = session_encryption.encrypt_data(sensitive_info)
decrypted_data = session_encryption.decrypt_data(encrypted_data)
```

### Scaling Strategies

**Horizontal Scaling**
```yaml
# docker-compose.scale.yml
version: '3.8'
services:
  pdf-qa-service:
    build: .
    deploy:
      replicas: 3
    environment:
      - REDIS_URL=redis://redis:6379
      - INSTANCE_ID=${HOSTNAME}
```

**Database-backed Sessions**
```python
# Replace in-memory storage with Redis
import redis
from json import dumps, loads

redis_client = redis.Redis.from_url(os.getenv("REDIS_URL"))

def store_session(session_id: str, data: dict):
    encrypted_data = session_encryption.encrypt_data(dumps(data))
    redis_client.setex(f"session:{session_id}", 86400, encrypted_data)

def get_session(session_id: str):
    encrypted_data = redis_client.get(f"session:{session_id}")
    if encrypted_data:
        return loads(session_encryption.decrypt_data(encrypted_data))
    return None
```

**Load Balancer Configuration**
```nginx
# nginx.conf
upstream pdf_qa_backend {
    least_conn;
    server pdf-qa-service-1:8000;
    server pdf-qa-service-2:8000;
    server pdf-qa-service-3:8000;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://pdf_qa_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Security headers
        add_header X-Content-Type-Options nosniff;
        add_header X-Frame-Options DENY;
        add_header X-XSS-Protection "1; mode=block";
    }
    
    location /health {
        proxy_pass http://pdf_qa_backend/health;
        access_log off;
    }
}
```

### Backup and Recovery

**Data Backup Strategy**
```bash
#!/bin/bash
# backup.sh

# Backup Redis sessions
redis-cli --rdb /backups/sessions_$(date +%Y%m%d).rdb

# Backup logs
tar -czf /backups/logs_$(date +%Y%m%d).tar.gz /app/logs/

# Cleanup old backups (keep 30 days)
find /backups -name "*.rdb" -mtime +30 -delete
find /backups -name "*.tar.gz" -mtime +30 -delete
```

**Health Check Endpoint**
```python
@app.get("/health")
async def health_check():
    return health_checker.check_health()

# Response format
{
    "status": "healthy",
    "timestamp": "2026-03-04T10:00:00Z",
    "checks": {
        "ai_service": {"status": "healthy", "details": true},
        "dependencies": {"status": "healthy", "details": true},
        "database": {"status": "healthy", "details": true}
    }
}
```

### Environment Configuration

**Production Environment Variables**
```env
# Core Configuration
GEMINI_API_KEY=your_production_gemini_key
AI_HOST=0.0.0.0
AI_PORT=8000
LOG_LEVEL=INFO

# Security
JWT_SECRET_KEY=your_jwt_secret_key_here
ENCRYPTION_KEY=your_encryption_key_here
API_KEY_REQUIRED=true
API_KEY=your_api_key_here
SCAN_UPLOADS=true
ENCRYPT_SESSIONS=true

# Performance
MAX_FILE_SIZE=104857600  # 100MB
RATE_LIMIT_REQUESTS=1000
RATE_LIMIT_WINDOW=3600
SESSION_TIMEOUT_HOURS=24

# Scaling
REDIS_URL=redis://redis:6379
DATABASE_URL=postgresql://user:pass@db:5432/pdfqa

# Monitoring
PROMETHEUS_ENABLED=true
METRICS_PORT=8001
STRUCTLOG_ENABLED=true
```

## Future Enhancements

### Planned Features
- Multi-language support
- Advanced document analysis
- Integration with more AI models
- Real-time collaboration features
- Advanced search capabilities

### Extension Points
- Custom AI model integration
- Alternative document formats support
- Advanced voice features
- Custom authentication providers
- Integration with external knowledge bases

## Support and Contributing

For issues, questions, or contributions:
1. Check the documentation first
2. Review existing issues
3. Create detailed bug reports
4. Submit pull requests with tests
5. Follow coding standards and best practices

---

*This documentation covers the core functionality of the PDF Summary & QA system. For specific implementation details, refer to the source code and inline documentation.*