# Magical PDF Chat & Summarization AI

> **Transform any PDF into your intelligent conversation partner with AI magic! 🪄**

Welcome to the most enchanting PDF chat experience ever created! This isn't just another boring document reader - it's a magical AI companion that brings your PDFs to life with Google's Gemini AI. Upload any document and prepare to be amazed as you chat, question, and explore your content in ways you never imagined!

## What Makes This Special?

|  Feature |  Description |  Magic Level |
|------------|----------------|----------------|
| **Massive Document Support** | Handle PDFs up to 2000+ pages with ease |  |
| **Natural Language Chat** | Ask questions like you're talking to a friend |  |
| **Smart Summarization** | Get summaries that actually make sense |  |
| **Adaptive Processing** | Automatically optimizes for your document size |  |
| **RESTful API** | Clean, documented endpoints that just work |  |
| **Secure & Private** | Your documents stay on your server, safe and sound |  |
| **Production Ready** | Built with FastAPI, includes health checks & monitoring |  |

## Quick Start Adventure

### Step 1: Environment Setup (The Magic Begins!)

```bash
# 🪄 Create your magical virtual environment
python -m venv venv

#  Activate the magic (choose your platform)
# Windows (PowerShell):
venv\Scripts\activate

# Linux/Mac (Terminal):
source venv/bin/activate

#  Install the magical dependencies
pip install -r requirements.txt

#  Deactivate when you're done (but why would you want to?)
deactivate
```

### Step 2: API Key Setup (The Secret Ingredient!)

Create a `.env` file in your root directory (this is where the magic happens!):

```env
GEMINI_API_KEY=your_actual_api_key_here
AI_HOST=127.0.0.1
AI_PORT=5001
CORS_ALLOW_ORIGINS=http://localhost:3000,http://localhost:4000,http://127.0.0.1:3000,http://127.0.0.1:4000
CORS_ALLOW_CREDENTIALS=true
LOG_LEVEL=INFO
SPACY_MODEL=en_core_web_sm
```

### Step 3: Launch the Magic

```bash
# Method 1: Direct Python magic
python -m main

# Method 2: Windows batch file (for the lazy magicians)
start.bat

# Method 3: Uvicorn with hot reload (Recommended for development)
uvicorn main:app --host 127.0.0.1 --port 5001 --reload 
```

### Step 4: Test Your Magical Creation

```bash
# Method 1: Python CLI testing
python cli_test.py

# Method 2: Windows batch testing
test.bat
```

## Quick Access Portal

| Service | URL | Description |
|------------|--------|----------------|
| **API Root** | <http://127.0.0.1:5001/> | Welcome to the magical realm! |
| **Interactive Docs** | <http://127.0.0.1:5001/docs> | Swagger UI - your API playground! |
| **Health Check** | <http://127.0.0.1:5001/health> | Is the magic working? Check here! |
| **OpenAPI Schema** | <http://127.0.0.1:5001/openapi.json> | The technical spellbook! |

## Chat Interface Examples (The Fun Part!)

```
You: Who is the author of this magical document?
AI: *adjusts wizard hat* Let me consult the ancient scrolls... The author is [Author Name]! 

You: Can you explain object-oriented programming like I'm 5?
AI: *pulls out colorful building blocks* Imagine you have magical LEGO pieces... 

You: Give me a summary of this content
AI: *waves magic wand* Abracadabra! Here's your summary: [Summary] 

You: Make it brief, please!
AI: *snaps fingers* Poof! Brief summary: [Brief Summary] 
```

## API Reference (The Technical Magic)

### Core Endpoints (Your Magic Spells)

| Method | Endpoint | Description | Parameters |
|-----------|-------------|----------------|---------------|
| `GET` | `/` | Welcome message from the magical realm | None |
| `GET` | `/health` | Service health status (is the magic working?) | None |
| `POST` | `/upload` | Upload your PDF document for enchantment | `file`: PDF file |
| `GET` | `/summarize` | Get document summary (brief or detailed) | `session_id`, `summary_type` |
| `POST` | `/ask` | Ask questions about your enchanted PDF | `session_id`, `question` (supports both form data and JSON) |

### Response Examples (The Magic Output)

**Upload Response (Document Enchanted!):**

```json
{
  "session_id": "abc123-def456",
  "brief_summary": "This document discusses the ancient art of...",
  "magic_level": "MAXIMUM",
  "enchantment_status": "SUCCESS"
}
```

**Chat Response (AI Wisdom):**

```json
{
  "answer": "Based on the enchanted document, the main topic is... 🪄",
  "session_id": "abc123-def456",
  "filename": "document.pdf",
  "ai_wizard_status": "SUCCESS",
  "magic_level": "MAXIMUM",
  "message": "Your question has been answered by our AI wizard!"
}
```

### Using the `/ask` Endpoint (Multiple Ways to Cast Your Spell!)

The `/ask` endpoint is flexible and accepts data in multiple formats:

#### Option 1: Form Data (x-www-form-urlencoded) - Recommended for simple clients
```bash
POST http://127.0.0.1:5001/ask
Content-Type: application/x-www-form-urlencoded

session_id=your_session_id&question=your_question_here
```

#### Option 2: JSON (Perfect for modern applications)
```bash
POST http://127.0.0.1:5001/ask
Content-Type: application/json

{
  "session_id": "your_session_id",
  "question": "your_question_here"
}
```

#### Example with cURL:
```bash
# Form data approach
curl -X POST "http://127.0.0.1:5001/ask" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "session_id=abc123-def456&question=What is the main topic?"

# JSON approach
curl -X POST "http://127.0.0.1:5001/ask" \
  -H "Content-Type: application/json" \
  -d '{"session_id": "abc123-def456", "question": "What is the main topic?"}'
```

## Getting Your API Key (The Quest Begins!)

1. Journey to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new magical project
3. Obtain your API Key (the source of all power!)
4. Add it to your `.env` file (the ritual is complete!)

## Project Architecture (The Magical Blueprint)

```text
chat_with_pdf_and_summarization/
├── main.py                 # FastAPI application (the magic portal)
├── requirements.txt        # Python dependencies (magical ingredients)
├── README.md              # This magical documentation
├── .env                   # Environment configuration (secret spells)
├── agents/
│   └── llm_agent.py          # Gemini AI integration (the wise wizard)
├── services/
│   ├── embedding_index.py    # Text processing & chunking (document alchemy)
│   └── entity_extractor.py   # Content analysis (magical insights)
├── storage/
│   ├── chat_history.py       # Conversation persistence (memory keeper)
│   └── chat_history.json     # Chat data storage (conversation vault)
└── utils/
    ├── __init__.py
    └── utils.py              # Helper functions (magical utilities)
```

## Special Features & Easter Eggs

- **Magical Logging**: Every action is logged with creative flair and emojis!
- **Creative Responses**: AI responses are enhanced with personality and charm
- **Performance Magic**: Optimized for speed and efficiency
- **Interactive Experience**: More than just an API - it's an adventure!

## Ready to Begin Your Magical Journey?

**Now you can chat with any PDF naturally and magically!**

---

*Built with , 🪄 magic, and lots of  creativity by the PDF Chat Magicians!*

**May your PDF conversations be ever enchanting!**
