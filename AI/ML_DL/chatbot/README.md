# 🤖 Vonova Multilingual AI Chatbot

A high-performance, intent-based chatbot API built with **FastAPI** and **PyTorch**. It utilizes **SentenceTransformers** for semantic understanding and supports both English and Arabic languages with pre-trained intent models.

## 🚀 Features

* **Intent Classification:** Pre-trained models for English and Arabic intent prediction
* **Semantic Understanding:** Uses `sentence-transformers/all-MiniLM-L6-v2` for English and `paraphrase-multilingual-MiniLM-L12-v2` for Arabic
* **Multilingual Support:** 
    * English and Arabic language support
    * Separate intent models for each language
    * Automatic language-specific processing
* **FastAPI:** Async, high-performance API serving
* **Dockerized:** Ready for deployment with a complete Docker setup

---

## 📂 Project Structure

```
chatbot/
├── .env                  # Environment variables (API keys, config)
├── .env.example          # Example environment file
├── Dockerfile            # Docker configuration
├── main.py               # API Entry point
├── requirements.txt      # Python dependencies
├── README.md             # Project documentation
├── .gitignore            # Git ignore file
└── src/
    ├── data/
    │   ├── en_intents.json    # English training data (intents & patterns)
    │   └── ar_intents.json    # Arabic training data (intents & patterns)
    └── training/
        └── train.py           # Model training script
```

---

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd chatbot
```

### 2. Set Up Virtual Environment (Recommended)
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Environment Variables
Create a `.env` file based on `.env.example`:
```bash
AI_SERVICE_HOST=127.0.0.1
AI_SERVICE_PORT=5090
LOG_LEVEL=INFO
```

---

## 🧠 Training the Model

Before running the chatbot, you need to train the models:

```bash
python src/training/train.py
```

This will:
- Load the pre-trained sentence transformers
- Process the intent data from `src/data/`
- Generate pickle files for both English and Arabic models
- Save them to `src/data/` directory

---

## ▶️ Running the Application

### Development Mode
```bash
python main.py
```
The server will start at: http://127.0.0.1:5090

### Docker Deployment

Build the Docker Image:
```bash
docker build -t vonova-chatbot .
```

Run the Container:
```bash
docker run -p 5090:5090 --env-file .env vonova-chatbot
```

---

## 📡 API Endpoints

### Health Check
- **GET** `/health` - Check if the API is running

### Chat Endpoint
- **POST** `/chat` - Send a message to the chatbot

**Request Body:**
```json
{
  "message": "Hello, how can you help me?"
}
```

**Response:**
```json
{
  "response": "I'm here to help! What do you need assistance with?",
  "language": "en"
}
```

---

## 🔧 Configuration

### Supported Languages
- English (`en`)
- Arabic (`ar`)

### Models Used
- English: `all-MiniLM-L6-v2`
- Arabic: `paraphrase-multilingual-MiniLM-L12-v2`

---

## 🐛 Troubleshooting

### Common Issues

1. **Pickle files not found**
   - Solution: Run `python src/training/train.py` first

2. **Import errors**
   - Solution: Ensure all dependencies are installed via `pip install -r requirements.txt`

3. **Port already in use**
   - Solution: Change `AI_SERVICE_PORT` in `.env` file

---

## 📝 Development Notes

- The chatbot uses pre-trained sentence transformers for semantic understanding
- Intent data is stored in JSON format under `src/data/`
- The API automatically detects the language and uses the appropriate model
- All models are loaded at startup for optimal performance

---

## 📄 License

This feature is part of the Vonova AI project and is licensed under the Apache License.

