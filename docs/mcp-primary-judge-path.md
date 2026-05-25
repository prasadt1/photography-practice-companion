# MCP-primary reads — hosted implementation

**Consolidation item 3** — production reads route through **MongoDB MCP Server** (`app/memory/mcp_reads.py` → `mcp_http_client.py`), not silent PyMongo.

---

## Architecture (deployed)

```text
web.app → practice-companion-api (Cloud Run)
           → mcp_reads → HTTP MCP client (IAM Bearer + x-mcp-api-key)
           → mongodb-mcp (Cloud Run, min_instances=1, Streamable HTTP)
           → MongoDB Atlas
```

| Component | Path |
|-----------|------|
| MCP service | `services/mongodb-mcp/` + `scripts/deploy-mongodb-mcp.sh` |
| HTTP client | `app/memory/mcp_http_client.py` |
| Read router | `app/memory/mcp_reads.py` |
| OTel spans | `app/memory/mcp_telemetry.py` — `mongodb.mcp.find`, `.find_one`, `.aggregate` |
| Verify | `scripts/verify_mcp_in_production.sh` |

---

## Deploy order

1. `./scripts/deploy-mongodb-mcp.sh` — grants Coach API SA `roles/run.invoker` on MCP service
2. Add to `.env`: `MONGODB_MCP_HTTP_URL`, `MONGODB_MCP_API_KEY`, `MONGODB_MCP_ALLOW_PYMONGO_FALLBACK=false`
3. `./scripts/deploy-coach-api.sh`
4. `./scripts/verify_mcp_in_production.sh` — **last step**; capture Trace screenshot for Devpost

---

## Environment

| Variable | Production | Local dev |
|----------|------------|-----------|
| `MONGODB_MCP_HTTP_URL` | `https://mongodb-mcp-….run.app/mcp` | unset → PyMongo if fallback allowed |
| `MONGODB_MCP_API_KEY` | shared secret (MCP `httpHeaders`) | optional |
| `MONGODB_MCP_ALLOW_PYMONGO_FALLBACK` | **`false`** | **`true`** |
| `MONGODB_MCP_USE_GCP_IDENTITY` | `true` (Cloud Run → MCP IAM) | `true` if testing against deployed MCP |
| `ORCHESTRATOR_USE_MCP` | `true` | `true` |

**Fallback code is retained** — set `MONGODB_MCP_ALLOW_PYMONGO_FALLBACK=true` to recover from MCP outage without redeploying.

---

## Devpost wording (after verify script passes)

> Every read in Iris's hosted production path — Mentor portfolio queries, Triage reads, Glass Box search — routes through the MongoDB MCP Server on Cloud Run. Sub-agents call MCP tools (`find`, `aggregate`); they do not use PyMongo directly for reads when `MONGODB_MCP_ALLOW_PYMONGO_FALLBACK=false`. Trace screenshots show `mongodb.mcp.find` and `mongodb.mcp.aggregate` spans.

---

## Local playground (stdio)

`make playground` still supports `mcp-config.json` + `npx` via `orchestrator/mongodb_mcp.py` when `MONGODB_MCP_HTTP_URL` is unset.
