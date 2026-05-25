"""Per-request user_id for multi-tenant scoping (API + sub-agents)."""

from __future__ import annotations

import os
from contextvars import ContextVar

_request_user_id: ContextVar[str | None] = ContextVar("request_user_id", default=None)


def set_request_user_id(user_id: str | None) -> None:
    _request_user_id.set(user_id)


def get_request_user_id() -> str | None:
    return _request_user_id.get()


def resolve_effective_user_id(explicit: str | None = None) -> str | None:
    """Session/header user_id, else explicit param, else DEMO_USER_ID for hackathon demo."""
    if explicit:
        return explicit
    ctx = get_request_user_id()
    if ctx:
        return ctx
    return os.environ.get("DEMO_USER_ID") or None
