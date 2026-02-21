from app.rag.retriever import retrieve_relevant_chunks, format_context
from app.rag.llm import generate_notes_text
from app.services.subject_service import get_subject_by_id


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
