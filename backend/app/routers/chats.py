import traceback
from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import ChatMessageCreate, ChatMessageResponse, TokenPayload
from app.services.chat_service import save_message, get_messages, delete_messages
from app.utils.auth import get_current_teacher

router = APIRouter(prefix="/chats", tags=["chats"])


@router.get("/{subject_id}", response_model=list[ChatMessageResponse])
async def list_chat_messages(
    subject_id: str,
    teacher: TokenPayload = Depends(get_current_teacher),
):
    try:
        return await get_messages(teacher.sub, subject_id)
    except Exception as e:
        print(f"[GET CHATS] ERROR: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=ChatMessageResponse)
async def create_chat_message(
    body: ChatMessageCreate,
    teacher: TokenPayload = Depends(get_current_teacher),
):
    try:
        return await save_message(
            teacher_id=teacher.sub,
            subject_id=body.subject_id,
            role=body.role,
            content=body.content,
            sources=body.sources,
        )
    except Exception as e:
        print(f"[SAVE CHAT] ERROR: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{subject_id}")
async def clear_chat_messages(
    subject_id: str,
    teacher: TokenPayload = Depends(get_current_teacher),
):
    try:
        await delete_messages(teacher.sub, subject_id)
        return {"message": "Chat cleared"}
    except Exception as e:
        print(f"[DELETE CHATS] ERROR: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
