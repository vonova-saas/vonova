# Learning Roadmap Generator Documentation

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
- **`main.py`**: Defines the FastAPI application, API endpoint, and request/response handling. It orchestrates the roadmap generation process.
- **`models/roadmap_schema.py`**: Defines Pydantic models for data validation and serialization of roadmap structures.
- **`services/roadmap_generator.py`**: Contains the core logic for generating roadmaps using the Cohere AI API.
- **`services/cohere_api_client.py`**: Handles interactions with the Cohere AI API.
- **`services/roadmap_formatter.py`**: Formats and structures the generated roadmap data.
- **`utils/logging_utils.py`**: Provides logging utilities for the application.
- **`requirements.txt`**: Lists the required Python packages and their versions.

- **`docs/`**: Documentation files.
- **`Dockerfile`**: Containerization configuration.

## Module: `main.py`

### Purpose
`main.py` is the entry point of the application. It sets up a FastAPI server with CORS middleware, defines the `/generate-roadmap` endpoint, and handles incoming HTTP requests to generate learning roadmaps.

### Dependencies
- **FastAPI**: Web framework for building the API.
- **Uvicorn**: ASGI server for running the FastAPI application.
- **pydantic**: For data validation and serialization.
- **cohere**: For interacting with the Cohere AI API.
- **python-dotenv**: For loading environment variables.
- **services.roadmap_generator**: Imports `RoadmapGenerator` for roadmap generation.
- **models.roadmap_schema**: Imports data models.
- **utils.logging_utils**: Imports logging utilities.

### Key Components

#### FastAPI Application
- **Initialization**:
  ```python
  app = FastAPI()
  app.add_middleware(
      CORSMiddleware,
      allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
      allow_credentials=os.getenv("CORS_ALLOW_CREDENTIALS", "true").lower() == "true",
      allow_methods=os.getenv("CORS_ALLOW_METHODS", "*").split(","),
      allow_headers=os.getenv("CORS_ALLOW_HEADERS", "*").split(","),
  )
  ```
  Creates a FastAPI application with configurable CORS middleware using environment variables.

- **API Key and Logging**:
  ```python
  COHERE_API_KEY = os.getenv("COHERE_API_KEY")
  logger = setup_ai_logger(__name__, "roadmap_ai.log", LOG_LEVEL)
  generator = RoadmapGenerator(COHERE_API_KEY)
  ```
  Loads the Cohere API key and sets up logging, then initializes the `RoadmapGenerator`.

#### Endpoint: `GET /`
- **Method**: GET
- **Purpose**: Returns service information and available endpoints.
- **Response**: Returns a JSON object with service status and list of available endpoints.

#### Endpoint: `GET /health`
- **Method**: GET
- **Purpose**: Returns the health status of the service.
- **Response**: Returns `{"status": "healthy", "service": "roadmap-ai"}`.

#### Endpoint: `/generate-roadmap`
- **Method**: POST
- **Purpose**: Generates a learning roadmap based on the provided topic, skill level, and duration.
- **Request Body**: Expects a JSON object with the following fields:
  - `topic: str`: The subject or topic for the roadmap (e.g., "AI", "Backend"). **Required**.
  - `skill_level: str` (optional, default: "beginner"): The user’s skill level ("beginner", "intermediate", or "advanced").
  - `duration_weeks: int` (optional, default: 12): The duration of the roadmap in weeks (minimum 1).
- **Response**: Returns a JSON object with the following structure:
  - `status: bool`: Indicates success (`true`) or failure (`false`).
  - `text: dict`: Contains the `query` (topic) and `chapters` (topics grouped by phases: Introduction & Basics, Core Development, Advanced Topics, Specialization & Project).
  - `tree: List[dict]`: A hierarchical structure with the topic as the root, phases as children, and topics as leaf nodes.
  - `roadmapId: str`: A unique UUID for the roadmap.
  - `metadata: dict`: Includes `generated` (roadmap title) and `summary` (duration and total hours).
- **Error Handling**:
  - Returns a JSON response with `status: false` and an `error` message for invalid inputs or internal errors (status code 500).
- **Implementation**:
  ```python
  @app.post("/generate-roadmap")
  async def generate_roadmap_api(request: RoadmapRequest):
      # Validation via Pydantic model, logging, and calls RoadmapGenerator.generate_roadmap
  ```

#### Main Execution
- **Command**:
  ```python
  if __name__ == "__main__":
      uvicorn.run("main:app", host="127.0.0.1", port=5000, reload=True)
  ```
  Starts the server on `127.0.0.1:5000` with auto-reload enabled for development.

### Usage
To run the server:
1. Ensure dependencies are installed (see `requirements.txt`).
2. Set the `COHERE_API_KEY` environment variable in a `.env` file.
3. Run the server:
   ```bash
   uvicorn main:app --reload --port 5000
   ```
4. Send a POST request to generate a roadmap:
   ```bash
   curl -X 'POST' \
     'http://127.0.0.1:5000/generate-roadmap' \
     -H 'accept: application/json' \
     -H 'Content-Type: application/json' \
     -d '{
     "topic": "AI",
     "skill_level": "beginner",
     "duration_weeks": 5
   }'
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
    - Initializes the CohereAPIClient, RoadmapFormatter, and logger.
  - `generate_roadmap(self, topic, skill_level="beginner", duration_weeks=12)`:
    - Constructs a prompt for the Cohere AI API specifying the topic, skill level, and duration.
    - Calls the CohereAPIClient to get the response.
    - Parses the JSON response, validates it with Pydantic RoadmapData model.
    - Calls RoadmapFormatter to generate the final JSON response.
    - Returns the formatted roadmap response.

### Usage
The `services/roadmap_generator.py` file is used internally by `main.py`. The `RoadmapGenerator` class is instantiated in `main.py` with the Cohere API key and called by the `/generate-roadmap` endpoint. To use the Cohere API, ensure a valid API key is provided in the `.env` file.

### Example Response
A sample request:
```bash
curl -X 'POST' \
  'http://127.0.0.1:5000/generate-roadmap' \
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
  - **Solution**: Stop the server, clear any cache, ensure the updated `main.py` and `services/roadmap_generator.py` are saved, and restart the server.
- **Issue: Invalid JSON response**:
  - **Cause**: Malformed JSON from Cohere or parsing errors.
  - **Solution**: Check logs for Cohere API errors. The application expects valid JSON from the API.

## Development Notes
- **Environment Setup**:
  - Install dependencies: `pip install -r requirements.txt`.
  - Obtain a valid Cohere API key and set `COHERE_API_KEY` in the `.env` file.
- **Testing**:
  - Use tools like `curl`, Postman, or Swagger UI (available at `http://127.0.0.1:5000/docs`) to test the API.
  - Validate responses against the expected structure.
- **Extensibility**:
  - Enhance request validation in `main.py` for specific topics or durations.
  - Extend `RoadmapGenerator` to support additional AI models or custom fallback roadmaps.
  - Add more metadata to the `tree` structure (e.g., resource links for topics).

## Conclusion
The Learning Roadmap Generator provides a robust and flexible way to create customized learning plans using FastAPI and Cohere AI. The `main.py` file handles the API interface, while `services/roadmap_generator.py` manages roadmap generation and formatting. By following this documentation, developers can understand, run, and extend the application effectively.
