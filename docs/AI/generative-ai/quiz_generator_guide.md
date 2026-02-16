# AI Quiz Generator Documentation

## Overview
The **AI Quiz Generator** project is a FastAPI-based web service that generates high-quality, structured English quizzes (Multiple Choice + True/False) from any topic in any language using Cohere's latest models. This documentation focuses on the quiz generation process and system architecture.

## Project Architecture
The system employs a streamlined, production-ready workflow:
1. **Language Detection & Translation**: Automatically detects input language and translates to English  
2. **Quiz Generation**: Uses Cohere's command-a-03-2025 model to generate structured questions  
3. **Response Formatting**: Returns clean, ready-to-use JSON with correct answers  

## Generator Details

### Role and Responsibilities
The generator is responsible for creating professional educational quizzes. Key responsibilities include:
- Generating exactly the requested number of questions  
- Creating multiple-choice questions with 4 options (A–D) and one correct answer  
- Creating true/false questions with clear correct answers  
- Maintaining difficulty level consistency (easy, medium, hard)  
- Ensuring factual accuracy and educational value  
- Outputting valid JSON structure only  

### Configuration
The generator uses Cohere's command-a-03-2025 model with the following parameters:
- **Model**: command-a-03-2025  
- **Temperature**: 0.3  
- **Max Tokens**: 4000  
- **Structured Output**: Enforced through precise prompt engineering  

### Generation Process
1. **Input Processing**  
2. **Difficulty Mapping**  
3. **Question Generation**  
4. **Structure Enforcement**  
5. **Validation**  

### Output Format
Strict JSON output including topic, level, total_questions, and structured questions.

### Integration
Handles multilingual input and outputs standardized English quizzes.

## API Usage for Quiz Generation

```bash
curl -X POST "http://127.0.0.1:5035/generate-quiz"      -H "Content-Type: application/json"      -d '{
       "topic": "Machine Learning Fundamentals",
       "total_questions": 10,
       "mc_questions": 7,
       "tf_questions": 3,
       "level": "medium"
     }'
```

## Configuration and Customization

### Language Support
Automatic language detection and translation using Cohere's translation model.

### Environment Variables
- COHERE_API_KEY  
- LOG_LEVEL  
- LOG_FILE  

## Performance
10–25 seconds generation time, up to 50 questions per request.

## Troubleshooting
Handles invalid JSON, translation fallback, and question count mismatch.

## Future Enhancements
Open-ended questions, difficulty calibration, export formats.

## Dependencies
Cohere, FastAPI, Pydantic, logging utilities.
