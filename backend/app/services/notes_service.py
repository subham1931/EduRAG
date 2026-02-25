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
        .eq("is_deleted", False)
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


async def delete_note(note_id: str, teacher_id: str, permanent: bool = False) -> bool:
    supabase = get_supabase()
    if permanent:
        result = (
            supabase.table("generated_notes")
            .delete()
            .eq("id", note_id)
            .eq("teacher_id", teacher_id)
            .execute()
        )
    else:
        result = (
            supabase.table("generated_notes")
            .update({"is_deleted": True})
            .eq("id", note_id)
            .eq("teacher_id", teacher_id)
            .execute()
        )
    return len(result.data) > 0


async def restore_note(note_id: str, teacher_id: str) -> bool:
    supabase = get_supabase()
    result = (
        supabase.table("generated_notes")
        .update({"is_deleted": False})
        .eq("id", note_id)
        .eq("teacher_id", teacher_id)
        .execute()
    )
    return len(result.data) > 0


async def get_deleted_notes(teacher_id: str, subject_id: str | None = None) -> list[dict]:
    supabase = get_supabase()
    query = (
        supabase.table("generated_notes")
        .select("*, subjects(name)")
        .eq("teacher_id", teacher_id)
        .eq("is_deleted", True)
    )
    if subject_id:
        query = query.eq("subject_id", subject_id)
        
    result = query.order("created_at", desc=True).execute()
    return result.data
