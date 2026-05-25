"""HITL pending_approvals — list and apply user decisions (§5.7)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal

from bson import ObjectId

from memory.assignments import _resolve_user_id
from memory.db import get_db

DecisionAction = Literal["approve", "reject", "modify"]


def _serialize(doc: dict[str, Any]) -> dict[str, Any]:
    created = doc.get("created_at")
    decided = (doc.get("user_decision") or {}).get("decided_at")
    pa = doc.get("proposed_action") or {}
    return {
        "id": str(doc["_id"]),
        "agentName": doc.get("agent_name", ""),
        "proposedAction": {
            "type": pa.get("type", ""),
            "targetId": pa.get("target_id", ""),
            "payload": pa.get("payload") or {},
        },
        "agentReasoning": doc.get("agent_reasoning", ""),
        "status": doc.get("status", "pending"),
        "userDecision": doc.get("user_decision"),
        "createdAt": created.isoformat() if hasattr(created, "isoformat") else str(created),
        "decidedAt": decided.isoformat() if hasattr(decided, "isoformat") else None,
    }


def list_pending(
    user_id: str | None = None,
    *,
    status: str | None = "pending",
    agent_name: str | None = None,
    limit: int = 50,
) -> dict[str, Any]:
    uid = _resolve_user_id(user_id)
    if not uid:
        return {"items": [], "total": 0}
    query: dict[str, Any] = {"user_id": uid}
    if status:
        query["status"] = status
    if agent_name:
        query["agent_name"] = agent_name
    docs = list(
        get_db()
        .pending_approvals.find(query)
        .sort("created_at", -1)
        .limit(limit)
    )
    return {"items": [_serialize(d) for d in docs], "total": len(docs)}


def _execute_approved(doc: dict[str, Any], override_payload: dict[str, Any] | None) -> None:
    pa = doc.get("proposed_action") or {}
    action_type = pa.get("type")
    payload = {**(pa.get("payload") or {}), **(override_payload or {})}

    if action_type == "apply_tags":
        entry_ids = payload.get("entryIds") or []
        tags = payload.get("tags") or []
        if not entry_ids or not tags:
            return
        coll = get_db().portfolio_entries
        for eid in entry_ids:
            try:
                coll.update_one(
                    {"_id": ObjectId(eid)},
                    {"$addToSet": {"aesthetic_tags": {"$each": tags}}},
                )
            except Exception:
                continue

    elif action_type == "delete_entry":
        eid = payload.get("entryId") or pa.get("target_id")
        if eid:
            get_db().portfolio_entries.delete_one({"_id": ObjectId(eid)})

    elif action_type == "list_on_marketplace":
        eid = pa.get("target_id") or payload.get("portfolio_entry_id")
        if not eid:
            return
        marketplace = payload.get("marketplace") or "etsy"
        price = payload.get("suggestedListPrice") or payload.get("list_price") or 45.0
        now = datetime.now(timezone.utc)
        listing_doc = {
            "user_id": doc.get("user_id"),
            "portfolio_entry_id": eid,
            "marketplace": marketplace,
            "title": payload.get("title") or "Fine art print",
            "description": payload.get("description") or "",
            "tags": payload.get("tags") or [],
            "list_price": float(price),
            "currency": payload.get("currency") or "USD",
            "status": "listed",
            "listed_at": now,
            "units_sold": 0,
            "revenue": 0.0,
            "hitl_approval_id": str(doc["_id"]),
            "created_at": now,
        }
        get_db().print_sales.insert_one(listing_doc)


def apply_decision(
    approval_id: str,
    action: DecisionAction,
    *,
    override_payload: dict[str, Any] | None = None,
    user_id: str | None = None,
) -> dict[str, Any]:
    uid = _resolve_user_id(user_id)
    oid = ObjectId(approval_id)
    coll = get_db().pending_approvals
    doc = coll.find_one({"_id": oid})
    if not doc:
        raise ValueError("Pending approval not found")
    if uid and doc.get("user_id") != uid:
        raise ValueError("Not authorized for this approval")
    if doc.get("status") != "pending":
        raise ValueError(f"Approval already {doc.get('status')}")

    now = datetime.now(timezone.utc)
    if action == "reject":
        status = "rejected"
    elif action == "modify":
        status = "modified"
    else:
        status = "approved"

    if status in ("approved", "modified"):
        _execute_approved(doc, override_payload)

    coll.update_one(
        {"_id": oid},
        {
            "$set": {
                "status": status,
                "user_decision": {
                    "action": action,
                    "override_payload": override_payload,
                    "decided_at": now,
                },
            }
        },
    )
    updated = coll.find_one({"_id": oid})
    assert updated
    return _serialize(updated)
