"""Load repo .env for integration tests (MongoDB URI, DEMO_USER_ID)."""

from __future__ import annotations

from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")
