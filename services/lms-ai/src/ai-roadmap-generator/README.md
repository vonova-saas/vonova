# AI Roadmap Generator

This module provides AI-powered learning roadmap generation capabilities for the Vonova LMS platform.

## Features

- 🚀 **AI-Powered Generation**: Uses advanced AI models to create personalized learning roadmaps
- 📊 **Progress Tracking**: Monitor learning progress and milestone achievements
- 📈 **Analytics**: Get insights into popular topics and completion rates
- 🔒 **Security**: Enterprise-grade security with validation and rate limiting
- 📱 **RESTful API**: Clean, documented REST API with comprehensive validation

## API Endpoints

### Roadmap Management
- `POST /api/roadmap/generate` - Generate a new learning roadmap
- `GET /api/roadmap/:roadmapId` - Get roadmap by ID
- `PUT /api/roadmap/:roadmapId/progress` - Update roadmap progress

### Health & Monitoring
- `GET /api/roadmap/health` - Health check
- `GET /api/roadmap/test-ai-connection` - Test AI service connectivity
- `GET /api/roadmap/system-status` - Comprehensive system status

## Usage Example

```javascript
// Generate a roadmap
const response = await fetch('/api/roadmap/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    topic: 'React.js',
    skill_level: 'beginner',
    duration_weeks: 12,
    focus_areas: ['hooks', 'state management'],
    user_id: 'user-uuid'
  })
});

const roadmap = await response.json();
console.log(roadmap.data.roadmapId);
```

## Architecture

### Models
- `roadmap.model.ts` - Main roadmap data structure
- `roadmapHistory.model.ts` - Progress tracking and analytics

### Services
- `roadmapGenerator.service.ts` - Core business logic and AI integration

### Controllers
- `roadmap.controller.ts` - HTTP request handlers with validation

### Routes
- `roadmap.route.ts` - Express routes with middleware protection

### Validation
- `roadmap.validation.ts` - Zod schemas for request/response validation

## Dependencies

- **mongoose**: MongoDB object modeling
- **zod**: TypeScript-first schema validation
- **uuid**: UUID generation for roadmap IDs
- **express**: Web framework
- **swagger**: API documentation

## Environment Variables

```env
# Python AI Service
ROADMAP_AI_SERVICE_URL=http://localhost:5000

# MongoDB
MONGO_URI_ROADMAP_AI=mongodb://...

# Security
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_MAX_REQUESTS=100
```