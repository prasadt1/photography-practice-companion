"""Reflection sub-agent tools (§7.5)."""

from __future__ import annotations

from typing import Any

from bson import ObjectId

from memory.db import get_db
from orchestrator.memory_tools import get_aesthetic_profile_summary
from sub_agents.tools.planner_tools import get_active_assignment


def get_shoot_photos_with_scores(shoot_id: str, limit: int = 20) -> dict[str, Any]:
    """Portfolio entries for a shoot with scores and scene descriptions."""
    entries = list(
        get_db()
        .portfolio_entries.find({"shoot_id": ObjectId(shoot_id)})
        .sort("created_at", 1)
        .limit(limit)
    )
    return {
        "shootId": shoot_id,
        "photos": [
            {
                "id": str(e["_id"]),
                "scores": e.get("scores"),
                "sceneDescription": (e.get("scene_description") or "")[:300],
            }
            for e in entries
        ],
    }


def compare_multimodal_embeddings(
    shoot_id_a: str,
    shoot_id_b: str,
) -> dict[str, Any]:
    """Compare average embedding similarity between two shoots (when embeddings exist)."""
    coll = get_db().portfolio_entries

    def _mean_embedding(shoot_id: str) -> list[float] | None:
        docs = list(coll.find({"shoot_id": ObjectId(shoot_id)}, projection={"embedding": 1}))
        vectors = [d["embedding"] for d in docs if d.get("embedding")]
        if not vectors:
            return None
        dim = len(vectors[0])
        sums = [0.0] * dim
        for v in vectors:
            for i, x in enumerate(v):
                sums[i] += x
        return [s / len(vectors) for s in sums]

    a = _mean_embedding(shoot_id_a)
    b = _mean_embedding(shoot_id_b)
    if not a or not b or len(a) != len(b):
        return {"similarity": None, "message": "Insufficient embeddings on one or both shoots"}
    dot = sum(x * y for x, y in zip(a, b))
    na = sum(x * x for x in a) ** 0.5
    nb = sum(y * y for y in b) ** 0.5
    sim = dot / (na * nb) if na and nb else 0.0
    return {"similarity": round(sim, 4), "shootA": shoot_id_a, "shootB": shoot_id_b}


def write_skill_delta_to_assignment(assignment_id: str) -> dict[str, Any]:
    """Run reflection pipeline and persist skill_delta on assignment."""
    from memory.assignments import complete_assignment

    return complete_assignment(assignment_id)


def get_aesthetic_profile_summary_tool() -> dict[str, Any]:
    return get_aesthetic_profile_summary()
