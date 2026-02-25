# AI Roadmap Generator

An intelligent learning roadmap generator that creates personalized, structured learning plans using AI. This tool generates comprehensive roadmaps tailored to specific topics, skill levels, and timeframes.

## Features

- **Personalized Learning Paths**: Generates custom roadmaps based on topic, skill level, and duration
- **Structured Curriculum**: Organizes content into weekly modules with clear objectives
- **Resource Recommendations**: Provides specific learning resources for each topic
- **Project-Based Learning**: Includes practical exercises and projects
- **Milestone Tracking**: Defines key milestones and deliverables
- **Multiple Output Formats**: Returns data in structured JSON format for easy integration

## Project Structure

```
AI_Roadmap_Generator/
├── README.md
├── llm/
│   ├── __init__.py
│   └── cohere_llm.py          # Cohere API client wrapper
├── models/
│   ├── __init__.py
│   └── roadmap_schema.py      # Pydantic data models
└── services/
    ├── __init__.py
    ├── roadmap_generator.py   # Main roadmap generation logic
    └── roadmap_formatter.py   # Output formatting utilities
```

## Installation

1. Install required dependencies:
```bash
pip install cohere pydantic
```

2. Set up your Cohere API key as an environment variable:
```bash
export COHERE_API_KEY="your-api-key-here"
```

## Usage

### Basic Usage

```python
from AI_Roadmap_Generator.services.roadmap_generator import RoadmapGenerator

# Initialize the generator
generator = RoadmapGenerator(api_key="your-cohere-api-key")

# Generate a roadmap
roadmap = generator.generate_roadmap(
    topic="Machine Learning",
    skill_level="beginner", 
    duration_weeks=12
)

print(roadmap)
```

### Example Response

The generator returns a structured JSON response containing:

```json
{
    "status": true,
    "text": {
        "query": "Machine Learning",
        "chapters": {
            "Introduction & Basics": ["Linear Algebra", "Python Basics", "Statistics"],
            "Core Development": ["Supervised Learning", "Model Evaluation"],
            "Advanced Topics": ["Neural Networks", "Deep Learning"],
            "Specialization & Project": ["Capstone Project"]
        }
    },
    "tree": [
        {
            "name": "Machine Learning",
            "children": [...]
        }
    ],
    "roadmapId": "unique-identifier",
    "metadata": {
        "generated": "Machine Learning: A 12-Week Beginner Roadmap",
        "summary": "12 weeks, 96 total estimated hours"
    }
}
```

## Data Models

### RoadmapRequest
- `topic`: The learning subject
- `skill_level`: Beginner, Intermediate, or Advanced
- `duration_weeks`: Number of weeks for the roadmap

### Week Structure
Each week includes:
- `week`: Week number
- `title`: Week title
- `objectives`: Learning goals
- `topics`: Specific concepts to cover
- `resources`: Recommended learning materials
- `projects`: Practical exercises
- `estimated_hours`: Time commitment

### Milestone Structure
- `week`: Week number
- `milestone`: Milestone name
- `deliverable`: Tangible outcome

## Configuration

### Supported Models
The generator uses Cohere's `command-r-plus-08-2024` model by default. You can specify a different model during initialization:

```python
generator = RoadmapGenerator(
    api_key="your-api-key",
    cohere_model_name="command-r-plus-08-2024"
)
```

### Customization
- Adjust `estimated_hours` range (6-15 hours per week)
- Modify milestone frequency
- Customize chapter categorization logic

## API Endpoints

### REST API

The AI Roadmap Generator is available as a REST API endpoint:

#### Generate Roadmap
**POST** `/generate-roadmap`

Generate a personalized learning roadmap based on the provided parameters.

**Request Body:**
```json
{
    "topic": "Machine Learning",
    "skill_level": "beginner",
    "duration_weeks": 12
}
```

**Parameters:**
- `topic` (string, required): The learning subject or topic
- `skill_level` (string, required): Skill level - "beginner", "intermediate", or "advanced"
- `duration_weeks` (integer, required): Number of weeks for the roadmap (1-52)

**Response:**
```json
{
    "status": true,
    "text": {
        "query": "Machine Learning",
        "chapters": {
            "Introduction & Basics": ["Linear Algebra", "Python Basics", "Statistics"],
            "Core Development": ["Supervised Learning", "Model Evaluation"],
            "Advanced Topics": ["Neural Networks", "Deep Learning"],
            "Specialization & Project": ["Capstone Project"]
        }
    },
    "tree": [
        {
            "name": "Machine Learning",
            "children": [...]
        }
    ],
    "roadmapId": "unique-identifier",
    "metadata": {
        "generated": "Machine Learning: A 12-Week Beginner Roadmap",
        "summary": "12 weeks, 96 total estimated hours"
    }
}
```

**Error Response:**
```json
{
    "status": false,
    "error": "Error message describing the issue"
}
```

**Example using curl:**
```bash
curl -X POST "http://localhost:8000/generate-roadmap" \
     -H "Content-Type: application/json" \
     -d '{
         "topic": "Web Development",
         "skill_level": "intermediate",
         "duration_weeks": 8
     }'
```

## API Reference

### RoadmapGenerator Class

#### Methods

**`__init__(api_key, cohere_model_name='command-r-plus-08-2024')`**
Initialize the roadmap generator with API credentials.

**`generate_roadmap(topic, skill_level, duration_weeks)`**
Generate a complete learning roadmap.

**Parameters:**
- `topic` (str): Learning subject
- `skill_level` (str): Skill level (beginner, intermediate, advanced)
- `duration_weeks` (int): Duration in weeks

**Returns:** Structured JSON response with roadmap data

### RoadmapFormatter Class

#### Methods

**`generate_json_response(roadmap_data, topic, skill_level, duration_weeks)`**
Format roadmap data into standardized JSON response.

## Error Handling

The generator includes comprehensive error handling for:
- API connection issues
- Invalid JSON responses
- Data validation failures
- Missing required fields

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This Feature is part of the Vonova AI suite. See the main project LICENSE file for details.
