#!/usr/bin/env python3
"""Verify Vertex AI access for GEMINI_MODEL and EMBEDDING_MODEL from .env."""
import os
import sys

try:
    from dotenv import load_dotenv
except ImportError:
    print("Install: pip install python-dotenv", file=sys.stderr)
    sys.exit(1)

load_dotenv()

os.environ.setdefault(
    "GOOGLE_APPLICATION_CREDENTIALS", "./gcp-service-account.json"
)

import vertexai
from vertexai.generative_models import GenerativeModel
from vertexai.vision_models import MultiModalEmbeddingModel

project_id = os.environ.get("GOOGLE_CLOUD_PROJECT", "practice-companion-hackathon")
region = os.environ.get("VERTEX_AI_REGION", "us-central1")
gemini_model = os.environ.get("GEMINI_MODEL", "gemini-3-pro")
embedding_model = os.environ.get("EMBEDDING_MODEL", "multimodalembedding@001")

print(f"Project: {project_id}  Region: {region}")
print(f"GEMINI_MODEL={gemini_model}")
print(f"EMBEDDING_MODEL={embedding_model}")

vertexai.init(project=project_id, location=region)

print("\n--- Gemini ---")
fallbacks = [gemini_model, "gemini-2.0-flash", "gemini-1.5-pro", "gemini-pro"]
model = None
for name in fallbacks:
    try:
        print(f"  Trying {name}...")
        model = GenerativeModel(name)
        response = model.generate_content(
            "Reply with exactly: Gemini is working!"
        )
        print(f"  OK: {response.text.strip()[:80]}")
        if name != gemini_model:
            print(f"  WARNING: preferred {gemini_model} unavailable; using {name}")
        break
    except Exception as e:
        print(f"  Failed: {e}")

if not model:
    sys.exit("No Gemini model available")

print("\n--- Multimodal embedding ---")
try:
    emb = MultiModalEmbeddingModel.from_pretrained(embedding_model)
    print(f"  OK: loaded {embedding_model}")
except Exception as e:
    print(f"  FAILED: {e}")
    sys.exit(1)

print("\nVertex AI verification complete.")
