import fitz
from dotenv import load_dotenv

load_dotenv()

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    return "".join(page.get_text() for page in doc if page.get_text())


def clean_text(text: str) -> str:
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    return "\n".join(dict.fromkeys(lines))
