"""Consolidation item 13 — description_style preference loop."""

from __future__ import annotations

from bson import ObjectId

from memory.db import get_db
from memory.description_style import (
    get_description_style,
    handle_voice_command,
    set_description_style,
)
from sub_agents.tools.visual_describer_tools import visual_describer_describe_frame


def test_voice_override_updates_preference():
    user_id = str(ObjectId())
    get_db().users.insert_one({"_id": ObjectId(user_id), "preferences": {}})
    handle_voice_command(user_id, "please be more concise")
    user = get_db().users.find_one({"_id": ObjectId(user_id)})
    assert user["preferences"]["description_style"] == "concise"


def test_visual_describer_adapts_to_preference():
    user_id = str(ObjectId())
    get_db().users.insert_one(
        {"_id": ObjectId(user_id), "preferences": {"description_style": "concise"}}
    )
    long_text = " ".join(["word"] * 50)
    description = visual_describer_describe_frame(scene_description=long_text, user_id=user_id)
    assert len(description.split()) <= 28
