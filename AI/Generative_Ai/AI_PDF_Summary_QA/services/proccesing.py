import fitz
from typing import Tuple
from dotenv import load_dotenv

load_dotenv()

def extract_text_from_pdf(pdf_bytes: bytes) -> Tuple[str, int]:

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = "".join(page.get_text() for page in doc if page.get_text())
    page_count = len(doc)
    doc.close()
    return text, page_count


def clean_text(text: str) -> str:
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    return "\n".join(dict.fromkeys(lines))
