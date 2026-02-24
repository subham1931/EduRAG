from app.rag.retriever import retrieve_relevant_chunks, format_context
from app.rag.llm import generate_notes_text
from app.services.subject_service import get_subject_by_id
from app.utils.supabase_client import get_supabase


async def generate_notes(
    subject_id: str,
    teacher_id: str,
    topic: str | None = None,
) -> dict:
    query = topic if topic else "all key concepts, definitions, and important topics"
    chunks = await retrieve_relevant_chunks(
        query, subject_id, teacher_id, top_k=10
    )

    if not chunks:
        raise ValueError("No documents found for this subject. Upload materials first.")

    context = format_context(chunks)
    notes = await generate_notes_text(context, topic or "")

    subject = await get_subject_by_id(subject_id, teacher_id)
    subject_name = subject["name"] if subject else "Unknown"

    return {
        "subject": subject_name,
        "notes": notes,
    }


async def save_notes(
    teacher_id: str,
    subject_id: str,
    title: str,
    content: str,
) -> dict:
    supabase = get_supabase()
    result = supabase.table("generated_notes").insert({
        "teacher_id": teacher_id,
        "subject_id": subject_id,
        "title": title,
        "content": content,
    }).execute()
    return result.data[0]


async def get_saved_notes(teacher_id: str, subject_id: str) -> list[dict]:
    supabase = get_supabase()
    result = (
        supabase.table("generated_notes")
        .select("*")
        .eq("teacher_id", teacher_id)
        .eq("subject_id", subject_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


async def get_note_by_id(note_id: str, teacher_id: str) -> dict | None:
    supabase = get_supabase()
    result = (
        supabase.table("generated_notes")
        .select("*")
        .eq("id", note_id)
        .eq("teacher_id", teacher_id)
        .execute()
    )
    return result.data[0] if result.data else None
