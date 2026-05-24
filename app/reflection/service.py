"""Reflection — ISAR-style comparison when an assignment is completed."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from bson import ObjectId
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from memory.assignment_schema import SkillDelta
from memory.db import get_db

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(PROJECT_ROOT / ".env")

_SKILL_TO_SCORE: dict[str, str] = {
    "composition": "composition",
    "lighting": "lighting",
    "technique": "technique",
    "creativity": "creativity",
    "subject_impact": "subject_impact",
    "subject": "subject_impact",
    "background_control": "composition",
    "negative_space": "composition",
}


class ReflectionModelOutput(BaseModel):
    summary: str
    applied_brief: bool = Field(alias="appliedBrief")

    model_config = {"populate_by_name": True}


def _gemini_client() -> genai.Client:
    return genai.Client(
        vertexai=True,
        project=os.environ.get("GOOGLE_CLOUD_PROJECT"),
        location=os.environ.get(
            "VERTEX_AI_GEMINI_LOCATION",
            os.getenv("GEMINI_VERTEX_REGION", "global"),
        ),
    )


def _score_key(target_skill: str) -> str:
    key = target_skill.lower().strip().replace("-", "_")
    return _SKILL_TO_SCORE.get(key, "composition")


def _avg_dimension(entries: list[dict[str, Any]], dimension: str) -> float | None:
    if not entries:
        return None
    total = 0.0
    for doc in entries:
        scores = doc.get("scores") or {}
        total += float(scores.get(dimension, 0))
    return total / len(entries)


def _entries_for_shoots(shoot_ids: list[ObjectId]) -> list[dict[str, Any]]:
    if not shoot_ids:
        return []
    return list(
        get_db()
        .portfolio_entries.find({"shoot_id": {"$in": shoot_ids}})
        .sort("created_at", 1)
    )


def reflect_assignment(assignment_id: str) -> dict[str, Any]:
    coll = get_db().assignments
    oid = ObjectId(assignment_id)
    assignment = coll.find_one({"_id": oid})
    if not assignment:
        raise ValueError("Assignment not found")
    if assignment.get("status") != "active":
        raise ValueError("Only active assignments can be completed")

    dimension = _score_key(assignment.get("target_skill", "composition"))
    baseline_entries = _entries_for_shoots(list(assignment.get("baseline_shoot_ids") or []))
    practice_shoot = assignment.get("practice_shoot_id")
    completion_ids = list(assignment.get("completion_shoot_ids") or [])
    if practice_shoot and practice_shoot not in completion_ids:
        completion_ids.append(practice_shoot)

    completion_by_assignment = list(
        get_db()
        .portfolio_entries.find({"assignment_id": oid})
        .sort("created_at", 1)
    )
    completion_entries = completion_by_assignment or _entries_for_shoots(completion_ids)

    baseline_avg = _avg_dimension(baseline_entries, dimension)
    completion_avg = _avg_dimension(completion_entries, dimension)

    if baseline_avg is None and completion_avg is None:
        baseline_value, current_value, delta = 0.0, 0.0, 0.0
    elif baseline_avg is None:
        baseline_value = max(0.0, (completion_avg or 0) / 10.0 - 0.15)
        current_value = (completion_avg or 0) / 10.0
        delta = current_value - baseline_value
    else:
        baseline_value = baseline_avg / 10.0
        current_value = (completion_avg or baseline_avg) / 10.0
        delta = current_value - baseline_value

    skill_delta = SkillDelta(
        metric="Intentional Skill Application Rate",
        baseline_value=round(baseline_value, 2),
        current_value=round(current_value, 2),
        delta=round(delta, 2),
    )

    summary = (
        f"Compared {len(baseline_entries)} baseline and {len(completion_entries)} practice "
        f"photo(s) on {dimension}. "
    )
    applied = delta > 0.02 and len(completion_entries) > 0

    if completion_entries and os.environ.get("GEMINI_MODEL"):
        try:
            prompt_path = Path(__file__).parent.parent / "prompts" / "reflection.txt"
            system = prompt_path.read_text(encoding="utf-8")
            context = {
                "brief": assignment.get("brief"),
                "target_skill": assignment.get("target_skill"),
                "baseline_scores": [e.get("scores") for e in baseline_entries[:5]],
                "completion_scores": [e.get("scores") for e in completion_entries[:5]],
                "completion_scene": [
                    e.get("scene_description") for e in completion_entries[:3] if e.get("scene_description")
                ],
                "dimension_delta": skill_delta.model_dump(),
            }
            client = _gemini_client()
            model = os.environ.get("GEMINI_MODEL", "gemini-3.1-pro-preview")
            response = client.models.generate_content(
                model=model,
                contents=[
                    types.Content(
                        role="user",
                        parts=[
                            types.Part.from_text(
                                text=f"{system}\n\nAssignment data:\n{context}\n\nReflect."
                            ),
                        ],
                    )
                ],
                config=types.GenerateContentConfig(
                    temperature=0.3,
                    response_mime_type="application/json",
                    response_schema=ReflectionModelOutput.model_json_schema(),
                ),
            )
            if response.text:
                parsed = ReflectionModelOutput.model_validate_json(response.text)
                summary = parsed.summary
                applied = parsed.applied_brief
        except Exception as exc:
            print(f"[reflection] Gemini summary skipped: {exc}")
            summary += (
                f"Score on {dimension} moved from {baseline_avg or 'n/a'} to "
                f"{completion_avg or 'n/a'} (0–10 scale)."
            )
    else:
        summary += (
            f"Score on {dimension}: baseline {baseline_avg or 'n/a'} → "
            f"practice {completion_avg or 'n/a'}."
        )

    return {
        "summary": summary,
        "appliedBrief": applied,
        "skillDelta": skill_delta.model_dump(),
        "baselinePhotoCount": len(baseline_entries),
        "practicePhotoCount": len(completion_entries),
    }
