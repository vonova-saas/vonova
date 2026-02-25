import os
from fastapi.middleware.cors import CORSMiddleware

def setup_cors_middleware(app):
    """Setup CORS middleware for the application."""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
        allow_credentials=os.getenv("CORS_ALLOW_CREDENTIALS", "true").lower() == "true",
        allow_methods=os.getenv("CORS_ALLOW_METHODS", "GET,POST").split(","),
        allow_headers=os.getenv("CORS_ALLOW_HEADERS", "*").split(","),
    )
