"""Load MongoDB MCP Server as ADK McpToolset (stdio local or Streamable HTTP on Cloud Run)."""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent


def load_mongodb_mcp_toolset():
    """
    Returns McpToolset or None if disabled / misconfigured.
    Set ORCHESTRATOR_USE_MCP=false to skip (FunctionTools still query via mcp_reads).
    """
    if os.environ.get("ORCHESTRATOR_USE_MCP", "true").lower() in ("0", "false", "no"):
        return None

    http_url = os.environ.get("MONGODB_MCP_HTTP_URL", "").strip()
    if http_url:
        return _load_http_mcp_toolset(http_url)

    return _load_stdio_mcp_toolset()


def _load_http_mcp_toolset(url: str) -> Any | None:
    try:
        from google.adk.tools.mcp_tool import McpToolset
        from google.adk.tools.mcp_tool.mcp_session_manager import StreamableHTTPConnectionParams
        from memory.mcp_http_client import _normalize_mcp_url, _request_headers
    except ImportError as exc:
        logger.warning("MCP HTTP dependencies missing: %s", exc)
        return None

    headers = _request_headers()
    return McpToolset(
        connection_params=StreamableHTTPConnectionParams(
            url=_normalize_mcp_url(url),
            headers=headers or None,
            timeout=float(os.environ.get("MONGODB_MCP_HTTP_TIMEOUT_SEC", "120")),
            sse_read_timeout=float(os.environ.get("MONGODB_MCP_HTTP_TIMEOUT_SEC", "120")),
        ),
    )


def _load_stdio_mcp_toolset() -> Any | None:
    config_rel = os.environ.get("MONGODB_MCP_CONFIG_PATH", "mcp-config.json")
    config_path = Path(config_rel)
    if not config_path.is_absolute():
        config_path = PROJECT_ROOT / config_rel.lstrip("./")
    if not config_path.is_file():
        logger.warning("MongoDB MCP config not found: %s", config_path)
        return None

    try:
        from google.adk.tools.mcp_tool import McpToolset
        from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
        from mcp import StdioServerParameters
    except ImportError as exc:
        logger.warning("MCP stdio dependencies missing: %s", exc)
        return None

    with config_path.open(encoding="utf-8") as f:
        cfg = json.load(f)

    servers = cfg.get("mcpServers") or cfg.get("servers") or {}
    server = servers.get("mongodb-mcp-server")
    if not server:
        logger.warning("mongodb-mcp-server not in MCP config")
        return None

    env = {**os.environ, **(server.get("env") or {})}
    return McpToolset(
        connection_params=StdioConnectionParams(
            server_params=StdioServerParameters(
                command=server.get("command", "npx"),
                args=server.get("args", ["-y", "mongodb-mcp-server@latest"]),
                env=env,
            ),
            timeout=30.0,
        ),
    )
