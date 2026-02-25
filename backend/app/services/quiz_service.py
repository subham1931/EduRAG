from app.rag.retriever import retrieve_relevant_chunks, format_context
from app.rag.llm import generate_quiz_json
from app.services.subject_service import get_subject_by_id
from app.utils.supabase_client import get_supabase


async def generate_quiz(
    subject_id: str,
    teacher_id: str,
    topic: str | None = None,
    instructions: str | None = None,
    mcq_count: int = 5,
    short_count: int = 0,
    long_count: int = 0,
    fill_blanks_count: int = 0,
) -> dict:
    query = topic if topic else "key concepts and important topics"
    if instructions:
        query += f" ({instructions})"
    chunks = await retrieve_relevant_chunks(
        query, subject_id, teacher_id, top_k=10
    )

    if not chunks:
        raise ValueError("No documents found for this subject. Upload materials first.")

    context = format_context(chunks)
    questions = await generate_quiz_json(
        context, topic or "", instructions or "", mcq_count, short_count, long_count, fill_blanks_count
    )

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
    description: str = "",
) -> dict:
    supabase = get_supabase()
    result = supabase.table("quizzes").insert({
        "teacher_id": teacher_id,
        "subject_id": subject_id,
        "title": title,
        "description": description,
        "questions": questions,
    }).execute()
    return result.data[0]


async def update_quiz(
    quiz_id: str,
    teacher_id: str,
    title: str,
    questions: list[dict],
    description: str = None,
) -> dict:
    supabase = get_supabase()
    update_data = {"title": title, "questions": questions}
    if description is not None:
        update_data["description"] = description
        
    result = (
        supabase.table("quizzes")
        .update(update_data)
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
        .eq("is_deleted", False)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


async def get_quiz_by_id(quiz_id: str, teacher_id: str) -> dict | None:
    supabase = get_supabase()
    result = (
        supabase.table("quizzes")
        .select("*")
        .eq("id", quiz_id)
        .eq("teacher_id", teacher_id)
        .execute()
    )
    return result.data[0] if result.data else None


async def delete_quiz(quiz_id: str, teacher_id: str, permanent: bool = False) -> bool:
    supabase = get_supabase()
    if permanent:
        result = (
            supabase.table("quizzes")
            .delete()
            .eq("id", quiz_id)
            .eq("teacher_id", teacher_id)
            .execute()
        )
    else:
        result = (
            supabase.table("quizzes")
            .update({"is_deleted": True})
            .eq("id", quiz_id)
            .eq("teacher_id", teacher_id)
            .execute()
        )
    return len(result.data) > 0


async def restore_quiz(quiz_id: str, teacher_id: str) -> bool:
    supabase = get_supabase()
    result = (
        supabase.table("quizzes")
        .update({"is_deleted": False})
        .eq("id", quiz_id)
        .eq("teacher_id", teacher_id)
        .execute()
    )
    return len(result.data) > 0


async def get_deleted_quizzes(teacher_id: str, subject_id: str | None = None) -> list[dict]:
    supabase = get_supabase()
    query = (
        supabase.table("quizzes")
        .select("*, subjects(name)")
        .eq("teacher_id", teacher_id)
        .eq("is_deleted", True)
    )
    if subject_id:
        query = query.eq("subject_id", subject_id)
    
    result = query.order("created_at", desc=True).execute()
    return result.data
