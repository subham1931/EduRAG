from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import QuizRequest, QuizResponse, TokenPayload
from app.services.quiz_service import generate_quiz
from app.services.subject_service import get_subject_by_id
from app.utils.auth import get_current_teacher

router = APIRouter(tags=["quiz"])


@router.post("/generate-quiz", response_model=QuizResponse)
async def generate_quiz_endpoint(
    body: QuizRequest,
    teacher: TokenPayload = Depends(get_current_teacher),
):
    subject = await get_subject_by_id(body.subject_id, teacher.sub)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    try:
        result = await generate_quiz(
            body.subject_id, teacher.sub, body.topic, body.num_questions
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
