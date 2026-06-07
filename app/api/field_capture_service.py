"""Live field frame coaching — Phase 3.5 (rate-limited Gemini vision cues)."""

from __future__ import annotations

import json
import logging
import os
import time
from pathlib import Path
from typing import Any, Literal

from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from memory.capture_sessions import assert_active_session, record_frame
from sub_agents.tools import field_coach_tools

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Per-session rate limit: max 1 inference / 3s (in-process; single Cloud Run instance).
_last_frame_at: dict[str, float] = {}
MIN_FRAME_INTERVAL_SEC = 3.0

_DEFAULT_CUE = {
    "spokenCue": "Hold steady — align your subject on a third line.",
    "onScreenHint": "Use the grid — place your subject off-center.",
    "confidence": 0.5,
    "readyToCapture": False,
}


class FieldCaptureCueOutput(BaseModel):
    spoken_cue: str = Field(default="", alias="spokenCue")
    on_screen_hint: str = Field(default="", alias="onScreenHint")
    confidence: float = Field(default=0.6, ge=0.0, le=1.0)
    ready_to_capture: bool = Field(default=False, alias="readyToCapture")

    model_config = {"populate_by_name": True}


def _gemini_client() -> genai.Client:
    return genai.Client(
        vertexai=True,
        project=os.environ.get("GOOGLE_CLOUD_PROJECT"),
        location=os.environ.get(
            "VERTEX_AI_GEMINI_LOCATION",
            os.environ.get("GEMINI_VERTEX_REGION", "global"),
        ),
    )


def _field_capture_model() -> str:
    return os.environ.get(
        "FIELD_CAPTURE_MODEL",
        os.environ.get("GEMINI_MODEL", "gemini-2.0-flash"),
    )


def _parse_cue_payload(raw: str) -> dict[str, Any]:
    text = raw.strip()
    if not text:
        logger.warning("field_capture: empty model text — using default cue")
        return dict(_DEFAULT_CUE)

    if text.startswith("```"):
        text = text.strip("`").removeprefix("json").strip()

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        logger.warning("field_capture: invalid JSON (%r) — using default cue", text[:120])
        return dict(_DEFAULT_CUE)

    spoken = str(data.get("spoken_cue") or data.get("spokenCue") or "").strip()
    hint = str(data.get("on_screen_hint") or data.get("onScreenHint") or spoken).strip()
    confidence = float(data.get("confidence", 0.7))
    confidence = max(0.0, min(1.0, confidence))
    ready = bool(data.get("ready_to_capture") or data.get("readyToCapture", False))
    if not spoken and not hint:
        logger.warning("field_capture: empty cue fields — using default cue")
        return dict(_DEFAULT_CUE)
    return {
        "spokenCue": spoken or hint,
        "onScreenHint": hint or spoken,
        "confidence": confidence,
        "readyToCapture": ready,
    }


def _cue_from_structured(response: Any) -> dict[str, Any]:
    """Prefer validated schema output; fall back to text JSON parse."""
    if getattr(response, "parsed", None) is not None:
        try:
            model = FieldCaptureCueOutput.model_validate(response.parsed)
            spoken = (model.spoken_cue or model.on_screen_hint).strip()
            hint = (model.on_screen_hint or model.spoken_cue).strip()
            if spoken or hint:
                return {
                    "spokenCue": spoken or hint,
                    "onScreenHint": hint or spoken,
                    "confidence": model.confidence,
                    "readyToCapture": model.ready_to_capture,
                }
        except Exception as exc:
            logger.warning("field_capture: structured parse failed: %s", exc)
    raw = (getattr(response, "text", None) or "").strip()
    return _parse_cue_payload(raw)


def analyze_field_frame(
    *,
    image_bytes: bytes,
    content_type: str,
    session_id: str,
    user_id: str | None = None,
    persona: Literal["hobbyist", "working_pro", "vision_impairment"] = "hobbyist",
    assignment_brief: str | None = None,
) -> dict[str, Any]:
    if len(image_bytes) < 512:
        raise ValueError("Frame too small — point at the scene and try again")

    assert_active_session(session_id, user_id=user_id)

    now = time.monotonic()
    last = _last_frame_at.get(session_id, 0.0)
    if now - last < MIN_FRAME_INTERVAL_SEC:
        wait = round(MIN_FRAME_INTERVAL_SEC - (now - last), 1)
        raise ValueError(f"Rate limited — wait {wait}s before the next frame")
    _last_frame_at[session_id] = now

    prompt_path = PROJECT_ROOT / "prompts" / "field_capture_frame.txt"
    system = prompt_path.read_text(encoding="utf-8")
    context = f"Persona: {persona}."
    if assignment_brief:
        context += f" Active practice brief: {assignment_brief[:400]}"

    client = _gemini_client()
    response = client.models.generate_content(
        model=_field_capture_model(),
        contents=[
            types.Content(
                role="user",
                parts=[
                    types.Part.from_bytes(data=image_bytes, mime_type=content_type),
                    types.Part.from_text(text=f"{system}\n\n{context}"),
                ],
            )
        ],
        config=types.GenerateContentConfig(
            temperature=0.35,
            response_mime_type="application/json",
            response_schema=FieldCaptureCueOutput.model_json_schema(),
            max_output_tokens=256,
        ),
    )

    cue = _cue_from_structured(response)

    field_coach_tools.update_session_state(
        session_id,
        suggestion=cue["onScreenHint"],
        increment_frames=True,
    )
    record_frame(session_id, user_id=user_id)

    return {
        "sessionId": session_id,
        "persona": persona,
        **cue,
    }
