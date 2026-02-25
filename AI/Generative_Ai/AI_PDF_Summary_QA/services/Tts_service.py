import os
import tempfile

import edge_tts

VOICE_MAP = {
    "ar": "ar-EG-SalmaNeural",
    "en": "en-US-JennyNeural",
    "fr": "fr-FR-DeniseNeural",
    "de": "de-DE-KatjaNeural",
    "es": "es-ES-ElviraNeural",
    "it": "it-IT-ElsaNeural",
    "pt": "pt-BR-FranciscaNeural",
    "ru": "ru-RU-SvetlanaNeural",
    "zh": "zh-CN-XiaoxiaoNeural",
    "ja": "ja-JP-NanamiNeural",
    "ko": "ko-KR-SunHiNeural",
    "tr": "tr-TR-EmelNeural",
}

DEFAULT_VOICE = "en-US-JennyNeural"


async def synthesize_speech(text: str, language: str) -> bytes:
    voice = VOICE_MAP.get(language, DEFAULT_VOICE)
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_file:
        tmp_path = tmp_file.name

    try:
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(tmp_path)

        with open(tmp_path, "rb") as audio_file:
            return audio_file.read()
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
