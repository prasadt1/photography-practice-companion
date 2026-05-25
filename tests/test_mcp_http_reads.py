"""MCP HTTP read path — mcp_reads routes through mcp_http_client when URL is set."""

from __future__ import annotations

import os
from unittest.mock import MagicMock, patch

import pytest


@pytest.fixture(autouse=True)
def _reset_mcp_stats():
    import memory.mcp_reads as mr

    mr._mcp_reads_attempted = 0
    mr._mcp_reads_succeeded = 0
    yield


def test_mcp_reads_uses_http_when_configured():
    os.environ["MONGODB_MCP_HTTP_URL"] = "http://127.0.0.1:9999/mcp"
    os.environ["MONGODB_MCP_ALLOW_PYMONGO_FALLBACK"] = "false"
    os.environ["ORCHESTRATOR_USE_MCP"] = "true"

    coll = MagicMock()
    coll.name = "portfolio_entries"
    coll.database.name = "practice_companion"
    fake_doc = {"_id": "abc", "scene_description": "test"}

    with patch("memory.mcp_http_client.mcp_find", return_value=[fake_doc]) as mock_find:
        from memory import mcp_reads

        out = mcp_reads.find(coll, {"user_id": "u1"}, limit=5)
        assert out == [fake_doc]
        mock_find.assert_called_once()
        assert mcp_reads.mcp_read_stats()["succeeded"] == 1

    os.environ.pop("MONGODB_MCP_HTTP_URL", None)


def test_mcp_reads_raises_without_fallback_on_mcp_error():
    os.environ["MONGODB_MCP_HTTP_URL"] = "http://127.0.0.1:9999/mcp"
    os.environ["MONGODB_MCP_ALLOW_PYMONGO_FALLBACK"] = "false"

    coll = MagicMock()
    coll.name = "portfolio_entries"
    coll.database.name = "practice_companion"

    with patch("memory.mcp_http_client.mcp_find", side_effect=RuntimeError("MCP down")):
        from memory import mcp_reads

        with pytest.raises(RuntimeError, match="MCP read required"):
            mcp_reads.find(coll, {})

    os.environ.pop("MONGODB_MCP_HTTP_URL", None)


def test_mcp_reads_pymongo_fallback_when_allowed():
    os.environ["MONGODB_MCP_HTTP_URL"] = "http://127.0.0.1:9999/mcp"
    os.environ["MONGODB_MCP_ALLOW_PYMONGO_FALLBACK"] = "true"

    coll = MagicMock()
    coll.name = "portfolio_entries"
    coll.database.name = "practice_companion"
    coll.find.return_value.limit.return_value = [{"_id": 1}]

    with patch("memory.mcp_http_client.mcp_find", side_effect=RuntimeError("MCP down")):
        from memory import mcp_reads

        out = mcp_reads.find(coll, {}, limit=1)
        assert out == [{"_id": 1}]
        coll.find.assert_called_once()

    os.environ.pop("MONGODB_MCP_HTTP_URL", None)
