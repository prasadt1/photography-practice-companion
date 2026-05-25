# Iris — AI Photography Mentor

**Iris** — AI photography mentor with persistent portfolio memory. Multimodal critique, personalized practice plans, and a MongoDB-backed memory layer. Built with **Gemini 3**, **Google ADK**, **Agent Builder**, and **MongoDB Atlas** for the [Google Cloud Rapid Agent Hackathon](https://googlecloudrapidagents2026.devpost.com/) (MongoDB track).

*Repository and cloud identifiers remain `practice-companion` / `practice_companion` for deployment continuity.*

## Documentation

| Doc | Purpose |
|-----|---------|
| [`docs/spec.md`](docs/spec.md) | Master spec (canonical) |
| [`CONTEXT.md`](CONTEXT.md) | Agent quick context |
| [`docs/doc-map.md`](docs/doc-map.md) | Doc index |
| [`docs/mongodb-setup.md`](docs/mongodb-setup.md) | Atlas + MCP setup |
| [`docs/claude-code-handoff.md`](docs/claude-code-handoff.md) | Latest doc review for Claude Code |

**Build status:** Studio · Memory · Practice · Field · Reflection live locally. See [`docs/phase4-started.md`](docs/phase4-started.md).

**Deploy (judges):** [`docs/deploy.md`](docs/deploy.md) — Firebase Hosting + Cloud Run API.

**Implementation summary:** [`docs/implementation-and-hackathon-mapping.md`](docs/implementation-and-hackathon-mapping.md) — features, GCP/agents/MongoDB, hackathon rules mapping.

## Quick start (developers)

1. Clone and copy env: `cp .env.example .env` (fill secrets; never commit).
2. MongoDB: follow [`docs/mongodb-setup.md`](docs/mongodb-setup.md).
3. Bootstrap DB: `python3 -m pip install pymongo python-dotenv && python3 scripts/bootstrap-mongodb.py`
4. GCP key: `gcp-service-account.json` (gitignored) per spec §0.2.
5. Verify Vertex: `python3 test_vertex_ai.py` (uses `GEMINI_MODEL` from `.env`).
6. Run locally:
   ```bash
   make api-dev          # :8081
   make frontend-dev     # :5173
   make playground       # :8080 ADK UI
   ```

## Prior work

UI and critique patterns extend [photography-coach-ai-gemini3](https://github.com/prasadt1/photography-coach-ai-gemini3) and [photography-coach-gemma4](https://github.com/prasadt1/photography-coach-gemma4). This repository is a **new** multi-agent product with MongoDB memory and practice planning.

## License

Apache-2.0 — see [LICENSE](LICENSE).
