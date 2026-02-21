from app.utils.supabase_client import get_supabase
from app.rag.embeddings import generate_embedding
from app.config import get_settings


async def retrieve_relevant_chunks(
    query: str,
    subject_id: str,
    teacher_id: str,
    top_k: int | None = None,
) -> list[dict]:
    settings = get_settings()
    if top_k is None:
        top_k = settings.top_k

    query_embedding = await generate_embedding(query)

    supabase = get_supabase()
    result = supabase.rpc(
        "match_document_chunks",
        {
            "query_embedding": query_embedding,
            "match_count": top_k,
            "filter_subject_id": subject_id,
            "filter_teacher_id": teacher_id,
        },
    ).execute()

    return result.data if result.data else []


def format_context(chunks: list[dict]) -> str:
    parts = []
    for i, chunk in enumerate(chunks, 1):
        page = chunk.get("page_number", "?")
        parts.append(f"[Source {i}, Page {page}]\n{chunk['content']}")
    return "\n\n---\n\n".join(parts)
