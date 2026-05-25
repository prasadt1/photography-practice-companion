"""Orchestrator read tools — MCP-primary reads via memory.mcp_reads."""

from __future__ import annotations

import os
from typing import Any

from memory.assignments import get_active_assignment, list_assignments
from memory.portfolio import compute_aesthetic_summary, list_portfolio_entries


def get_active_practice_assignment() -> dict[str, Any]:
    """Return the user's active practice assignment, or a message if none."""
    active = get_active_assignment()
    if not active:
        return {"active": None, "message": "No active assignment. User may propose one in Practice tab."}
    return {"active": active}


def get_recent_portfolio(limit: int = 5) -> dict[str, Any]:
    """Summarize recent portfolio critiques (scores, tags, scene descriptions)."""
    limit = max(1, min(int(limit), 20))
    data = list_portfolio_entries(limit=limit)
    entries = []
    for e in data.get("entries", []):
        entries.append(
            {
                "id": e["id"],
                "createdAt": e.get("createdAt"),
                "overallAverage": e.get("overallAverage"),
                "scores": e.get("scores"),
                "aestheticTags": e.get("aestheticTags"),
                "sceneDescription": (e.get("sceneDescription") or "")[:300],
            }
        )
    return {"entries": entries, "total": data.get("total", len(entries))}


def get_aesthetic_profile_summary() -> dict[str, Any]:
    """Dominant tags and average scores from recent portfolio."""
    return compute_aesthetic_summary()


def list_practice_assignments() -> dict[str, Any]:
    """Proposed, active, and completed assignments for the demo user."""
    return list_assignments()


def search_glass_box_feedback(query: str, limit: int = 5) -> dict[str, Any]:
    """
    Full-text style search over past Glass Box observations (Atlas Search with regex fallback).
    """
    from memory.assignments import _resolve_user_id
    from memory.db import get_db

    limit = max(1, min(int(limit), 15))
    uid = _resolve_user_id(None)
    match: dict[str, Any] = {"user_id": uid} if uid else {}
    q = query.strip()
    if not q:
        return {"matches": [], "message": "Provide a search query."}

    from memory import mcp_reads
    from memory.atlas_features import atlas_fallback_allowed, require_atlas_features

    coll = get_db().portfolio_entries
    try:
        pipeline: list[dict[str, Any]] = [
            {"$search": {"index": "glass_box_search", "text": {"query": q}}},
        ]
        if match:
            pipeline.append({"$match": match})
        pipeline.extend(
            [
                {"$limit": limit},
                {
                    "$project": {
                        "scores": 1,
                        "aesthetic_tags": 1,
                        "scene_description": 1,
                        "glass_box.observations": 1,
                        "created_at": 1,
                    }
                },
            ]
        )
        docs = mcp_reads.aggregate(coll, pipeline)
        mode = "atlas_search"
    except Exception as exc:
        if require_atlas_features() and not atlas_fallback_allowed():
            raise RuntimeError(f"Atlas Search required: {exc}") from exc
        regex = {"$regex": q, "$options": "i"}
        filt = {**match, "$or": [{"glass_box.observations": regex}, {"scene_description": regex}]}
        docs = mcp_reads.find(
            coll,
            filt,
            projection={"scores": 1, "glass_box": 1, "scene_description": 1},
            limit=limit,
            sort=[("created_at", -1)],
        )
        mode = "regex_fallback"

    matches = []
    for doc in docs:
        gb = doc.get("glass_box") or {}
        matches.append(
            {
                "id": str(doc["_id"]),
                "sceneDescription": (doc.get("scene_description") or "")[:200],
                "observations": (gb.get("observations") or [])[:3],
                "scores": doc.get("scores"),
            }
        )
    return {"query": q, "mode": mode, "matches": matches}
