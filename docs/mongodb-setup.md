# MongoDB Atlas & MCP setup

**Canonical:** [`spec.md`](spec.md) §0.1, §7 · **Decisions:** [`decisions.md`](decisions.md)

## Cluster (confirmed)

| Field | Value |
|-------|--------|
| Name | `practice-photography-companion-mvp-cluster` |
| Tier | **Flex** (required for Vector Search, Atlas Search, change streams) |
| Cloud / region | GCP **`europe-west3`** (Belgium — only region available for this project) |
| Host | `practice-photography-companion-m.e5tn2tc.mongodb.net` |
| Database | `practice_companion` |

Cross-region note: Vertex AI / Agent Engine / GCS use **`us-central1`**. See [ADR-001](decisions.md#adr-001-mongodb-atlas-region-is-europe-west3-only).

## Network access

| Surface | Setting | Notes |
|---------|---------|--------|
| Cluster IP allowlist | `0.0.0.0/0` (dev) + home IP `/32` | PyMongo from dev machine |
| Service account API access | Restricted IP (e.g. home `/32`) | Atlas **admin** MCP tools fail from other IPs |

## Service account (MCP)

- Org SA: `practice-companion-mcp`
- Roles: Organization Member + **Project Data Access Admin** on hackathon project
- Client ID prefix: `mdb_sa_id_…` (not `db_sa_id_`)

## Environment variables

Copy [`.env.example`](../.env.example) → `.env` (gitignored).

```bash
MONGODB_URI=mongodb+srv://USER:PASS@practice-photography-companion-m.e5tn2tc.mongodb.net/practice_companion?retryWrites=true&w=majority&appName=practice-photography-companion-mvp-cluster
MONGODB_DB_NAME=practice_companion
MONGODB_ATLAS_CLIENT_ID=mdb_sa_id_...
MONGODB_ATLAS_CLIENT_SECRET=mdb_sa_sk_...
MONGODB_MCP_CONFIG_PATH=./mcp-config.json
```

## MCP config (`mcp-config.json`, gitignored)

Map the same credentials to MCP env names:

```json
{
  "mcpServers": {
    "mongodb-mcp-server": {
      "command": "npx",
      "args": ["-y", "mongodb-mcp-server@latest"],
      "env": {
        "MDB_MCP_CONNECTION_STRING": "<same as MONGODB_URI>",
        "MDB_MCP_API_CLIENT_ID": "<same as MONGODB_ATLAS_CLIENT_ID>",
        "MDB_MCP_API_CLIENT_SECRET": "<same as MONGODB_ATLAS_CLIENT_SECRET>"
      }
    }
  }
}
```

**Claude Code:** project `.mcp.json` can use `${MDB_MCP_*}` if vars are exported before `claude`.  
**Cursor:** `~/.cursor/mcp.json` — same shape; see [`mcp.json.example`](../mcp.json.example).

## Bootstrap database (idempotent)

After `.env` exists:

```bash
# macOS: use python3 -m pip (there is often no `pip` on PATH)
python3 -m pip install pymongo python-dotenv
python3 scripts/bootstrap-mongodb.py
```

Creates collections, compound indexes, and prints reminders for **Vector Search** and **Atlas Search** indexes (create in Atlas UI or MCP — not fully automatable via PyMongo alone).

## Vector & Atlas Search indexes

**Step-by-step (Atlas UI):** [`atlas-indexes-setup.md`](atlas-indexes-setup.md)

**Vector** on `portfolio_entries.embedding` — 1408 dimensions, cosine (`multimodalembedding@001`).

**Atlas Search** index `glass_box_search` on `glass_box.*`, `aesthetic_tags`.

## Verify

```bash
python -c "import os; from dotenv import load_dotenv; import pymongo; load_dotenv(); c=pymongo.MongoClient(os.environ['MONGODB_URI']); print(c.server_info()['version'])"
```

In Claude Code / Cursor: “List my MongoDB databases using MCP.”
