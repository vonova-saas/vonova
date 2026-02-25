# Audio format support constants and helper functions

SUPPORTED_AUDIO_TYPES = {
    "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav",
    "audio/ogg", "audio/webm", "audio/mp4", "audio/x-m4a",
    "audio/m4a", "application/octet-stream",
}

FORMAT_MAP = {
    "audio/mpeg": "mp3", "audio/mp3": "mp3",
    "audio/wav": "wav", "audio/x-wav": "wav",
    "audio/ogg": "ogg", "audio/webm": "webm",
    "audio/mp4": "m4a", "audio/x-m4a": "m4a",
    "audio/m4a": "m4a", "application/octet-stream": "wav",
}

def resolve_audio_format(content_type: str, filename: str) -> str:
    """Resolve audio format from content type and filename."""
    if content_type in FORMAT_MAP:
        return FORMAT_MAP[content_type]
    if filename:
        ext = filename.rsplit(".", 1)[-1].lower()
        if ext in {"mp3", "wav", "ogg", "webm", "m4a"}:
            return ext
    return "wav"
