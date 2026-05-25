"""Mentor sub-agent tools (§7.3)."""

from __future__ import annotations

from typing import Any

from orchestrator.memory_tools import (
    get_aesthetic_profile_summary,
    get_recent_portfolio,
    search_glass_box_feedback,
)
from sub_agents.tools.coach_tools import ground_in_data_store_principles


def atlas_search_glass_box(query: str, limit: int = 5) -> dict[str, Any]:
    """Full-text search over glass_box / scene fields (Atlas Search + fallback)."""
    return search_glass_box_feedback(query=query, limit=limit)


def vector_search_similar_photos(
    portfolio_entry_id: str,
    limit: int = 5,
) -> dict[str, Any]:
    """Vector similarity over portfolio embeddings (Atlas Vector Search when configured)."""
    from bson import ObjectId

    from memory.db import get_db

    from memory import mcp_reads
    from memory.atlas_features import atlas_fallback_allowed, require_atlas_features

    coll = get_db().portfolio_entries
    source = mcp_reads.find_one(
        coll,
        {"_id": ObjectId(portfolio_entry_id)},
        projection={"embedding": 1, "user_id": 1},
    )
    if not source or not source.get("embedding"):
        return {
            "matches": [],
            "message": "Source entry has no embedding; upload via Coach first.",
        }
    try:
        pipeline = [
            {
                "$vectorSearch": {
                    "index": "portfolio_vector",
                    "path": "embedding",
                    "queryVector": source["embedding"],
                    "numCandidates": max(limit * 10, 50),
                    "limit": limit + 1,
                }
            },
            {"$match": {"user_id": source["user_id"]}},
            {
                "$project": {
                    "scene_description": 1,
                    "aesthetic_tags": 1,
                    "scores": 1,
                    "score": {"$meta": "vectorSearchScore"},
                }
            },
        ]
        matches = mcp_reads.aggregate(coll, pipeline)
        out = []
        for m in matches:
            if str(m["_id"]) == portfolio_entry_id:
                continue
            out.append(
                {
                    "id": str(m["_id"]),
                    "score": m.get("score"),
                    "sceneDescription": (m.get("scene_description") or "")[:200],
                    "tags": m.get("aesthetic_tags") or [],
                }
            )
            if len(out) >= limit:
                break
        return {"matches": out}
    except Exception as exc:
        if require_atlas_features() and not atlas_fallback_allowed():
            raise RuntimeError(f"Atlas Vector Search required: {exc}") from exc
        return {"matches": [], "message": f"Vector search unavailable: {exc}"}


def get_recent_portfolio_aggregates_by_time(limit: int = 8) -> dict[str, Any]:
    """Recent portfolio entries with scores/tags (time-ordered)."""
    return get_recent_portfolio(limit=limit)


def get_aesthetic_profile_summary_tool() -> dict[str, Any]:
    return get_aesthetic_profile_summary()
