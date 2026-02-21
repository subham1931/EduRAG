import fitz  # PyMuPDF
from io import BytesIO


def extract_pages_from_pdf(pdf_bytes: bytes) -> list[dict]:
    doc = fitz.open(stream=BytesIO(pdf_bytes), filetype="pdf")
    pages = []
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text = page.get_text("text")
        pages.append({
            "page_number": page_num + 1,
            "text": text,
        })
    doc.close()
    return pages
