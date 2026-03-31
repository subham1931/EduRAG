import re
from typing import Optional

from app.utils.supabase_client import get_supabase
from app.rag.pdf_parser import extract_pages_from_pdf
from app.rag.chunker import extract_page_chunks
from app.rag.embeddings import generate_embedding
from app.config import get_settings


def _safe_storage_filename(name: str) -> str:
    base = (name or "document.pdf").strip()
    safe = re.sub(r"[^a-zA-Z0-9._-]", "_", base)
    return safe[:220] if safe else "document.pdf"


def _resolve_storage_object_path(
    row: dict,
    teacher_id: str,
    document_id: str,
) -> Optional[str]:
    """Prefer DB `storage_path` when present; else same key used at upload time."""
    p = row.get("storage_path")
    if p:
        return p
    fn = row.get("filename")
    if not fn:
        return None
    return f"{teacher_id}/{document_id}/{_safe_storage_filename(fn)}"


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

    storage_key_result: Optional[str] = None
    bucket = settings.documents_bucket
    if bucket:
        try:
            storage_key = f"{teacher_id}/{document_id}/{_safe_storage_filename(filename)}"
            supabase.storage.from_(bucket).upload(
                storage_key,
                pdf_bytes,
                file_options={
                    "content-type": "application/pdf",
                    "upsert": "true",
                },
            )
            try:
                supabase.table("documents").update({"storage_path": storage_key}).eq(
                    "id", document_id
                ).execute()
            except Exception as e:
                print(
                    f"[STORAGE] storage_path update skipped (add column via migration): {e}"
                )
            storage_key_result = storage_key
        except Exception as e:
            print(f"[STORAGE] PDF upload skipped or failed: {e}")

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
        "storage_path": storage_key_result,
    }


async def update_document_filename(
    document_id: str, teacher_id: str, filename: str
) -> Optional[dict]:
    fn = (filename or "").strip()
    if not fn:
        raise ValueError("Filename is required")
    if not fn.lower().endswith(".pdf"):
        fn = f"{fn}.pdf"

    supabase = get_supabase()
    existing = (
        supabase.table("documents")
        .select("id")
        .eq("id", document_id)
        .eq("teacher_id", teacher_id)
        .execute()
    )
    if not existing.data:
        return None

    result = (
        supabase.table("documents")
        .update({"filename": fn})
        .eq("id", document_id)
        .eq("teacher_id", teacher_id)
        .execute()
    )
    return result.data[0] if result.data else None


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


async def get_document_preview_signed_url(
    document_id: str, teacher_id: str
) -> Optional[str]:
    settings = get_settings()
    bucket = settings.documents_bucket
    if not bucket:
        return None

    supabase = get_supabase()
    result = (
        supabase.table("documents")
        .select("*")
        .eq("id", document_id)
        .eq("teacher_id", teacher_id)
        .execute()
    )
    if not result.data:
        return None
    path = _resolve_storage_object_path(result.data[0], teacher_id, document_id)
    if not path:
        return None

    signed = supabase.storage.from_(bucket).create_signed_url(path, 3600)
    if isinstance(signed, dict):
        inner = signed.get("data")
        if isinstance(inner, dict):
            return inner.get("signedUrl") or inner.get("signedURL")
        return signed.get("signedURL") or signed.get("signedUrl")
    return None


async def delete_document(document_id: str, teacher_id: str) -> bool:
    settings = get_settings()
    supabase = get_supabase()
    existing = (
        supabase.table("documents")
        .select("*")
        .eq("id", document_id)
        .eq("teacher_id", teacher_id)
        .execute()
    )
    if not existing.data:
        return False
    path = _resolve_storage_object_path(existing.data[0], teacher_id, document_id)
    bucket = settings.documents_bucket
    if path and bucket:
        try:
            supabase.storage.from_(bucket).remove([path])
        except Exception as e:
            print(f"[STORAGE] remove file failed: {e}")

    (
        supabase.table("documents")
        .delete()
        .eq("id", document_id)
        .eq("teacher_id", teacher_id)
        .execute()
    )
    # PostgREST often returns empty `data` on successful DELETE; we already verified the row exists above.
    return True
