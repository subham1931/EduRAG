import httpx
import json
from app.config import get_settings


async def generate_response(prompt: str, system_prompt: str = "") -> str:
    settings = get_settings()

    # Default styling instructions to ensure list-based, scannable output
    style_mandate = (
        "\n\nFORMATTING RULES:\n"
        "- Use clear Markdown headers (##, ###).\n"
        "- Use ORDERED (numbered) lists (1., 2., 3.) for all main points.\n"
        "- **Bold** key terms and important concepts.\n"
        "- Avoid long paragraphs; keep explanations concise."
    )

    messages = []
    # If no system prompt is provided, we use a default educational one
    if not system_prompt:
        system_prompt = "You are a helpful assistant that provides structured, easy-to-read educational content."
    
    # We only append styling if we're not asking for a structured JSON format to avoid parsing errors
    is_json_request = "json" in system_prompt.lower() or "json" in prompt.lower()
    final_system_content = system_prompt + (style_mandate if not is_json_request else "")
    
    messages.append({"role": "system", "content": final_system_content})
    messages.append({"role": "user", "content": prompt})

    timeout = httpx.Timeout(300.0, connect=30.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.post(
                f"{settings.ollama_base_url}/api/chat",
                json={
                    "model": settings.ollama_llm_model,
                    "messages": messages,
                    "stream": False,
                    "options": {
                        "temperature": 0.3, # Low temperature keeps it focused
                        "num_predict": 4096,
                    },
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["message"]["content"].strip()
        except httpx.HTTPStatusError as e:
            return f"**Error:** The LLM service returned an error: {e}"
        except Exception as e:
            return f"**Error:** An unexpected error occurred: {e}"


async def generate_quiz_json(
    context: str, 
    topic: str, 
    mcq_count: int,
    short_count: int,
    long_count: int,
    fill_blanks_count: int
) -> list[dict]:
    system_prompt = (
        "You are an expert educational assessment creator. Your task is to generate high-quality questions "
        "EXCLUSIVELY based on the provided topic and context. You must return ONLY valid JSON — an array of objects.\n\n"
        "STRICT TOPIC ADHERENCE:\n"
        "- If a topic is specified, EVERY SINGLE question must be directly and specifically about that topic.\n"
        "- DO NOT generate general questions about the subject unless no specific topic is provided.\n"
        "- Ignore any information in the context that is irrelevant to the specified topic.\n\n"
        "QUESTION TYPES AND FORMATS:\n"
        "1. MCQ (type: 'mcq'): { 'type': 'mcq', 'question': '...', 'options': ['A', 'B', 'C', 'D'], 'correct_answer': '...' }\n"
        "2. SHORT (type: 'short'): { 'type': 'short', 'question': '...', 'correct_answer': '...' }\n"
        "3. LONG (type: 'long'): { 'type': 'long', 'question': '...', 'correct_answer': '...' }\n"
        "4. FILL BLANKS (type: 'fill_blanks'): { 'type': 'fill_blanks', 'question': '...', 'correct_answer': '...' }\n\n"
        "STRICT RULES:\n"
        "- The 'correct_answer' for short/long should be a brief sample answer or key points.\n"
        "- For fill_blanks, use '____' in the question string.\n"
        "- For mcq, options must be exactly 4.\n"
        "- Return ONLY the JSON array. Do not include any explanatory text."
    )

    topic_instruction = f"\n\nCRITICAL MANDATE: All questions MUST be strictly about the topic: '{topic}'. Do not include questions about any other topic." if topic else ""
    prompt = (
        f"Based on the following context, generate the following questions:{topic_instruction}\n\n"
        f"- {mcq_count} Multiple Choice Questions\n"
        f"- {short_count} Short Answer Questions\n"
        f"- {long_count} Long Answer Questions\n"
        f"- {fill_blanks_count} Fill-in-the-Blanks Questions\n\n"
        f"Context:\n{context}\n\n"
        f"Final Check: Ensure EVERY question is relevant to the topic '{topic or 'general concepts'}' before returning."
    )

    raw = await generate_response(prompt, system_prompt)

    start = raw.find("[")
    end = raw.rfind("]") + 1
    if start == -1 or end == 0:
        raise ValueError("LLM did not return valid JSON array")

    return json.loads(raw[start:end])


async def generate_notes_text(context: str, topic: str) -> str:
    system_prompt = (
        "You are an expert academic content creator. Your goal is to transform teaching materials into "
        "highly professional, scannable, and aesthetically pleasing study notes using Markdown.\n\n"
        "STRICT TOPIC ADHERENCE:\n"
        "- If a topic is specified, focus EXCLUSIVELY on that topic. Ignore unrelated context.\n\n"
        "STRUCTURAL & FORMATTING RULES:\n"
        "1. **Title**: Start with a single `#` Main Title based on the topic.\n"
        "2. **Sections**: Use `##` for clear, descriptive section headers. Add `---` (horizontal rule) after each major section.\n"
        "3. **Key Concepts**: At the start of each section, use a `> [!IMPORTANT]` or detailed bullet to define the core concept.\n"
        "4. **Hierarchy**:\n"
        "   - Use **1. 2. 3.** for primary instructional steps or main findings.\n"
        "   - Use sub-bullets (`- `) for technical details, definitions, or supporting data.\n"
        "5. **Visual Emphasis**:\n"
        "   - **Bold** every important term, keyword, or law.\n"
        "   - Use `code blocks` for any syntax, snippets, or formulas.\n"
        "   - Use `*Italics*` for contextual examples or analogies.\n"
        "6. **Summary Section**: End the notes with a `## 💡 Quick Summary / Key Takeaways` section using a checklist for easy review.\n"
        "7. **Brevity**: Keep sentences punchy. Use tables if comparing two or more concepts."
    )

    topic_instruction = f"\n\nCRITICAL MANDATE: These study notes MUST be strictly about the topic: '{topic}'. Do not include notes about any other topic." if topic else ""
    prompt = (
        f"Based on the following teaching material, generate comprehensive, beautifully formatted "
        f"study notes.{topic_instruction}\n\n"
        f"Context:\n{context}\n\n"
        f"Generate the notes now using the strict formatting rules provided."
    )

    notes = await generate_response(prompt, system_prompt)
    print(f"\n--- GENERATED NOTES START ---\n{notes}\n--- GENERATED NOTES END ---\n")
    return notes
