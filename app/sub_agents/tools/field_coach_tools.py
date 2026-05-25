"""Field Coach session tools (§7.9)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from bson import ObjectId

from memory.assignments import _resolve_user_id
from memory.db import get_db

_FIELD_STATE: dict[str, dict[str, Any]] = {}


def get_session_state(session_id: str | None = None) -> dict[str, Any]:
    key = session_id or "default"
    state = _FIELD_STATE.get(key, {"suggestions": [], "framesSeen": 0})
    return {"sessionId": key, **state}


def update_session_state(
    session_id: str | None = None,
    suggestion: str | None = None,
    increment_frames: bool = True,
) -> dict[str, Any]:
    key = session_id or "default"
    state = _FIELD_STATE.setdefault(key, {"suggestions": [], "framesSeen": 0})
    if increment_frames:
        state["framesSeen"] = int(state.get("framesSeen", 0)) + 1
    if suggestion:
        state.setdefault("suggestions", []).append(
            {"text": suggestion, "at": datetime.now(timezone.utc).isoformat()}
        )
    return get_session_state(key)


def start_capture_session(location_description: str = "") -> dict[str, Any]:
    uid = _resolve_user_id(None)
    if not uid:
        raise ValueError("No user for capture session")
    doc = {
        "user_id": uid,
        "started_at": datetime.now(timezone.utc),
        "ended_at": None,
        "location_description": location_description,
        "voice_interactions": [],
    }
    result = get_db().capture_sessions.insert_one(doc)
    return {"sessionId": str(result.inserted_id)}
