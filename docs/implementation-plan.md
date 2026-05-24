# Practice Companion - Implementation Plan

> **Canonical:** [`spec.md`](spec.md) (phases, gates, schema). This doc elaborates tasks and estimates only.

**Version:** 1.1
**Date:** May 24, 2026
**Status:** Phase 1 gate passed (automated) → Phase 2 next
**Timeline:** Phase 4 target June 11, 2026

---

## Table of Contents

1. [Phase Overview](#phase-overview)
2. [Phase 0: Setup (COMPLETE)](#phase-0-setup-complete)
3. [Phase 1: Scaffold](#phase-1-scaffold)
4. [Phase 2: Multi-Agent System](#phase-2-multi-agent-system)
5. [Phase 3: Memory & Studio Mode](#phase-3-memory--studio-mode)
6. [Phase 4: Field Mode & Polish](#phase-4-field-mode--polish)
7. [Dependencies & Critical Path](#dependencies--critical-path)
8. [Risk Mitigation](#risk-mitigation)

---

## Phase Overview

### Build Sequence

```
Phase 0: Setup (5-7h) ⚠️ PARTIAL (see checklist below)
  └─> Verification Gate

Phase 1: Scaffold (3-5h)
  └─> Verification Gate

Phase 2: Multi-Agent System (12-16h)
  └─> Verification Gate

Phase 3: Memory + Studio Mode (12-16h)
  └─> Verification Gate

Phase 4: Field Mode + Polish (7-11h)
  └─> Verification Gate → SUBMISSION

Total Estimate: 39-55 hours (target: 47 hours)
```

### Critical Path

```
Phase 0 Setup → Phase 1 Scaffold → Phase 2 Agent System → Phase 3 Studio Mode → Phase 4 Demo
   partial           Next              Required for 3        Required for 4      Deadline
```

**Blocking Dependencies**:
- Phase 1 blocks Phase 2 (need ADK scaffold before building agents)
- Phase 2 blocks Phase 3 (need working agents before end-to-end flows)
- Phase 3 blocks Phase 4 (need Studio Mode working before Field Mode)

**Parallel Work Opportunities**:
- Frontend porting (Phase 1) can partially overlap with backend scaffold verification
- Principles content refinement (Phase 2) can happen alongside agent code
- Demo script drafting (Phase 4) can happen during Phase 3 testing

---

## Phase 0: Setup (PARTIAL)

### Status: ⚠️ In progress — do not start Phase 1 until spec §0.8 gates pass

Use [`mongodb-setup.md`](mongodb-setup.md) and [`decisions.md`](decisions.md) for Atlas/MCP/GCS decisions.

| Gate (spec §0.8) | Status |
|------------------|--------|
| MongoDB Atlas **Flex** cluster (`europe-west3`) | ✅ Confirmed |
| PyMongo connection to `practice_companion` | ✅ (verify locally) |
| Atlas service account + MCP config | ✅ Local (`mcp-config.json`) |
| MongoDB MCP tools visible in Claude Code / Cursor | ✅ Verify per machine |
| GCP project + billing + APIs | ⚠️ Confirm all (Discovery Engine, Firebase) |
| `gcloud ai models list` includes Gemini 3 + multimodal embedding | ❌ Run; fix `test_vertex_ai.py` |
| `uv`, Firebase CLI | ⚠️ Verify |
| Agent Builder Data Store + 5 principles uploaded | ⚠️ Confirm `DATA_STORE_ID` in `.env` |
| `python3 scripts/bootstrap-mongodb.py` | ✅ Run |
| Vector index `portfolio_embedding_vector` | ✅ READY on `portfolio_entries` |
| Atlas Search index `glass_box_search` | ✅ READY on `portfolio_entries` |
| GCS bucket `practice-companion-portfolio` | ✅ `us-central1` |
| ADK scaffold (`google-agents-cli`) | ✅ `app/orchestrator/` |
| Design docs committed to GitHub | ⚠️ Commit `docs/`, `scripts/`, `principles/` |

**Artifacts present locally**:
- `.env`, `.env.example`, `mcp-config.json` (gitignored secrets)
- `firebase.json`, `.firebaserc`, `principles/`
- `docs/*` including `spec.md`, architecture, this plan, `mongodb-setup.md`, `claude-code-handoff.md`
- `scripts/bootstrap-mongodb.py`
- `test_vertex_ai.py` (needs update for `GEMINI_MODEL` + embeddings)

**Not done**: `app/`, `scripts/seed-demo-data.py`, `scripts/setup-dev-https.sh`, production deploy.

---

## Phase 1: Scaffold

**Estimated Time**: 3-5 hours

**Goal**: Generate project scaffold using Agent Starter Pack, set up frontend, port utility files from source repos.

### 1.1 Generate ADK Scaffold ✅ COMPLETE

**Command Used**:
```bash
uvx google-agents-cli create app --adk --region us-central1 --cicd-runner github_actions --agent-directory orchestrator
```

**Note**: Used `google-agents-cli` instead of `agent-starter-pack` (see ADR-008 in docs/decisions.md). The `--adk` flag creates basic ADK scaffold suitable for customization.

**Outputs**:
- `pyproject.toml`, `uv.lock` (Python dependencies) ✅
- `app/orchestrator/` (agent code structure) ✅
- `app/deployment/terraform/` (IaC for Agent Engine) ✅
- `app/tests/` (unit, integration, eval frameworks) ✅

**Fixes Applied** (per user requirements):
1. ✅ Removed demo tools (get_weather, get_current_time)
2. ✅ Created `app/prompts/orchestrator.txt` with routing-only instruction per spec §10.1
3. ✅ Fixed model config: reads `GEMINI_MODEL` from .env (gemini-3-pro)
4. ✅ Fixed location: uses `VERTEX_AI_REGION` from .env (us-central1, not global)
5. ✅ Set `GOOGLE_GENAI_USE_VERTEXAI=True`
6. ✅ Added python-dotenv dependency
7. ✅ Agent loads .env from project root

**Verification**:
```bash
uv run python -c "from orchestrator.agent import app, root_agent; print(root_agent.name)"
```
Result: `practice_companion_orchestrator` ✅ (uses gemini-3-pro, us-central1, no tools yet)

### 1.2 Frontend Scaffold ✅

Vite + React + TS + Tailwind v4. `npm run dev` / `npm run build` pass.

### 1.3 Port Frontend Files from Source Repos ✅

**Source A (photography-coach-ai-gemini3)**:

Fetch from `https://raw.githubusercontent.com/prasadt1/photography-coach-ai-gemini3/main/...`

- `src/components/AnalysisResults.tsx` → `frontend/src/components/AnalysisResults.tsx`
- `src/components/SpatialOverlay.tsx` → `frontend/src/components/SpatialOverlay.tsx`
- `src/components/PhotoUploader.tsx` → `frontend/src/components/PhotoUploader.tsx`
- `src/types/index.ts` → `frontend/src/types/index.ts` (will extend)

**Source B (photography-coach-gemma4)**:

Fetch from `https://raw.githubusercontent.com/prasadt1/photography-coach-gemma4/main/...`

- `src/services/xmpService.ts` → `frontend/src/services/xmpService.ts`
- `src/services/voiceCoach.ts` → `frontend/src/services/voiceCoach.ts`
- `src/services/voiceService.ts` → `frontend/src/services/voiceService.ts`
- `src/services/validationService.ts` → `frontend/src/services/validationService.ts`
- `src/components/LiveCameraCapture.tsx` → `frontend/src/components/LiveCameraCapture.tsx`
- `scripts/setup-dev-https.sh` → `scripts/setup-dev-https.sh`
- `public/manifest.json` → `frontend/public/manifest.json` (rebrand for Practice Companion)
- `public/sw.js` → `frontend/public/sw.js`
- `vite.config.ts` → adapt HTTPS/proxy patterns to `frontend/vite.config.ts`

**Modifications While Porting**:
- Strip all Ollama references
- Strip Electron Vault Mode code
- Strip L.E.N.S. messaging
- Replace direct Gemini API calls with calls to Agent Engine endpoint (via new `agentClient.ts`)

### 1.4 Create New Frontend Files

**New Services**:
- `frontend/src/services/agentClient.ts`: Calls Agent Engine endpoint, wraps API
- `frontend/src/services/memoryClient.ts`: Reads MongoDB for UI display (optional; may use agentClient instead)

**New Components**:
- `frontend/src/components/PracticeTab.tsx`: Active assignment display, baseline vs. current viz
- `frontend/src/components/MemoryTab.tsx`: Portfolio timeline, aesthetic profile, search
- `frontend/src/components/ModeToggle.tsx`: Switch between hobbyist and working-pro modes

**New Types**:
- `frontend/src/types/practice.ts`: Assignment, SkillDelta types
- `frontend/src/types/memory.ts`: Portfolio, AestheticProfile types

### 1.5 Update Frontend Dependencies

**Install**:
```bash
cd frontend
npm install zod ajv react-router-dom date-fns
```

### 1.6 Phase 1 Verification Gate

**Run:** `make verify-phase1` · Details: [`phase1-gate.md`](phase1-gate.md)

**Checklist**:
- [x] ADK scaffold generated (`google-agents-cli`, ADR-008)
- [x] Orchestrator imports; `make playground` for interactive test (manual send prompt)
- [x] Studio UI from gemma4 layout + gemini3 theme; utilities ported; Ollama/Electron stripped
- [x] `npm run build` succeeds; upload → mock analysis flow works
- [x] `PracticeTab`, `MemoryTab`, `ModeToggle`, `agentClient.ts` stubs present
- [x] MongoDB bootstrap + indexes; MCP config template `mcp.json.example`
- [x] GCS `gs://practice-companion-portfolio` (`us-central1`)
- [ ] Agent Builder Data Store + `DATA_STORE_ID` — confirm in console (Phase 2 uses it)
- [ ] `make vertex-check` exit 0 on your GCP project (exit 2 = embedding only until Gemini enabled)
- [ ] Repo pushed to GitHub (local branch may be ahead; no secrets in commit)

**Outputs**:
- Working ADK orchestrator stub (no sub-agents yet)
- Working React frontend with Studio mock path
- `scripts/verify-phase1-gate.sh`, `Makefile` targets

---

## Phase 2: Multi-Agent System

**Estimated Time**: 12-16 hours

**Goal**: Build the 3-agent system (orchestrator + Coach + Planner + Reflection) with MongoDB MCP, Agent Builder Data Store grounding, and Atlas Search integration.

### 2.1 Create MongoDB Schema and Indexes

**File**: `app/memory/indexes.py`

**Collections to Create**:
- `users`
- `portfolio_entries` (with vector index + Atlas Search index)
- `assignments`
- `conversations`
- `aesthetic_profile`

**Indexes**:
- Vector index on `portfolio_entries.embedding` (Atlas Vector Search, 1408 dimensions, cosine similarity)
- Atlas Search index on `portfolio_entries` fields: `glass_box.observations`, `glass_box.reasoning_steps`, `glass_box.priority_fixes.issue`, `aesthetic_tags`
- Compound index `(user_id, created_at)` on `portfolio_entries`
- Single index `shoot_id` on `portfolio_entries`
- Compound index `(user_id, status)` on `assignments`
- Compound index `(user_id, last_active)` on `conversations`
- Single index `user_id` on `aesthetic_profile`

**Run**:
```bash
python app/memory/indexes.py
```

**Verify in Atlas UI**: Collections exist, indexes visible.

### 2.2 Define Pydantic Schemas

**File**: `app/memory/schema.py`

Models:
- `User`
- `PortfolioEntry` (matches MongoDB schema)
- `Assignment`
- `Conversation`
- `AestheticProfile`

Use for validation in sub-agents before MongoDB writes.

### 2.3 Implement Coach Sub-Agent

**File**: `app/sub_agents/coach.py`

**System Prompt**: `app/prompts/coach.txt` (extract photography principles from Source A's `geminiService.ts`, refine)

**Workflow** (see Architecture doc, Coach section):
1. Receive image + optional assignment context
2. Quick scene type identification (Gemini preview call)
3. Query Agent Builder Data Store for relevant principles
4. Main Gemini 3 Pro call with principles + image
5. Structured JSON output
6. Zod/Pydantic validation
7. Generate embedding (Vertex AI `multimodalembedding@001`)
8. Write `portfolio_entries` document (PyMongo)
9. Record `grounding_principles` field

**Dependencies**:
- Vertex AI SDK for Gemini calls
- Vertex AI SDK for embedding generation
- PyMongo for MongoDB writes
- ADK Data Store Search tool for grounding

**Test**:
```python
from app.sub_agents.coach import analyze_photo

result = analyze_photo(
    image_url="https://example.com/test.jpg",
    user_id="test_user",
    shoot_id="test_shoot_001"
)
# Should return structured JSON, write to MongoDB
```

### 2.4 Implement Practice Planner Sub-Agent

**File**: `app/sub_agents/planner.py`

**System Prompt**: `app/prompts/planner.txt`

**Workflow** (see Architecture doc, Planner section):
1. Receive user context (recent portfolio, assignments, aesthetic profile) from orchestrator
2. Summarize recent work via Gemini 3 Pro
3. Identify skill gap
4. Generate assignment with `rationale`
5. Validate output (Pydantic)
6. Write `assignments` document (PyMongo)

**Test**:
```python
from app.sub_agents.planner import generate_assignment

assignment = generate_assignment(
    user_id="test_user",
    recent_portfolio=[...],  # from orchestrator's MCP query
    aesthetic_profile={...}   # from orchestrator's MCP query
)
# Should return assignment document, written to MongoDB
```

### 2.5 Implement Reflection Sub-Agent

**File**: `app/sub_agents/reflection.py`

**System Prompt**: `app/prompts/reflection.txt`

**Workflow** (see Architecture doc, Reflection section):
1. Receive baseline + completion shoot IDs
2. Fetch images from portfolio (passed by orchestrator via MCP query)
3. Multi-image Gemini 3 Pro comparison
4. Compute ISAR delta
5. Generate narrative
6. Update assignment with `skill_delta` (PyMongo)

**Test**:
```python
from app.sub_agents.reflection import compute_skill_delta

result = compute_skill_delta(
    user_id="test_user",
    assignment_id="test_assignment_001",
    baseline_images=[...],    # passed by orchestrator
    completion_images=[...]   # passed by orchestrator
)
# Should return skill_delta object, update assignment in MongoDB
```

### 2.6 Implement MongoDB MCP Registration

**File**: `app/tools/mongodb_mcp.py`

**Code** (example):
```python
from google.adk.tools.mcp_tool import MCPToolset
import os

mongodb_tools = MCPToolset.from_config(
    config_path=os.environ["MONGODB_MCP_CONFIG_PATH"]
)
```

**Verification**: MCP tools list includes MongoDB operations (query, insert, vector search, etc.)

### 2.7 Implement Agent Builder Data Store Grounding Tool

**File**: `app/tools/data_store_grounding.py`

**Code** (example):
```python
from google.adk.tools.discovery_engine import DataStoreSearch

principles_grounding = DataStoreSearch(
    project=os.environ["GOOGLE_CLOUD_PROJECT"],
    location=os.environ["DATA_STORE_LOCATION"],
    data_store_id=os.environ["DATA_STORE_ID"],
)
```

**Test**: Query for "rule of thirds" → should return composition.md content.

### 2.8 Implement Atlas Search Tool

**File**: `app/tools/atlas_search.py`

Custom wrapper around MongoDB Atlas Search API. Allows full-text search over `glass_box` content.

**Function Signature**:
```python
def atlas_search(query: str, user_id: str, limit: int = 10) -> List[dict]:
    # Use MongoDB Atlas Search API via PyMongo or HTTP
    pass
```

### 2.9 Define Orchestrator Agent

**File**: `app/agent.py`

**System Instruction**: `app/prompts/orchestrator.txt` (see Architecture doc, Orchestrator section)

**Tools Registered**:
```python
from google.adk.agents import LlmAgent

orchestrator = LlmAgent(
    name="practice_companion_orchestrator",
    model="gemini-pro",  # or best available
    instruction=open("app/prompts/orchestrator.txt").read(),
    tools=[
        mongodb_tools,            # MongoDB MCP Server
        principles_grounding,     # Agent Builder Data Store
        atlas_search_tool,        # Atlas Search wrapper
        coach_agent_tool,         # Coach sub-agent as tool
        planner_agent_tool,       # Planner sub-agent as tool
        reflection_agent_tool,    # Reflection sub-agent as tool
    ],
)
```

### 2.10 Local Testing

**Run Playground**:
```bash
make playground
```

**Test Scenarios**:

1. **Data Store Grounding**:
   - Prompt: "What are the principles of composition?"
   - Expected: Orchestrator queries Data Store, returns principles content

2. **Upload Test Image**:
   - Prompt: "Analyze this image: [URL]"
   - Expected: Orchestrator routes to Coach → Coach grounds in Data Store → analyzes with Gemini → writes to MongoDB
   - Verify in Atlas UI: `portfolio_entries` has new document with `grounding_principles` field

3. **Query Portfolio via MCP**:
   - Prompt: "Show me my recent uploads."
   - Expected: Orchestrator queries MongoDB MCP → returns list

4. **Atlas Search**:
   - Prompt: "Find feedback about backlighting."
   - Expected: Orchestrator uses Atlas Search tool → returns hits

5. **Assignment Flow**:
   - Upload image (Coach writes to portfolio)
   - Prompt: "What should I practice next?"
   - Expected: Orchestrator calls Planner → new assignment created
   - Verify in Atlas UI: `assignments` has new document

### 2.11 Phase 2 Verification Gate

**Checklist**:
- [ ] MongoDB collections + vector index + Atlas Search index all created and visible
- [ ] All three sub-agents (Coach, Planner, Reflection) respond to test inputs
- [ ] MongoDB MCP Server registered as orchestrator tool
- [ ] Agent Builder Data Store grounding tool registered, returns principles docs
- [ ] Atlas Search tool registered, returns text search hits
- [ ] End-to-end: upload image → Coach grounds in Data Store → portfolio entry in MongoDB with extended spatial metadata
- [ ] Orchestrator can query MongoDB MCP for newly written entry
- [ ] Orchestrator can call Planner → assignment created

**Outputs**:
- Working multi-agent system
- Populated MongoDB collections (test data)
- Verified partner integrations (MongoDB MCP, Agent Builder Data Store)

---

## Phase 3: Memory & Studio Mode

**Estimated Time**: 12-16 hours

**Goal**: Implement the three memory tiers, end-to-end Studio Mode flow, Practice/Memory tabs, change stream listener, and seed demo data.

### 3.1 Implement Three Memory Tiers

**Tier 1: Portfolio (Long-Term)**
- Already implemented in Phase 2 (Coach writes to `portfolio_entries`)
- Retrieval via Atlas Vector Search (semantic similarity)
- Retrieval via Atlas Search (full-text)
- Retrieval via MCP queries (recent portfolio, by shoot, etc.)

**Tier 2: Conversational Context (Cross-Session)**
- Orchestrator writes conversation turns to `conversations` collection after each user interaction
- On new session start, orchestrator queries recent threads via MCP
- Summarizes context for continuity

**Tier 3: Ephemeral (In-Session)**
- Handled by ADK runtime automatically (conversation buffer)
- No explicit MongoDB storage

### 3.2 Implement Studio Mode End-to-End

**Frontend Flow** (update `App.tsx` or create `StudioMode.tsx`):

1. **Upload**: User drags/drops images via `PhotoUploader`
2. **Submit**: Frontend calls `agentClient.analyzePhoto(imageFile)`
3. **Agent Engine**: Orchestrator routes to Coach → Planner
4. **Response**: Frontend receives Glass Box critique + new assignment
5. **Display**: `AnalysisResults` shows scores, reasoning, `SpatialOverlay` shows annotations
6. **Practice Tab**: Updates with new assignment or ISAR delta (if active assignment existed)
7. **Export**: User clicks "Export to Lightroom" → `xmpService.generateXMP()` → download ZIP

**Backend Flow** (already implemented in Phase 2, refine):
- Coach pass → write portfolio entry
- Check for active assignment → route to Reflection if exists
- Planner generates next assignment

**Test**:
- Upload 3 images
- Verify Glass Box critique displays
- Verify assignment generated
- Download XMP ZIP
- Import into Lightroom Classic (manual verification by Prasad)

### 3.3 Implement Practice Tab

**File**: `frontend/src/components/PracticeTab.tsx`

**Display**:
- Active assignment at top:
  - Brief
  - Rationale (grounded in portfolio observations)
  - Target skill
  - Baseline shoot thumbnails
- If ISAR delta exists (assignment in progress or completed):
  - Baseline vs. current side-by-side comparison
  - Spatial overlays showing improvement
  - ISAR metric: baseline %, current %, delta
- Completed assignments below (chronological list)

**Data Source**:
- Query orchestrator: "Show me my active assignment and recent completed assignments."
- Orchestrator queries MongoDB MCP → returns assignments
- Frontend displays

**Test**:
- Navigate to Practice tab
- Verify active assignment displays
- Upload images for assignment
- Verify ISAR delta appears after Reflection runs

### 3.4 Implement Memory Tab

**File**: `frontend/src/components/MemoryTab.tsx`

**Sections**:

1. **Portfolio Timeline**:
   - Chronological grid of all uploaded images
   - Click to view full critique

2. **Aesthetic Profile View**:
   - Dominant tones (color chips)
   - Preferred lighting (bar chart or word cloud)
   - Subject patterns (tags)
   - Stylistic consistency score (gauge or percentage)
   - "Computed from [N] images as of [timestamp]"

3. **Vector Search**:
   - Input: "Find images similar to [selected image]"
   - Or: "Find warm-toned portraits"
   - Orchestrator uses MongoDB MCP vector search → returns matches
   - Display results as grid

4. **Atlas Search**:
   - Input: "Find feedback about [keyword, e.g., 'backlit subjects']"
   - Orchestrator uses Atlas Search tool → returns hits
   - Display excerpts from Glass Box content

**Data Source**:
- Portfolio timeline: Query orchestrator → MCP query for all portfolio entries
- Aesthetic profile: Query orchestrator → MCP query for `aesthetic_profile`
- Searches: User inputs query → orchestrator handles via tools

**Test**:
- Navigate to Memory tab
- Verify portfolio timeline displays
- Verify aesthetic profile displays (after change stream listener computes it)
- Search: "warm tones" → verify vector search results
- Search: "backlighting" → verify Atlas Search results

### 3.5 Implement Change Stream Listener

**File**: `change_stream_listener/main.py`

**Workflow**:
1. Connect to MongoDB with change stream subscription on `portfolio_entries`
2. Filter: insert operations only
3. On event:
   - Extract `user_id`
   - Fetch all portfolio entries for that user (PyMongo query)
   - Compute aesthetic profile:
     - Dominant tones: analyze `aesthetic_tags`, color histogram from embeddings
     - Preferred lighting: mode of `spatial_metadata.lighting_map.key_light_direction`
     - Subject patterns: frequency analysis of subjects mentioned in `glass_box.observations`
     - Stylistic consistency: variance in `aesthetic_tags` (low variance = consistent)
   - Upsert to `aesthetic_profile` collection
   - Log success

**Dockerfile**: `change_stream_listener/Dockerfile`
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

**Requirements**: `pymongo`, `python-dotenv`

**Deploy to Cloud Run**:
```bash
cd change_stream_listener
gcloud builds submit --tag gcr.io/$GOOGLE_CLOUD_PROJECT/aesthetic-profile-listener
gcloud run deploy aesthetic-profile-listener \
  --image gcr.io/$GOOGLE_CLOUD_PROJECT/aesthetic-profile-listener \
  --region us-central1 \
  --min-instances=1 \
  --set-env-vars MONGODB_URI=$MONGODB_URI
```

**Test**:
- Upload image via frontend
- Wait 5-10 seconds
- Refresh Memory tab → verify aesthetic profile updated
- Check Cloud Run logs for listener activity

### 3.6 Seed Demo Data

**File**: `scripts/seed-demo-data.py`

**Data to Seed**:
- 1 demo user (`users` collection)
- ~30 portfolio entries across 4 "shoots":
  - Shoot 1 (baseline): 8 images, weak rule-of-thirds application
  - Shoot 2 (post-assignment): 8 images, improved rule-of-thirds
  - Shoot 3: 7 images, exploring lighting
  - Shoot 4: 7 images, diverse subjects
- 1 completed assignment:
  - Brief: "Use rule of thirds deliberately in your next portrait shoot."
  - Baseline: Shoot 1
  - Completion: Shoot 2
  - `skill_delta`: ISAR from 13% to 67% (+54pp)
- 1 active assignment:
  - Brief: "Experiment with side lighting to add depth."
  - Baseline: Shoot 3
  - Status: active (no completion yet)
- 1 pre-computed aesthetic profile

**Image Sources** (per spec §3.4):
- Prasad's own photography (primary)
- Stock photos with redistribution licenses (Unsplash, Pexels)
- Document licenses in script comments

**Run**:
```bash
python scripts/seed-demo-data.py
```

**Verify in Atlas UI**:
- `users`: 1 document
- `portfolio_entries`: 30 documents
- `assignments`: 2 documents
- `aesthetic_profile`: 1 document

### 3.7 Phase 3 Verification Gate

**Checklist**:
- [ ] Full Studio Mode loop works end-to-end with seed data
- [ ] Practice tab renders with seeded assignments
- [ ] Memory tab renders portfolio timeline, aesthetic profile
- [ ] Atlas Vector Search returns sensible aesthetic similarity hits
- [ ] Atlas Search returns hits for text queries on Glass Box content
- [ ] Change stream listener visibly updates aesthetic profile when new portfolio entry written
- [ ] Cross-session: close browser, reopen → orchestrator knows active assignment via MCP query
- [ ] XMP export works: download ZIP, import to Lightroom, verify metadata appears

**Outputs**:
- Fully functional Studio Mode
- Seeded demo data
- Working Practice and Memory tabs
- Background aesthetic profile updates via change stream

---

## Phase 4: Field Mode & Polish

**Estimated Time**: 7-11 hours

**Goal**: Field Mode demo segment, XMP verification, README, demo video, Devpost submission, final deployment.

### 4.1 Field Mode Segment

**Scope**: 30-60 seconds of demo video. Full Field Mode is post-hackathon.

**Setup**:
```bash
cd frontend
npm run start:https  # or use setup-dev-https.sh
```

**Flow**:
1. iPhone connects to dev server via LAN (HTTPS on local network)
2. Open `https://<local-ip>:5173` on iPhone
3. Navigate to Field Mode
4. LiveCameraCapture component active
5. Capture frame → immediate upload to Agent Engine
6. Coach analyzes → voice coaching via `voiceCoach.ts`
7. Suggestions: "Try moving left for better negative space" (TTS via browser API)

**Demo Recording**:
- Record iPhone screen (iOS screen recording)
- Capture 2-3 frames with voice feedback
- Show one before/after comparison (frame without vs. with applied suggestion)

**Test**:
- Verify LiveCameraCapture renders
- Verify voice output plays
- Verify Coach analysis returns quickly enough for near-real-time feel

### 4.2 XMP Integration Verification

**Already Tested in Phase 3**, but re-verify end-to-end:

1. Upload RAW files via Studio Mode
2. Receive critique
3. Click "Export to Lightroom"
4. Download XMP ZIP
5. **[MANUAL - Prasad]**: Import into Lightroom Classic
6. Verify:
   - Star ratings match 5-axis scores
   - Color labels applied
   - IPTC keywords (aesthetic tags)
   - Description field (Glass Box summary)

### 4.3 Polish: README

**File**: `README.md`

**Sections**:

1. **Project Title + Tagline**
   - "Practice Companion: AI Photography Mentor with Persistent Memory"
   - Hackathon: Google Cloud Rapid Agent Hackathon - MongoDB Track
   - Deadline: June 11, 2026

2. **Overview** (2-3 paragraphs)
   - What it does
   - Dual audience (hobbyist vs. working-pro)
   - Key differentiator: memory + adaptive practice planning

3. **Architecture** (link to `docs/architecture.md`)
   - High-level diagram
   - Tech stack table

4. **Features**
   - Glass Box critique (transparent reasoning)
   - Practice assignments grounded in portfolio analysis
   - ISAR metric (Intentional Skill Application Rate)
   - Aesthetic identity tracking
   - XMP export to Lightroom
   - Field Mode voice coaching (demo segment)

5. **Partner Integrations**
   - MongoDB Atlas: memory substrate (portfolio, assignments, conversations, aesthetic profile)
   - MongoDB MCP Server: orchestrator's primary data tool
   - Atlas Vector Search: aesthetic similarity
   - Atlas Search: full-text over critique content
   - MongoDB Change Streams: background aesthetic profile updates
   - Agent Builder Data Store: photography principles grounding

6. **Prior Work Attribution**
   - Foundation: `photography-coach-ai-gemini3` and `photography-coach-gemma4` (Prasad's prior hackathon projects)
   - Reused as infrastructure: frontend components, XMP service, voice coaching, HTTPS setup
   - New in Practice Companion: multi-agent system, MongoDB memory, Agent Builder Data Store grounding, practice planning, ISAR metric, change streams

7. **Setup Instructions** (for judges/collaborators)
   - Prerequisites
   - Environment setup
   - Run locally
   - Deploy to GCP

8. **Demo**
   - Link to demo video (YouTube/Vimeo)
   - Link to hosted project (Firebase Hosting URL + Agent Engine endpoint)

9. **License**
   - Apache-2.0

10. **Acknowledgments**
    - Google Cloud (Gemini, Agent Platform, Firebase)
    - MongoDB (Atlas, MCP Server)

### 4.4 Polish: Demo Video

**Script**: `docs/demo-script.md` (detailed script per spec §16)

**Length**: ~3 minutes (can trim to 90 seconds for core flow)

**Segments**:

1. **Setup (15s)**:
   - "Meet [name]. Hobbyist photographer working on portraiture. Her last three shoots are in Practice Companion."
   - Show Memory tab: portfolio timeline

2. **Practice Tab (15s)**:
   - Show active assignment: "Use rule of thirds deliberately. Baseline: 2/15 frames."
   - Show baseline shoot thumbnails

3. **Upload New Shoot (20s)**:
   - Drag-drop images
   - Coach pass runs visibly (loading indicator)
   - **Grounding citation appears**: "Principles consulted: composition.md - rule of thirds, leading lines"
   - Glass Box critique displays with extended spatial map, lighting map

4. **Reflection (20s)**:
   - Practice tab updates
   - ISAR went from 13% to 67% (+54pp)
   - Side-by-side baseline vs. current with overlays

5. **Background Update (5s)**:
   - "As the new shoot lands, the aesthetic profile updates in the background via MongoDB change streams."
   - Show Memory tab refreshing (aesthetic profile stats update)

6. **Plan Next (10s)**:
   - Planner suggests next assignment: "Experiment with side lighting to add depth."
   - Rationale shown: grounded in just-demonstrated improvement

7. **Export (5s)**:
   - Click "Export to Lightroom"
   - XMP ZIP downloads
   - Brief flash of Lightroom Classic with imported metadata

8. **Field Mode Segment (30s)** [Optional if time permits]:
   - iPhone screen recording
   - Live camera with voice coaching
   - "Try moving left..." → photographer moves → "Good, now the subject is in the right third."

9. **Closing (10s)**:
   - Logo + tagline
   - Links: GitHub repo, hosted project
   - "Built with Google Cloud + MongoDB for [Hackathon Name]"

**Recording**:
- Screen recording (OBS or Loom)
- Voiceover or text overlays
- Background music (royalty-free)
- Upload to YouTube or Vimeo
- Add to Devpost submission

### 4.5 Polish: Judge Pitch Points

**File**: `docs/judge-pitch.md` (per spec §17)

**For MongoDB Judges**:
1. MongoDB Atlas is the memory substrate that makes this product possible.
2. MongoDB MCP Server is the orchestrator's primary data interface (not a side feature).
3. Three MongoDB capabilities operate together: Vector Search + Atlas Search + Change Streams.
4. Architectural pattern generalizes across the creator economy.

**For Google Judges**:
5. Agent Builder + ADK + Agent Engine in real combination (Data Store grounds Coach, ADK orchestrates, Agent Engine hosts).
6. Honest framing: MongoDB is the best fit for this product's data shape.

### 4.6 Polish: Devpost Text Description

**File**: `docs/devpost-text.md` (per spec §18)

**Length**: 600-900 words

**Sections**:
1. The problem (photography pedagogy gap, AOP 2026 economic context)
2. The product (Practice Companion features, dual audience)
3. The architecture (agent system, MongoDB memory, Agent Builder Data Store, change streams)
4. Prior-work attribution (gemini3 and gemma4 lineage)
5. Findings and learnings (what we learned about agent design, partner integration, MongoDB capabilities)

### 4.7 Deploy to Production

**Backend (Agent Engine)**:
```bash
make deploy
# Or: agent_starter_pack deploy
```
Output: Agent Engine endpoint URL → update `.env` as `VITE_API_BASE_URL`

**Change Stream Listener (Cloud Run)**:
```bash
cd change_stream_listener
gcloud builds submit --tag gcr.io/$GOOGLE_CLOUD_PROJECT/aesthetic-profile-listener
gcloud run deploy aesthetic-profile-listener \
  --image gcr.io/$GOOGLE_CLOUD_PROJECT/aesthetic-profile-listener \
  --region us-central1 \
  --min-instances=1 \
  --set-env-vars MONGODB_URI=$MONGODB_URI
```

**MongoDB MCP Server (Cloud Run)** [if deploying separately]:
```bash
cd backend_aux/mongodb_mcp_server  # if structured this way
gcloud builds submit --tag gcr.io/$GOOGLE_CLOUD_PROJECT/mongodb-mcp-server
gcloud run deploy mongodb-mcp-server \
  --image gcr.io/$GOOGLE_CLOUD_PROJECT/mongodb-mcp-server \
  --region us-central1
```

**Frontend (Firebase Hosting)**:
```bash
cd frontend
npm run build
firebase deploy --only hosting
```
Output: Firebase Hosting URL (public-facing frontend)

**Secrets**:
- Ensure all secrets are in Google Cloud Secret Manager
- Agent Engine deployment references secrets via Terraform

**Verify**:
- Open Firebase Hosting URL
- Upload test image
- Verify end-to-end flow works
- Check Agent Engine logs, Cloud Run logs for errors

### 4.8 Final Submission

**Devpost Form**:
1. Hosted project URL: Firebase Hosting URL
2. Text description: Copy from `docs/devpost-text.md`
3. Code repo URL: GitHub repo (public, Apache-2.0 LICENSE visible)
4. Demo video: YouTube/Vimeo link
5. Track: MongoDB
6. Completed form submission

**GitHub Repo Final Check**:
- [ ] README comprehensive, attribution clear
- [ ] LICENSE file (Apache-2.0) at root, visible in About section
- [ ] All secrets gitignored (`.env`, `gcp-service-account.json`, `mcp-config.json`)
- [ ] Docs complete (`architecture.md`, `demo-script.md`, `judge-pitch.md`, `devpost-text.md`)
- [ ] Clean commit history

**Rules Compliance Checklist** (Appendix C from spec):
- Run through all items in `docs/spec.md` Appendix C
- Verify no competing services used (no Vercel, no AWS, no Pinecone, etc.)
- Verify demo video is <3 minutes, no offensive content, no third-party IP violations
- Verify all demo photos are license-cleared

### 4.9 Phase 4 Verification Gate

**Checklist**:
- [ ] Field Mode segment works on iPhone via LAN HTTPS
- [ ] XMP export verified end-to-end in Lightroom Classic
- [ ] Agent deployed to Vertex AI Agent Engine, publicly reachable
- [ ] Frontend deployed to Firebase Hosting, points to Agent Engine endpoint
- [ ] Change stream listener deployed to Cloud Run, reachable and active
- [ ] README finalized with prior-work attribution
- [ ] LICENSE present (Apache-2.0)
- [ ] Demo video recorded, uploaded to YouTube/Vimeo, <3 minutes, English
- [ ] Devpost submission form completed
- [ ] Appendix C rules compliance checklist run (all items ✅)

**Outputs**:
- Deployed, publicly accessible Practice Companion
- Demo video
- Devpost submission
- GitHub repo ready for judging

---

## Dependencies & Critical Path

### Critical Path (Sequential)

```
Phase 0 ✅ → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Submission
```

**Cannot Parallelize**:
- Phase 2 requires Phase 1 (need ADK scaffold)
- Phase 3 requires Phase 2 (need working agents)
- Phase 4 requires Phase 3 (need Studio Mode for demo)

### Parallel Work Opportunities

**During Phase 1**:
- While backend scaffold generates → start porting frontend files
- While dependencies install → draft system prompts

**During Phase 2**:
- While testing Coach → refine Planner/Reflection prompts
- While implementing sub-agents → draft demo script

**During Phase 3**:
- While seed data loads → start frontend tab implementations
- While testing Studio Mode → record Field Mode setup instructions

**During Phase 4**:
- While deploying → write Devpost text
- While recording demo → finalize README

### External Dependencies (Not Blocking)

- $100 Google Cloud credits (pending, not needed - have $1,000 credit)
- Gemini 3 Pro model name (may need to use available Gemini variant)

---

## Risk Mitigation

### Risk 1: Agent Engine Cold Start During Demo

**Mitigation**: Set `--min-instances=1` for Agent Engine deployment during demo recording window.

**Cost**: ~$50/month while min instances = 1. Disable after demo.

### Risk 2: Gemini Model Access Issues

**Mitigation**: Use best available Gemini model (`gemini-pro`, `gemini-1.5-pro`, etc.). Spec mentions "Gemini 3 Pro" aspirationally; actual model will be whatever is available.

**Fallback**: If no Gemini models work, escalate to Prasad for GCP support ticket.

### Risk 3: MongoDB MCP Server Deployment Complexity

**Mitigation**: MCP configured locally; spike Cloud Run or sidecar in Agent Engine in Phase 1–2.

**Fallback**: Orchestrator reads via PyMongo temporarily; restore MCP before submission. Sub-agent writes use PyMongo per [ADR-003](decisions.md#adr-003-orchestrator-reads-via-mcp-sub-agents-write-via-pymongo).

### Risk 4: Time Budget Overrun

**Current**: Phase 0 complete. 39-55 hours remain for Phases 1-4.

**Mitigation**: If behind by end of Phase 3, **drop Field Mode entirely** and demo Studio Mode only. Field Mode is a "nice-to-have" segment; Studio Mode is the core product.

**Trigger**: If Phase 3 takes >16 hours, reassess.

### Risk 5: XMP Export Issues in Lightroom

**Mitigation**: XMP code ported from working gemma4 hackathon submission. Format is stable.

**Test Early**: Phase 3.2 includes XMP verification. If issues arise, debug before Phase 4.

### Risk 6: Firebase Hosting Deploy Issues

**Mitigation**: Standard React/Vite + Firebase Hosting combo, well-documented.

**Fallback**: If Firebase Hosting fails, use Cloud Run for static site hosting (less ideal for rules compliance, but functional).

---

**End of Implementation Plan**

**Next Step**: Execute Phase 1 (Scaffold)
