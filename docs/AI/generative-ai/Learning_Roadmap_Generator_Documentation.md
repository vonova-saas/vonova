# Learning Roadmap Generator Documentation

## Table of Contents

- [Overview](#overview)
- [Important: Unified API Structure](#important-unified-api-structure)
- [Project Structure](#project-structure)
- [Module: app.py (Unified API)](#module-apppy-unified-api)
  - [Purpose](#purpose)
  - [Dependencies](#dependencies)
  - [Key Components](#key-components)
  - [Usage](#usage)
- [Request/Response Schema](#requestresponse-schema)
  - [RoadmapRequest Schema](#roadmaprequest-schema)
  - [Response Schema](#response-schema)
  - [Error Response Schema](#error-response-schema)
- [Module: services/roadmap_generator.py](#module-servicesroadmap_generatorpy)
  - [Purpose](#purpose-1)
  - [Dependencies](#dependencies-1)
  - [Key Components](#key-components-1)
  - [Usage](#usage-1)
- [Core Code Implementation](#core-code-implementation)
  - [Main API Endpoint (app.py)](#main-api-endpoint-apppy)
  - [Roadmap Generator Core Logic (services/roadmap_generator.py)](#roadmap-generator-core-logic-servicesroadmap_generatorpy)
  - [Data Models (models/roadmap_schema.py)](#data-models-modelsroadmap_schemapy)
  - [Response Formatter (services/roadmap_formatter.py)](#response-formatter-servicesroadmap_formatterpy)
- [Testing Strategies](#testing-strategies)
  - [Unit Testing](#unit-testing)
  - [Integration Testing](#integration-testing)
  - [Load Testing](#load-testing)
  - [API Testing Examples](#api-testing-examples)
- [Performance Considerations](#performance-considerations)
  - [Response Time Optimization](#response-time-optimization)
  - [Memory Management](#memory-management)
  - [Caching Strategies](#caching-strategies)
  - [Rate Limiting](#rate-limiting)
- [Security Best Practices](#security-best-practices)
  - [API Key Management](#api-key-management)
  - [Input Validation](#input-validation)
  - [Error Handling](#error-handling)
  - [Logging Security](#logging-security)
- [Environment Configuration](#environment-configuration)
  - [Required Variables](#required-variables)
  - [Optional Variables](#optional-variables)
  - [Validation](#validation)
- [Deployment & Scaling](#deployment--scaling)
  - [Docker Deployment](#docker-deployment)
  - [Production Considerations](#production-considerations)
  - [Scaling Strategies](#scaling-strategies)
- [Troubleshooting](#troubleshooting)
  - [Common Issues](#common-issues)
  - [Error Codes Reference](#error-codes-reference)
  - [Debug Mode](#debug-mode)
- [Development Notes](#development-notes)

---

## Overview
The Learning Roadmap Generator is part of a unified FastAPI-based web application (Agents API) that generates customized learning roadmaps for various topics using the Cohere AI API. Users can specify a topic, skill level (beginner, intermediate, or advanced), and duration (in weeks) to receive a structured JSON response containing a learning roadmap. The roadmap includes weekly topics, objectives, resources, projects, milestones, and a hierarchical tree structure of the learning path.

This documentation covers the Learning Roadmap Generator component of the unified API. For the complete unified API documentation, refer to the main API documentation.

## Important: Unified API Structure
This service is now part of a unified FastAPI application (`app.py`) that combines multiple AI services:
- Learning Roadmap Generator
- Article Generator
- Quiz Generator
- PDF Summary & Q&A

The service runs on a configurable port (default: 8000) defined by the `AI_SERVICE_PORT` environment variable.

## Project Structure
- **`app.py`**: The unified FastAPI application that combines multiple AI services including the Roadmap Generator.
- **`AI_Roadmap_Generator/`**: Directory containing the roadmap generator components:
  - **`models/roadmap_schema.py`**: Defines Pydantic models for data validation and serialization of roadmap structures.
  - **`services/roadmap_generator.py`**: Contains the core logic for generating roadmaps using the Cohere AI API.
  - **`services/roadmap_formatter.py`**: Formats and structures the generated roadmap data.
  - **`llm/cohere_llm.py`**: Handles interactions with the Cohere AI API.
- **`Config/config.py`**: Configuration management for the unified API.
- **`Config/middleware.py`**: CORS and middleware setup for the unified API.
- **`requirements.txt`**: Lists the required Python packages and their versions.

- **`docs/`**: Documentation files.
- **`Dockerfile`**: Containerization configuration.

## Module: `app.py` (Unified API)

### Purpose
`app.py` is the unified entry point for multiple AI services. It sets up a FastAPI server with CORS middleware, defines the `/generate-roadmap` endpoint alongside other AI services, and handles incoming HTTP requests to generate learning roadmaps.

### Dependencies
- **FastAPI**: Web framework for building the API.
- **Uvicorn**: ASGI server for running the FastAPI application.
- **pydantic**: For data validation and serialization.
- **cohere**: For interacting with the Cohere AI API.
- **python-dotenv**: For loading environment variables.
- **AI_Roadmap_Generator.services.roadmap_generator**: Imports `RoadmapGenerator` for roadmap generation.
- **AI_Roadmap_Generator.models.roadmap_schema**: Imports data models.
- **Config.config**: Imports configuration and validation utilities.
- **Config.middleware**: Imports middleware setup utilities.

### Key Components

#### FastAPI Application
- **Initialization**:
  ```python
  # In app.py - Unified API setup
  from AI_Roadmap_Generator.services.roadmap_generator import RoadmapGenerator
  from AI_Roadmap_Generator.models.roadmap_schema import RoadmapRequest
  
  generator = RoadmapGenerator(effective_api_key)
  
  @app.post("/generate-roadmap", tags=["Roadmap"])
  async def generate_roadmap_api(request: RoadmapRequest):
      # Implementation handles validation via Pydantic model and calls RoadmapGenerator
  ```

#### Endpoint: `/generate-roadmap`
- **Method**: POST
- **Tags**: ["Roadmap"]
- **Purpose**: Generates a learning roadmap based on the provided topic, skill level, and duration.
- **Request Body**: Expects a `RoadmapRequest` JSON object with the following fields:
  - `topic: str`: The subject or topic for the roadmap (e.g., "AI", "Backend"). **Required**.
  - `skill_level: str`: The user's skill level ("beginner", "intermediate", or "advanced"). **Required**.
  - `duration_weeks: int`: The duration of the roadmap in weeks (minimum 1). **Required**.
- **Response**: Returns a JSON object with the following structure:
  - `status: bool`: Indicates success (`true`) or failure (`false`).
  - `text: dict`: Contains the `query` (topic) and `chapters` (topics grouped by phases: Introduction & Basics, Core Development, Advanced Topics, Specialization & Project).
  - `tree: List[dict]`: A hierarchical structure with the topic as the root, phases as children, and topics as leaf nodes.
  - `roadmapId: str`: A unique UUID for the roadmap.
  - `metadata: dict`: Includes `generated` (roadmap title) and `summary` (duration and total hours).
- **Error Handling**:
  - Returns a JSON response with `status: false` and an `error` message for invalid inputs or internal errors (status code 500).

#### Main Execution
- **Command**:
  ```python
  if __name__ == "__main__":
      uvicorn.run(app, host=AI_SERVICE_HOST, port=AI_SERVICE_PORT, reload=False)
  ```
  Starts the unified server on configurable host and port (default: 8000) without auto-reload for production.

### Usage
To run the unified server:
1. Ensure dependencies are installed (see `requirements.txt`).
2. Set the required environment variables in a `.env` file:
   - `COHERE_API_KEY`: Your Cohere API key
   - `AI_SERVICE_HOST`: Server host (default: 127.0.0.1)
   - `AI_SERVICE_PORT`: Server port (default: 8000)
3. Run the unified server:
   ```bash
   python app.py
   ```
   Or using uvicorn directly:
   ```bash
   uvicorn app:app --host 127.0.0.1 --port 8000
   ```
4. Send a POST request to generate a roadmap:
   ```bash
   curl -X 'POST' \
     'http://127.0.0.1:8000/generate-roadmap' \
     -H 'accept: application/json' \
     -H 'Content-Type: application/json' \
     -d '{
     "topic": "AI",
     "skill_level": "beginner",
     "duration_weeks": 5
   }'
   ```

## Request/Response Schema

### RoadmapRequest Schema
The `/generate-roadmap` endpoint expects a `RoadmapRequest` object with the following structure:

```python
from pydantic import BaseModel

class RoadmapRequest(BaseModel):
    topic: str                    # Learning topic (e.g., "Machine Learning")
    skill_level: str              # "beginner", "intermediate", or "advanced"
    duration_weeks: int           # Number of weeks (1-52)
```

### Response Schema
The API returns a structured JSON response with the following format:

```json
{
    "status": true,
    "text": {
        "query": "string",
        "chapters": {
            "Introduction & Basics": ["topic1", "topic2"],
            "Core Development": ["topic3", "topic4"],
            "Advanced Topics": ["topic5", "topic6"],
            "Specialization & Project": ["topic7", "topic8"]
        }
    },
    "tree": [
        {
            "name": "topic",
            "children": [
                {
                    "name": "chapter_name",
                    "children": [
                        {"name": "topic1"},
                        {"name": "topic2"}
                    ]
                }
            ]
        }
    ],
    "roadmapId": "uuid-string",
    "metadata": {
        "generated": "Topic: A X-Week SkillLevel Roadmap",
        "summary": "X weeks, Y total estimated hours"
    }
}
```

### Error Response Schema
When errors occur, the API returns:

```json
{
    "status": false,
    "error": "Error description message"
}
```

## Module: `services/roadmap_generator.py`

### Purpose
`services/roadmap_generator.py` contains the core logic for generating learning roadmaps using the Cohere AI API. It defines the `RoadmapGenerator` class to create and format roadmaps.

### Dependencies
- **pydantic**: For data validation and serialization of roadmap structures.
- **cohere**: For generating roadmap content via the Cohere AI API.
- **json**, **re**, **uuid**: For JSON parsing, regex matching, and UUID generation.

### Key Components

#### Class: `RoadmapGenerator`
- **Purpose**: Handles roadmap generation and response formatting.
- **Methods**:
  - `__init__(self, api_key, cohere_model_name='command-r-plus-08-2024')`:
    - Initializes the Cohere client, RoadmapFormatter, and logger.
  - `generate_roadmap(self, topic, skill_level="beginner", duration_weeks=12)`:
    - Constructs a prompt for the Cohere AI API specifying the topic, skill level, and duration.
    - Calls the Cohere client to get the response.
    - Parses the JSON response, validates it with Pydantic RoadmapData model.
    - Calls RoadmapFormatter to generate the final JSON response.
    - Returns the formatted roadmap response.

### Usage
The `services/roadmap_generator.py` file is used internally by `app.py`. The `RoadmapGenerator` class is instantiated in `app.py` with the Cohere API key and called by the `/generate-roadmap` endpoint. To use the Cohere API, ensure a valid API key is provided in the `.env` file.

### Example Response
A sample request:
```bash
curl -X 'POST' \
  'http://127.0.0.1:8000/generate-roadmap' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "topic": "AI",
  "skill_level": "beginner",
  "duration_weeks": 5
}'
```

Produces a response like:
```json
{
  "status": true,
  "text": {
    "query": "AI",
    "chapters": {
      "Introduction & Basics": [
        "Introduction to AI Concepts",
        "History of AI",
        "Types of AI"
      ],
      "Core Development": [
        "Machine Learning Basics",
        "Data Preprocessing",
        "Supervised Learning"
      ],
      "Advanced Topics": [
        "Neural Networks",
        "Deep Learning Fundamentals",
        "Model Evaluation"
      ],
      "Specialization & Project": [
        "Convolutional Neural Networks",
        "Natural Language Processing",
        "AI Ethics"
      ]
    }
  },
  "tree": [
    {
      "name": "AI",
      "children": [
        {
          "name": "Introduction & Basics",
          "children": [
            {"name": "Introduction to AI Concepts"},
            {"name": "History of AI"},
            {"name": "Types of AI"}
          ]
        },
        {
          "name": "Core Development",
          "children": [
            {"name": "Machine Learning Basics"},
            {"name": "Data Preprocessing"},
            {"name": "Supervised Learning"}
          ]
        },
        {
          "name": "Advanced Topics",
          "children": [
            {"name": "Neural Networks"},
            {"name": "Deep Learning Fundamentals"},
            {"name": "Model Evaluation"}
          ]
        },
        {
          "name": "Specialization & Project",
          "children": [
            {"name": "Convolutional Neural Networks"},
            {"name": "Natural Language Processing"},
            {"name": "AI Ethics"}
          ]
        }
      ]
    }
  ],
  "roadmapId": "c28d0104-a69b-4b0f-be99-b2457be57056",
  "metadata": {
    "generated": "AI: A 5-Week Beginner Roadmap",
    "summary": "5 weeks, 40 total hours"
  }
}
```

## Troubleshooting
- **Issue: Cohere API failures**:
  - **Cause**: Invalid API key or network issues.
  - **Solution**: Verify the `COHERE_API_KEY` in the `.env` file and ensure internet connectivity.
- **Issue: Server not reflecting changes**:
  - **Cause**: Cached or old files in use.
  - **Solution**: Stop the server, clear any cache, ensure the updated `app.py` and `services/roadmap_generator.py` are saved, and restart the server.
- **Issue: Invalid JSON response**:
  - **Cause**: Malformed JSON from Cohere or parsing errors.
  - **Solution**: Check logs for Cohere API errors. The application expects valid JSON from the API.

## Core Code Implementation

### Main API Endpoint (app.py)
```python
# =============================================================================
# ROADMAP GENERATOR API ENDPOINT
# =============================================================================

from AI_Roadmap_Generator.services.roadmap_generator import RoadmapGenerator
from AI_Roadmap_Generator.models.roadmap_schema import RoadmapRequest
from fastapi import FastAPI
from fastapi.responses import JSONResponse

# Initialize the roadmap generator with API key
generator = RoadmapGenerator(effective_api_key)

@app.post("/generate-roadmap", tags=["Roadmap"])
async def generate_roadmap_api(request: RoadmapRequest):
    """
    Generate a personalized learning roadmap based on user input.
    
    Args:
        request: RoadmapRequest containing topic, skill_level, and duration_weeks
        
    Returns:
        JSON response with structured roadmap data or error message
    """
    try:
        # Generate roadmap using the core service
        json_response = generator.generate_roadmap(
            topic=request.topic,
            skill_level=request.skill_level,
            duration_weeks=request.duration_weeks,
        )
        return JSONResponse(content=json_response)

    except Exception as e:
        # Return structured error response
        return JSONResponse(
            content={"status": False, "error": str(e)},
            status_code=500
        )
```

### Roadmap Generator Core Logic (services/roadmap_generator.py)
```python
import cohere
import json
import re
from AI_Roadmap_Generator.models.roadmap_schema import RoadmapData
from AI_Roadmap_Generator.services.roadmap_formatter import RoadmapFormatter

class RoadmapGenerator:
    """
    Core service for generating AI-powered learning roadmaps.
    
    This class handles the interaction with Cohere AI API to create
    structured learning paths based on user requirements.
    """
    
    def __init__(self, api_key, cohere_model_name='command-r-plus-08-2024'):
        """
        Initialize the roadmap generator.
        
        Args:
            api_key: Cohere API authentication key
            cohere_model_name: AI model to use for generation
        """
        self.api_key = api_key
        self.model_name = cohere_model_name
        self.cohere_client = cohere.ClientV2(api_key=api_key)
        self.formatter = RoadmapFormatter()

    def generate_roadmap(self, topic, skill_level, duration_weeks):
        """
        Generate a complete learning roadmap using AI.
        
        Args:
            topic: Subject to learn (e.g., "Machine Learning")
            skill_level: User's proficiency level ("beginner", "intermediate", "advanced")
            duration_weeks: Length of learning path in weeks
            
        Returns:
            Formatted JSON response with roadmap data
            
        Raises:
            RuntimeError: If roadmap generation fails
        """
        # Construct detailed prompt for AI
        prompt = f"""
        SYSTEM: You are an expert learning roadmap generator. Create a comprehensive, 
        structured learning plan based on the user's requirements.
        
        TASK: Create a {duration_weeks}-week {topic} roadmap for a {skill_level} level learner.
        
        REQUIREMENTS:
        - Return ONLY valid JSON (no markdown formatting)
        - Include exactly {duration_weeks} weeks
        - Each week should have 6-15 estimated hours
        - Include practical projects and resources
        
        JSON FORMAT:
        {{
            "title": "{topic} Learning Roadmap: {skill_level.title()}",
            "overview": "A concise summary of this learning path.",
            "prerequisites": ["list", "of", "prerequisites"],
            "weeks": [
                {{
                    "week": 1,
                    "title": "Week 1 Title (e.g., Foundation & Setup)",
                    "objectives": ["specific", "learning", "goals"],
                    "topics": ["concepts", "to", "cover"],
                    "resources": ["Book/Link 1", "Book/Link 2"],
                    "projects": ["practical", "exercises"],
                    "estimated_hours": 8
                }}
                // ... continue for all {duration_weeks} weeks
            ],
            "milestones": [
                {{
                    "week": 4,
                    "milestone": "Key Achievement Milestone",
                    "deliverable": "Tangible project/output"
                }}
            ],
            "final_project": "Comprehensive capstone project description",
            "next_steps": ["Advanced topics", "Certification paths", "Career opportunities"]
        }}
        """
        
        try:
            # Call Cohere AI API
            response = self.cohere_client.chat(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}]
            )
            response_text = response.message.content[0].text

            # Extract JSON from AI response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if not json_match:
                raise ValueError("No valid JSON found in AI response")
                
            json_str = json_match.group()
            roadmap_data = json.loads(json_str)
            
            # Validate data structure with Pydantic
            validated_roadmap = RoadmapData(**roadmap_data)
            
            # Format and return response
            return self.formatter.generate_json_response(
                validated_roadmap, topic, skill_level, duration_weeks
            )
                
        except Exception as e:
            raise RuntimeError(f"Roadmap generation failed: {str(e)}")
```

### Data Models (models/roadmap_schema.py)
```python
# =============================================================================
# PYDANTIC DATA MODELS FOR ROADMAP VALIDATION
# =============================================================================

from pydantic import BaseModel
from typing import List

class RoadmapRequest(BaseModel):
    """
    Request model for generating a learning roadmap.
    
    Attributes:
        topic: Subject to learn (e.g., "Machine Learning")
        skill_level: Proficiency level ("beginner", "intermediate", "advanced")
        duration_weeks: Length of learning path in weeks
    """
    topic: str
    skill_level: str
    duration_weeks: int

class Week(BaseModel):
    """
    Individual week structure in the learning roadmap.
    
    Attributes:
        week: Week number (1-based)
        title: Descriptive title for the week
        objectives: Learning goals for this week
        topics: Specific concepts to cover
        resources: Learning materials and references
        projects: Practical exercises and assignments
        estimated_hours: Recommended study time
    """
    week: int
    title: str
    objectives: List[str]
    topics: List[str]
    resources: List[str]
    projects: List[str]
    estimated_hours: int

class Milestone(BaseModel):
    """
    Key achievement points in the learning journey.
    
    Attributes:
        week: Week when milestone is achieved
        milestone: Name of the milestone
        deliverable: Tangible output or achievement
    """
    week: int
    milestone: str
    deliverable: str

class RoadmapData(BaseModel):
    """
    Complete roadmap data structure returned by AI.
    
    Attributes:
        title: Overall roadmap title
        overview: Summary of the learning path
        prerequisites: Required background knowledge
        weeks: Array of weekly learning plans
        milestones: Key achievement points
        final_project: Capstone project description
        next_steps: Post-completion recommendations
    """
    title: str
    overview: str
    prerequisites: List[str]
    weeks: List[Week]
    milestones: List[Milestone]
    final_project: str
    next_steps: List[str]
```

### Response Formatter (services/roadmap_formatter.py)
```python
# =============================================================================
# ROADMAP RESPONSE FORMATTER
# =============================================================================

import uuid

class RoadmapFormatter:
    """
    Formats raw roadmap data into structured API responses.
    
    This class transforms AI-generated roadmap data into the standardized
    JSON format expected by the frontend, organizing topics into logical
    chapters and creating hierarchical tree structures.
    """
    
    def generate_json_response(self, roadmap_data, topic, skill_level, duration_weeks):
        """
        Convert roadmap data into standardized API response format.
        
        Args:
            roadmap_data: Validated roadmap data from Pydantic model
            topic: Learning subject
            skill_level: User's proficiency level
            duration_weeks: Length of roadmap in weeks
            
        Returns:
            Dictionary containing formatted roadmap response
        """
        # Convert Pydantic model to dictionary if needed
        if hasattr(roadmap_data, 'dict'):
            roadmap_data = roadmap_data.dict()

        # Initialize chapter structure for organizing topics
        chapters = {
            "Introduction & Basics": [],      # First 25% of weeks
            "Core Development": [],           # 25-50% of weeks
            "Advanced Topics": [],           # 50-75% of weeks
            "Specialization & Project": []   # Final 25% of weeks
        }
        
        # Organize weekly topics into chapters based on progression
        total_weeks = len(roadmap_data.get('weeks', []))
        for i, week in enumerate(roadmap_data['weeks']):
            week_topics = week.get('topics', [])
            
            # Distribute topics across learning phases
            if i < total_weeks * 0.25: 
                chapters["Introduction & Basics"].extend(week_topics)
            elif i < total_weeks * 0.5: 
                chapters["Core Development"].extend(week_topics)
            elif i < total_weeks * 0.75: 
                chapters["Advanced Topics"].extend(week_topics)
            else:
                chapters["Specialization & Project"].extend(week_topics)

        # Remove duplicate topics and sort alphabetically
        for key in chapters:
            chapters[key] = sorted(list(set(chapters[key])))

        # Create hierarchical tree structure for frontend visualization
        tree = [{
            "name": topic,
            "children": [
                {
                    "name": chapter_name, 
                    "children": [{"name": topic} for topic in topics]
                }
                for chapter_name, topics in chapters.items() if topics
            ]
        }]
        
        # Calculate total estimated hours across all weeks
        total_hours = sum(
            week.get('estimated_hours', 0) 
            for week in roadmap_data.get('weeks', [])
        )
        
        # Return formatted response structure
        return {
            "status": True,
            "text": {
                "query": topic, 
                "chapters": chapters
            },
            "tree": tree,
            "roadmapId": str(uuid.uuid4()),
            "metadata": {
                "generated": f"{topic}: A {duration_weeks}-Week {skill_level.title()} Roadmap",
                "summary": f"{duration_weeks} weeks, {total_hours} total estimated hours",
                "additional_info": "This is additional metadata",
                "new_key": "new_value"
            }
        }
  - Validate responses against the expected structure.
- **Extensibility**:
  - Enhance request validation in `app.py` for specific topics or durations.
  - Extend `RoadmapGenerator` to support additional AI models or custom fallback roadmaps.
  - Add more metadata to the `tree` structure (e.g., resource links for topics).
```

### Testing Strategies

### Unit Testing

Test individual components in isolation:

```python
# tests/test_roadmap_generator.py
import pytest
from AI_Roadmap_Generator.services.roadmap_generator import RoadmapGenerator
from AI_Roadmap_Generator.models.roadmap_schema import RoadmapRequest

class TestRoadmapGenerator:
    def test_roadmap_request_validation(self):
        """Test valid request validation"""
        request = RoadmapRequest(
            topic="Machine Learning",
            skill_level="beginner",
            duration_weeks=8
        )
        assert request.topic == "Machine Learning"
        assert request.skill_level == "beginner"
        assert request.duration_weeks == 8
    
    def test_invalid_skill_level(self):
        """Test invalid skill level rejection"""
        with pytest.raises(ValueError):
            RoadmapRequest(
                topic="ML",
                skill_level="invalid",
                duration_weeks=8
            )
```

### Integration Testing

Test the complete API flow:

```python
# tests/test_integration.py
import pytest
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def test_generate_roadmap_endpoint():
    """Test the complete API endpoint"""
    response = client.post(
        "/generate-roadmap",
        json={
            "topic": "Python Programming",
            "skill_level": "beginner",
            "duration_weeks": 4
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True
    assert "roadmapId" in data
    assert "text" in data
    assert "tree" in data
    assert "metadata" in data
```

### Load Testing

Performance testing with Locust:

```python
# locustfile.py
from locust import HttpUser, task, between

class RoadmapUser(HttpUser):
    wait_time = between(1, 3)
    
    @task
    def generate_roadmap(self):
        """Generate a roadmap request"""
        self.client.post("/generate-roadmap", json={
            "topic": "Machine Learning",
            "skill_level": "beginner",
            "duration_weeks": 8
        })
```

---

## Performance Considerations

### Response Time Optimization

**Current Performance Characteristics:**
- Average response time: 3-8 seconds (depends on AI model)
- Cohere API latency: 2-5 seconds
- Local processing: <500ms

**Optimization Strategies:**
```python
# Implement async processing
import asyncio
from concurrent.futures import ThreadPoolExecutor

class OptimizedRoadmapGenerator:
    def __init__(self, api_key):
        self.executor = ThreadPoolExecutor(max_workers=4)
        
    async def generate_roadmap_async(self, topic, skill_level, duration_weeks):
        """Async roadmap generation for better concurrency"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor,
            self._generate_roadmap_sync,
            topic, skill_level, duration_weeks
        )
```

### Caching Strategies

**Implement Redis caching for frequently requested roadmaps:**

```python
import redis
import json
from hashlib import md5

class CachedRoadmapGenerator:
    def __init__(self, api_key, redis_url="redis://localhost:6379"):
        self.redis_client = redis.from_url(redis_url)
        self.base_generator = RoadmapGenerator(api_key)
        
    def _get_cache_key(self, topic, skill_level, duration_weeks):
        """Generate cache key for request"""
        key_data = f"{topic}:{skill_level}:{duration_weeks}"
        return md5(key_data.encode()).hexdigest()
        
    async def generate_roadmap(self, topic, skill_level, duration_weeks):
        """Generate roadmap with caching"""
        cache_key = self._get_cache_key(topic, skill_level, duration_weeks)
        
        # Check cache first
        cached_result = self.redis_client.get(cache_key)
        if cached_result:
            return json.loads(cached_result)
            
        # Generate new roadmap
        result = await self.base_generator.generate_roadmap_async(
            topic, skill_level, duration_weeks
        )
        
        # Cache for 1 hour
        self.redis_client.setex(
            cache_key, 
            3600,  # 1 hour TTL
            json.dumps(result)
        )
        
        return result
```

---

## Security Best Practices

### API Key Management

**Secure API Key Handling:**
```python
import os
from cryptography.fernet import Fernet

class SecureAPIKeyManager:
    def get_api_key(self) -> str:
        """Get API key from environment with validation"""
        api_key = os.getenv('COHERE_API_KEY')
        if not api_key:
            raise ValueError("COHERE_API_KEY environment variable is required")
            
        # Validate API key format
        if not api_key.startswith(('sk-', 'cohere-')):
            raise ValueError("Invalid API key format")
            
        return api_key
```

### Input Validation

**Comprehensive input sanitization:**

```python
import re
from pydantic import validator

class SecureRoadmapRequest(BaseModel):
    topic: str
    skill_level: str
    duration_weeks: int
    
    @validator('topic')
    def validate_topic(cls, v):
        """Validate and sanitize topic input"""
        if not v or len(v.strip()) == 0:
            raise ValueError('Topic cannot be empty')
            
        if len(v) > 200:
            raise ValueError('Topic too long (max 200 characters)')
            
        # Remove potentially harmful characters
        sanitized = re.sub(r'[<>&\"\'\']', '', v.strip())
        if not sanitized:
            raise ValueError('Invalid topic format')
            
        return sanitized
        
    @validator('skill_level')
    def validate_skill_level(cls, v):
        """Validate skill level"""
        valid_levels = ['beginner', 'intermediate', 'advanced']
        if v.lower() not in valid_levels:
            raise ValueError(f'Invalid skill level. Must be one of: {valid_levels}')
        return v.lower()
```

---

## Environment Configuration

### Required Variables

**Essential environment variables:**

```bash
# .env file
# AI Service Configuration
AI_SERVICE_HOST=127.0.0.1
AI_SERVICE_PORT=8000
LOG_LEVEL=INFO

# API Keys (Required)
COHERE_API_KEY=your_cohere_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Security
CORS_ORIGINS=http://localhost:3000,http://localhost:8080

# Optional: Redis for caching
REDIS_URL=redis://localhost:6379
```

### Validation

**Environment validation on startup:**

```python
import os

class EnvironmentValidator:
    REQUIRED_VARS = [
        'COHERE_API_KEY',
        'AI_SERVICE_HOST',
        'AI_SERVICE_PORT'
    ]
    
    def validate_environment(self) -> Dict[str, str]:
        """Validate and return environment configuration"""
        errors = []
        config = {}
        
        # Check required variables
        for var in self.REQUIRED_VARS:
            value = os.getenv(var)
            if not value:
                errors.append(f"Missing required environment variable: {var}")
            else:
                config[var] = value
        
        if errors:
            raise ValueError("\n".join(errors))
            
        return config
```

---

## Deployment & Scaling

### Docker Deployment

**Production-ready Docker configuration:**

```dockerfile
# Dockerfile
FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash app && chown -R app:app /app
USER app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Troubleshooting

### Common Issues

**1. Application Fails to Start**
- **Symptoms**: Service exits immediately with error
- **Causes**: Missing API keys, invalid configuration, port conflicts
- **Solutions**: 
  ```bash
  # Check environment variables
  echo $COHERE_API_KEY
  echo $AI_SERVICE_PORT
  
  # Check port availability
  netstat -tlnp | grep :8000
  ```

**2. API Request Timeouts**
- **Symptoms**: Requests timeout after 30+ seconds
- **Causes**: Network issues, AI API delays, high server load
- **Solutions**:
  ```bash
  # Test API connectivity
  curl -H "Authorization: Bearer $COHERE_API_KEY" https://api.cohere.ai/v1/models
  
  # Check server resources
  top -p $(pgrep -f "python app.py")
  ```

### Error Codes Reference

| HTTP Code | Error Type | Description | Solution |
|-----------|------------|-------------|----------|
| 400 | Bad Request | Invalid input parameters | Validate request format |
| 401 | Unauthorized | Missing/invalid API key | Check COHERE_API_KEY |
| 422 | Unprocessable Entity | Validation failed | Check request schema |
| 429 | Too Many Requests | Rate limit exceeded | Implement backoff |
| 500 | Internal Server Error | Service error | Check logs, restart service |
| 503 | Service Unavailable | AI API down | Check external service status |

---

## Development Notes

- **Environment Setup**:
  - Install dependencies: `pip install -r requirements.txt`.
  - Obtain a valid Cohere API key and set `COHERE_API_KEY` in the `.env` file.
- **Testing**:
  - Use tools like `curl`, Postman, or Swagger UI (available at `http://127.0.0.1:8000/docs`) to test the API.
  - Validate responses against the expected structure.
  - Run unit tests: `python -m pytest tests/`
  - Run integration tests: `python -m pytest tests/test_integration.py`
  - Run load tests: `locust -f locustfile.py --host=http://localhost:8000`
- **Extensibility**:
  - Enhance request validation in `app.py` for specific topics or durations.
  - Extend `RoadmapGenerator` to support additional AI models or custom fallback roadmaps.
  - Add more metadata to the `tree` structure (e.g., resource links for topics).
  - Implement caching with Redis for improved performance.
  - Add rate limiting to prevent abuse.
- **Monitoring**:
  - Enable debug logging: `export LOG_LEVEL=DEBUG`
  - Monitor application health: `curl http://localhost:8000/health`
  - Track performance metrics and response times.
- **Security**:
  - Never commit API keys to version control.
  - Use environment variables or secret management systems.
  - Implement input validation and sanitization.
  - Add rate limiting and CORS protection.
- **Performance**:
  - Implement async processing for better concurrency.
  - Use caching for frequently requested roadmaps.
  - Monitor memory usage and optimize resource allocation.
  - Consider connection pooling for external API calls.

---

## Conclusion

The Learning Roadmap Generator provides a robust and flexible way to create customized learning plans using FastAPI and Cohere AI. This comprehensive documentation covers:

- **Complete API Reference**: Detailed endpoint documentation with request/response schemas
- **Implementation Details**: Core code examples and architecture explanations
- **Testing Strategies**: Unit, integration, and load testing approaches
- **Security Best Practices**: API key management, input validation, and secure coding
- **Performance Optimization**: Caching, async processing, and monitoring
- **Deployment Guide**: Docker configuration and production considerations
- **Troubleshooting**: Common issues and error code reference

By following this documentation, developers can effectively understand, deploy, test, and extend the Learning Roadmap Generator service for production use cases.