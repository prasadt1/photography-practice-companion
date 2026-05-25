"""
MongoDB read path — MCP-primary when ORCHESTRATOR_USE_MCP=true.

Hosted production: reads go to MongoDB MCP Server (Streamable HTTP on Cloud Run).
Local: set MONGODB_MCP_HTTP_URL or allow PyMongo fallback via MONGODB_MCP_ALLOW_PYMONGO_FALLBACK.

Writes always use PyMongo.
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


def allow_pymongo_fallback() -> bool:
    return os.environ.get("MONGODB_MCP_ALLOW_PYMONGO_FALLBACK", "true").lower() not in (
        "0",
        "false",
        "no",
    )


def mcp_http_configured() -> bool:
    from memory.mcp_http_client import mcp_http_url

    return bool(mcp_http_url())


def mcp_read_stats() -> dict[str, int]:
    return {"attempted": _mcp_reads_attempted, "succeeded": _mcp_reads_succeeded}


def _db_name(collection: Any) -> str:
    return os.environ.get("MONGODB_DB_NAME", collection.database.name)


def _should_use_mcp() -> bool:
    return mcp_primary_enabled() and mcp_http_configured()


def _on_mcp_failure(exc: Exception, operation: str, collection_name: str) -> None:
    if allow_pymongo_fallback():
        logger.warning(
            "MCP read failed (%s %s), PyMongo fallback allowed: %s",
            operation,
            collection_name,
            exc,
        )
        return
    raise RuntimeError(
        f"MCP read required but failed for {operation} on {collection_name}: {exc}"
    ) from exc


def find(
    collection: Any,
    filt: dict[str, Any],
    *,
    projection: dict[str, Any] | None = None,
    limit: int | None = None,
    sort: list[tuple[str, int]] | None = None,
) -> list[dict[str, Any]]:
    global _mcp_reads_attempted, _mcp_reads_succeeded
    if _should_use_mcp():
        _mcp_reads_attempted += 1
        try:
            from memory import mcp_http_client

            docs = mcp_http_client.mcp_find(
                _db_name(collection),
                collection.name,
                filt,
                projection=projection,
                limit=limit,
                sort=sort,
            )
            _mcp_reads_succeeded += 1
            return docs
        except Exception as exc:
            _on_mcp_failure(exc, "find", collection.name)
            if not allow_pymongo_fallback():
                raise

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
    global _mcp_reads_attempted, _mcp_reads_succeeded
    if _should_use_mcp():
        _mcp_reads_attempted += 1
        try:
            from memory import mcp_http_client

            doc = mcp_http_client.mcp_find_one(
                _db_name(collection),
                collection.name,
                filt,
                projection=projection,
                sort=sort,
            )
            _mcp_reads_succeeded += 1
            return doc
        except Exception as exc:
            _on_mcp_failure(exc, "find_one", collection.name)
            if not allow_pymongo_fallback():
                raise

    kwargs: dict[str, Any] = {}
    if projection:
        kwargs["projection"] = projection
    if sort:
        kwargs["sort"] = sort
    return collection.find_one(filt, **kwargs)


def aggregate(collection: Any, pipeline: list[dict[str, Any]]) -> list[dict[str, Any]]:
    global _mcp_reads_attempted, _mcp_reads_succeeded
    if _should_use_mcp():
        _mcp_reads_attempted += 1
        try:
            from memory import mcp_http_client

            docs = mcp_http_client.mcp_aggregate(
                _db_name(collection),
                collection.name,
                pipeline,
            )
            _mcp_reads_succeeded += 1
            return docs
        except Exception as exc:
            _on_mcp_failure(exc, "aggregate", collection.name)
            if not allow_pymongo_fallback():
                raise

    return list(collection.aggregate(pipeline))
