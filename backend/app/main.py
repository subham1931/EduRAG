from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import subjects, documents, ask, quiz, notes

settings = get_settings()

app = FastAPI(
    title="EduRAG API",
    version="1.0.0",
    description="EduRAG — AI-powered RAG system for teachers",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(subjects.router)
app.include_router(documents.router)
app.include_router(ask.router)
app.include_router(quiz.router)
app.include_router(notes.router)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}
