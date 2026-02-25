from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import QuizRequest, QuizResponse, SaveQuizRequest, UpdateQuizRequest, TokenPayload
from app.services.quiz_service import generate_quiz, save_quiz, update_quiz, get_quizzes, get_quiz_by_id, delete_quiz, restore_quiz, get_deleted_quizzes
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
            body.subject_id, 
            teacher.sub, 
            body.topic, 
            body.instructions,
            body.mcq_count,
            body.short_count,
            body.long_count,
            body.fill_blanks_count
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save-quiz")
async def save_quiz_endpoint(
    body: SaveQuizRequest,
    teacher: TokenPayload = Depends(get_current_teacher),
):
    try:
        result = await save_quiz(
            teacher_id=teacher.sub,
            subject_id=body.subject_id,
            title=body.title,
            description=body.description,
            questions=body.questions,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/update-quiz")
async def update_quiz_endpoint(
    body: UpdateQuizRequest,
    teacher: TokenPayload = Depends(get_current_teacher),
):
    try:
        result = await update_quiz(
            quiz_id=body.quiz_id,
            teacher_id=teacher.sub,
            title=body.title,
            description=body.description,
            questions=body.questions,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/quizzes/{subject_id}")
async def list_quizzes(
    subject_id: str,
    teacher: TokenPayload = Depends(get_current_teacher),
):
    try:
        return await get_quizzes(teacher.sub, subject_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/quiz/{quiz_id}")
async def get_quiz(
    quiz_id: str,
    teacher: TokenPayload = Depends(get_current_teacher),
):
    try:
        quiz = await get_quiz_by_id(quiz_id, teacher.sub)
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
        return quiz
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/quiz/{quiz_id}")
async def delete_quiz_endpoint(
    quiz_id: str,
    permanent: bool = False,
    teacher: TokenPayload = Depends(get_current_teacher),
):
    try:
        success = await delete_quiz(quiz_id, teacher.sub, permanent=permanent)
        if not success:
            raise HTTPException(status_code=404, detail="Quiz not found or already deleted")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/quiz/{quiz_id}/restore")
async def restore_quiz_endpoint(
    quiz_id: str,
    teacher: TokenPayload = Depends(get_current_teacher),
):
    try:
        success = await restore_quiz(quiz_id, teacher.sub)
        if not success:
            raise HTTPException(status_code=404, detail="Quiz not found")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/deleted/quizzes")
async def list_deleted_quizzes(
    subject_id: str | None = None,
    teacher: TokenPayload = Depends(get_current_teacher),
):
    try:
        return await get_deleted_quizzes(teacher.sub, subject_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
