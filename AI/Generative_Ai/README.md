# AI Agents Orchestrator (Vonova AI Services)

A unified FastAPI backend that orchestrates multiple AI services through
a single API gateway.\
The system integrates multi-agent content generation, intelligent
document processing, adaptive assessment creation, and personalized
roadmap planning.

This service is part of the Vonova AI Learning Platform.

------------------------------------------------------------------------

# System Architecture

The application follows a modular AI micro-service design:

-   Single FastAPI entrypoint → `app.py`
-   Each AI capability implemented as an independent module
-   Multi-agent orchestration for article generation
-   Session-based document intelligence for PDF processing
-   Centralized configuration and logging

Client → FastAPI Gateway → AI Modules → LLM Providers

Supported LLM providers: - Cohere - Google Gemini

------------------------------------------------------------------------

# Core Features

## 1) AI Article Generator

Multi-agent system that produces structured, technical articles.

Capabilities: - Automatic language detection (Arabic / English) -
Multi-agent workflow (Planner → Writer → Editor) - Technical
structure validation - Professional article formatting

Endpoint: POST `/generate_article`

Request: { "topic": "Artificial Intelligence in Education" }

------------------------------------------------------------------------

## 2) AI Roadmap Generator

Generates structured learning paths based on skill level and duration.

Capabilities: - Personalized technical roadmaps - Weekly structured
plan - Beginner → Advanced adaptation

Endpoint: POST `/generate-roadmap`

Request: { "topic": "Machine Learning", "skill_level": "beginner",
"duration_weeks": 12 }

------------------------------------------------------------------------

## 3) AI Quiz Generator

Automatically creates adaptive assessments.

Capabilities: - MCQ + True/False questions - Difficulty adaptation -
Arabic & English support - Structured response format

Endpoint: POST `/generate-quiz`

------------------------------------------------------------------------

## 4) AI PDF Summary & Q&A System

AI-powered document understanding engine with voice interaction support.

Capabilities: - Upload PDF - Auto summarization - Ask questions about
document - Session-based memory - Context-aware answers - Voice Q&A (speech-to-text & text-to-speech)

Endpoints: - POST `/upload` - GET `/summarize` - POST `/ask` - POST `/voice/ask` - DELETE
`/session/{session_id}`


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

- Backend: - `FastAPI` - `Python 3.13` - `Uvicorn`

- AI Integration: - `Cohere API` - `Google Gemini API` - `CrewAI multi-agent`
orchestration

- Document Processing: - `PyMuPDF` - `Embedding-based retrieval` - `Speech-to-Text & Text-to-Speech`

- Infrastructure: - `Docker support` - `Environment-based configuration` -
`Centralized logging system`

## Docker Deployment

### 🐳 Build & Run with Docker

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

## Logging System

- Logs are stored in: logs/Agents.log

- Includes: - Service startup events - Environment validation - Error
  tracking - Request lifecycle info

## Health Monitoring

Health endpoint:

GET `/health`

Response: { "status": "healthy", "service": "Agents_api" }

----
## Project Layout (relevant files)

```
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

- If the app fails on startup: ensure `COHERE_API_KEY`, `CO_API_KEY`, and `GEMINI_API_KEY` are set — `app.py` raises on missing LLM keys.
- If uploads fail: confirm `PyMuPDF` (`fitz`) is installed and the uploaded file is a PDF.
- If CORS or host/port behavior is unexpected: verify `CORS_ORIGINS`, `AI_SERVICE_HOST`, and `AI_SERVICE_PORT`.
