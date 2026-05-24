"""Agent Builder Data Store grounding with local principles/ fallback."""

from __future__ import annotations

import os
import re
from pathlib import Path

from memory.schema import GroundingCitation

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
PRINCIPLES_DIR = PROJECT_ROOT / "principles"

SCENE_TO_DOCS: dict[str, list[str]] = {
    "portrait": ["composition.md", "lighting.md", "subject_impact.md"],
    "landscape": ["composition.md", "lighting.md", "creativity.md"],
    "street": ["composition.md", "creativity.md", "technique.md"],
    "general": ["composition.md", "lighting.md", "technique.md"],
}

TITLE_FROM_ID = {
    "composition.md": "Composition",
    "lighting.md": "Lighting",
    "technique.md": "Technique",
    "creativity.md": "Creativity",
    "subject_impact.md": "Subject impact",
}


def _excerpt_from_markdown(text: str, max_len: int = 220) -> str:
    for line in text.splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            return line[:max_len]
    return text[:max_len].replace("\n", " ")


def _load_local(doc_id: str) -> GroundingCitation | None:
    path = PRINCIPLES_DIR / doc_id
    if not path.is_file():
        return None
    body = path.read_text(encoding="utf-8")
    return GroundingCitation(
        id=doc_id,
        title=TITLE_FROM_ID.get(doc_id, doc_id.replace(".md", "").replace("_", " ").title()),
        excerpt=_excerpt_from_markdown(body),
    )


def _search_discovery_engine(query: str, page_size: int = 5) -> list[GroundingCitation]:
    data_store_id = os.environ.get("DATA_STORE_ID", "").strip()
    project = os.environ.get("GOOGLE_CLOUD_PROJECT", "")
    location = os.environ.get("DATA_STORE_LOCATION", "global")
    if not data_store_id or not project:
        return []

    try:
        from google.cloud import discoveryengine_v1 as discoveryengine
    except ImportError:
        return []

    client = discoveryengine.SearchServiceClient()
    serving_config = client.serving_config_path(
        project=project,
        location=location,
        data_store=data_store_id,
        serving_config="default_config",
    )
    request = discoveryengine.SearchRequest(
        serving_config=serving_config,
        query=query,
        page_size=page_size,
    )
    response = client.search(request=request)
    citations: list[GroundingCitation] = []
    seen: set[str] = set()
    for result in response.results:
        doc = result.document
        name = doc.name or ""
        doc_id = name.split("/")[-1] if name else "principle"
        if not doc_id.endswith(".md"):
            doc_id = f"{doc_id}.md"
        if doc_id in seen:
            continue
        seen.add(doc_id)
        excerpt = ""
        if doc.derived_struct_data:
            excerpt = str(doc.derived_struct_data.get("snippet", ""))[:220]
        if not excerpt and doc.content and doc.content.raw_bytes:
            excerpt = doc.content.raw_bytes.decode("utf-8", errors="ignore")[:220]
        local = _load_local(doc_id)
        if not excerpt and local:
            excerpt = local.excerpt
        citations.append(
            GroundingCitation(
                id=doc_id,
                title=TITLE_FROM_ID.get(doc_id, doc_id.replace(".md", "")),
                excerpt=excerpt or doc_id,
            )
        )
    return citations


def ground_principles(scene_type: str) -> list[GroundingCitation]:
    """Return principles for scene; tries Data Store then local files."""
    scene_key = scene_type.lower().strip()
    if scene_key not in SCENE_TO_DOCS:
        scene_key = "general"

    query = f"photography {scene_key} composition lighting technique"
    citations = _search_discovery_engine(query)
    if citations:
        return citations

    return [c for doc in SCENE_TO_DOCS[scene_key] if (c := _load_local(doc))]


def detect_scene_type_hint(filename: str, mime_type: str) -> str:
    """Lightweight scene hint from filename until vision classify runs."""
    name = filename.lower()
    if re.search(r"portrait|headshot|face|person", name):
        return "portrait"
    if re.search(r"landscape|mountain|sunset|valley", name):
        return "landscape"
    if re.search(r"street|urban|city", name):
        return "street"
    return "general"
