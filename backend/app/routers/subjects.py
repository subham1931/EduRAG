import traceback
from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import (
    SubjectCreate,
    SubjectUpdate,
    SubjectResponse,
    TokenPayload,
)
from app.services.subject_service import (
    create_subject,
    get_subjects,
    update_subject,
    delete_subject,
)
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


@router.put("/{subject_id}", response_model=SubjectResponse)
async def update_subject_endpoint(
    subject_id: str,
    body: SubjectUpdate,
    teacher: TokenPayload = Depends(get_current_teacher),
):
    try:
        subject = await update_subject(
            subject_id, teacher.sub, body.name, body.description
        )
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
        return subject
    except HTTPException:
        raise
    except Exception as e:
        print(f"[UPDATE SUBJECT] ERROR: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{subject_id}")
async def delete_subject_endpoint(
    subject_id: str,
    teacher: TokenPayload = Depends(get_current_teacher),
):
    try:
        success = await delete_subject(subject_id, teacher.sub)
        if not success:
            raise HTTPException(status_code=404, detail="Subject not found")
        return {"message": "Subject deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[DELETE SUBJECT] ERROR: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
