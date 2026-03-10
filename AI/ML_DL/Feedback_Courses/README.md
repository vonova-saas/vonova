# Feedback Courses Sentiment Analysis API

A FastAPI-based machine learning service for analyzing sentiment in course feedback. This service supports multilingual text processing with automatic Arabic-to-English translation capabilities.

## 🚀 Features

- **Sentiment Analysis**: Predicts sentiment categories for course feedback text
- **Multilingual Support**: Automatically detects and translates Arabic text to English
- **Text Preprocessing**: Advanced text cleaning with emoji handling, stopword removal, and stemming
- **RESTful API**: Clean FastAPI endpoints with proper error handling
- **Docker Support**: Containerized deployment ready
- **CORS Enabled**: Cross-origin requests supported

## 📋 Requirements

- Python 3.8+
- Required packages (see `requirements.txt`)
- Cohere API key for translation services
- Pre-trained model files (vectorizer, random forest model, label encoder)

## 🛠️ Installation

1. Clone the repository and navigate to the project directory
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```
4. Ensure model files are available in the `models/` directory:
   - `vectorizer.pkl` - TF-IDF vectorizer
   - `rf_model.pkl` - Random Forest classifier
   - `label_encoder.pkl` - Label encoder for sentiment classes

## 🔧 Configuration

Environment variables:
- `CO_API_KEY`: Cohere API key for translation services
- `LOG_LEVEL`: Logging level (default: INFO)
- `AI_SERVICE_HOST`: Service host (default: 127.0.0.1)
- `AI_SERVICE_PORT`: Service port (default: 5020)
- `CORS_ORIGINS`: Allowed CORS origins (default: *)
- `CORS_ALLOW_CREDENTIALS`: Allow credentials (default: true)
- `CORS_ALLOW_METHODS`: Allowed HTTP methods (default: GET,POST)
- `CORS_ALLOW_HEADERS`: Allowed headers (default: *)

## 🚀 Running the Application

### Local Development
```bash
python app.py
```

### Docker Deployment
```bash
docker build -t feedback-courses-api .
docker run -p 5020:5020 feedback-courses-api
```

The service will be available at `http://localhost:5020`

## 📚 API Endpoints

### Health Check
```
GET /health
```
Returns service health status.

### Predict Sentiment
```
POST /predict_feedback
Content-Type: application/json

{
  "text": "Your feedback text here"
}
```

**Response:**
```json
{
  "sentiment": "positive",
  "code": 1
}
```

## 🧠 Model Architecture

The service uses a machine learning pipeline with:
- **TF-IDF Vectorizer**: Text feature extraction
- **Random Forest Classifier**: Sentiment prediction
- **Label Encoder**: Sentiment class encoding

## 📊 Training

Training data should be placed in `data/Feedback_Training.csv` with columns:
- `Feedback_ID`: Unique identifier
- `Entity`: Entity name
- `label`: Sentiment label
- `comment`: Feedback text

Run training with:
```bash
python train/train.py
```

## 🔍 Text Processing Pipeline

1. **Language Detection**: Automatically detects input language
2. **Translation**: Translates Arabic text to English using Cohere API
3. **Text Cleaning**: Removes URLs, HTML, numbers, mentions, hashtags
4. **Emoji Handling**: Converts common emojis to text representations
5. **Stopword Removal**: Removes English stopwords
6. **Stemming**: Applies Snowball stemming

## 📁 Project Structure

```
Feedback_Courses/
├── app.py                 # Main FastAPI application
├── requirements.txt       # Python dependencies
├── .env.example          # Environment variables template
├── Dockerfile            # Docker configuration
├── data/                 # Training data
│   └── Feedback_Training.csv
├── models/               # Trained model files
├── schemas/              # Pydantic schemas
│   └── feedback_schema.py
├── utils/                # Utility modules
│   ├── logging_utils.py
│   ├── processing_utils.py
│   └── translation_utils.py
└── train/                # Training scripts
    └── train.py
```

## 🐳 Docker Support

The application includes Docker support with:
- Multi-stage build for optimization
- Proper dependency management
- Environment variable configuration
- Health checks

## 📝 Logging

Comprehensive logging with:
- Structured log format
- Configurable log levels
- Request/response logging
- Error tracking

## 🔒 Security

- Input validation and sanitization
- CORS configuration
- Error handling without information leakage
- Environment variable management

## 📈 Performance

- Optimized text preprocessing
- Efficient model loading
- Async translation API calls
- Memory-conscious implementation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This feature is part of the Vonova AI project and is licensed under the Apache License.