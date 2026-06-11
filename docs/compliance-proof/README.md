# Compliance proof — backend traces & judge verification

Iris is a **live production stack**, not a mockup. This folder holds **committed evidence** that the hackathon-required technologies run at runtime.

## Quick links for judges

| What | URL / file |
|------|------------|
| **Live web app** | https://iris-photo-mentor.web.app |
| **API health (models + MCP URL)** | https://practice-companion-api-l6kusl5xcq-uc.a.run.app/health |
| **Agent Builder probe (no upload)** | https://practice-companion-api-l6kusl5xcq-uc.a.run.app/health/grounding-probe |
| **Latest verification report** | [latest-report.md](latest-report.md) |
| **Annotated proof images** | [../devpost-public/proof-01-mcp-read.png](../devpost-public/proof-01-mcp-read.png) … `proof-05-agent-graph.png` |
| **Nine-agent graph (live ADK import)** | [evidence/agent-graph.txt](evidence/agent-graph.txt) · [evidence/agent-graph.json](evidence/agent-graph.json) · `proof-05-agent-graph.png` |
| **Architecture compliance map** | [../hackathon-compliance.md](../hackathon-compliance.md) |

## What gets proven (backend-only — no browser)

| Use case | API call | Required tech |
|----------|----------|---------------|
| Library / Home | `GET /api/v1/portfolio` | **MongoDB MCP** (`mcp_read_ok` in logs) |
| Mentor chat | `POST /api/v1/agent/chat` | **Gemini** + **Google ADK** orchestrator |
| Glass Box critique | `POST /api/v1/analyze-photo` | **Gemini** + **Agent Builder** Data Store |
| Live field coaching | `POST /api/v1/agent/field_capture` | **Gemini 2.5 Flash** (iOS) |
| Organize | `POST /api/v1/triage/scan` | MCP reads + HITL proposals |

## Evidence in this repo

After running the verify script, JSON and log excerpts land in [`evidence/`](evidence/):

- `health.json` — live `geminiModel`, `fieldCaptureModel`, `mongodbMcpHttp`, `dataStoreConfigured`
- `portfolio-sample.json` — MCP-backed read against demo library
- `mentor-chat-sample.json` — orchestrator + Gemini reply
- `cloud-log-mcp-read-ok.txt` — Cloud Logging lines: `mcp_read_ok tool=find …`
- `cloud-log-grounding-ok.txt` — Agent Builder: `grounding_ok source=discovery_engine …`
- `agent-graph.json` / `agent-graph.txt` — the **9 ADK agents** enumerated from the
  constructed orchestrator graph (`scripts/dump-agent-graph.py`), with each
  sub-agent's tools and the persona-filtered delegation

## Reproduce (optional)

Judges with network access can run:

```bash
git clone https://github.com/prasadt1/iris-photography-mentor.git
cd iris-photography-mentor
./scripts/verify-hackathon-stack.sh
```

With Google Cloud project access (same project as deploy):

```bash
RUN_COACH=1 ./scripts/verify-hackathon-stack.sh   # ~90s — includes Coach + Agent Builder
cd app && uv run python ../scripts/dump-agent-graph.py   # enumerate the 9 ADK agents
python3 scripts/build-compliance-proof-images.py
```

No `gcloud`? Still works — curl checks + committed evidence files remain valid.

## Cloud Console (live traces)

Project: `practice-companion-hackathon`

- **Cloud Trace** — filter span name: `mongodb.mcp.find` / `mongodb.mcp.aggregate`
- **Cloud Logging** — Coach API service `practice-companion-api`, search: `mcp_read_ok` or `grounding_ok`

## ADK Playground vs production

| Surface | URL | Notes |
|---------|-----|-------|
| ADK Playground | `localhost:8080` (`make playground`) | Local dev UI — **not** a public judge URL |
| Production orchestrator | `POST …/api/v1/agent/chat` on Cloud Run | **Same agent graph** — see `mentor-chat-sample.json` |

The hackathon requires runtime use of Gemini + Agent Builder + partner MCP. The verify script exercises those paths on the **hosted API**, independent of the React or iOS clients.

## Devpost embed suggestion

Link this README in your project description:

> Backend compliance proof (MCP logs, health flags, orchestrator JSON):  
> https://github.com/prasadt1/iris-photography-mentor/blob/main/docs/compliance-proof/README.md

Attach `proof-01-mcp-read.png` and `proof-02-orchestrator.png` in the gallery or article.
