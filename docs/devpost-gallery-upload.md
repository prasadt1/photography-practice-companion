# Devpost Image Gallery — upload plan

**Companion to:** [`devpost-article-copy-paste.md`](devpost-article-copy-paste.md) (article has **4 inline images only**; everything else goes here.)

**Base URL after push to `main`:**  
`https://raw.githubusercontent.com/prasadt1/iris-photography-mentor/main/docs/devpost-public/`

**Cover / thumbnail:** `standalone-02-glass-box-studio.png` (crop to square if Devpost asks)

---

## Upload order (recommended)

### Tier 1 — UI flows (7) · judges skim these first

| Order | File | Gallery title | Caption |
|-------|------|---------------|---------|
| 1 | `standalone-02-glass-box-studio.png` | Glass Box — five-axis scores | Multimodal Coach critique with spatial overlay and inspectable reasoning. |
| 2 | `standalone-01-home-memory.png` | Home — your library remembered | Hero frame, At a glance scores, and contact sheet from portfolio memory. |
| 3 | `standalone-03-practice.png` | Practice — HITL assignments | Planner proposes a brief; you accept or decline before it becomes active. |
| 4 | `standalone-04-mentor-chat.png` | Mentor — portfolio-aware chat | ADK orchestrator reply grounded in MongoDB memory via MCP reads. |
| 5 | `standalone-05-organize-hitl.png` | Organize — human approval | Triage proposes tags and dedupes; nothing writes until you approve. |
| 6 | `standalone-06-my-work-library.png` | My Work — natural-language search | Gemini expands short queries; Atlas Search ranks your critique text. |
| 7 | `standalone-07-working-pro.png` | Print Sales — HITL listings | Print Sales Strategist drafts marketplace copy; publish waits for your yes. |

### Tier 2 — Architecture & journeys (5)

| Order | File | Gallery title | Caption |
|-------|------|---------------|---------|
| 8 | `diagram-architecture.png` | System architecture | Web + iOS → Cloud Run → nine ADK agents → Gemini + MongoDB Atlas + GCS. |
| 9 | `diagram-data-flow.png` | Critique pipeline | Upload → Coach (Gemini) → Agent Builder grounding → portfolio write + embeddings. |
| 10 | `diagram-agent-orchestration.png` | Nine ADK agents | Persona-filtered orchestrator delegates via AgentTool. |
| 11 | `diagram-user-journey-hobbyist.png` | Hobbyist journey | Assignment → field coach → critique → reflection → library memory loop. |
| 12 | `diagram-user-journey-pro.png` | Working pro journey | Memory, Organize HITL, and Print Sales on the same Atlas corpus. |

### Tier 3 — Backend compliance proof (5) · “not a mockup”

| Order | File | Gallery title | Caption |
|-------|------|---------------|---------|
| 13 | `proof-01-mcp-read.png` | MongoDB MCP — live logs | Cloud Logging: `mcp_read_ok tool=find` on production portfolio reads. |
| 14 | `proof-02-orchestrator.png` | ADK orchestrator — live reply | `POST /api/v1/agent/chat` on Cloud Run (same graph as local playground). |
| 15 | `proof-03-agent-builder.png` | Agent Builder grounding | Discovery Engine Data Store + Coach Glass Box principle citations. |
| 16 | `proof-04-stack-health.png` | Live stack flags | `/health` — Gemini models, MCP URL, Data Store configured. |
| 17 | `proof-05-agent-graph.png` | Nine ADK agents (live import) | Orchestrator + 8 sub-agents enumerated from the constructed ADK graph; persona-filtered delegation. |

### Tier 4 — Annotated UI + tech splits (optional if slots remain)

One frame = screenshot + verified stack. Prefer **gallery only** (article stays lean).

| Order | File | Gallery title | Caption |
|-------|------|---------------|---------|
| 18 | `annotated-05-organize.png` | Organize — UI + HITL stack | Triage agent → `pending_approvals` — no autonomous writes. |
| 19 | `annotated-06-my-work.png` | My Work — UI + Atlas stack | NL search + vector similar photos on one MongoDB corpus. |
| 20 | `annotated-04-mentor.png` | Mentor — UI + orchestration stack | Orchestrator → Mentor; MCP read path to Atlas. |
| 21 | `annotated-02-glass-box.png` | Glass Box — UI + Coach stack | Gemini 3.1 Pro + Agent Builder + PyMongo write. |

### Tier 5 — Optional extras

| File | When to use |
|------|-------------|
| `collage-02-glass-box-studio.png` | Full Glass Box step-by-step if you have gallery slots |
| `collage-06-my-work-library.png` | Gallery + search + similar in one montage |
| `hero-02-glass-box-studio.png` | Social / cover alternative (lower fidelity than standalone) |
| `iris-landing-hero.png` | Marketing landing only — not required for hackathon gallery |

---

## What stays **out** of the gallery

- Duplicate of every annotated **and** standalone for the same screen (pick one tier unless you have 20+ slots)
- `web-studio-overview.png` (superseded by `standalone-02`)
- Local-only playground screenshots (no public URL)

---

## Article vs gallery (one line)

| Article inline (4) | Gallery (17–21) |
|------------------|-----------------|
| 1 UI wow + 2 diagrams + 1 backend proof | All UI standalones, remaining diagrams, all proof panels, annotated splits |

---

## Regenerate assets

```bash
python3 scripts/build-devpost-collages.py --standalone-only
bash scripts/export-devpost-diagrams.sh
python3 scripts/build-annotated-screens.py
(cd app && uv run python ../scripts/dump-agent-graph.py)   # proof-05 agent graph
./scripts/verify-hackathon-stack.sh && python3 scripts/build-compliance-proof-images.py
```

Evidence JSON: [`compliance-proof/evidence/`](../compliance-proof/evidence/)
