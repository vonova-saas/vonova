# Learning Roadmap Generator

## Overview
The Learning Roadmap Generator is a FastAPI-based web application that generates customized learning roadmaps for various topics using the Cohere AI API. Users can specify a topic, skill level, duration, and optional focus areas to receive a structured JSON response containing a learning roadmap with weekly topics, objectives, resources, projects, milestones, and a hierarchical topic tree.

This README provides instructions for setting up the environment, installing dependencies, and running the application.

## Prerequisites
- **Python**: Version 3.8 or higher.
- **pip**: Python package manager.
- **Virtualenv** (optional but recommended): For creating isolated Python environments.
- **Cohere API Key**: Obtain a valid API key from [Cohere](https://cohere.ai/).

## Project Structure
- `main.py`: Defines the FastAPI application and the `/generate-roadmap` endpoint.
- `model.py`: Contains the core logic for generating and formatting roadmaps using the Cohere API.
- `requirements.txt`: Lists the required Python packages and their versions.
- `README.md`: This file, providing setup and usage instructions.

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

### 4. Configure the Cohere API Key
Open `main.py` and replace the placeholder API key with your valid Cohere API key:
```python
API_KEY = "your-cohere-api-key-here"
```

To obtain a Cohere API key:
1. Sign up or log in at [Cohere](https://cohere.ai/).
2. Navigate to the API keys section in your dashboard.
3. Copy the API key and update `main.py`.

### 5. Run the Application
Start the FastAPI server using Uvicorn:
```bash
python main.py api
```
---
```bash
uvicorn main:api --reload
```

This command runs the server on `http://127.0.0.1:8000` with auto-reload enabled for development. You should see output indicating the server is running:
```
INFO:     Will watch for changes in these directories: [...]
INFO:     Uvicorn running on httpburgohttp://127.0.0.1:8000 (Press CTRL+C to quit)
```

### 6. Test the Application
Use `curl`, Postman, or a browser to send a POST request to the `/generate-roadmap` endpoint. Example using `curl`:
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

The response will be a JSON object containing the roadmap, with a hierarchical `tree` structure, `chapters`, and `metadata`.

Alternatively, access the interactive API documentation at:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

### 7. Deactivate the Virtual Environment
When finished, deactivate the virtual environment:
```bash
deactivate
```

## Troubleshooting
- **Error: "ModuleNotFoundError: No module named 'fastapi'"**:
  - Ensure the virtual environment is activated and dependencies are installed (`pip install -r requirements.txt`).
- **Error: "Cohere API request failed"**:
  - Verify the API key in `main.py` is correct and valid.
  - Check your internet connection.
- **Error: Server not responding**:
  - Ensure the server is running (`python main.py api`) and the port `8000` is not in use.
  - Stop and restart the server if needed.

## Notes
- The application requires an active internet connection to communicate with the Cohere API.
- Ensure `main.py`, `model.py`, and `requirements.txt` are in the same directory.
- For production, consider using a WSGI server like Gunicorn instead of Uvicorn’s development server, and disable `reload=True`.

## License
This project is for educational purposes and provided as-is. Ensure compliance with Cohere’s API usage terms.