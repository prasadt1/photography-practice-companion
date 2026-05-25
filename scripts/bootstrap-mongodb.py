#!/usr/bin/env python3
"""Idempotent MongoDB bootstrap — delegates to app/memory/indexes.py (v5)."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "app"))

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None  # type: ignore

if load_dotenv:
    load_dotenv(ROOT / ".env")

from memory.indexes import bootstrap  # noqa: E402

if __name__ == "__main__":
    bootstrap()
