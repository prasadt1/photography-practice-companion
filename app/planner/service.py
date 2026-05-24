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


def _portfolio_context(user_id: ObjectId, limit: int = 8) -> tuple[dict[str, float], list[dict[str, Any]]]:
    docs = list(
        get_db()
        .portfolio_entries.find({"user_id": user_id}, projection={"scores": 1, "shoot_id": 1, "aesthetic_tags": 1})
        .sort("created_at", -1)
        .limit(limit)
    )
    if not docs:
        return {}, []

    sums = {k: 0.0 for k in _SKILL_KEYS}
    for doc in docs:
        scores = doc.get("scores") or {}
        for k in _SKILL_KEYS:
            sums[k] += float(scores.get(k, 0))
    n = len(docs)
    averages = {k: round(sums[k] / n, 1) for k in _SKILL_KEYS}

    snapshots = []
    for doc in docs[:5]:
        snapshots.append(
            {
                "shootId": str(doc.get("shoot_id", "")),
                "scores": doc.get("scores") or {},
                "tags": doc.get("aesthetic_tags") or [],
            }
        )
    return averages, snapshots


def generate_assignment(
    user_id: str,
    *,
    mode: str = "hobbyist",
) -> dict[str, Any]:
    """Create a proposed assignment in MongoDB."""
    uid = ObjectId(user_id)
    averages, snapshots = _portfolio_context(uid)

    prompt_path = Path(__file__).parent.parent / "prompts" / "planner.txt"
    system = prompt_path.read_text(encoding="utf-8")

    if averages:
        weakest = min(averages.items(), key=lambda x: x[1])
        context = (
            f"Recent average scores (0–10): {averages}\n"
            f"Weakest dimension: {weakest[0]} ({weakest[1]})\n"
            f"Recent shoots: {snapshots}\n"
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
        ),
    )

    if not response.text:
        raise RuntimeError("Planner returned empty response")
    planned = PlannerAssignmentOutput.model_validate_json(response.text)

    baseline_ids: list[ObjectId] = []
    for snap in snapshots[:3]:
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
