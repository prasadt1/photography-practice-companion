# Iris (Practice Companion) — Agent context

**Canonical spec:** [`docs/spec.md`](docs/spec.md) (v3)  
**Doc index:** [`docs/doc-map.md`](docs/doc-map.md)  
**Claude Code handoff:** [`docs/claude-code-handoff.md`](docs/claude-code-handoff.md)

## Current build gate

**Phase 0 — partial.** Infrastructure and docs exist; ADK scaffold, bootstrap script run, and spec §0.8 verification gates are not all complete. **Start Phase 1** only after checking [`docs/implementation-plan.md`](docs/implementation-plan.md) Phase 0 checklist.

## Product (one line)

**Iris** — AI photography mentor with persistent portfolio memory: multimodal critique, practice planning, MongoDB Atlas memory, Agent Builder photography principles. Repo IDs stay `practice-companion`.

## Stack

| Layer | Choice |
|-------|--------|
| Reasoning | Gemini 3 Pro (Vertex AI, `us-central1`) |
| Agents | ADK → Vertex AI Agent Engine |
| Grounding | Agent Builder Data Store (`principles/`) |
| Memory | MongoDB Atlas **Flex**, `practice_companion` DB, **GCP `europe-west3` only** |
| Agent reads | MongoDB MCP Server |
| Agent writes | PyMongo from sub-agents (Coach, Planner, Reflection) |
| Images | **GCS** (`gs://…` URLs in MongoDB; no blobs in MongoDB) |
| Frontend | React/Vite → Firebase Hosting |

## Source repos to port from

- `photography-coach-ai-gemini3` — UI, Glass Box, spatial overlay, prompts  
- `photography-coach-gemma4` — XMP, voice, Field Mode PWA, HTTPS-on-LAN  

## Do not commit

`.env`, `gcp-service-account.json`, `mcp-config.json`
