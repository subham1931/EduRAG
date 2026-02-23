from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.models.schemas import DocumentResponse, TokenPayload
from app.services.document_service import (
    process_and_store_pdf,
    get_documents,
    delete_document,
)
from app.services.subject_service import get_subject_by_id
from app.utils.auth import get_current_teacher

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    subject_id: str = Form(...),
    teacher: TokenPayload = Depends(get_current_teacher),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    subject = await get_subject_by_id(subject_id, teacher.sub)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    try:
        pdf_bytes = await file.read()
        result = await process_and_store_pdf(
            pdf_bytes, file.filename, subject_id, teacher.sub
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")


@router.get("/{subject_id}", response_model=list[DocumentResponse])
async def list_documents(
    subject_id: str,
    teacher: TokenPayload = Depends(get_current_teacher),
):
    try:
        return await get_documents(subject_id, teacher.sub)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{document_id}")
async def delete_document_endpoint(
    document_id: str,
    teacher: TokenPayload = Depends(get_current_teacher),
):
    try:
        success = await delete_document(document_id, teacher.sub)
        if not success:
            raise HTTPException(status_code=404, detail="Document not found")
        return {"message": "Document deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
