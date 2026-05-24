# Deploy — Firebase Hosting + Cloud Run API

Judges need a **public URL**. The Vite dev proxy only works locally; production builds use `VITE_API_BASE_URL`.

## Architecture

```
Browser → Firebase Hosting (static React)
       → Cloud Run practice-companion-api (FastAPI / Coach)
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

Or manually:

```bash
cd frontend
VITE_API_BASE_URL=https://YOUR-CLOUD-RUN-URL npm run build
cd ..
firebase deploy --only hosting
```

## 3. Open the app

- `https://practice-companion-hackathon.web.app`  
- or Firebase console → Hosting URL

Ensure `CORS_ORIGINS` on Cloud Run includes your Firebase domain (deploy script adds `*.web.app` and `*.firebaseapp.com`).

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

## Not in this deploy

- Vertex Agent Engine (`make deploy` from ADK scaffold) — optional; playground + Cloud Run API suffice for UI demo
- Change-stream listener — Phase 4 buffer
