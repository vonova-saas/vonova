# 🚀 Quick Start Guide - AI Roadmap Generator

This guide will help you quickly set up and test the communication between your AI service (port 5000) and backend service (port 4005).

## ⚡ Quick Setup (5 minutes)

### 1. Environment Configuration

Create `.env` files in both locations:

#### Backend Environment (`services/lms-ai/.env`)
```env
# Backend Configuration
PORT=4005
NODE_ENV=development
BASE_PATH=/api
ROADMAP_AI_SERVICE_URL=http://localhost:5000

# Database (Replace with your MongoDB connection)
MONGO_URI_ROADMAP_AI=mongodb://localhost:27017/ROADMAP_AI

# Security
CORS_ORIGIN=http://localhost:3000
SWAGGER_USER=admin
SWAGGER_PASSWORD=vonova2024
```

#### AI Service Environment (`models/roadmap_model/.env`)
```env
# AI Service Configuration
AI_SERVICE_PORT=5000
AI_SERVICE_HOST=127.0.0.1

# Cohere API (Replace with your API key)
COHERE_API_KEY=your_cohere_api_key_here

# Logging
LOG_LEVEL=INFO
```

### 2. Start Services

#### Terminal 1: Start AI Service (Port 5000)
```bash
cd models/roadmap_model
python main.py
```

#### Terminal 2: Start Backend Service (Port 4005)
```bash
cd services/lms-ai
bun run dev
```

### 3. Test Communication
```bash
cd services/lms-ai
node test-communication.js
```

## 🔧 Service URLs

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **Backend** | 4005 | `http://localhost:4005` | Main API service |
| **AI Service** | 5000 | `http://localhost:5000` | AI roadmap generation |
| **Frontend** | 3000 | `http://localhost:3000` | User interface |

## 🧪 Quick Tests

### Health Checks
```bash
# AI Service Health
curl http://localhost:5000/health

# Backend Service Health  
curl http://localhost:4005/api/roadmap/health

# Communication Test
curl http://localhost:4005/api/roadmap/test-ai-connection
```

### Generate Test Roadmap
```bash
curl -X POST http://localhost:4005/api/roadmap/generate \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "React.js",
    "skill_level": "beginner", 
    "duration_weeks": 8,
    "focus_areas": ["components", "hooks"]
  }'
```

## 📊 API Documentation

Once both services are running, access the interactive API documentation:
- **Swagger Docs**: `http://localhost:4005/api-docs`
- **Username**: `admin` (or your SWAGGER_USER)
- **Password**: `vonova2024` (or your SWAGGER_PASSWORD)

## 🔗 Communication Flow

```
Frontend Request
       ↓
Backend (Port 4005)
   ├── Validates request
   ├── Applies security middleware
   └── Calls AI Service
       ↓
AI Service (Port 5000)
   ├── Processes with Cohere API
   └── Returns structured roadmap
       ↓
Backend
   ├── Saves to MongoDB
   ├── Formats response
   └── Returns to Frontend
```

## 🎯 Available Endpoints

### Roadmap Management
- `POST /api/roadmap/generate` - Generate new roadmap
- `GET /api/roadmap/:roadmapId` - Get roadmap by ID
- `PUT /api/roadmap/:roadmapId/progress` - Update progress

### Health & Testing
- `GET /api/roadmap/health` - Backend health
- `GET /api/roadmap/test-ai-connection` - Test AI connectivity
- `GET /api/roadmap/system-status` - Full system status

## 🛠️ Troubleshooting

### Common Issues

#### ❌ "Connection refused" 
**Problem**: Backend can't reach AI service
**Solution**: 
1. Verify AI service is running: `curl http://localhost:5000/health`
2. Check if port 5000 is available: `netstat -an | findstr :5000`

#### ❌ "Port already in use"
**Problem**: Port 4005 or 5000 is occupied
**Solution**:
```bash
# Windows - Find and kill process
netstat -ano | findstr :4005
taskkill /PID <PID> /F

# Linux/Mac - Find and kill process  
lsof -i :4005
kill -9 <PID>
```

#### ❌ "Validation failed"
**Problem**: Request format is incorrect
**Solution**: Check the API documentation at `http://localhost:4005/api-docs`

## 🎉 Success Indicators

When everything is working correctly, you should see:

### ✅ AI Service Running
```json
{
  "status": "healthy",
  "service": "roadmap-ai"
}
```

### ✅ Backend Service Running
```json
{
  "success": true,
  "data": {
    "service": "roadmap-generator",
    "status": "healthy"
  }
}
```

### ✅ Communication Working
```json
{
  "success": true,
  "message": "AI service connection successful",
  "data": {
    "communication": {
      "status": "connected",
      "latency_ms": 45
    }
  }
}
```

## 🚀 Next Steps

1. **Frontend Integration**: Connect your frontend to `http://localhost:4005/api`
2. **Authentication**: Implement JWT authentication for user-specific roadmaps
3. **Production**: Configure for production deployment with proper security
4. **Monitoring**: Set up logging and monitoring for both services

## 💡 Pro Tips

- Use the `test-communication.js` script for automated testing
- Monitor both services with the system status endpoint
- Check the Swagger documentation for detailed API usage
- The AI service includes fallback generation if Cohere API fails
