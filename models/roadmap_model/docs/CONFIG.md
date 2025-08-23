# Roadmap AI Service Configuration

This document describes all configuration options for the Roadmap AI service, including environment variables, deployment scenarios, and examples.

## Environment Variables

### Core AI Service Configuration
- **COHERE_API_KEY**: Your Cohere API key (required for AI roadmap generation)
  - **Required**: Yes
  - **Example**: `your_cohere_api_key_here`
  - **Description**: API key from Cohere for AI text generation

### Server Configuration
- **AI_SERVICE_PORT**: Port number for the FastAPI service
  - **Default**: `5000`
  - **Example**: `5000`
  - **Description**: Port where the AI service will listen for requests

- **AI_SERVICE_HOST**: Host address for the service
  - **Default**: `127.0.0.1`
  - **Example**: `127.0.0.1` (local), `0.0.0.0` (all interfaces)
  - **Description**: Host address to bind the service to

### Logging Configuration
- **LOG_LEVEL**: Logging verbosity level
  - **Default**: `INFO`
  - **Options**: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`
  - **Description**: Controls the amount of logging output

- **LOG_FILE**: Log file path
  - **Default**: `roadmap_ai.log`
  - **Example**: `logs/roadmap_ai.log`
  - **Description**: File where logs will be written

- **ENABLE_FILE_LOGGING**: Enable logging to file
  - **Default**: `true`
  - **Options**: `true`, `false`
  - **Description**: Whether to write logs to a file

- **ENABLE_CONSOLE_LOGGING**: Enable console logging
  - **Default**: `true`
  - **Options**: `true`, `false`
  - **Description**: Whether to display logs in console

### CORS Configuration
- **CORS_ORIGINS**: Allowed origins for cross-origin requests
  - **Default**: `*` (all origins)
  - **Example**: `http://localhost:3000,https://yourdomain.com`
  - **Description**: Comma-separated list of allowed origins

- **CORS_ALLOW_CREDENTIALS**: Allow credentials in CORS requests
  - **Default**: `true`
  - **Options**: `true`, `false`
  - **Description**: Whether to allow credentials in cross-origin requests

- **CORS_ALLOW_METHODS**: Allowed HTTP methods
  - **Default**: `*` (all methods)
  - **Example**: `GET,POST,PUT,DELETE`
  - **Description**: Comma-separated list of allowed HTTP methods

- **CORS_ALLOW_HEADERS**: Allowed HTTP headers
  - **Default**: `*` (all headers)
  - **Example**: `Content-Type,Authorization`
  - **Description**: Comma-separated list of allowed headers

### Development Settings
- **ENVIRONMENT**: Environment mode
  - **Default**: `development`
  - **Options**: `development`, `production`, `staging`
  - **Description**: Current environment mode

- **RELOAD**: Auto-reload for development
  - **Default**: `true`
  - **Options**: `true`, `false`
  - **Description**: Whether to auto-reload on code changes (development only)

## API Endpoints

### Root Endpoint
- **GET /** - Service information and available endpoints

### Health Check
- **GET /health** - Service health status

### Documentation
- **GET /docs** - Interactive API documentation (Swagger UI)
- **GET /redoc** - Alternative API documentation

### Roadmap Generation
- **POST /generate-roadmap** - Generate AI-powered learning roadmap

## Example Usage

### Start the service:
```bash
cd models/roadmap_model
python main.py api
```

### Test endpoints:
```bash
# Service info
curl http://localhost:5000/

# Health check
curl http://localhost:5000/health

# Generate roadmap
curl -X POST http://localhost:5000/generate-roadmap \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "frontend",
    "skill_level": "beginner",
    "duration_weeks": 12
  }'
```

## Deployment Scenarios

### Local Development
```env
# Core Configuration
COHERE_API_KEY=your_cohere_api_key_here
AI_SERVICE_PORT=5000
AI_SERVICE_HOST=127.0.0.1

# Development Settings
ENVIRONMENT=development
LOG_LEVEL=DEBUG
RELOAD=true

# CORS for local frontend
CORS_ORIGINS=http://localhost:3000
```

### Production Deployment
```env
# Core Configuration
COHERE_API_KEY=your_production_cohere_key
AI_SERVICE_PORT=5000
AI_SERVICE_HOST=0.0.0.0

# Production Settings
ENVIRONMENT=production
LOG_LEVEL=INFO
RELOAD=false

# CORS for production domains
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
CORS_ALLOW_CREDENTIALS=true
```

### Docker Container
```env
# Core Configuration
COHERE_API_KEY=your_cohere_api_key
AI_SERVICE_PORT=5000
AI_SERVICE_HOST=0.0.0.0

# Container Settings
ENVIRONMENT=production
LOG_LEVEL=INFO
LOG_FILE=/app/logs/roadmap_ai.log

# CORS for container networking
CORS_ORIGINS=*
```

### Microservices/Kubernetes
```env
# Core Configuration
COHERE_API_KEY=your_cohere_api_key
AI_SERVICE_PORT=5000
AI_SERVICE_HOST=0.0.0.0

# Service mesh settings
ENVIRONMENT=production
LOG_LEVEL=INFO
ENABLE_CONSOLE_LOGGING=true
ENABLE_FILE_LOGGING=false

# Internal service communication
CORS_ORIGINS=http://backend-service:4005
```
