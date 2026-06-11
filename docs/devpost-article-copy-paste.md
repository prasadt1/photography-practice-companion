# Iris — Devpost article (copy-paste)

Paste each section into the matching Devpost field. **Three images** inline below (from `docs/devpost-gallery/` on `main`); upload the full gallery separately per [`SUBMISSION-ASSET-MAP.md`](SUBMISSION-ASSET-MAP.md).

---

## Project Title

Iris — AI Photography Mentor with Persistent Memory

---

## Short Summary

An AI photography mentor with **persistent portfolio memory**. Built for the **MongoDB partner track**: agents read your library through **MongoDB MCP** on Cloud Run; **Atlas** holds documents, vector embeddings, and searchable critique text. **Gemini 3.1 Pro** and **Google ADK** (nine agents) handle critique, practice, organize, and print drafts — always behind **human-in-the-loop** approval.

---

## Inspiration

I photograph seriously and ship AI projects in parallel. Both reward the same loop — practice, reflection, refinement — but most AI photo tools optimize a different one: cull faster, edit faster, deliver faster. Few ask whether you are becoming a better photographer.

Three earlier projects sharpened the gap:

- **AI Photography Coach** — Gemini multimodal critique; track winner in the Google + Kaggle Gen AI Intensive. Strong per-photo feedback, **no memory** of who you are.
- **RAG Photography Tutor** — local-first tutoring with FAISS and a principles corpus. It taught rules, **not the learner**.
- **L.E.N.S.** — voice-first coaching for photographers with vision impairment — a population mainstream tools ignore.

Every tool I tried started fresh each session. A real mentor remembers your weak spots, aesthetic, and growth. **Iris treats that continuity as architecture**, not chat history.

**Why this hackathon:** Skill growth happens over months. Iris goes beyond chat — critique, practice planning, backlog organize, print drafts — under your approval. **MongoDB** fits: one Atlas cluster for documents, vectors, text search, and **MCP-native reads** traceable in production logs.

---

## What it does

Iris adapts to **who you are** and **remembers what you have made**. Three personas are first-class in the orchestrator — **tool filtering + sub-agent composition**, not tone tweaks:

| Persona | Focus | Agent composition |
|---------|--------|-------------------|
| **Hobbyist** | Skill development | Coach → Reflection → Planner; Triage for backlog |
| **Working pro** | Commercial outcomes | Same memory + Print Sales Strategist (HITL) |
| **Vision impairment** | Creative expression | Visual Describer; Field Coach describe-before-score *(agent + tests shipped; web/iOS picker on roadmap)* |

**Demo path:** hobbyist and working pro on web and iPhone. Persona isolation verified in `tests/test_persona_isolation.py`.

![Glass Box — five-axis scores on your photo](https://raw.githubusercontent.com/prasadt1/iris-photography-mentor/main/docs/devpost-gallery/01_glassbox.jpg)

*Five scored dimensions with inspectable reasoning — not a black-box grade.*

**Five agentic capabilities:**

1. **Mentor Copilot** — portfolio search, aesthetic profile, conversational Q&A
2. **Live Field Coach** — real-time composition cues on iPhone: hints, optional TTS, rule-of-thirds grid, CoreMotion horizon guide, ready-to-capture checkpoint
3. **Backlog Triage** — tag and dedupe proposals; **never** applies without approval
4. **Print Sales Strategist** — marketplace listing drafts for working pros; publish behind HITL
5. **Visual Describer** — scene narration for the vision-impairment persona *(agent layer shipped)*

**HITL is the product pattern:** Iris proposes; you approve. Assignments, organize tags, print listings, and bulk deletes wait for an explicit yes.

**Web + iOS:** Shoot or upload → Glass Box critique persists to MongoDB. Practice proposes assignments from portfolio gaps. My Work supports natural-language search (Gemini expansion → **Atlas Search**) and **vector similar photos**. iOS adds live field coaching on the same API memory.

---

## How I built it

![System architecture — Cloud Run, ADK, Gemini, MongoDB Atlas](https://raw.githubusercontent.com/prasadt1/iris-photography-mentor/main/docs/devpost-gallery/02_architecture.jpg)

*Web + iOS → FastAPI on Cloud Run → nine Google ADK agents → Gemini, Agent Builder Data Store, MongoDB Atlas, GCS.*

### Gemini + Google ADK

- **Gemini 3.1 Pro** — Coach multimodal critique (structured JSON), Planner, Reflection, Mentor, library query expansion
- **Gemini 2.5 Flash** — live field coaching frames on iPhone
- **Nine `LlmAgent` instances** — orchestrator + Coach, Mentor, Planner, Reflection, Field Coach, Triage, Print Sales, Visual Describer; enumerated from the live ADK graph via `scripts/dump-agent-graph.py` (`proof-05-agent-graph.png`, `docs/compliance-proof/evidence/agent-graph.txt`)
- **Persona-filtered `AgentTool` lists** — hobbyist cannot invoke Print Sales; vision-impairment gets Visual Describer, not Triage — enforced at the tool level, not in prompts alone

**Production:** FastAPI on **Cloud Run**. Agent Engine scaffold exists for a future cutover; the live demo uses Cloud Run today.

### Agent Builder grounding

Coach critiques call **Discovery Engine** against a principles Data Store with **five curated documents** (composition, lighting, technique, creativity, subject impact). `ground_in_data_store_principles` injects citations into the Glass Box prompt. Live probe: `GET …/health/grounding-probe` returns `source: discovery_engine`. Local `principles/*.md` is dev fallback only.

**Critique path:** upload → Coach (Gemini) → grounded principles → portfolio entry + multimodal embedding in Atlas.

### MongoDB Atlas + MCP (partner track)

| Primitive | MongoDB feature |
|-----------|-----------------|
| Portfolio + critiques | Flexible documents |
| Similar photos | **Atlas Vector Search** (Vertex embeddings, 1408-d) |
| NL library search | **Gemini expansion → Atlas Search** (`glass_box_search`) |
| Aesthetic profile | On-read aggregation |
| Agent-native reads | **MongoDB MCP Server** on Cloud Run |

**Reads:** production portfolio paths use **MongoDB MCP** (`mcp_reads.py` → Streamable HTTP → Atlas). **Writes:** PyMongo after HITL gates.

![MongoDB MCP — production read path verified in Cloud Trace](https://raw.githubusercontent.com/prasadt1/iris-photography-mentor/main/docs/devpost-gallery/08_runtime-trace.jpg)

*Cloud Trace span `mongodb.mcp.find` on `portfolio_entries` — a real MCP read in production, not a mock. Reproduce: [`scripts/verify-hackathon-stack.sh`](https://github.com/prasadt1/iris-photography-mentor/blob/main/scripts/verify-hackathon-stack.sh).*

Every claim is verifiable at runtime — traces, logs, agent graph, grounding probes — in the [**proof package →**](https://github.com/prasadt1/iris-photography-mentor/blob/main/docs/compliance-proof/PROOF-PACKAGE.md).

**Health:** https://practice-companion-api-l6kusl5xcq-uc.a.run.app/health  
**Grounding:** https://practice-companion-api-l6kusl5xcq-uc.a.run.app/health/grounding-probe

### Why MongoDB — and why not the alternatives

Iris's memory layer needs five things at once: flexible documents, vector similarity, full-text search, on-read aggregation, and **agent-native access**. Most stacks deliver these by stitching services together. Atlas delivers all five in one cluster — and exposes them to agents through the official **MCP Server**.

| Need | Iris on MongoDB Atlas | Typical alternative | Trade-off avoided |
|------|----------------------|---------------------|-------------------|
| Evolving photo + critique records | BSON documents | PostgreSQL JSONB | rigid migrations as the critique schema grows |
| Similar-photo search | Atlas Vector Search (1408-d) | Pinecone / pgvector | a separate vector service to sync |
| NL library search | Atlas Search (Lucene) | Elasticsearch | a third system + index pipeline |
| Aesthetic profile | Aggregation pipeline | app-side joins | pulling compute into the app |
| Agent reads | **MongoDB MCP Server** | custom REST per agent | hand-rolling + securing an agent data API |

A split stack (Postgres + Pinecone + Elasticsearch) is perfectly viable — but it means three services, three SDKs, and sync glue, and you still have to *build* the agent access layer yourself. For a solo-built agentic app, that surface area is the enemy. At ~10K photos, **Atlas Flex** runs roughly **$5–10/month** vs **$75+/month** for the split stack — and because reads go through the MCP Server, every agent query is a traced, governed call instead of a bespoke endpoint.

### HITL + training signal

Irreversible actions flow through `pending_approvals` with frozen proposals. User score overrides feed `load_prompt_with_user_overrides` so future Coach invocations respect your calibration.

**Clients:** React + Vite on Firebase Hosting; native SwiftUI iOS (AVFoundation, live coach, horizon overlay, critique radar). XMP sidecar export into Lightroom.

---

## Challenges I ran into

**The wallpaper problem.** An early build looked multi-agent but was not — Coach, Planner, and Reflection were Python services in `FunctionTool` wrappers. Fix: nine real `LlmAgent` instances, verified by `dump-agent-graph.py` and phase-gate scripts.

**Cross-AI verification.** Adversarial code review caught MCP treated as optional and persona routing done only in prompts.

**MCP as production read path.** Partner credibility required `mongodb.mcp.find` in Cloud Logging, not a local demo. OpenTelemetry spans (`mongodb.mcp.*`) are part of the submission story.

**Live coach on device.** Encoding every video frame blocked the camera queue. Fix: interval snapshots, rate-limited Flash calls, composition-lock checkpoint.

**iOS under deadline.** Signing and screen-recording friction cost calendar days; the field demo uses pre-recorded takes with voiceover.

---

## Design

**Glass Box, not black box.** Five dimensions with explicit reasoning — users see *why* lighting scored 6/10.

**HITL as visible UI.** Approve / Reject cards for organize, print, and assignments. Nothing auto-applies.

**Mobile-first field coaching.** Horizon guide, ready-to-capture lock, optional TTS, post-capture radar chart.

**Photography aesthetic.** Darkroom palette, amber accents, serif critique type.

**Complement, not replace.** XMP sidecar into Lightroom; Iris fits mentor-and-evolve while Aftershoot fits cull-and-deliver.

---

## Accomplishments I'm proud of

- Nine verifiable ADK agents with persona filtering in code
- MongoDB MCP load-bearing on Cloud Run — judge-reproducible proof in-repo
- End-to-end hobbyist loop: assignment → iPhone field coach → Glass Box → reflection → web library
- HITL with a training-signal loop, not audit-only logs
- Native iPhone field path on the same Cloud Run API as web

---

## What I learned

- Multi-agent claims must survive `grep` and executable phase gates
- Partner integration must match the pitch — MCP in the **production** read path
- Personas are architectural (different sub-agents), not tone presets
- Backend trace evidence helps judges more than another UI screenshot

---

## Market & commercialization

Photography education is a durable, paid market — millions of hobbyists buying courses and critique, plus working pros and institutions. Iris monetizes across the same personas it already serves:

- **Hobbyist** — consumer subscription: unlimited critique, practice plans, and progress memory.
- **Working pro** — tools tier: print-listing drafts, client-ready exports, portfolio analytics.
- **Institutions (B2B)** — photography schools, university art programs, and workshops license Iris as a coaching layer. Every student gets persistent, grounded feedback *between* sessions; instructors get progress dashboards.

**Why it compounds for MongoDB:** Iris's growth is measured in stored artifacts. Every active photographer adds documents, embeddings, and search load — usage that scales Atlas consumption directly. Tenant isolation is already per-user at the document level, so onboarding an institution is *provisioning, not re-architecting*. And Iris doubles as a reference implementation for **agentic memory on Atlas** — a pattern MongoDB can point other AI builders toward.

## Beyond photography — a reusable agentic-memory pattern

The defensible part isn't the photography; it's the architecture: persona-filtered agents over a grounded knowledge base, with persistent multimodal memory and human-in-the-loop writes. Swap the principles corpus and the scoring rubric, and the same agent mesh coaches a different skill:

- **Creative:** music practice, culinary plating, design portfolios, creative writing.
- **Professional:** medical-imaging training, sports form analysis, manufacturing QA review.

Each new domain reuses the orchestration, the HITL gates, and the **MongoDB memory layer unchanged** — only the grounding documents and rubric change. That is what makes it plug-and-play, and what makes the Atlas-backed memory the durable core rather than a swappable detail.

## What's next

- Vision-impairment iOS onboarding and VoiceOver polish
- ARKit on-device subject tracking
- Agent Engine production cutover (scaffold in-repo)
- Instructor persona and B2B licensing for schools and workshops

---

## Built With

agent, atlas-search, atlas-vector-search, avfoundation, cloud-run, discovery-engine, fastapi, firebase, firebase-hosting, gemini, google-adk, google-cloud, mcp, model-context-protocol, mongodb, mongodb-atlas, opentelemetry, python, react, swift, swiftui, typescript, vertex-ai, vite

---

## Try it out

**Web app:** https://iris-photo-mentor.web.app

**GitHub:** https://github.com/prasadt1/iris-photography-mentor

**Proof package:** https://github.com/prasadt1/iris-photography-mentor/blob/main/docs/compliance-proof/PROOF-PACKAGE.md

**Architecture map:** https://github.com/prasadt1/iris-photography-mentor/blob/main/docs/hackathon-compliance.md

**API health:** https://practice-companion-api-l6kusl5xcq-uc.a.run.app/health

**Demo video:** *(paste YouTube/Vimeo URL — under 3:00)*

**Partner track:** MongoDB

**Judge flow (no install):** open web app → browse demo library → Practice → Organize (approve one card) → My Work search → curl `/health` → open proof package.

**ADK Playground:** `make playground` on localhost:8080 — same orchestrator as production; not a public judge URL.
