from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import AskRequest, AskResponse, TokenPayload
from app.services.ask_service import ask_question
from app.services.subject_service import get_subject_by_id
from app.utils.auth import get_current_teacher

router = APIRouter(tags=["ask"])


@router.post("/ask", response_model=AskResponse)
async def ask_endpoint(
    body: AskRequest,
    teacher: TokenPayload = Depends(get_current_teacher),
):
    subject = await get_subject_by_id(body.subject_id, teacher.sub)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    try:
        result = await ask_question(body.question, body.subject_id, teacher.sub)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
