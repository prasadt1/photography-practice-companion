# Practice Companion - Infrastructure & Deployment

> **Canonical:** [`spec.md`](spec.md) §0, §11 · **Atlas/MCP:** [`mongodb-setup.md`](mongodb-setup.md) · **ADRs:** [`decisions.md`](decisions.md)

**Version:** 1.1
**Date:** May 24, 2026
**Status:** Design (aligned with spec v3)

---

## Table of Contents

1. [Infrastructure Overview](#infrastructure-overview)
2. [Google Cloud Resources](#google-cloud-resources)
3. [MongoDB Atlas Configuration](#mongodb-atlas-configuration)
4. [Deployment Architecture](#deployment-architecture)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Environment Management](#environment-management)
7. [Monitoring & Observability](#monitoring--observability)
8. [Disaster Recovery](#disaster-recovery)
9. [Cost Optimization](#cost-optimization)

---

## Infrastructure Overview

### Stack Summary

| Component | Technology | Deployment Target | Cost Model |
|-----------|-----------|-------------------|------------|
| **Frontend** | React/TypeScript/Vite | Firebase Hosting | CDN bandwidth |
| **Agent Runtime** | ADK (Python) | Vertex AI Agent Engine | Per-invocation |
| **AI Models** | Gemini 3 Pro | Vertex AI | Per-token |
| **Embeddings** | multimodalembedding@001 | Vertex AI | Per-embedding |
| **Grounding** | Data Store | Agent Builder | Per-query |
| **Database** | MongoDB Atlas | Flex tier | Capped at $30/month |
| **Change Stream Listener** | Python/PyMongo | Cloud Run | Always-on ($5-10/month) |
| **MCP Server** | Node.js | Cloud Run (optional) | Per-request |
| **Secrets** | Google Cloud | Secret Manager | Per-secret + access |
| **Storage** | Cloud Storage (principles + portfolio images) | Google Cloud | Per-GB + ops |
| **CI/CD** | GitHub Actions | GitHub | Free tier |

### Regional layout

| Service | Region | Notes |
|---------|--------|--------|
| MongoDB Atlas Flex | GCP **`europe-west3`** | Only GCP region available for this Atlas project |
| Vertex AI, Agent Engine, GCS, Firebase | **`us-central1`** | Hackathon default |

Cross-region latency applies to Atlas calls from Agent Engine. See [ADR-001](decisions.md#adr-001-mongodb-atlas-region-is-europe-west3-only).

### Total Estimated Cost (Hackathon Period)

| Item | Estimate |
|------|----------|
| MongoDB Atlas Flex | $8-15 |
| Agent Engine | $10-20 (light usage) |
| Gemini API calls | $15-30 (covered by credit) |
| Firebase Hosting | $0 (under free tier) |
| Cloud Run (listener) | $5-10 |
| Cloud Storage | $1-2 |
| Secret Manager | <$1 |
| **Total** | **~$40-80** |
| **Available Credit** | **$1,000 GenAI App Builder** |
| **Net Cost** | **$0** (fully covered) |

---

## Google Cloud Resources

### Project Structure

```
practice-companion-hackathon/
├─ Compute
│  ├─ Vertex AI Agent Engine
│  │  └─ practice_companion_orchestrator
│  ├─ Cloud Run (us-central1)
│  │  ├─ aesthetic-profile-listener (min-instances=1)
│  │  └─ mongodb-mcp-server (optional)
│  └─ Cloud Build (CI/CD builds)
│
├─ AI & ML
│  ├─ Vertex AI
│  │  ├─ Gemini models
│  │  └─ Multimodal embeddings
│  └─ Agent Builder
│     └─ Data Store: photography-principles
│
├─ Storage
│  ├─ Cloud Storage
│  │  └─ practice-companion-principles (principles Markdown files)
│  └─ Secret Manager
│     ├─ MONGODB_URI
│     ├─ MONGODB_ATLAS_CLIENT_SECRET
│     └─ [other secrets]
│
├─ Hosting
│  └─ Firebase Hosting
│     └─ practice-companion-hackathon (frontend)
│
└─ Networking
   └─ VPC (default, no custom config needed)
```

### Vertex AI Agent Engine

**Resource**: `projects/practice-companion-hackathon/locations/us-central1/agents/practice_companion_orchestrator`

**Configuration**:
```yaml
agent:
  name: practice_companion_orchestrator
  model: gemini-pro  # or best available
  location: us-central1
  tools:
    - mongodb_mcp
    - data_store_grounding
    - atlas_search
    - coach_agent
    - planner_agent
    - reflection_agent
```

**Scaling**:
- Auto-scales based on request rate
- Cold start: ~5-10 seconds (first request after idle)
- Warm: <1 second response time
- For demo: set `min-instances=1` to eliminate cold start

**Cost**:
- Pay-per-invocation
- Billed by Agent Engine runtime + Gemini API calls
- Covered by $1,000 credit

### Cloud Run Services

#### aesthetic-profile-listener

**Purpose**: Subscribes to MongoDB change streams, recomputes aesthetic profiles.

**Configuration**:
```yaml
service: aesthetic-profile-listener
region: us-central1
image: gcr.io/practice-companion-hackathon/aesthetic-profile-listener:latest
env:
  - MONGODB_URI: ${SECRET:MONGODB_URI}
cpu: 1
memory: 512Mi
min-instances: 1  # Always-on listener
max-instances: 1  # No need for >1
timeout: 300s
```

**Cost**: ~$5-10/month (always-on with min-instances=1)

#### mongodb-mcp-server (optional)

**Purpose**: Standalone MCP server for orchestrator tool access.

**Configuration**:
```yaml
service: mongodb-mcp-server
region: us-central1
image: gcr.io/practice-companion-hackathon/mongodb-mcp-server:latest
env:
  - MDB_MCP_CONNECTION_STRING: ${SECRET:MONGODB_URI}
  - MDB_MCP_API_CLIENT_ID: ${SECRET:MONGODB_ATLAS_CLIENT_ID}
  - MDB_MCP_API_CLIENT_SECRET: ${SECRET:MONGODB_ATLAS_CLIENT_SECRET}
cpu: 1
memory: 256Mi
min-instances: 0  # Scale to zero
max-instances: 10
```

**Alternative**: Sidecar pattern in Agent Engine container (simplifies deployment, no separate service).

### Cloud Storage

#### Bucket: `gs://practice-companion-principles`

**Purpose:** Source files for Agent Builder Data Store import (`principles/*.md`).

- Location: `us-central1`
- Public access: No (Discovery Engine service agent has `objectViewer`)

#### Bucket: `gs://practice-companion-portfolio`

**Purpose:** Portfolio originals and thumbnails ([ADR-002](decisions.md#adr-002-store-images-in-gcs-metadata-in-mongodb)).

- Location: `us-central1`
- Layout: `originals/{user_id}/{entry_id}.jpg`, `thumbnails/{user_id}/{entry_id}.jpg`
- Access: Private; Coach/agents use `gs://` URIs or V4 signed URLs for Gemini
- MongoDB `portfolio_entries` stores URLs only

**Cost**: ~$1–2/month at hackathon scale (<1 GB)

### Secret Manager

**Secrets**:
- `MONGODB_URI`: MongoDB Atlas connection string
- `MONGODB_ATLAS_CLIENT_ID`: Atlas service account client ID
- `MONGODB_ATLAS_CLIENT_SECRET`: Atlas service account client secret
- `GCP_SERVICE_ACCOUNT_KEY` (if needed for CI/CD)

**Access**:
- Agent Engine deployment references secrets
- Cloud Run services reference secrets via env vars
- CI/CD reads secrets for deployment

**Cost**: ~$0.06/secret/month + $0.03 per 10K accesses

### Firebase Hosting

**Site**: `practice-companion-hackathon.web.app` (or custom domain if configured)

**Configuration**:
```json
{
  "hosting": {
    "public": "frontend/dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

**Features**:
- CDN-backed (global)
- HTTPS automatic
- SPA routing (`destination: /index.html`)
- Service worker support (PWA)

**Cost**: Free tier (up to 10 GB bandwidth, 360 MB storage)

---

## MongoDB Atlas Configuration

### Cluster Details

**Cluster**: `practice-photography-companion-mvp-cluster` (Flex tier — **confirmed**)
**Host**: `practice-photography-companion-m.e5tn2tc.mongodb.net`
**Region**: GCP **`europe-west3`** (Belgium — only region available for this project)
**Tier**: Flex (capped at $30/month, typically $8–15 for hackathon usage)

**Why Flex**:
- Vector Search requires Flex+ tier
- Atlas Search requires Flex+ tier
- Change Streams require Flex+ tier
- Capped monthly cost (no runaway bills)

### Database: `practice_companion`

**Collections**:
| Collection | Indexes | Size Estimate (Hackathon) |
|------------|---------|---------------------------|
| `users` | `_id` | <1 KB (1 user) |
| `portfolio_entries` | `_id`, `(user_id, created_at)`, `shoot_id`, vector index (1408-dim), Atlas Search index | ~500 KB (30 images × 15 KB/doc) |
| `assignments` | `_id`, `(user_id, status)` | ~5 KB (2 assignments) |
| `conversations` | `_id`, `(user_id, last_active)` | ~10 KB (light usage) |
| `aesthetic_profile` | `_id`, `user_id` | <1 KB (1 profile) |

**Total Database Size**: <1 MB

### Vector Index Configuration

**Collection**: `portfolio_entries`
**Field**: `embedding`

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1408,
      "similarity": "cosine"
    }
  ]
}
```

### Atlas Search Index Configuration

**Collection**: `portfolio_entries`
**Index Name**: `glass_box_search`

```json
{
  "mappings": {
    "fields": {
      "glass_box": {
        "fields": {
          "observations": { "type": "string" },
          "reasoning_steps": { "type": "string" },
          "priority_fixes": {
            "fields": {
              "issue": { "type": "string" }
            }
          }
        }
      },
      "aesthetic_tags": { "type": "string" }
    }
  }
}
```

### Change Stream

**Watched Collection**: `portfolio_entries`
**Filter**: `{ "operationType": "insert" }`
**Consumer**: `aesthetic-profile-listener` (Cloud Run service)

**Resume Token**: Stored in listener state (allows restart without reprocessing)

### Network Security

**IP Allowlist**: `0.0.0.0/0` (dev)
**For Production** (if time permits before demo): Restrict to:
- Agent Engine egress IPs
- Cloud Run service IPs
- Prasad's dev machine IP

**Connection String**: Uses `retryWrites=true&w=majority` for durability.

---

## Deployment Architecture

### Deployment Environments

| Environment | Purpose | Deployed To | Data |
|-------------|---------|-------------|------|
| **Local Dev** | Development, testing | `localhost` | Seed data or empty |
| **Production** | Demo, judging | Agent Engine + Firebase Hosting | Seed data (demo-ready) |

**Hackathon Scope**: No staging environment (single prod environment).

### Deployment Flow

```
┌─────────────────────┐
│  Developer (Prasad) │
│   or Claude Code    │
└──────────┬──────────┘
           │
           │ git push
           │
    ┌──────▼──────────────┐
    │  GitHub (main)      │
    │  Triggers CI/CD     │
    └──────┬──────────────┘
           │
           │ GitHub Actions
           │
    ┌──────▼──────────────┐
    │  Build & Test       │
    │  - Backend: uv sync │
    │  - Frontend: npm build
    └──────┬──────────────┘
           │
           │ Deploy
           ├─────────────────────────┬──────────────────────┐
           │                         │                      │
    ┌──────▼──────────┐      ┌──────▼─────────┐   ┌───────▼────────┐
    │ Agent Engine    │      │ Cloud Run      │   │ Firebase       │
    │ (make deploy)   │      │ (gcloud run    │   │ Hosting        │
    │                 │      │  deploy)       │   │ (firebase      │
    │                 │      │                │   │  deploy)       │
    └─────────────────┘      └────────────────┘   └────────────────┘
```

### Backend Deployment (Agent Engine)

**Command**:
```bash
make deploy
# Or: agent_starter_pack deploy
```

**What It Does**:
1. Builds Python package (uv)
2. Uploads to GCP
3. Deploys to Vertex AI Agent Engine via Terraform
4. Registers orchestrator with tools
5. Outputs endpoint URL

**Terraform** (generated by Agent Starter Pack):
- `deployment/terraform/agent_engine.tf`
- Manages Agent Engine resource
- References secrets from Secret Manager
- Configures IAM permissions

**Verification**:
```bash
curl -X POST https://<agent-engine-endpoint>/v1/chat \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -d '{"message": "Hello"}'
```

### Frontend Deployment (Firebase Hosting)

**Command**:
```bash
cd frontend
npm run build
firebase deploy --only hosting
```

**Build Output**: `frontend/dist/` (optimized static files)

**Deployed URL**: `https://practice-companion-hackathon.web.app`

**Verification**: Open URL, verify app loads.

### Cloud Run Services Deployment

**Change Stream Listener**:
```bash
cd change_stream_listener
gcloud builds submit --tag gcr.io/$GOOGLE_CLOUD_PROJECT/aesthetic-profile-listener
gcloud run deploy aesthetic-profile-listener \
  --image gcr.io/$GOOGLE_CLOUD_PROJECT/aesthetic-profile-listener \
  --region us-central1 \
  --min-instances=1 \
  --set-env-vars MONGODB_URI=$MONGODB_URI \
  --allow-unauthenticated=false
```

**MCP Server** (if deploying separately):
```bash
cd backend_aux/mongodb_mcp_server
gcloud builds submit --tag gcr.io/$GOOGLE_CLOUD_PROJECT/mongodb-mcp-server
gcloud run deploy mongodb-mcp-server \
  --image gcr.io/$GOOGLE_CLOUD_PROJECT/mongodb-mcp-server \
  --region us-central1 \
  --min-instances=0 \
  --max-instances=10 \
  --set-env-vars MDB_MCP_CONNECTION_STRING=$MONGODB_URI,MDB_MCP_API_CLIENT_ID=$ATLAS_CLIENT_ID,MDB_MCP_API_CLIENT_SECRET=$ATLAS_CLIENT_SECRET
```

---

## CI/CD Pipeline

### GitHub Actions Workflows

**Location**: `.github/workflows/`

#### `backend-deploy.yml`

**Trigger**: Push to `main` branch, changes in `app/` or `deployment/`

**Steps**:
1. Checkout code
2. Authenticate with GCP (service account key from GitHub Secrets)
3. Install `uv`
4. Run tests (`pytest app/eval/`)
5. Deploy to Agent Engine (`make deploy`)
6. Post-deployment smoke test (call endpoint, verify response)

**Secrets** (GitHub Secrets):
- `GCP_SERVICE_ACCOUNT_KEY`
- `MONGODB_URI`
- `MONGODB_ATLAS_CLIENT_ID`
- `MONGODB_ATLAS_CLIENT_SECRET`

#### `frontend-deploy.yml`

**Trigger**: Push to `main` branch, changes in `frontend/`

**Steps**:
1. Checkout code
2. Install Node.js
3. Install dependencies (`npm install`)
4. Build (`npm run build`)
5. Deploy to Firebase Hosting (`firebase deploy --only hosting`)

**Secrets**:
- `FIREBASE_TOKEN` (generated via `firebase login:ci`)

#### `cloud-run-deploy.yml`

**Trigger**: Push to `main` branch, changes in `change_stream_listener/`

**Steps**:
1. Checkout code
2. Authenticate with GCP
3. Build Docker image (`gcloud builds submit`)
4. Deploy to Cloud Run (`gcloud run deploy`)
5. Verify service is running

---

## Environment Management

### Local Development

**Backend**:
```bash
# Activate virtual environment
uv sync
source .venv/bin/activate  # or: .venv\Scripts\activate (Windows)

# Run playground
make playground

# Run tests
pytest app/eval/
```

**Frontend**:
```bash
cd frontend
npm install
npm run dev  # Vite dev server on http://localhost:5173
```

**Environment Variables**: `.env` file (gitignored)

### Production

**Backend**: Agent Engine deployment reads secrets from Secret Manager.

**Frontend**: Build-time env vars injected via `.env.production`:
```
VITE_API_BASE_URL=https://<agent-engine-endpoint>
```

**Cloud Run**: Env vars set via `--set-env-vars` flag or Secret Manager references.

---

## Monitoring & Observability

### Agent Engine Logs

**View**:
```bash
gcloud logging read "resource.type=vertex_ai_agent_engine AND resource.labels.agent_id=practice_companion_orchestrator" --limit 50
```

**Metrics**:
- Request count
- Latency (p50, p95, p99)
- Error rate
- Token usage (Gemini API)

**Dashboard**: Google Cloud Console → Vertex AI → Agent Engine → Metrics

### Cloud Run Logs

**View**:
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=aesthetic-profile-listener" --limit 50
```

**Metrics**:
- Request count (for MCP server)
- Change stream events processed (for listener)
- Errors

**Alerts** (optional):
- Error rate >5%
- Change stream listener crash (no heartbeat for >5 minutes)

### MongoDB Atlas Monitoring

**Dashboard**: Atlas UI → Metrics tab

**Metrics**:
- Query performance (slow queries)
- Index usage
- Connections (current, max)
- Storage size
- Change stream lag

**Alerts**:
- Query performance degradation
- Connection limit approaching
- Storage approaching tier limit

### Firebase Hosting

**Metrics**: Firebase Console → Hosting → Usage

- Requests (total, per day)
- Bandwidth
- CDN cache hit rate

---

## Disaster Recovery

### Backup Strategy

**MongoDB Atlas**:
- Automated backups (Flex tier includes continuous backups)
- Retention: 2 days
- Point-in-time restore available

**Agent Code**:
- Versioned in Git (GitHub)
- Tagged releases (`v1.0-demo`, etc.)

**Frontend**:
- Versioned in Git
- Firebase Hosting preserves previous deployments (can rollback)

**Secrets**:
- Backed up in password manager (Prasad's responsibility)
- Secret Manager has audit logs (can recreate if needed)

### Rollback Procedures

**Agent Engine**:
```bash
# Deploy previous version
git checkout v1.0-demo
make deploy
```

**Frontend**:
```bash
firebase hosting:rollback  # Rollback to previous release
```

**Cloud Run**:
```bash
# Deploy previous image
gcloud run deploy aesthetic-profile-listener --image gcr.io/.../aesthetic-profile-listener:previous-tag
```

### Failure Scenarios

| Scenario | Impact | Recovery |
|----------|--------|----------|
| Agent Engine crash | Users can't upload/analyze | Check logs, redeploy, rollback if needed |
| MongoDB Atlas outage | No data access | Wait for Atlas recovery (SLA: 99.95% uptime) |
| Change stream listener crash | Aesthetic profile doesn't update | Restart listener, backfill missed events |
| Firebase Hosting outage | Frontend inaccessible | Wait for Firebase recovery (SLA: 99.95%) |
| Gemini API quota exceeded | Agent can't analyze | Wait for quota reset, request increase |

---

## Cost Optimization

### During Hackathon

**Agent Engine**:
- Use default auto-scaling (min-instances=0 except during demo)
- For demo recording: set min-instances=1 to avoid cold start

**Cloud Run**:
- Change stream listener: min-instances=1 (necessary for always-on)
- MCP server (if separate): min-instances=0 (scale to zero when idle)

**MongoDB Atlas**:
- Flex tier caps cost at $30/month
- Expected: $8-15 for hackathon usage
- No optimization needed

**Firebase Hosting**:
- Free tier sufficient
- No optimization needed

**Gemini API**:
- Covered by $1,000 credit
- If approaching limit: reduce test iterations, use smaller prompts

### Post-Hackathon

**If Continuing Development**:
- Agent Engine: Keep min-instances=0, use cache for frequent queries
- MongoDB Atlas: Stay on Flex tier until >5 GB data
- Consider batching embedding generation (reduce Vertex AI calls)
- Add Redis/Memorystore for caching portfolio queries

**If Shutting Down**:
- Delete Agent Engine deployment
- Stop Cloud Run services
- Pause MongoDB Atlas cluster (or delete)
- Keep Firebase Hosting (free)
- Keep GitHub repo (free)

---

## Appendix: Deployment Checklist

### Pre-Deployment

- [ ] All code committed to Git
- [ ] Secrets in Secret Manager
- [ ] `.env` file NOT in Git (verified in `.gitignore`)
- [ ] Tests passing locally
- [ ] MongoDB schema created, seed data loaded

### Backend Deployment

- [ ] `make deploy` succeeds
- [ ] Agent Engine endpoint URL noted
- [ ] Smoke test: call endpoint, verify response
- [ ] Logs show no errors

### Frontend Deployment

- [ ] `VITE_API_BASE_URL` set to Agent Engine endpoint
- [ ] `npm run build` succeeds
- [ ] `firebase deploy --only hosting` succeeds
- [ ] Open Firebase URL, verify app loads
- [ ] Test upload flow end-to-end

### Cloud Run Deployment

- [ ] Change stream listener deployed, min-instances=1
- [ ] Listener logs show change stream connected
- [ ] Test: upload image, verify aesthetic profile updates

### Final Verification

- [ ] End-to-end flow works in production
- [ ] Demo video can be recorded with production deployment
- [ ] All URLs (frontend, backend) work publicly
- [ ] No secrets exposed in logs or code

---

**End of Infrastructure & Deployment Document**
