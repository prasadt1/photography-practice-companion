"""Deterministic triage scan for demo HITL (creates pending_approvals without LLM wait)."""

from __future__ import annotations

from typing import Any

from datetime import datetime, timezone

from memory.assignments import _resolve_user_id
from memory.db import get_db
from memory.pending_approvals import list_pending
from sub_agents.tools import triage_tools


def _supersede_pending_triage(uid) -> int:
    """Clear old pending triage cards so a new scan does not stack duplicates."""
    result = get_db().pending_approvals.update_many(
        {"user_id": uid, "agent_name": "triage", "status": "pending"},
        {
            "$set": {
                "status": "rejected",
                "user_decision": {
                    "action": "reject",
                    "override_payload": None,
                    "decided_at": datetime.now(timezone.utc),
                },
            }
        },
    )
    return result.modified_count


def run_triage_scan(user_id: str | None = None) -> dict[str, Any]:
    """
    Run Triage tooling directly and ensure at least one pending proposal exists.
    Used by web Triage tab for reliable demo; agentic path uses /api/v1/agent/chat.
    """
    uid = _resolve_user_id(user_id)
    if not uid:
        raise ValueError("Set DEMO_USER_ID in .env")

    superseded = _supersede_pending_triage(uid)

    clusters = triage_tools.cluster_portfolio_by_embedding(str(uid), k=5)
    duplicates = triage_tools.find_duplicate_portfolio_entries(str(uid), limit=5)
    gems = triage_tools.surface_top_scoring_untouched_photos(str(uid), limit=3)

    proposals: list[dict[str, Any]] = []

    cluster_list = clusters.get("clusters") or []
    if cluster_list:
        top = cluster_list[0]
        entry_ids = top.get("entryIds") or []
        if entry_ids:
            proposals.append(
                triage_tools.propose_bulk_tag_application(
                    entry_ids[:5],
                    tags=[top.get("label", "portfolio"), "triage_reviewed"],
                    reasoning=(
                        f"Triage clustered {top.get('count', 0)} photos under '{top.get('label')}'. "
                        "Harmonizing tags improves Memory search and aesthetic profile."
                    ),
                )
            )

    for dup in (duplicates.get("candidates") or [])[:1]:
        ids = dup.get("entryIds") or []
        if len(ids) > 4:
            proposals.append(
                triage_tools.propose_photo_deletion(
                    ids[-1],
                    reasoning=(
                        f"Shoot {dup.get('shootId')} has {len(ids)} similar frames; "
                        "removing the weakest duplicate frees library space."
                    ),
                )
            )

    for photo in (gems.get("photos") or [])[:1]:
        pid = photo.get("id")
        if pid:
            proposals.append(
                triage_tools.propose_bulk_tag_application(
                    [pid],
                    tags=["portfolio_gem", "high_score"],
                    reasoning=(
                        f"Strong score ({photo.get('averageScore')}) but no tags yet — "
                        "mark as a portfolio gem for Memory and Print Sales."
                    ),
                )
            )

    pending = list_pending(str(uid), status="pending", agent_name="triage")

    return {
        "clusters": cluster_list,
        "duplicateCandidates": duplicates.get("candidates") or [],
        "untaggedGems": gems.get("photos") or [],
        "proposalsCreated": proposals,
        "pending": pending,
        "supersededPending": superseded,
    }
