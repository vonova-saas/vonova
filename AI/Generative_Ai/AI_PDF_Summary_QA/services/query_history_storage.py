import os
import json
import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

_memory_query_history: List[Dict[str, Any]] = []

_redis_client = None

def initialize_query_history_storage():
    global _redis_client
    
    if not REDIS_AVAILABLE:
        return False
    
    try:
        redis_host = os.getenv('REDIS_HOST', 'localhost')
        redis_port = int(os.getenv('REDIS_PORT', 6379))
        redis_db = int(os.getenv('REDIS_DB', 0))
        redis_password = os.getenv('REDIS_PASSWORD')
        
        _redis_client = redis.Redis(
            host=redis_host,
            port=redis_port,
            db=redis_db,
            password=redis_password,
            decode_responses=True,
            socket_connect_timeout=5
        )
        
        _redis_client.ping()
        return True
    except Exception:
        _redis_client = None
        return False

def store_query_history(
    session_id: str,
    query_text: str,
    response: str,
    chunks_used: List[str],
    tokens_used: int = 0,
    model_used: str = "gemini",
    response_time: float = 0.0
) -> str:
    query_id = str(uuid.uuid4())
    
    query_entry = {
        "query_id": query_id,
        "session_id": session_id,
        "query_text": query_text,
        "response": response,
        "chunks_used": [chunk[:100] for chunk in chunks_used],
        "created_at": datetime.now().isoformat(),
        "tokens_used": tokens_used,
        "model_used": model_used,
        "response_time": response_time
    }
    
    try:
        if _redis_client:
            key = f"query_history:{session_id}"
            _redis_client.lpush(key, json.dumps(query_entry))
            _redis_client.expire(key, 2592000)  # 30 days
        else:
            _memory_query_history.append(query_entry)
        return query_id
    except Exception:
        try:
            _memory_query_history.append(query_entry)
            return query_id
        except Exception:
            return query_id

def get_query_history(session_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    try:
        if _redis_client:
            key = f"query_history:{session_id}"
            entries = _redis_client.lrange(key, 0, limit - 1)
            return [json.loads(entry) for entry in entries]
        else:
            return [
                entry for entry in _memory_query_history
                if entry.get("session_id") == session_id
            ][:limit]
    except Exception:
        return []

def delete_query_history(session_id: str) -> bool:
    try:
        if _redis_client:
            key = f"query_history:{session_id}"
            deleted = _redis_client.delete(key)
            return deleted > 0
        else:
            global _memory_query_history
            _memory_query_history = [
                entry for entry in _memory_query_history
                if entry.get("session_id") != session_id
            ]
            return True
    except Exception:
        return False

initialize_query_history_storage()
