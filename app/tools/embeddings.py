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
    result = model.get_embeddings(image=image)
    vector = result.image_embedding
    if vector is None:
        raise RuntimeError("No image embedding returned")
    return list(vector)
