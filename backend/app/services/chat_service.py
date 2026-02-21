from app.utils.supabase_client import get_supabase


async def save_message(
    teacher_id: str,
    subject_id: str,
    role: str,
    content: str,
    sources: list[dict] | None = None,
) -> dict:
    supabase = get_supabase()
    data = {
        "teacher_id": teacher_id,
        "subject_id": subject_id,
        "role": role,
        "content": content,
    }
    if sources:
        data["sources"] = sources

    result = supabase.table("chat_messages").insert(data).execute()
    return result.data[0]


async def get_messages(teacher_id: str, subject_id: str) -> list[dict]:
    supabase = get_supabase()
    result = (
        supabase.table("chat_messages")
        .select("*")
        .eq("teacher_id", teacher_id)
        .eq("subject_id", subject_id)
        .order("created_at", desc=False)
        .execute()
    )
    return result.data


async def delete_messages(teacher_id: str, subject_id: str) -> None:
    supabase = get_supabase()
    supabase.table("chat_messages").delete().eq(
        "teacher_id", teacher_id
    ).eq("subject_id", subject_id).execute()
