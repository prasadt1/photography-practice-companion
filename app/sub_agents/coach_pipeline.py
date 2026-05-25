"""Coach: ground → analyze → GCS → embed → MongoDB → API payload."""

from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from bson import ObjectId
from dotenv import load_dotenv
from google import genai
from google.genai import types

from memory.db import get_db
from memory.schema import BoundingBoxPct, CoachAnalysisOutput, GroundingCitation, SpatialAnnotation
from tools.embeddings import embed_image_bytes
from tools.gcs import upload_portfolio_image
from tools.grounding import detect_scene_type_hint, ground_principles

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(PROJECT_ROOT / ".env")

_creds_rel = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
if _creds_rel:
    _cp = Path(_creds_rel)
    if not _cp.is_absolute():
        _cp = PROJECT_ROOT / _creds_rel.lstrip("./")
    if _cp.is_file():
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(_cp.resolve())


def _gemini_client() -> genai.Client:
    return genai.Client(
        vertexai=True,
        project=os.environ.get("GOOGLE_CLOUD_PROJECT"),
        location=os.environ.get(
            "VERTEX_AI_GEMINI_LOCATION",
            os.environ.get("GEMINI_VERTEX_REGION", "global"),
        ),
    )


def _principles_block(citations: list[GroundingCitation]) -> str:
    return "\n\n".join(
        f"### {c.title} ({c.id})\n{c.excerpt}" for c in citations
    )


def _run_coach_model(
    image_bytes: bytes,
    mime_type: str,
    citations: list[GroundingCitation],
) -> CoachAnalysisOutput:
    prompt_path = Path(__file__).parent.parent / "prompts" / "coach.txt"
    system = prompt_path.read_text(encoding="utf-8")
    principles = _principles_block(citations)

    client = _gemini_client()
    model = os.environ.get("GEMINI_MODEL", "gemini-3.1-pro-preview")

    response = client.models.generate_content(
        model=model,
        contents=[
            types.Content(
                role="user",
                parts=[
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    types.Part.from_text(
                        text=(
                            f"{system}\n\n## Agent Builder principles\n{principles}\n\n"
                            "Analyze this photograph."
                        )
                    ),
                ],
            )
        ],
        config=types.GenerateContentConfig(
            temperature=0.4,
            response_mime_type="application/json",
            response_schema=CoachAnalysisOutput.model_json_schema(),
        ),
    )

    if not response.text:
        raise RuntimeError("Coach returned empty response")
    return CoachAnalysisOutput.model_validate_json(response.text)


def _annotations_from_boxes(boxes: list[dict[str, Any]]) -> list[SpatialAnnotation]:
    out: list[SpatialAnnotation] = []
    for b in boxes:
        out.append(
            SpatialAnnotation(
                bbox=BoundingBoxPct(
                    x=float(b.get("x", 0)),
                    y=float(b.get("y", 0)),
                    w=float(b.get("width", b.get("w", 10))),
                    h=float(b.get("height", b.get("h", 10))),
                ),
                severity=b.get("severity", "moderate"),
                note=b.get("description", b.get("note", "")),
            )
        )
    return out


def _to_api_payload(
    entry_id: ObjectId,
    output: CoachAnalysisOutput,
    citations: list[GroundingCitation],
) -> dict[str, Any]:
    sm = output.spatial_metadata
    if output.bounding_boxes and not sm.annotations:
        sm.annotations = _annotations_from_boxes(output.bounding_boxes)

    se = output.settings_estimate
    return {
        "portfolioEntryId": str(entry_id),
        "sceneDescription": output.scene_description,
        "colourNotes": output.colour_notes,
        "scores": output.scores.model_dump(),
        "critique": output.critique.model_dump(),
        "strengths": output.strengths,
        "improvements": output.improvements,
        "learningPath": output.learning_path,
        "settingsEstimate": {
            "focalLength": se.focal_length,
            "aperture": se.aperture,
            "shutterSpeed": se.shutter_speed,
            "iso": se.iso,
        },
        "glassBox": {
            "observations": output.glass_box.observations,
            "reasoning_steps": output.glass_box.reasoning_steps,
            "priority_fixes": [pf.model_dump() for pf in output.glass_box.priority_fixes],
            "grounding_principles": [c.id for c in citations],
            "grounding_citations": [c.model_dump() for c in citations],
        },
        "spatialMetadata": {
            "annotations": [
                {
                    "bbox": {"x": a.bbox.x, "y": a.bbox.y, "w": a.bbox.w, "h": a.bbox.h},
                    "severity": a.severity,
                    "note": a.note,
                }
                for a in sm.annotations
            ],
            "subject_relationships": sm.subject_relationships.model_dump(),
            "lighting_map": sm.lighting_map.model_dump(),
        },
        "aestheticTags": output.aesthetic_tags,
    }


def analyze_photo(
    image_bytes: bytes,
    content_type: str,
    filename: str = "photo.jpg",
    user_id: str | None = None,
    shoot_id: str | None = None,
    assignment_id: str | None = None,
) -> dict[str, Any]:
    """Full Coach pipeline. Returns JSON matching frontend AnalysisResult shape."""
    from memory.assignments import link_upload_to_assignment

    from memory.session_context import resolve_effective_user_id

    effective = resolve_effective_user_id(user_id)
    if not effective:
        raise ValueError("Pass user_id from session or configure demo user in .env")
    from memory.user_ids import to_mongo_user_id

    uid = to_mongo_user_id(effective)
    sid = ObjectId(shoot_id) if shoot_id else ObjectId()
    assignment_oid: ObjectId | None = None

    if assignment_id:
        coll = get_db().assignments
        assignment_oid = ObjectId(assignment_id)
        doc = coll.find_one({"_id": assignment_oid, "status": "active"})
        if not doc:
            raise ValueError("Active assignment not found for this upload")
        uid = doc["user_id"]
        if doc.get("practice_shoot_id"):
            sid = doc["practice_shoot_id"]
        elif shoot_id:
            sid = ObjectId(shoot_id)
        else:
            coll.update_one({"_id": assignment_oid}, {"$set": {"practice_shoot_id": sid}})

    scene = detect_scene_type_hint(filename, content_type)
    citations = ground_principles(scene)
    output = _run_coach_model(image_bytes, content_type, citations)

    image_url = upload_portfolio_image(image_bytes, content_type, str(uid), str(sid))

    embedding: list[float] | None = None
    try:
        embedding = embed_image_bytes(image_bytes)
    except Exception as exc:
        print(f"[coach] embedding skipped: {exc}")

    doc: dict[str, Any] = {
        "user_id": uid,
        "shoot_id": sid,
        "image_url": image_url,
        "thumbnail_url": image_url,
        "scores": output.scores.model_dump(),
        "glass_box": {
            "observations": output.glass_box.observations,
            "reasoning_steps": output.glass_box.reasoning_steps,
            "priority_fixes": [p.model_dump() for p in output.glass_box.priority_fixes],
            "grounding_principles": [c.id for c in citations],
        },
        "spatial_metadata": output.spatial_metadata.model_dump(),
        "aesthetic_tags": output.aesthetic_tags,
        "scene_description": output.scene_description,
        "colour_notes": output.colour_notes,
        "created_at": datetime.now(timezone.utc),
    }
    if embedding:
        doc["embedding"] = embedding
    if assignment_oid:
        doc["assignment_id"] = assignment_oid

    result = get_db().portfolio_entries.insert_one(doc)
    if assignment_oid:
        link_upload_to_assignment(assignment_id, result.inserted_id, sid)

    payload = _to_api_payload(result.inserted_id, output, citations)
    if assignment_oid:
        payload["assignmentId"] = str(assignment_oid)
    return payload
