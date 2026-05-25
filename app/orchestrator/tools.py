"""Orchestrator callable tools (Coach pipeline for Studio uploads)."""

from __future__ import annotations

from sub_agents.coach import analyze_photo as run_coach_analysis


def analyze_uploaded_photo(
    image_base64: str,
    mime_type: str = "image/jpeg",
    filename: str = "photo.jpg",
    user_id: str | None = None,
    shoot_id: str | None = None,
) -> dict:
    """
    Run the Coach sub-agent on a base64-encoded image.
    Returns structured critique JSON and writes a portfolio_entries document.
    """
    import base64

    raw = image_base64
    if "," in raw:
        raw = raw.split(",", 1)[1]
    image_bytes = base64.b64decode(raw)
    return run_coach_analysis(
        image_bytes=image_bytes,
        content_type=mime_type,
        filename=filename,
        user_id=user_id,
        shoot_id=shoot_id,
    )
