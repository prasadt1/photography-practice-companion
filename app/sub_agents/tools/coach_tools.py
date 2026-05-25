"""Coach sub-agent tools (§7.2)."""

from __future__ import annotations

import base64
from typing import Any

from sub_agents.coach_pipeline import analyze_photo
from tools.embeddings import embed_image_bytes
from tools.grounding import detect_scene_type_hint, ground_principles


def analyze_image_multimodal(
    image_base64: str,
    mime_type: str = "image/jpeg",
    filename: str = "photo.jpg",
    user_id: str | None = None,
    shoot_id: str | None = None,
    assignment_id: str | None = None,
) -> dict[str, Any]:
    """Gemini multimodal critique; writes portfolio_entries (Coach pipeline)."""
    raw = image_base64
    if "," in raw:
        raw = raw.split(",", 1)[1]
    image_bytes = base64.b64decode(raw)
    return analyze_photo(
        image_bytes=image_bytes,
        content_type=mime_type,
        filename=filename,
        user_id=user_id,
        shoot_id=shoot_id,
        assignment_id=assignment_id,
    )


def ground_in_data_store_principles(
    scene_type: str = "general",
    filename: str = "photo.jpg",
    content_type: str = "image/jpeg",
) -> dict[str, Any]:
    """Agent Builder / local principles grounding for scene type."""
    hint = scene_type or detect_scene_type_hint(filename, content_type)
    citations = ground_principles(hint)
    return {
        "sceneType": hint,
        "citations": [c.model_dump() for c in citations],
    }


def generate_multimodal_embedding(image_base64: str) -> dict[str, Any]:
    """Vertex multimodal embedding vector for an image."""
    raw = image_base64
    if "," in raw:
        raw = raw.split(",", 1)[1]
    image_bytes = base64.b64decode(raw)
    try:
        vector = embed_image_bytes(image_bytes)
        return {"dimensions": len(vector), "embedding": vector[:8], "truncated": True}
    except Exception as exc:
        return {"error": str(exc)}


def write_portfolio_entry_note(
    portfolio_entry_id: str,
    note: str,
) -> dict[str, Any]:
    """Append a mentor note to an existing portfolio entry (metadata only)."""
    from bson import ObjectId

    from memory.db import get_db

    result = get_db().portfolio_entries.update_one(
        {"_id": ObjectId(portfolio_entry_id)},
        {"$set": {"mentor_note": note}},
    )
    return {"matched": result.matched_count, "modified": result.modified_count}
