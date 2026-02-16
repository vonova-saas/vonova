import os
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

_memory_store: Dict[str, Dict[str, Any]] = {}

_redis_client = None

def initialize_storage():
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

def store_session(session_id: str, data: Dict[str, Any], ttl: Optional[int] = None) -> bool:
    if ttl is None:
        ttl = int(os.getenv('SESSION_TTL', 604800))
    
    try:
        data['created_at'] = datetime.now().isoformat()
        if 'expires_at' not in data:
            expires_at = datetime.now() + timedelta(seconds=ttl)
            data['expires_at'] = expires_at.isoformat()
        
        if _redis_client:
            key = f"session:{session_id}"
            _redis_client.setex(key, ttl, json.dumps(data))
            return True
        else:
            _memory_store[session_id] = data
            return True
    except Exception:
        try:
            _memory_store[session_id] = data
            return True
        except Exception:
            return False

def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    try:
        if _redis_client:
            key = f"session:{session_id}"
            data_str = _redis_client.get(key)
            if data_str:
                return json.loads(data_str)
            return None
        else:
            return _memory_store.get(session_id)
    except Exception:
        try:
            return _memory_store.get(session_id)
        except Exception:
            return None

def delete_session(session_id: str) -> bool:
    try:
        if _redis_client:
            key = f"session:{session_id}"
            deleted = _redis_client.delete(key)
            return deleted > 0
        else:
            if session_id in _memory_store:
                del _memory_store[session_id]
                return True
            return False
    except Exception:
        try:
            if session_id in _memory_store:
                del _memory_store[session_id]
                return True
            return False
        except Exception:
            return False

def session_exists(session_id: str) -> bool:
    try:
        if _redis_client:
            key = f"session:{session_id}"
            return _redis_client.exists(key) > 0
        else:
            return session_id in _memory_store
    except Exception:
        return session_id in _memory_store

def get_all_session_ids() -> list:
    try:
        if _redis_client:
            keys = _redis_client.keys("session:*")
            return [key.replace("session:", "") for key in keys]
        else:
            return list(_memory_store.keys())
    except Exception:
        return list(_memory_store.keys())

initialize_storage()
