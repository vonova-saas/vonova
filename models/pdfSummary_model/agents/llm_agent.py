import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import deque
from typing import List, Tuple
from langdetect import detect
from dotenv import load_dotenv
import time
import google.generativeai as genai


def load_gemini_model(model_name: str = "gemini-2.5-flash"):
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is missing. Please set it in your .env file.")

    genai.configure(api_key=api_key)

    try:
        model = genai.GenerativeModel(model_name)
        return model
    except Exception as e:
        raise RuntimeError(f"Failed to load Gemini model: {e}")

class GeminiAnswerAgent:
    def __init__(self, model):
        self.model = model
        self.memory: deque[Tuple[str, str]] = deque(maxlen=10)

    def answer_question(self, question: str, chunks: List[str]) -> str:
        context = "\n\n".join(chunks[:15])

        memory_prompt = ""
        if self.memory:
            memory_prompt = "\nPrevious conversation:\n"
            for i, (q, a) in enumerate(self.memory, start=1):
                memory_prompt += f"Q{i}: {q}\nA{i}: {a}\n"

        prompt = f"""
You are a smart assistant that has read the following PDF content:

--- PDF Content ---
{context}
--------------------

{memory_prompt}

- Now answer the user's new question **in the same language as the question**, and respond naturally as if you read and understood the full PDF.
- if user need to create some question, create it by the same language of pdf
User Question: {question}
"""

        try:
            response = self.model.generate_content(prompt)
            answer = response.text.strip()

            self.memory.append((question, answer))
            return answer

        except Exception as e:
            return f"Error during Q&A: {e}"

    def summarize_short(self, full_text: str) -> str:
        """
        Very short summary in one sentence (same language as the PDF)
        """
        short_prompt = f"""
You are a multilingual summarization expert.

Summarize the following text in **one concise sentence** (no bullet points, no titles).
Write the summary in **the same language** as the input.

Text:
{full_text}

One-sentence summary:
"""

        try:
            response = self.model.generate_content(short_prompt)
            return response.text.strip()
        except Exception as e:
            return f"[Error in short summary: {e}]"

    def summarize_document(self, full_text: str, summary_type: str = "detailed") -> str:
        if not full_text.strip():
            return "No text for summarization."

        if len(full_text) > 500000:  # Adjust to handle up to 500,000 chars
            chunk_size = 500000 // 5
            samples = [full_text[i * chunk_size:(i + 1) * chunk_size] for i in range(5)]
            full_text = "\n\n[Content omitted]\n\n".join(samples)

        prompt = f"""You are an intelligent assistant. Summarize the following document **in the same language as the original text**.
If the text is in Arabic, the summary must also be in Arabic. If in English, summarize in English.
Adapt naturally to the detected language of the input.

If 'detailed' or similar is mentioned, give a comprehensive summary (500-1000 words) covering main topics, key points, core concepts, and conclusions.
If 'brief' or similar, give a concise summary (200-400 words).
Adapt to any other request intelligently, ensuring the summary reflects the full document as much as possible.

Document Content:
{full_text}

User Request: {summary_type}

Summary:"""

        try:
            response = self.model.generate_content(
                contents=prompt,
                generation_config={
                    "temperature": 0.2,
                    "top_p": 0.7,
                    "top_k": 30
                }
            )
            return response.text.strip() or "Summary failed. Please try a different request."
        except Exception as e:
            return f"Summary error: {str(e)}"
