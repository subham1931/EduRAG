import httpx
import json
from app.config import get_settings


async def generate_response(prompt: str, system_prompt: str = "") -> str:
    settings = get_settings()

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    timeout = httpx.Timeout(300.0, connect=30.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(
            f"{settings.ollama_base_url}/api/chat",
            json={
                "model": settings.ollama_llm_model,
                "messages": messages,
                "stream": False,
                "options": {
                    "temperature": 0.3,
                    "num_predict": 4096,
                },
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["message"]["content"]


async def generate_quiz_json(context: str, topic: str, num_questions: int) -> list[dict]:
    system_prompt = (
        "You are a quiz generator for teachers. Generate multiple choice questions "
        "based on the provided context. Return ONLY valid JSON — an array of objects, "
        "each with keys: question (string), options (array of 4 strings), correct_answer (string). "
        "Do not include any text outside the JSON array."
    )

    topic_instruction = f" Focus on the topic: {topic}." if topic else ""
    prompt = (
        f"Based on the following teaching material, generate exactly {num_questions} "
        f"multiple choice questions.{topic_instruction}\n\n"
        f"Context:\n{context}\n\n"
        f"Return ONLY a JSON array."
    )

    raw = await generate_response(prompt, system_prompt)

    start = raw.find("[")
    end = raw.rfind("]") + 1
    if start == -1 or end == 0:
        raise ValueError("LLM did not return valid JSON array")

    return json.loads(raw[start:end])


async def generate_notes_text(context: str, topic: str) -> str:
    system_prompt = (
        "You are a note-generation assistant for teachers. "
        "Generate clear, concise, well-structured notes in bullet-point format. "
        "Use markdown formatting with headers and sub-bullets."
    )

    topic_instruction = f" Focus on the topic: {topic}." if topic else ""
    prompt = (
        f"Based on the following teaching material, generate comprehensive "
        f"study notes in bullet format.{topic_instruction}\n\n"
        f"Context:\n{context}"
    )

    return await generate_response(prompt, system_prompt)
