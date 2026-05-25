"""Consolidation item 5 — override history injected into sub-agent prompts."""

from __future__ import annotations

from bson import ObjectId

from memory.prompt_overrides import (
    load_prompt_with_user_overrides,
    write_override_history,
)


def test_override_appears_in_next_invocation():
    user_id = str(ObjectId())
    write_override_history(
        user_id,
        "coach",
        override_type="scores.composition",
        original=6,
        modified=8,
    )
    prompt = load_prompt_with_user_overrides("coach", user_id)
    assert "Recent user overrides" in prompt
    assert "8" in prompt


def test_no_overrides_uses_base_prompt():
    user_id = str(ObjectId())
    prompt = load_prompt_with_user_overrides("coach", user_id)
    from pathlib import Path

    base = (Path(__file__).resolve().parent.parent / "app/prompts/coach.txt").read_text()
    assert prompt == base
