# 🤖 PDF Chat & Summarization AI

> **Transform any PDF into an intelligent conversation partner**

A powerful AI-driven system that lets you chat with PDF documents naturally using Google's Gemini AI. Upload any document and start asking questions, getting summaries, or having detailed discussions about the content.

## 🌟 Key Features

| Feature | Description |
|---------|-------------|
| 📚 **Massive Document Support** | Handle PDFs up to 2000+ pages seamlessly |
| 💬 **Natural Language Chat** | Ask questions in plain English, get intelligent responses |
| 📝 **Smart Summarization** | Generate brief or detailed summaries on demand |
| ⚡ **Adaptive Processing** | Automatically optimizes based on document size |
| 🌐 **RESTful API** | Clean, documented endpoints with FastAPI |
| 🔒 **Secure & Private** | Your documents stay on your server |
| 🚀 **Production Ready** | Built with FastAPI, includes health checks & monitoring |

## Quick Start

### 1. Environment Setup

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate

# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Deactivate virtual environment
deactivate
```

### 2. API Key Setup

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_actual_api_key_here
AI_HOST=127.0.0.1
AI_PORT=5001
CORS_ALLOW_ORIGINS=http://localhost:3000,http://localhost:4000,http://127.0.0.1:3000,http://127.0.0.1:4000
CORS_ALLOW_CREDENTIALS=true
LOG_LEVEL=INFO
SPACY_MODEL=en_core_web_sm
```

### 3. Start Server

```bash
# Method 1: Using Python directly
python -m main

# Method 2: Using batch file (Windows)
start.bat

# Method 3: Using uvicorn directly (Recommended)
uvicorn main:app --host 127.0.0.1 --port 5001 --reload 
```

### 4. Test System

```bash
# Method 1: Using Python directly
python cli_test.py

# Method 2: Using batch file (Windows)
test.bat
```

## 🔗 Quick Access Links

| Service | URL | Description |
|---------|-----|-------------|
| 🏠 **API Root** | <http://127.0.0.1:5001/> | Welcome message |
| 📖 **Interactive Docs** | <http://127.0.0.1:5001/docs> | Swagger UI for testing |
| ❤️ **Health Check** | <http://127.0.0.1:5001/health> | Service status |
| 📋 **OpenAPI Schema** | <http://127.0.0.1:5001/openapi.json> | API specification |

## Usage Examples

### Chat Interface Examples:

```
👤 You: Who is the author?
🤖 Assistant: [Answer]

👤 You: Explain object-oriented programming
🤖 Assistant: [Explanation]

👤 You: Summarize the content
🤖 Assistant: [Detailed Summary]

👤 You: Give me a brief summary
🤖 Assistant: [Brief Summary]
```

## 🛠️ API Reference

### Core Endpoints

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| `GET` | `/` | Welcome message | None |
| `GET` | `/health` | Service health status | None |
| `POST` | `/upload` | Upload PDF document | `file`: PDF file |
| `GET` | `/summarize` | Get document summary | `session_id`, `summary_type` |
| `POST` | `/ask` | Ask questions about PDF | `session_id`, `question` |

### Response Examples

**Upload Response:**

```json
{
  "session_id": "abc123-def456",
  "brief_summary": "This document discusses..."
}
```

**Chat Response:**

```json
{
  "answer": "Based on the document, the main topic is..."
}
```

## Getting API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new project
3. Get API Key
4. Add to `.env` file

## 📁 Project Architecture

```text
chat_with_pdf_and_summarization/
├── 🚀 main.py                 # FastAPI application entry point
├── 📋 requirements.txt        # Python dependencies
├── 📖 README.md              # Documentation (this file)
├── 🔧 .env                   # Environment configuration
├── 🤖 agents/
│   └── llm_agent.py          # Gemini AI integration
├── ⚙️ services/
│   ├── embedding_index.py    # Text processing & chunking
│   └── entity_extractor.py   # Content analysis
├── 💾 storage/
│   ├── chat_history.py       # Conversation persistence
│   └── chat_history.json     # Chat data storage
└── 🛠️ utils/
    ├── __init__.py
    └── utils.py              # Helper functions
```

**🎉 Now you can chat with any PDF naturally!**
