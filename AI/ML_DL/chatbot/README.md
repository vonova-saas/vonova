# Chatbot

A high-performance, intent-based chatbot API built with **FastAPI** and **PyTorch**. It utilizes **SentenceTransformers** for semantic understanding and integrates with **Cohere AI** for automatic language detection and translation, making it capable of understanding and replying in multiple languages.

## 🚀 Features

* **Intent Classification:** Custom Feed Forward Neural Network (PyTorch) for accurate intent prediction.
* **Semantic Understanding:** Uses `sentence-transformers/all-MiniLM-L6-v2` for generating sentence embeddings.
* **Multilingual Support:**
    * Auto-detects user language (e.g., Arabic, French, Spanish).
    * Translates input to English for processing.
    * Translates the bot's response back to the user's native language using Cohere API.
* **FastAPI:** Async, high-performance API serving.
* **Dockerized:** Ready for deployment with a complete Docker setup.

---

## 📂 Project Structure

```text
chatbot/
├── .env.example          # Example environment file
├── .gitignore           # Git ignore file
├── Dockerfile           # Docker configuration
├── main.py              # API Entry point
├── requirements.txt     # Python dependencies
├── README.md            # Project documentation
├── en_data/             # English training data
│   └── intents.json     # English intents file
└── src/                 # Source code directory
    ├── data/            # Training data files
    │   ├── ar_intents.json    # Arabic intents
    │   ├── en_intents.json    # English intents
    │   └── intents.json       # Combined intents
    ├── model/           # Neural network model
    │   └── model.py           # PyTorch model definition
    ├── training/        # Model training scripts
    │   └── train.py           # Training script
    └── utils/           # Utility functions
        └── nltk_utils.py       # NLP utilities
```
## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <https://github.com/vonova-saas/chatbot.git>
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
Create a `.env` file from the example:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
CO_API_KEY="your_cohere_api_key_here"
AI_SERVICE_HOST=127.0.0.1
AI_SERVICE_PORT=5090
LOG_LEVEL=INFO
```

## 🧠 Training the Model

Train the neural network on your intent data:
```bash
python -m src.training.train
```

This will:
- Load the training data from `src/data/intents.json`
- Train the PyTorch neural network
- Save the trained model to the `src/model/` directory

## ▶️ Running the Application

Start the FastAPI server:
```bash
python main.py
```

The server will start at: http://127.0.0.1:5090

## 🐳 Docker Deployment

### Build the Docker Image:
```bash
docker build -t chatbot-app .
```

### Run the Container:
```bash
docker run -p 5090:5090 --env-file .env chatbot-app
```

## 📚 API Usage

### Chat Endpoint

**POST** `/chat`

Send a message to the chatbot:

```json
{
  "message": "Hello, how are you?"
}
```

Response:
```json
{
  "response": "Hello! I'm doing well, thank you for asking. How can I help you today?",
  "intent": "greeting",
  "language": "en"
}
```

### Health Check

**GET** `/health`

Check if the service is running:
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

## 📄 License

This feature is part of the Vonova AI project and is licensed under the Apache License.