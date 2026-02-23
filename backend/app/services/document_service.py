from app.utils.supabase_client import get_supabase
from app.rag.pdf_parser import extract_pages_from_pdf
from app.rag.chunker import extract_page_chunks
from app.rag.embeddings import generate_embedding
from app.config import get_settings


async def process_and_store_pdf(
    pdf_bytes: bytes,
    filename: str,
    subject_id: str,
    teacher_id: str,
) -> dict:
    settings = get_settings()
    supabase = get_supabase()

    pages = extract_pages_from_pdf(pdf_bytes)
    page_count = len(pages)

    chunks = extract_page_chunks(
        pages,
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
    )

    doc_result = (
        supabase.table("documents")
        .insert({
            "teacher_id": teacher_id,
            "subject_id": subject_id,
            "filename": filename,
            "page_count": page_count,
            "chunk_count": len(chunks),
        })
        .execute()
    )
    document = doc_result.data[0]
    document_id = document["id"]

    for chunk in chunks:
        embedding = await generate_embedding(chunk["content"])

        supabase.table("document_chunks").insert({
            "teacher_id": teacher_id,
            "subject_id": subject_id,
            "document_id": document_id,
            "content": chunk["content"],
            "embedding": embedding,
            "page_number": chunk["page_number"],
        }).execute()

    return {
        "id": document_id,
        "subject_id": subject_id,
        "teacher_id": teacher_id,
        "filename": filename,
        "page_count": page_count,
        "chunk_count": len(chunks),
        "created_at": document["created_at"],
    }


async def get_documents(subject_id: str, teacher_id: str) -> list[dict]:
    supabase = get_supabase()
    result = (
        supabase.table("documents")
        .select("*")
        .eq("subject_id", subject_id)
        .eq("teacher_id", teacher_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


async def delete_document(document_id: str, teacher_id: str) -> bool:
    supabase = get_supabase()
    result = (
        supabase.table("documents")
        .delete()
        .eq("id", document_id)
        .eq("teacher_id", teacher_id)
        .execute()
    )
    return len(result.data) > 0
