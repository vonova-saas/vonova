# Use official Python slim image for a smaller footprint
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy application files
COPY . .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose port (Railway sets PORT env var)
EXPOSE 5000

# Command to run the application (use PORT env var with default 5000)
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port 5000"]