"""Portfolio score trends for Memory tab sparklines."""

from __future__ import annotations

import os
from datetime import datetime
from typing import Any

from bson import ObjectId

from memory.user_ids import to_mongo_user_id

from memory.db import get_db
from memory.portfolio import _avg_score

SCORE_KEYS = ("composition", "lighting", "technique", "creativity", "subject_impact")

DIMENSION_LABELS = {
    "composition": "Composition",
    "lighting": "Lighting",
    "technique": "Technique",
    "creativity": "Creativity",
    "subject_impact": "Subject",
    "overall": "Overall",
}


def _user_query(user_id: str | None) -> dict[str, Any]:
    query: dict[str, Any] = {}
    demo_user = os.environ.get("DEMO_USER_ID")
    if user_id:
        query["user_id"] = to_mongo_user_id(user_id)
    elif demo_user:
        query["user_id"] = ObjectId(demo_user)
    return query


def _delta_recent_vs_older(values: list[float]) -> float | None:
    """Compare average of newer half vs older half (chronological list)."""
    n = len(values)
    if n < 4:
        return None
    mid = n // 2
    older = sum(values[:mid]) / mid
    newer = sum(values[mid:]) / (n - mid)
    return round(newer - older, 1)


def compute_portfolio_trends(
    *,
    limit: int = 12,
    user_id: str | None = None,
) -> dict[str, Any]:
    """
    Time-ordered score series (oldest → newest) for sparklines and trend arrows.
    """
    limit = max(4, min(limit, 24))
    query = _user_query(user_id)

    docs = list(
        get_db()
        .portfolio_entries.find(query, projection={"scores": 1, "created_at": 1})
        .sort("created_at", 1)
        .limit(limit)
    )

    if not docs:
        return {
            "photoCount": 0,
            "points": [],
            "dimensions": [],
            "insufficientData": True,
        }

    points: list[dict[str, Any]] = []
    for doc in docs:
        scores = doc.get("scores") or {}
        created = doc.get("created_at")
        if isinstance(created, datetime):
            created_iso = created.isoformat()
        else:
            created_iso = str(created) if created else ""
        row: dict[str, Any] = {"createdAt": created_iso}
        for k in SCORE_KEYS:
            row[k] = round(float(scores.get(k, 0)), 1)
        row["overall"] = round(_avg_score(scores), 1)
        points.append(row)

    dimensions: list[dict[str, Any]] = []
    for key in (*SCORE_KEYS, "overall"):
        values = [float(p[key]) for p in points]
        delta = _delta_recent_vs_older(values)
        dimensions.append(
            {
                "key": key,
                "label": DIMENSION_LABELS.get(key, key),
                "values": values,
                "latest": values[-1] if values else None,
                "delta": delta,
                "trend": (
                    "up"
                    if delta is not None and delta > 0.15
                    else "down"
                    if delta is not None and delta < -0.15
                    else "flat"
                ),
            }
        )

    return {
        "photoCount": len(points),
        "points": points,
        "dimensions": dimensions,
        "insufficientData": len(points) < 4,
    }
