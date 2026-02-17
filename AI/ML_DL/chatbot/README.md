# 🤖 Multilingual AI Intent Chatbot

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

To ensure the application runs correctly without import errors, organize your files as follows:

```text
chatbot-project/
├── .env                  # Environment variables (API keys, config)
├── .env.example          # Example environment file
├── Dockerfile            # Docker configuration
├── main.py               # API Entry point
├── requirements.txt      # Python dependencies
├── README.md             # Project documentation
├── data/
│   └── intents.json      # JSON file containing training data (intents & patterns)
├── docs/                 # Documentation folder
│   └── api_docs.md
├── models/               # Generated folder for saved PyTorch models & metadata
├── notebooks/
│   ├── __init__.py
│   └── train.py          # Model training script & NeuralNet class
├── schemas/
│   ├── __init__.py
│   └── chat_schema.py    # Pydantic models
└── utils/
    ├── __init__.py
    ├── logging_utils.py     # Custom logger setup
    └── translation_utils.py # Cohere translation & detection logic
```
🛠️ Installation & Setup
git clone <https://github.com/vonova-saas/chatbot.git>
cd chatbot-project


1-Set Up Virtual Environment (Recommended)

python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

2-Install Dependencies
pip install -r requirements.txt


3-Environment Variables
CO_API_KEY="your_cohere_api_key_here"
AI_SERVICE_HOST=127.0.0.1
AI_SERVICE_PORT=5090
LOG_LEVEL=INFO

🧠 Training the Model
python -m notebooks.train

▶️ Running the Application
python main.py
The server will start at: http://127.0.0.1:5090

Build the Docker Image:
docker build -t chatbot-app .

Run the Container:
docker run -p 5090:5090 --env-file .env chatbot-app



