"""BSON ↔ Extended JSON helpers for MongoDB MCP tool arguments."""

from __future__ import annotations

import json
import re
from typing import Any

_UNTRUSTED_DATA_RE = re.compile(
    r"<untrusted-user-data[^>]*>\s*([\s\S]*?)\s*</untrusted-user-data",
    re.IGNORECASE,
)


def to_ejson(value: Any) -> Any:
    """Convert Python/BSON values to Extended JSON dicts/lists MCP tools accept."""
    from bson import json_util

    # json.loads (not json_util.loads) keeps $oid / $date as plain dicts
    return json.loads(json_util.dumps(value))


def extract_ejson_array_text(text: str) -> str | None:
    """Pull EJSON array from mongodb-mcp-server tool text (untrusted-user-data wrapper)."""
    match = _UNTRUSTED_DATA_RE.search(text)
    if match:
        inner = match.group(1).strip()
        if inner.startswith("["):
            return inner
    start = text.find("[")
    if start == -1:
        return None
    end = text.rfind("]")
    if end > start:
        return text[start : end + 1]
    return None


def parse_ejson_documents(text: str) -> list[dict[str, Any]]:
    """Parse EJSON document array returned by mongodb-mcp-server find/aggregate tools."""
    from bson import json_util

    text = text.strip()
    if not text:
        return []
    parsed = json_util.loads(text)
    if isinstance(parsed, list):
        return parsed
    if isinstance(parsed, dict):
        return [parsed]
    return []
