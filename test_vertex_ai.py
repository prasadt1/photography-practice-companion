#!/usr/bin/env python3
"""Verify Vertex AI: Gemini 3.x on global, embeddings on VERTEX_AI_REGION."""
from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent

try:
    from dotenv import load_dotenv
except ImportError:
    print("Install: pip install python-dotenv", file=sys.stderr)
    sys.exit(1)

load_dotenv(ROOT / ".env")

creds = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "./gcp-service-account.json")
creds_path = Path(creds)
if not creds_path.is_absolute():
    creds_path = ROOT / creds.lstrip("./")
if creds_path.is_file():
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(creds_path.resolve())
elif creds_path != Path(creds):
    print(f"WARNING: credentials file not found: {creds_path}", file=sys.stderr)

import vertexai
from vertexai.generative_models import GenerativeModel
from vertexai.vision_models import MultiModalEmbeddingModel

project_id = os.environ.get("GOOGLE_CLOUD_PROJECT", "practice-companion-hackathon")
embed_region = os.environ.get("VERTEX_AI_REGION", "us-central1")
gemini_region = os.environ.get(
    "VERTEX_AI_GEMINI_LOCATION",
    os.environ.get("GEMINI_VERTEX_REGION", "global"),
)
gemini_model = os.environ.get("GEMINI_MODEL", "gemini-3.1-pro-preview")
embedding_model = os.environ.get("EMBEDDING_MODEL", "multimodalembedding@001")

print(f"Project: {project_id}")
print(f"GEMINI: {gemini_model} @ {gemini_region}")
print(f"EMBEDDING: {embedding_model} @ {embed_region}")

print("\n--- Gemini 3.x (global) ---")
vertexai.init(project=project_id, location=gemini_region)
fallbacks = [
    gemini_model,
    "gemini-3.1-pro-preview",
    "gemini-3-pro-preview",
]
gemini_ok = False
used_model: str | None = None

for name in dict.fromkeys(fallbacks):
    try:
        print(f"  Trying {name}...")
        response = GenerativeModel(name).generate_content("Reply with exactly: Gemini is working!")
        text = (response.text or "").strip()
        if not text:
            raise RuntimeError("empty response")
        print(f"  OK: {text[:80]}")
        gemini_ok = True
        used_model = name
        if name != gemini_model:
            print(f"  NOTE: set GEMINI_MODEL={name} in .env")
        break
    except Exception as e:
        print(f"  Failed: {e}")

print("\n--- Multimodal embedding (regional) ---")
embedding_ok = False
try:
    vertexai.init(project=project_id, location=embed_region)
    MultiModalEmbeddingModel.from_pretrained(embedding_model)
    print(f"  OK: loaded {embedding_model} in {embed_region}")
    embedding_ok = True
except Exception as e:
    print(f"  FAILED: {e}")

print()
if gemini_ok and embedding_ok:
    print("Vertex AI verification complete.")
    sys.exit(0)
if embedding_ok and not gemini_ok:
    print("PARTIAL: embedding OK; fix GEMINI_MODEL / VERTEX_AI_GEMINI_LOCATION=global")
    sys.exit(2)
sys.exit(1)
