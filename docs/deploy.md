# Deploy — Firebase Hosting + Cloud Run API

Judges need a **public URL**. The Vite dev proxy only works locally; production builds use `VITE_API_BASE_URL`.

## Architecture

```
Browser → Firebase Hosting (static React)
       → Cloud Run practice-companion-api (FastAPI: Coach + Mentor orchestrator chat)
       → MongoDB Atlas · Vertex AI · GCS · Agent Builder
```

Playground (`make playground`) stays **local** on port 8080.

## Prerequisites

- `gcloud` CLI authenticated, project `practice-companion-hackathon`
- **Deploy identity:** use **your Google user account**, not `id-practice-companion-runtime@...` (the runtime service account from `gcp-service-account.json` cannot access Artifact Registry / Cloud Build).

```bash
gcloud auth login
gcloud config set account YOUR_EMAIL@gmail.com   # not *gserviceaccount.com
gcloud config set project practice-companion-hackathon
gcloud auth list   # ACTIVE should be your @gmail.com / workspace email
```

If you previously ran `gcloud auth activate-service-account --key-file=gcp-service-account.json` for local Vertex tests, switch back to your user before deploy. Local API can still use `GOOGLE_APPLICATION_CREDENTIALS=./gcp-service-account.json` in `.env`.

- **Docker not required** — deploy uses **Cloud Build** (`gcloud run deploy --source .`)
- `firebase` CLI (`npm i -g firebase-tools && firebase login`)
- **Firebase enabled on the GCP project** (not automatic). `practice-companion-hackathon` must appear in [Firebase console](https://console.firebase.google.com/) with **Hosting** started (default site). Without this, `firebase deploy` fails with “no site name”.

  **One-time (browser):** Firebase console → Add project → *Add Firebase to existing GCP project* → `practice-companion-hackathon` → Build → Hosting → Get started.

  Check: `firebase hosting:sites:list --project practice-companion-hackathon` should show a site row (not empty).

  CLI (Owner only): `firebase projects:addfirebase practice-companion-hackathon`
- Secrets in `.env` (same as local dev). Deploy loads `.env` with **Python dotenv** (not `source`), so Atlas passwords with **`&`** work; quoting `MONGODB_URI='...'` in `.env` is still recommended.
- **Secret Manager** (optional): store `MONGODB_URI` in GCP and use `--set-secrets` instead of the generated env file for production.

Cloud Run service account needs roles:
- `roles/aiplatform.user`
- `roles/storage.objectAdmin` (portfolio bucket)
- `roles/discoveryengine.editor` or viewer (Data Store search)

## Phase 2 — Mentor chat on Cloud Run

Mentor Copilot uses `POST /api/v1/agent/chat` on the **same** Cloud Run service as Studio (`api/server.py`). No separate Agent Engine URL is required for the hackathon demo. Persona is stored in `users.persona` (`PATCH /api/v1/users/me`).

## 1. Deploy Coach API (Cloud Run)

```bash
chmod +x scripts/deploy-coach-api.sh
./scripts/deploy-coach-api.sh
```

First run may take several minutes (Cloud Build + container push). Enable APIs if prompted:
`run.googleapis.com`, `cloudbuild.googleapis.com`, `artifactregistry.googleapis.com`.

If build fails with **`975418990849-compute@developer.gserviceaccount.com`** and `run-sources` / storage permission denied, run once (as project Owner):

```bash
chmod +x scripts/grant-cloud-build-deploy-iam.sh
./scripts/grant-cloud-build-deploy-iam.sh
```

Wait ~2 minutes, then `./scripts/deploy-coach-api.sh` again.

Note the URL printed, e.g. `https://practice-companion-api-xxxxx.us-central1.run.app`.

Verify: `curl https://YOUR-URL/health` → `{"status":"ok","phase":"3"}`

## 2. Build frontend with API URL

```bash
export API_URL=https://YOUR-CLOUD-RUN-URL   # no trailing slash
make deploy-hosting
```

`make deploy-hosting` runs `scripts/frontend-build-prod.sh`, which sets `VITE_API_BASE_URL` and, when present in `.env`, injects `VITE_FIREBASE_*` for Google sign-in on the hosted build.

Or manually:

```bash
export API_URL=https://YOUR-CLOUD-RUN-URL
bash scripts/frontend-build-prod.sh
firebase deploy --only hosting
```

## 3. Open the app

- `https://practice-companion-hackathon.web.app`  
- or Firebase console → Hosting URL

Ensure `CORS_ORIGINS` on Cloud Run includes your Firebase domain (deploy script adds `*.web.app` and `*.firebaseapp.com`).

### Firebase Google sign-in (multi-user demo)

1. **Web app** (once per project): Firebase console → Project settings → Your apps → Web, or CLI:
   ```bash
   firebase apps:create WEB "Iris Practice Companion" --project practice-companion-hackathon
   ```
2. **Sync Vite env into `.env`** (does not commit secrets):
   ```bash
   bash scripts/sync-firebase-vite-env.sh
   ```
   Writes `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`.
3. **Enable Google provider**: [Firebase Console → Authentication](https://console.firebase.google.com/project/practice-companion-hackathon/authentication/providers) → Sign-in method → **Google** → Enable → Save. Add a support email if prompted.
4. **Authorized domains** (usually auto): Authentication → Settings → Authorized domains should include `practice-companion-hackathon.web.app` and `localhost`.
5. **Redeploy hosting** so the build embeds the keys: `API_URL=https://YOUR-RUN-URL make deploy-hosting`.
6. **Verify**: open Settings on the hosted app → **Sign in with Google** (not “Firebase web keys are not configured”).

## Local dev (unchanged)

| Service | Command | URL |
|---------|---------|-----|
| API | `make api-dev` | http://127.0.0.1:8081 |
| UI | `make frontend-dev` | http://localhost:5173 |
| Playground | `make playground` | http://localhost:8080 |

`VITE_API_BASE_URL` empty → Vite proxies `/api` to 8081.

## Demo seed on production

```bash
# From your machine (uses .env MONGODB_URI)
make seed-demo
```

Set `DEMO_USER_ID=6577a1f2b3c4d5e6f7a8b9c0` on Cloud Run env for consistent Memory/Practice.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS error in browser | Add Firebase URL to `CORS_ORIGINS` on Cloud Run, redeploy |
| Analysis 500 | Cloud Run logs: `gcloud run logs read practice-companion-api --region us-central1` |
| `artifactregistry.repositories.get` denied as `id-practice-companion-runtime@...` | `gcloud config set account YOUR_EMAIL` then redeploy (see Prerequisites) |
| Build failed: `compute@developer.gserviceaccount.com` / `run-sources` storage | `./scripts/grant-cloud-build-deploy-iam.sh` then redeploy |
| Memory thumbnails empty for Studio uploads (seed Unsplash OK) | `./scripts/grant-cloud-run-gcs-signing.sh` then redeploy API (`make deploy-api`) |
| Empty Memory | `DEMO_USER_ID` + `make seed-demo` |
| Camera on Firebase | Field tab needs HTTPS — works on Firebase Hosting |
| `nosite name or target name` on `firebase deploy` | Firebase not linked or Hosting never enabled — see Prerequisites above |
| `projects:addfirebase` 403 | Use Firebase console to add the project, or get Owner on GCP |

## MongoDB MCP Server (consolidation item 3 — hosted reads)

Separate Cloud Run service; Coach API calls it over Streamable HTTP (IAM + API key). **`min_instances=1`** avoids cold-start during demos.

```bash
chmod +x scripts/deploy-mongodb-mcp.sh scripts/verify_mcp_in_production.sh
./scripts/deploy-mongodb-mcp.sh
```

Add printed `MONGODB_MCP_HTTP_URL` and `MONGODB_MCP_API_KEY` to `.env`, then:

```bash
MONGODB_MCP_ALLOW_PYMONGO_FALLBACK=false
./scripts/deploy-coach-api.sh
./scripts/verify_mcp_in_production.sh
```

Capture a Cloud Trace screenshot with spans `mongodb.mcp.find` / `mongodb.mcp.aggregate` for Devpost.

See [`docs/mcp-primary-judge-path.md`](mcp-primary-judge-path.md).

## Change-stream listener (aesthetic_profile)

Reactive profile updates when `portfolio_entries` change (consolidation item 2).

```bash
# Local (requires MONGODB_URI + change stream permissions on Atlas)
cd app && uv run python ../services/change-stream-listener/main.py
```

**Cloud Run (min_instances=1):**

`gcloud run deploy --source` does **not** support `--dockerfile`. The listener Dockerfile copies `app/` from the **repo root** — build with Cloud Build, then deploy by image:

```bash
chmod +x scripts/deploy-change-stream-listener.sh
./scripts/deploy-change-stream-listener.sh
```

Manual equivalent:

```bash
gcloud config set project practice-companion-hackathon
gcloud config set account your.real.email@gmail.com   # not YOUR_USER@gmail.com, not *gserviceaccount.com

gcloud builds submit . \
  --config=services/change-stream-listener/cloudbuild.yaml

python3 scripts/cloud-run-env-from-dotenv.py .env | grep -E '^(MONGODB_URI|MONGODB_DB_NAME):' > /tmp/listener-env.yaml
echo 'CHANGE_STREAM_DEBOUNCE_SEC: "5"' >> /tmp/listener-env.yaml

gcloud run deploy change-stream-listener \
  --image gcr.io/practice-companion-hackathon/change-stream-listener:latest \
  --region us-central1 \
  --min-instances 1 \
  --no-allow-unauthenticated \
  --env-vars-file=/tmp/listener-env.yaml
```

Optional Secret Manager (only after `gcloud secrets create mongodb-uri ...`):

```bash
--set-secrets MONGODB_URI=mongodb-uri:latest
```

Verify:

```bash
gcloud run services logs read change-stream-listener --region=us-central1 --limit=30
```

Upload on prod → within ~10s `aesthetic_profile.computed_at` advances for that `user_id` (one doc per user, not a growing collection).

The listener exposes `GET /health` on `PORT` (8080) so Cloud Run accepts the container; change-stream work runs in a background thread.

## Not in this deploy

- Vertex Agent Engine (`make deploy` from ADK scaffold) — optional; playground + Cloud Run API suffice for UI demo
