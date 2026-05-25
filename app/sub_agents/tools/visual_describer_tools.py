"""Visual Describer tools (§7.8)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from bson import ObjectId

from memory.assignments import _resolve_user_id
from memory.db import get_db
from sub_agents.tools.coach_tools import analyze_image_multimodal


def analyze_frame_for_description(
    image_base64: str,
    mime_type: str = "image/jpeg",
    detail_level: str = "concise",
) -> dict[str, Any]:
    """Description-focused frame analysis (uses Coach pipeline; narration fields emphasized)."""
    result = analyze_image_multimodal(image_base64=image_base64, mime_type=mime_type)
    return {
        "sceneDescription": result.get("sceneDescription"),
        "colourNotes": result.get("colourNotes"),
        "detailLevel": detail_level,
        "portfolioEntryId": result.get("portfolioEntryId"),
    }


def compute_spatial_position(image_base64: str) -> dict[str, Any]:
    """Heuristic spatial hint from critique spatial metadata when available."""
    analysis = analyze_image_multimodal(image_base64=image_base64)
    spatial = analysis.get("spatialMetadata") or {}
    rel = spatial.get("subject_relationships") or {}
    return {
        "primarySubjectPosition": rel.get("primary_subject_position", "center"),
        "depthAxis": rel.get("depth_axis", "foreground_midground"),
        "leadingLines": rel.get("leading_lines_present", False),
    }


def trigger_haptic_pattern(pattern: str) -> dict[str, Any]:
    """iOS haptic command placeholder for field client."""
    return {"pattern": pattern, "delivered": False, "note": "Haptic wired in iOS Phase 4"}


def narrate_capture_session(session_id: str) -> dict[str, Any]:
    doc = get_db().capture_sessions.find_one({"_id": ObjectId(session_id)})
    if not doc:
        return {"narration": [], "message": "Session not found"}
    interactions = doc.get("voice_interactions") or []
    return {"narration": interactions[-5:], "sessionId": session_id}


def atlas_search_scene_descriptions(query: str, limit: int = 5) -> dict[str, Any]:
    uid = _resolve_user_id(None)
    match: dict[str, Any] = {"user_id": uid} if uid else {}
    coll = get_db().portfolio_entries
    try:
        pipeline: list[dict[str, Any]] = [
            {"$search": {"index": "scene_search", "text": {"query": query}}},
        ]
        if match:
            pipeline.append({"$match": match})
        pipeline.extend([{"$limit": limit}, {"$project": {"scene_description": 1, "capture_intent": 1}}])
        hits = list(coll.aggregate(pipeline))
    except Exception:
        hits = list(
            coll.find(
                {**match, "scene_description": {"$regex": query, "$options": "i"}},
                projection={"scene_description": 1},
            ).limit(limit)
        )
    return {
        "matches": [
            {
                "id": str(h["_id"]),
                "sceneDescription": (h.get("scene_description") or "")[:300],
            }
            for h in hits
        ]
    }


def write_capture_session_event(
    session_id: str,
    user_said: str,
    agent_said: str,
    *,
    frame_captured: bool = False,
    haptic_pattern: str | None = None,
) -> dict[str, Any]:
    event = {
        "user_said": user_said,
        "agent_said": agent_said,
        "haptic_pattern": haptic_pattern,
        "frame_captured": frame_captured,
        "portfolio_entry_id": None,
        "timestamp": datetime.now(timezone.utc),
    }
    get_db().capture_sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$push": {"voice_interactions": event}},
    )
    return {"sessionId": session_id, "appended": True}
