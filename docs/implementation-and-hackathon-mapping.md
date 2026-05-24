# Practice Companion — implementation & hackathon mapping

**Track:** [Google Cloud Rapid Agent Hackathon](https://googlecloudrapidagents2026.devpost.com/) — **MongoDB partner track**  
**Live demo:** https://practice-companion-hackathon.web.app  
**API:** https://practice-companion-api-l6kusl5xcq-uc.a.run.app (`/health` → `{"status":"ok","phase":"3"}`)

*Last updated: May 2026 — reflects hosted deploy (Firebase + Cloud Run).*

---

## 1. Product — what works today (hosted + local)

| Area | Implemented | Where judges see it |
|------|-------------|---------------------|
| **Studio** | Upload → multimodal critique (5-axis scores, Glass Box observations, `sceneDescription`, `colourNotes`, spatial hints) | Studio tab on web.app |
| **Grounding** | Photography principles injected into Coach prompt (Agent Builder search + local `principles/*.md` fallback) | Citations in critique UI |
| **Memory** | Portfolio grid, aesthetic snapshot (tags, avg scores, consistency), expandable Glass Box bullets | Memory tab |
| **Practice** | HITL assignments: propose → accept/decline → active brief; hobbyist vs working-pro tone | Practice tab |
| **Assignment loop** | Studio banner when active; uploads carry `assignment_id`; portfolio links assignment | Studio + Memory |
| **Reflection** | Mark complete → Gemini reflection + ISAR-style `skill_delta` on target skill | Practice tab |
| **Field** | Camera/gallery capture → same Coach API with `assignment_id`; Shoot-now dialog after accept | Field tab (HTTPS on Firebase) |
| **XMP** | Client-side XMP sidecar export from Studio results (ported from prior gemma4 work) | Studio, after analysis |
| **Orchestrator** | ADK agent with 8 FunctionTools + optional MongoDB MCP | **Local only:** `make playground` (:8080) |

**Demo user:** `DEMO_USER_ID=6577a1f2b3c4d5e6f7a8b9c0` (seed via `make seed-demo`; Unsplash thumbnails + your GCS uploads).

---

## 2. Agent architecture (ADK + sub-agents)

```mermaid
flowchart TB
  subgraph hosted["Hosted (judges)"]
    UI[React / Firebase Hosting]
    API[FastAPI Coach API / Cloud Run]
  end

  subgraph vertex["Vertex AI"]
    G31[Gemini 3.1 Pro - global]
    EMB[multimodalembedding@001 - us-central1]
    DS[Discovery Engine / Agent Builder Data Store]
  end

  subgraph agents_local["Local ADK playground :8080"]
    ORCH[Orchestrator ADK agent]
    FT[8 FunctionTools]
    MCP[MongoDB MCP toolset optional]
  end

  subgraph subs["Python services invoked by API or tools"]
    COACH[Coach pipeline]
    PLAN[Planner]
    REFL[Reflection]
  end

  subgraph atlas["MongoDB Atlas"]
    PE[portfolio_entries]
    PA[practice_assignments]
    AP[aesthetic_profile]
  end

  UI --> API
  API --> COACH
  API --> PLAN
  API --> REFL
  COACH --> G31
  COACH --> DS
  COACH --> EMB
  COACH --> PE
  ORCH --> FT
  FT --> COACH
  FT --> PLAN
  ORCH -.-> MCP
  MCP -.-> atlas
  COACH --> GCS[GCS portfolio bucket]
  PLAN --> G31
  REFL --> G31
  PE --> atlas
  PA --> atlas
  AP --> atlas
```

### Orchestrator (ADK) — `app/orchestrator/`

| Tool | Role |
|------|------|
| `analyze_uploaded_photo` | Runs Coach pipeline |
| `search_photography_principles` | Agent Builder + local principles |
| `get_recent_portfolio` | MongoDB portfolio |
| `get_active_practice_assignment` | Active HITL assignment |
| `list_practice_assignments` | Proposed / active / completed |
| `get_aesthetic_profile_summary` | Tags + score aggregates |
| `search_glass_box_feedback` | Atlas Search index or regex fallback |
| `suggest_practice_assignment` | Planner → proposed assignment |
| **MongoDB MCP** (`McpToolset`) | Optional; reads Atlas via MCP when `mcp-config.json` + `npx` available |

Prompt: `app/prompts/orchestrator.txt` — routes memory vs principles vs practice.

### Coach — `app/coach/service.py`

Pipeline: **scene hint → ground principles → Gemini JSON (structured schema) → GCS upload → multimodal embedding → MongoDB `portfolio_entries`**.

- Model: `gemini-3.1-pro-preview` on Vertex **`global`** (ADR-010).
- Grounding: `tools/grounding.py` → Discovery Engine `DATA_STORE_ID`, else `principles/*.md`.

### Planner — `app/planner/service.py`

Proposes assignments from portfolio + mode (`hobbyist` | `working_pro`); stores `practice_assignments` (proposed → active → completed).

### Reflection — `app/reflection/service.py`

On **Mark complete**: compares baseline vs completion shoots, Gemini summary, `skill_delta` for ISAR-style narrative.

**Production path:** UI → **Cloud Run FastAPI** → Coach / Planner / Reflection (not Agent Engine session API).  
**Agent story for judges:** ADK orchestrator + tools in playground; same logic/code paths wired through FunctionTools.

---

## 3. GCP & infrastructure (deployed vs local)

### Deployed (production)

| Service | Purpose | Project / region |
|---------|---------|------------------|
| **Firebase Hosting** | Static React (`frontend/dist`) | `practice-companion-hackathon.web.app` |
| **Cloud Run** `practice-companion-api` | FastAPI: analyze, portfolio, assignments, reflection | `us-central1` |
| **Cloud Build** | `gcloud run deploy --source` (no local Docker) | Artifact Registry `cloud-run-source-deploy` |
| **GCS** `practice-companion-portfolio` | Originals `gs://…/originals/{user}/{shoot}/…` | Signed URLs (IAM signBlob on compute SA) |
| **Vertex AI** | Gemini 3.1 Pro (global), embeddings (regional) | `practice-companion-hackathon` |
| **Discovery Engine** | Agent Builder Data Store search | `DATA_STORE_ID`, `DATA_STORE_LOCATION=global` |

**Runtime identity (Cloud Run):** default `975418990849-compute@developer.gserviceaccount.com` (with `run.builder`, GCS signing, etc.).  
**Local dev:** `gcp-service-account.json` → `id-practice-companion-runtime@…` for Vertex/GCS.

**Deploy scripts:** `scripts/deploy-coach-api.sh`, `scripts/cloud-run-env-from-dotenv.py`, `scripts/grant-cloud-build-deploy-iam.sh`, `scripts/grant-cloud-run-gcs-signing.sh`, `make deploy-hosting`.  
**Guide:** [`deploy.md`](deploy.md).

### Local only (documented, not required for hosted demo)

| Component | Command | Port |
|-----------|---------|------|
| Coach API | `make api-dev` | 8081 |
| Frontend | `make frontend-dev` | 5173 |
| ADK Playground | `make playground` | 8080 |
| MongoDB MCP subprocess | via orchestrator when configured | — |

### Not deployed (spec / plan, post-demo OK)

- **Vertex AI Agent Engine** hosted orchestrator (`make deploy` from ADK scaffold).
- **Cloud Run** MongoDB MCP Server (separate service in `architecture.md`).
- **Change-stream listener** for `aesthetic_profile` (profile is **computed on read** in API today).
- Staging environment.

---

## 4. Agent Builder — how it’s used (not name-only)

| Requirement (rules §7.A) | Implementation |
|--------------------------|----------------|
| “Powered by … **Google Cloud Agent Builder**” | **Discovery Engine** search against a Data Store of curated `principles/*.md` (`app/tools/grounding.py`, `app/orchestrator/principles_tool.py`). |
| Load-bearing use | Coach system prompt includes retrieved excerpts; orchestrator can call `search_photography_principles`. |
| Fallback | Local markdown if `DATA_STORE_ID` missing or search fails — demo still works. |
| Ecosystem | ADK + Agent Starter Pack scaffold under `app/`; compatible with Agent Engine deploy later. |

**Env:** `DATA_STORE_ID`, `DATA_STORE_LOCATION`, `GOOGLE_CLOUD_PROJECT`.

---

## 5. MongoDB Atlas — partner “superpower”

| Capability | Status | How |
|------------|--------|-----|
| **Operational memory** | ✅ | `portfolio_entries`, `practice_assignments`, `aesthetic_profile` |
| **PyMongo writes** | ✅ | Coach, Planner, Reflection, assignments |
| **Orchestrator reads** | ✅ | FunctionTools in `memory_tools.py`; optional **MongoDB MCP** in playground |
| **Multimodal embeddings** | ✅ | Stored on `portfolio_entries.embedding` (Vertex `multimodalembedding@001`) |
| **Atlas Search** | ✅ Backend | `search_glass_box_feedback` uses index `glass_box_search` or regex fallback |
| **Vector search UI** | ❌ | Embeddings stored; no similarity UI in Memory yet |
| **Change streams → profile** | ❌ | Lightweight `compute_aesthetic_summary()` on API read; listener not deployed |
| **Region** | `eu-west3` (Atlas Flex) vs Vertex `us-central1` | Documented tradeoff (ADR); acceptable for demo |

**Hackathon narrative:** Atlas holds **documents + vectors + searchable critique text + assignment state** in one place; orchestrator is designed to **read memory through MCP** while sub-agents write via PyMongo (per [`decisions.md`](decisions.md)).

---

## 6. Frontend

- **Stack:** React, Vite, TypeScript, Tailwind; themes from prior gemini3/gemma4.
- **Tabs:** Studio, Practice, Memory, Field.
- **Production:** `VITE_API_BASE_URL` baked at build → Cloud Run (not localhost proxy).
- **Modes:** Hobbyist / Working pro (planner tone).

---

## 7. Mapping to official hackathon requirements

### Rules §7.A — project must…

| Rule | Status | Evidence |
|------|--------|----------|
| Built with **Gemini** (3 Pro for reasoning) | ✅ | `GEMINI_MODEL=gemini-3.1-pro-preview`; Coach, Planner, Reflection |
| Built with **Google Cloud Agent Builder** | ✅ | Discovery Engine Data Store grounding |
| **MongoDB** partner integration | ✅ | Atlas + PyMongo; MCP on orchestrator (local); track-appropriate reads/writes |
| Runs on **web** (± mobile) | ✅ | Firebase HTTPS PWA; Field uses `getUserMedia` |
| New work in contest period | ✅ (author attests) | New repo; README attributes gemini3/gemma4 |

### Rules §7.B — submission deliverables

| Deliverable | Status |
|-------------|--------|
| **Hosted project URL** | ✅ https://practice-companion-hackathon.web.app |
| **Public repo + Apache-2.0** | ⚠️ Confirm repo public + LICENSE in GitHub About |
| **~3 min demo video** | ⏳ To record ([`demo-script.md`](demo-script.md)) |
| **Devpost text** | ⏳ Draft in [`devpost-draft.md`](devpost-draft.md) — update URLs + honest “what worked” |
| **MongoDB track selected** | ⏳ On submit |

**Honest gap vs spec wording:** [`spec.md`](spec.md) mentions **Agent Engine endpoint** as backend URL; **judges currently hit Cloud Run** for all UI flows. Playground proves ADK orchestrator. Devpost can say: *“Production Coach API on Cloud Run; ADK orchestrator demonstrable in playground; Agent Engine deploy optional.”*

### Rules §7.B — restrictions

| Restriction | Compliance |
|-------------|------------|
| No competing cloud hosts (Vercel/AWS/Azure) | ✅ Firebase + Cloud Run + GCP only |
| No competing DB/search (Pinecone, etc.) | ✅ MongoDB Atlas only |
| No third-party AI in **product** | ✅ Gemini + Vertex embeddings only |

### Judging criteria (§8 — equal weight)

| Criterion | Story |
|-----------|--------|
| **Technological implementation** | Multi-agent ADK, structured Gemini JSON, GCS+signed URLs, Atlas persistence, Agent Builder grounding, deployed full stack |
| **Design** | Glass Box transparency, dual mode, Studio/Memory/Practice/Field IA, dark mentor UI |
| **Potential impact** | Persistent mentor vs one-shot graders; practice loop + ISAR; hobbyist + pro |
| **Quality of idea** | Aesthetic identity over time; MongoDB as memory substrate |

---

## 8. Phase checklist (spec vs reality)

| Phase | Spec intent | Done |
|-------|-------------|------|
| **0–1** Setup, Coach, Studio, GCS, embeddings | Core critique + storage | ✅ Hosted |
| **2** Orchestrator, tools, MCP, principles | Agent layer | ✅ Local playground; principles in Coach |
| **3** Memory, Practice, Reflection, seed | Persistent product | ✅ Hosted |
| **4** Field, XMP, polish, Devpost | Demo completeness | **Partial** — Field + XMP yes; voice/LENS, change-stream listener, Agent Engine deploy no |

See also: [`phase2-started.md`](phase2-started.md), [`phase3-started.md`](phase3-started.md), [`phase4-started.md`](phase4-started.md).

---

## 9. Suggested Devpost / video talking points

1. **Problem:** Single-shot AI graders don’t remember you.
2. **Solution:** Practice Companion = Coach + Planner + Reflection + Memory on Atlas.
3. **Google:** Gemini 3.1 Pro multimodal, Agent Builder principles, ADK orchestrator (playground clip optional).
4. **MongoDB:** Portfolio, assignments, embeddings, Atlas Search over Glass Box; MCP for agent reads.
5. **Live:** Upload on web.app → Memory updates with GCS thumbnail.
6. **Learnings:** Firebase+GCP linking, Cloud Build IAM, GCS signed URLs on Cloud Run, cross-region Atlas.

---

## 10. Immediate next steps (submission)

1. Record video using [`demo-script.md`](demo-script.md) (trim change-stream segment if listener isn’t live — show Memory snapshot instead).
2. Finalize [`devpost-draft.md`](devpost-draft.md) with live URLs and MCP/Cloud Run honesty.
3. Confirm `DEMO_USER_ID` on Cloud Run matches seed for a rich Memory grid.
4. Optional: 30s playground clip for orchestrator + MongoDB MCP.

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [`spec.md`](spec.md) | Canonical requirements & rules appendix |
| [`architecture.md`](architecture.md) | System design |
| [`deploy.md`](deploy.md) | Firebase + Cloud Run deploy |
| [`devpost-draft.md`](devpost-draft.md) | Submission copy |
| [`demo-script.md`](demo-script.md) | 3-minute video script |
| [`doc-map.md`](doc-map.md) | Full doc index |
