"""Planner sub-agent tools (§7.4)."""

from __future__ import annotations

import os
from typing import Any

from bson import ObjectId

from memory.assignments import propose_assignment
from memory.db import get_db
from orchestrator.memory_tools import get_active_practice_assignment
from tools.grounding import ground_principles


_SKILL_KEYS = ("composition", "lighting", "technique", "creativity", "subject_impact")


def get_portfolio_aggregates_by_skill(user_id: str | None = None, limit: int = 8) -> dict[str, Any]:
    """Skill-dimension averages from recent portfolio (Planner-specific aggregation)."""
    from memory.assignments import _resolve_user_id

    uid = _resolve_user_id(user_id)
    if uid is None:
        return {"averages": {}, "snapshots": [], "message": "No user context"}
    docs = list(
        get_db()
        .portfolio_entries.find({"user_id": uid}, projection={"scores": 1, "shoot_id": 1, "aesthetic_tags": 1})
        .sort("created_at", -1)
        .limit(limit)
    )
    if not docs:
        return {"averages": {}, "snapshots": []}
    sums = {k: 0.0 for k in _SKILL_KEYS}
    for doc in docs:
        scores = doc.get("scores") or {}
        for k in _SKILL_KEYS:
            sums[k] += float(scores.get(k, 0))
    n = len(docs)
    averages = {k: round(sums[k] / n, 1) for k in _SKILL_KEYS}
    snapshots = [
        {
            "shootId": str(d.get("shoot_id", "")),
            "scores": d.get("scores") or {},
            "tags": d.get("aesthetic_tags") or [],
        }
        for d in docs[:5]
    ]
    return {"averages": averages, "snapshots": snapshots}


def get_active_assignment() -> dict[str, Any]:
    return get_active_practice_assignment()


def write_practice_assignment(mode: str = "hobbyist") -> dict[str, Any]:
    """Create a proposed assignment (HITL — user Accepts in Practice tab)."""
    if mode not in ("hobbyist", "working_pro", "vision_impairment"):
        mode = "hobbyist"
    return propose_assignment(mode=mode)


def query_data_store_principles_for_assignment(scene_type: str = "general") -> dict[str, Any]:
    """Principles to ground assignment rationale."""
    citations = ground_principles(scene_type)
    return {"sceneType": scene_type, "citations": [c.model_dump() for c in citations]}


def query_client_outcomes(user_id: str | None = None, limit: int = 5) -> dict[str, Any]:
    """Working-pro client outcome history (empty until populated)."""
    from memory.assignments import _resolve_user_id

    uid = _resolve_user_id(user_id)
    if uid is None:
        return {"outcomes": []}
    docs = list(
        get_db()
        .client_outcomes.find({"user_id": uid})
        .sort("delivered_at", -1)
        .limit(limit)
    )
    return {
        "outcomes": [
            {
                "id": str(d["_id"]),
                "clientId": str(d.get("client_id", "")),
                "conversionRate": d.get("conversion_rate"),
            }
            for d in docs
        ]
    }
