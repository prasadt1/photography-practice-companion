"""Session / persona context tools for orchestrator and Field Coach."""

from __future__ import annotations

import os
from typing import Any

from memory.assignments import _resolve_user_id
from memory.users import get_user_profile
from orchestrator.memory_tools import get_active_practice_assignment


def get_user_persona(user_id: str | None = None) -> dict[str, Any]:
    """Return persona from users collection (default hobbyist)."""
    return get_user_profile(user_id)


def get_session_context() -> dict[str, Any]:
    """Lightweight session snapshot for routing."""
    persona_info = get_user_persona()
    active = get_active_practice_assignment()
    return {
        "persona": persona_info["persona"],
        "userId": persona_info.get("userId"),
        "activeAssignment": active.get("active"),
    }


def get_active_assignment() -> dict[str, Any]:
    """Alias for orchestrator routing — active practice assignment."""
    return get_active_practice_assignment()
