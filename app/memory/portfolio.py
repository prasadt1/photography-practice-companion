"""Portfolio reads for Memory tab (Phase 3)."""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId

from memory.user_ids import to_mongo_user_id

from memory.db import get_db
from tools.gcs import signed_https_url

logger = logging.getLogger(__name__)


def _avg_score(scores: dict[str, Any]) -> float:
    keys = ("composition", "lighting", "technique", "creativity", "subject_impact")
    vals = [float(scores[k]) for k in keys if k in scores and scores[k] is not None]
    return sum(vals) / len(vals) if vals else 0.0


def _image_url_for_client(gs_or_https: str) -> str:
    if gs_or_https.startswith("gs://"):
        try:
            return signed_https_url(gs_or_https)
        except Exception as exc:
            logger.warning("signed URL failed for %s: %s", gs_or_https[:80], exc)
            return ""
    return gs_or_https


def _serialize_mongo_doc(doc: dict[str, Any] | None) -> dict[str, Any] | None:
    """JSON-safe dict for API responses (ObjectId, datetime, etc.)."""
    if not doc:
        return None
    out: dict[str, Any] = {}
    for key, value in doc.items():
        if key == "_id":
            out["id"] = str(value)
        elif isinstance(value, ObjectId):
            out[key] = str(value)
        elif isinstance(value, datetime):
            out[key] = value.isoformat()
        elif isinstance(value, dict):
            out[key] = _serialize_mongo_doc(value) or {}
        elif isinstance(value, list):
            out[key] = [
                str(v)
                if isinstance(v, ObjectId)
                else v.isoformat()
                if isinstance(v, datetime)
                else v
                for v in value
            ]
        else:
            out[key] = value
    return out


def _serialize_entry(doc: dict[str, Any]) -> dict[str, Any]:
    scores = doc.get("scores") or {}
    created = doc.get("created_at")
    if isinstance(created, datetime):
        created_iso = created.isoformat()
    else:
        created_iso = str(created) if created else ""

    thumb = doc.get("thumbnail_url") or doc.get("image_url") or ""
    return {
        "id": str(doc["_id"]),
        "userId": str(doc.get("user_id", "")),
        "shootId": str(doc.get("shoot_id", "")),
        "imageUrl": _image_url_for_client(thumb),
        "createdAt": created_iso,
        "scores": scores,
        "overallAverage": round(_avg_score(scores), 1),
        "aestheticTags": doc.get("aesthetic_tags") or [],
        "sceneDescription": doc.get("scene_description"),
        "colourNotes": doc.get("colour_notes"),
        "glassBoxSummary": (doc.get("glass_box") or {}).get("observations", [])[:2],
    }


def list_portfolio_entries(
    *,
    limit: int = 48,
    user_id: str | None = None,
) -> dict[str, Any]:
    query: dict[str, Any] = {}
    demo_user = os.environ.get("DEMO_USER_ID")
    if user_id:
        query["user_id"] = to_mongo_user_id(user_id)
    elif demo_user:
        query["user_id"] = ObjectId(demo_user)

    from memory import mcp_reads

    coll = get_db().portfolio_entries
    docs = mcp_reads.find(
        coll,
        query,
        projection={"embedding": 0},
        limit=max(1, min(limit, 100)),
        sort=[("created_at", -1)],
    )
    entries = [_serialize_entry(doc) for doc in docs]
    return {"entries": entries, "total": len(entries)}


def compute_aesthetic_summary(
    *,
    user_id: str | None = None,
    sample_size: int = 20,
) -> dict[str, Any]:
    """Lightweight profile until change-stream listener is deployed."""
    query: dict[str, Any] = {}
    demo_user = os.environ.get("DEMO_USER_ID")
    if user_id:
        query["user_id"] = to_mongo_user_id(user_id)
    elif demo_user:
        query["user_id"] = ObjectId(demo_user)

    total_photos = (
        get_db().portfolio_entries.count_documents(query) if query else 0
    )

    from memory import mcp_reads

    coll = get_db().portfolio_entries
    docs = mcp_reads.find(
        coll,
        query,
        projection={"scores": 1, "aesthetic_tags": 1},
        limit=sample_size,
        sort=[("created_at", -1)],
    )
    if not docs:
        return {
            "photoCount": total_photos,
            "profileSampleSize": 0,
            "dominantTags": [],
            "averageScores": {},
            "stylisticConsistencyScore": None,
        }

    tag_counts: dict[str, int] = {}
    sums = {k: 0.0 for k in ("composition", "lighting", "technique", "creativity", "subject_impact")}
    for doc in docs:
        for tag in doc.get("aesthetic_tags") or []:
            tag_counts[tag] = tag_counts.get(tag, 0) + 1
        scores = doc.get("scores") or {}
        for k in sums:
            sums[k] += float(scores.get(k, 0))

    n = len(docs)
    avg_scores = {k: round(sums[k] / n, 1) for k in sums}
    avgs_list = list(avg_scores.values())
    mean = sum(avgs_list) / len(avgs_list)
    variance = sum((x - mean) ** 2 for x in avgs_list) / len(avgs_list)
    consistency = max(0.0, min(1.0, 1.0 - (variance / 25.0)))

    dominant = sorted(tag_counts.items(), key=lambda x: -x[1])[:8]

    stored = None
    if demo_user or user_id:
        uid = to_mongo_user_id(user_id) if user_id else ObjectId(demo_user)
        stored = get_db().aesthetic_profile.find_one({"user_id": uid})

    return {
        "photoCount": total_photos,
        "profileSampleSize": n,
        "dominantTags": [t for t, _ in dominant],
        "averageScores": avg_scores,
        "stylisticConsistencyScore": round(consistency, 2),
        "storedProfile": _serialize_mongo_doc(stored),
        "computedAt": datetime.now(timezone.utc).isoformat(),
    }
