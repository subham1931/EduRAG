import httpx
from app.config import get_settings

MAX_EMBED_CHARS = 2000


async def generate_embedding(text: str) -> list[float]:
    settings = get_settings()
    if len(text) > MAX_EMBED_CHARS:
        text = text[:MAX_EMBED_CHARS]

    timeout = httpx.Timeout(120.0, connect=30.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(
            f"{settings.ollama_base_url}/api/embeddings",
            json={
                "model": settings.ollama_embed_model,
                "prompt": text,
            },
        )
        if response.status_code != 200:
            print(f"[EMBEDDING ERROR] Status: {response.status_code}, Body: {response.text[:500]}")
            response.raise_for_status()
        return response.json()["embedding"]


async def generate_embeddings_batch(texts: list[str]) -> list[list[float]]:
    embeddings = []
    for text in texts:
        emb = await generate_embedding(text)
        embeddings.append(emb)
    return embeddings
