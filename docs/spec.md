# Practice Companion — Master Spec & Claude Code Build Prompt (v3)

**Project:** Photography Practice Companion
**Repository:** `photography-practice-companion` (created fresh during contest period — see [§1](#1-repository-setup))
**Hackathon:** Google Cloud Rapid Agent Hackathon — MongoDB partner track
**Deadline:** June 11, 2026, 2:00 PM PT
**Owner:** Prasad Tilloo
**Stack:** Gemini 3 Pro + ADK (via Agent Starter Pack) + Vertex AI Agent Engine + Agent Builder Data Store + MongoDB Atlas with MongoDB MCP Server + Cloud Run (auxiliary services) + Firebase Hosting (frontend) + React/TypeScript

> **Changes from v2:** Agent Builder Data Store added for photography principles grounding (satisfies the rules' literal "Agent Builder" requirement + adds real grounding value). Frontend hosting moved from Vercel to Firebase Hosting (Vercel competes with Google Cloud hosting services per rules §7.B). MongoDB change streams added for `aesthetic_profile` background derivation. Coach output extended with richer spatial metadata (subject relationships, lighting maps). Atlas Search added for full-text retrieval over Glass Box content. Rules compliance appendix added. Devpost submission text plan added.

---

## 0. How to use this document

This is the master spec and the working prompt for Claude Code. Sections are cross-linked. The build is structured into five phases ([§4](#phase-0--setup) through [§8](#phase-4--field-mode--xmp--polish)), each with a verification gate at the end. Resume by checking which gate has been passed and starting at the next phase.

**Two roles** in execution:
- **Prasad (manual steps)** — sign-up flows, billing, UI confirmations, human-in-the-loop decisions. Marked with **[MANUAL]**.
- **Claude Code (automated)** — file creation, code generation, CLI commands, schema setup. Marked with **[AUTO]**.

**Before starting Phase 0**, Prasad should install the official MongoDB Claude Plugin in Claude Code from the Anthropic Plugin Marketplace — it bundles the MongoDB MCP Server and pre-built agent skills.

**Rules compliance is non-negotiable.** Every change to the spec or to the build must respect the hackathon official rules. See [Appendix C](#appendix-c--rules-compliance-checklist) before final submission.

**Supporting docs:** [`doc-map.md`](doc-map.md) · [`decisions.md`](decisions.md) · [`mongodb-setup.md`](mongodb-setup.md) · [`claude-code-handoff.md`](claude-code-handoff.md) · [`CONTEXT.md`](../CONTEXT.md)

---

## 1. Repository setup

### 1.1 Create the fresh repo

**[MANUAL]** Prasad creates a new public GitHub repository named `photography-practice-companion`. License: Apache-2.0. Initialize empty.

### 1.2 Source repos to mine

**Source A — `photography-coach-ai-gemini3`** (https://github.com/prasadt1/photography-coach-ai-gemini3)
The original DeepMind Vibe Code competition entry on Gemini 3 Pro. Primary source for frontend components and photography analysis system prompts.

**Source B — `photography-coach-gemma4`** (https://github.com/prasadt1/photography-coach-gemma4)
The Gemma 4 / L.E.N.S. evolution. Source for XMP, voice, LiveCameraCapture, iOS PWA hardening, HTTPS-on-LAN setup. Files in this repo were created in May 2026 (within contest period).

### 1.3 What to mine from where

**From Source A (gemini3):**
- Photography analysis system prompts → migrate into ADK Coach agent instructions and the Agent Builder Data Store (see [§0.7](#07-agent-builder-data-store-for-photography-principles)).
- `components/AnalysisResults.tsx` → adapt for Practice Companion UI.
- `components/SpatialOverlay.tsx` → port as-is.
- `components/PhotoUploader.tsx` → port as-is.
- `src/types/index.ts` → port and extend.
- 5-axis scoring JSON schema definitions.

**From Source B (gemma4):**
- `services/xmpService.ts` → port as-is. Lightroom XMP sidecar export.
- `services/voiceCoach.ts` → port as-is. Field Mode TTS.
- `services/voiceService.ts` → port as-is.
- `services/validationService.ts` → port as-is. Zod + AJV validation.
- `components/LiveCameraCapture.tsx` → port as-is. Field Mode foundation.
- `scripts/setup-dev-https.sh` → port as-is.
- `public/manifest.json` + service worker → port, rebrand for Practice Companion.
- `vite.config.ts` HTTPS/proxy patterns → adapt.

**Do NOT port:**
- Anything Ollama-related.
- Electron Vault Mode files.
- L.E.N.S. artisan-accessibility messaging — different product, different framing.
- Demo Mode hardcoded sample responses.
- The single-file `geminiService.ts` itself — logic gets distributed across ADK agents.

### 1.4 What's net new

- ADK agent definitions (orchestrator + 3 sub-agents) — [§10](#10-agent-definitions).
- Agent Builder Data Store with photography principles knowledge — [§0.7](#07-agent-builder-data-store-for-photography-principles).
- MongoDB Atlas memory layer with three-tier schema, vector index, Atlas Search index — [§7](#7-mongodb-schema).
- MongoDB MCP Server registered as the orchestrator's primary data access tool.
- MongoDB change stream listener for `aesthetic_profile` derivation — [§11.4](#114-change-stream-listener-for-aesthetic-profile).
- New Practice tab, Memory tab in the UI.
- Working-pro mode routing logic.
- Field Mode flow using ported voice + camera infrastructure.

---

## 2. Hackathon context & framework

### 2.1 Stack confirmation

- **Gemini 3 Pro** — reasoning (mandatory per rules §7.A).
- **Google Cloud Agent Builder** — used for Data Store (photography principles grounding); satisfies the rules' literal Agent Builder requirement. [§0.7](#07-agent-builder-data-store-for-photography-principles).
- **ADK (Agent Development Kit)** — primary agent framework, via Agent Starter Pack scaffold (officially listed in hackathon resources). Compatible with Agent Builder ecosystem.
- **Vertex AI Agent Engine** — primary deployment target for the agents.
- **MongoDB Atlas + MongoDB MCP Server** — partner integration; orchestrator's primary data access tool.
- **Cloud Run** — auxiliary services (MongoDB MCP Server hosting, change stream listener).
- **Firebase Hosting** — frontend deploy target (replaces Vercel for rules compliance).

### 2.2 Why ADK + Agent Builder Data Store, not just ADK

The hackathon rules text (§7.A) says "powered by Gemini and Google Cloud Agent Builder." The Resources page lists Agent Starter Pack (ADK-based) as a supported path. We satisfy both by using ADK as the agent runtime *and* using Agent Builder Data Store for photography principles grounding — Agent Builder is a real, load-bearing part of the architecture, not name-dropped.

### 2.3 What's explicitly NOT used (per rules §7.B)

- No services that directly compete with Google Cloud (cloud platform capabilities): no Vercel, no AWS, no Azure.
- No services that directly compete with MongoDB (our chosen partner track): no Pinecone, no Weaviate, no Postgres+pgvector.
- No third-party AI tools: only Google Cloud AI (Gemini, multimodal embeddings, Vertex AI) and MongoDB-owned AI features (Voyage AI is technically allowed since acquired by MongoDB; not used in this build).

### 2.4 Submission deliverables (Devpost, per rules §7.B)

1. URL to hosted Project — Firebase Hosting URL (frontend) + Agent Engine endpoint (backend).
2. Text description with summary, features, technologies, data sources, findings, learnings — see [§18](#18-devpost-text-description).
3. URL to public open-source code repo with Apache-2.0 license file visible in the About section.
4. ~3-minute demo video uploaded to YouTube or Vimeo, English (or with English subtitles) — see [§16](#16-demo-script).
5. Track selection: MongoDB.
6. Completed Devpost submission form.

---

## 3. Product overview

### 3.1 One-paragraph description

Practice Companion is an AI photography mentor that combines multimodal critique with adaptive practice planning, grounded in a photographer's persistent aesthetic identity over time. Unlike single-shot critique tools that grade one image in isolation, Practice Companion remembers what each photographer is working on, what they've improved, and what to push next. Dual audience: hobbyist photographers (skill growth) and working professionals (aesthetic consistency).

### 3.2 Dual audience

- **Hobbyist mode** — pedagogical focus. Practice assignments calibrated to current skill level. Glass Box critique. Intentional Skill Application Rate tracking ([§13](#13-demo-arc--kpi)).
- **Working-pro mode** — aesthetic consistency focus. Cross-shoot drift analysis. Business-aware micro-assignments.

### 3.3 Two operational modes

- **Studio Mode** — post-shoot deep work. Upload, critique, assign, export to Lightroom. Primary loop and demo focus.
- **Field Mode** — live coaching during a shoot via PWA + voice. Limited demo segment; full Field Mode is post-hackathon.

### 3.4 Market positioning

Saturated for culling/editing (Aftershoot, Imagen, Evoto), CRM (Sprout, HoneyBook), publishing (Pygma). Gap: skill development and workflow intelligence layered on top of existing tools. Practice Companion sits in that gap — doesn't replace anything, sits underneath as a memory of who you are as a photographer.

### 3.5 Design and impact framing (for judging criteria balance)

The four hackathon judging criteria are equally weighted (per rules §8): Technological Implementation, Design, Potential Impact, Quality of Idea. Earlier versions of this spec leaned heavily on Technological Implementation. Each phase now has design and impact considerations:

- **Design:** Glass Box reasoning makes critique transparent (not magical). Side-by-side baseline-vs-current visualization. Voice-first Field Mode for hands-on photography. PWA install for iOS without app-store friction. Per-tab information hierarchy: Studio → Practice → Memory → Field.
- **Potential Impact:** Photography market is $66.8B by 2035. AOP 2026 survey shows £34,900 average loss per working photographer (142% YoY increase) — pedagogy and aesthetic consistency tools have real economic value. Pattern generalizes to other creator categories (illustrators, video creators, musicians, writers).
- **Quality of Idea:** "AI mentor with persistent aesthetic memory" is a new product category, not a feature on an existing one. Three-tier MongoDB memory + multimodal embeddings + change-stream-driven derived profiles is an architectural pattern that fits the product, not a generic stack applied to a generic problem.

---

## Phase 0 — Setup

### 0.1 MongoDB Atlas + MongoDB MCP Server

**[MANUAL]** Atlas account and cluster:
1. Sign up at https://www.mongodb.com/cloud/atlas/register.
2. Project named `photography-practice-companion`.
3. **Flex tier** cluster (not Free/M0 — Vector Search, Atlas Search, and change streams require Flex+; Flex is capped at $30/month, typically $8-15 for hackathon-scale use). Region: GCP Europe-West3 (Frankfurt). Do NOT preload sample dataset.
4. Database user with read/write access.
5. Network access: `0.0.0.0/0` for dev.
6. Save the connection string.
7. **Atlas service account** for MCP Server auth. In Atlas → Organization Settings → Service Accounts. Save client ID (`mdb_sa_id_*`) and client secret (`mdb_sa_sk_*`).

**[MANUAL]** Install the MongoDB Claude Plugin in Claude Code from the Anthropic Plugin Marketplace. Accelerates every MongoDB-related dev step.

**[AUTO]** For runtime, MongoDB MCP Server runs as Node.js process. Setup:
```bash
npx mongodb-mcp-server@latest setup
# Configure: Claude Code client, read+write mode, connection string, Atlas service account credentials
```
Generates MCP configuration file, registered with the ADK orchestrator in Phase 2.

### 0.2 Google Cloud project

**[MANUAL]**:
1. Sign in at https://console.cloud.google.com.
2. Request $100 credits at https://forms.gle/xfv9vQzfRfNCCVbG7 by June 4, 2026 (per rules §6).
3. Project named `practice-companion-hackathon`.
4. Enable billing.
5. Enable APIs:
   - Vertex AI API
   - Vertex AI Agent Engine API
   - Discovery Engine API (this is the Agent Builder Data Store API)
   - Cloud Run API
   - Cloud Build API
   - Secret Manager API
   - Firebase Hosting API (added in v3)
6. Service account `practice-companion-runtime` with roles:
   - Vertex AI User
   - Vertex AI Agent Engine User
   - Discovery Engine Editor (for Agent Builder Data Store management)
   - Cloud Run Invoker
   - Secret Manager Secret Accessor
   - Storage Object User
   - Firebase Hosting Admin
7. Generate JSON key, save as `gcp-service-account.json`, add to `.gitignore`.
8. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
9. Install `uv`: https://docs.astral.sh/uv/getting-started/installation/
10. Install Firebase CLI: `npm install -g firebase-tools`

### 0.3 Verify Gemini 3 Pro and Vertex AI access

**[AUTO]**:
```bash
gcloud auth activate-service-account --key-file=gcp-service-account.json
gcloud config set project practice-companion-hackathon
gcloud ai models list --region=us-central1 | grep -E "gemini-3|multimodalembedding"
```

### 0.4 Verify MongoDB connectivity

**[AUTO]**:
```bash
python -c "import pymongo; c = pymongo.MongoClient('$MONGODB_URI'); print(c.server_info())"
python scripts/bootstrap-mongodb.py
```

See [`mongodb-setup.md`](mongodb-setup.md) for cluster host and MCP env mapping.

### 0.5 Environment variables

**[AUTO]** Create `.env.example`:
```
# Google Cloud
GOOGLE_CLOUD_PROJECT=practice-companion-hackathon
GOOGLE_APPLICATION_CREDENTIALS=./gcp-service-account.json
VERTEX_AI_REGION=us-central1
GEMINI_MODEL=gemini-3-pro
EMBEDDING_MODEL=multimodalembedding@001

# MongoDB Atlas
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/practice_companion?retryWrites=true&w=majority
MONGODB_DB_NAME=practice_companion
MONGODB_ATLAS_CLIENT_ID=mdb_sa_id_xxxxxxxxxxxxx
MONGODB_ATLAS_CLIENT_SECRET=mdb_sa_sk_xxxxxxxxxxxxxxxxxxx
MONGODB_MCP_CONFIG_PATH=./mcp-config.json

# Agent Engine / ADK
AGENT_ENGINE_LOCATION=us-central1
ORCHESTRATOR_AGENT_RESOURCE_NAME=  # filled after deployment in Phase 2

# Agent Builder Data Store (v3)
DATA_STORE_LOCATION=global
DATA_STORE_ID=  # filled after Data Store creation in §0.7

# Firebase Hosting (v3)
FIREBASE_PROJECT_ID=practice-companion-hackathon

# Frontend
VITE_API_BASE_URL=http://localhost:8080
```

### 0.6 Initialize Firebase Hosting

**[AUTO]**:
```bash
firebase login
firebase init hosting
# Select existing GCP project: practice-companion-hackathon
# Public directory: frontend/dist
# Configure as single-page app: Yes
# Set up automatic builds and deploys with GitHub: optional
```

### 0.7 Agent Builder Data Store for photography principles

This is the load-bearing Agent Builder touchpoint. The Coach sub-agent grounds its critique in a curated photography principles knowledge base hosted in an Agent Builder Data Store, not in inline prompts.

**[AUTO]** Create the Data Store:
```bash
gcloud alpha discovery-engine data-stores create photography-principles \
  --location=global \
  --industry-vertical=GENERIC \
  --solution-type=SOLUTION_TYPE_SEARCH \
  --content-config=CONTENT_REQUIRED
```

**[AUTO]** Curate photography principles content as Markdown documents:
- `principles/composition.md` — rule of thirds, leading lines, framing, negative space, symmetry, balance, depth.
- `principles/lighting.md` — golden hour, key/fill/rim setups, hard vs soft light, color temperature, exposure.
- `principles/technique.md` — focus, sharpness, depth of field, motion blur, ISO and noise, white balance.
- `principles/creativity.md` — perspective, moment, story, juxtaposition, abstraction, color theory.
- `principles/subject_impact.md` — emotional content, expression, eye contact, posing, environmental context.

These principles are derived from photography knowledge (publicly available), refined during the contest period. Not direct copies from prior projects.

**[AUTO]** Upload documents to the Data Store:
```bash
gcloud alpha discovery-engine documents import \
  --data-store=photography-principles \
  --location=global \
  --source-folder=./principles
```

**[AUTO]** Save the Data Store ID into `.env` as `DATA_STORE_ID`.

### 0.8 Phase 0 verification gate

- [ ] MongoDB Atlas cluster created; PyMongo test connection succeeds.
- [ ] Atlas service account created; client ID and secret in `.env`.
- [ ] MongoDB Claude Plugin installed in Claude Code; MongoDB tools visible.
- [ ] Google Cloud project created; billing enabled; service account key downloaded.
- [ ] All required GCP APIs enabled (including Discovery Engine and Firebase Hosting).
- [ ] `gcloud ai models list` returns Gemini 3 Pro and multimodal embedding model.
- [ ] `uv --version` returns successfully.
- [ ] Firebase CLI installed; `firebase projects:list` shows our project.
- [ ] Agent Builder Data Store `photography-principles` created and contains 5 principles documents.
- [ ] $100 credits applied or in flight.

---

## Phase 1 — Scaffold with Agent Starter Pack

### 1.1 Generate the scaffold

**[AUTO]** From the empty cloned repo:
```bash
cd photography-practice-companion
uvx agent-starter-pack create
# Selections:
#   - Project name: photography-practice-companion
#   - Template: adk_live  (multimodal RAG with audio/video/text)
#   - Region: us-central1
#   - Deployment target: agent_engine
#   - CI/CD: github_actions
```

### 1.2 Verify scaffold

**[AUTO]**:
```bash
uv sync
make playground
```
Playground UI opens; base agent responds to a test prompt.

### 1.3 Add frontend scaffold

**[AUTO]**:
```bash
mkdir frontend && cd frontend
npm create vite@latest . -- --template react-ts
npm install
```

### 1.4 Port frontend files from sources

**[AUTO]** Fetch from raw GitHub URLs, save under `frontend/src/`. Strip Ollama/Electron/Vault Mode references. Replace direct Gemini API calls with calls to a new `services/agentClient.ts` that hits the Agent Engine endpoint.

### 1.5 Final directory structure (post-Phase 1)

```
photography-practice-companion/
├── README.md                       # Comprehensive, written last
├── LICENSE                         # Apache-2.0
├── .gitignore                      # Includes gcp-service-account.json, .env, etc.
├── .env.example                    # From §0.5
├── pyproject.toml                  # From Agent Starter Pack
├── uv.lock
├── Makefile                        # From Agent Starter Pack
├── deployment/                     # Terraform from Agent Starter Pack
├── docs/
│   ├── spec.md                     # This master spec
│   ├── architecture.md
│   ├── demo-script.md              # From §16
│   ├── judge-pitch.md              # From §17
│   └── devpost-text.md             # From §18
├── principles/                     # Photography principles for Data Store
│   ├── composition.md
│   ├── lighting.md
│   ├── technique.md
│   ├── creativity.md
│   └── subject_impact.md
├── app/                            # ADK agent code
│   ├── agent.py                    # Orchestrator
│   ├── sub_agents/
│   │   ├── coach.py
│   │   ├── planner.py
│   │   └── reflection.py
│   ├── tools/
│   │   ├── mongodb_mcp.py
│   │   ├── data_store_grounding.py # NEW: queries Agent Builder Data Store
│   │   ├── atlas_search.py         # NEW: full-text search over portfolio
│   │   ├── photo_analysis.py
│   │   └── embedding.py
│   ├── memory/
│   │   ├── schema.py
│   │   └── repository.py
│   ├── prompts/
│   │   ├── orchestrator.txt
│   │   ├── coach.txt
│   │   ├── planner.txt
│   │   └── reflection.txt
│   └── eval/
├── change_stream_listener/         # NEW: Cloud Run service
│   ├── Dockerfile
│   ├── main.py                     # Subscribes to portfolio_entries change stream
│   └── derive_aesthetic_profile.py # Recomputes aesthetic_profile on new entries
├── frontend/
│   ├── package.json
│   ├── firebase.json               # NEW: Firebase Hosting config
│   ├── .firebaserc                 # NEW
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── components/
│       │   ├── AnalysisResults.tsx     # Ported
│       │   ├── SpatialOverlay.tsx      # Ported
│       │   ├── PhotoUploader.tsx       # Ported
│       │   ├── LiveCameraCapture.tsx   # Ported
│       │   ├── PracticeTab.tsx         # NEW
│       │   ├── MemoryTab.tsx           # NEW
│       │   └── ModeToggle.tsx          # NEW
│       ├── services/
│       │   ├── xmpService.ts           # Ported
│       │   ├── voiceCoach.ts           # Ported
│       │   ├── voiceService.ts         # Ported
│       │   ├── validationService.ts    # Ported
│       │   ├── agentClient.ts          # NEW
│       │   └── memoryClient.ts         # NEW
│       └── types/
│           ├── index.ts
│           ├── practice.ts             # NEW
│           └── memory.ts               # NEW
├── public/
│   ├── manifest.json               # Ported, rebranded
│   └── sw.js                       # Ported
└── scripts/
    ├── setup-dev-https.sh          # Ported
    ├── seed-demo-data.py           # NEW
    └── deploy.sh                   # NEW
```

### 1.6 Phase 1 verification gate

- [ ] Agent Starter Pack scaffold generated successfully.
- [ ] `make playground` boots; base agent responds.
- [ ] All frontend files in §1.3 ported, Ollama/Electron stripped.
- [ ] Frontend `npm run dev` succeeds.
- [ ] MongoDB MCP Server tested via Claude Code (can query empty Atlas cluster).
- [ ] Firebase Hosting config initialized (`firebase.json` and `.firebaserc` present in `frontend/`).
- [ ] Repo pushed to GitHub with `.gitignore`.

---

## Phase 2 — Multi-agent system with MongoDB MCP and Agent Builder Data Store

### 2.1 MongoDB schema and indexes

**[AUTO]** Implement `app/memory/indexes.py` to create collections, vector index on `portfolio_entries.embedding`, and Atlas Search index on `glass_box` content. See [§7](#7-mongodb-schema).

### 2.2 Define orchestrator and sub-agents

**[AUTO]** Build ADK agent code. System instructions in `app/prompts/<name>.txt`.

**Orchestrator (`app/agent.py`):**
- ADK Agent with tools: MongoDB MCP Server (registered as MCPToolset), Agent Builder Data Store grounding tool, Atlas Search tool, the three sub-agents as Agent tools.
- System instruction: routes user requests; uses MongoDB MCP for all user data; uses Data Store grounding before Coach for any principles questions; uses Atlas Search when looking up past critique themes.

**Coach sub-agent (`app/sub_agents/coach.py`):**
- Calls Gemini 3 Pro multimodal.
- Before generating critique: grounds in Agent Builder Data Store via `tools/data_store_grounding.py` to pull relevant photography principles for the scene type.
- Outputs structured JSON per `portfolio_entries` schema, including extended spatial metadata (see [§7.2](#72-collections)).
- Writes to MongoDB via PyMongo.

**Practice Planner sub-agent (`app/sub_agents/planner.py`):**
- Inputs: recent portfolio, active and completed assignments, aesthetic profile (from orchestrator's MCP queries).
- Reasons via Gemini 3 Pro.
- Outputs `assignments` document with `rationale`.

**Reflection sub-agent (`app/sub_agents/reflection.py`):**
- Multi-image Gemini 3 Pro call comparing baseline vs completion shots.
- Computes Intentional Skill Application Rate delta.
- Writes SkillDelta to assignment document.

### 2.3 Register MongoDB MCP Server, Data Store grounding, and Atlas Search as tools

**[AUTO]** In `app/agent.py`:
```python
from google.adk.agents import LlmAgent
from google.adk.tools.mcp_tool import MCPToolset
from google.adk.tools.discovery_engine import DataStoreSearch

mongodb_tools = MCPToolset.from_config(config_path=os.environ["MONGODB_MCP_CONFIG_PATH"])
principles_grounding = DataStoreSearch(
    project=os.environ["GOOGLE_CLOUD_PROJECT"],
    location=os.environ["DATA_STORE_LOCATION"],
    data_store_id=os.environ["DATA_STORE_ID"],
)
atlas_search_tool = AtlasSearchTool(...)  # custom wrapper around MongoDB Atlas Search API

orchestrator = LlmAgent(
    name="practice_companion_orchestrator",
    model="gemini-3-pro",
    instruction=open("app/prompts/orchestrator.txt").read(),
    tools=[
        mongodb_tools,
        principles_grounding,
        atlas_search_tool,
        coach_agent_tool,
        planner_agent_tool,
        reflection_agent_tool,
    ],
)
```

### 2.4 Local testing

**[AUTO]** Run `make playground`. Test:
- Orchestrator can query Data Store for "rule of thirds" and get the grounded principles.
- Upload a test image → Coach grounds in Data Store, analyzes via Gemini, writes to MongoDB with extended spatial annotations.
- Orchestrator can query MongoDB MCP for the newly written entry.
- Atlas Search returns hits for a text query against Glass Box content.

### 2.5 Phase 2 verification gate

- [ ] MongoDB collections, vector index, Atlas Search index all created.
- [ ] All three sub-agents respond to test inputs.
- [ ] MongoDB MCP Server registered as orchestrator tool.
- [ ] Agent Builder Data Store grounding tool registered and returns principles docs.
- [ ] Atlas Search tool registered and returns text search hits.
- [ ] End-to-end: upload image → Coach grounds in Data Store → portfolio entry in MongoDB with extended spatial metadata.

---

## Phase 3 — Memory + end-to-end Studio Mode

### 3.1 Three memory tiers

1. **Portfolio (long-term)** — every critiqued photo with embeddings, scores, spatial metadata, aesthetic tags. Retrieval via Atlas Vector Search and Atlas Search.
2. **Conversational context (cross-session)** — recent threads.
3. **Ephemeral (in-session)** — ADK runtime.

### 3.2 Studio Mode flow

1. **Upload** — frontend file picker or drag-drop.
2. **Coach pass** — orchestrator routes to Coach. Coach grounds in Data Store principles → analyzes with Gemini 3 Pro → writes to portfolio with extended spatial metadata + embedding.
3. **Aesthetic profile updates** — change stream listener detects the new write and recomputes the aesthetic profile asynchronously ([§11.4](#114-change-stream-listener-for-aesthetic-profile)).
4. **Practice tab** — if active assignment exists, orchestrator calls Reflection. SkillDelta displayed.
5. **Plan next** — orchestrator calls Planner. New assignment with `rationale`.
6. **Export** — XMP sidecars via ported `xmpService.ts`. User downloads ZIP, imports into Lightroom.

### 3.3 Practice and Memory tabs

**[AUTO]**:
- `PracticeTab.tsx`: active assignment top, baseline-vs-current viz, completed assignments below.
- `MemoryTab.tsx`: portfolio timeline, aesthetic profile view, vector search for aesthetic queries, Atlas Search bar for text queries ("show me feedback I got about backlit subjects").

### 3.4 Demo seed data

**[AUTO]** `scripts/seed-demo-data.py`:
- ~30 photos across 4 hypothetical shoots.
- Pre-computed aesthetic profile.
- One completed assignment with baseline + post-assignment shots.
- One active assignment in progress.

**Image sourcing per rules §7.B (no third-party content violations):**
- Prasad's own photography (primary).
- Stock photos with explicit redistribution licenses (Unsplash, Pexels — license details documented in `scripts/seed-demo-data.py`).
- No web-scraped images without license verification.

### 3.5 Phase 3 verification gate

- [ ] Full Studio Mode loop end-to-end with seed data.
- [ ] Practice tab and Memory tab render with seed data.
- [ ] Atlas Vector Search returns sensible aesthetic similarity hits.
- [ ] Atlas Search returns hits for text queries on Glass Box content.
- [ ] Change stream listener visibly updates aesthetic profile when a new portfolio entry is written.
- [ ] Cross-session: close browser, reopen → orchestrator knows the active assignment via MCP query.

---

## Phase 4 — Field Mode + XMP + polish

### 4.1 Field Mode segment

iPhone connects via LAN HTTPS. LiveCameraCapture active. Voice coach calls one to two suggestions per frame. Captured frame analyzed by Coach in near-real-time. 30–60 seconds of the demo; full Field Mode is post-hackathon.

### 4.2 XMP integration verification

**[AUTO]**: Run Studio Mode on real RAW files → generate XMP sidecars → import into Lightroom Classic.
**[MANUAL]**: Prasad verifies ratings, color labels, IPTC keywords, description in Lightroom.

### 4.3 Polish

- **README** — comprehensive. Position as Practice Companion. Section on prior-work attribution (gemini3 + gemma4 as architectural foundation, with new agent system + MongoDB memory + Practice Planner as new product). Hackathon track, judge-ready.
- **Demo video** — record per [§16](#16-demo-script).
- **Hosted deploy** — Agent Engine via `make deploy`. Frontend on Firebase Hosting via `firebase deploy --only hosting`.
- **Devpost submission** — text description per [§18](#18-devpost-text-description).

### 4.4 Phase 4 verification gate

- [ ] Field Mode segment works on iPhone via LAN HTTPS.
- [ ] XMP export verified in Lightroom Classic.
- [ ] Agent deployed to Vertex AI Agent Engine, reachable.
- [ ] Frontend deployed to Firebase Hosting, points to Agent Engine.
- [ ] Change stream listener deployed to Cloud Run, reachable.
- [ ] README finalized with prior-work attribution; LICENSE present.
- [ ] Demo video recorded, uploaded to YouTube/Vimeo, English (or subtitled).
- [ ] Devpost submission form completed.
- [ ] [Appendix C](#appendix-c--rules-compliance-checklist) compliance checklist run.

---

## 7. MongoDB schema

### 7.1 Database: `practice_companion`

**Atlas:** Flex tier, GCP **`europe-west3`** (Belgium — only region available). Cluster `practice-photography-companion-mvp-cluster`. Setup: [`mongodb-setup.md`](mongodb-setup.md).

**Data access:** Orchestrator **reads** via MongoDB MCP; Coach / Planner / Reflection **write** via PyMongo ([`decisions.md`](decisions.md) ADR-003).

### 7.1.1 Image storage (GCS + MongoDB)

**[AUTO]** Do not store image bytes in MongoDB.

- Upload originals and thumbnails to **`gs://practice-companion-portfolio`** (`us-central1`).
- Store `image_url` / `thumbnail_url` in `portfolio_entries` (GCS URI or signed HTTPS for Gemini multimodal).
- MongoDB holds metadata, Glass Box, spatial fields, and **embedding** vectors.

Seed script uploads demo images to GCS once, then inserts MongoDB documents.

### 7.2 Collections

**`shoot_id`:** Logical grouping for one upload session (shared `ObjectId` on `portfolio_entries`). No separate `shoots` collection for MVP.

**`users`**
```json
{
  "_id": "ObjectId",
  "email": "string",
  "display_name": "string",
  "mode": "hobbyist | working_pro",
  "created_at": "ISODate"
}
```

**`portfolio_entries`** — every critiqued photo. Schema extended in v3 with richer spatial metadata.
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "shoot_id": "ObjectId",
  "image_url": "string",
  "thumbnail_url": "string",
  "exif": { /* parsed EXIF */ },
  "scores": {
    "composition": "number 0-10",
    "lighting": "number 0-10",
    "technique": "number 0-10",
    "creativity": "number 0-10",
    "subject_impact": "number 0-10"
  },
  "glass_box": {
    "observations": ["string"],
    "reasoning_steps": ["string"],
    "priority_fixes": [{ "severity": "critical|moderate|minor", "issue": "string" }],
    "grounding_principles": ["string"]   // which Data Store principles were retrieved during analysis
  },
  "spatial_metadata": {
    "annotations": [{ "bbox": [x,y,w,h], "severity": "string", "note": "string" }],
    "subject_relationships": {           // NEW in v3
      "primary_subject_position": "left_third | center | right_third | ...",
      "secondary_subjects": [{ "position": "string", "relationship_to_primary": "string" }],
      "depth_axis": "foreground_only | foreground_midground | full_depth | ...",
      "leading_lines_present": "boolean"
    },
    "lighting_map": {                    // NEW in v3
      "key_light_direction": "upper_left | upper_right | front | back | top | ...",
      "fill_light_strength": "absent | low | moderate | high",
      "rim_light_present": "boolean",
      "color_temperature": "warm | neutral | cool | mixed",
      "shadow_character": "hard | soft | mixed"
    }
  },
  "aesthetic_tags": ["string"],
  "embedding": [/* 1408-dim from Vertex AI multimodalembedding@001 */],
  "created_at": "ISODate"
}
```

**`assignments`**
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "status": "active | completed | abandoned",
  "brief": "string",
  "target_skill": "string",
  "rationale": "string",
  "baseline_shoot_ids": ["ObjectId"],
  "completion_shoot_ids": ["ObjectId"],
  "skill_delta": {
    "metric": "Intentional Skill Application Rate",
    "baseline_value": "number",
    "current_value": "number",
    "delta": "number"
  },
  "created_at": "ISODate",
  "completed_at": "ISODate | null"
}
```

**`conversations`**
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "thread_id": "string",
  "messages": [{ "role": "user|assistant", "content": "string", "timestamp": "ISODate" }],
  "summary": "string",
  "last_active": "ISODate"
}
```

**`aesthetic_profile`** — derived per user, refreshed by change stream listener.
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "dominant_tones": ["string"],
  "preferred_lighting": ["string"],
  "subject_patterns": ["string"],
  "stylistic_consistency_score": "number 0-1",
  "computed_at": "ISODate",
  "computed_from_portfolio_size": "number"   // NEW in v3: how many portfolio entries informed this profile
}
```

### 7.3 Indexes

- **`portfolio_entries`**:
  - Vector index on `embedding` (Atlas Vector Search, 1408 dimensions, cosine).
  - **Atlas Search index** (new in v3) on `glass_box.observations`, `glass_box.reasoning_steps`, `glass_box.priority_fixes.issue`, `aesthetic_tags` — for full-text retrieval.
  - Compound index on `(user_id, created_at)`.
  - Single index on `shoot_id`.
- `assignments`: compound index on `(user_id, status)`.
- `conversations`: compound index on `(user_id, last_active)`.
- `aesthetic_profile`: single index on `user_id`.

### 7.4 Change stream

Subscribed by the change stream listener service ([§11.4](#114-change-stream-listener-for-aesthetic-profile)):
- Source: `portfolio_entries` collection.
- Filter: insert operations only.
- Action: trigger `derive_aesthetic_profile.py` for the affected `user_id`.

### 7.5 Embedding strategy

Primary: **Vertex AI `multimodalembedding@001`** — 1408-dim, image+text, Google-provided (rules-compliant).
Alternative documented: **Voyage AI** (MongoDB-owned post-acquisition; rules-compliant). Not used in this build due to time-budget; comparable-or-better multimodal quality would be a post-hackathon swap.

---

## 10. Agent definitions

### 10.1 Orchestrator

**Role:** Routes user requests; uses MongoDB MCP for user-state reads/writes; uses Agent Builder Data Store grounding for principles lookups; uses Atlas Search for text retrieval over past critique content; uses Atlas Vector Search via MCP for aesthetic similarity.

**Tools:**
- MongoDB MCP Server (read/write portfolio, assignments, conversations, aesthetic_profile, plus Atlas vector and full-text search).
- Agent Builder Data Store grounding (photography principles).
- Atlas Search tool (full-text search over Glass Box content).
- Coach, Planner, Reflection sub-agents.

### 10.2 Coach sub-agent

**Role:** Analyze a single photo. Output 5-axis scoring, Glass Box reasoning, extended spatial metadata (annotations + subject relationships + lighting map).

**Implementation:**
1. Identify scene type from quick multimodal preview (portrait, landscape, street, etc.).
2. Query Agent Builder Data Store for principles relevant to that scene type — e.g., portrait → composition + lighting + subject_impact principles.
3. Pass retrieved principles + image to Gemini 3 Pro with the Coach system prompt.
4. Receive structured JSON output. Validate against Zod schema. Write to MongoDB with `grounding_principles` field recording which Data Store docs were used (for transparency and judge-facing explainability).

### 10.3 Practice Planner sub-agent

**Role:** Generate next assignment. Inputs from orchestrator's MCP queries (recent portfolio, assignments, aesthetic profile). Output: `assignments` document with `rationale`.

### 10.4 Reflection sub-agent

**Role:** Multi-image comparison between baseline and completion shoots. Compute ISAR delta. Write SkillDelta to the assignment document.

---

## 11. Deployment

### 11.1 Backend on Vertex AI Agent Engine

```bash
make deploy
# Or: agent_starter_pack deploy
```
Deploys orchestrator and sub-agents. Endpoint URL becomes the frontend's API base.

### 11.2 MongoDB MCP Server on Cloud Run

Deploy as separate Cloud Run service:
```bash
cd backend_aux/mongodb_mcp_server
gcloud builds submit --tag gcr.io/$GOOGLE_CLOUD_PROJECT/mongodb-mcp-server
gcloud run deploy mongodb-mcp-server \
  --image gcr.io/$GOOGLE_CLOUD_PROJECT/mongodb-mcp-server \
  --region us-central1
```
Register the resulting Cloud Run URL with the orchestrator's MCP tool config.

### 11.3 Frontend on Firebase Hosting (replaces Vercel)

```bash
cd frontend
npm run build
firebase deploy --only hosting
```
Public URL becomes the submission's hosted-project URL.

### 11.4 Change stream listener for aesthetic profile

Cloud Run service subscribed to MongoDB change stream on `portfolio_entries`. On each insert, recomputes the affected user's aesthetic profile and updates the `aesthetic_profile` collection.

```bash
cd change_stream_listener
gcloud builds submit --tag gcr.io/$GOOGLE_CLOUD_PROJECT/aesthetic-profile-listener
gcloud run deploy aesthetic-profile-listener \
  --image gcr.io/$GOOGLE_CLOUD_PROJECT/aesthetic-profile-listener \
  --region us-central1 \
  --min-instances=1   # always-on listener
```

The listener is intentionally narrow — it does NOT replace the orchestrator's synchronous routing. It only powers the background `aesthetic_profile` derivation, demoable as the one place change streams earn their architectural complexity.

### 11.5 Secrets

Google Cloud Secret Manager:
- `MONGODB_URI`
- `MONGODB_ATLAS_CLIENT_SECRET`
- Any other secrets referenced in env config.

---

## 13. Demo arc & KPI

### 13.1 KPI

**Intentional Skill Application Rate (ISAR)** — for a shoot, the rate of frames where the photographer applied the active assignment's target skill deliberately and successfully. Computed by Reflection sub-agent. Baseline → assignment → post-assignment measured delta.

### 13.2 Demo arc (90-second core, expandable to 3 minutes)

1. **Set up (15s)** — "Meet [name]. Hobbyist photographer working on portraiture. Her last three shoots are in Practice Companion."
2. **Practice tab (15s)** — current assignment: "Use rule of thirds deliberately. Baseline: 2/15 frames."
3. **Upload new shoot (20s)** — Coach pass runs visibly. *Grounding citation appears: "principles consulted: composition.md — rule of thirds, leading lines"* — this is the Agent Builder Data Store grounding made visible. Glass Box critique with extended spatial map appears.
4. **Reflection (20s)** — ISAR went from 13% to 67%. Side-by-side baseline vs current with lighting maps and subject-relationship overlays.
5. **Background update (5s)** — *"And as the new shoot lands, the aesthetic profile updates in the background via MongoDB change streams — no polling, no scheduled jobs."* — show the Memory tab refreshing.
6. **Plan next (10s)** — Planner suggests next assignment grounded in just-demonstrated improvement.
7. **Export (5s)** — XMP sync to Lightroom.

For 3 minutes: add Field Mode segment (30s) + judge pitch overview (30s).

---

## 16. Demo script

Detailed 3-minute script — initial cut from §13.2 expansion; Prasad refines.

**Trademark/IP cautions (per rules §7.B video constraints):**
- Lightroom: describe as "industry-standard photo management software." Brief incidental Lightroom UI in import demo is likely fair use, but do not feature the Adobe Lightroom logo prominently or sustain shots of it. Same caution for any other branded software UI.
- MongoDB and Google Cloud logos: acceptable to show since these are the partner and sponsor — they're explicitly part of the submission and the brand identification is reasonable.
- No music with copyright restrictions; use original music or royalty-free.
- All demo photos either Prasad's own or explicitly license-cleared per [§3.4](#34-demo-seed-data).

---

## 17. Judge pitch points

For MongoDB judges specifically:

1. **MongoDB Atlas is the memory substrate that makes this product possible.** Practice Companion's value rests on "AI mentor that remembers who you are as a photographer." That requires per-tenant memory with vector search (semantic similarity over aesthetic), Atlas Search (full-text over critique history), change streams (background derived state), flexible documents (extended spatial metadata co-located with embeddings), and cross-session continuity — all in one managed primitive.

2. **MongoDB MCP Server is the orchestrator's primary read interface.** Portfolio, assignment, profile, and search queries flow through the MongoDB MCP Server. Sub-agents write via PyMongo to the same schema. This is the partner integration the hackathon looks for as the agent's "superpower."

3. **Three MongoDB capabilities operate together, not separately.** Atlas Vector Search (semantic image-aesthetic similarity), Atlas Search (full-text on Glass Box content), and change streams (background aesthetic profile derivation) compose to power the Memory tab and Practice loop. Replicating this combination in alternative stacks (Postgres + pgvector + Elasticsearch + custom polling service) imposes operational complexity for identical outcome.

4. **The architectural pattern generalizes across the creator economy.** Illustrators (style consistency), video creators (voice/editing patterns), musicians (composition tendencies), writers (rhetorical fingerprints). Same MongoDB-shaped substrate, different multimodal embeddings. Vertical expansion story for MongoDB.

For Google judges:

5. **Agent Builder + ADK + Agent Engine in real combination.** Agent Builder Data Store grounds the Coach sub-agent in curated photography principles (not inline prompts). ADK orchestrates the multi-agent system. Vertex AI Agent Engine hosts it. Gemini 3 Pro powers reasoning and multimodal analysis. Multimodal embeddings via Vertex AI co-locate with operational data in MongoDB. No third-party AI tools.

6. **Honest framing on load-bearing vs. fit.** MongoDB Atlas is the best fit among hackathon partners for this product's data shape. Alternatives would work but impose operational complexity for identical outcome. MongoDB's co-location of multiple data primitives in one managed service is the right architectural choice on its merits.

---

## 18. Devpost text description

Required submission element per rules §7.B. Drafted during Phase 4 polish; Claude Code generates initial cut; Prasad refines.

**Required content:**
- Summary of the project's features and functionality.
- Technologies used (Gemini 3 Pro, ADK, Vertex AI Agent Engine, Agent Builder Data Store, MongoDB Atlas, MongoDB MCP Server, Cloud Run, Firebase Hosting, React, TypeScript).
- Information about data sources (Prasad's own photography for demo; photography principles curated for the Data Store).
- Findings and learnings from the build process — honest reflections on what worked, what didn't, what surprised.

**Length target:** ~600-900 words. Devpost text descriptions are read carefully by judges and are often the deciding factor between similarly-scored technical implementations.

**Suggested structure:**
1. The problem (200 words) — pedagogical gap in photography tools, AOP 2026 economic context, why "memory" matters.
2. The product (200 words) — Practice Companion features, dual audience, Studio + Field modes.
3. The architecture (200 words) — how the agent system, MongoDB memory, Agent Builder Data Store, and change streams work together.
4. Prior-work attribution (75 words) — gemini3 and gemma4 lineage; what's reused as infrastructure; what's new.
5. Findings and learnings (100 words) — what we learned about agent design, partner integration, MongoDB capabilities.

---

## 19. Out of scope

- Lua-based Lightroom plugin.
- Full Field Mode mobile app.
- Multi-user collaboration.
- Public sharing / social features.
- Revenue analytics dashboard for working pros.
- Other creator categories (expansion narrative, not build).
- Authentication.
- Mobile-native apps.
- Voyage AI embeddings (post-hackathon swap candidate).
- `agents-cli` migration (post-hackathon).
- Vercel (rules-incompatible — using Firebase Hosting instead).
- Any third-party AI tools (rules §7.B prohibits).

---

## 20. Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Agent Engine cold start affects demo | Medium | Min instances = 1 during demo recording window. |
| MongoDB MCP Server deployment complexity | Medium | Spike Cloud Run deploy in Phase 1; verify orchestrator can reach MCP Server before Phase 2. |
| Vertex AI multimodalembedding@001 quota | Low | Verified in §0.3. |
| ADK + Agent Engine integration edge cases | Medium | Stay close to Agent Starter Pack's `adk_live` template; deviate only when necessary. |
| Agent Builder Data Store latency for grounding | Low | Grounding is async to user — happens in Coach before Gemini call. Even 1-2 second Data Store latency is acceptable. |
| Change stream listener race conditions | Low | Listener only updates `aesthetic_profile`, not anything on the demo's critical path. |
| Atlas Search index build time on first deploy | Low | Build time is minutes for hackathon-scale data; trigger early in Phase 2. |
| 50-hour build budget overrun | Medium | Phase 3 largest. If behind, drop Field Mode and demo Studio Mode only. |
| Rules interpretation risk on "newly created" work | Low | Submitted repo is fresh; commits are within contest period; project (multi-agent system, MongoDB integration, etc.) is new even where utility files are reused. README explicitly attributes prior work. |
| Lightroom XMP behavior change | Low | XMP code is from a working hackathon submission; format stable. Verify Phase 4. |
| Firebase Hosting deploy issues | Low | Standard React/Vite + Firebase Hosting combo; well-documented. |

---

## Appendix A — Build sequence

```
Phase 0 — Setup (5–7 hours; +1h for Data Store curation, Firebase init)
  └─ Verification gate

Phase 1 — Scaffold with Agent Starter Pack (3–5 hours)
  └─ Verification gate

Phase 2 — Multi-agent system with MCP + Data Store + Atlas Search (12–16 hours; +2h for Data Store grounding tool and Atlas Search tool integration)
  └─ Verification gate

Phase 3 — Memory + Studio Mode + change stream listener (12–16 hours; +2h for change stream service)
  └─ Verification gate

Phase 4 — Field Mode + XMP + polish + Devpost text + compliance check (7–11 hours; +1h for Devpost text + compliance run)
  └─ Verification gate

Total: 39–55 hours, target middle: 47 hours
(v2 estimate was 33–49; v3 adds ~6 hours for Agent Builder Data Store, Atlas Search, change stream listener, and rules-compliance polish)
```

---

## Appendix B — Commands quick reference

```bash
# Phase 0 — Verify access
gcloud ai models list --region=us-central1 | grep -E "gemini-3|multimodalembedding"
python -c "import pymongo; print(pymongo.MongoClient('$MONGODB_URI').server_info())"
uvx --version
firebase projects:list

# Phase 0 — Agent Builder Data Store
gcloud alpha discovery-engine data-stores create photography-principles \
  --location=global --industry-vertical=GENERIC --solution-type=SOLUTION_TYPE_SEARCH

# Phase 1 — Scaffold
uvx agent-starter-pack create

# Phase 1+ — Develop locally
make playground
cd frontend && npm run dev

# Phase 4 — LAN HTTPS for iPhone
cd frontend && npm run start:https

# Phase 4 — Deploy
make deploy                                  # Agent Engine deploy
cd frontend && npm run build && firebase deploy --only hosting   # Firebase Hosting
gcloud run deploy mongodb-mcp-server ...     # MongoDB MCP Server
gcloud run deploy aesthetic-profile-listener ...   # Change stream listener
```

---

## Appendix C — Rules compliance checklist

Run before final Devpost submission. Each item maps to a specific rules section.

### Submission essentials (rules §7.B)
- [ ] Hosted project URL works (Firebase Hosting frontend + Agent Engine backend reachable).
- [ ] Code repository public, Apache-2.0 LICENSE file detectable in About section.
- [ ] Demo video ≤ 3 minutes, uploaded to YouTube or Vimeo, English (or English subtitles).
- [ ] MongoDB track selected.
- [ ] Devpost submission form complete with text description (§18).

### Project requirements (rules §7.A, §7.B)
- [ ] Built with Gemini 3 Pro for reasoning.
- [ ] Built with Google Cloud Agent Builder (Data Store + ADK + Agent Engine all part of Agent Builder ecosystem).
- [ ] Integrates MongoDB partner via MCP (MongoDB MCP Server is orchestrator's primary data tool).
- [ ] Runs on at least one of: web, Android, iOS. (Web PWA + iOS via PWA install.)
- [ ] Project newly created during contest period (May 5 – June 11, 2026). Submitted repo created during contest period; all commits within contest period; project conception and architecture are new; prior code reused as utility infrastructure with attribution in README.

### Functionality restrictions (rules §7.B)
- [ ] No services competing with Google Cloud for cloud platform capabilities (no Vercel, no AWS, no Azure for hosting). Using Firebase Hosting, Cloud Run, Vertex AI.
- [ ] No services competing with MongoDB (our track partner) for database/search (no Pinecone, no Postgres+pgvector, no Elasticsearch). Using MongoDB Atlas exclusively.
- [ ] Only Google Cloud AI tools and MongoDB AI features used. No Anthropic Claude, OpenAI, Cohere, or other third-party AI in the runtime. (Note: Claude Code used as a dev tool is fine — it's not in the deployed product.)

### Demo video content (rules §7.B)
- [ ] Shows project functioning on its target platform.
- [ ] No content that is derogatory, offensive, discriminatory, etc.
- [ ] No third-party trademarks featured prominently (Lightroom logo handled per §16).
- [ ] No third-party publicity, privacy, or IP violations (all demo photos license-cleared per §3.4).
- [ ] Original, unpublished work.
- [ ] English or English-subtitled.

### Repository content (rules §7.B)
- [ ] Public.
- [ ] Apache-2.0 LICENSE file at root, visible in GitHub About section.
- [ ] README documents what's reused from prior projects (gemini3, gemma4) and what's new in Practice Companion.
- [ ] All necessary source code, assets, and instructions present for the project to be functional.
- [ ] No included credentials, API keys, or service account files (gcp-service-account.json, .env, etc. all in .gitignore).

### Eligibility (rules §4)
- [ ] Prasad is above age of majority (resident of Germany — confirmed eligible).
- [ ] Not in any excluded jurisdiction.
- [ ] Not an employee/contractor of Google, partners, Devpost.

---

**End of master spec (v3).**
