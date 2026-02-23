from app.rag.retriever import retrieve_relevant_chunks, format_context
from app.rag.llm import generate_quiz_json
from app.services.subject_service import get_subject_by_id
from app.utils.supabase_client import get_supabase


async def generate_quiz(
    subject_id: str,
    teacher_id: str,
    topic: str | None = None,
    num_questions: int = 10,
) -> dict:
    query = topic if topic else "key concepts and important topics"
    chunks = await retrieve_relevant_chunks(
        query, subject_id, teacher_id, top_k=10
    )

    if not chunks:
        raise ValueError("No documents found for this subject. Upload materials first.")

    context = format_context(chunks)
    questions = await generate_quiz_json(context, topic or "", num_questions)

    subject = await get_subject_by_id(subject_id, teacher_id)
    subject_name = subject["name"] if subject else "Unknown"

    return {
        "subject": subject_name,
        "questions": questions,
    }


async def save_quiz(
    teacher_id: str,
    subject_id: str,
    title: str,
    questions: list[dict],
) -> dict:
    supabase = get_supabase()
    result = supabase.table("quizzes").insert({
        "teacher_id": teacher_id,
        "subject_id": subject_id,
        "title": title,
        "questions": questions,
    }).execute()
    return result.data[0]


async def update_quiz(
    quiz_id: str,
    teacher_id: str,
    title: str,
    questions: list[dict],
) -> dict:
    supabase = get_supabase()
    result = (
        supabase.table("quizzes")
        .update({"title": title, "questions": questions})
        .eq("id", quiz_id)
        .eq("teacher_id", teacher_id)
        .execute()
    )
    return result.data[0] if result.data else {}


async def get_quizzes(teacher_id: str, subject_id: str) -> list[dict]:
    supabase = get_supabase()
    result = (
        supabase.table("quizzes")
        .select("*")
        .eq("teacher_id", teacher_id)
        .eq("subject_id", subject_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data
