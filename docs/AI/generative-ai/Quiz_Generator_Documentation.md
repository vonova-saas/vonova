# AI Quiz Generator Documentation

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [System Architecture](#system-architecture)
- [API Documentation](#api-documentation)
  - [Endpoint: POST `/generate-quiz`](#endpoint-post-generate-quiz)
  - [Request Schema (QuizRequest)](#request-schema-quizrequest)
  - [Response Schema (QuizResponse)](#response-schema-quizresponse)
- [Usage Examples](#usage-examples)
  - [Basic Quiz Generation](#basic-quiz-generation)
  - [Multi-language Quiz (Arabic)](#multi-language-quiz-arabic)
- [Core Code Implementation](#core-code-implementation)
  - [Essential Data Models](#essential-data-models)
  - [Core Quiz Generation Function](#core-quiz-generation-function)
- [Generator Details](#generator-details)
  - [Role and Responsibilities](#role-and-responsibilities)
  - [Configuration](#configuration)
  - [Generation Process](#generation-process)
  - [Question Types](#question-types)
  - [Difficulty Levels](#difficulty-levels)
- [Configuration and Customization](#configuration-and-customization)
  - [Environment Variables](#environment-variables)
  - [Language Support](#language-support)
  - [Dependencies](#dependencies)
- [Performance](#performance)
- [Error Handling](#error-handling)
  - [Input Validation Errors](#input-validation-errors)
  - [Service Errors](#service-errors)
  - [Generation Errors](#generation-errors)
  - [Error Response Format](#error-response-format)
- [Troubleshooting](#troubleshooting)
  - [Common Issues](#common-issues)
  - [Debug Mode](#debug-mode)
- [Future Enhancements](#future-enhancements)
  - [Planned Features](#planned-features)
  - [Advanced Features](#advanced-features)
- [Integration](#integration)
  - [Part of AI Services Ecosystem](#part-of-ai-services-ecosystem)
  - [API Documentation](#api-documentation-1)
- [Development](#development)
  - [Local Setup](#local-setup)
- [License](#license)

## Overview
The **AI Quiz Generator** is an intelligent web service that creates customized quizzes on any topic using advanced AI models. The system supports multiple languages, question types, and difficulty levels, making it ideal for educational platforms, training systems, and assessment tools.

## Features
- **Multi-language Support**: Generate quizzes from topics in any language with automatic translation
- **Multiple Question Types**: Multiple Choice (MCQ) and True/False questions
- **Difficulty Levels**: Easy, Medium, and Hard settings with intelligent question generation
- **Customizable Length**: Generate 1-50 questions per quiz
- **AI-Powered**: Uses Cohere's advanced language models for high-quality content
- **RESTful API**: Clean FastAPI endpoint for seamless integration
- **Structured Output**: Consistent JSON format for easy processing

## Project Structure

```
AI_Quiz_Generator/
├── model/
│   └── quiz_schema.py      # Pydantic models for request/response validation
├── llm/
│   └── cohere_llm.py       # Cohere AI integration for quiz generation
├── utils/
│   └── translation_utils.py # Language detection and translation utilities
└── README.md               # Project documentation
```

## System Architecture

The system employs a streamlined, production-ready workflow:

1. **Language Detection & Translation**: Automatically detects input language and translates to English
2. **Quiz Generation**: Uses Cohere's command-a-03-2025 model to generate structured questions
3. **Response Formatting**: Returns clean, ready-to-use JSON with correct answers
4. **Validation**: Ensures proper JSON structure and question format

## API Documentation

### Endpoint: POST `/generate-quiz`

#### Request Schema (QuizRequest)

```json
{
  "topic": "string",           // Quiz topic in any language (required, min 1 char)
  "total_questions": 10,       // Total number of questions (1-50, required)
  "mc_questions": 7,           // Number of multiple-choice questions (0-50, required)
  "tf_questions": 3,           // Number of true/false questions (0-50, required)
  "level": "medium"            // Difficulty level in any language (required, min 1 char)
}
```

#### Response Schema (QuizResponse)

```json
{
  "topic": "string",
  "level": "string", 
  "total_questions": 10,
  "questions": [
    {
      "type": "mc",
      "question": "What is...?",
      "options": ["A: Option 1", "B: Option 2", "C: Option 3", "D: Option 4"],
      "correct_answer": "A"
    },
    {
      "type": "tf",
      "question": "Statement about topic?",
      "correct_answer": "True"
    }
  ]
}
```

## Usage Examples

### Basic Quiz Generation

```bash
curl -X POST "http://localhost:8000/generate-quiz" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Python Programming",
    "total_questions": 5,
    "mc_questions": 3,
    "tf_questions": 2,
    "level": "medium"
  }'
```

### Multi-language Quiz (Arabic)

```bash
curl -X POST "http://localhost:8000/generate-quiz" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "الرياضيات",
    "total_questions": 8,
    "mc_questions": 5,
    "tf_questions": 3,
    "level": "سهل"
  }'
```

## Core Code Implementation

### Essential Data Models

```python
from pydantic import BaseModel, Field, conint, constr

class QuizRequest(BaseModel):
    topic: constr(min_length=1, strip_whitespace=True)
    total_questions: conint(ge=1, le=50)
    mc_questions: conint(ge=0, le=50)
    tf_questions: conint(ge=0, le=50)
    level: constr(min_length=1)

class QuizResponse(BaseModel):
    topic: str
    level: str
    total_questions: int
    questions: list
```

### Core Quiz Generation Function

```python
async def generate_quiz(topic: str, total_questions: int, mc_questions: int, tf_questions: int, level: str) -> dict:
    english_topic = await process_user_input(topic)
    
    difficulty_map = {
        "easy": "simple and basic",
        "medium": "moderate questions with some depth", 
        "hard": "challenging questions requiring advanced knowledge"
    }
    difficulty_desc = difficulty_map.get(level.lower(), "moderate questions with some depth")

    prompt = f"Generate exactly {total_questions} quiz questions on '{english_topic}' at {difficulty_desc} level. Exactly {mc_questions} multiple-choice and {tf_questions} true/false. Return valid JSON only."

    response = await cohere_async_client.chat(
        model='command-a-03-2025',
        message=prompt,
        temperature=0.3
    )
    
    return json.loads(response.text.strip())
```

### Main API Endpoint (app.py)

```python
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from model.quiz_schema import QuizRequest, QuizResponse
from llm.cohere_llm import generate_quiz
import logging

app = FastAPI(
    title="AI Quiz Generator API",
    description="Generate intelligent quizzes on any topic using AI",
    version="2.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/generate-quiz", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
async def create_quiz(request: QuizRequest):
    """
    Generate a customized quiz based on the provided parameters.
    
    - **topic**: Quiz topic in any language
    - **total_questions**: Total number of questions (1-50)
    - **mc_questions**: Number of multiple choice questions (0-50)
    - **tf_questions**: Number of true/false questions (0-50)
    - **level**: Difficulty level (easy, medium, hard)
    """
    try:
        # Validate question counts
        if request.mc_questions + request.tf_questions != request.total_questions:
            raise HTTPException(
                status_code=400,
                detail="Sum of mc_questions and tf_questions must equal total_questions"
            )
        
        # Generate quiz
        quiz_data = await generate_quiz(
            topic=request.topic,
            total_questions=request.total_questions,
            mc_questions=request.mc_questions,
            tf_questions=request.tf_questions,
            level=request.level
        )
        
        return QuizResponse(**quiz_data)
        
    except Exception as e:
        logging.error(f"Quiz generation failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Quiz generation failed: {str(e)}"
        )

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "healthy", "service": "quiz-generator"}
```

### Language Processing Module (utils/translation_utils.py)

```python
import cohere
from typing import Optional
import logging

cohere_client = cohere.Client(os.getenv("COHERE_API_KEY"))

async def detect_language(text: str) -> str:
    """
    Detect the language of the input text.
    Returns ISO 639-1 language code.
    """
    try:
        response = cohere_client.detect_language(text)
        return response.language_code
    except Exception as e:
        logging.warning(f"Language detection failed: {e}")
        return "en"  # Default to English

async def translate_to_english(text: str, source_lang: str) -> str:
    """
    Translate text to English if not already in English.
    """
    if source_lang == "en":
        return text
    
    try:
        response = cohere_client.translate(
            text=text,
            source_lang=source_lang,
            target_lang="en"
        )
        return response.text
    except Exception as e:
        logging.warning(f"Translation failed: {e}")
        return text  # Return original if translation fails

async def process_user_input(topic: str) -> str:
    """
    Process user input: detect language and translate to English if needed.
    """
    detected_lang = await detect_language(topic)
    english_topic = await translate_to_english(topic, detected_lang)
    return english_topic
```

### Cohere LLM Integration (llm/cohere_llm.py)

```python
import cohere
import json
import os
from typing import Dict, Any
import logging

# Initialize async Cohere client
cohere_async_client = cohere.AsyncClient(os.getenv("COHERE_API_KEY"))

class QuizGenerator:
    def __init__(self):
        self.model = 'command-a-03-2025'
        self.temperature = 0.3
        self.max_tokens = 4000
    
    async def generate_quiz_content(self, prompt: str) -> Dict[str, Any]:
        """
        Generate quiz content using Cohere's language model.
        """
        try:
            response = await cohere_async_client.chat(
                model=self.model,
                message=prompt,
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            
            # Parse and validate JSON response
            quiz_data = json.loads(response.text.strip())
            return self._validate_quiz_structure(quiz_data)
            
        except json.JSONDecodeError as e:
            logging.error(f"Invalid JSON response: {e}")
            raise ValueError("Failed to parse quiz data from AI response")
        except Exception as e:
            logging.error(f"Quiz generation failed: {e}")
            raise
    
    def _validate_quiz_structure(self, quiz_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate the structure and content of generated quiz data.
        """
        required_fields = ['topic', 'level', 'total_questions', 'questions']
        for field in required_fields:
            if field not in quiz_data:
                raise ValueError(f"Missing required field: {field}")
        
        # Validate questions
        questions = quiz_data.get('questions', [])
        if not isinstance(questions, list):
            raise ValueError("Questions must be a list")
        
        for i, question in enumerate(questions):
            if not isinstance(question, dict):
                raise ValueError(f"Question {i+1} must be a dictionary")
            
            if question.get('type') == 'mc':
                required_mc_fields = ['question', 'options', 'correct_answer']
                for field in required_mc_fields:
                    if field not in question:
                        raise ValueError(f"MC question {i+1} missing field: {field}")
                
                if not isinstance(question['options'], list) or len(question['options']) != 4:
                    raise ValueError(f"MC question {i+1} must have exactly 4 options")
            
            elif question.get('type') == 'tf':
                required_tf_fields = ['question', 'correct_answer']
                for field in required_tf_fields:
                    if field not in question:
                        raise ValueError(f"TF question {i+1} missing field: {field}")
        
        return quiz_data

# Global instance
quiz_generator = QuizGenerator()
```

## Generator Details

### Role and Responsibilities
The generator is responsible for creating professional educational quizzes:
- Generating exactly the requested number of questions
- Creating multiple-choice questions with 4 options (A–D) and one correct answer
- Creating true/false questions with clear correct answers
- Maintaining difficulty level consistency (easy, medium, hard)
- Ensuring factual accuracy and educational value
- Outputting valid JSON structure only

### Configuration
The generator uses Cohere's command-a-03-2025 model with optimized parameters:
- **Model**: command-a-03-2025
- **Temperature**: 0.3 (balanced creativity and consistency)
- **Structured Output**: Enforced through precise prompt engineering

### Generation Process
1. **Input Processing**: Detect language and translate to English if needed
2. **Difficulty Mapping**: Map user input to standardized difficulty levels
3. **Question Generation**: Create questions based on topic and difficulty
4. **Structure Enforcement**: Ensure proper JSON format
5. **Validation**: Verify question count and structure integrity

### Question Types

#### Multiple Choice (MCQ)
- 4 options (A, B, C, D)
- One correct answer
- Suitable for testing detailed knowledge
- Options are carefully crafted to be plausible but distinct

#### True/False
- Binary choice questions
- Ideal for checking conceptual understanding
- Quick assessment format
- Clear, unambiguous statements

### Difficulty Levels

- **Easy**: Simple and basic questions
  - Fundamental concepts
  - Clear, straightforward answers
  - Suitable for beginners

- **Medium**: Moderate questions with some depth
  - Requires some prior knowledge
  - May involve multi-step reasoning
  - Balanced complexity

- **Hard**: Challenging questions requiring advanced knowledge
  - Complex scenarios
  - Advanced concepts
  - Suitable for expert assessment

## Configuration and Customization

### Environment Variables

Create a `.env` file in the project root:

```env
COHERE_API_KEY=your_cohere_api_key_here
LOG_LEVEL=INFO
LOG_FILE=quiz_generator.log
```

### Language Support
Automatic language detection and translation using Cohere's translation model:
- Supports 100+ languages
- ISO 639-1 language codes
- Fallback to English if detection fails

### Dependencies

Required packages:
- `fastapi` - Web framework
- `pydantic` - Data validation
- `cohere` - AI model integration
- `python-dotenv` - Environment variable management
- `uvicorn` - ASGI server

## Performance

- **Generation Time**: 10–25 seconds depending on quiz size
- **Maximum Questions**: 50 questions per request
- **Concurrent Requests**: Supports multiple simultaneous requests
- **Memory Usage**: Optimized for efficient resource utilization

## Error Handling

The API includes comprehensive error handling for:

### Input Validation Errors
- Invalid topic format
- Out-of-range question counts
- Missing required fields

### Service Errors
- API key issues
- Model unavailability
- Network connectivity problems

### Generation Errors
- Invalid JSON response from AI
- Question count mismatch
- Translation failures

### Error Response Format
```json
{
  "detail": "Error description"
}
```

## Troubleshooting

### Common Issues

1. **Invalid JSON Response**
   - Automatic retry mechanism
   - Fallback to basic question generation

2. **Translation Failures**
   - Silent fallback to original input
   - Continues with English processing

3. **Question Count Mismatch**
   - Automatic adjustment of question distribution
   - Ensures total matches requested count

### Debug Mode
Enable detailed logging by setting:
```env
LOG_LEVEL=DEBUG
```

## Future Enhancements

### Planned Features
- **Open-ended Questions**: Support for essay-style questions
- **Difficulty Calibration**: Adaptive difficulty based on user performance
- **Export Formats**: Support for PDF, Excel, and LMS formats
- **Question Banks**: Persistent storage and reuse of questions
- **Analytics**: Performance tracking and usage statistics

### Advanced Features
- **Multi-modal Support**: Image-based questions
- **Collaborative Quizzes**: Multiple author support
- **Version Control**: Question versioning and history
- **Integration APIs**: LMS and platform integrations

## Integration

### Part of AI Services Ecosystem
The quiz generator integrates seamlessly with other Vonova AI services:
- **Article Generator**: Create educational content
- **Roadmap Generator**: Learning path creation
- **PDF Summary & Q&A**: Document-based assessment
- **Voice Interaction**: Audio quiz capabilities

**Cross-Service Integration**
- **Multi-language Support**: Consistent translation across all services
- **Unified API Design**: Standardized request/response patterns
- **Shared Authentication**: Single sign-on across AI services

**Workflow Examples**
1. **Course Creation**: Generate articles → Create learning roadmap → Extract key concepts → Generate assessment quizzes
2. **Document Assessment**: Upload PDF → Summarize content → Generate relevant questions → Create interactive quiz
3. **Multilingual Education**: Translate content → Generate localized quizzes → Voice-enabled learning

### API Documentation
Interactive documentation available at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

**Interactive Documentation Features**
- **Swagger UI**: Live API testing interface with request/response schema visualization
- **ReDoc**: Professional three-panel documentation layout with mobile-responsive design
- **Code Generation**: Automatic code examples in multiple programming languages
- **Parameter Exploration**: Interactive testing of all API endpoints

**Additional API Features**
- **OpenAPI Specification**: Available at `/openapi.json`
- **API Validation**: Automatic request/response validation
- **Rate Limiting**: Built-in protection against abuse
- **CORS Support**: Cross-origin resource sharing enabled
- **Health Checks**: Service status monitoring at `/health`

## Development

### Local Setup
1. Clone the repository
2. Install dependencies: `pip install -r requirements.txt`
3. Set up environment variables
4. Run the FastAPI server: `uvicorn app:app --reload`
5. Access the API at `http://localhost:8000`

**Development Tools and Scripts**

**Testing**
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_quiz_generator.py
```

**Code Quality**
```bash
# Format code
black app/ tests/

# Lint code
flake8 app/ tests/

# Type checking
mypy app/
```

**Development Utilities**
- **Hot Reload**: Automatic server restart on code changes
- **Debug Mode**: Enhanced logging and error details
- **API Testing**: Built-in test endpoints at `/test`
- **Performance Monitoring**: Request timing and metrics

**Contributing Guidelines**
- Follow PEP 8 style guidelines
- Use type hints for all functions
- Write comprehensive docstrings
- Maintain test coverage above 80%

## License

This project is part of the Vonova AI suite of intelligent services.

### License Information
- **License Type**: MIT License
- **Copyright**: © 2026 Vonova Technologies
- **Repository**: https://github.com/vonova/ai-quiz-generator

### Usage Rights
- Commercial use allowed
- Modification permitted
- Distribution allowed
- Private use allowed

### Conditions
- Must include license and copyright notice
- Must include original license file
- Software provided "as-is" without warranty

### Support and Community
- **Documentation**: Comprehensive guides and API reference
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Community forum for questions and ideas
- **Contributions**: Welcome via pull requests
- **Enterprise**: Commercial support available

---

*For more information about Vonova AI services and licensing, visit https://vonova.ai/docs*