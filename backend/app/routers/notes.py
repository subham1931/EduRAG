from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import NotesRequest, NotesResponse, SaveNotesRequest, TokenPayload
from app.services.notes_service import generate_notes, save_notes, get_saved_notes
from app.services.subject_service import get_subject_by_id
from app.utils.auth import get_current_teacher

router = APIRouter(tags=["notes"])


@router.post("/generate-notes", response_model=NotesResponse)
async def generate_notes_endpoint(
    body: NotesRequest,
    teacher: TokenPayload = Depends(get_current_teacher),
):
    subject = await get_subject_by_id(body.subject_id, teacher.sub)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    try:
        result = await generate_notes(body.subject_id, teacher.sub, body.topic)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save-notes")
async def save_notes_endpoint(
    body: SaveNotesRequest,
    teacher: TokenPayload = Depends(get_current_teacher),
):
    try:
        result = await save_notes(
            teacher_id=teacher.sub,
            subject_id=body.subject_id,
            title=body.title,
            content=body.content,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/notes/{subject_id}")
async def list_notes(
    subject_id: str,
    teacher: TokenPayload = Depends(get_current_teacher),
):
    try:
        return await get_saved_notes(teacher.sub, subject_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
