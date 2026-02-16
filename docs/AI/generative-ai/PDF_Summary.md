# 📋 Changelog

All notable changes to the PDF Chat & Summarization AI project will be documented in this file.

## [1.1.0] - 2025-08-26

### ✨ Added
- **Enhanced API Flexibility**
  - `/ask` endpoint now supports both form data (x-www-form-urlencoded) and JSON formats
  - Improved error handling with better validation messages
  - Request body parsing for multiple content types

### 🔧 Improved
- **API Usability**
  - More flexible data input methods for the `/ask` endpoint
  - Better compatibility with different client implementations
  - Enhanced error messages for debugging

### 📚 Documentation
- **Updated API Reference**
  - Added examples for both form data and JSON usage
  - Included cURL examples for testing
  - Clarified parameter requirements and formats

---

## [1.0.0] - 2024-08-24

### ✨ Added
- **Core Features**
  - PDF upload and processing functionality
  - Natural language chat interface with uploaded documents
  - Smart document summarization (brief and detailed)
  - Session-based conversation management
  - RESTful API with FastAPI framework

- **AI Integration**
  - Google Gemini AI integration for intelligent responses
  - Advanced text chunking and processing
  - Context-aware question answering

- **API Endpoints**
  - `POST /upload` - Upload PDF documents
  - `GET /summarize` - Generate document summaries
  - `POST /ask` - Ask questions about uploaded PDFs
  - `GET /health` - Service health monitoring
  - `GET /` - API welcome endpoint

- **Infrastructure**
  - Environment configuration with `.env` support
  - CORS support for web integration
  - Comprehensive error handling
  - Session management and chat history storage

- **Documentation**
  - Complete README with setup instructions
  - API documentation with Swagger UI
  - Contributing guidelines
  - Project architecture documentation

### 🛠️ Technical Details
- **Framework**: FastAPI 0.110.1
- **AI Model**: Google Gemini AI
- **PDF Processing**: PyMuPDF, PyPDF2
- **Text Processing**: TextBlob, spaCy
- **Server**: Uvicorn with hot reload support

### 📦 Dependencies
- FastAPI for web framework
- Google Generative AI for LLM integration
- PyMuPDF and PyPDF2 for PDF processing
- Python-dotenv for environment management
- TextBlob and spaCy for text analysis

### 🔧 Configuration
- Configurable host and port settings
- Environment-based API key management
- CORS configuration for frontend integration
- Logging level configuration

---

## Future Releases

### Planned Features
- [ ] Multi-format document support (DOCX, TXT)
- [ ] User authentication and authorization
- [ ] Document comparison capabilities
- [ ] Web frontend interface
- [ ] Advanced caching mechanisms
- [ ] Export functionality for conversations

---

*For detailed information about each release, see the [README.md](README.md) file.*
