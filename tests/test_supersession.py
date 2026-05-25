"""Consolidation item 7 — HITL supersession preserves audit trail."""

from __future__ import annotations

from datetime import datetime, timezone

from bson import ObjectId

from memory.db import get_db
from memory.supersession import supersede_approval


def test_supersession_preserves_audit():
    uid = ObjectId()
    coll = get_db().pending_approvals
    old_id = coll.insert_one(
        {
            "user_id": uid,
            "agent_name": "triage",
            "proposed_action": {"type": "apply_tags", "target_id": "x", "payload": {}},
            "agent_reasoning": "first",
            "status": "pending",
            "user_decision": None,
            "created_at": datetime.now(timezone.utc),
        }
    ).inserted_id

    new_id = supersede_approval(
        old_id,
        agent_name="triage",
        action_type="apply_tags",
        target_id="y",
        payload={"tags": ["warm"]},
        reasoning="revised cluster",
        user_id=str(uid),
    )

    old = coll.find_one({"_id": old_id})
    new = coll.find_one({"_id": new_id})
    assert old["status"] == "rejected"
    assert old["user_decision"]["action"] is None
    assert old.get("metadata", {}).get("superseded_by") == str(new_id)
    assert new["status"] == "pending"
    assert new.get("metadata", {}).get("supersedes") == str(old_id)
