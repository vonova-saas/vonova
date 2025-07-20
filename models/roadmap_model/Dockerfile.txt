# Use official Python slim image for a smaller footprint
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy application files
COPY main.py .
COPY model.py .

# Install dependencies
RUN pip install --no-cache-dir fastapi uvicorn python-dotenv cohere pydantic

# Expose port 5000
EXPOSE 5000

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]