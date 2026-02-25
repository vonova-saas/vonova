import os
import tempfile
from typing import Tuple

from faster_whisper import WhisperModel

_whisper_model = None


def get_whisper_model() -> WhisperModel:
    global _whisper_model
    if _whisper_model is None:
      _whisper_model = WhisperModel("small", device="cpu", compute_type="int8")
    return _whisper_model


def transcribe_audio(audio_bytes: bytes, audio_format: str = "wav") -> Tuple[str, str, float]:
    model = get_whisper_model()

    with tempfile.NamedTemporaryFile(suffix=f".{audio_format}", delete=False) as tmp_file:
        tmp_file.write(audio_bytes)
        tmp_path = tmp_file.name

    try:
      segments, info = model.transcribe(
        tmp_path,
        beam_size=5,
        language=None,
        task="transcribe",
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500))

      segments = list(segments)
      text = " ".join(segment.text.strip() for segment in segments).strip()
      language = info.language
      duration = float(segments[-1].end) if segments else 0.0
      return text, language, duration
    finally:
      if os.path.exists(tmp_path):
        os.unlink(tmp_path)
