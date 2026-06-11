# Iris — Devpost article (copy-paste)

Paste each section into the matching Devpost field. **Four images** are embedded inline; upload the rest per [`devpost-gallery-upload.md`](devpost-gallery-upload.md).

Image URLs use `main` on GitHub — push committed assets before submit.

---

## Project Title

Iris — AI Photography Mentor with Persistent Memory

---

## Short Summary

An AI photography mentor with **persistent portfolio memory**. I built it for the **MongoDB partner track**: agents read your library through **MongoDB MCP** on Cloud Run; **Atlas** holds documents, vector embeddings, and searchable critique text — powering similar photos, natural-language search, and portfolio-aware Mentor chat. **Gemini 3.1 Pro** and **Google ADK** (nine agents) handle critique, practice planning, organize, and print drafts — always behind **human-in-the-loop** approval.

---

## Inspiration

I have photographed seriously for years and shipped AI projects in parallel. Both worlds share the same loop — practice, reflection, refinement — but most AI tools for photographers optimize a different loop: cull faster, edit faster, deliver faster. Few ask whether you are becoming a better photographer.

Three earlier projects sharpened the gap:

- **AI Photography Coach** — Gemini multimodal critique; a track winner in the Google + Kaggle Gen AI Intensive. Strong per-photo feedback, **no memory** of who you are as a photographer.
- **RAG Photography Tutor** — local-first tutoring with FAISS and a principles corpus. It taught rules, **not the learner**.
- **L.E.N.S.** — voice-first coaching for photographers with vision impairment. A population mainstream tools ignore.

Every tool I tried started fresh each session. A real mentor remembers your weak spots, your aesthetic, your growth. **Iris treats that continuity as architecture** — not a chat history feature.

**Why this hackathon:** The challenge is real (skill growth over months). Iris moves **beyond chat** with tools that critique, plan practice, organize your backlog, and draft listings — under your approval. **MongoDB** is the partner fit: one Atlas cluster for documents, vectors, text search, and **MCP-native reads** agents can trace in production logs.

---

## What it does

Iris adapts to **who you are** and **remembers what you have made**. Three personas are first-class in the orchestrator (tool filtering + sub-agent composition):

| Persona | Focus | Agent composition |
|---------|--------|-------------------|
| **Hobbyist** | Skill development | Coach → Reflection → Planner; Triage for backlog |
| **Working pro** | Commercial outcomes | Same memory + Print Sales Strategist (HITL) |
| **Vision impairment** | Creative expression | Visual Describer; Field Coach describe-before-score *(orchestrator + tests shipped; web/iOS picker on roadmap)* |

**Demo path:** hobbyist and working pro on web and iPhone. Persona isolation is verified in `tests/test_persona_isolation.py`.

![Glass Box — five-axis scores on your photo](https://raw.githubusercontent.com/prasadt1/iris-photography-mentor/main/docs/devpost-public/standalone-02-glass-box-studio.png)

*Glass Box critique: five scored dimensions, spatial hints, and reasoning you can inspect — not a black-box number.*

**Five agentic capabilities:**

1. **Mentor Copilot** — chat over portfolio search, aesthetic profile, and trends (`POST /api/v1/agent/chat`)
2. **Live Field Coach** — real-time composition cues on iPhone: on-screen hints, optional voice, rule-of-thirds grid, CoreMotion horizon guide, ready-to-capture checkpoint
3. **Backlog Triage** — proposes tags and dedupes; **never** applies without approval
4. **Print Sales Strategist** — marketplace listing drafts for working pros; publish behind HITL
5. **Visual Describer** — scene narration for the vision-impairment persona *(agent layer shipped)*

**Human-in-the-loop is the product pattern:** Iris proposes; you approve. Assignments (accept/decline), organize tags, print listings, and bulk deletes all wait for an explicit yes. The field coach advises; you own the shutter.

**Web + iOS:** Upload or shoot → Glass Box critique persists to MongoDB. Practice proposes assignments tied to portfolio gaps. My Work supports natural-language search (Gemini query expansion → **Atlas Search**) and **vector similar photos**. Native iOS extends capture with live coaching and the same API memory.

---

## How I built it

![System architecture — Cloud Run, ADK, Gemini, MongoDB Atlas](https://raw.githubusercontent.com/prasadt1/iris-photography-mentor/main/docs/devpost-public/diagram-architecture.png)

*Web + iOS → FastAPI on Cloud Run → nine Google ADK agents → Gemini, Agent Builder Data Store, MongoDB Atlas, GCS.*

### Gemini + Google ADK

- **Gemini 3.1 Pro** — Coach multimodal critique (structured JSON), Planner, Reflection, Mentor orchestration, query expansion for library search
- **Gemini 2.5 Flash** — live field coaching frames (sub-2s cues on iPhone)
- **Nine `LlmAgent` instances** — orchestrator plus Coach, Mentor, Planner, Reflection, Field Coach, Triage, Print Sales, Visual Describer; enumerated straight from the constructed ADK graph by `scripts/dump-agent-graph.py` (see `proof-05-agent-graph.png` and `docs/compliance-proof/evidence/agent-graph.txt`)
- **Persona-filtered `AgentTool` lists** — hobbyist cannot invoke Print Sales; vision-impairment swaps Visual Describer for Triage at the tool level, not prompt-only

**Production host:** FastAPI on **Cloud Run** (judge-facing URL). An Agent Engine scaffold exists in-repo for a future cutover; it is not what the live demo uses today.

### Agent Builder grounding

Coach critiques call **Discovery Engine** (`google.cloud.discoveryengine_v1`) against a curated principles Data Store (~50 documents). `search_photography_principles` injects citations into the Glass Box prompt. Local `principles/*.md` is a dev fallback only.

![Critique pipeline — upload to portfolio write](https://raw.githubusercontent.com/prasadt1/iris-photography-mentor/main/docs/devpost-public/diagram-data-flow.png)

*Upload → Coach (Gemini) → grounded principles → portfolio entry + multimodal embedding in Atlas.*

### MongoDB Atlas + MCP (partner track)

| Primitive | MongoDB feature |
|-----------|-----------------|
| Portfolio + critiques | Flexible documents |
| Similar photos | **Atlas Vector Search** (Vertex embeddings, 1408-d) |
| NL library search | **Gemini expansion → Atlas Search** (`glass_box_search`) |
| Aesthetic profile | On-read aggregation *(change-stream listener deployed; profile also recomputes on read)* |
| Agent-native reads | **MongoDB MCP Server** on Cloud Run |

**Reads:** production portfolio paths use **MongoDB MCP** (`mcp_reads.py` → HTTP Streamable MCP → Atlas). **Writes:** PyMongo after HITL gates. Judges can verify MCP without the UI:

![MongoDB MCP — production read path with Cloud Logging evidence](https://raw.githubusercontent.com/prasadt1/iris-photography-mentor/main/docs/devpost-public/proof-01-mcp-read.png)

*Backend proof: `mcp_read_ok tool=find collection=portfolio_entries` — reproducible via [`scripts/verify-hackathon-stack.sh`](https://github.com/prasadt1/iris-photography-mentor/blob/main/scripts/verify-hackathon-stack.sh). Committed evidence: [`docs/compliance-proof/`](https://github.com/prasadt1/iris-photography-mentor/tree/main/docs/compliance-proof).*

**Stack health (curl):** `https://practice-companion-api-l6kusl5xcq-uc.a.run.app/health`  
**Agent Builder probe:** `…/health/grounding-probe`

### Why MongoDB (not three databases)

Iris needs documents, vector similarity, full-text search, derived profiles, and agent-native access. A split stack (PostgreSQL + Pinecone + Elasticsearch) means three services, three SDKs, and sync glue. **Atlas Flex** collapses the primitives; the **MCP Server** exposes them to ADK agents with traceable spans. At ~10K photos, that is roughly **$5–10/month** on Flex vs **$75+/month** for a typical split architecture — operationally simpler, not magically exclusive.

### HITL + training signal

Irreversible actions flow through `pending_approvals` with frozen proposals. User overrides (e.g. calibrating backlit scores) feed `load_prompt_with_user_overrides` so future Coach invocations respect your corrections.

**Clients:** React + Vite on Firebase Hosting; native SwiftUI iOS (AVFoundation, live coach, horizon overlay, critique radar).

---

## Challenges I ran into

**The wallpaper problem.** An early build looked multi-agent but was not — Coach, Planner, and Reflection were Python services in `FunctionTool` wrappers. A second AI grepped the repo; I rewrote with phase gates that require **nine real `LlmAgent` instances**.

**Cross-AI verification.** Draft specs are not enough. Adversarial code review caught MCP treated as optional and persona routing done only in prompts.

**MCP as production read path.** Partner credibility required `mongodb.mcp.find` in Cloud Logging, not a local `npx` demo. `./scripts/verify_mcp_in_production.sh` and OpenTelemetry spans (`mongodb.mcp.*`) are part of the submission story.

**Live coach on device.** Encoding every video frame blocked the camera queue. The fix: interval photo snapshots, rate-limited Gemini Flash calls, and a composition-lock checkpoint when the frame is good enough.

**iOS under deadline.** Signing, TestFlight, and screen-recording friction cost calendar days; the field demo is pre-recorded takes with voiceover, not live-to-tape.

---

## Design

**Glass Box, not black box.** Five dimensions with explicit reasoning — users see *why* lighting scored 6/10.

**HITL as visible UI.** Approve / Reject cards for organize, print, and assignments. Nothing auto-applies.

**Mobile-first field coaching.** Horizon guide, ready-to-capture lock, optional TTS, post-capture radar chart.

**Photography aesthetic.** Darkroom palette, amber accents, serif critique type — creative tool, not enterprise dashboard.

**Complement, not replace.** XMP sidecar export into Lightroom; Iris fits the mentor-and-evolve loop while Aftershoot fits cull-and-deliver.

---

## Accomplishments I'm proud of

- Nine verifiable ADK agents with persona filtering enforced in code
- MongoDB MCP load-bearing on Cloud Run — judge-reproducible backend proof in-repo
- End-to-end hobbyist loop: assignment → iPhone field coach → Glass Box → reflection skill delta → web library
- HITL with a real training-signal loop, not audit-only logs
- Native iPhone field path shipping against the same Cloud Run API as web

---

## What I learned

- Multi-agent claims must survive `grep` and phase-gate scripts
- Partner integration must match the pitch — MCP in the **production** read path
- Personas are architectural (different sub-agents), not tone presets
- Backend trace evidence helps judges more than another UI screenshot

---

## What's next

- Vision-impairment iOS onboarding and VoiceOver polish
- ARKit on-device subject tracking (horizon + server spatial overlays ship today)
- Agent Engine production cutover (scaffold in-repo)
- Instructor persona and B2B licensing for schools and workshops
- Vertical expansion — same memory pattern for other creative disciplines

---

## Built With

agent, atlas-search, atlas-vector-search, avfoundation, cloud-run, discovery-engine, fastapi, firebase, firebase-hosting, gemini, google-adk, google-cloud, mcp, model-context-protocol, mongodb, mongodb-atlas, opentelemetry, python, react, swift, swiftui, typescript, vertex-ai, vite

---

## Try it out

**Web app:** https://iris-photo-mentor.web.app

**GitHub:** https://github.com/prasadt1/iris-photography-mentor

**Backend compliance proof (logs, JSON, verify script):** https://github.com/prasadt1/iris-photography-mentor/tree/main/docs/compliance-proof

**Architecture map:** https://github.com/prasadt1/iris-photography-mentor/blob/main/docs/hackathon-compliance.md

**API health:** https://practice-companion-api-l6kusl5xcq-uc.a.run.app/health

**Demo video:** *(paste YouTube/Vimeo URL — under 3:00; script: `docs/demo-video-unified-3min.md`)*

**Partner track:** MongoDB

**Suggested judge flow (no install):** open web app → upload or browse demo library → Practice → Organize approve one card → My Work search → curl `/health` → open compliance-proof README.

**ADK Playground:** `make playground` on localhost:8080 — same orchestrator code as production chat; not a public judge URL. Production path: `POST /api/v1/agent/chat` on Cloud Run.
