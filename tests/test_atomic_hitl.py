"""Consolidation item 6 — atomic pending_approvals transitions."""

from __future__ import annotations

from datetime import datetime, timezone

from bson import ObjectId

from memory.db import get_db
from memory.pending_approvals import apply_decision


def test_atomic_apply_decision_race():
    uid = ObjectId()
    oid = get_db().pending_approvals.insert_one(
        {
            "user_id": uid,
            "agent_name": "triage",
            "proposed_action": {"type": "apply_tags", "target_id": "a", "payload": {}},
            "agent_reasoning": "test",
            "status": "pending",
            "user_decision": None,
            "created_at": datetime.now(timezone.utc),
        }
    ).inserted_id

    first = apply_decision(str(oid), "approve", user_id=str(uid))
    assert first["status"] == "approved"

    try:
        apply_decision(str(oid), "reject", user_id=str(uid))
        assert False, "second decision should fail"
    except ValueError as exc:
        assert "already" in str(exc).lower() or "race" in str(exc).lower() or "decided" in str(
            exc
        ).lower()
