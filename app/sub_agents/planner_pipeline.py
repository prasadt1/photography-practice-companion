"""Planner — generates practice assignments from portfolio memory (Phase 3)."""

from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from bson import ObjectId
from dotenv import load_dotenv
from google import genai
from google.genai import types

from sub_agents._common import _append_concise_format
from core.safety import SAFETY_SETTINGS
from memory.assignment_schema import PlannerAssignmentOutput
from memory.db import get_db

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(PROJECT_ROOT / ".env")

_SKILL_KEYS = ("composition", "lighting", "technique", "creativity", "subject_impact")


def _gemini_client() -> genai.Client:
    return genai.Client(
        vertexai=True,
        project=os.environ.get("GOOGLE_CLOUD_PROJECT"),
        location=os.environ.get(
            "VERTEX_AI_GEMINI_LOCATION",
            os.getenv("GEMINI_VERTEX_REGION", "global"),
        ),
    )


def _format_relative_date(dt: datetime) -> str:
    """Format datetime as human-readable relative date (e.g., 'today', '2 days ago')."""
    now = datetime.now(timezone.utc)
    # Handle timezone-naive datetimes from MongoDB
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    delta = now - dt
    days = delta.days

    if days == 0:
        return "today"
    elif days == 1:
        return "yesterday"
    elif days < 7:
        return f"{days} days ago"
    elif days < 30:
        weeks = days // 7
        return f"{weeks} week{'s' if weeks > 1 else ''} ago"
    else:
        return dt.strftime("%b %d")


def _portfolio_context(user_id: ObjectId, limit: int = 8) -> tuple[dict[str, float], list[dict[str, Any]], list[dict[str, Any]]]:
    """Get portfolio context for planner.

    Returns:
        Tuple of (averages, llm_snapshots, internal_snapshots)
        - averages: skill dimension averages
        - llm_snapshots: human-readable snapshots for LLM context (no IDs)
        - internal_snapshots: full snapshots with shoot_id for baseline tracking
    """
    docs = list(
        get_db()
        .portfolio_entries.find(
            {"user_id": user_id},
            projection={"scores": 1, "shoot_id": 1, "aesthetic_tags": 1, "created_at": 1}
        )
        .sort("created_at", -1)
        .limit(limit)
    )
    if not docs:
        return {}, [], []

    sums = {k: 0.0 for k in _SKILL_KEYS}
    for doc in docs:
        scores = doc.get("scores") or {}
        for k in _SKILL_KEYS:
            sums[k] += float(scores.get(k, 0))
    n = len(docs)
    averages = {k: round(sums[k] / n, 1) for k in _SKILL_KEYS}

    llm_snapshots = []
    internal_snapshots = []
    for i, doc in enumerate(docs[:5]):
        created_at = doc.get("created_at")
        when = _format_relative_date(created_at) if created_at else f"photo {i + 1}"
        # Human-readable version for LLM (no IDs)
        llm_snapshots.append(
            {
                "uploaded": when,
                "scores": doc.get("scores") or {},
                "tags": doc.get("aesthetic_tags") or [],
            }
        )
        # Internal version with shoot_id for baseline tracking
        internal_snapshots.append(
            {
                "shootId": str(doc.get("shoot_id", "")),
            }
        )
    return averages, llm_snapshots, internal_snapshots


def generate_assignment(
    user_id: str,
    *,
    mode: str = "hobbyist",
    focus_skill: str | None = None,
) -> dict[str, Any]:
    """Create a proposed assignment in MongoDB.

    Args:
        user_id: The user's MongoDB ObjectId as a string.
        mode: User mode (hobbyist, enthusiast, etc.)
        focus_skill: Optional skill to focus on (e.g. "creativity", "lighting").
                     If provided, overrides auto-detection of weakest dimension.
    """
    uid = ObjectId(user_id)
    averages, llm_snapshots, internal_snapshots = _portfolio_context(uid)

    prompt_path = Path(__file__).parent.parent / "prompts" / "planner.txt"
    system = _append_concise_format(prompt_path.read_text(encoding="utf-8"))

    if averages:
        # Use provided focus_skill or fall back to weakest dimension
        if focus_skill and focus_skill.lower() in _SKILL_KEYS:
            target_skill = focus_skill.lower()
            target_score = averages.get(target_skill, 5.0)
            context = (
                f"Recent average scores (0–10): {averages}\n"
                f"USER REQUESTED focus on: {target_skill} (score: {target_score})\n"
                f"Generate an assignment targeting {target_skill}.\n"
                f"Recent photos: {llm_snapshots}\n"
            )
        else:
            weakest = min(averages.items(), key=lambda x: x[1])
            context = (
                f"Recent average scores (0–10): {averages}\n"
                f"Weakest dimension: {weakest[0]} ({weakest[1]})\n"
                f"Recent photos: {llm_snapshots}\n"
            )
    else:
        context = "No portfolio yet — assign a foundational exercise (composition or lighting awareness)."

    client = _gemini_client()
    model = os.environ.get("GEMINI_MODEL", "gemini-3.1-pro-preview")

    response = client.models.generate_content(
        model=model,
        contents=[
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(
                        text=(
                            f"{system}\n\nMode: {mode}\n\n{context}\n"
                            "Generate the next practice assignment."
                        )
                    ),
                ],
            )
        ],
        config=types.GenerateContentConfig(
            temperature=0.5,
            response_mime_type="application/json",
            response_schema=PlannerAssignmentOutput.model_json_schema(),
            safety_settings=SAFETY_SETTINGS,
        ),
    )

    if not response.text:
        raise RuntimeError("Planner returned empty response")
    planned = PlannerAssignmentOutput.model_validate_json(response.text)

    baseline_ids: list[ObjectId] = []
    for snap in internal_snapshots[:3]:
        sid = snap.get("shootId")
        if sid:
            try:
                baseline_ids.append(ObjectId(sid))
            except Exception:
                pass

    now = datetime.now(timezone.utc)
    doc = {
        "user_id": uid,
        "status": "proposed",
        "brief": planned.brief,
        "target_skill": planned.target_skill,
        "rationale": planned.rationale,
        "baseline_shoot_ids": baseline_ids,
        "completion_shoot_ids": [],
        "created_at": now,
        "completed_at": None,
    }
    result = get_db().assignments.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc
