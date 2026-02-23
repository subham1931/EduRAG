from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


# ── Auth ──────────────────────────────────────────────────────────────
class TokenPayload(BaseModel):
    sub: str
    email: Optional[str] = None
    exp: Optional[int] = None


# ── Subject ───────────────────────────────────────────────────────────
class SubjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None


class SubjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None


class SubjectResponse(BaseModel):
    id: str
    teacher_id: str
    name: str
    description: Optional[str] = None
    created_at: str


# ── Document ──────────────────────────────────────────────────────────
class DocumentResponse(BaseModel):
    id: str
    subject_id: str
    teacher_id: str
    filename: str
    page_count: int
    chunk_count: int
    created_at: str


# ── Ask ───────────────────────────────────────────────────────────────
class AskRequest(BaseModel):
    subject_id: str
    question: str = Field(..., min_length=1, max_length=2000)


class AskResponse(BaseModel):
    answer: str
    sources: list[dict]


# ── Quiz ──────────────────────────────────────────────────────────────
class QuizRequest(BaseModel):
    subject_id: str
    topic: Optional[str] = None
    num_questions: int = Field(default=10, ge=1, le=20)


class QuizQuestion(BaseModel):
    question: str
    options: list[str]
    correct_answer: str


class QuizResponse(BaseModel):
    subject: str
    questions: list[QuizQuestion]


# ── Notes ─────────────────────────────────────────────────────────────
class NotesRequest(BaseModel):
    subject_id: str
    topic: Optional[str] = None


class NotesResponse(BaseModel):
    subject: str
    notes: str


# ── Save Quiz / Notes ─────────────────────────────────────────────────
class SaveQuizRequest(BaseModel):
    subject_id: str
    title: str = "General"
    questions: list[dict]


class UpdateQuizRequest(BaseModel):
    quiz_id: str
    title: str = "General"
    questions: list[dict]


class SaveNotesRequest(BaseModel):
    subject_id: str
    title: str = "General"
    content: str = Field(..., min_length=1)


# ── Chat ──────────────────────────────────────────────────────────────
class ChatMessageCreate(BaseModel):
    subject_id: str
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., min_length=1)
    sources: Optional[list[dict]] = None


class ChatMessageResponse(BaseModel):
    id: str
    teacher_id: str
    subject_id: str
    role: str
    content: str
    sources: Optional[list[dict]] = None
    created_at: str
