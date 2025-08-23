# Learning Roadmap Generator

## Overview
The Learning Roadmap Generator is a FastAPI-based web application that generates customized learning roadmaps for various topics using the Cohere AI API. Users can specify a topic, skill level, duration to receive a structured JSON response containing a learning roadmap with weekly topics, objectives, resources, projects, milestones, and a hierarchical topic tree.

## Prerequisites
- **Python**: Version 3.8 or higher.
- **pip**: Python package manager.
- **Virtualenv** (optional but recommended): For creating isolated Python environments.
- **Cohere API Key**: Obtain a valid API key from [Cohere](https://cohere.ai/).

## Project Structure
```
models/roadmap_model/
├── main.py                 # FastAPI application and endpoints
├── requirements.txt        # Python dependencies
├── README.md              # Setup and usage instructions
├── .env.example           # Environment variables template
├── Dockerfile             # Containerization configuration
├── .gitignore            # Git ignore rules
├── docs/                  # Documentation
│   └── Learning_Roadmap_Generator_Documentation.markdown
├── models/                # Data models
│   ├── __init__.py
│   └── roadmap.py
├── services/              # Business logic services
│   ├── __init__.py
│   └── roadmap_generator.py
└── utils/                 # Utility functions
    ├── __init__.py
    └── logging_utils.py
```

## Setup Instructions

### 1. Clone the Repository
If the project is hosted in a repository, clone it to your local machine:
```bash
git clone <https://github.com/vonova-saas/Ai-Gerneration-RoadMap.git>
cd learning-roadmap-generator
```

Alternatively, create a new directory and save `main.py`, `model.py`, and `requirements.txt` in it.

### 2. Create and Activate a Virtual Environment
To isolate dependencies, create a virtual environment:

#### On Windows
```bash
python -m venv venv
venv\Scripts\activate
```

#### On macOS/Linux
```bash
python3 -m venv venv
source venv/bin/activate
```

After activation, your terminal should show the virtual environment name (e.g., `(venv)`).

### 3. Install Requirements
Install the required Python packages using `pip`. Ensure `requirements.txt` contains:
```
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.0
cohere==4.37
requests==2.31.0
python-multipart==0.0.6
```

Then, install the dependencies:
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Create a `.env` file in the project root directory with the following configuration:

```bash
# Cohere API Configuration
COHERE_API_KEY=your_cohere_api_key_here

# AI Service Configuration  
AI_SERVICE_HOST=127.0.0.1
AI_SERVICE_PORT=5000

# Logging Configuration
LOG_LEVEL=INFO
```

To obtain a Cohere API key:
1. Sign up or log in at [Cohere](https://cohere.ai/).
2. Navigate to the API keys section in your dashboard.
3. Copy the API key and add it to your `.env` file.

**Note**: Make sure to keep your `.env` file secure and never commit it to version control. Use the provided `.env.example` file as a template.

### 5. Run the Application
Start the FastAPI server using Uvicorn:
```bash
python main.py api
```
---
```bash
uvicorn main:app --reload
```

This command runs the server on `http://127.0.0.1:5000` with auto-reload enabled for development. You should see output indicating the server is running:
```
INFO:     Will watch for changes in these directories: [...]
INFO:     Uvicorn running on http://127.0.0.1:5000 (Press CTRL+C to quit)
```

### 6. Test the Application
Use `curl`, Postman, or a browser to send a POST request to the `/generate-roadmap` endpoint. Example using `curl`:
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

The response will be a JSON object containing the roadmap, with a hierarchical `tree` structure, `chapters`, and `metadata`.

Alternatively, access the interactive API documentation at:
- Swagger UI: `http://127.0.0.1:5000/docs`
- ReDoc: `http://127.0.0.1:5000/redoc`

### 7. Deactivate the Virtual Environment
When finished, deactivate the virtual environment:
```bash
deactivate
```

## Troubleshooting
- **Error: "ModuleNotFoundError: No module named 'fastapi'"**:
  - Ensure the virtual environment is activated and dependencies are installed (`pip install -r requirements.txt`).
- **Error: "Cohere API request failed"**:
  - Verify the API key in your `.env` file is correct and valid.
  - Check your internet connection.
- **Error: "COHERE_API_KEY environment variable is required"**:
  - Ensure you have created a `.env` file with the required environment variables.
  - Verify the `.env` file is in the correct directory (project root).
  - Check that the variable names in `.env` match the expected names exactly.
- **Error: Server not responding**:
  - Ensure the server is running (`python main.py api`) and the port `5000` (default) is not in use.
  - Check that the `AI_SERVICE_PORT` in your `.env` file matches the port you're trying to access.
  - Stop and restart the server if needed.

## Notes
- The application requires an active internet connection to communicate with the Cohere API.
- Ensure `main.py`, `model.py`, and `requirements.txt` are in the same directory.
- For production, consider using a WSGI server like Gunicorn instead of Uvicorn's development server, and disable `reload=True`.
- The application now uses environment variables for configuration, making it more flexible and secure.

## License
This project is for educational purposes and provided as-is. Ensure compliance with Cohere's API usage terms.
