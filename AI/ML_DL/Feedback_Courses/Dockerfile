# 1. Use an official, stable, and slim Python base image
FROM python:3.10-slim

# 2. Install necessary system dependencies (including Git LFS to properly pull .pkl files)
RUN apt-get update && apt-get install -y \
    git \
    git-lfs \
    && git lfs install \
    && rm -rf /var/lib/apt/lists/*

# 3. Set the working directory inside the container
WORKDIR /app

# 4. Copy requirements file first to leverage Docker layer caching
COPY requirements.txt .

# 5. Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# 6. Pre-download necessary NLTK data (Stopwords) to avoid runtime connection issues
RUN python -m nltk.downloader stopwords

# 7. Copy the rest of the project files (respecting .dockerignore)
COPY . .

# 8. Inform Docker about the port used (Railway will override this via the PORT env var)
EXPOSE 5020

# 9. Execution command: 
# - Use 0.0.0.0 to allow the server to accept external connections.
# - Use the ${PORT} environment variable provided by Railway, defaulting to 5020.
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-5020}"]
