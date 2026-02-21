import tiktoken


def count_tokens(text: str, model: str = "cl100k_base") -> int:
    encoder = tiktoken.get_encoding(model)
    return len(encoder.encode(text))


def chunk_text(
    text: str,
    chunk_size: int = 800,
    chunk_overlap: int = 150,
) -> list[str]:
    encoder = tiktoken.get_encoding("cl100k_base")
    tokens = encoder.encode(text)

    chunks: list[str] = []
    start = 0
    while start < len(tokens):
        end = start + chunk_size
        chunk_tokens = tokens[start:end]
        chunk_str = encoder.decode(chunk_tokens).strip()
        if chunk_str:
            chunks.append(chunk_str)
        start += chunk_size - chunk_overlap

    return chunks


def extract_page_chunks(
    pages: list[dict],
    chunk_size: int = 800,
    chunk_overlap: int = 150,
) -> list[dict]:
    """
    Takes a list of {"page_number": int, "text": str} and returns
    chunked items with page_number preserved.
    """
    result: list[dict] = []

    accumulated_text = ""
    current_page = 1

    for page in pages:
        page_num = page["page_number"]
        page_text = page["text"].strip()
        if not page_text:
            continue

        if accumulated_text:
            accumulated_text += "\n" + page_text
        else:
            accumulated_text = page_text
            current_page = page_num

    if not accumulated_text:
        return result

    raw_chunks = chunk_text(accumulated_text, chunk_size, chunk_overlap)

    text_cursor = 0
    page_idx = 0
    page_boundaries: list[int] = []
    running = 0
    for page in pages:
        running += len(page["text"])
        page_boundaries.append(running)

    for chunk in raw_chunks:
        chunk_start = accumulated_text.find(chunk[:50], text_cursor)
        if chunk_start == -1:
            chunk_start = text_cursor

        best_page = 1
        for i, boundary in enumerate(page_boundaries):
            if chunk_start < boundary:
                best_page = pages[i]["page_number"]
                break
            best_page = pages[-1]["page_number"]

        result.append({
            "content": chunk,
            "page_number": best_page,
        })
        text_cursor = max(text_cursor, chunk_start + 1)

    return result
