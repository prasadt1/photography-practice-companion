"""Shared helpers for v5 sub-agent LlmAgent construction."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from google.adk.models import Gemini
from google.genai import types

# app/sub_agents/_common.py → repo root is three levels up
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
APP_DIR = REPO_ROOT / "app"
PROMPTS_DIR = APP_DIR / "prompts"
load_dotenv(REPO_ROOT / ".env")

_creds_rel = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
if _creds_rel:
    _cp = Path(_creds_rel)
    if not _cp.is_absolute():
        # Playground cwd is often app/ — resolve key relative to repo root
        _cp = REPO_ROOT / _creds_rel.lstrip("./")
    if _cp.is_file():
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(_cp.resolve())

_gemini_location = os.getenv("VERTEX_AI_GEMINI_LOCATION", "global")
os.environ.setdefault("GOOGLE_CLOUD_LOCATION", _gemini_location)
os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "True")


def load_prompt(stem: str) -> str:
    return (PROMPTS_DIR / f"{stem}.txt").read_text(encoding="utf-8")


def load_sub_agent_prompt(stem: str, user_id: str | None = None) -> str:
    """Base prompt + recent user overrides (Coach, Planner, Triage, Print Sales, Visual Describer)."""
    from memory.prompt_overrides import load_prompt_with_user_overrides
    from memory.session_context import get_request_user_id

    uid = user_id or get_request_user_id()
    return load_prompt_with_user_overrides(stem, uid)


def gemini_model() -> Gemini:
    return Gemini(
        model=os.getenv("GEMINI_MODEL", "gemini-3.1-pro-preview"),
        retry_options=types.HttpRetryOptions(attempts=3),
    )
