"""Deterministic print-sales scan for demo HITL (creates pending_approvals without LLM wait)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from memory.assignments import _resolve_user_id
from memory.db import get_db
from memory.pending_approvals import list_pending
from memory.portfolio import _avg_score
from sub_agents.tools import print_sales_tools


def _supersede_pending_print_sales(uid: str) -> int:
    result = get_db().pending_approvals.update_many(
        {"user_id": uid, "agent_name": "print_sales", "status": "pending"},
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


def _entry_already_pending(uid: str, entry_id: str) -> bool:
    return (
        get_db().pending_approvals.find_one(
            {
                "user_id": uid,
                "status": "pending",
                "agent_name": "print_sales",
                "proposed_action.target_id": entry_id,
            }
        )
        is not None
    )


def run_print_sales_scan(
    user_id: str | None = None,
    *,
    marketplace: str = "etsy",
    limit: int = 5,
) -> dict[str, Any]:
    """
    Rank recent portfolio entries and create list_on_marketplace proposals.
    Agentic path: Mentor → orchestrator → print_sales sub-agent → same collection.
    """
    uid = _resolve_user_id(user_id)
    if not uid:
        raise ValueError("Set DEMO_USER_ID in .env")

    superseded = _supersede_pending_print_sales(str(uid))

    entries = list(
        get_db()
        .portfolio_entries.find({"user_id": uid})
        .sort("created_at", -1)
        .limit(48)
    )
    ranked = sorted(
        entries,
        key=lambda d: _avg_score(d.get("scores") or {}),
        reverse=True,
    )

    proposals: list[dict[str, Any]] = []
    for doc in ranked:
        if len(proposals) >= limit:
            break
        eid = str(doc["_id"])
        if _entry_already_pending(str(uid), eid):
            continue

        meta = print_sales_tools.generate_listing_metadata(eid, marketplace=marketplace)
        if meta.get("error"):
            continue

        score = round(_avg_score(doc.get("scores") or {}), 1)
        proposals.append(
            print_sales_tools.propose_listing_publication(
                eid,
                meta.get("marketplace", marketplace),
                listing_metadata=meta,
                reasoning=(
                    f"Portfolio score {score}/10 — strong candidate for "
                    f"{meta.get('marketplace', marketplace)}. "
                    "Review title, price, and copy before anything is listed."
                ),
            )
        )

    pending = list_pending(str(uid), status="pending", agent_name="print_sales")

    return {
        "proposalsCreated": proposals,
        "pending": pending,
        "supersededPending": superseded,
        "candidatesConsidered": len(ranked),
    }
