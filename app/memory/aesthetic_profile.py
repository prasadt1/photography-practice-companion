"""Persist derived aesthetic_profile documents (change-stream listener + on-demand)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from bson import ObjectId

from memory.db import get_db
from memory.portfolio import compute_aesthetic_summary


def upsert_aesthetic_profile(*, user_id: str | ObjectId) -> dict[str, Any]:
    """Recompute from recent portfolio and upsert aesthetic_profile collection."""
    uid = ObjectId(user_id) if isinstance(user_id, str) else user_id
    summary = compute_aesthetic_summary(user_id=str(uid))
    now = datetime.now(timezone.utc)
    doc = {
        "user_id": uid,
        "photo_count": summary.get("photoCount", 0),
        "dominant_tags": summary.get("dominantTags") or [],
        "average_scores": summary.get("averageScores") or {},
        "stylistic_consistency_score": summary.get("stylisticConsistencyScore"),
        "computed_at": now,
        "updated_at": now,
    }
    get_db().aesthetic_profile.update_one(
        {"user_id": uid},
        {"$set": doc, "$setOnInsert": {"created_at": now}},
        upsert=True,
    )
    return summary
