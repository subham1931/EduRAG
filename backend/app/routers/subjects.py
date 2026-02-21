import traceback
from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import SubjectCreate, SubjectResponse, TokenPayload
from app.services.subject_service import create_subject, get_subjects
from app.utils.auth import get_current_teacher

router = APIRouter(prefix="/subjects", tags=["subjects"])


@router.post("", response_model=SubjectResponse)
async def create_subject_endpoint(
    body: SubjectCreate,
    teacher: TokenPayload = Depends(get_current_teacher),
):
    try:
        print(f"[CREATE SUBJECT] teacher_id={teacher.sub}, name={body.name}")
        subject = await create_subject(teacher.sub, body.name, body.description)
        print(f"[CREATE SUBJECT] success: {subject}")
        return subject
    except Exception as e:
        print(f"[CREATE SUBJECT] ERROR: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=list[SubjectResponse])
async def list_subjects_endpoint(
    teacher: TokenPayload = Depends(get_current_teacher),
):
    try:
        print(f"[GET SUBJECTS] teacher_id={teacher.sub}")
        result = await get_subjects(teacher.sub)
        print(f"[GET SUBJECTS] found {len(result)} subjects")
        return result
    except Exception as e:
        print(f"[GET SUBJECTS] ERROR: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
