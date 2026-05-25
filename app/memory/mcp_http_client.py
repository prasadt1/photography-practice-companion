"""
HTTP client for MongoDB MCP Server (Streamable HTTP).

Used by mcp_reads when MONGODB_MCP_HTTP_URL is set. Sync callers use a thread pool
so ADK orchestrator async loops are not blocked incorrectly.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
from concurrent.futures import ThreadPoolExecutor
from typing import Any
from urllib.parse import urlparse

from memory.mcp_ejson import extract_ejson_array_text, parse_ejson_documents, to_ejson
from memory.mcp_telemetry import mcp_read_span

logger = logging.getLogger(__name__)

_executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="mcp-http")


def mcp_http_url() -> str | None:
    raw = os.environ.get("MONGODB_MCP_HTTP_URL", "").strip()
    return raw or None


def _normalize_mcp_url(url: str) -> str:
    base = url.rstrip("/")
    if not base.endswith("/mcp"):
        base = f"{base}/mcp"
    return base


def _request_headers() -> dict[str, str]:
    headers: dict[str, str] = {}
    api_key = os.environ.get("MONGODB_MCP_API_KEY", "").strip()
    if api_key:
        headers["x-mcp-api-key"] = api_key

    if os.environ.get("MONGODB_MCP_USE_GCP_IDENTITY", "true").lower() in (
        "0",
        "false",
        "no",
    ):
        return headers

    url = mcp_http_url()
    if not url:
        return headers

    try:
        import google.auth.transport.requests
        import google.oauth2.id_token

        parsed = urlparse(url)
        audience = f"{parsed.scheme}://{parsed.netloc}"
        token = google.oauth2.id_token.fetch_id_token(
            google.auth.transport.requests.Request(),
            audience,
        )
        headers["Authorization"] = f"Bearer {token}"
    except Exception as exc:
        logger.warning("GCP identity token for MCP HTTP failed: %s", exc)
    return headers


def _parse_call_tool_result(result: Any) -> list[dict[str, Any]]:
    if getattr(result, "isError", False):
        parts = []
        for block in getattr(result, "content", []) or []:
            if hasattr(block, "text") and block.text:
                parts.append(block.text)
        raise RuntimeError("MCP tool error: " + (" ".join(parts) or "unknown"))

    if getattr(result, "structuredContent", None):
        sc = result.structuredContent
        if isinstance(sc, dict) and "documents" in sc:
            return list(sc["documents"])
        if isinstance(sc, list):
            return sc

    documents: list[dict[str, Any]] = []
    for block in getattr(result, "content", []) or []:
        text = getattr(block, "text", None)
        if not text:
            continue
        payload = extract_ejson_array_text(text.strip())
        if not payload:
            continue
        try:
            documents.extend(parse_ejson_documents(payload))
        except Exception as exc:
            logger.warning("MCP EJSON parse failed: %s", exc)
            continue
    return documents


async def _call_tool_async(tool_name: str, arguments: dict[str, Any]) -> list[dict[str, Any]]:
    from mcp import ClientSession
    from mcp.client.streamable_http import streamablehttp_client

    url = _normalize_mcp_url(mcp_http_url() or "")
    headers = _request_headers()
    timeout = float(os.environ.get("MONGODB_MCP_HTTP_TIMEOUT_SEC", "120"))

    async with streamablehttp_client(
        url,
        headers=headers or None,
        timeout=timeout,
        sse_read_timeout=timeout,
    ) as (read_stream, write_stream, _get_session_id):
        async with ClientSession(read_stream, write_stream) as session:
            await session.initialize()
            result = await session.call_tool(tool_name, arguments)
            return _parse_call_tool_result(result)


def _run_async(coro: Any) -> list[dict[str, Any]]:
    try:
        asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.run(coro)
    future = _executor.submit(asyncio.run, coro)
    return future.result(timeout=float(os.environ.get("MONGODB_MCP_HTTP_TIMEOUT_SEC", "120")))


def mcp_find(
    database: str,
    collection: str,
    filt: dict[str, Any],
    *,
    projection: dict[str, Any] | None = None,
    limit: int | None = None,
    sort: list[tuple[str, int]] | None = None,
) -> list[dict[str, Any]]:
    args: dict[str, Any] = {
        "database": database,
        "collection": collection,
        "filter": to_ejson(filt) if filt else {},
        "limit": limit if limit is not None else 100,
    }
    if projection:
        args["projection"] = to_ejson(projection)
    if sort:
        args["sort"] = {field: direction for field, direction in sort}

    query_bytes = len(json.dumps(args, default=str).encode("utf-8"))
    with mcp_read_span(
        "mongodb.mcp.find",
        tool_name="find",
        collection=collection,
        query_size_bytes=query_bytes,
    ):
        docs = _run_async(_call_tool_async("find", args))
        logger.info(
            "mcp_read_ok tool=find collection=%s count=%d transport=http",
            collection,
            len(docs),
        )
        return docs


def mcp_find_one(
    database: str,
    collection: str,
    filt: dict[str, Any],
    *,
    projection: dict[str, Any] | None = None,
    sort: list[tuple[str, int]] | None = None,
) -> dict[str, Any] | None:
    args: dict[str, Any] = {
        "database": database,
        "collection": collection,
        "filter": to_ejson(filt) if filt else {},
        "limit": 1,
    }
    if projection:
        args["projection"] = to_ejson(projection)
    if sort:
        args["sort"] = {field: direction for field, direction in sort}

    query_bytes = len(json.dumps(args, default=str).encode("utf-8"))
    with mcp_read_span(
        "mongodb.mcp.find_one",
        tool_name="find",
        collection=collection,
        query_size_bytes=query_bytes,
    ):
        docs = _run_async(_call_tool_async("find", args))
        logger.info(
            "mcp_read_ok tool=find_one collection=%s transport=http",
            collection,
        )
        return docs[0] if docs else None


def mcp_aggregate(
    database: str,
    collection: str,
    pipeline: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    args: dict[str, Any] = {
        "database": database,
        "collection": collection,
        "pipeline": to_ejson(pipeline),
    }
    query_bytes = len(json.dumps(args, default=str).encode("utf-8"))
    with mcp_read_span(
        "mongodb.mcp.aggregate",
        tool_name="aggregate",
        collection=collection,
        query_size_bytes=query_bytes,
    ):
        docs = _run_async(_call_tool_async("aggregate", args))
        logger.info(
            "mcp_read_ok tool=aggregate collection=%s count=%d transport=http",
            collection,
            len(docs),
        )
        return docs
