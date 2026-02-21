from app.rag.retriever import retrieve_relevant_chunks, format_context
from app.rag.llm import generate_response


async def ask_question(
    question: str,
    subject_id: str,
    teacher_id: str,
) -> dict:
    chunks = await retrieve_relevant_chunks(question, subject_id, teacher_id)

    if not chunks:
        return {
            "answer": "I couldn't find any relevant information in your uploaded documents for this subject. Please upload more materials or rephrase your question.",
            "sources": [],
        }

    context = format_context(chunks)

    system_prompt = (
        "You are a helpful teaching assistant. Answer the teacher's question "
        "based ONLY on the provided context from their course materials. "
        "If the context doesn't contain enough information, say so clearly. "
        "Use clear, professional language suitable for educators."
    )

    prompt = f"Context:\n{context}\n\nQuestion: {question}"

    answer = await generate_response(prompt, system_prompt)

    sources = [
        {
            "content": c["content"][:200] + "...",
            "page_number": c.get("page_number"),
            "similarity": round(c.get("similarity", 0), 4),
        }
        for c in chunks
    ]

    return {"answer": answer, "sources": sources}
