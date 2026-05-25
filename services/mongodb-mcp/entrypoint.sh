#!/bin/sh
set -eu
export MDB_MCP_TRANSPORT="${MDB_MCP_TRANSPORT:-http}"
export MDB_MCP_HTTP_HOST="${MDB_MCP_HTTP_HOST:-0.0.0.0}"
export MDB_MCP_HTTP_PORT="${PORT:-8080}"
export MDB_MCP_HTTP_RESPONSE_TYPE="${MDB_MCP_HTTP_RESPONSE_TYPE:-json}"
export MDB_MCP_READ_ONLY="${MDB_MCP_READ_ONLY:-true}"

if [ -n "${MONGODB_MCP_API_KEY:-}" ]; then
  export MDB_MCP_HTTP_HEADERS="{\"x-mcp-api-key\":\"${MONGODB_MCP_API_KEY}\"}"
fi

exec mongodb-mcp-server --transport http --httpHost "${MDB_MCP_HTTP_HOST}" --httpPort "${MDB_MCP_HTTP_PORT}" --httpResponseType "${MDB_MCP_HTTP_RESPONSE_TYPE}" --readOnly
