# Article AI Agents

A FastAPI-based web service that leverages AI agents powered by CrewAI and Cohere's language models to generate high-quality, structured blog articles on any given topic.

## Features

- **AI-Powered Article Generation**: Uses a crew of specialized AI agents (Planner, Writer, Editor) to create comprehensive blog posts
- **RESTful API**: Simple HTTP endpoints for article generation and health checks
- **Structured Workflow**: Multi-agent system ensures research, writing, and editing phases
- **Cohere Integration**: Utilizes Cohere's Command-R model for high-quality content generation
- **Comprehensive Logging**: Detailed logging for monitoring and debugging
- **CORS Support**: Configurable CORS settings for web integration
- **Environment-Based Configuration**: Flexible configuration through environment variables
- **Multilingual Support**: Automatic language detection and translation for Arabic topics

## Project Structure

```
article_ai_agents/
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables (create this)
├── .env.example            # Example environment variables file
├── .gitignore             # Git ignore rules
├── crew/                  # AI agents and crew management
│   ├── __init__.py
│   ├── agents.py          # Agent definitions (Planner, Writer, Editor)
│   ├── crew_manager.py    # Crew orchestration logic
│   └── tasks.py           # Task definitions for each agent
├── docs/                  # Documentation
│   └── Writer_Articles.md # Writer articles documentation
├── llm/                   # Language model configuration
│   ├── __init__.py        # Imports for Cohere LLM
│   └── cohere_llm.py      # Cohere LLM setup and configuration
├── models/                # Data models and schemas
│   ├── __init__.py
│   └── article_schema.py  # Pydantic models for API requests
└── utils/                 # Utility functions
    ├── __init__.py
    ├── logging_utils.py   # Logging configuration
    └── translation_utils.py # Translation and language detection utilities
```

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd article_ai_agents
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```env
   CO_API_KEY=your_actual_cohere_api_key
   LOG_LEVEL=INFO
AI_SERVICE_HOST=127.0.0.1
AI_SERVICE_PORT=5010
   CORS_ORIGINS=*
   CORS_ALLOW_CREDENTIALS=true
   CORS_ALLOW_METHODS=*
   CORS_ALLOW_HEADERS=*
   ```

   **Important**: Replace `your_actual_cohere_api_key` with your actual Cohere API key. You can get one from [Cohere's website](https://dashboard.cohere.com/api-keys).

5. **Run the server**:
   ```bash
   uvicorn main:app --reload --port 5010
   ```

## Usage

### Running the Server

Start the FastAPI server using one of these methods:

**Using uvicorn directly (recommended for development)**:
```bash
uvicorn main:app --reload --port 5010
```

**Running the Python script directly**:
```bash
python main.py
```

The API will be available at `http://127.0.0.1:5010`

### API Documentation

Once the server is running, you can access:
- **Interactive API docs (Swagger UI)**: `http://127.0.0.1:5010/docs`
- **Alternative API docs (ReDoc)**: `http://127.0.0.1:5010/redoc`

### API Endpoints

#### Generate Article
- **Endpoint**: `POST /generate_article`
- **Description**: Generates a blog article on the specified topic using a multi-agent AI system
- **Request Body**:
  ```json
  {
    "topic": "Artificial Intelligence in Healthcare"
  }
  ```
- **Response**:
  ```json
  {
    "article": "# Artificial Intelligence in Healthcare\n\n## Introduction\n\n..."
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Topic is empty or invalid
  - `500 Internal Server Error`: Error during article generation

#### Health Check
- **Endpoint**: `GET /health`
- **Description**: Checks the service health status
- **Response**:
  ```json
  {
    "status": "healthy",
    "service": "article_generation_api"
  }
  ```

### Example Usage

#### Using curl
```bash
curl -X POST "http://127.0.0.1:5010/generate_article" \
     -H "Content-Type: application/json" \
     -d '{"topic": "Machine Learning Basics"}'
```

#### Using Python requests
```python
import requests

response = requests.post(
    "http://127.0.0.1:5010/generate_article",
    json={"topic": "Machine Learning Basics"}
)

if response.status_code == 200:
    article = response.json()["article"]
    print(article)
else:
    print(f"Error: {response.status_code} - {response.json()}")
```

#### Using JavaScript (fetch)
```javascript
fetch('http://127.0.0.1:5010/generate_article', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    topic: 'Machine Learning Basics'
  })
})
.then(response => response.json())
.then(data => console.log(data.article))
.catch(error => console.error('Error:', error));
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `CO_API_KEY` | Cohere API key | - | ✅ Yes |
| `LOG_LEVEL` | Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL) | INFO | No |
| `AI_SERVICE_HOST` | Server host address | 127.0.0.1 | No |
| `AI_SERVICE_PORT` | Server port | 5010 | No |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | * | No |
| `CORS_ALLOW_CREDENTIALS` | Allow CORS credentials | true | No |
| `CORS_ALLOW_METHODS` | Allowed CORS methods (comma-separated) | * | No |
| `CORS_ALLOW_HEADERS` | Allowed CORS headers (comma-separated) | * | No |

### LLM Configuration

The Cohere LLM is configured in `llm/cohere_llm.py` with the following settings:
- **Model**: `command-r-plus-08-2024`
- **Temperature**: `0.0` (deterministic output)
- **Max Tokens**: `4000`

You can modify these settings by editing the `LLMConfig` class in `llm/cohere_llm.py`.

## Dependencies

Core dependencies as specified in `requirements.txt`:

- **crewai**: Multi-agent framework for orchestrating AI agents
- **langchain-cohere**: Cohere integration for LangChain
- **python-dotenv**: Environment variable management
- **fastapi**: Modern web framework for building APIs
- **uvicorn**: ASGI server for FastAPI
- **pydantic**: Data validation and serialization

For the complete list with versions, see `requirements.txt`.

## How It Works

The system uses a three-agent crew approach powered by CrewAI:

### 1. **Planner Agent**
- **Role**: Content Planner
- **Responsibilities**:
  - Research the topic and identify latest trends
  - Identify key players and credible sources
  - Analyze target audience interests and challenges
  - Create a structured outline with introduction, main points, and conclusion
  - Suggest relevant SEO keywords and trusted references

### 2. **Writer Agent**
- **Role**: Content Writer
- **Responsibilities**:
  - Expand the planner's outline into detailed content
  - Naturally integrate SEO keywords
  - Use engaging section headings
  - Ensure proper structure with intro, body, and conclusion
  - Maintain factual accuracy with citations
  - Proofread for grammar and clarity

### 3. **Editor Agent**
- **Role**: Editor
- **Responsibilities**:
  - Fact-check all information
  - Improve grammar and style
  - Ensure consistent, neutral tone
  - Verify proper structure and formatting
  - Check for clarity and readability
  - Polish the final output for publication

### Workflow
1. User sends a POST request with a topic
2. System automatically detects the language of the topic (supports English and Arabic)
3. If the topic is in Arabic, it is translated to English for processing by the AI agents
4. CrewManager initializes all three agents with the Cohere LLM
5. Agents execute tasks sequentially (Plan → Write → Edit)
6. If the original topic was in Arabic, the final article is translated back to Arabic
7. Final polished article is returned in markdown format in the original language

## Logging

The application generates comprehensive logs:

- **Console Output**: Real-time monitoring of operations
- **File Output**: Persistent logs stored in `article_ai.log`
- **Format**: `YYYY-MM-DD HH:MM:SS - logger_name - LEVEL - message`

Log levels can be configured via the `LOG_LEVEL` environment variable. Available levels:
- `DEBUG`: Detailed diagnostic information
- `INFO`: General informational messages (default)
- `WARNING`: Warning messages
- `ERROR`: Error messages
- `CRITICAL`: Critical error messages

## Error Handling

The API includes comprehensive error handling:

- **Input Validation**: Checks for empty or invalid topics (400 Bad Request)
- **API Key Validation**: Ensures Cohere API key is properly configured
- **Exception Handling**: Catches and logs all errors during article generation
- **Proper HTTP Status Codes**: 
  - `200`: Success
  - `400`: Bad Request (invalid input)
  - `500`: Internal Server Error
- **Detailed Error Logging**: All errors are logged with full stack traces



## Acknowledgments

- Built with [CrewAI](https://github.com/joaomdmoura/crewAI) for multi-agent orchestration
- Powered by [Cohere](https://cohere.com/) language models
- API framework by [FastAPI](https://fastapi.tiangolo.com/)

---
