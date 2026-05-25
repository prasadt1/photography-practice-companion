#!/usr/bin/env python3
"""Emit a Cloud Run --env-vars-file YAML from .env (handles & in passwords)."""
from __future__ import annotations

import os
import sys
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:
    print("Install: python3 -m pip install python-dotenv", file=sys.stderr)
    sys.exit(1)


def _yaml_value(value: str) -> str:
    escaped = value.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    env_path = Path(sys.argv[1]) if len(sys.argv) > 1 else root / ".env"
    if env_path.is_file():
        load_dotenv(env_path)

    project = os.getenv("GOOGLE_CLOUD_PROJECT", "practice-companion-hackathon")
    fb_cors = f"https://{project}.web.app,https://{project}.firebaseapp.com"
    cors = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174")
    cors_full = f"{cors},{fb_cors}"

    mongodb_uri = os.getenv("MONGODB_URI", "").strip()
    if not mongodb_uri:
        print("ERROR: MONGODB_URI not set in .env", file=sys.stderr)
        sys.exit(1)

    mcp_url = os.getenv("MONGODB_MCP_HTTP_URL", "").strip()
    mcp_key = os.getenv("MONGODB_MCP_API_KEY", "").strip()
    mcp_fallback = os.getenv("MONGODB_MCP_ALLOW_PYMONGO_FALLBACK", "false").strip()

    pairs: dict[str, str] = {
        "GOOGLE_CLOUD_PROJECT": project,
        "VERTEX_AI_GEMINI_LOCATION": os.getenv("VERTEX_AI_GEMINI_LOCATION", "global"),
        "GEMINI_MODEL": os.getenv("GEMINI_MODEL", "gemini-3.1-pro-preview"),
        "VERTEX_AI_REGION": os.getenv("VERTEX_AI_REGION", "us-central1"),
        "EMBEDDING_MODEL": os.getenv("EMBEDDING_MODEL", "multimodalembedding@001"),
        "MONGODB_DB_NAME": os.getenv("MONGODB_DB_NAME", "practice_companion"),
        "DATA_STORE_LOCATION": os.getenv("DATA_STORE_LOCATION", "global"),
        "DATA_STORE_ID": os.getenv("DATA_STORE_ID", ""),
        "GCS_PORTFOLIO_BUCKET": os.getenv(
            "GCS_PORTFOLIO_BUCKET", "practice-companion-portfolio"
        ),
        "GCS_PORTFOLIO_PREFIX": os.getenv("GCS_PORTFOLIO_PREFIX", "originals"),
        "DEMO_USER_ID": os.getenv("DEMO_USER_ID", ""),
        "CORS_ORIGINS": cors_full,
        "MONGODB_URI": mongodb_uri,
        "ORCHESTRATOR_USE_MCP": os.getenv("ORCHESTRATOR_USE_MCP", "true"),
        "MONGODB_MCP_ALLOW_PYMONGO_FALLBACK": mcp_fallback or "false",
        "MONGODB_MCP_USE_GCP_IDENTITY": os.getenv("MONGODB_MCP_USE_GCP_IDENTITY", "true"),
    }
    if mcp_url:
        pairs["MONGODB_MCP_HTTP_URL"] = mcp_url
    if mcp_key:
        pairs["MONGODB_MCP_API_KEY"] = mcp_key

    for key, value in pairs.items():
        print(f"{key}: {_yaml_value(value)}")


if __name__ == "__main__":
    main()
