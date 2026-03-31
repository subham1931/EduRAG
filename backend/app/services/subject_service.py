from __future__ import annotations

from typing import Optional

from app.services.organization_service import get_organization_by_id
from app.utils.supabase_client import get_supabase


async def create_subject(
    teacher_id: str,
    organization_id: str,
    name: str,
    description: Optional[str],
) -> dict:
    org = await get_organization_by_id(organization_id, teacher_id)
    if not org:
        raise ValueError("Organization not found")

    supabase = get_supabase()
    data = {
        "teacher_id": teacher_id,
        "organization_id": organization_id,
        "name": name,
    }
    if description:
        data["description"] = description

    result = supabase.table("subjects").insert(data).execute()
    return result.data[0]


async def get_subjects(
    teacher_id: str, organization_id: Optional[str] = None
) -> list[dict]:
    supabase = get_supabase()
    q = (
        supabase.table("subjects")
        .select("*")
        .eq("teacher_id", teacher_id)
    )
    if organization_id:
        q = q.eq("organization_id", organization_id)
    result = q.order("created_at", desc=True).execute()
    return result.data


async def get_subject_by_id(subject_id: str, teacher_id: str) -> Optional[dict]:
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
    name: Optional[str] = None,
    description: Optional[str] = None,
) -> Optional[dict]:
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
