# Devpost submission draft

**Canonical:** [`spec.md`](spec.md) §18 · Refine before submit.

---

## Summary

**Iris** is an AI photography mentor that combines multimodal critique with adaptive practice planning, grounded in each photographer’s persistent aesthetic identity. Unlike single-shot graders, it remembers portfolios, assignments, and improvement over time — then plans what to practice next.

## Features

- Glass Box multimodal critique (5-axis scores + spatial overlays)
- Adaptive practice assignments with explicit rationale and human-in-the-loop accept/decline
- Reflection and **Intentional Skill Application Rate (ISAR)** across shoots
- MongoDB memory: portfolio embeddings, Atlas Vector Search, Atlas Search on critique text; aesthetic profile recomputed via change-stream listener on portfolio writes
- **MongoDB MCP-primary reads** in production: Coach API → HTTP Streamable MCP (Cloud Run) → Atlas; verified with `./scripts/verify_mcp_in_production.sh` (`mcp_read_ok` in Cloud Logging)
- Agent Builder–grounded photography principles
- XMP sidecar export for Lightroom workflows
- Hobbyist vs working-pro modes; Firebase Google sign-in on hosted build when `VITE_FIREBASE_*` is set

## Technologies

Gemini 3 Pro · Google ADK · Vertex AI Agent Engine · Agent Builder Data Store · MongoDB Atlas (Flex) · MongoDB MCP Server · Cloud Run · Cloud Storage · Firebase Hosting · React · TypeScript · Python · OpenTelemetry (MCP read spans)

## Data sources

- Curated photography principles (`principles/*.md`) in Agent Builder Data Store
- Demo photos: author’s own work and/or Unsplash/Pexels with documented licenses
- User-uploaded images stored in **Google Cloud Storage**; metadata and embeddings in MongoDB

## Findings & learnings

- **What worked:** Co-locating vectors + operational docs in Atlas; routing portfolio reads through MCP so judges can trace `mongodb.mcp.find` in Cloud Trace; layered auth (Cloud Run IAM + `x-mcp-api-key`) for the MCP sidecar.
- **What was hard:** EJSON round-trips and MCP tool responses wrapped in untrusted-user-data tags; `MONGODB_URI` with `&` breaking naive `source .env` in deploy scripts; cross-region Atlas (`eu-west3`) vs Vertex (`us-central1`).
- **Surprises:** Portfolio list had to call `mcp_reads` explicitly — a PyMongo shortcut bypassed MCP and left verify scripts with no `mcp_read_ok` logs.

## Track

**MongoDB**

## Links

- Hosted app: https://practice-companion-hackathon.web.app
- Coach API: https://practice-companion-api-l6kusl5xcq-uc.a.run.app
- MCP service: https://mongodb-mcp-l6kusl5xcq-uc.a.run.app/mcp
- Repo: https://github.com/prasadt1/photography-practice-companion
- Video: *(YouTube/Vimeo — record 3–5 min demo: Studio → Glass Box → Practice HITL → Memory trends → MCP verify)*

## Prior work attribution

Built on architectural learnings from [Photography Coach (Gemini 3)](https://github.com/prasadt1/photography-coach-ai-gemini3) and [L.E.N.S. / Gemma4](https://github.com/prasadt1/photography-coach-gemma4). This repo is a **new** multi-agent product with MongoDB memory and practice planning — contest-period implementation.
