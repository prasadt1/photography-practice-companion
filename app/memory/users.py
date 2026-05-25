"""User persona reads/writes (v5 §6.2, Phase 2)."""

from __future__ import annotations

import os
from typing import Any, Literal

from bson import ObjectId

from memory.db import get_db
from memory.user_ids import to_mongo_user_id

Persona = Literal["hobbyist", "working_pro", "vision_impairment"]
VALID_PERSONAS: tuple[str, ...] = ("hobbyist", "working_pro", "vision_impairment")


def resolve_user_id(user_id: str | None = None) -> ObjectId | None:
    if user_id:
        return to_mongo_user_id(user_id)
    demo = os.environ.get("DEMO_USER_ID")
    if demo:
        return ObjectId(demo)
    return None


def ensure_user(user_id: ObjectId | None = None, *, persona: Persona = "hobbyist") -> ObjectId:
    """Return user id, creating a minimal users doc if missing."""
    uid = user_id or resolve_user_id(None)
    if uid is None:
        uid = ObjectId()
    coll = get_db().users
    coll.update_one(
        {"_id": uid},
        {
            "$setOnInsert": {
                "persona": persona,
                "preferences": {},
            }
        },
        upsert=True,
    )
    return uid


def get_persona(user_id: str | None = None) -> Persona:
    uid = resolve_user_id(user_id)
    if uid is None:
        return "hobbyist"
    doc = get_db().users.find_one({"_id": uid}, projection={"persona": 1})
    if not doc:
        ensure_user(uid)
        return "hobbyist"
    p = doc.get("persona") or "hobbyist"
    return p if p in VALID_PERSONAS else "hobbyist"  # type: ignore[return-value]


def set_persona(persona: str, user_id: str | None = None) -> dict[str, Any]:
    if persona not in VALID_PERSONAS:
        raise ValueError(f"persona must be one of {VALID_PERSONAS}")
    uid = resolve_user_id(user_id)
    if uid is None:
        raise ValueError("Set DEMO_USER_ID in .env or pass user_id")
    ensure_user(uid, persona=persona)  # type: ignore[arg-type]
    get_db().users.update_one(
        {"_id": uid},
        {"$set": {"persona": persona}},
        upsert=True,
    )
    return {"userId": str(uid), "persona": persona}


def get_user_profile(user_id: str | None = None) -> dict[str, Any]:
    uid = resolve_user_id(user_id)
    if uid is None:
        return {"userId": None, "persona": "hobbyist", "preferences": {}}
    doc = get_db().users.find_one({"_id": uid}, projection={"persona": 1, "preferences": 1})
    if not doc:
        ensure_user(uid)
        doc = get_db().users.find_one({"_id": uid}, projection={"persona": 1, "preferences": 1})
    return {
        "userId": str(uid),
        "persona": doc.get("persona") or "hobbyist",
        "preferences": doc.get("preferences") or {},
    }
