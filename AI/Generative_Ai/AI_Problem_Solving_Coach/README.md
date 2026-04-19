# AI Problem Solving Coach API

A FastAPI-based AI coaching system that provides intelligent hints for coding problems. The system uses Google's Gemini 2.5 Flash model to analyze student code and provide strategic guidance for problem-solving.

## 🚀 Features

- **General Hints**: Get strategic guidance for coding problems
- **Error Analysis**: Analyze failing test cases and provide targeted hints
- **Language Detection**: Automatically detects programming language from submitted code
- **JSON Responses**: Structured responses with hints and suggested code
- **Multiple Endpoints**: Separate endpoints for general hints and error analysis

## 📁 Project Structure

```
AI_Problem_Solving_Coach/
agents/
|   __init__.py
|   gemini_client.py          # Gemini AI client wrapper
|   Prompts/
|       __init__.py
|       hint_prompt.py       # Prompt templates
models/
|   __init__.py
|   hint_schema.py           # Pydantic models
services/
|   __init__.py
|   hint_service.py         # Business logic
README.md                    # This file
```

## 🛠️ Setup Instructions

### Prerequisites

- Python 3.8 or higher
- Google Gemini API key

### Installation

1. **Clone or download the project**
2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**:
   - Copy `.env.example` to `.env`
   - Add your Gemini API key:
   ```env
   GEMINI_API_KEY = "your_gemini_api_key_here"
   ```

### Running the Application

The AI Problem Solving Coach endpoints are now integrated into the main Generative AI application. To run:

```bash
# Navigate to the main Generative AI directory
cd ../..
# Run the main application
uvicorn main:app --reload --port 5010
```

The server will start on `http://127.0.0.1:5010`

## 📡 API Endpoints

### 1. Generate Hint Endpoint
**POST** `/generate/hint`

Get strategic guidance for a coding problem without specific error analysis.

**Request Body**:
```json
{
    "problem": "Write a function that finds the maximum subarray sum",
    "submit_code": "def max_subarray(arr):\n    max_sum = 0\n    current_sum = 0\n    for num in arr:\n        current_sum = max(num, current_sum + num)\n        max_sum = max(max_sum, current_sum)\n    return max_sum",
    "testcase_fail": "Input: [-1, -2, -3], Expected: -1, Got: 0",
    "testCases": "[[-1, -2, -3], [1, 2, 3], [-2, 1, -3, 4, -1, 2, 1, -5, 4]]",
    "language_hint": "english"
}
```

**Response**:
```json
{
    "hint": "The issue is with handling all-negative arrays. Initialize max_sum to the first element instead of 0, or handle the case where all numbers are negative."
}
```

### 2. Generate Solution Endpoint
**POST** `/generate/solution`

Analyze failing test cases and provide targeted hints with code suggestions.

**Request Body**:
```json
{
    "problem": "Write a function that reverses a string",
    "language": "python",
    "testCases": "[['hello', 'olleh'], ['world', 'dlrow'], ['', '']]",
    "language_explanation": "english"
}
```

**Response**:
```json
{
    "solution": "def reverse(s):\n    return s[::-1]",
    "explanation": "Using Python string slicing with step -1 to reverse the string efficiently."
}
```

## 🧪 Testing

### Using curl

**Generate Hint**:
```bash
curl -X POST "http://127.0.0.1:5010/generate/hint" \
     -H "Content-Type: application/json" \
     -d '{
       "problem": "Write a function that adds two numbers",
       "submit_code": "def add(a, b):\n    return a + b",
       "testcase_fail": "Input: 2, 3, Expected: 5, Got: 5",
       "language_hint": "english"
     }'
```

**Generate Solution**:
```bash
curl -X POST "http://127.0.0.1:5010/generate/solution" \
     -H "Content-Type: application/json" \
     -d '{
       "problem": "Write a function that adds two numbers",
       "language": "python",
       "testCases": "[[2, 3, 5], [5, 7, 12], [0, 0, 0]]",
       "language_explanation": "english"
     }'
```

### Using Python

```python
import requests

# Generate hint
response = requests.post("http://127.0.0.1:5010/generate/hint", json={
    "problem": "Write a function that calculates factorial",
    "submit_code": "def factorial(n):\n    return n * factorial(n-1)",
    "testcase_fail": "Input: 5, Expected: 120, Got: RecursionError",
    "language_hint": "english"
})
print(response.json())

# Generate solution
response = requests.post("http://127.0.0.1:5010/generate/solution", json={
    "problem": "Write a function that calculates factorial",
    "language": "python",
    "testCases": "[[5, 120], [3, 6], [0, 1]]",
    "language_explanation": "english"
})
print(response.json())
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes |

### Model Configuration

- **Model**: `gemini-2.5-flash`
- **Response Format**: JSON
- **System Prompt**: Expert programming coach with language detection

## 🏗️ Architecture

### Components

1. **GeminiClient**: Wrapper for Google Gemini API
2. **HintPrompts**: Centralized prompt templates
3. **HintService**: Business logic for hint generation
4. **Pydantic Models**: Request/response validation
5. **FastAPI**: Web framework and API endpoints

### Data Flow

```
Request → FastAPI → HintService → GeminiClient → Gemini API
Response ← FastAPI ← HintService ← GeminiClient ← Gemini API
```

## 🚀 Features in Detail

### Language Detection
The system automatically detects the programming language from submitted code and provides suggestions in the same language.

### JSON Responses
All responses are structured JSON objects with:
- `hint`: Strategic guidance or error analysis
- `suggested_code`: Code suggestions (null for general hints)

### Error Handling
- Graceful error handling with meaningful messages
- JSON responses even for API errors
- Validation of request parameters

## 📝 Examples

### C++ String Concatenation Error
```json
{
    "problem": "Print Hello, name without quotes",
    "submit_code": "#include <iostream>\nusing namespace std;\nint main() {\n    string name;\n    cin >> name;\n    cout << \"Hello, \" - name << endl;\n    return 0;\n}",
    "testcase_fall": "Input: programmer, Expected: Hello, programmer, Got: Hello, ' - programmer"
}
```

**Response**:
```json
{
    "hint": "Use the stream insertion operator (<<) instead of subtraction (-) for string concatenation in C++.",
    "suggested_code": "#include <iostream>\nusing namespace std;\nint main() {\n    string name;\n    cin >> name;\n    cout << \"Hello, \" << name << endl;\n    return 0;\n}"
}
```

## 🔍 Troubleshooting

### Common Issues

1. **API Key Error**: Ensure GEMINI_API_KEY is set correctly in `.env`
2. **Model Not Found**: Verify the model name is supported by your API version
3. **JSON Parse Error**: Check if the model is returning valid JSON
4. **Import Errors**: Ensure all dependencies are installed

### Getting Help

- Check the API documentation at `http://127.0.0.1:5010/docs`
- Verify environment variables are correctly set
- Ensure all dependencies are installed

## 📄 License

This project is for educational purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📊 Performance

- **Response Time**: ~2-5 seconds per request
- **Model**: Gemini 2.5 Flash (optimized for speed)
- **Memory Usage**: ~50MB idle, ~200MB under load

---

**Note**: This system is designed to provide educational guidance, not complete solutions. It encourages students to think through problems systematically.# Problem-Solving-Coach
