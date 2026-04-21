import os
import json
import cohere
from dotenv import load_dotenv
from AI_Quiz_Generator.utils.translation_utils import process_user_input

load_dotenv()
api_key = os.getenv('COHERE_KEY')

cohere_async_client = cohere.AsyncClient(api_key)

async def generate_quiz(topic: str, total_questions: int, mc_questions: int, tf_questions: int, level: str) -> dict:
    if mc_questions + tf_questions != total_questions:
        tf_questions = total_questions - mc_questions if mc_questions <= total_questions else 0

    english_topic = await process_user_input(topic)

    difficulty_map = {
        "easy": "simple and basic",
        "medium": "moderate questions with some depth",
        "hard": "challenging questions requiring advanced knowledge"
    }
    difficulty_desc = difficulty_map.get(level.lower(), "moderate questions with some depth")

    prompt = (
        f"Generate exactly {total_questions} English quiz questions on '{english_topic}' at {difficulty_desc} level.\n"
        f"Exactly {mc_questions} multiple-choice (4 options A-D) and {tf_questions} true/false.\n"
        f"Return ONLY valid JSON with this exact structure:\n"
        f'{{"topic":"{english_topic}","level":"{level}","total_questions":{total_questions},"questions":[\n'
        f'{{"type":"mc","question":"Question?","options":["A: First","B: Second","C: Third","D: Fourth"],"correct_answer":"A"}},' 
        f'{{"type":"tf","question":"Statement?","correct_answer":"True"}}'
        f']}}'
    )

    try:
        response = await cohere_async_client.chat(
            model='command-a-03-2025',
            message=prompt,
            temperature=0.3
        )
        raw = response.text.strip()
        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0].strip()
        elif "```" in raw:
            raw = raw.split("```")[1].strip()
        quiz_data = json.loads(raw)
        return quiz_data
    except Exception as e:
        raise ValueError("AI failed to generate valid quiz")
