"""Assignment reads/writes for Practice tab (Phase 3 HITL)."""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId

from memory.db import get_db
from memory.user_ids import to_mongo_user_id


def _resolve_user_id(user_id: str | None) -> ObjectId | None:
    from memory.session_context import resolve_effective_user_id

    effective = resolve_effective_user_id(user_id)
    if effective:
        return to_mongo_user_id(effective)
    latest = get_db().portfolio_entries.find_one(
        sort=[("created_at", -1)],
        projection={"user_id": 1},
    )
    if latest and latest.get("user_id"):
        return latest["user_id"]
    return None


def _serialize(doc: dict[str, Any]) -> dict[str, Any]:
    skill = doc.get("skill_delta")
    created = doc.get("created_at")
    completed = doc.get("completed_at")
    return {
        "id": str(doc["_id"]),
        "userId": str(doc.get("user_id", "")),
        "status": doc.get("status"),
        "brief": doc.get("brief", ""),
        "targetSkill": doc.get("target_skill", ""),
        "rationale": doc.get("rationale", ""),
        "baselineShootIds": [str(x) for x in doc.get("baseline_shoot_ids") or []],
        "completionShootIds": [str(x) for x in doc.get("completion_shoot_ids") or []],
        "skillDelta": skill,
        "createdAt": created.isoformat() if isinstance(created, datetime) else str(created or ""),
        "completedAt": (
            completed.isoformat() if isinstance(completed, datetime) else None
        ),
    }


def list_assignments(user_id: str | None = None) -> dict[str, Any]:
    uid = _resolve_user_id(user_id)
    query: dict[str, Any] = {"user_id": uid} if uid else {}

    coll = get_db().assignments
    proposed = [_serialize(d) for d in coll.find({**query, "status": "proposed"}).sort("created_at", -1)]
    active = [_serialize(d) for d in coll.find({**query, "status": "active"}).sort("created_at", -1)]
    completed = [
        _serialize(d)
        for d in coll.find({**query, "status": "completed"}).sort("created_at", -1).limit(12)
    ]
    return {"proposed": proposed, "active": active, "completed": completed}


def accept_assignment(assignment_id: str, user_id: str | None = None) -> dict[str, Any]:
    coll = get_db().assignments
    oid = ObjectId(assignment_id)
    doc = coll.find_one({"_id": oid})
    if not doc:
        raise ValueError("Assignment not found")
    if doc.get("status") != "proposed":
        raise ValueError("Only proposed assignments can be accepted")

    uid = doc.get("user_id")
    if uid:
        coll.update_many(
            {"user_id": uid, "status": "active"},
            {"$set": {"status": "abandoned", "completed_at": datetime.now(timezone.utc)}},
        )

    practice_shoot_id = ObjectId()
    coll.update_one(
        {"_id": oid},
        {"$set": {"status": "active", "practice_shoot_id": practice_shoot_id}},
    )
    updated = coll.find_one({"_id": oid})
    assert updated
    return _serialize(updated)


def get_active_assignment(user_id: str | None = None) -> dict[str, Any] | None:
    uid = _resolve_user_id(user_id)
    if not uid:
        return None
    doc = get_db().assignments.find_one({"user_id": uid, "status": "active"})
    return _serialize(doc) if doc else None


def link_upload_to_assignment(
    assignment_id: str,
    portfolio_entry_id: ObjectId,
    shoot_id: ObjectId,
) -> None:
    """Attach a Studio upload to the active assignment."""
    coll = get_db().assignments
    oid = ObjectId(assignment_id)
    doc = coll.find_one({"_id": oid, "status": "active"})
    if not doc:
        raise ValueError("Active assignment not found")

    updates: dict[str, Any] = {
        "$addToSet": {
            "completion_shoot_ids": shoot_id,
            "linked_portfolio_ids": portfolio_entry_id,
        }
    }
    if not doc.get("practice_shoot_id"):
        updates["$set"] = {"practice_shoot_id": shoot_id}
    coll.update_one({"_id": oid}, updates)


def complete_assignment(assignment_id: str) -> dict[str, Any]:
    from sub_agents.reflection_pipeline import reflect_assignment

    reflection = reflect_assignment(assignment_id)
    now = datetime.now(timezone.utc)
    coll = get_db().assignments
    oid = ObjectId(assignment_id)
    coll.update_one(
        {"_id": oid},
        {
            "$set": {
                "status": "completed",
                "completed_at": now,
                "skill_delta": reflection["skillDelta"],
            }
        },
    )
    updated = coll.find_one({"_id": oid})
    assert updated
    return {"assignment": _serialize(updated), "reflection": reflection}


def decline_assignment(assignment_id: str) -> dict[str, Any]:
    coll = get_db().assignments
    oid = ObjectId(assignment_id)
    doc = coll.find_one({"_id": oid})
    if not doc:
        raise ValueError("Assignment not found")
    if doc.get("status") != "proposed":
        raise ValueError("Only proposed assignments can be declined")

    now = datetime.now(timezone.utc)
    coll.update_one(
        {"_id": oid},
        {"$set": {"status": "abandoned", "completed_at": now}},
    )
    updated = coll.find_one({"_id": oid})
    assert updated
    return _serialize(updated)


def propose_assignment(
    user_id: str | None = None,
    *,
    mode: str = "hobbyist",
) -> dict[str, Any]:
    uid = _resolve_user_id(user_id)
    if not uid:
        raise ValueError(
            "Set DEMO_USER_ID in .env or pass user_id so assignments link to your portfolio"
        )

    existing = get_db().assignments.find_one({"user_id": uid, "status": "proposed"})
    if existing:
        return _serialize(existing)

    from sub_agents.planner_pipeline import generate_assignment

    doc = generate_assignment(str(uid), mode=mode)
    return _serialize(doc)
