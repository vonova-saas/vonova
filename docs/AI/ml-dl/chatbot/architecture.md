# 🏗️ System Architecture & Workflow

This document explains the internal data flow of the Chatbot application, detailing how a user message is processed from input to response.

## 🔄 Request Lifecycle

When a user sends a request to `/chat`, the following steps occur sequentially:

### 1. Input Reception
The `FastAPI` app receives the JSON payload containing the user's message.

### 2. Language Detection & Normalization
* **Module:** `utils.translation_utils`
* **Action:** The system uses Cohere API to detect the language of the input message (e.g., Arabic `ar`, French `fr`).
* **Logic:**
    * If the language is **English (`en`)**: It proceeds directly.
    * If the language is **Not English**: The message is translated to English using Cohere. This ensures the Neural Network always receives English input, maintaining high accuracy regardless of the user's language.

### 3. Preprocessing & Embedding
* **Module:** `main.py` / `sentence-transformers`
* **Action:** The (English) text is converted into a numerical vector (embedding).
* **Model:** `sentence-transformers/all-MiniLM-L6-v2`
* **Detail:** The vector is normalized to ensure consistent input for the Neural Net.

### 4. Intent Classification
* **Module:** `notebooks.train.NeuralNet`
* **Action:** The PyTorch model receives the vector and predicts the intent tag (e.g., `greeting`, `goodbye`, `pricing`).
* **Output:** The system selects a pre-defined response associated with the predicted tag.

### 5. Response Localization
* **Module:** `utils.translation_utils`
* **Action:**
    * If the user originally spoke English: The response is sent as is.
    * If the user spoke another language: The selected English response is translated back to the user's original language via Cohere.

### 6. Logging
* **Module:** `utils.logging_utils`
* **Action:** All steps (detection, translation, prediction) are logged to `chatbot.log` for debugging and monitoring.

## 🧩 Components Overview

| Component | Technology | Purpose |
|---|---|---|
| **API Server** | FastAPI | Handles HTTP requests and async processing. |
| **Model** | PyTorch (NN) | Classifies the intent of the message. |
| **Embedder** | SentenceTransformers | Converts text to machine-readable vectors. |
| **Translation** | Cohere API | Handles multilingual support (Detect/Translate). |