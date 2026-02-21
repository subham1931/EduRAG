from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import NotesRequest, NotesResponse, TokenPayload
from app.services.notes_service import generate_notes
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
