from __future__ import annotations

from typing import Optional

from app.utils.supabase_client import get_supabase


async def create_organization(
    teacher_id: str, name: str, description: Optional[str]
) -> dict:
    supabase = get_supabase()
    data = {"teacher_id": teacher_id, "name": name}
    if description:
        data["description"] = description
    result = supabase.table("organizations").insert(data).execute()
    return result.data[0]


async def get_organizations(teacher_id: str) -> list[dict]:
    supabase = get_supabase()
    result = (
        supabase.table("organizations")
        .select("*")
        .eq("teacher_id", teacher_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


async def get_organization_by_id(
    organization_id: str, teacher_id: str
) -> Optional[dict]:
    supabase = get_supabase()
    result = (
        supabase.table("organizations")
        .select("*")
        .eq("id", organization_id)
        .eq("teacher_id", teacher_id)
        .execute()
    )
    return result.data[0] if result.data else None
