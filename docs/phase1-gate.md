# Phase 1 verification gate

Run from repo root:

```bash
chmod +x scripts/verify-phase1-gate.sh scripts/setup-gcs-portfolio.sh
make verify-phase1
```

## Automated checklist

| Check | Command / artifact |
|--------|-------------------|
| ADK scaffold | `app/orchestrator/agent.py`, `app/prompts/orchestrator.txt` |
| Agent import | `make agent-import` |
| MongoDB bootstrap | `make bootstrap-mongodb` |
| GCS portfolio bucket | `gs://practice-companion-portfolio` (`us-central1`) — `scripts/setup-gcs-portfolio.sh` if missing |
| Frontend build | `make frontend-build` |
| Studio UI | `frontend/src/components/studio/*`, mock `agentClient.ts` |
| No Ollama in UI | `rg -i ollama frontend/src` → empty |
| Vertex AI | `make vertex-check` (exit 0 = full; 2 = embedding only) |
| Unit tests | `cd app && uv run pytest tests/unit -q` |

## Manual (same gate, human step)

| Check | How |
|--------|-----|
| **Playground** | `make playground` → open dev UI, send a test message to orchestrator |
| **MongoDB MCP** | Cursor/Claude with `mcp-config.json` → list `practice_companion` collections |
| **Agent Builder Data Store** | Console: store created, 5 `principles/*.md` imported, `DATA_STORE_ID` in `.env` |
| **GitHub** | Push `main` without `.env`, `mcp-config.json`, or `gcp-service-account.json` |

## Gate status (May 24, 2026)

- **Passed locally:** scaffold, agent import, MongoDB bootstrap, GCS bucket, frontend build, studio port, principles corpus, unit tests.
- **Vertex:** `make vertex-check` — Gemini 3.x needs `VERTEX_AI_GEMINI_LOCATION=global` and `GEMINI_MODEL=gemini-3.1-pro-preview` (see ADR-010).
- **Integration test:** `cd app && uv run pytest tests/integration/test_agent.py` — requires the same `.env` Gemini settings as playground.
- **Playground / MCP / Data Store / git push:** confirm manually before starting Phase 2.

When all rows are green, proceed to **Phase 2** in [`implementation-plan.md`](implementation-plan.md).
