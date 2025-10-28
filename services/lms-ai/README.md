# Vonova LMS AI Platform - NestJS Version

AI-powered learning platform with roadmap generation, PDF summarization, and more.

## 🚀 Features

- **AI Roadmap Generator**: Generate personalized learning roadmaps using AI
- **AI PDF Summary**: Intelligent PDF document summarization and chat
- **Health Monitoring**: Comprehensive health checks and system status
- **Security**: Enterprise-grade security with validation and rate limiting
- **Documentation**: Interactive API documentation with Swagger

## 🛠️ Technology Stack

- **Framework**: NestJS with TypeScript
- **Database**: MongoDB with Mongoose
- **AI Integration**: Python services via HTTP API
- **Validation**: class-validator with DTOs
- **Logging**: Winston with structured logging
- **Security**: Helmet, CORS, rate limiting, bot protection
- **Documentation**: OpenAPI/Swagger

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- MongoDB instance
- Python AI services running on ports 5000 and 5001
- Environment variables configured

## 🔧 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd nestjs-lms-ai
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   # Create .env file with your configuration
   # Copy the example below and modify as needed
   ```

   **Example .env file:**

   ```env
   PORT=4005
   NODE_ENV=development
   MONGO_URI_ROADMAP_AI=mongodb://localhost:27017/ROADMAP_AI
   ROADMAP_AI_SERVICE_URL=http://localhost:5000
   PDF_SUMMARY_AI_SERVICE_URL=http://localhost:5001
   CORS_ORIGIN=http://localhost:3000
   ALLOWED_ORIGINS=http://localhost:3000
   SWAGGER_USER=admin
   SWAGGER_PASSWORD=vonova2024
   ```

4. **Start the service**

   ```bash
   # Development
   npm run start:dev

   # Production
   npm run build
   npm run start:prod
   ```

## 🚀 Quick Start

### 1. Health Check

```bash
curl http://localhost:4005/health
```

### 2. Generate Roadmap

```bash
curl -X POST http://localhost:4005/roadmap/generate \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "React.js",
    "skill_level": "beginner",
    "duration_weeks": 12,
    "focus_areas": ["hooks", "state management"]
  }'
```

### 3. Upload PDF

```bash
curl -X POST http://localhost:4005/pdf-summary/upload \
  -F "file=@document.pdf" \
  -F "user_id=123e4567-e89b-12d3-a456-426614174000" \
  -F "auto_summarize=true"
```

### 4. Chat with PDF

```bash
curl -X POST http://localhost:4005/pdf-summary/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "session-uuid-here",
    "question": "What are the main conclusions of this research?",
    "user_id": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

## 📚 API Endpoints

### Application

- `GET /` - Application information and status

### Roadmap Management

- `POST /roadmap/generate` - Generate a new learning roadmap
- `GET /roadmap/:roadmapId/:userId` - Get roadmap by ID
- `PUT /roadmap/:roadmapId/progress/:userId` - Update roadmap progress

### PDF Summary

- `POST /pdf-summary/upload` - Upload PDF file
- `POST /pdf-summary/chat` - Chat with PDF content
- `GET /pdf-summary/summarize` - Get full PDF summary
- `GET /pdf-summary/session/:sessionId/chat-history` - Get chat history
- `POST /pdf-summary/chat/rate` - Rate chat response quality

### Health & Monitoring

- `GET /health` - General health check
- `GET /roadmap/health` - Roadmap service health
- `GET /roadmap/test-ai-connection` - Test AI service connectivity
- `GET /roadmap/system-status` - Comprehensive system status
- `GET /pdf-summary/health` - PDF summary service health
- `GET /pdf-summary/stats` - PDF summary service statistics

## 🔐 Security Features

- **CORS Protection**: Configurable cross-origin resource sharing
- **Rate Limiting**: Request rate limiting to prevent abuse
- **Bot Protection**: Automated request detection and blocking
- **Input Validation**: Comprehensive request validation with class-validator
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

# Run e2e tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch
```

## 🐳 Docker

```bash
# Build image
docker build -t lms-ai .

# Run container
docker run -p 4005:4005 \
  -e MONGO_URI_ROADMAP_AI=mongodb://host.docker.internal:27017/ROADMAP_AI \
  -e ROADMAP_AI_SERVICE_URL=http://host.docker.internal:5000 \
  -e PDF_SUMMARY_AI_SERVICE_URL=http://host.docker.internal:5001 \
  lms-ai
```

## 🔧 Configuration

### Environment Variables

| Variable                     | Default                   | Description                |
| ---------------------------- | ------------------------- | -------------------------- |
| `PORT`                       | `4005`                    | Service port               |
| `NODE_ENV`                   | `development`             | Environment mode           |
| `MONGO_URI_ROADMAP_AI`       | MongoDB connection string |
| `ROADMAP_AI_SERVICE_URL`     | `http://localhost:5000`   | Roadmap AI service URL     |
| `PDF_SUMMARY_AI_SERVICE_URL` | `http://localhost:5001`   | PDF Summary AI service URL |
| `LOG_LEVEL`                  | `info`                    | Logging level              |
| `ALLOWED_ORIGINS`            | `http://localhost:3000`   | CORS allowed origins       |

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
src/
├── app.module.ts              # Root module
├── main.ts                    # Application entry point
├── common/                    # Shared utilities
│   ├── decorators/           # Custom decorators
│   ├── filters/              # Exception filters
│   ├── guards/               # Authentication guards
│   ├── interceptors/         # Request/response interceptors
│   ├── middleware/           # Custom middleware
│   └── utils/                # Utility functions
├── config/                   # Configuration files
├── database/                 # Database setup
│   ├── schemas/             # Mongoose schemas
│   └── repositories/        # Data access layer
├── roadmap/                 # Roadmap module
│   ├── dto/                 # Data transfer objects
│   ├── interfaces/          # TypeScript interfaces
│   ├── roadmap.controller.ts
│   ├── roadmap.service.ts
│   └── roadmap.module.ts
├── pdf-summary/             # PDF Summary module
│   ├── dto/                 # Data transfer objects
│   ├── interfaces/          # TypeScript interfaces
│   ├── pdf-summary.controller.ts
│   ├── pdf-summary.service.ts
│   └── pdf-summary.module.ts
└── health/                  # Health check module
    ├── health.controller.ts
    ├── health.service.ts
    └── health.module.ts
```

### Adding New Features

1. **Create Module**: Define module structure
2. **Add DTOs**: Create validation schemas with class-validator
3. **Implement Service**: Add business logic with dependency injection
4. **Create Controller**: Handle HTTP requests with decorators
5. **Update Documentation**: Add Swagger docs
6. **Add Tests**: Write unit and integration tests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the API documentation at `/api-docs`

## 🔮 Roadmap

- [ ] Advanced PDF analysis features
- [ ] Multi-language support
- [ ] Real-time collaboration
- [ ] Advanced caching strategies
- [ ] Performance analytics dashboard
- [ ] Integration with external AI services
