"""Multimodal embeddings on VERTEX_AI_REGION (us-central1)."""

from __future__ import annotations

import os

import vertexai
from vertexai.vision_models import Image, MultiModalEmbeddingModel


def embed_image_bytes(image_bytes: bytes) -> list[float]:
    project = os.environ.get("GOOGLE_CLOUD_PROJECT")
    region = os.environ.get("VERTEX_AI_REGION", "us-central1")
    model_name = os.environ.get("EMBEDDING_MODEL", "multimodalembedding@001")

    vertexai.init(project=project, location=region)
    model = MultiModalEmbeddingModel.from_pretrained(model_name)
    image = Image(image_bytes=image_bytes)
    result = model.get_embeddings(image=image, dimension=1408)
    vector = result.image_embedding
    if vector is None:
        raise RuntimeError("No image embedding returned")
    return list(vector)


def embed_text(text: str) -> list[float]:
    """Text embedding vector (1408-dim) for portfolio search and NL queries."""
    query = text.strip()
    if not query:
        raise ValueError("Query text is required")

    project = os.environ.get("GOOGLE_CLOUD_PROJECT")
    region = os.environ.get("VERTEX_AI_REGION", "us-central1")
    model_name = os.environ.get("EMBEDDING_MODEL", "multimodalembedding@001")

    vertexai.init(project=project, location=region)
    model = MultiModalEmbeddingModel.from_pretrained(model_name)
    result = model.get_embeddings(contextual_text=query, dimension=1408)
    vector = result.text_embedding
    if vector is None:
        raise RuntimeError("No text embedding returned")
    return list(vector)


def portfolio_search_text(
    scene_description: str,
    aesthetic_tags: list[str] | None = None,
    *,
    colour_notes: str | None = None,
    user_tags: list[str] | None = None,
) -> str:
    """Build the text we embed for library search (scene + tags, not pixels)."""
    parts: list[str] = []
    scene = (scene_description or "").strip()
    if scene:
        parts.append(scene)
    tags = [t.strip() for t in (aesthetic_tags or []) if t and t.strip()]
    tags.extend(t.strip() for t in (user_tags or []) if t and t.strip())
    if tags:
        parts.append("Tags: " + ", ".join(dict.fromkeys(tags)))
    notes = (colour_notes or "").strip()
    if notes:
        parts.append(notes)
    return ". ".join(parts)
