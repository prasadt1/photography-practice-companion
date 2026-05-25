"""Persist derived aesthetic_profile documents (change-stream listener + on-demand)."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId

from memory.user_ids import to_mongo_user_id

from memory.db import get_db
from memory.portfolio import compute_aesthetic_summary

logger = logging.getLogger(__name__)

# Bump when upsert shape changes (visible in Cloud Run logs after redeploy).
UPSERT_VERSION = "v3-library-photo-count"


def upsert_aesthetic_profile(*, user_id: str | ObjectId) -> dict[str, Any]:
    """Recompute from recent portfolio and upsert aesthetic_profile collection."""
    uid = to_mongo_user_id(user_id) if isinstance(user_id, str) else user_id
    summary = compute_aesthetic_summary(user_id=str(uid))
    total_photos = get_db().portfolio_entries.count_documents({"user_id": uid})
    now = datetime.now(timezone.utc)
    doc = {
        "user_id": uid,
        "photo_count": total_photos,
        "computed_from_portfolio_size": total_photos,
        "dominant_tags": summary.get("dominantTags") or [],
        "average_scores": summary.get("averageScores") or {},
        "stylistic_consistency_score": summary.get("stylisticConsistencyScore"),
        "computed_at": now,
        "updated_at": now,
        "upsert_version": UPSERT_VERSION,
    }
    logger.info(
        "aesthetic_profile upsert %s user=%s total_photos=%s",
        UPSERT_VERSION,
        uid,
        total_photos,
    )
    get_db().aesthetic_profile.update_one(
        {"user_id": uid},
        {"$set": doc, "$setOnInsert": {"created_at": now}},
        upsert=True,
    )
    summary["photoCount"] = total_photos
    return summary
