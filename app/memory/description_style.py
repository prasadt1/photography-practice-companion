"""Vision impairment description_style preference (consolidation item 13)."""

from __future__ import annotations

import re
from typing import Literal

from bson import ObjectId

from memory.users import resolve_user_id

DescriptionStyle = Literal["concise", "detailed", "technical"]


def handle_voice_command(user_id: str, utterance: str) -> DescriptionStyle | None:
    """Parse simple voice/text commands and persist description_style."""
    text = utterance.lower().strip()
    style: DescriptionStyle | None = None
    if re.search(r"\b(more )?concise\b|\bshorter\b|\bless detail\b", text):
        style = "concise"
    elif re.search(r"\bmore detail\b|\bdetailed\b|\blonger\b", text):
        style = "detailed"
    elif re.search(r"\btechnical\b|\bexif\b|\bmetadata\b", text):
        style = "technical"
    if style:
        set_description_style(user_id, style)
    return style


def set_description_style(user_id: str | ObjectId, style: DescriptionStyle) -> None:
    uid = ObjectId(user_id) if isinstance(user_id, str) else user_id
    from memory.db import get_db

    get_db().users.update_one(
        {"_id": uid},
        {"$set": {"preferences.description_style": style}},
        upsert=True,
    )


def get_description_style(user_id: str | None = None) -> DescriptionStyle:
    uid = resolve_user_id(user_id)
    if uid is None:
        return "concise"
    from memory.db import get_db

    doc = get_db().users.find_one({"_id": uid}, projection={"preferences": 1})
    prefs = (doc or {}).get("preferences") or {}
    style = prefs.get("description_style") or "concise"
    if style in ("concise", "detailed", "technical"):
        return style  # type: ignore[return-value]
    return "concise"
