"""Inject recent user overrides into sub-agent instructions (spec §5.4)."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from bson import ObjectId

from memory.users import resolve_user_id

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"


def get_recent_overrides(
    user_id: str | None,
    agent_name: str,
    *,
    limit: int = 20,
) -> list[dict[str, Any]]:
    uid = resolve_user_id(user_id)
    if uid is None:
        return []
    from memory.db import get_db

    doc = get_db().users.find_one({"_id": uid}, projection={"preferences": 1})
    prefs = (doc or {}).get("preferences") or {}
    entries = list(prefs.get("override_history") or [])

    coll = get_db().pending_approvals
    modified = list(
        coll.find(
            {
                "user_id": uid,
                "agent_name": agent_name,
                "status": {"$in": ["modified", "approved"]},
            },
            projection={"user_decision": 1, "proposed_action": 1, "created_at": 1},
        )
        .sort("created_at", -1)
        .limit(limit)
    )
    for m in modified:
        ud = m.get("user_decision") or {}
        if ud.get("override_payload"):
            entries.append(
                {
                    "agent": agent_name,
                    "override_type": "hitl_modify",
                    "original": (m.get("proposed_action") or {}).get("payload"),
                    "modified": ud.get("override_payload"),
                    "timestamp": m.get("created_at"),
                }
            )

    filtered = [e for e in entries if (e.get("agent") or "") == agent_name]
    return filtered[-limit:]


def format_overrides(overrides: list[dict[str, Any]]) -> str:
    lines = []
    for item in overrides:
        lines.append(
            f"- {item.get('override_type', 'override')}: "
            f"{json.dumps(item.get('modified', {}), default=str)[:400]}"
        )
    return "\n".join(lines)


def load_prompt_with_user_overrides(agent_name: str, user_id: str | None = None) -> str:
    base = (PROMPTS_DIR / f"{agent_name}.txt").read_text(encoding="utf-8")
    overrides = get_recent_overrides(user_id, agent_name)
    if not overrides:
        return base
    return (
        base
        + "\n\n## Recent user overrides to consider when responding\n"
        + format_overrides(overrides)
    )


def write_override_history(
    user_id: str | ObjectId,
    agent_name: str,
    *,
    override_type: str,
    original: Any,
    modified: Any,
) -> None:
    uid = ObjectId(user_id) if isinstance(user_id, str) else user_id
    entry = {
        "agent": agent_name,
        "override_type": override_type,
        "original": original,
        "modified": modified,
        "timestamp": datetime.now(timezone.utc),
    }
    from memory.db import get_db

    get_db().users.update_one(
        {"_id": uid},
        {
            "$push": {
                "preferences.override_history": {
                    "$each": [entry],
                    "$slice": -50,
                }
            }
        },
        upsert=True,
    )
