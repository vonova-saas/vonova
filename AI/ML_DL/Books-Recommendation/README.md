# Books Recommendation API

A FastAPI-based recommendation system for technical books using TF-IDF + Cosine Similarity. The system filters and processes a dataset of technical books to provide intelligent search and recommendation capabilities.

## 🚀 Features

- **Content-Based Recommendations**: TF-IDF vectorization with Cosine Similarity for book recommendations
- **Smart Search**: Combined title and author search across technical books
- **Translation Support**: Automatic translation of queries to English for better matching
- **RESTful API**: Built with FastAPI, includes auto-generated Swagger/OpenAPI documentation
- **Production Ready**: Includes CORS, logging, error handling, and environment configuration
- **High Quality Data**: Only books with ≥3⭐ rating and ≥5 reviews
- **Automated Data Pipeline**: Kaggle dataset download and processing

## 📋 Requirements

- Python 3.8+
- Kaggle API token for dataset download
- Cohere API key for translation services
- Required packages (see `requirements.txt`)

## 🛠️ Installation

### 1. Clone & Navigate
```bash
git clone <your-repo-url>
cd Books-Recommendation
```

### 2. Virtual Environment
```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Environment Setup
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 5. Required Environment Variables
```bash
# Kaggle API token for dataset download
KAGGLE_API_TOKEN=your_kaggle_json_content

# Cohere API key for translation
CO_API_KEY=your_cohere_api_key

# Service configuration
AI_SERVICE_HOST=127.0.0.1
AI_SERVICE_PORT=5030
LOG_LEVEL=INFO
```

## 🚀 Running the Application

### Option 1: Train and Run (Recommended)
```bash
# Train the model (downloads data and creates model files)
python training/train.py

# Start the server
uvicorn main:app --reload --host 127.0.0.1 --port 5030
```

### Option 2: Run with Pre-trained Models
```bash
# Ensure model files exist in model_files/
# Start the server
uvicorn main:app --reload --host 127.0.0.1 --port 5030
```

### Option 3: Docker Deployment
```bash
# Build the image
docker build -t books-recommendation-api .

# Run the container
docker run -p 5030:5030 \
  -e KAGGLE_API_TOKEN=your_kaggle_token \
  -e CO_API_KEY=your_cohere_key \
  books-recommendation-api
```

## 📚 API Endpoints

### Health Check
```
GET /health
```
Returns service health status.

**Response**:
```json
{
  "status": "healthy",
  "service": "recommendation_api"
}
```

### Book Recommendations & Search
```
POST /recommend
Content-Type: application/json

{
  "text": "Python"
}
```

**Response**:
```json
{
  "search_results": [
    {
      "title": "Python Crash Course",
      "author": "Eric Matthes",
      "rating": 4.5,
      "image": "https://...",
      "link": "https://..."
    }
  ],
  "recommendations": [
    {
      "title": "Deep Learning with Python",
      "author": "François Chollet",
      "rating": 4.8,
      "image": "https://...",
      "link": "https://..."
    }
  ]
}
```

## 🧠 Model Details

- **Algorithm**: TF-IDF Vectorization + Cosine Similarity
- **Dataset**: 9,237 technical books filtered from 130K Kindle ebooks
- **Categories**: Machine Learning, Programming, Computer Science, Mathematics, Statistics
- **Filters**: Books with ≥3⭐ rating and ≥5 reviews
- **Features**: Combined title + author text processing

## 📊 Training Process

The training pipeline (`training/train.py`) performs:

1. **Dataset Download**: Fetches Amazon Kindle Books dataset from Kaggle
2. **Data Filtering**: Filters for high-quality technical books
3. **Text Processing**: Combines title and author information
4. **TF-IDF Vectorization**: Creates feature vectors
5. **Similarity Matrix**: Pre-computes cosine similarity
6. **Model Serialization**: Saves vectorizer and similarity matrix

### Run Training
```bash
python training/train.py
```

This will:
- Download dataset from Kaggle (requires `KAGGLE_API_TOKEN`)
- Process and filter the data
- Train TF-IDF vectorizer
- Compute similarity matrix
- Save models to `model_files/` directory

## 📁 Project Structure

```
Books-Recommendation/
├── main.py                    # FastAPI application
├── requirements.txt           # Python dependencies
├── .env.example              # Environment variables template
├── Dockerfile                # Docker configuration
├── README.md                 # This file
├── training/                 # Training scripts
│   └── train.py              # Model training pipeline
├── Utils/                    # Utility modules
│   ├── __init__.py
│   ├── logging.py           # Logging utilities
│   └── translation.py       # Translation utilities
├── Schemas/                  # Pydantic schemas
│   └── recommend_schema.py  # Request/response schemas
└── model_files/             # Generated model files
    ├── FINAL_BOOKS_CLEAN.csv # Processed book dataset
    ├── vectorizer.pkl        # TF-IDF vectorizer
    └── similarity_sparse.pkl # Similarity matrix
```

## ⚙️ Configuration

Environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `KAGGLE_API_TOKEN` | Kaggle API token for dataset download | Required |
| `CO_API_KEY` | Cohere API key for translation | Required |
| `AI_SERVICE_HOST` | Service host | `127.0.0.1` |
| `AI_SERVICE_PORT` | Service port | `5030` |
| `LOG_LEVEL` | Logging level | `INFO` |

## 📈 Performance

- **Load Time**: <2s (startup)
- **Search**: <50ms per query
- **Recommendations**: <100ms per query
- **Memory Usage**: ~500MB
- **Dataset Size**: 9,237 books

## 🛠️ Tech Stack

- **FastAPI**: Modern Python web framework
- **scikit-learn**: Machine learning library for TF-IDF and similarity
- **pandas**: Data processing and manipulation
- **uvicorn**: ASGI server for FastAPI
- **joblib**: Model serialization
- **python-dotenv**: Environment variable management
- **cohere**: Translation API integration

## 🔧 API Usage Examples

### cURL Commands

```bash
# Health check
curl "http://127.0.0.1:5030/health"

# Get recommendations
curl -X POST "http://127.0.0.1:5030/recommend" \
  -H "Content-Type: application/json" \
  -d '{"text": "Python machine learning"}'
```

### Python Client

```python
import requests

# API endpoint
url = "http://127.0.0.1:5030/recommend"

# Request data
data = {"text": "Python programming"}

# Make request
response = requests.post(url, json=data)
result = response.json()

print("Search Results:")
for book in result["search_results"]:
    print(f"- {book['title']} by {book['author']} ({book['rating']}⭐)")

print("\nRecommendations:")
for book in result["recommendations"]:
    print(f"- {book['title']} by {book['author']} ({book['rating']}⭐)")
```

## 🐳 Docker Support

The application includes Docker support with:
- Multi-stage build for optimization
- Environment variable configuration
- Automated training on first run
- Health checks

### Docker Compose (Optional)
```yaml
version: '3.8'
services:
  books-api:
    build: .
    ports:
      - "5030:5030"
    environment:
      - KAGGLE_API_TOKEN=${KAGGLE_API_TOKEN}
      - CO_API_KEY=${CO_API_KEY}
    volumes:
      - ./model_files:/app/model_files
```

## 🔍 Troubleshooting

### Common Issues

1. **Kaggle Download Fails**
   - Verify `KAGGLE_API_TOKEN` is correctly set
   - Check internet connectivity
   - Ensure Kaggle account has dataset access

2. **Model Loading Errors**
   - Run `python training/train.py` to generate models
   - Check `model_files/` directory exists and contains files

3. **Translation Not Working**
   - Verify `CO_API_KEY` is valid
   - Check Cohere API quota

### Debug Mode
```bash
export LOG_LEVEL=DEBUG
uvicorn main:app --reload --port 5030
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This feature is part of the Vonova AI project and is licensed under the Apache License.

