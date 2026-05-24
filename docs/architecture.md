# Practice Companion - System Architecture

> **Canonical:** [`spec.md`](spec.md) §2, §7, §10–11 · **Index:** [`doc-map.md`](doc-map.md) · **ADRs:** [`decisions.md`](decisions.md)

**Version:** 1.1
**Date:** May 24, 2026
**Status:** Design (aligned with spec v3)

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Principles](#architecture-principles)
3. [Component Architecture](#component-architecture)
4. [Data Architecture](#data-architecture)
5. [Agent System Design](#agent-system-design)
6. [Integration Points](#integration-points)
7. [Security Architecture](#security-architecture)
8. [Scalability Considerations](#scalability-considerations)

---

## System Overview

### Vision

Practice Companion is an AI photography mentor that combines multimodal critique with adaptive practice planning, grounded in a photographer's persistent aesthetic identity over time.

### Core Differentiators

- **Persistent Memory**: Three-tier MongoDB memory system (portfolio, conversational, ephemeral)
- **Adaptive Practice Planning**: AI-generated assignments based on actual portfolio analysis
- **Glass Box Reasoning**: Transparent critique showing the "why" behind feedback
- **Aesthetic Identity Tracking**: Cross-session consistency analysis
- **Professional Workflow Integration**: XMP sidecar export to Lightroom

### System Constraints

- **Hackathon Timeline**: June 11, 2026 deadline
- **Budget**: $1,000 GenAI App Builder credit
- **Rules Compliance**: Google Cloud + MongoDB only, no competing services
- **Single User Scope**: Demo/MVP focuses on one photographer's journey

---

## Architecture Principles

### 1. Partner Integration as First-Class Concerns

**MongoDB MCP Server** is the orchestrator's primary **read** interface (portfolio, assignments, profile, vector/search queries). **Sub-agents write** via PyMongo to the same schema — see [ADR-003](decisions.md#adr-003-orchestrator-reads-via-mcp-sub-agents-write-via-pymongo).

**Agent Builder Data Store** grounds the Coach agent in curated photography principles, making critique knowledge-based rather than purely generative.

### 2. Separation of Concerns

- **Orchestrator**: Routes requests, coordinates sub-agents, synthesizes responses
- **Sub-agents**: Specialized, focused responsibilities (Coach, Planner, Reflection)
- **Tools**: Single-purpose utilities (photo analysis, embeddings, MongoDB access, Data Store grounding)

### 3. Data Co-location Over Distributed Complexity

All operational data, vector embeddings, and full-text search indexes live in MongoDB Atlas. No separate vector DB, no separate search engine. Simplifies operations, reduces latency, improves consistency.

### 4. Async-First for Heavy Operations

- Embedding generation: async after portfolio writes
- Aesthetic profile derivation: background via MongoDB change streams
- Coach critique: async from user perspective (they upload, then wait for results)

### 5. Fail Gracefully, Degrade Predictably

- If Data Store grounding fails → Coach falls back to inline principles
- If aesthetic profile isn't computed yet → Planner works with recent portfolio only
- If XMP export fails → user still gets critique, just no Lightroom sync

---

## Component Architecture

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User (Browser)                           │
│                    React/TypeScript/Vite PWA                     │
│              (Studio Mode, Practice, Memory, Field)              │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTPS
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                    Firebase Hosting (Frontend)                   │
│                  Serves static React build + PWA                 │
└────────────────────┬────────────────────────────────────────────┘
                     │ API Calls
                     │
┌────────────────────▼────────────────────────────────────────────┐
│              Vertex AI Agent Engine (Backend)                    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Orchestrator Agent (ADK)                   │    │
│  │  - Routes user requests                                 │    │
│  │  - Coordinates sub-agents                               │    │
│  │  - Uses MongoDB MCP Server for all user data           │    │
│  │  - Uses Agent Builder Data Store for principles        │    │
│  │  - Uses Atlas Search for text retrieval                │    │
│  │  - Synthesizes responses                                │    │
│  └──┬──────────────┬───────────────┬────────────────────────┘   │
│     │              │               │                             │
│  ┌──▼──────┐  ┌───▼──────┐  ┌────▼─────────┐                   │
│  │ Coach   │  │ Planner  │  │ Reflection   │                   │
│  │ Agent   │  │ Agent    │  │ Agent        │                   │
│  └──┬──────┘  └───┬──────┘  └────┬─────────┘                   │
│     │             │               │                             │
│     │             │               │                             │
└─────┼─────────────┼───────────────┼─────────────────────────────┘
      │             │               │
      │ Gemini 3    │ Gemini 3      │ Gemini 3
      │ Pro         │ Pro           │ Pro (multi-image)
      │             │               │
┌─────▼─────────────▼───────────────▼─────────────────────────────┐
│                  Vertex AI (Gemini + Embeddings)                 │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│              Agent Builder Data Store (Discovery Engine)          │
│  Photography principles grounding (composition, lighting, etc.)   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    MongoDB Atlas (Flex Tier)                      │
│                                                                   │
│  Collections:                                                     │
│  - portfolio_entries (vector + full-text search indexes)          │
│  - assignments                                                    │
│  - conversations                                                  │
│  - aesthetic_profile                                              │
│  - users                                                          │
│                                                                   │
│  MongoDB MCP Server ◄─────── Orchestrator primary data interface │
│  Atlas Vector Search ◄────── Aesthetic similarity queries         │
│  Atlas Search ◄──────────── Full-text over critique content      │
│  Change Streams ◄────────── Aesthetic profile background updates │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│              Change Stream Listener (Cloud Run)                   │
│  Subscribes to portfolio_entries inserts → recomputes            │
│  aesthetic_profile for affected user_id                          │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│              MongoDB MCP Server (Cloud Run - optional)            │
│  Standalone MCP server process for orchestrator tool access      │
│  Alternative: sidecar in Agent Engine container                  │
└──────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

#### Frontend (React/TypeScript/Vite PWA)

**Purpose**: User interface for Studio Mode, Practice, Memory, and Field Mode.

**Key Components**:
- `PhotoUploader`: Drag-drop or select images, client-side preview
- `AnalysisResults`: Display 5-axis scores, Glass Box reasoning, spatial annotations
- `SpatialOverlay`: Visual overlay showing composition issues, lighting map
- `PracticeTab`: Active assignment, baseline vs. current comparison, ISAR delta
- `MemoryTab`: Portfolio timeline, aesthetic profile view, vector + text search
- `LiveCameraCapture`: Field Mode live preview with voice coaching (Phase 4)
- `XMPService`: Client-side XMP sidecar generation, ZIP download

**Technology**:
- React 18+
- TypeScript
- Vite (build tool)
- PWA (service worker, manifest.json for iOS install)

**Deployment**: Firebase Hosting (static site)

#### Orchestrator Agent (ADK on Vertex AI Agent Engine)

**Purpose**: Top-level coordinator. Routes user requests to appropriate sub-agents, manages context, synthesizes responses.

**Tools**:
- `MongoDB MCP Server`: All user data reads/writes (portfolio, assignments, conversations, aesthetic_profile)
- `Agent Builder Data Store Search`: Photography principles grounding
- `Atlas Search Tool`: Full-text search over Glass Box critique content
- `Coach Agent Tool`: Invoke Coach sub-agent
- `Planner Agent Tool`: Invoke Planner sub-agent
- `Reflection Agent Tool`: Invoke Reflection sub-agent

**Decision Logic**:
- User uploads photo → route to Coach
- Coach completes → check for active assignment via MCP → route to Reflection if exists
- After Reflection (or if no active assignment) → route to Planner for next assignment
- User asks aesthetic query ("show warm-toned portraits") → use MCP vector search
- User asks text query ("feedback on backlighting") → use Atlas Search tool

**Model**: Gemini 3 Pro (or best available Gemini variant)

#### Coach Sub-Agent

**Purpose**: Analyze a single photo. Produce 5-axis scoring, Glass Box reasoning, spatial metadata.

**Workflow**:
1. Receive image (URL or base64) + optional active assignment context
2. Identify scene type (portrait, landscape, street, etc.) via quick Gemini preview
3. Query Agent Builder Data Store for relevant principles (e.g., portrait → composition + lighting + subject_impact)
4. Pass retrieved principles + image to Gemini 3 Pro with Coach system prompt
5. Receive structured JSON output (scores, observations, reasoning, spatial metadata, lighting map)
6. Validate output against Zod schema
7. Generate multimodal embedding (Vertex AI `multimodalembedding@001`)
8. Write `portfolio_entries` document to MongoDB via PyMongo (direct write, not via MCP)
9. Record which Data Store principles were used (for transparency/judging)

**Output Schema**: See MongoDB `portfolio_entries` schema (§7.2 in spec)

**Model**: Gemini 3 Pro (multimodal)

#### Practice Planner Sub-Agent

**Purpose**: Generate the next practice assignment based on portfolio analysis.

**Inputs** (from orchestrator's MCP queries, passed as context):
- Recent portfolio entries (last 20-30 images)
- Active and completed assignments
- Aesthetic profile (if computed)
- User mode (hobbyist vs. working-pro)

**Workflow**:
1. Summarize recent work (themes, strengths, recurring issues)
2. Identify highest-impact skill gap (what would move the needle most)
3. Generate assignment brief calibrated to current level
4. Output JSON with `rationale` field grounded in actual portfolio observations

**Output**: `assignments` document (written to MongoDB via PyMongo)

**Model**: Gemini 3 Pro

#### Reflection Sub-Agent

**Purpose**: Compare assignment work against baseline. Compute Intentional Skill Application Rate (ISAR) delta.

**Inputs**:
- `user_id`, `assignment_id`
- `baseline_shoot_ids` (images from before assignment)
- `completion_shoot_ids` (images from after working on assignment)

**Workflow**:
1. Fetch baseline and completion images from portfolio (via orchestrator's MCP query, passed in)
2. Multi-image Gemini 3 Pro call: compare baseline vs. completion side-by-side
3. Count frames where target skill was applied deliberately and successfully
4. Compute ISAR baseline rate, ISAR current rate, delta
5. Generate narrative comparison for the user
6. Write `skill_delta` object to assignment document (MongoDB via PyMongo)

**Output**: Updated `assignments` document with `skill_delta` populated

**Model**: Gemini 3 Pro (multimodal, multi-image)

#### MongoDB MCP Server

**Purpose**: Provide the orchestrator with MCP-compliant tools for MongoDB operations.

**Deployment**: Cloud Run service (or sidecar in Agent Engine container)

**Configuration**: `mcp-config.json` with connection string and Atlas service account credentials

**Operations (orchestrator via MCP)**:
- Query portfolio entries (by user, by shoot, by date range, vector search, text search)
- Query assignments (by user, by status)
- Query conversations (by user, by thread)
- Query aesthetic profile (by user)

**Writes:** Coach / Planner / Reflection use **PyMongo** for inserts/updates (same URI). MCP may expose writes; we use PyMongo for deterministic agent code paths.

**Why MCP**: Partner integration for the orchestrator's memory reads — the hackathon "superpower" interface for user state.

#### Agent Builder Data Store

**Purpose**: Grounding source for photography principles. Coach queries this before generating critique.

**Content**: 5 Markdown documents (composition, lighting, technique, creativity, subject_impact)

**Query Method**: `DataStoreSearch` tool in ADK orchestrator, invoked before Coach analysis

**Why This Matters for Judging**: Satisfies the literal "Google Cloud Agent Builder" requirement in hackathon rules while adding real value (grounded, consistent critique based on curated knowledge).

#### Change Stream Listener (Cloud Run)

**Purpose**: Background service that listens to MongoDB change streams on `portfolio_entries` collection. On insert, recomputes `aesthetic_profile` for the affected user.

**Why Change Streams**: Demonstrates MongoDB's real-time data capabilities. Alternative (polling, scheduled jobs) would be less elegant and less partner-aligned.

**Deployment**: Cloud Run with `--min-instances=1` (always-on listener)

**Logic**:
1. Subscribe to `portfolio_entries` collection, filter for insert operations
2. On new insert, extract `user_id`
3. Fetch all portfolio entries for that user
4. Compute aggregate aesthetic profile:
   - Dominant tones (color analysis from embeddings or metadata)
   - Preferred lighting (histogram of lighting_map.key_light_direction values)
   - Subject patterns (frequency analysis of subjects)
   - Stylistic consistency score (variance in aesthetic_tags)
5. Upsert to `aesthetic_profile` collection with timestamp and portfolio size

**Error Handling**: Log failures but don't block. Aesthetic profile is supplemental; missing it doesn't break core flows.

---

## Data Architecture

### MongoDB Collections

#### `users`

Single demo user for hackathon scope.

```json
{
  "_id": "ObjectId",
  "email": "string",
  "display_name": "string",
  "mode": "hobbyist | working_pro",
  "created_at": "ISODate"
}
```

#### `portfolio_entries`

Every critiqued photo. Core of the memory system.

**Image storage ([ADR-002](decisions.md#adr-002-store-images-in-gcs-metadata-in-mongodb)):** Originals and thumbnails live in **Google Cloud Storage** (`gs://practice-companion-portfolio/...`). MongoDB stores `image_url` / `thumbnail_url` (GCS or signed HTTPS), plus metadata, Glass Box, and embeddings — **not** image bytes.

**`shoot_id` ([ADR-004](decisions.md#adr-004-shoot_id-is-a-logical-grouping-not-a-collection)):** Shared `ObjectId` for entries from one upload session. No separate `shoots` collection.

**Key Fields**:
- `embedding`: 1408-dim vector from Vertex AI `multimodalembedding@001`
- `spatial_metadata`: Extended in v3 with subject relationships + lighting map
- `glass_box.grounding_principles`: Which Data Store docs were used (transparency)

**Indexes**:
- Vector index (Atlas Vector Search, cosine similarity, 1408 dimensions)
- Atlas Search index (full-text on `glass_box` fields and `aesthetic_tags`)
- Compound index `(user_id, created_at)`
- Single index `shoot_id`

**Read Patterns**:
- Recent portfolio (orchestrator, Planner): sort by `created_at DESC`, limit 20-30
- Aesthetic similarity (user query): vector search on `embedding`
- Text search (user query): Atlas Search on Glass Box content
- Baseline vs. completion (Reflection): filter by `shoot_id IN [...]`

**Write Pattern**:
- Coach writes after each photo analysis (PyMongo direct write)
- Triggers change stream → aesthetic profile update

#### `assignments`

Practice assignments. Core of the pedagogical loop.

**Key Fields**:
- `status`: `active | completed | abandoned`
- `rationale`: Grounded explanation of why this assignment was chosen
- `skill_delta`: Computed by Reflection sub-agent

**Indexes**:
- Compound index `(user_id, status)` (frequent query: "active assignment for user X")

**Read Patterns**:
- Check for active assignment (orchestrator after Coach): `{user_id, status: 'active'}`
- Fetch assignment history (Planner): `{user_id}`, sort by `created_at DESC`

**Write Patterns**:
- Planner creates new assignment
- Reflection updates with `skill_delta` and marks `completed`

#### `conversations`

Cross-session conversational context.

**Purpose**: Allows resuming without re-explaining. "Remember when we talked about backlighting?" → yes, the orchestrator can query this.

**Indexes**:
- Compound index `(user_id, last_active)` for recent threads

#### `aesthetic_profile`

Derived per user, refreshed by change stream listener.

**Computed Fields**:
- `dominant_tones`
- `preferred_lighting`
- `subject_patterns`
- `stylistic_consistency_score`
- `computed_from_portfolio_size` (transparency: how many images informed this)

**Read Patterns**:
- Planner reads for context when generating assignments
- Memory tab displays for user

**Write Pattern**:
- Change stream listener recomputes on new portfolio entry

### Data Flow: Upload → Critique → Assignment

```
1. User uploads photo via frontend
   └─> POST to Agent Engine endpoint

2. Orchestrator receives request
   └─> Routes to Coach sub-agent

3. Coach analyzes photo
   ├─> Query Agent Builder Data Store (grounding)
   ├─> Call Gemini 3 Pro (multimodal analysis)
   ├─> Generate embedding (Vertex AI)
   └─> Write portfolio_entries document (MongoDB via PyMongo)

4. Change stream listener detects insert
   └─> Recompute aesthetic_profile (background, async)

5. Orchestrator queries MongoDB MCP
   └─> "Does this user have an active assignment?"

6a. If YES:
    └─> Route to Reflection sub-agent
        ├─> Fetch baseline + completion shoots
        ├─> Compare via Gemini 3 Pro
        ├─> Compute ISAR delta
        └─> Update assignment with skill_delta

6b. If NO (or after Reflection completes):
    └─> Route to Planner sub-agent
        ├─> Fetch recent portfolio (MongoDB MCP)
        ├─> Fetch aesthetic profile (MongoDB MCP)
        ├─> Reason via Gemini 3 Pro
        └─> Create new assignment (MongoDB via PyMongo)

7. Orchestrator synthesizes response
   └─> Return to frontend (Glass Box critique + assignment status)

8. Frontend displays results
   ├─> AnalysisResults component (scores, reasoning, spatial overlay)
   ├─> PracticeTab updates (new assignment or ISAR delta)
   └─> (Optional) User downloads XMP sidecar for Lightroom sync
```

---

## Agent System Design

### Orchestrator System Instruction (Pseudocode)

```
You are the orchestrator for Practice Companion, a photography mentor with persistent memory.

Your tools:
- MongoDB MCP Server: ALL user data (portfolio, assignments, conversations, aesthetic_profile)
- Agent Builder Data Store Search: Photography principles grounding
- Atlas Search: Full-text search over past critique content
- Coach, Planner, Reflection sub-agents

Your job:
- Route user requests to the right sub-agent(s)
- Coordinate multi-step flows (Coach → check for assignment → Reflection or Planner)
- Synthesize responses for the user

CRITICAL RULES:
1. MongoDB MCP Server is your primary data interface. Query it for ALL user state.
2. Before calling Coach, optionally query Data Store for relevant principles.
3. After Coach completes, ALWAYS query MCP: "Does this user have an active assignment?"
   - If yes: call Reflection.
   - If no (or after Reflection): call Planner.
4. Never make up facts about the user's portfolio. Query MCP. Ground everything.
5. When user asks aesthetic queries ("show me warm portraits"), use MCP vector search.
6. When user asks text queries ("feedback on backlighting"), use Atlas Search tool.

Response format:
- Conversational, supportive, pedagogical (hobbyist mode) or businesslike (working-pro mode)
- Cite specific portfolio observations when suggesting assignments
- Explain the "why" behind critique (Glass Box transparency)
```

### Sub-Agent Communication

Sub-agents are invoked as **Agent tools** by the orchestrator. They don't communicate with each other directly.

**Orchestrator → Coach**:
- Input: image (URL or base64), optional active_assignment context
- Output: structured JSON (portfolio entry schema)

**Orchestrator → Reflection**:
- Input: user_id, assignment_id, baseline_shoot_ids, completion_shoot_ids (orchestrator fetches these via MCP, passes them in)
- Output: skill_delta object

**Orchestrator → Planner**:
- Input: user_id, recent portfolio (orchestrator fetches via MCP, passes summary or full context), aesthetic_profile (orchestrator fetches via MCP)
- Output: new assignment document

---

## Integration Points

### Lightroom Integration (XMP Sidecars)

**Client-Side Export**:
- Frontend `xmpService.ts` generates XMP files from portfolio entries
- Maps 5-axis scores to star ratings, color labels, IPTC keywords
- User downloads ZIP of XMP files, imports into Lightroom Classic
- XMP files are sidecar files (same name as image, `.xmp` extension)

**Why Client-Side**: No server storage of user images (privacy, cost). User has full control.

### Field Mode (Phase 4, Demo Segment Only)

**Flow**:
- iPhone connects to dev server via LAN HTTPS (`setup-dev-https.sh`)
- LiveCameraCapture component active
- User captures frame → immediate upload to Agent Engine
- Coach analyzes → voice coaching via TTS (`voiceCoach.ts`, `voiceService.ts`)
- 1-2 suggestions per frame ("Try moving left for better negative space")

**Scope**: 30-60 seconds of demo video. Full Field Mode is post-hackathon.

### MongoDB MCP Server as Load-Bearing Partner Integration

**Why This Matters**:
- Hackathon judges look for "partner superpower" usage
- Orchestrator **reads** (portfolio, assignments, profile, vector/search) flow through **MongoDB MCP**
- Sub-agent **writes** use PyMongo to the same Atlas database
- Demonstrates MongoDB as the memory substrate that makes the product possible

### Cross-region deployment ([ADR-001](decisions.md#adr-001-mongodb-atlas-region-is-europe-west3-only))

| Service | Region |
|---------|--------|
| MongoDB Atlas Flex | GCP `europe-west3` (Belgium — only region available) |
| Vertex AI, Agent Engine, GCS portfolio bucket | `us-central1` |

Expect added latency on DB round-trips; batch agent tool calls where possible.

### Agent Builder Data Store as Load-Bearing Google Integration

**Why This Matters**:
- Hackathon rules mention "Google Cloud Agent Builder" explicitly
- Data Store is used for real grounding (not name-dropped)
- Coach queries it before every analysis → grounded, consistent critique
- `grounding_principles` field in portfolio entries shows which principles were used (transparency for judges)

---

## Security Architecture

### Secrets Management

- **Google Cloud Secret Manager**: Store `MONGODB_URI`, `MONGODB_ATLAS_CLIENT_SECRET`, any partner API keys
- **Environment Variables**: Agent Engine deployment references secrets via Terraform config
- **Gitignore**: `gcp-service-account.json`, `.env`, `mcp-config.json` all gitignored

### Authentication & Authorization

**Hackathon Scope**: Single demo user, no authentication flow.

**Post-Hackathon**:
- Firebase Authentication for user login
- Service account impersonation for backend operations
- Row-level security in MongoDB (user_id filtering enforced at query time)

### Network Security

- **Agent Engine**: Deployed with IAM-based access control
- **MongoDB Atlas**: IP allowlist (currently `0.0.0.0/0` for dev; tighten before demo if time permits)
- **Firebase Hosting**: HTTPS only
- **Cloud Run services** (MCP Server, change stream listener): Require authentication

### Data Privacy

- **Images in GCS**, not in MongoDB documents: portfolio bucket with IAM; URLs in `portfolio_entries`
- **MongoDB stores metadata + embeddings**: scores, Glass Box, EXIF, spatial fields, vectors — not binary image data
- **Gemini analysis**: uses GCS URI or short-lived signed URL
- **XMP export is client-side**: user downloads sidecars locally

---

## Scalability Considerations

### Current Scope (Hackathon)

- **Single user**: Demo photographer
- **~30-50 images**: Seed data + demo uploads
- **Atlas Flex tier**: Capped at $30/month, handles this scale easily
- **Agent Engine**: Pay-per-invocation, scales automatically
- **Firebase Hosting**: CDN-backed, scales for static content

### Post-Hackathon Growth Path

#### Multi-User

- Add Firebase Authentication
- Partition MongoDB by `user_id` (already in schema)
- Agent Engine scales horizontally (no changes needed)

#### Portfolio Growth

- **Vector search**: Atlas Vector Search scales to millions of vectors
- **Embeddings**: Batch generation for new users (bulk import flow)
- **Change stream listener**: Already async, handles burst inserts

#### Cost Optimization

- **Caching**: Add Redis or Memorystore for frequent portfolio queries
- **Embedding model**: Switch to Voyage AI (MongoDB-owned, potentially cheaper post-hackathon)
- **Agent Engine cold start**: Set min instances = 1 for production (costs ~$50/month, eliminates cold start latency)

#### Geographic Distribution

- **MongoDB Atlas**: Multi-region replication
- **Firebase Hosting**: Already CDN-backed globally
- **Agent Engine**: Deploy to multiple regions (requires Terraform config per region)

---

## Appendix: Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript + Vite | UI components, PWA |
| **Frontend Hosting** | Firebase Hosting | Static site CDN delivery |
| **Agent Runtime** | ADK (Agent Development Kit) | Agent framework (Python) |
| **Agent Deployment** | Vertex AI Agent Engine | Managed agent hosting |
| **AI Models** | Gemini 3 Pro (or best available) | Reasoning, multimodal analysis |
| **Embeddings** | Vertex AI `multimodalembedding@001` | 1408-dim image+text vectors |
| **Grounding** | Agent Builder Data Store | Photography principles knowledge base |
| **Database** | MongoDB Atlas (Flex tier) | Operational data, vectors, full-text search |
| **Vector Search** | Atlas Vector Search | Aesthetic similarity queries |
| **Full-Text Search** | Atlas Search | Glass Box content retrieval |
| **Real-Time Updates** | MongoDB Change Streams | Aesthetic profile background derivation |
| **Partner Integration** | MongoDB MCP Server | Orchestrator's primary data tool |
| **Auxiliary Services** | Cloud Run | MCP Server hosting, change stream listener |
| **Secrets** | Secret Manager | Credential storage |
| **Build Tool (Frontend)** | Vite | Fast dev server, optimized builds |
| **Package Manager (Backend)** | uv | Fast Python package management |
| **Infrastructure as Code** | Terraform (from Agent Starter Pack) | Reproducible deployments |

---

**End of Architecture Document**
