
import json
import os
import uuid
from datetime import datetime
from threading import Lock
from dotenv import load_dotenv

load_dotenv()

LOG_FILE = os.getenv("LOG_FILE", "logs.json")
_lock = Lock()


def _read_logs() -> list[dict]:
    """Read all logs from the JSON file."""
    if not os.path.exists(LOG_FILE):
        return []
    try:
        with open(LOG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return []


def _write_logs(logs: list[dict]) -> None:
    """Write the full logs list back to the JSON file."""
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        json.dump(logs, f, indent=2, ensure_ascii=False)


def save_log(plate: str, image_b64: str, confidence: float = 0.0) -> dict:
    """
    Append a new detection log entry and return the saved object.

    Entry schema:
    {
        "id":        "uuid4",
        "plate":     "GJ01AB1234",
        "timestamp": "2026-03-22 21:46:33",
        "confidence": 0.92,
        "image_b64": "<base64-jpeg>"
    }
    """
    entry = {
        "id": str(uuid.uuid4()),
        "plate": plate,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "confidence": confidence,
        "image_b64": image_b64,
    }

    with _lock:
        logs = _read_logs()
        logs.insert(0, entry)          
        _write_logs(logs)

    return entry


def get_all_logs() -> list[dict]:
    """Return all logs (newest first)."""
    with _lock:
        return _read_logs()


def delete_log(log_id: str) -> bool:
    """
    Delete a log entry by its UUID.
    Returns True if found and deleted, False if not found.
    """
    with _lock:
        logs = _read_logs()
        original_len = len(logs)
        logs = [log for log in logs if log["id"] != log_id]
        if len(logs) == original_len:
            return False
        _write_logs(logs)
        return True
