"""HITL supersession — immutable pending docs; agent revisions create new proposals (§5.7)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from bson import ObjectId

from memory.assignments import _resolve_user_id
from memory.db import get_db


def supersede_approval(
    old_id: str | ObjectId,
    *,
    agent_name: str,
    action_type: str,
    target_id: str,
    payload: dict[str, Any],
    reasoning: str,
    user_id: str | None = None,
) -> ObjectId:
    """
    Atomically reject `old_id` (still pending) and insert a new pending approval.
    Old doc records metadata.superseded_by = new_id; user_decision.action is null.
    """
    uid = _resolve_user_id(user_id)
    if not uid:
        raise ValueError("user_id required for supersession")
    old_oid = ObjectId(old_id)
    coll = get_db().pending_approvals
    now = datetime.now(timezone.utc)
    new_doc = {
        "user_id": uid,
        "agent_name": agent_name,
        "proposed_action": {
            "type": action_type,
            "target_id": target_id,
            "payload": payload,
        },
        "agent_reasoning": reasoning,
        "status": "pending",
        "user_decision": None,
        "created_at": now,
        "metadata": {"supersedes": str(old_oid)},
    }
    insert = coll.insert_one(new_doc)
    new_oid = insert.inserted_id
    result = coll.find_one_and_update(
        {"_id": old_oid, "user_id": uid, "status": "pending"},
        {
            "$set": {
                "status": "rejected",
                "user_decision": {
                    "action": None,
                    "override_payload": None,
                    "decided_at": now,
                },
                "metadata": {"superseded_by": str(new_oid)},
            }
        },
    )
    if not result:
        coll.delete_one({"_id": new_oid})
        raise ValueError("Original approval not pending or not found")
    return new_oid
