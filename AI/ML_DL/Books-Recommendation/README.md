# Books Recommendation API

A FastAPI-based recommendation system for technical books using TF-IDF + Cosine Similarity. The system filters and processes a dataset of technical books to provide intelligent search and recommendation capabilities.

## Features

- **Content-Based Recommendations**: TF-IDF vectorization with Cosine Similarity for book recommendations
- **Smart Search**: Combined title and author search across technical books
- **Translation Support**: Automatic translation of queries to English for better matching
- **RESTful API**: Built with FastAPI, includes auto-generated Swagger/OpenAPI documentation
- **Production Ready**: Includes CORS, logging, error handling, and environment configuration
- **High Quality Data**: Only books with ≥3⭐ rating and ≥5 reviews

## Installation

### Prerequisites
- Python 3.13+
- pip

### Local Setup

1. **Clone & Navigate**:
   ```bash
   git clone <your-repo-url>
   cd Books-Recommendation
   ```

2. **Virtual Environment**:
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

### Start Server
```bash
uvicorn main:app --reload --host 127.0.0.1 --port 5030
```

- **API Live at**: http://127.0.0.1:5030
- **API Docs**: http://127.0.0.1:5030/docs

## API Endpoints

### 🏥 Health Check
**GET /health**

Returns the health status of the service.

**Response**:
```json
{
  "status": "healthy",
  "service": "recommendation_api"
}
```

### 📚 Book Recommendations & Search
**POST /recommend**

Performs combined search and recommendation based on the input text.

**Request Body** (JSON):
```json
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

## Example cURL Commands

### Health Check
```bash
curl "http://127.0.0.1:5030/health"
```

### Get Recommendations
```bash
curl -X POST "http://127.0.0.1:5030/recommend" \
  -H "Content-Type: application/json" \
  -d '{"text": "Python"}'
```

## Configuration

The application uses environment variables for configuration:

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_SERVICE_HOST` | `127.0.0.1` | Server host |
| `AI_SERVICE_PORT` | `5030` | Server port |
| `LOG_LEVEL` | `INFO` | Logging level |

## Project Structure

```
Books-Recommendation/
├── .gitattributes
├── .gitignore
├── Dockerfile.txt
├── main.py                            # FastAPI application
├── README.md                         # This file
├── requirements.txt                   # Python dependencies
├── TODO.md                           # Task tracking
├── Data/
│   └── FINAL_BOOKS_CLEAN (1).csv      # Processed book dataset
├── Models/
│   ├── vectorizer.pkl                 # TF-IDF vectorizer model
│   └── similarity_sparse.pkl          # Pre-computed similarity matrix
├── Notebook/
│   └── BooksRec.ipynb                 # Jupyter notebook for analysis
└── Utils/
    ├── __init__.py
    ├── logging.py                     # Logging utilities
    └── translation.py                 # Translation utilities
```

## Model Details

- **Algorithm**: TF-IDF Vectorization + Cosine Similarity
- **Dataset**: 9,237 technical books filtered from 130K Kindle ebooks
- **Categories**: Machine Learning, Programming, Computer Science, Mathematics, Statistics
- **Filters**: Books with ≥3⭐ rating and ≥5 reviews

## Performance

- **Load Time**: <2s (startup)
- **Search**: <50ms per query
- **Recommendations**: <100ms per query
- **Memory Usage**: ~500MB

## Tech Stack

- **FastAPI**: Modern Python web framework
- **scikit-learn**: Machine learning library for TF-IDF and similarity
- **pandas**: Data processing and manipulation
- **uvicorn**: ASGI server for FastAPI
- **pickle**: Model serialization
- **python-dotenv**: Environment variable management

## Quick Start

```bash
# Clone repository
git clone <your-repo-url>
cd Books-Recommendation

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 5030

# Open API documentation
# http://127.0.0.1:5030/docs
```

