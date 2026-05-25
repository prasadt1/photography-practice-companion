"""HITL pending_approvals — list and apply user decisions (§5.7)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal

from bson import ObjectId
from pymongo import ReturnDocument

from memory.assignments import _resolve_user_id
from memory.db import get_db
from memory.prompt_overrides import write_override_history

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
        from sub_agents.print_sales_marketplace_schemas import generate_listing_document

        listing_base = generate_listing_document(
            marketplace if marketplace in ("etsy", "society6", "redbubble", "saatchi_art") else "etsy",
            portfolio_entry_id=str(eid),
            title=payload.get("title") or "Fine art print",
            description=payload.get("description") or "",
            list_price=float(price),
        )
        listing_doc = {
            "user_id": doc.get("user_id"),
            "portfolio_entry_id": eid,
            "marketplace": listing_base["marketplace"],
            "title": listing_base["title"],
            "description": listing_base["description"],
            "tags": payload.get("tags") or listing_base["marketplace_listing_metadata"].get("tags", []),
            "list_price": listing_base["list_price"],
            "currency": payload.get("currency") or "USD",
            "status": "listed",
            "listed_at": now,
            "units_sold": 0,
            "revenue": 0.0,
            "hitl_approval_id": str(doc["_id"]),
            "created_at": now,
            "marketplace_listing_metadata": listing_base["marketplace_listing_metadata"],
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
    existing = coll.find_one({"_id": oid})
    if not existing:
        raise ValueError("Pending approval not found")
    if uid and existing.get("user_id") != uid:
        raise ValueError("Not authorized for this approval")
    if existing.get("status") != "pending":
        raise ValueError(f"Approval already {existing.get('status')}")

    now = datetime.now(timezone.utc)
    if action == "reject":
        status = "rejected"
    elif action == "modify":
        status = "modified"
    else:
        status = "approved"

    user_decision = {
        "action": action,
        "override_payload": override_payload,
        "decided_at": now,
    }

    updated = coll.find_one_and_update(
        {"_id": oid, "status": "pending"},
        {"$set": {"status": status, "user_decision": user_decision}},
        return_document=ReturnDocument.AFTER,
    )
    if not updated:
        raise ValueError("Approval was already decided (race)")

    if status in ("approved", "modified"):
        _execute_approved(updated, override_payload)
        if action == "modify" and override_payload:
            write_override_history(
                updated["user_id"],
                updated.get("agent_name", ""),
                override_type="hitl_modify",
                original=(updated.get("proposed_action") or {}).get("payload"),
                modified=override_payload,
            )

    return _serialize(updated)
