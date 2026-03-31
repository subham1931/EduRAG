from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    supabase_url: str
    supabase_service_key: str
    supabase_jwt_secret: str = ""
    ollama_base_url: str = "http://localhost:11434"
    ollama_llm_model: str = "mistral:7b"
    ollama_embed_model: str = "nomic-embed-text"
    chunk_size: int = 300
    chunk_overlap: int = 30
    top_k: int = 5
    cors_origins: str = "http://localhost:3000"
    # Supabase Storage bucket for original PDFs (preview). Create bucket "documents" in dashboard.
    documents_bucket: str = "documents"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
