# Learning Roadmap Generator Documentation

## Overview
The Learning Roadmap Generator is a FastAPI-based web application that generates customized learning roadmaps for various topics using the Cohere AI API. Users can specify a topic, skill level (beginner, intermediate, or advanced), duration (in weeks), and optional focus areas to receive a structured JSON response containing a learning roadmap. The roadmap includes weekly topics, objectives, resources, projects, milestones, and a hierarchical tree structure of the learning path.

This documentation covers two main files: `main.py` and `model.py`. Together, they implement the core functionality of the application, including the API endpoint, request handling, roadmap generation, and response formatting.

## Project Structure
- **`main.py`**: Defines the FastAPI application, API endpoint, and request/response handling. It orchestrates the roadmap generation process.
- **`model.py`**: Contains the core logic for generating roadmaps using the Cohere AI API and formatting the response.
- **`requirements.txt`**: Lists the required Python packages and their versions.

## File: `main.py`

### Purpose
`main.py` is the entry point of the application. It sets up a FastAPI server with CORS middleware, defines the `/generate-roadmap` endpoint, and handles incoming HTTP requests to generate learning roadmaps.

### Dependencies
- **FastAPI**: Web framework for building the API.
- **Uvicorn**: ASGI server for running the FastAPI application.
- **pydantic**: For data validation and serialization.
- **cohere**: For interacting with the Cohere AI API.
- **requests**, **python-multipart**: Additional utilities for HTTP requests and multipart form data.
- **model.py**: Imports `RoadmapGenerator` for roadmap generation.

### Key Components

#### FastAPI Application
- **Initialization**:
  ```python
  app = FastAPI()
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["*"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```
  Creates a FastAPI application with CORS middleware to allow requests from any origin, enabling cross-origin resource sharing.

- **API Key**:
  ```python
  API_KEY = "qRdRBtk41ZGyGuLUex0DGhMCHdhyU4t3cWEyu1oO"
  generator = RoadmapGenerator(API_KEY)
  ```
  Initializes the `RoadmapGenerator` with a Cohere API key for roadmap generation.

#### Endpoint: `/generate-roadmap`
- **Method**: POST
- **Purpose**: Generates a learning roadmap based on the provided topic, skill level, duration, and optional focus areas.
- **Request Body**: Expects a JSON object with the following fields:
  - `topic: str`: The subject or topic for the roadmap (e.g., "AI", "Backend"). Required.
  - `skill_level: str` (optional, default: "beginner"): The user’s skill level ("beginner", "intermediate", or "advanced").
  - `duration_weeks: int` (optional, default: 12): The duration of the roadmap in weeks (minimum 1).
  - `focus_areas: str or List[str]` (optional): Comma-separated string or list of focus areas (e.g., "Machine Learning, Deep Learning").
- **Response**: Returns a JSON object with the following structure:
  - `status: bool`: Indicates success (`true`) or failure (`false`).
  - `text: dict`: Contains the `query` (topic) and `chapters` (topics grouped by phases: First Steps, Core Concepts, Interactivity, Advanced).
  - `tree: List[dict]`: A hierarchical structure with the topic as the root, phases as children, and topics as leaf nodes.
  - `roadmapId: str`: A unique UUID for the roadmap.
  - `metadata: dict`: Includes `generated` (roadmap title) and `summary` (duration and total hours).
- **Error Handling**:
  - Returns a JSON response with `status: false` and an `error` message for invalid inputs or internal errors (status code 400).
- **Implementation**:
  ```python
  @app.post("/generate-roadmap")
  async def generate_roadmap_api(request: Request):
      # Request parsing, validation, and roadmap generation logic
  ```

#### Main Execution
- **Purpose**: Runs the FastAPI server using Uvicorn when executed with the `api` argument.
- **Command**:
  ```python
  if __name__ == "__main__":
      import sys
      if len(sys.argv) > 1 and sys.argv[1] == "api":
          uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
  ```
  Starts the server on `localhost:8000` with auto-reload enabled for development.

### Usage
To run the server:
1. Ensure dependencies are installed (see `requirements.txt`).
2. Save `main.py` and `model.py` in the same directory.
3. Run the server:
   ```bash
   python main.py api
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
     "duration_weeks": 5,
     "focus_areas": "Machine Learning, Deep Learning"
   }'
   ```

## File: `model.py`

### Purpose
`model.py` contains the core logic for generating learning roadmaps using the Cohere AI API. It defines the `RoadmapGenerator` class to create and format roadmaps.

### Dependencies
- **pydantic**: For data validation and serialization of roadmap structures.
- **cohere**: For generating roadmap content via the Cohere AI API.
- **json**, **re**, **uuid**: For JSON parsing, regex matching, and UUID generation.

### Key Components

#### Class: `RoadmapGenerator`
- **Purpose**: Handles roadmap generation and response formatting.
- **Methods**:
  - `__init__(self, api_key)`:
    - Initializes the Cohere client with the provided API key.
  - `generate_roadmap(self, topic, skill_level="beginner", duration_weeks=12, focus_areas=None)`:
    - Generates a roadmap using the Cohere AI API.
    - Constructs a prompt specifying the topic, skill level, duration, and optional focus areas.
    - Attempts to parse the JSON response from Cohere; falls back to `_parse_text_response` or `_create_fallback_roadmap` if parsing fails.
    - Filters milestones to ensure they align with valid weeks in the roadmap.
    - Returns a dictionary with the roadmap structure:
      - `title: str`: Roadmap title.
      - `overview: str`: Brief description of the roadmap.
      - `prerequisites: List[str]`: Prerequisites for the learner.
      - `weeks: List[dict]`: Weekly plans with week number, title, objectives, topics, resources, projects, and estimated hours.
      - `milestones: List[dict]`: Milestones with week number, milestone name, and deliverable.
      - `final_project: str`: Description of the capstone project.
      - `next_steps: List[str]`: Suggested next steps.
  - `_parse_text_response(self, text, topic, duration_weeks)`:
    - Parses non-JSON responses from Cohere into a roadmap structure.
    - Creates a basic roadmap with milestones based on duration (e.g., at 1/3 and 2/3 of the timeline).
    - Adjusts estimated hours for specific cases (e.g., 11 hours for "AI Foundations" with 3 weeks).
  - `_create_fallback_roadmap(self, topic, skill_level, duration_weeks)`:
    - Generates a default roadmap if the Cohere API fails.
    - Includes a basic structure with weeks, milestones, and projects.
    - Adjusts estimated hours similarly to `_parse_text_response`.
  - `generate_json_response(self, roadmap_data, topic, skill_level, duration_weeks)`:
    - Formats the roadmap into the final JSON response.
    - Groups topics into phases (First Steps, Core Concepts, Interactivity, Advanced) based on week distribution.
    - Creates a `tree` structure with the topic as the root, phases as children, and topics as leaf nodes (omitting `children` for leaf nodes).
    - Generates a unique `roadmapId` using UUID.
    - Includes metadata with the roadmap title and a summary of duration and total hours.

### Usage
The `model.py` file is used internally by `main.py`. The `RoadmapGenerator` class is instantiated in `main.py` with the Cohere API key and called by the `/generate-roadmap` endpoint. To use the Cohere API, ensure a valid API key is provided in `main.py`.

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
  "duration_weeks": 5,
  "focus_areas": "Machine Learning, Deep Learning"
}'
```

Produces a response like:
```json
{
  "status": true,
  "text": {
    "query": "AI",
    "chapters": {
      "First Steps": [
        "Introduction to AI Concepts",
        "History of AI",
        "Types of AI"
      ],
      "Core Concepts": [
        "Machine Learning Basics",
        "Data Preprocessing",
        "Supervised Learning"
      ],
      "Interactivity": [
        "Neural Networks",
        "Deep Learning Fundamentals",
        "Model Evaluation"
      ],
      "Advanced": [
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
          "name": "First Steps",
          "children": [
            {"name": "Introduction to AI Concepts"},
            {"name": "History of AI"},
            {"name": "Types of AI"}
          ]
        },
        {
          "name": "Core Concepts",
          "children": [
            {"name": "Machine Learning Basics"},
            {"name": "Data Preprocessing"},
            {"name": "Supervised Learning"}
          ]
        },
        {
          "name": "Interactivity",
          "children": [
            {"name": "Neural Networks"},
            {"name": "Deep Learning Fundamentals"},
            {"name": "Model Evaluation"}
          ]
        },
        {
          "name": "Advanced",
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
  - **Solution**: Verify the `API_KEY` in `main.py` and ensure internet connectivity.
- **Issue: Server not reflecting changes**:
  - **Cause**: Cached or old files in use.
  - **Solution**: Stop the server, clear any cache, ensure the updated `main.py` and `model.py` are saved, and restart the server.
- **Issue: Invalid JSON response**:
  - **Cause**: Malformed JSON from Cohere or parsing errors.
  - **Solution**: The application falls back to `_parse_text_response` or `_create_fallback_roadmap` to ensure a valid response. Check logs for Cohere API errors.

## Development Notes
- **Environment Setup**:
  - Install dependencies: `pip install -r requirements.txt`.
  - Obtain a valid Cohere API key and update `API_KEY` in `main.py`.
- **Testing**:
  - Use tools like `curl`, Postman, or Swagger UI (available at `http://127.0.0.1:8000/docs`) to test the API.
  - Validate responses against the expected structure.
- **Extensibility**:
  - Enhance request validation in `main.py` for specific topics or durations.
  - Extend `RoadmapGenerator` to support additional AI models or custom fallback roadmaps.
  - Add more metadata to the `tree` structure (e.g., resource links for topics).

## Conclusion
The Learning Roadmap Generator provides a robust and flexible way to create customized learning plans using FastAPI and Cohere AI. The `main.py` file handles the API interface, while `model.py` manages roadmap generation and formatting. By following this documentation, developers can understand, run, and extend the application effectively.