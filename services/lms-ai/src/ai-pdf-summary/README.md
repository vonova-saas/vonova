# PDF Summary AI Service

AI-powered PDF processing, summarization, and chat functionality built on the LMS-AI architecture.

## 🚀 Features

- **PDF Summarization**: Generate AI-powered summaries in multiple formats
  - Brief summaries
  - Detailed summaries
  - Chapter-wise summaries
  - Key points extraction
- **PDF Chat**: Interactive AI chat about PDF content
- **File Upload**: Secure PDF file upload with validation
- **Session Management**: Persistent chat sessions for ongoing conversations
- **User Tracking**: Comprehensive user activity and progress tracking
- **Caching**: Intelligent caching to avoid reprocessing identical files

## 🏗️ Architecture

The service follows the LMS-AI microservice architecture pattern:

```
src/ai-pdf-summary/
├── controllers/          # HTTP request handlers
├── models/              # Data models and schemas
├── routes/              # API route definitions
├── services/            # Business logic and AI integration
├── validation/          # Request validation schemas
├── utils/               # Utility functions and logging
├── swagger/             # API documentation
└── index.ts             # Main application entry point
```

## 🛠️ Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **AI Integration**: Python service via HTTP API
- **Validation**: Zod schema validation
- **Logging**: Winston with structured logging
- **Security**: Helmet, CORS, rate limiting, bot protection
- **Documentation**: OpenAPI/Swagger

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- MongoDB instance
- Python PDF processing service running on port 5001
- Environment variables configured

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd services/lms-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Configure environment variables**
   ```env
   # Service Configuration
   PORT=3001
   NODE_ENV=development
   
   # Database
   MONGO_URI_ROADMAP_AI=mongodb://localhost:27017/pdf_summary
   
   # AI Service
   PDF_SUMMARY_AI_SERVICE_URL=http://127.0.0.1:5001
   
   # Security
   ALLOWED_ORIGINS=http://localhost:3000
   ```

5. **Start the service**
   ```bash
   npm run dev:pdf-summary
   # or
   npm run build && npm start
   ```

## 🚀 Quick Start

### 1. Health Check
```bash
curl http://localhost:3001/health
```

### 2. Upload PDF
```bash
curl -X POST http://localhost:3001/api/pdf-summary/upload \
  -F "file=@document.pdf" \
  -F "user_id=123e4567-e89b-12d3-a456-426614174000" \
  -F "auto_summarize=true"
```

### 3. Generate Summary
```bash
curl -X POST http://localhost:3001/api/pdf-summary/generate \
  -H "Content-Type: application/json" \
  -d '{
    "file_url": "https://example.com/document.pdf",
    "summary_type": "detailed",
    "max_length": 2000,
    "user_id": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

### 4. Chat with PDF
```bash
curl -X POST http://localhost:3001/api/pdf-summary/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "session-uuid-here",
    "question": "What are the main conclusions of this research?",
    "user_id": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

## 📚 API Endpoints

### Health & Monitoring
- `GET /health` - Service health check
- `GET /stats` - Service statistics

### PDF Management
- `POST /api/pdf-summary/upload` - Upload PDF file
- `POST /api/pdf-summary/generate` - Generate AI summary
- `GET /api/pdf-summary/summary/:id` - Get summary by ID

### Chat Functionality
- `POST /api/pdf-summary/chat` - Chat with PDF content
- `POST /api/pdf-summary/chat/rate` - Rate chat response quality

### User Data
- `GET /api/pdf-summary/user/:userId/summaries` - Get user summaries
- `GET /api/pdf-summary/session/:sessionId/chat-history` - Get chat history

## 🔐 Security Features

- **CORS Protection**: Configurable cross-origin resource sharing
- **Rate Limiting**: Request rate limiting to prevent abuse
- **Bot Protection**: Automated request detection and blocking
- **Input Validation**: Comprehensive request validation with Zod
- **Security Headers**: Helmet.js security headers
- **File Validation**: PDF file type and size validation

## 📊 Logging & Monitoring

The service includes comprehensive logging:

- **Request Logging**: All incoming requests with metadata
- **Performance Logging**: Response time tracking
- **Error Logging**: Detailed error tracking with stack traces
- **AI Service Logging**: AI service call monitoring
- **Database Logging**: Database operation tracking
- **Security Logging**: Security event monitoring

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suite
npm test -- --grep "PDF Summary"
```

## 🐳 Docker

```bash
# Build image
docker build -t pdf-summary-service .

# Run container
docker run -p 3001:3001 \
  -e MONGO_URI_ROADMAP_AI=mongodb://host.docker.internal:27017/pdf_summary \
  -e PDF_SUMMARY_AI_SERVICE_URL=http://host.docker.internal:5001 \
  pdf-summary-service
```

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Service port |
| `NODE_ENV` | `development` | Environment mode |
| `MONGO_URI_ROADMAP_AI` | MongoDB connection string |
| `PDF_SUMMARY_AI_SERVICE_URL` | `http://127.0.0.1:5001` | Python AI service URL |
| `LOG_LEVEL` | `info` | Logging level |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | CORS allowed origins |

### Logging Configuration

```typescript
// Customize logging in config/logging.config.ts
export const getLoggingConfig = (): LoggingConfig => ({
  level: 'info',
  enableConsole: true,
  enableFile: true,
  logDirectory: 'logs',
  maxFileSize: 5242880, // 5MB
  maxFiles: 5,
  // ... more options
});
```

## 🚨 Error Handling

The service includes comprehensive error handling:

- **Validation Errors**: Detailed validation error messages
- **AI Service Errors**: Graceful handling of AI service failures
- **Database Errors**: Database connection and query error handling
- **File Processing Errors**: PDF processing error handling
- **Rate Limiting**: Rate limit exceeded error responses

## 📈 Performance

- **Caching**: File hash-based caching to avoid reprocessing
- **Async Processing**: Non-blocking AI service calls
- **Connection Pooling**: Database connection optimization
- **Request Validation**: Early validation to prevent unnecessary processing

## 🔄 Development

### Project Structure
```
src/ai-pdf-summary/
├── controllers/          # Request/response handling
│   └── pdfSummary.controller.ts
├── models/              # Data models
│   ├── pdfSummary.model.ts
│   └── pdfChatHistory.model.ts
├── routes/              # API routes
│   └── pdfSummary.routes.ts
├── services/            # Business logic
│   └── pdfSummary.service.ts
├── validation/          # Request validation
│   └── pdfSummary.validation.ts
├── utils/               # Utilities
│   └── logger.ts
├── swagger/             # API docs
│   └── pdfSummary.swagger.ts
└── index.ts             # App entry point
```

### Adding New Features

1. **Create Model**: Define data structure in `models/`
2. **Add Validation**: Create validation schema in `validation/`
3. **Implement Service**: Add business logic in `services/`
4. **Create Controller**: Handle HTTP requests in `controllers/`
5. **Define Routes**: Add API endpoints in `routes/`
6. **Update Documentation**: Add Swagger docs in `swagger/`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the API documentation at `/api/pdf-summary/docs`

## 🔮 Roadmap

- [ ] Advanced PDF analysis features
- [ ] Multi-language support
- [ ] Real-time collaboration
- [ ] Advanced caching strategies
- [ ] Performance analytics dashboard
- [ ] Integration with external AI services
