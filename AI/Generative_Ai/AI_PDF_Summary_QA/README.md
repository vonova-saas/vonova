# 🤖 PDF Chat & Summarization AI

> **Advanced AI-powered service for intelligent PDF conversation and summarization**

A sophisticated, production-ready AI service layer that enables natural language interaction with PDF documents using Google's Gemini AI. This repository provides enterprise-grade core business logic for PDF processing, intelligent text analysis, and contextual question-answering capabilities.

## ✨ Why Choose This Solution?

- **🚀 Production Ready**: Battle-tested service architecture with comprehensive error handling
- **📚 Massive Scale**: Seamlessly handles PDFs from 1 to 2000+ pages
- **🧠 Intelligent Understanding**: Context-aware responses using state-of-the-art AI
- **⚡ Lightning Fast**: Optimized processing with adaptive chunking and caching
- **🔧 Developer Friendly**: Clean, well-documented API with type hints
- **🔒 Enterprise Security**: Your documents never leave your infrastructure
- **🎯 Voice Ready**: Built-in STT/TTS service integration for hands-free operation

## 🏗️ Service Architecture

### Core Services

This repository provides production-ready services that can be seamlessly integrated into any application:

```python
from AI_PDF_Summary_QA.services.pdf_service import (
    initialize_ai_wizard, 
    handle_upload, 
    handle_ask, 
    handle_summarize
)

# Initialize the AI services (call once at startup)
if initialize_ai_wizard():
    # Handle PDF upload and processing
    result = handle_upload(file_bytes, filename, language="en")
    
    # Ask intelligent questions about the document
    answer = handle_ask(
        result['session_id'], 
        "What are the key findings in this document?"
    )
    
    # Generate comprehensive summaries
    summary = handle_summarize(result['session_id'], "detailed")
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Google Gemini API key
- 4GB+ RAM recommended for large documents

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AI_PDF_Summary_QA
   ```

2. **Install dependencies**
   ```bash
   pip install google-generativeai PyPDF2 spacy python-dotenv
   python -m spacy download en_core_web_sm
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

### Environment Configuration

Create a `.env` file in your application root:

```env
# Required: Google Gemini API Configuration
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Server Configuration
AI_HOST=127.0.0.1
AI_PORT=5001

# CORS Configuration (for web applications)
CORS_ALLOW_ORIGINS=http://localhost:3000,http://localhost:4000,http://127.0.0.1:3000,http://127.0.0.1:4000
CORS_ALLOW_CREDENTIALS=true

# Logging Configuration
LOG_LEVEL=INFO

# NLP Configuration
SPACY_MODEL=en_core_web_sm

# Optional: Performance Tuning
MAX_CHUNK_SIZE=300
MAX_CONTEXT_LENGTH=500000
SESSION_TIMEOUT_HOURS=24
```

## 📋 API Reference

### Core Service Functions

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `initialize_ai_wizard()` | Initialize AI services | None | Boolean success status |
| `handle_upload()` | Process PDF upload | `file_bytes`, `filename`, `language` | Session info & brief summary |
| `handle_ask()` | Answer questions | `session_id`, `question` | AI response with metadata |
| `handle_summarize()` | Generate summaries | `session_id`, `summary_type` | Document summary |

### Response Formats

#### Upload Response
```json
{
  "session_id": "uuid-string",
  "filename": "document.pdf",
  "summary": "Brief document summary...",
  "page_count": 45,
  "file_size": 2048576,
  "processing_time": 2.34,
  "status": "completed"
}
```

#### Question Response
```json
{
  "answer": "Intelligent response to your question...",
  "confidence": 0.95,
  "sources": ["page_12", "page_23"],
  "processing_time": 1.23
}
```

#### Summary Response
```json
{
  "summary": "Comprehensive document summary...",
  "summary_type": "detailed",
  "key_points": ["Point 1", "Point 2", "Point 3"],
  "word_count": 450
}
```

## 💡 Usage Examples

### Basic Integration

```python
from AI_PDF_Summary_QA.services.pdf_service import initialize_ai_wizard, handle_upload, handle_ask

# Initialize services (call once at application startup)
if initialize_ai_wizard():
    # Upload and process PDF
    with open('document.pdf', 'rb') as f:
        file_bytes = f.read()
    
    upload_result = handle_upload(file_bytes, 'document.pdf')
    session_id = upload_result['session_id']
    
    # Ask questions about the document
    qa_result = handle_ask(session_id, "What are the main topics discussed?")
    print(f"Answer: {qa_result['answer']}")
    print(f"Confidence: {qa_result.get('confidence', 'N/A')}")
```

### Advanced Integration with Error Handling

```python
import logging
from AI_PDF_Summary_QA.services.pdf_service import (
    initialize_ai_wizard, 
    handle_upload, 
    handle_ask, 
    handle_summarize
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PDFChatService:
    def __init__(self):
        self.initialized = initialize_ai_wizard()
        if not self.initialized:
            raise RuntimeError("Failed to initialize AI services")
    
    def process_document(self, file_path: str, language: str = "en"):
        """Process a PDF document and return session info"""
        try:
            with open(file_path, 'rb') as f:
                file_bytes = f.read()
            
            result = handle_upload(file_bytes, file_path, language)
            logger.info(f"Document processed: {result['filename']}")
            return result
        except Exception as e:
            logger.error(f"Error processing document: {e}")
            raise
    
    def ask_question(self, session_id: str, question: str):
        """Ask a question about the processed document"""
        try:
            result = handle_ask(session_id, question)
            logger.info(f"Question answered: {question[:50]}...")
            return result
        except Exception as e:
            logger.error(f"Error answering question: {e}")
            raise

# Usage
service = PDFChatService()
session = service.process_document('research_paper.pdf')
answer = service.ask_question(session['session_id'], "What are the key findings?")
```

### Voice Integration Ready

```python
from AI_PDF_Summary_QA.services.Stt_service import transcribe_audio
from AI_PDF_Summary_QA.services.Tts_service import text_to_speech

def voice_qa_session(session_id: str, audio_file: str):
    """Complete voice-based Q&A session"""
    # Transcribe voice question
    transcribed_text = transcribe_audio(audio_file)
    print(f"Transcribed: {transcribed_text}")
    
    # Get AI answer
    answer = handle_ask(session_id, transcribed_text)
    print(f"Answer: {answer['answer']}")
    
    # Convert answer to speech
    audio_response = text_to_speech(answer['answer'])
    return audio_response

# Usage
# audio_response = voice_qa_session(session_id, "question.wav")
```

## 📁 Project Architecture

```text
AI_PDF_Summary_QA/
├── 📚 README.md                    # Comprehensive documentation
├── 🤖 agents/                      # AI Model Integration
│   ├── __init__.py
│   └── llm_agent.py               # Gemini AI interface & conversation logic
├── 🎯 models/                      # Data Models & Schemas
│   ├── __init__.py
│   └── pdf_schema.py              # Pydantic models for type safety
├── ⚙️ services/                    # Core Business Logic
│   ├── __init__.py
│   ├── pdf_service.py             # Main PDF processing orchestrator
│   ├── embedding_index.py         # Text chunking & semantic indexing
│   ├── proccesing.py              # PDF text extraction & cleaning
│   ├── session_storage.py         # Document session management
│   ├── query_history_storage.py   # Query tracking & analytics
│   ├── Stt_service.py             # Speech-to-Text integration
│   └── Tts_service.py             # Text-to-Speech integration
└── 🛠️ helpers/                     # Utilities & Configuration
    ├── __init__.py
    ├── utils.py                   # Audio format & file utilities
    └── prompts.py                 # AI prompt templates & system messages
```

## � Service Dependencies

| Component | Purpose | Version |
|-----------|---------|---------|
| **Google Gemini AI** | Core LLM for Q&A and summarization | Latest |
| **spaCy** | NLP processing & text analysis | en_core_web_sm |
| **PyPDF2** | PDF text extraction | Latest |
| **python-dotenv** | Environment configuration | Latest |
| **Optional: STT/TTS** | Voice interaction capabilities | Provider-specific |

## 🚨 Troubleshooting

### Common Issues

#### **Initialization Failed**
```python
# Check your API key and network connectivity
import os
print(f"GEMINI_API_KEY set: {'✓' if os.getenv('GEMINI_API_KEY') else '✗'}")
```

#### **Memory Issues with Large PDFs**
- Reduce `MAX_CHUNK_SIZE` in environment variables
- Increase system RAM or use streaming processing
- Consider splitting large documents into smaller sections

#### **Slow Processing Times**
- Ensure spaCy model is downloaded: `python -m spacy download en_core_web_sm`
- Check network connectivity to Google's API
- Monitor system resources (CPU/RAM usage)

#### **CORS Issues in Web Applications**
```env
# Add your frontend domain to CORS origins
CORS_ALLOW_ORIGINS=http://your-frontend-domain.com,https://your-app.com
```

### Debug Mode

Enable detailed logging for troubleshooting:

```env
LOG_LEVEL=DEBUG
```

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## ⚡ Performance Optimization

### For Large Documents (1000+ pages)

```env
# Optimized settings for enterprise-scale documents
MAX_CHUNK_SIZE=200
MAX_CONTEXT_LENGTH=300000
BATCH_PROCESSING=true
PARALLEL_CHUNKS=4
```

### Memory Management

```python
# Process documents in batches for memory efficiency
def process_large_document(file_bytes, filename):
    # Upload in chunks if file > 50MB
    if len(file_bytes) > 50 * 1024 * 1024:
        # Implement chunked upload logic
        pass
    return handle_upload(file_bytes, filename)
```

## 🔒 Security Considerations

- **API Keys**: Never commit API keys to version control
- **Document Privacy**: All processing happens locally; documents are not sent to third parties except for AI processing
- **Session Management**: Sessions automatically expire after 24 hours
- **Input Validation**: All inputs are sanitized and validated

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Setup

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Install development dependencies**
   ```bash
   pip install -r requirements-dev.txt
   ```
4. **Run tests**
   ```bash
   python -m pytest tests/
   ```

### Code Standards

- Follow PEP 8 style guidelines
- Add type hints for all functions
- Include docstrings for new functions
- Write unit tests for new features

### Submitting Changes

1. Ensure all tests pass
2. Update documentation as needed
3. Submit a pull request with detailed description

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs via GitHub Issues
- **Community**: Join our discussions for questions and feature requests

---
