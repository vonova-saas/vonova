# AI Article Generator Documentation

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
  - [Multi-Agent Pipeline](#multi-agent-pipeline)
  - [Directory Structure](#directory-structure)
- [API Integration](#api-integration)
  - [FastAPI Endpoints](#fastapi-endpoints)
  - [Request/Response Schema](#requestresponse-schema)
  - [Error Response Schema](#error-response-schema)
- [Agent System](#agent-system)
  - [BaseAgent](#baseagent)
  - [PlannerAgent](#planneragent)
  - [WriterAgent](#writeragent)
  - [EditorAgent](#editoragent)
- [Core Code Implementation](#core-code-implementation)
  - [Main API Endpoint (app.py)](#main-api-endpoint-apppy)
  - [Multi-Agent Pipeline (manager/multi_agent_pipeline.py)](#multi-agent-pipeline-managermulti_agent_pipelinepy)
  - [Agent Implementations](#agent-implementations)
  - [Cohere Client Integration](#cohere-client-integration)
- [Testing Strategies](#testing-strategies)
  - [Unit Testing](#unit-testing)
  - [Integration Testing](#integration-testing)
  - [Load Testing](#load-testing)
  - [API Testing Examples](#api-testing-examples)
- [Performance Optimization](#performance-optimization)
  - [Caching Strategies](#caching-strategies)
  - [Async Processing](#async-processing)
  - [Resource Management](#resource-management)
  - [Monitoring Metrics](#monitoring-metrics)
- [Security Best Practices](#security-best-practices)
  - [API Key Management](#api-key-management)
  - [Input Validation & Sanitization](#input-validation--sanitization)
  - [Rate Limiting](#rate-limiting)
  - [Logging Security](#logging-security)
- [Environment Configuration](#environment-configuration)
  - [Required Variables](#required-variables)
  - [Optional Variables](#optional-variables)
  - [Model Configuration](#model-configuration)
- [Deployment & Scaling](#deployment--scaling)
  - [Docker Deployment](#docker-deployment)
  - [Production Considerations](#production-considerations)
  - [Scaling Strategies](#scaling-strategies)
- [Language Support](#language-support)
  - [Automatic Detection](#automatic-detection)
  - [Translation Pipeline](#translation-pipeline)
  - [Multilingual Examples](#multilingual-examples)
- [Monitoring and Logging](#monitoring-and-logging)
  - [Log Levels](#log-levels)
  - [Key Metrics](#key-metrics)
  - [Debug Mode](#debug-mode)
- [Troubleshooting](#troubleshooting)
  - [Common Issues](#common-issues)
  - [Error Codes Reference](#error-codes-reference)
  - [Debug Commands](#debug-commands)
- [Development Guidelines](#development-guidelines)
  - [Setup Instructions](#setup-instructions)
  - [Testing Workflow](#testing-workflow)
  - [Contribution Guidelines](#contribution-guidelines)
- [Future Enhancements](#future-enhancements)
  - [Planned Features](#planned-features)
  - [Extensibility](#extensibility)
- [Dependencies](#dependencies)
  - [Core Libraries](#core-libraries)
  - [External Services](#external-services)
- [License and Support](#license-and-support)

---

## Overview

The AI Article Generator is a multi-agent system that creates high-quality blog articles through a coordinated pipeline of specialized agents. It uses Cohere's language models to generate structured, SEO-optimized content.

## Architecture

### Multi-Agent Pipeline

The system implements a custom multi-agent architecture without CrewAI, consisting of three specialized agents:

1. **PlannerAgent** - Creates content plans and outlines
2. **WriterAgent** - Generates the article draft
3. **EditorAgent** - Refines and polishes the final content

### Directory Structure

```
AI_Article_Generator/
├── agents/                 # Agent implementations
│   ├── base_agent.py      # Abstract base class for all agents
│   ├── planner_agent.py   # Content planning agent
│   ├── writer_agent.py    # Article writing agent
│   └── editor_agent.py    # Content editing agent
├── manager/           # Pipeline coordination
│   └── multi_agent_pipeline.py  # AgentManager class
├── llm/                    # Language model integration
│   └── cohere_client.py    # Cohere API client
├── schemas/                # Data models
│   └── article_request.py # Request/response schemas
├── utils/                  # Utility functions
│   └── translation_utils.py # Language translation support
└── Docs/                   # Documentation
    └── Article_Generator_Documentation.md
```

## API Integration

### FastAPI Endpoints

The article generator is integrated into the main FastAPI application (`app.py`):

- **POST /generate_article** - Main endpoint for article generation
- **Language Support** - Automatic detection and translation for Arabic/English
- **Error Handling** - Comprehensive error responses with proper HTTP status codes

### Request/Response Schema

#### ArticleRequest Schema

```python
from pydantic import BaseModel, validator
import re

class ArticleRequest(BaseModel):
    """
    Request model for generating articles.
    
    Attributes:
        topic: Article topic/title (max 500 characters)
    """
    topic: str
    
    @validator('topic')
    def validate_topic(cls, v):
        """Validate and sanitize topic input"""
        if not v or len(v.strip()) == 0:
            raise ValueError('Topic cannot be empty')
            
        if len(v) > 500:
            raise ValueError('Topic too long (max 500 characters)')
            
        # Remove potentially harmful characters
        sanitized = re.sub(r'[<>&\"\'\']', '', v.strip())
        if not sanitized:
            raise ValueError('Invalid topic format')
            
        return sanitized
```

#### Response Schema

```json
{
    "status": true,
    "article": {
        "title": "Generated Article Title",
        "content": "Full article content with proper formatting...",
        "language": "en",
        "word_count": 1250,
        "reading_time_minutes": 5,
        "seo_keywords": ["keyword1", "keyword2", "keyword3"],
        "structure": {
            "introduction": "Opening paragraph...",
            "sections": [
                {
                    "heading": "Section 1 Title",
                    "content": "Section content..."
                }
            ],
            "conclusion": "Closing paragraph..."
        },
        "metadata": {
            "generated_at": "2024-01-01T12:00:00Z",
            "model_used": "command-a-03-2025",
            "processing_time_seconds": 15.2,
            "agents_used": ["planner", "writer", "editor"]
        }
    }
}
```

#### Error Response Schema

```json
{
    "status": false,
    "error": {
        "code": "AGENT_FAILURE",
        "message": "Planner agent failed to generate content plan",
        "details": {
            "agent": "PlannerAgent",
            "stage": "planning",
            "retry_count": 2,
            "original_error": "API rate limit exceeded"
        }
    },
    "timestamp": "2024-01-01T12:00:00Z"
}
```

### API Usage Examples

#### Basic Article Generation

```bash
curl -X POST "http://localhost:5010/generate_article" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "The Future of Artificial Intelligence in Healthcare"
  }'
```

#### Arabic Article Generation

```bash
curl -X POST "http://localhost:5010/generate_article" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "مستقبل الذكاء الاصطناعي في الرعاية الصحية"
  }'
```

#### With Error Handling

```bash
# Test invalid topic
curl -X POST "http://localhost:5010/generate_article" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": ""
  }' | jq

# Test malformed request
curl -X POST "http://localhost:5010/generate_article" \
  -H "Content-Type: application/json" \
  -d '{
    "invalid_field": "test"
  }' | jq
```

## Agent System

### BaseAgent

Abstract base class providing:
- Common initialization with role, goal, and backstory
- LLM client integration
- Standardized execution flow
- Error handling and logging

### PlannerAgent

**Responsibility**: Create structured content plans

**Process**:
1. Analyzes the topic and target audience
2. Defines SEO keywords
3. Creates article structure with sections
4. Generates comprehensive outline

**Output**: Structured plan with audience, keywords, and section breakdown

### WriterAgent

**Responsibility**: Generate article draft based on plan

**Process**:
1. Uses the planner's output as context
2. Creates engaging, well-structured content
3. Follows SEO best practices
4. Maintains consistent tone and style

**Output**: Complete article draft

### EditorAgent

**Responsibility**: Refine and polish the article

**Process**:
1. Reviews content for clarity and flow
2. Improves readability and engagement
3. Ensures SEO optimization
4. Final quality checks

**Output**: Publication-ready article

---

## Core Code Implementation

### Main API Endpoint (app.py)

```python
# =============================================================================
# ARTICLE GENERATOR API ENDPOINT
# =============================================================================

from AI_Article_Generator.manager.multi_agent_pipeline import AgentManager
from AI_Article_Generator.schemas.article_request import ArticleRequest
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

# Initialize the agent manager
agent_manager = AgentManager()

@app.post("/generate_article", tags=["Article Generator"])
async def generate_article_api(request: ArticleRequest):
    """
    Generate a high-quality article using multi-agent pipeline.
    
    Args:
        request: ArticleRequest containing the topic
        
    Returns:
        JSON response with structured article data or error message
    """
    try:
        # Generate article using multi-agent pipeline
        result = await agent_manager.generate_article_async(request.topic)
        
        return JSONResponse(content={
            "status": True,
            "article": result
        })
        
    except ValueError as e:
        logger.warning(f"Validation error: {str(e)}")
        return JSONResponse(
            status_code=400,
            content={
                "status": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )
        
    except Exception as e:
        logger.error(f"Article generation failed: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "status": False,
                "error": {
                    "code": "GENERATION_FAILED",
                    "message": "Internal server error during article generation",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )
```

### Multi-Agent Pipeline (manager/multi_agent_pipeline.py)

```python
# =============================================================================
# MULTI-AGENT PIPELINE COORDINATION
# =============================================================================

import asyncio
from typing import Dict, Any
from AI_Article_Generator.agents.planner_agent import PlannerAgent
from AI_Article_Generator.agents.writer_agent import WriterAgent
from AI_Article_Generator.agents.editor_agent import EditorAgent
from AI_Article_Generator.llm.cohere_client import CohereClient
from AI_Article_Generator.utils.translation_utils import LanguageDetector

class AgentManager:
    """
    Coordinates the multi-agent article generation pipeline.
    
    Manages the flow: Planner → Writer → Editor with error handling
    and retry logic at each stage.
    """
    
    def __init__(self):
        self.cohere_client = CohereClient()
        self.language_detector = LanguageDetector()
        
        # Initialize agents
        self.planner = PlannerAgent(self.cohere_client)
        self.writer = WriterAgent(self.cohere_client)
        self.editor = EditorAgent(self.cohere_client)
    
    async def generate_article_async(self, topic: str) -> Dict[str, Any]:
        """
        Generate article using coordinated multi-agent pipeline.
        
        Args:
            topic: Article topic to generate content for
            
        Returns:
            Structured article data with metadata
            
        Raises:
            RuntimeError: If pipeline fails at any stage
        """
        start_time = time.time()
        
        try:
            # Detect language and handle translation if needed
            detected_language = self.language_detector.detect(topic)
            processed_topic = topic
            
            if detected_language == 'ar':
                # Translate Arabic topic to English for processing
                processed_topic = self.language_detector.translate_to_english(topic)
            
            # Stage 1: Planning
            logger.info(f"Starting planning stage for topic: {processed_topic}")
            plan = await self.planner.execute_async(processed_topic)
            
            # Stage 2: Writing
            logger.info("Starting writing stage")
            draft = await self.writer.execute_async(plan, processed_topic)
            
            # Stage 3: Editing
            logger.info("Starting editing stage")
            final_article = await self.editor.execute_async(draft, plan)
            
            # Translate back to Arabic if original was Arabic
            if detected_language == 'ar':
                final_article = self.language_detector.translate_to_arabic(final_article)
            
            # Add metadata
            processing_time = time.time() - start_time
            
            return {
                "title": self._extract_title(final_article),
                "content": final_article,
                "language": detected_language,
                "word_count": len(final_article.split()),
                "reading_time_minutes": max(1, len(final_article.split()) // 250),
                "seo_keywords": plan.get("keywords", []),
                "structure": self._parse_structure(final_article),
                "metadata": {
                    "generated_at": datetime.utcnow().isoformat(),
                    "model_used": "command-a-03-2025",
                    "processing_time_seconds": round(processing_time, 2),
                    "agents_used": ["planner", "writer", "editor"],
                    "original_language": detected_language
                }
            }
            
        except Exception as e:
            logger.error(f"Pipeline failed: {str(e)}")
            raise RuntimeError(f"Article generation pipeline failed: {str(e)}")
    
    def _extract_title(self, content: str) -> str:
        """Extract title from article content"""
        lines = content.strip().split('\n')
        for line in lines:
            if line.strip() and not line.startswith('#'):
                return line.strip()
        return "Generated Article"
    
    def _parse_structure(self, content: str) -> Dict[str, Any]:
        """Parse article structure into sections"""
        # Simple structure parsing - can be enhanced
        sections = []
        current_section = None
        
        for line in content.split('\n'):
            if line.strip().startswith('#'):
                if current_section:
                    sections.append(current_section)
                current_section = {
                    "heading": line.strip().lstrip('#').strip(),
                    "content": ""
                }
            elif current_section:
                current_section["content"] += line + "\n"
        
        if current_section:
            sections.append(current_section)
        
        return {
            "introduction": sections[0]["content"] if sections else "",
            "sections": sections[1:] if len(sections) > 1 else [],
            "conclusion": sections[-1]["content"] if sections else ""
        }
```

### Agent Implementations

#### PlannerAgent Example

```python
# =============================================================================
# PLANNER AGENT IMPLEMENTATION
# =============================================================================

from AI_Article_Generator.agents.base_agent import BaseAgent
from typing import Dict, Any

class PlannerAgent(BaseAgent):
    """
    Creates comprehensive content plans for article generation.
    
    Responsible for:
    - Topic analysis and audience definition
    - SEO keyword identification
    - Article structure planning
    - Content outline generation
    """
    
    def __init__(self, llm_client):
        super().__init__(
            role="Content Planner",
            goal="Create comprehensive article outlines",
            backstory="You are an expert content strategist with deep knowledge of SEO and audience engagement.",
            llm_client=llm_client
        )
    
    async def execute_async(self, topic: str) -> Dict[str, Any]:
        """
        Generate a comprehensive content plan.
        
        Args:
            topic: Article topic to plan
            
        Returns:
            Structured plan with audience, keywords, and outline
        """
        prompt = f"""
        Create a comprehensive content plan for an article about: {topic}
        
        Your plan must include:
        1. Target audience analysis
        2. Primary and secondary SEO keywords (5-10 total)
        3. Article structure with 3-5 main sections
        4. Key points for each section
        5. Call-to-action suggestions
        
        Format your response as JSON:
        {{
            "audience": "target audience description",
            "keywords": ["keyword1", "keyword2", ...],
            "tone": "professional/casual/technical",
            "structure": [
                {{
                    "section": "Section Title",
                    "points": ["key point 1", "key point 2", ...]
                }}
            ],
            "call_to_action": "suggested CTA"
        }}
        """
        
        try:
            response = await self.llm_client.generate_async(prompt)
            return self._parse_plan_response(response)
            
        except Exception as e:
            logger.error(f"Planner agent failed: {str(e)}")
            raise RuntimeError(f"Planning stage failed: {str(e)}")
    
    def _parse_plan_response(self, response: str) -> Dict[str, Any]:
        """Parse and validate planner response"""
        # JSON parsing and validation logic
        import json
        import re
        
        # Extract JSON from response
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if not json_match:
            raise ValueError("No valid JSON found in planner response")
        
        plan_data = json.loads(json_match.group())
        
        # Validate required fields
        required_fields = ["audience", "keywords", "structure"]
        for field in required_fields:
            if field not in plan_data:
                raise ValueError(f"Missing required field in plan: {field}")
        
        return plan_data
```

---

## Testing Strategies

### Unit Testing

Test individual components in isolation:

```python
# tests/test_planner_agent.py
import pytest
from AI_Article_Generator.agents.planner_agent import PlannerAgent
from AI_Article_Generator.llm.cohere_client import CohereClient

class TestPlannerAgent:
    def test_planner_initialization(self):
        """Test planner agent initialization"""
        client = CohereClient()
        planner = PlannerAgent(client)
        
        assert planner.role == "Content Planner"
        assert planner.goal == "Create comprehensive article outlines"
        assert planner.llm_client == client
    
    def test_plan_parsing(self):
        """Test plan response parsing"""
        planner = PlannerAgent(None)  # Mock client for testing
        
        # Test valid JSON response
        valid_response = '''
        {
            "audience": "Technical professionals",
            "keywords": ["AI", "automation", "future"],
            "structure": [
                {"section": "Introduction", "points": ["point1", "point2"]}
            ]
        }
        '''
        
        plan = planner._parse_plan_response(valid_response)
        assert "audience" in plan
        assert "keywords" in plan
        assert "structure" in plan
        assert len(plan["keywords"]) == 3
    
    def test_invalid_plan_parsing(self):
        """Test invalid plan response handling"""
        planner = PlannerAgent(None)
        
        # Test invalid JSON
        with pytest.raises(ValueError):
            planner._parse_plan_response("Not a JSON response")
        
        # Test missing required fields
        with pytest.raises(ValueError):
            planner._parse_plan_response('{"audience": "test"}')

# tests/test_article_request.py
import pytest
from AI_Article_Generator.schemas.article_request import ArticleRequest

class TestArticleRequest:
    def test_valid_request(self):
        """Test valid article request"""
        request = ArticleRequest(topic="Machine Learning Trends")
        assert request.topic == "Machine Learning Trends"
    
    def test_empty_topic(self):
        """Test empty topic validation"""
        with pytest.raises(ValueError, match="Topic cannot be empty"):
            ArticleRequest(topic="")
    
    def test_long_topic(self):
        """Test topic length validation"""
        long_topic = "x" * 501  # Exceeds 500 character limit
        with pytest.raises(ValueError, match="Topic too long"):
            ArticleRequest(topic=long_topic)
    
    def test_malicious_topic(self):
        """Test topic sanitization"""
        malicious_topic = "<script>alert('xss')</script>"
        request = ArticleRequest(topic=malicious_topic)
        assert "<script>" not in request.topic
        assert "alertxss" in request.topic
```

### Integration Testing

Test the complete API flow:

```python
# tests/test_integration.py
import pytest
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

class TestArticleGenerationAPI:
    def test_successful_article_generation(self):
        """Test complete article generation flow"""
        response = client.post(
            "/generate_article",
            json={"topic": "The Future of Renewable Energy"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] is True
        assert "article" in data
        
        article = data["article"]
        assert "title" in article
        assert "content" in article
        assert "language" in article
        assert "word_count" in article
        assert "metadata" in article
        
        # Validate metadata
        metadata = article["metadata"]
        assert "generated_at" in metadata
        assert "processing_time_seconds" in metadata
        assert "agents_used" in metadata
        assert len(metadata["agents_used"]) == 3
    
    def test_arabic_article_generation(self):
        """Test Arabic article generation"""
        response = client.post(
            "/generate_article",
            json={"topic": "مستقبل الطاقة المتجددة"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] is True
        assert data["article"]["language"] == "ar"
    
    def test_invalid_request_handling(self):
        """Test error handling for invalid requests"""
        # Test empty topic
        response = client.post(
            "/generate_article",
            json={"topic": ""}
        )
        
        assert response.status_code == 400
        data = response.json()
        assert data["status"] is False
        assert "error" in data
        assert data["error"]["code"] == "VALIDATION_ERROR"
    
    def test_malformed_request(self):
        """Test handling of malformed requests"""
        response = client.post(
            "/generate_article",
            json={"invalid_field": "test"}
        )
        
        assert response.status_code == 422  # FastAPI validation error
```

### Load Testing

Performance testing with Locust:

```python
# locustfile.py
from locust import HttpUser, task, between
import json

class ArticleGeneratorUser(HttpUser):
    wait_time = between(2, 5)  # Wait 2-5 seconds between requests
    
    def on_start(self):
        """Initialize user session"""
        self.topics = [
            "The Impact of AI on Healthcare",
            "Sustainable Technology Trends",
            "Future of Remote Work",
            "Blockchain in Supply Chain",
            "Cybersecurity Best Practices"
        ]
    
    @task(3)
    def generate_english_article(self):
        """Generate English articles (higher weight)"""
        topic = self.topics[self.topics.index % len(self.topics)]
        
        self.client.post("/generate_article", json={
            "topic": topic
        })
    
    @task(1)
    def generate_arabic_article(self):
        """Generate Arabic articles (lower weight)"""
        arabic_topics = [
            "تأثير الذكاء الاصطناعي على الرعاية الصحية",
            "اتجاهات التكنولوجيا المستدامة",
            "مستقبل العمل عن بعد"
        ]
        topic = arabic_topics[self.topics.index % len(arabic_topics)]
        
        self.client.post("/generate_article", json={
            "topic": topic
        })
    
    @task(1)
    def test_invalid_requests(self):
        """Test error handling (lower weight)"""
        self.client.post("/generate_article", json={
            "topic": ""  # Invalid empty topic
        })
```

Run load tests:
```bash
# Install Locust
pip install locust

# Run load test
locust -f locustfile.py --host=http://localhost:5010

# Run with specific parameters
locust -f locustfile.py --host=http://localhost:5010 --users=50 --spawn-rate=5 --run-time=300s
```

### API Testing Examples

Comprehensive test scenarios:

```bash
# Test basic English article generation
curl -X POST "http://localhost:5010/generate_article" \
  -H "Content-Type: application/json" \
  -d '{"topic": "Machine Learning in Healthcare"}' \
  | jq '.'

# Test Arabic article generation
curl -X POST "http://localhost:5010/generate_article" \
  -H "Content-Type: application/json" \
  -d '{"topic": "التعلم الآلي في الرعاية الصحية"}' \
  | jq '.'

# Test topic validation
curl -X POST "http://localhost:5010/generate_article" \
  -H "Content-Type: application/json" \
  -d '{"topic": ""}' \
  | jq '.error.code'

# Test topic length validation
curl -X POST "http://localhost:5010/generate_article" \
  -H "Content-Type: application/json" \
  -d '{"topic": "'$(printf 'x%.s' {1..501})'"}' \
  | jq '.error.message'

# Test malicious input sanitization
curl -X POST "http://localhost:5010/generate_article" \
  -H "Content-Type: application/json" \
  -d '{"topic": "<script>alert(\"xss\")</script>Test Topic"}' \
  | jq '.article.title'

# Test malformed JSON
curl -X POST "http://localhost:5010/generate_article" \
  -H "Content-Type: application/json" \
  -d '{"invalid": "request"}' \
  | jq '.detail[0].msg'

# Test concurrent requests
for i in {1..5}; do
  curl -X POST "http://localhost:5010/generate_article" \
    -H "Content-Type: application/json" \
    -d "{\"topic\": \"Test Article $i\"}" &
done
wait
```

### Performance Testing

Benchmark response times and resource usage:

```python
# tests/test_performance.py
import pytest
import time
import psutil
import requests
from concurrent.futures import ThreadPoolExecutor

class TestPerformance:
    def test_response_time_benchmark(self):
        """Benchmark average response time"""
        response_times = []
        
        for _ in range(10):
            start_time = time.time()
            response = requests.post(
                "http://localhost:5010/generate_article",
                json={"topic": "Performance Test Topic"}
            )
            end_time = time.time()
            
            assert response.status_code == 200
            response_times.append(end_time - start_time)
        
        avg_time = sum(response_times) / len(response_times)
        max_time = max(response_times)
        
        print(f"Average response time: {avg_time:.2f}s")
        print(f"Max response time: {max_time:.2f}s")
        
        # Assert reasonable performance expectations
        assert avg_time < 30.0  # Should complete within 30 seconds
        assert max_time < 60.0  # No request should take more than 1 minute
    
    def test_concurrent_requests(self):
        """Test performance under concurrent load"""
        def make_request():
            response = requests.post(
                "http://localhost:5010/generate_article",
                json={"topic": "Concurrent Test Topic"}
            )
            return response.status_code == 200
        
        # Test with 10 concurrent requests
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request) for _ in range(10)]
            results = [future.result() for future in futures]
        
        # All requests should succeed
        assert all(results), "Some concurrent requests failed"
    
    def test_memory_usage(self):
        """Monitor memory usage during article generation"""
        process = psutil.Process()
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # Generate multiple articles
        for i in range(5):
            response = requests.post(
                "http://localhost:5010/generate_article",
                json={"topic": f"Memory Test Topic {i}"}
            )
            assert response.status_code == 200
        
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory
        
        print(f"Memory increase: {memory_increase:.2f} MB")
        
        # Memory increase should be reasonable (less than 200MB)
        assert memory_increase < 200, "Memory usage increased too much"
```

---

## Performance Optimization

### Caching Strategies

**Implement Redis caching for frequently generated articles:**

```python
# AI_Article_Generator/utils/cache_manager.py
import redis
import json
import hashlib
from typing import Dict, Any, Optional

class ArticleCacheManager:
    """
    Manages caching of generated articles and intermediate results.
    
    Caches both final articles and agent outputs to improve performance
    for similar topics and reduce API costs.
    """
    
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_client = redis.from_url(redis_url)
        self.article_ttl = 3600 * 24  # 24 hours for articles
        self.plan_ttl = 3600 * 6      # 6 hours for plans
    
    def _get_topic_hash(self, topic: str) -> str:
        """Generate consistent hash for topic"""
        return hashlib.md5(topic.lower().strip().encode()).hexdigest()
    
    def get_cached_article(self, topic: str) -> Optional[Dict[str, Any]]:
        """Retrieve cached article if available"""
        topic_hash = self._get_topic_hash(topic)
        cached_data = self.redis_client.get(f"article:{topic_hash}")
        
        if cached_data:
            return json.loads(cached_data)
        return None
    
    def cache_article(self, topic: str, article_data: Dict[str, Any]):
        """Cache generated article"""
        topic_hash = self._get_topic_hash(topic)
        self.redis_client.setex(
            f"article:{topic_hash}",
            self.article_ttl,
            json.dumps(article_data)
        )
    
    def get_cached_plan(self, topic: str) -> Optional[Dict[str, Any]]:
        """Retrieve cached content plan"""
        topic_hash = self._get_topic_hash(topic)
        cached_data = self.redis_client.get(f"plan:{topic_hash}")
        
        if cached_data:
            return json.loads(cached_data)
        return None
    
    def cache_plan(self, topic: str, plan_data: Dict[str, Any]):
        """Cache content plan"""
        topic_hash = self._get_topic_hash(topic)
        self.redis_client.setex(
            f"plan:{topic_hash}",
            self.plan_ttl,
            json.dumps(plan_data)
        )
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache performance statistics"""
        return {
            "article_cache_size": len(self.redis_client.keys("article:*")),
            "plan_cache_size": len(self.redis_client.keys("plan:*")),
            "total_memory_usage": self.redis_client.info().get("used_memory_human", "N/A")
        }
```

### Async Processing

**Optimize agent execution with async/await:**

```python
# AI_Article_Generator/agents/async_base_agent.py
import asyncio
from abc import ABC, abstractmethod
from typing import Dict, Any

class AsyncBaseAgent(ABC):
    """
    Enhanced base agent with async capabilities and connection pooling.
    """
    
    def __init__(self, llm_client, max_concurrent: int = 3):
        self.llm_client = llm_client
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.execution_stats = {
            "total_executions": 0,
            "successful_executions": 0,
            "failed_executions": 0,
            "avg_execution_time": 0.0
        }
    
    async def execute_async(self, *args, **kwargs) -> Dict[str, Any]:
        """
        Async execution with rate limiting and performance tracking.
        """
        async with self.semaphore:
            start_time = time.time()
            
            try:
                self.execution_stats["total_executions"] += 1
                
                result = await self._execute_internal(*args, **kwargs)
                
                self.execution_stats["successful_executions"] += 1
                
                # Update average execution time
                execution_time = time.time() - start_time
                self._update_avg_execution_time(execution_time)
                
                return result
                
            except Exception as e:
                self.execution_stats["failed_executions"] += 1
                logger.error(f"{self.__class__.__name__} failed: {str(e)}")
                raise
    
    @abstractmethod
    async def _execute_internal(self, *args, **kwargs) -> Dict[str, Any]:
        """Internal async execution logic"""
        pass
    
    def _update_avg_execution_time(self, execution_time: float):
        """Update rolling average execution time"""
        total = self.execution_stats["total_executions"]
        current_avg = self.execution_stats["avg_execution_time"]
        self.execution_stats["avg_execution_time"] = (
            (current_avg * (total - 1) + execution_time) / total
        )
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get agent performance statistics"""
        total = self.execution_stats["total_executions"]
        return {
            **self.execution_stats,
            "success_rate": (
                self.execution_stats["successful_executions"] / total 
                if total > 0 else 0
            )
        }
```

### Resource Management

**Connection pooling and resource optimization:**

```python
# AI_Article_Generator/llm/connection_pool.py
import aiohttp
import asyncio
from typing import Optional

class CohereConnectionPool:
    """
    Manages HTTP connections to Cohere API with connection pooling.
    """
    
    def __init__(self, max_connections: int = 10, timeout: int = 30):
        self.max_connections = max_connections
        self.timeout = aiohttp.ClientTimeout(total=timeout)
        self.session: Optional[aiohttp.ClientSession] = None
        self._lock = asyncio.Lock()
    
    async def get_session(self) -> aiohttp.ClientSession:
        """Get or create HTTP session with connection pooling"""
        if self.session is None or self.session.closed:
            async with self._lock:
                if self.session is None or self.session.closed:
                    connector = aiohttp.TCPConnector(
                        limit=self.max_connections,
                        limit_per_host=self.max_connections,
                        keepalive_timeout=30,
                        enable_cleanup_closed=True
                    )
                    
                    self.session = aiohttp.ClientSession(
                        connector=connector,
                        timeout=self.timeout
                    )
        
        return self.session
    
    async def close(self):
        """Close the connection pool"""
        if self.session and not self.session.closed:
            await self.session.close()
    
    async def __aenter__(self):
        return await self.get_session()
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()
```

### Monitoring Metrics

**Performance monitoring and metrics collection:**

```python
# AI_Article_Generator/utils/metrics_collector.py
import time
import psutil
from typing import Dict, Any, List
from dataclasses import dataclass
from datetime import datetime, timedelta

@dataclass
class PerformanceMetric:
    timestamp: datetime
    metric_name: str
    value: float
    tags: Dict[str, str]

class MetricsCollector:
    """
    Collects and manages performance metrics for the article generator.
    """
    
    def __init__(self, max_metrics: int = 10000):
        self.metrics: List[PerformanceMetric] = []
        self.max_metrics = max_metrics
        self.start_time = datetime.utcnow()
    
    def record_metric(self, name: str, value: float, tags: Dict[str, str] = None):
        """Record a performance metric"""
        metric = PerformanceMetric(
            timestamp=datetime.utcnow(),
            metric_name=name,
            value=value,
            tags=tags or {}
        )
        
        self.metrics.append(metric)
        
        # Maintain maximum size
        if len(self.metrics) > self.max_metrics:
            self.metrics = self.metrics[-self.max_metrics:]
    
    def get_system_metrics(self) -> Dict[str, Any]:
        """Get current system performance metrics"""
        process = psutil.Process()
        
        return {
            "cpu_percent": process.cpu_percent(),
            "memory_mb": process.memory_info().rss / 1024 / 1024,
            "memory_percent": process.memory_percent(),
            "open_files": process.num_fds(),
            "threads": process.num_threads(),
            "uptime_hours": (datetime.utcnow() - self.start_time).total_seconds() / 3600
        }
    
    def get_api_metrics(self, time_window: timedelta = timedelta(hours=1)) -> Dict[str, Any]:
        """Get API performance metrics for a time window"""
        cutoff_time = datetime.utcnow() - time_window
        recent_metrics = [m for m in self.metrics if m.timestamp > cutoff_time]
        
        if not recent_metrics:
            return {}
        
        # Group by metric name
        grouped_metrics = {}
        for metric in recent_metrics:
            if metric.metric_name not in grouped_metrics:
                grouped_metrics[metric.metric_name] = []
            grouped_metrics[metric.metric_name].append(metric.value)
        
        # Calculate statistics
        stats = {}
        for name, values in grouped_metrics.items():
            stats[name] = {
                "count": len(values),
                "avg": sum(values) / len(values),
                "min": min(values),
                "max": max(values),
                "latest": values[-1]
            }
        
        return stats
    
    def record_article_generation(self, topic: str, processing_time: float, 
                               word_count: int, success: bool):
        """Record article generation metrics"""
        self.record_metric("article_generation_time", processing_time, {
            "topic_length": str(len(topic)),
            "success": str(success)
        })
        
        self.record_metric("article_word_count", word_count, {
            "success": str(success)
        })
        
        self.record_metric("article_generation_success", 1.0 if success else 0.0, {
            "topic_length": str(len(topic))
        })
```

---

## Security Best Practices

### API Key Management

**Secure API key handling with encryption:**

```python
# AI_Article_Generator/security/secure_key_manager.py
import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

class SecureKeyManager:
    """
    Manages API keys with encryption and secure storage.
    """
    
    def __init__(self, master_password: str = None):
        self.master_password = master_password or os.getenv('MASTER_PASSWORD')
        if not self.master_password:
            raise ValueError("Master password must be provided")
        
        self.cipher_suite = self._create_cipher_suite()
    
    def _create_cipher_suite(self) -> Fernet:
        """Create encryption cipher suite from master password"""
        password_bytes = self.master_password.encode()
        salt = b'article_generator_salt'  # In production, use random salt
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password_bytes))
        return Fernet(key)
    
    def encrypt_api_key(self, api_key: str) -> str:
        """Encrypt API key for secure storage"""
        encrypted_key = self.cipher_suite.encrypt(api_key.encode())
        return base64.urlsafe_b64encode(encrypted_key).decode()
    
    def decrypt_api_key(self, encrypted_key: str) -> str:
        """Decrypt API key for use"""
        encrypted_bytes = base64.urlsafe_b64decode(encrypted_key.encode())
        decrypted_key = self.cipher_suite.decrypt(encrypted_bytes)
        return decrypted_key.decode()
    
    def get_cohere_api_key(self) -> str:
        """Get and validate Cohere API key"""
        encrypted_key = os.getenv('COHERE_API_KEY_ENCRYPTED')
        if not encrypted_key:
            raise ValueError("Encrypted API key not found in environment")
        
        api_key = self.decrypt_api_key(encrypted_key)
        
        # Validate API key format
        if not api_key.startswith(('sk-', 'cohere-')):
            raise ValueError("Invalid API key format")
        
        return api_key
```

### Input Validation & Sanitization

**Comprehensive input security:**

```python
# AI_Article_Generator/security/input_validator.py
import re
import html
from typing import List, Dict, Any

class InputValidator:
    """
    Validates and sanitizes user inputs to prevent security issues.
    """
    
    # Patterns for potentially malicious content
    MALICIOUS_PATTERNS = [
        r'<script[^>]*>.*?</script>',  # Script tags
        r'javascript:',                # JavaScript URLs
        r'on\w+\s*=',                # Event handlers
        r'<iframe[^>]*>',            # Iframes
        r'<object[^>]*>',             # Objects
        r'<embed[^>]*>',              # Embeds
        r'<link[^>]*>',               # Links
        r'<meta[^>]*>',               # Meta tags
    ]
    
    # Allowed characters for topics
    ALLOWED_CHARS = r'^[a-zA-Z0-9\s\-\.\,\:\;\!\?\(\)\[\]\"\'\u0600-\u06FF]+$'
    
    @classmethod
    def sanitize_topic(cls, topic: str) -> str:
        """Sanitize topic input"""
        if not topic:
            raise ValueError("Topic cannot be empty")
        
        # Remove HTML entities and decode
        topic = html.unescape(topic)
        
        # Remove potentially malicious patterns
        for pattern in cls.MALICIOUS_PATTERNS:
            topic = re.sub(pattern, '', topic, flags=re.IGNORECASE | re.DOTALL)
        
        # Validate allowed characters
        if not re.match(cls.ALLOWED_CHARS, topic):
            raise ValueError("Topic contains invalid characters")
        
        # Clean up whitespace
        topic = re.sub(r'\s+', ' ', topic).strip()
        
        # Length validation
        if len(topic) > 500:
            raise ValueError("Topic too long (max 500 characters)")
        
        if len(topic) < 3:
            raise ValueError("Topic too short (min 3 characters)")
        
        return topic
    
    @classmethod
    def detect_language_safely(cls, topic: str) -> str:
        """Detect language with security checks"""
        try:
            # Basic language detection based on character sets
            arabic_chars = len(re.findall(r'[\u0600-\u06FF]', topic))
            total_chars = len(re.findall(r'[a-zA-Z\u0600-\u06FF]', topic))
            
            if total_chars == 0:
                return 'unknown'
            
            arabic_ratio = arabic_chars / total_chars
            return 'ar' if arabic_ratio > 0.3 else 'en'
            
        except Exception:
            return 'unknown'  # Fail safely
    
    @classmethod
    def validate_request_size(cls, request_data: Dict[str, Any]) -> bool:
        """Validate request size to prevent DoS attacks"""
        import json
        
        try:
            request_size = len(json.dumps(request_data).encode())
            
            # Limit request size to 1MB
            if request_size > 1024 * 1024:
                raise ValueError("Request too large")
            
            return True
            
        except Exception as e:
            raise ValueError(f"Invalid request format: {str(e)}")
```

### Rate Limiting

**Implement sophisticated rate limiting:**

```python
# AI_Article_Generator/security/rate_limiter.py
import time
import asyncio
from collections import defaultdict, deque
from typing import Dict, Tuple
from datetime import datetime, timedelta

class RateLimiter:
    """
    Advanced rate limiting with multiple strategies.
    """
    
    def __init__(self):
        # Sliding window rate limiters
        self.sliding_windows: Dict[str, deque] = defaultdict(deque)
        
        # Token bucket rate limiters
        self.token_buckets: Dict[str, Dict] = defaultdict(dict)
        
        # Fixed window counters
        self.fixed_counters: Dict[str, Dict] = defaultdict(dict)
    
    async def check_rate_limit(self, identifier: str, limit: int, window: int, 
                              strategy: str = "sliding") -> bool:
        """
        Check if request is within rate limits.
        
        Args:
            identifier: Unique identifier (IP, user ID, etc.)
            limit: Maximum requests allowed
            window: Time window in seconds
            strategy: Rate limiting strategy
            
        Returns:
            True if request is allowed, False otherwise
        """
        if strategy == "sliding":
            return self._check_sliding_window(identifier, limit, window)
        elif strategy == "token_bucket":
            return self._check_token_bucket(identifier, limit, window)
        elif strategy == "fixed":
            return self._check_fixed_window(identifier, limit, window)
        else:
            raise ValueError(f"Unknown rate limiting strategy: {strategy}")
    
    def _check_sliding_window(self, identifier: str, limit: int, window: int) -> bool:
        """Sliding window rate limiting"""
        now = time.time()
        window_key = f"{identifier}:{window}"
        
        # Remove old requests outside the window
        while (self.sliding_windows[window_key] and 
               self.sliding_windows[window_key][0] < now - window):
            self.sliding_windows[window_key].popleft()
        
        # Check if under limit
        if len(self.sliding_windows[window_key]) < limit:
            self.sliding_windows[window_key].append(now)
            return True
        
        return False
    
    def _check_token_bucket(self, identifier: str, limit: int, window: int) -> bool:
        """Token bucket rate limiting"""
        now = time.time()
        bucket_key = f"{identifier}:{window}"
        
        bucket = self.token_buckets[bucket_key]
        
        # Initialize bucket if needed
        if "tokens" not in bucket:
            bucket["tokens"] = limit
            bucket["last_refill"] = now
        
        # Refill tokens based on time elapsed
        time_elapsed = now - bucket["last_refill"]
        tokens_to_add = (time_elapsed / window) * limit
        bucket["tokens"] = min(limit, bucket["tokens"] + tokens_to_add)
        bucket["last_refill"] = now
        
        # Check if tokens available
        if bucket["tokens"] >= 1:
            bucket["tokens"] -= 1
            return True
        
        return False
    
    def _check_fixed_window(self, identifier: str, limit: int, window: int) -> bool:
        """Fixed window rate limiting"""
        now = datetime.utcnow()
        window_start = now.replace(second=0, microsecond=0)
        window_key = f"{identifier}:{window_start}"
        
        counter = self.fixed_counters[window_key]
        
        if "count" not in counter:
            counter["count"] = 0
            counter["expires"] = window_start + timedelta(seconds=window)
        
        # Check if window expired
        if now > counter["expires"]:
            counter["count"] = 0
            counter["expires"] = window_start + timedelta(seconds=window)
        
        # Check if under limit
        if counter["count"] < limit:
            counter["count"] += 1
            return True
        
        return False
    
    def get_rate_limit_status(self, identifier: str) -> Dict[str, Any]:
        """Get current rate limit status for identifier"""
        return {
            "sliding_windows": {
                key: len(window) for key, window in self.sliding_windows.items()
                if key.startswith(identifier)
            },
            "token_buckets": {
                key: bucket.get("tokens", 0) for key, bucket in self.token_buckets.items()
                if key.startswith(identifier)
            }
        }
```

---

## Environment Configuration

### Required Variables

**Essential environment variables:**

```bash
# .env file
# AI Service Configuration
AI_SERVICE_HOST=127.0.0.1
AI_SERVICE_PORT=5010
LOG_LEVEL=INFO

# API Keys (Required - Encrypted)
COHERE_API_KEY_ENCRYPTED=your_encrypted_cohere_api_key_here
MASTER_PASSWORD=your_master_password_for_encryption

# Security
CORS_ORIGINS=http://localhost:3000,http://localhost:8080
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW=60

# Optional: Redis for caching
REDIS_URL=redis://localhost:6379
CACHE_ENABLED=true
```

### Optional Variables

**Advanced configuration options:**

```bash
# Performance Settings
MAX_CONCURRENT_REQUESTS=5
REQUEST_TIMEOUT=120
CONNECTION_POOL_SIZE=10

# AI Model Configuration
COHERE_MODEL=command-a-03-2025
TEMPERATURE=0.35
MAX_TOKENS=4000
RETRY_ATTEMPTS=3
RETRY_DELAY=2

# Monitoring
ENABLE_METRICS=true
METRICS_RETENTION_HOURS=24
DEBUG_MODE=false

# Security
ENABLE_INPUT_VALIDATION=true
MAX_TOPIC_LENGTH=500
MIN_TOPIC_LENGTH=3
```

### Model Configuration

Current model: `command-a-03-2025`

- Temperature: 0.35 (balanced creativity)
- Max tokens: 4000
- Retries: 3 with 2-second delay
- Timeout: 120 seconds

---

## Deployment & Scaling

### Docker Deployment

**Production-ready Docker configuration:**

```dockerfile
# Dockerfile
FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash app && chown -R app:app /app
USER app

# Expose port
EXPOSE 5010

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5010/health || exit 1

# Start application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5010"]
```

**Docker Compose for production:**

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  article-generator:
    build: .
    ports:
      - "5010:5010"
    environment:
      - AI_SERVICE_HOST=0.0.0.0
      - AI_SERVICE_PORT=5010
      - COHERE_API_KEY_ENCRYPTED=${COHERE_API_KEY_ENCRYPTED}
      - MASTER_PASSWORD=${MASTER_PASSWORD}
      - REDIS_URL=redis://redis:6379
      - LOG_LEVEL=INFO
      - CACHE_ENABLED=true
      - RATE_LIMIT_ENABLED=true
    depends_on:
      - redis
    restart: unless-stopped
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 128M

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - article-generator
    restart: unless-stopped

volumes:
  redis_data:
```

### Production Considerations

**Security hardening with nginx:**

```nginx
# nginx.conf
upstream article_api {
    server article-generator:5010;
}

server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/m;
    
    location / {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://article_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts for article generation
        proxy_connect_timeout 30s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://article_api;
        access_log off;
    }
}
```

### Scaling Strategies

**Horizontal scaling with Kubernetes:**

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: article-generator
spec:
  replicas: 3
  selector:
    matchLabels:
      app: article-generator
  template:
    metadata:
      labels:
        app: article-generator
    spec:
      containers:
      - name: article-generator
        image: your-registry/article-generator:latest
        ports:
        - containerPort: 5010
        env:
        - name: AI_SERVICE_HOST
          value: "0.0.0.0"
        - name: AI_SERVICE_PORT
          value: "5010"
        - name: COHERE_API_KEY_ENCRYPTED
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: cohere-api-key-encrypted
        - name: MASTER_PASSWORD
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: master-password
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5010
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 5010
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: article-generator-service
spec:
  selector:
    app: article-generator
  ports:
  - port: 80
    targetPort: 5010
  type: LoadBalancer
```

---

## Language Support

### Automatic Detection

**Language detection algorithm:**

```python
# AI_Article_Generator/utils/language_detector.py
import re
from typing import Tuple

class LanguageDetector:
    """
    Detects and processes multilingual content.
    """
    
    ARABIC_RANGE = r'[\u0600-\u06FF]'
    ENGLISH_RANGE = r'[a-zA-Z]'
    
    @classmethod
    def detect_language(cls, text: str) -> str:
        """
        Detect the primary language of the input text.
        
        Args:
            text: Input text to analyze
            
        Returns:
            'ar' for Arabic, 'en' for English, 'unknown' for undetermined
        """
        if not text or not text.strip():
            return 'unknown'
        
        # Count characters in each language
        arabic_chars = len(re.findall(cls.ARABIC_RANGE, text))
        english_chars = len(re.findall(cls.ENGLISH_RANGE, text))
        total_chars = arabic_chars + english_chars
        
        if total_chars == 0:
            return 'unknown'
        
        # Calculate ratios
        arabic_ratio = arabic_chars / total_chars
        
        # Threshold for Arabic detection (30% or more Arabic characters)
        return 'ar' if arabic_ratio >= 0.3 else 'en'
    
    @classmethod
    def is_arabic(cls, text: str) -> bool:
        """Check if text is primarily Arabic"""
        return cls.detect_language(text) == 'ar'
    
    @classmethod
    def get_language_stats(cls, text: str) -> dict:
        """Get detailed language statistics"""
        arabic_chars = len(re.findall(cls.ARABIC_RANGE, text))
        english_chars = len(re.findall(cls.ENGLISH_RANGE, text))
        other_chars = len(text) - arabic_chars - english_chars
        total_chars = len(text)
        
        return {
            "arabic_count": arabic_chars,
            "english_count": english_chars,
            "other_count": other_chars,
            "total_count": total_chars,
            "arabic_percentage": (arabic_chars / total_chars * 100) if total_chars > 0 else 0,
            "english_percentage": (english_chars / total_chars * 100) if total_chars > 0 else 0,
            "detected_language": cls.detect_language(text)
        }
```

### Translation Pipeline

**Bidirectional translation system:**

```python
# AI_Article_Generator/utils/translation_service.py
import asyncio
from typing import Optional
from AI_Article_Generator.llm.cohere_client import CohereClient

class TranslationService:
    """
    Handles translation between Arabic and English.
    """
    
    def __init__(self, cohere_client: CohereClient):
        self.cohere_client = cohere_client
    
    async def translate_to_english(self, arabic_text: str) -> str:
        """
        Translate Arabic text to English for processing.
        
        Args:
            arabic_text: Arabic text to translate
            
        Returns:
            English translation
        """
        if not arabic_text or not arabic_text.strip():
            return arabic_text
        
        translation_prompt = f"""
        Translate the following Arabic text to English.
        Maintain the original meaning, tone, and context.
        Return only the translated text without any additional formatting.
        
        Arabic text: {arabic_text}
        
        English translation:
        """
        
        try:
            response = await self.cohere_client.generate_async(translation_prompt)
            return response.strip()
            
        except Exception as e:
            logger.error(f"Translation to English failed: {str(e)}")
            # Fallback to original text if translation fails
            return arabic_text
    
    async def translate_to_arabic(self, english_text: str) -> str:
        """
        Translate English text to Arabic for final output.
        
        Args:
            english_text: English text to translate
            
        Returns:
            Arabic translation
        """
        if not english_text or not english_text.strip():
            return english_text
        
        translation_prompt = f"""
        Translate the following English text to Arabic.
        Maintain the original meaning, tone, and context.
        Use formal Arabic suitable for articles.
        Return only the translated text without any additional formatting.
        
        English text: {english_text}
        
        Arabic translation:
        """
        
        try:
            response = await self.cohere_client.generate_async(translation_prompt)
            return response.strip()
            
        except Exception as e:
            logger.error(f"Translation to Arabic failed: {str(e)}")
            # Fallback to original text if translation fails
            return english_text
    
    async def translate_if_needed(self, text: str, target_language: str) -> str:
        """
        Translate text to target language if needed.
        
        Args:
            text: Text to potentially translate
            target_language: Target language ('ar' or 'en')
            
        Returns:
            Text in target language
        """
        current_language = LanguageDetector.detect_language(text)
        
        if current_language == target_language:
            return text
        
        if target_language == 'en' and current_language == 'ar':
            return await self.translate_to_english(text)
        elif target_language == 'ar' and current_language == 'en':
            return await self.translate_to_arabic(text)
        
        return text
```

---

## Monitoring and Logging

### Log Levels

- **DEBUG**: Detailed execution flow and agent communication
- **INFO**: Normal operation, request processing, and agent status
- **WARNING**: Non-critical issues and performance warnings
- **ERROR**: Failures, exceptions, and critical errors

### Key Metrics

- **Performance Metrics**:
  - Article generation time (total and per-agent)
  - API response times and success rates
  - Cache hit/miss ratios
  - Memory and CPU usage

- **Business Metrics**:
  - Articles generated per hour/day
  - Language distribution (Arabic vs English)
  - Average word count and reading time
  - Topic popularity analysis

- **System Metrics**:
  - Agent execution success rates
  - Error frequency and types
  - Rate limiting statistics
  - Translation accuracy

### Debug Mode

**Enable comprehensive debugging:**

```bash
# Enable debug logging
export LOG_LEVEL=DEBUG

# Enable debug mode in application
export DEBUG_MODE=true

# Run with verbose output
uvicorn app:app --host 0.0.0.0 --port 5010 --log-level debug
```

**Debug commands:**
```bash
# Monitor logs in real-time
tail -f logs/article_generator.log

# Check application health
curl "http://localhost:5010/health" | jq

# Test with debug headers
curl -X POST "http://localhost:5010/generate_article" \
  -H "Content-Type: application/json" \
  -H "X-Debug: true" \
  -d '{"topic": "Debug Test Topic"}' | jq

# Monitor system resources
htop
```

---

## Troubleshooting

### Common Issues

**1. Article Generation Failures**
- **Symptoms**: HTTP 500 errors, incomplete articles
- **Causes**: API key issues, model unavailability, network problems
- **Solutions**:
  ```bash
  # Check API key
  echo $COHERE_API_KEY_ENCRYPTED
  
  # Test API connectivity
  curl -H "Authorization: Bearer $DECRYPTED_KEY" https://api.cohere.ai/v1/models
  
  # Check logs
  tail -f logs/article_generator.log | grep -i error
  ```

**2. Performance Issues**
- **Symptoms**: Slow response times, timeouts
- **Causes**: High concurrent load, network latency, resource constraints
- **Solutions**:
  ```bash
  # Monitor system resources
  top -p $(pgrep -f "python app.py")
  
  # Check cache performance
  redis-cli info memory
  redis-cli info stats
  
  # Monitor concurrent requests
  netstat -an | grep :5010 | wc -l
  ```

**3. Translation Problems**
- **Symptoms**: Incorrect language detection, poor translation quality
- **Causes**: Mixed language input, translation model issues
- **Solutions**:
  ```bash
  # Test language detection
  curl -X POST "http://localhost:5010/debug/language-detect" \
    -H "Content-Type: application/json" \
    -d '{"text": "test text"}'
  
  # Check translation logs
  grep -i "translation" logs/article_generator.log
  ```

**4. Memory Issues**
- **Symptoms**: Service crashes, out-of-memory errors
- **Causes**: Memory leaks, large concurrent requests
- **Solutions**:
  ```bash
  # Monitor memory usage
  ps aux | grep python | awk '{print $6}' | paste -sd+ | bc
  
  # Check for memory leaks
  python -m memory_profiler app.py
  
  # Reduce concurrent requests
  export MAX_CONCURRENT_REQUESTS=3
  ```

### Error Codes Reference

| HTTP Code | Error Code | Description | Solution |
|-----------|------------|-------------|----------|
| 400 | VALIDATION_ERROR | Invalid input parameters | Check request format |
| 401 | UNAUTHORIZED | Missing/invalid API key | Verify encrypted API key |
| 422 | SCHEMA_ERROR | Request validation failed | Check Pydantic schema |
| 429 | RATE_LIMITED | Too many requests | Implement backoff strategy |
| 500 | AGENT_FAILURE | Agent execution failed | Check agent logs |
| 500 | TRANSLATION_ERROR | Translation pipeline failed | Check language detection |
| 503 | SERVICE_UNAVAILABLE | External API down | Check Cohere API status |
| 504 | TIMEOUT | Request timeout | Increase timeout or optimize |

### Debug Commands

**Comprehensive debugging toolkit:**

```bash
# Health check with detailed info
curl -s "http://localhost:5010/health" | jq '.'

# Test all components
curl -X POST "http://localhost:5010/debug/test-all" | jq '.'

# Check configuration
curl -s "http://localhost:5010/debug/config" | jq '.'

# Monitor metrics
curl -s "http://localhost:5010/debug/metrics" | jq '.'

# Test rate limiting
for i in {1..15}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    "http://localhost:5010/generate_article" \
    -H "Content-Type: application/json" \
    -d '{"topic": "Test '$i'"}'
done

# Check cache status
redis-cli keys "*"
redis-cli info memory

# Stress test
ab -n 100 -c 10 -t 60 "http://localhost:5010/health"
```

---

## Development Guidelines

### Setup Instructions

**Local development environment:**

```bash
# 1. Clone repository
git clone <repository-url>
cd AI_Article_Generator

# 2. Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# or
.venv\Scripts\Activate.ps1  # Windows

# 3. Install dependencies
pip install -r requirements.txt
pip install pytest pytest-cov black flake8 mypy

# 4. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 5. Run tests
python -m pytest tests/ -v

# 6. Start development server
uvicorn app:app --reload --host 0.0.0.0 --port 5010
```

### Testing Workflow

**Comprehensive testing strategy:**

```bash
# Run all tests with coverage
pytest --cov=AI_Article_Generator --cov-report=html

# Run specific test categories
pytest tests/unit/ -v
pytest tests/integration/ -v
pytest tests/performance/ -v

# Run with specific markers
pytest -m "not slow" -v  # Skip slow tests
pytest -m "security" -v   # Run only security tests

# Code quality checks
black --check AI_Article_Generator/
flake8 AI_Article_Generator/
mypy AI_Article_Generator/

# Security tests
bandit -r AI_Article_Generator/

# Performance benchmarks
python -m pytest tests/test_performance.py::TestPerformance::test_response_time_benchmark -v
```

### Contribution Guidelines

**Development standards:**

1. **Code Style**: Follow PEP 8, use Black for formatting
2. **Testing**: Write tests for all new features and bug fixes
3. **Documentation**: Update docstrings and README for changes
4. **Security**: Follow security best practices, validate all inputs
5. **Performance**: Consider performance impact of changes
6. **Git Workflow**: Use feature branches, descriptive commit messages

**Pull request template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Security
- [ ] Input validation added/updated
- [ ] No sensitive data logged
- [ ] Rate limiting considered

## Performance
- [ ] No performance regression
- [ ] Memory usage acceptable
- [ ] Response time within limits
```

---

## Future Enhancements

### Planned Features

1. **Multi-Model Support**: Integration with OpenAI, Anthropic, and other LLM providers
2. **Custom Templates**: User-defined article structures and templates
3. **Batch Processing**: Generate multiple articles simultaneously
4. **Content Optimization**: Advanced SEO features and keyword optimization
5. **Image Generation**: AI-powered image generation for articles
6. **Content Personalization**: User preference-based content adaptation
7. **Analytics Dashboard**: Built-in analytics and usage statistics
8. **API Versioning**: Support for multiple API versions

### Extensibility

The modular architecture allows for:

- **Custom Agents**: Implement specialized agents for different content types
- **Language Support**: Add new languages and translation services
- **Content Formats**: Support for blogs, social media, academic papers
- **Integration**: Connect with external services and APIs
- **Plugins**: Plugin system for third-party extensions

---

## Dependencies

### Core Libraries

```python
# Web framework
fastapi>=0.104.0
uvicorn[standard]>=0.24.0

# Data validation
pydantic>=2.5.0

# AI/LLM integration
langchain-cohere>=0.1.0
cohere>=4.0.0

# Async and networking
aiohttp>=3.9.0
asyncio-throttle>=1.0.2

# Security
cryptography>=41.0.0
python-multipart>=0.0.6

# Utilities
python-dotenv>=1.0.0
redis>=5.0.0
psutil>=5.9.0

# Development
pytest>=7.4.0
pytest-cov>=4.1.0
black>=23.0.0
flake8>=6.1.0
mypy>=1.7.0
```

### External Services

- **Cohere API**: Primary language model provider
- **Redis**: Caching and session storage (optional)
- **Translation Service**: Built-in language processing

---

## License and Support

This documentation is part of the Vonova AI SaaS platform. For support and updates:

- **Repository**: [GitHub Repository Link]
- **Issues**: [Issue Tracker Link]
- **Documentation**: [Documentation Site]
- **Support**: [Support Email/Contact]

---

## Conclusion

The AI Article Generator provides a sophisticated multi-agent system for creating high-quality, SEO-optimized content in multiple languages. This comprehensive documentation covers:

- **Complete Architecture**: Multi-agent pipeline design and implementation
- **API Reference**: Detailed endpoints, schemas, and examples
- **Security Framework**: Comprehensive security best practices
- **Performance Optimization**: Caching, async processing, and monitoring
- **Testing Strategies**: Unit, integration, and load testing approaches
- **Deployment Guide**: Production-ready configurations and scaling
- **Development Workflow**: Setup, testing, and contribution guidelines

By following this documentation, developers can effectively understand, deploy, extend, and maintain the AI Article Generator service for production use cases.

### Fallback Mechanisms

1. **Agent-level**: Each agent has individual error handling
2. **Pipeline-level**: AgentManager provides fallback responses
3. **API-level**: FastAPI returns appropriate HTTP status codes

### Common Errors

- **422 Unprocessable Content**: Model availability issues
- **500 Internal Server Error**: Service configuration problems
- **400 Bad Request**: Invalid input parameters

## Usage Examples

### Basic Article Generation

```bash
curl -X POST "http://localhost:5010/generate_article" \
  -H "Content-Type: application/json" \
  -d '{"topic": "The Role of AI in Learning"}'
```

### Arabic Article Generation

```bash
curl -X POST "http://localhost:5010/generate_article" \
  -H "Content-Type: application/json" \
  -d '{"topic": "دور الذكاء الاصطناعي في التعليم"}'
```

## Performance Considerations

### Optimization Features

1. **Async Processing**: Non-blocking agent execution
2. **Connection Pooling**: Efficient API usage
3. **Retry Logic**: Automatic recovery from transient failures
4. **Logging**: Comprehensive monitoring and debugging

### Resource Usage

- **Memory**: Minimal footprint with efficient agent design
- **API Calls**: 3 calls per article (one per agent)
- **Response Time**: Typically 10-30 seconds per article

## Monitoring and Logging

### Log Levels

- **INFO**: Normal operation and agent status
- **ERROR**: Failures and exceptions
- **DEBUG**: Detailed execution flow (when enabled)

### Key Metrics

- Agent execution success rates
- API response times
- Error frequency and types
- Language translation accuracy

## Future Enhancements

### Planned Features

1. **Additional Models**: Support for multiple LLM providers
2. **Custom Templates**: User-defined article structures
3. **Batch Processing**: Multiple article generation
4. **Performance Metrics**: Built-in analytics dashboard
5. **Content Optimization**: Advanced SEO features

### Extensibility

The modular architecture allows for:
- Custom agent implementations
- Additional language support
- New content formats
- Integration with external services

## Troubleshooting

### Common Issues

1. **Model Deprecation**: Update model name in `cohere_client.py`
2. **API Key Issues**: Verify environment variables
3. **Rate Limiting**: Monitor API usage and implement backoff
4. **Translation Errors**: Check language detection logic

### Debug Mode

Enable detailed logging by setting:
```bash
LOG_LEVEL=DEBUG
```

## Dependencies

### Core Libraries

- `fastapi`: Web framework
- `langchain-cohere`: Cohere integration
- `python-dotenv`: Environment management
- `pydantic`: Data validation
- `uvicorn`: ASGI server

### External Services

- **Cohere API**: Language model provider
- **Translation Service**: Built-in language processing

## Security Considerations

### API Key Management

- Use environment variables (never hardcode)
- Rotate keys regularly
- Monitor usage for anomalies
- Implement rate limiting

### Input Validation

- Sanitize user topics
- Validate request formats
- Prevent injection attacks
- Limit content length

## License and Support

This documentation is part of the Vonova AI SaaS platform. For support and updates, refer to the project repository and issue tracking system.
