# AI Agents Orchestrator (Vonova AI Services)

A unified FastAPI backend that orchestrates multiple AI services through a single API gateway. The system integrates multi-agent content generation, intelligent document processing, adaptive assessment creation, and personalized roadmap planning.

`This service is part of the Vonova AI Learning Platform.`

## Table of Contents

- [System Architecture](#system-architecture)
- [Core Features](#core-features)
  - [AI Article Generator](#1-ai-article-generator)
  - [AI Roadmap Generator](#2-ai-roadmap-generator)
  - [AI Quiz Generator](#3-ai-quiz-generator)
  - [AI PDF Summary & Q&A System](#4-ai-pdf-summary--qa-system)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Configuration](#configuration-environment-variables)
- [Run the App](#run-the-app)
- [API Gateway Endpoints](#api-gateway-endpoints)
- [Technology Stack](#technology-stack)
- [Docker Deployment](#docker-deployment)
- [Testing](#testing)
- [Security Considerations](#security-considerations)
- [Performance & Monitoring](#performance--monitoring)
- [Logging System](#logging-system)
- [Health Monitoring](#health-monitoring)
- [Project Layout](#project-layout-relevant-files)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## System Architecture

The application follows a modular AI micro-service design:

-   Single FastAPI entrypoint → `app.py`
-   Each AI capability implemented as an independent module
-   Multi-agent orchestration for article generation
-   Session-based document intelligence for PDF processing
-   Centralized configuration and logging

Client → FastAPI Gateway → AI Modules → LLM Providers

**Supported LLM providers:**
- Cohere
- Google Gemini

---

## Core Features

### 1) AI Article Generator

Multi-agent system that produces structured, technical articles.

**Capabilities:**
- Automatic language detection (Arabic / English)
- Multi-agent workflow (Planner → Writer → Editor)
- Technical structure validation
- Professional article formatting

**Endpoint:** `POST /generate_article`

**Request:**
```json
{
  "topic": "Artificial Intelligence in Education"
}
```

**Response:**
```json
{
  "title": "AI in Education: Transforming Learning",
  "content": "Generated article content...",
  "language": "en",
  "structure": {
    "introduction": "...",
    "main_points": ["..."],
    "conclusion": "..."
  }
}
```

---

### 2) AI Roadmap Generator

Generates structured learning paths based on skill level and duration.

**Capabilities:**
- Personalized technical roadmaps
- Weekly structured plan
- Beginner → Advanced adaptation

**Endpoint:** `POST /generate-roadmap`

**Request:**
```json
{
  "topic": "Machine Learning",
  "skill_level": "beginner",
  "duration_weeks": 12
}
```

**Response:**
```json
{
  "roadmap": {
    "title": "Machine Learning Learning Path",
    "duration_weeks": 12,
    "skill_level": "beginner",
    "weekly_plan": [
      {
        "week": 1,
        "topics": ["Introduction to ML", "Basic Statistics"],
        "resources": ["..."],
        "exercises": ["..."]
      }
    ]
  }
}
```

---

### 3) AI Quiz Generator

Automatically creates adaptive assessments.

**Capabilities:**
- MCQ + True/False questions
- Difficulty adaptation
- Arabic & English support
- Structured response format

**Endpoint:** `POST /generate-quiz`

**Request:**
```json
{
  "topic": "Python Programming",
  "difficulty": "intermediate",
  "question_count": 10,
  "question_types": ["mcq", "true_false"],
  "language": "en"
}
```

**Response:**
```json
{
  "quiz": {
    "title": "Python Programming Quiz",
    "questions": [
      {
        "id": 1,
        "type": "mcq",
        "question": "What is Python?",
        "options": ["...", "...", "...", "..."],
        "correct_answer": 0,
        "explanation": "..."
      }
    ],
    "total_questions": 10,
    "difficulty": "intermediate"
  }
}
```

---

### 4) AI PDF Summary & Q&A System

AI-powered document understanding engine with voice interaction support.

**Capabilities:**
- Upload PDF
- Auto summarization
- Ask questions about document
- Session-based memory
- Context-aware answers
- Voice Q&A (speech-to-text & text-to-speech)

**Endpoints:**
- `POST /upload` - Upload PDF document
- `GET /summarize` - Get document summary
- `POST /ask` - Ask questions about document
- `POST /voice/ask` - Voice-based Q&A
- `DELETE /session/{session_id}` - Remove session

**Upload Request:**
```bash
curl -X POST "http://localhost:5010/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@document.pdf"
```

**Summarize Request:**
```bash
curl "http://localhost:5010/summarize?session_id=abc123&summary_type=brief"
```

**Ask Question Request:**
```json
{
  "session_id": "abc123",
  "question": "What are the main findings in this document?"
}
```

---

## Prerequisites

- Python 3.13.5 (recommended)
- pip
- (Optional) Docker

## Local Development Setup

1. Open a terminal in the `Generative_Ai` folder:

```bash
cd Generative_Ai
```

2. Create and activate a venv:

```bash
python -m venv .venv
# PowerShell
.venv\Scripts\Activate.ps1
# cmd
.venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

## Configuration (environment variables)

Create a `.env` file or set environment variables before running. The app expects these names (used in `app.py`):

```env
# LLM / API keys (required)
COHERE_API_KEY=your_cohere_api_key
CO_API_KEY=your_co_api_key
GEMINI_API_KEY=your_gemini_api_key

# Service host/port
AI_SERVICE_HOST=127.0.0.1
AI_SERVICE_PORT=5010

# Logging and CORS
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000,http://localhost:4000,http://127.0.0.1:3000,http://127.0.0.1:4000
CORS_ALLOW_CREDENTIALS=true
CORS_ALLOW_METHODS=GET,POST
CORS_ALLOW_HEADERS=*
```

Note: `app.py` reads these exact variable names — keep them consistent.

## Run the app

Start with uvicorn (examples for Windows env variables shown):

```
cd Generative_Ai

uvicorn app:app --reload --port 5010
```

The API will be available at `http://{AI_SERVICE_HOST}:{AI_SERVICE_PORT}`.

## API Gateway Endpoints

- `POST /generate_article` — request body: `{"topic": "..."}`
- `POST /generate-roadmap` — `topic`, `skill_level`, `duration_weeks`
- `POST /generate-quiz` — quiz payload (see `AI_Quiz_Generator/model/quiz_schema.py` for schema)
- `POST /upload` — multipart form with `file` (PDF)
- `GET /summarize` — `session_id` and optional `summary_type`
- `POST /ask` — supports form data or JSON with `session_id` and `question`
- `POST /voice/ask` — multipart form with `audio` file and `session_id` for voice Q&A
- `DELETE /session/{session_id}` — remove a stored session
- `GET /health` — simple health check
- `GET /docs` — interactive Swagger UI

## Technology Stack

- **Backend:**
  - FastAPI
  - Python 3.13
  - Uvicorn

- **AI Integration:**
  - Cohere API
  - Google Gemini API
  - CrewAI multi-agent orchestration

- **Document Processing:**
  - PyMuPDF
  - Embedding-based retrieval
  - Speech-to-Text & Text-to-Speech

- **Infrastructure:**
  - Docker support
  - Environment-based configuration
  - Centralized logging system

---

## Docker Deployment

### Build & Run with Docker

**Build the Docker image:**
```bash
docker build -t vonova-ai-agents .
```

**Run the container:**
```bash
docker run -d \
  --name vonova-ai-services \
  -p 5010:5010 \
  -e AI_SERVICE_HOST=0.0.0.0 \
  -e AI_SERVICE_PORT=5010 \
  -e COHERE_API_KEY=your_cohere_api_key \
  -e CO_API_KEY=your_co_api_key \
  -e GEMINI_API_KEY=your_gemini_api_key \
  -e LOG_LEVEL=INFO \
  vonova-ai-agents
```

**Or use Docker Compose (recommended):**
```yaml
# docker-compose.yml
version: '3.8'
services:
  vonova-ai:
    build: .
    ports:
      - "5010:5010"
    environment:
      - AI_SERVICE_HOST=0.0.0.0
      - AI_SERVICE_PORT=5010
      - COHERE_API_KEY=${COHERE_API_KEY}
      - CO_API_KEY=${CO_API_KEY}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - LOG_LEVEL=INFO
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
```

```bash
# Run with Docker Compose
docker-compose up -d
```

**Access the service:**
- API Documentation: http://localhost:5010/docs
- Health Check: http://localhost:5010/health
- API Gateway: http://localhost:5010

---

## Testing

### Unit Tests

Run unit tests for individual modules:

```bash
# Run all tests
python -m pytest tests/

# Run specific module tests
python -m pytest tests/test_article_generator.py
python -m pytest tests/test_pdf_processor.py

# Run with coverage
python -m pytest --cov=AI_Article_Generator tests/
```

### Integration Tests

Test API endpoints:

```bash
# Test health endpoint
curl http://localhost:5010/health

# Test article generation
curl -X POST "http://localhost:5010/generate_article" \
  -H "Content-Type: application/json" \
  -d '{"topic": "Test Topic"}'

# Test PDF upload
curl -X POST "http://localhost:5010/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test_document.pdf"
```

### Load Testing

For performance testing, use tools like Apache Bench or Locust:

```bash
# Apache Bench example
ab -n 100 -c 10 http://localhost:5010/health

# Locust example (create locustfile.py first)
locust -f locustfile.py --host=http://localhost:5010
```

---

## Security Considerations

### API Key Management
- **Never commit API keys** to version control
- Use environment variables or secret management systems
- Rotate API keys regularly
- Implement key validation on startup

### Input Validation
- All file uploads are validated for type and size
- PDF files are scanned for malicious content
- JSON payloads are validated against schemas
- SQL injection protection through parameterized queries

### CORS Security
- CORS origins are explicitly configured
- Credentials handling is controlled
- Only allowed HTTP methods are permitted

### Rate Limiting
- Implement rate limiting for production deployments
- Monitor for abuse patterns
- Consider API gateway integration for advanced protection

### Data Privacy
- Session data is stored temporarily and cleaned up
- No sensitive data is logged
- Voice data is processed in memory only
- Consider encryption for sensitive document content

---

## Performance & Monitoring

### Performance Metrics
- **Response Time Monitoring**: Track API response times
- **Memory Usage**: Monitor memory consumption during PDF processing
- **LLM API Calls**: Track external API usage and costs
- **Concurrent Requests**: Monitor system load under concurrent usage

### Monitoring Tools

**Prometheus Metrics (if configured):**
```bash
# Access metrics endpoint
curl http://localhost:5010/metrics
```

**Health Checks:**
```bash
# Basic health check
curl http://localhost:5010/health

# Detailed health check (if implemented)
curl http://localhost:5010/health/detailed
```

**Log Monitoring:**
```bash
# Monitor logs in real-time
tail -f logs/Agents.log

# Filter for errors
grep "ERROR" logs/Agents.log
```

### Performance Optimization
- **Caching**: Implement caching for frequently generated content
- **Async Processing**: Use async operations for I/O bound tasks
- **Connection Pooling**: Reuse HTTP connections to LLM providers
- **Resource Limits**: Set appropriate timeouts and memory limits

---

## Logging System

**Logs are stored in:** `logs/Agents.log`

**Includes:**
- Service startup events
- Environment validation
- Error tracking
- Request lifecycle info
- API call metrics
- Performance warnings

**Log Levels:**
- `DEBUG`: Detailed debugging information
- `INFO`: General information about service operation
- `WARNING`: Warning messages for potential issues
- `ERROR`: Error messages for failures

**Log Rotation:**
- Logs are rotated daily to prevent disk space issues
- Old logs are compressed and archived
- Configure retention period based on storage capacity

---

## Health Monitoring

**Health endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "service": "Agents_api",
  "timestamp": "2024-01-01T12:00:00Z",
  "version": "1.0.0",
  "dependencies": {
    "cohere_api": "healthy",
    "gemini_api": "healthy",
    "database": "healthy"
  }
}
```

**Health Checks Include:**
- API key validation
- External service connectivity
- Database connection status
- Memory usage thresholds
- Disk space availability

---

## Project Layout (relevant files)

```python
Generative_Ai/
├── app.py                          # Unified FastAPI application
├── requirements.txt                # Consolidated pinned dependencies
├── README.md                       # This file
├── dockerfile                      # Docker container configuration
├── .gitignore                      # Git ignore patterns
├── Config/                         # Configuration files
│   ├── config.py                  # Environment validation
│   ├── logging_utils.py           # Logger helper
│   └── middleware.py              # CORS and middleware setup
├── AI_Article_Generator/           # article service code
│   ├── agents/                     # AI agents
│   ├── manager/                    # Multi-agent orchestration
│   ├── llm/                        # LLM integration
│   ├── schemas/                    # Data models
│   └── utils/                      # Utility functions
├── AI_PDF_Summary_QA/              # pdf summarization & q&a code
│   ├── agents/                     # AI agents
│   ├── helpers/                    # Helper utilities
│   │   ├── prompts.py              # Voice instruction prompts
│   │   └── utils.py                # Audio format utilities
│   ├── models/                     # Data models
│   ├── services/                   # Business logic
│   │   ├── Stt_service.py          # Speech-to-Text service
│   │   ├── Tts_service.py          # Text-to-Speech service
│   │   ├── embedding_index.py
│   │   ├── pdf_service.py
│   │   ├── processing.py
│   │   ├── query_history_storage.py
│   │   └── session_storage.py
├── AI_Quiz_Generator/              # quiz service code
│   ├── llm/                        # LLM integration
│   ├── model/                      # Data models (note: model, not models)
│   └── utils/                      # Utility functions
└── AI_Roadmap_Generator/           # roadmap service code
    ├── llm/                        # LLM integration
    ├── models/                     # Data models
    └── services/                   # Business logic
```

## Troubleshooting

### Common Issues

**1. Application Fails to Start**
- **Symptoms**: Service exits immediately with error
- **Causes**: Missing API keys, invalid configuration
- **Solutions**: 
  ```bash
  # Check environment variables
  echo $COHERE_API_KEY
  echo $GEMINI_API_KEY
  
  # Verify .env file exists
  ls -la .env
  ```

**2. PDF Upload Failures**
- **Symptoms**: Upload returns 400/500 error
- **Causes**: Invalid file format, missing dependencies
- **Solutions**:
  ```bash
  # Check PyMuPDF installation
  python -c "import fitz; print('PyMuPDF installed')"
  
  # Verify file is valid PDF
  file document.pdf
  ```

**3. LLM API Timeouts**
- **Symptoms**: Requests timeout after 30+ seconds
- **Causes**: Network issues, API rate limits
- **Solutions**:
  ```bash
  # Test API connectivity
  curl -H "Authorization: Bearer $COHERE_API_KEY" https://api.cohere.ai/v1/models
  
  # Check network latency
  ping api.cohere.ai
  ```

**4. Memory Issues with Large PDFs**
- **Symptoms**: Service crashes during PDF processing
- **Causes**: Large file processing, memory leaks
- **Solutions**:
  - Implement file size limits
  - Use streaming for large files
  - Monitor memory usage

**5. CORS Errors in Browser**
- **Symptoms**: Browser blocks API requests
- **Causes**: Incorrect CORS configuration
- **Solutions**:
  ```bash
  # Check CORS origins in .env
  echo $CORS_ORIGINS
  
  # Verify frontend URL is included
  ```

### Debug Mode

Enable debug logging for troubleshooting:

```bash
# Set debug log level
export LOG_LEVEL=DEBUG

# Run with verbose output
uvicorn app:app --reload --log-level debug --port 5010
```

### Getting Help

1. Check the logs: `tail -f logs/Agents.log`
2. Verify configuration: Check all environment variables
3. Test dependencies: Ensure all required packages are installed
4. Check API status: Verify external services are accessible
5. Review error messages: Look for specific error codes and messages

---

## Contributing

### Development Guidelines

1. **Code Style**: Follow PEP 8 Python style guidelines
2. **Testing**: Write unit tests for new features
3. **Documentation**: Update README and API docs for changes
4. **Git Workflow**: Use feature branches and pull requests

### Setup Development Environment

```bash
# Clone repository
git clone <repository-url>
cd Generative_Ai

# Create development environment
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# or
.venv\Scripts\Activate.ps1  # Windows

# Install development dependencies
pip install -r requirements.txt
pip install pytest pytest-cov black flake8

# Run pre-commit hooks (if configured)
pre-commit install
```

### Running Tests

```bash
# Run all tests with coverage
pytest --cov=. --cov-report=html

# Run linting
flake8 AI_*/
black --check AI_*/

# Format code
black AI_*/
```

### Submitting Changes

1. Create feature branch: `git checkout -b feature/new-feature`
2. Make changes and commit: `git commit -m "Add new feature"`
3. Push to repository: `git push origin feature/new-feature`
4. Create pull request with description
5. Address review feedback
6. Merge after approval

### Reporting Issues

- Use GitHub Issues for bug reports
- Include error logs and reproduction steps
- Provide environment details (OS, Python version, etc.)
- Tag relevant maintainers for visibility