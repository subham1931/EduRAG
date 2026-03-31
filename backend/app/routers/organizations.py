import traceback
from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import (
    OrganizationCreate,
    OrganizationResponse,
    TokenPayload,
)
from app.services.organization_service import (
    create_organization,
    get_organization_by_id,
    get_organizations,
)
from app.utils.auth import get_current_teacher

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.post("", response_model=OrganizationResponse)
async def create_organization_endpoint(
    body: OrganizationCreate,
    teacher: TokenPayload = Depends(get_current_teacher),
):
    try:
        org = await create_organization(
            teacher.sub, body.name, body.description
        )
        return org
    except Exception as e:
        print(f"[CREATE ORG] ERROR: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=list[OrganizationResponse])
async def list_organizations_endpoint(
    teacher: TokenPayload = Depends(get_current_teacher),
):
    try:
        return await get_organizations(teacher.sub)
    except Exception as e:
        print(f"[LIST ORGS] ERROR: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{organization_id}", response_model=OrganizationResponse)
async def get_organization_endpoint(
    organization_id: str,
    teacher: TokenPayload = Depends(get_current_teacher),
):
    try:
        org = await get_organization_by_id(organization_id, teacher.sub)
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
        return org
    except HTTPException:
        raise
    except Exception as e:
        print(f"[GET ORG] ERROR: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
