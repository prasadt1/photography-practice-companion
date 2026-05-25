"""Triage sub-agent tools (§7.6) — proposals go to pending_approvals."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from bson import ObjectId

from memory.assignments import _resolve_user_id
from memory.db import get_db


def _pending_doc(
    agent_name: str,
    action_type: str,
    target_id: str,
    payload: dict[str, Any],
    reasoning: str,
    user_id: ObjectId,
) -> dict[str, Any]:
    return {
        "user_id": user_id,
        "agent_name": agent_name,
        "proposed_action": {"type": action_type, "target_id": target_id, "payload": payload},
        "agent_reasoning": reasoning,
        "status": "pending",
        "user_decision": None,
        "created_at": datetime.now(timezone.utc),
    }


def cluster_portfolio_by_embedding(user_id: str | None = None, k: int = 5) -> dict[str, Any]:
    """Surface cluster candidates (embedding-backed when available)."""
    uid = _resolve_user_id(user_id)
    if not uid:
        return {"clusters": [], "message": "No user"}
    from memory import mcp_reads

    coll = get_db().portfolio_entries
    docs = mcp_reads.find(
        coll,
        {"user_id": uid},
        projection={"aesthetic_tags": 1, "scores": 1},
        limit=50,
        sort=[("created_at", -1)],
    )
    tag_buckets: dict[str, list[str]] = {}
    for d in docs:
        for tag in d.get("aesthetic_tags") or ["untagged"]:
            tag_buckets.setdefault(tag, []).append(str(d["_id"]))
    clusters = [
        {"label": tag, "entryIds": ids[:10], "count": len(ids)}
        for tag, ids in sorted(tag_buckets.items(), key=lambda x: -len(x[1]))[:k]
    ]
    return {"clusters": clusters}


def propose_bulk_tag_application(
    entry_ids: list[str],
    tags: list[str],
    reasoning: str,
) -> dict[str, Any]:
    uid = _resolve_user_id(None)
    if not uid:
        raise ValueError("No user context for HITL proposal")
    doc = _pending_doc(
        "triage",
        "apply_tags",
        entry_ids[0] if entry_ids else "",
        {"entryIds": entry_ids, "tags": tags},
        reasoning,
        uid,
    )
    result = get_db().pending_approvals.insert_one(doc)
    return {"pendingApprovalId": str(result.inserted_id), "status": "pending"}


def find_duplicate_portfolio_entries(user_id: str | None = None, limit: int = 10) -> dict[str, Any]:
    uid = _resolve_user_id(user_id)
    if not uid:
        return {"candidates": []}
    docs = list(
        get_db()
        .portfolio_entries.find({"user_id": uid}, projection={"shoot_id": 1, "created_at": 1})
        .sort("created_at", -1)
        .limit(100)
    )
    by_shoot: dict[str, list[str]] = {}
    for d in docs:
        sid = str(d.get("shoot_id", ""))
        by_shoot.setdefault(sid, []).append(str(d["_id"]))
    candidates = [
        {"shootId": sid, "entryIds": ids}
        for sid, ids in by_shoot.items()
        if len(ids) > 3
    ][:limit]
    return {"candidates": candidates}


def surface_top_scoring_untouched_photos(user_id: str | None = None, limit: int = 5) -> dict[str, Any]:
    uid = _resolve_user_id(user_id)
    if not uid:
        return {"photos": []}
    docs = list(
        get_db()
        .portfolio_entries.find({"user_id": uid}, projection={"scores": 1, "aesthetic_tags": 1})
        .sort("created_at", -1)
        .limit(40)
    )

    def _avg(scores: dict | None) -> float:
        if not scores:
            return 0.0
        vals = [float(v) for v in scores.values()]
        return sum(vals) / len(vals) if vals else 0.0

    ranked = sorted(docs, key=lambda d: _avg(d.get("scores")), reverse=True)
    untouched = [d for d in ranked if not (d.get("aesthetic_tags") or [])][:limit]
    return {
        "photos": [
            {"id": str(d["_id"]), "averageScore": round(_avg(d.get("scores")), 2)}
            for d in untouched
        ]
    }


def propose_photo_deletion(entry_id: str, reasoning: str) -> dict[str, Any]:
    uid = _resolve_user_id(None)
    if not uid:
        raise ValueError("No user context")
    doc = _pending_doc("triage", "delete_entry", entry_id, {"entryId": entry_id}, reasoning, uid)
    result = get_db().pending_approvals.insert_one(doc)
    return {"pendingApprovalId": str(result.inserted_id), "status": "pending"}
