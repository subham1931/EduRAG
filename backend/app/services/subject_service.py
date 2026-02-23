from app.utils.supabase_client import get_supabase


async def create_subject(teacher_id: str, name: str, description: str | None) -> dict:
    supabase = get_supabase()
    data = {"teacher_id": teacher_id, "name": name}
    if description:
        data["description"] = description

    result = supabase.table("subjects").insert(data).execute()
    return result.data[0]


async def get_subjects(teacher_id: str) -> list[dict]:
    supabase = get_supabase()
    result = (
        supabase.table("subjects")
        .select("*")
        .eq("teacher_id", teacher_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


async def get_subject_by_id(subject_id: str, teacher_id: str) -> dict | None:
    supabase = get_supabase()
    result = (
        supabase.table("subjects")
        .select("*")
        .eq("id", subject_id)
        .eq("teacher_id", teacher_id)
        .execute()
    )
    return result.data[0] if result.data else None


async def delete_subject(subject_id: str, teacher_id: str) -> bool:
    supabase = get_supabase()
    result = (
        supabase.table("subjects")
        .delete()
        .eq("id", subject_id)
        .eq("teacher_id", teacher_id)
        .execute()
    )
    return len(result.data) > 0


async def update_subject(
    subject_id: str,
    teacher_id: str,
    name: str | None = None,
    description: str | None = None,
) -> dict | None:
    supabase = get_supabase()
    update_data = {}
    if name:
        update_data["name"] = name
    if description is not None:
        update_data["description"] = description

    if not update_data:
        return await get_subject_by_id(subject_id, teacher_id)

    result = (
        supabase.table("subjects")
        .update(update_data)
        .eq("id", subject_id)
        .eq("teacher_id", teacher_id)
        .execute()
    )
    return result.data[0] if result.data else None
