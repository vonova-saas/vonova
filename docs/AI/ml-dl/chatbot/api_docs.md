# 📖 Chatbot API Documentation

This document provides detailed information about the available endpoints in the Chatbot API.

## Base URL
`http://127.0.0.1:5090` (Localhost)

---

## 1. Health Check
Checks the operational status of the API service.

- **URL:** `/health`
- **Method:** `GET`
- **Auth Required:** No

### Success Response
- **Code:** `200 OK`
- **Content:**
  ```json
  {
    "status": "healthy",
    "service": "chatbot_api"
  }
  2. Chat InterfaceThe main endpoint for interacting with the AI. It handles language detection, translation, and intent classification.URL: /chatMethod: POSTAuth Required: No (unless configured in CORS/Middleware)Headers: Content-Type: application/jsonRequest BodyFieldTypeDescriptionRequiredmessagestringThe user's input text in any supported language.YesExample Payload:JSON{
  "message": "Bonjour, comment ça va?"
}
