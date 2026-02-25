# AI Quiz Generator

An intelligent quiz generation system that creates customized quizzes on any topic using AI. The system supports multiple languages, question types, and difficulty levels.

## Features

- **Multi-language Support**: Generate quizzes in any language with automatic translation
- **Multiple Question Types**: Multiple choice (MCQ) and True/False questions
- **Difficulty Levels**: Easy, Medium, and Hard difficulty settings
- **Customizable Quiz Length**: Generate 1-50 questions per quiz
- **AI-Powered**: Uses Cohere's advanced language models for intelligent question generation
- **RESTful API**: Clean FastAPI endpoint for easy integration

## Project Structure

```
AI_Quiz_Generator/
├── model/
│   └── quiz_schema.py      # Pydantic models for request/response validation
├── llm/
│   └── cohere_llm.py       # Cohere AI integration for quiz generation
├── utils/
│   └── translation_utils.py # Language detection and translation utilities
└── README.md               # This file
```

## API Endpoint

### POST `/generate-quiz`

Generates a customized quiz based on the provided parameters.

#### Request Schema (QuizRequest)

```json
{
  "topic": "string",           // Quiz topic in any language (required)
  "total_questions": 10,       // Total number of questions (1-50, required)
  "mc_questions": 7,           // Number of multiple-choice questions (0-50, required)
  "tf_questions": 3,           // Number of true/false questions (0-50, required)
  "level": "medium"            // Difficulty level in any language (required)
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

## Configuration

### Environment Variables

Create a `.env` file in the project root with:

```env
COHERE_API_KEY=your_cohere_api_key_here
```

### Required Dependencies

- `fastapi` - Web framework
- `pydantic` - Data validation
- `cohere` - AI model integration
- `python-dotenv` - Environment variable management
- `uvicorn` - ASGI server

## How It Works

1. **Language Detection**: Automatically detects the input language using Cohere's translation model
2. **Translation**: Translates non-English inputs to English for processing
3. **Quiz Generation**: Uses Cohere's `command-a-03-2025` model to generate questions
4. **Validation**: Ensures proper JSON structure and question format
5. **Response**: Returns structured quiz data with questions and answers

## Question Types

### Multiple Choice (MCQ)
- 4 options (A, B, C, D)
- One correct answer
- Suitable for testing detailed knowledge

### True/False
- Binary choice questions
- Ideal for checking conceptual understanding
- Quick assessment format

## Difficulty Levels

The system supports three difficulty levels with intelligent question generation:

- **Easy**: Simple and basic questions
- **Medium**: Moderate questions with some depth
- **Hard**: Challenging questions requiring advanced knowledge

## Error Handling

The API includes comprehensive error handling for:
- Invalid input parameters
- API service unavailability
- Malformed requests
- Question generation failures

## Integration

The quiz generator is part of a larger AI services ecosystem that includes:
- Article Generator
- Roadmap Generator  
- PDF Summary & Q&A
- Voice interaction capabilities

## Development

To run the quiz generator locally:

1. Install dependencies: `pip install -r requirements.txt`
2. Set up environment variables
3. Run the FastAPI server: `uvicorn app:app --reload`
4. Access the API at `http://localhost:8000`

## API Documentation

Interactive API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## License

This project is part of the Vonova AI suite of intelligent services.