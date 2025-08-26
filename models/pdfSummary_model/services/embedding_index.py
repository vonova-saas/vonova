# embedding_index.py
import re
from typing import List


def smart_chunk_text(text: str, max_tokens: int = 1000) -> List[str]:
    """Split text into smart chunks based on paragraphs and token limits."""
    chunks, current_chunk = [], []
    token_count = 0

    for paragraph in re.split(r'[\n\r]+', text):
        paragraph = paragraph.strip()
        if not paragraph:
            continue

        paragraph_tokens = paragraph.split()
        if token_count + len(paragraph_tokens) > max_tokens:
            if current_chunk:  # Only append if current_chunk is not empty
                chunks.append(" ".join(current_chunk))
            current_chunk, token_count = [], 0

        current_chunk.extend(paragraph_tokens)
        token_count += len(paragraph_tokens)

    if current_chunk:
        chunks.append(" ".join(current_chunk))

    return chunks


# Note: PDF processing functions are in services/processing.py
