#!/usr/bin/env bash
# Deploy change-stream-listener to Cloud Run (repo-root Docker context).
# Usage: ./scripts/deploy-change-stream-listener.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT="${GOOGLE_CLOUD_PROJECT:-practice-companion-hackathon}"
REGION="${CLOUD_RUN_REGION:-us-central1}"
SERVICE="${CHANGE_STREAM_SERVICE:-change-stream-listener}"
IMAGE="gcr.io/${PROJECT}/${SERVICE}:latest"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "ERROR: gcloud CLI not found." >&2
  exit 1
fi

ACTIVE="$(gcloud config get-value account 2>/dev/null || true)"
if [[ "${ACTIVE}" == *"gserviceaccount.com" ]] && [[ "${ALLOW_RUNTIME_SA_DEPLOY:-}" != "1" ]]; then
  echo "ERROR: gcloud account is a service account. Run: gcloud auth login" >&2
  exit 1
fi
if [[ "${ACTIVE}" == *"YOUR_USER"* ]] || [[ -z "${ACTIVE}" ]]; then
  echo "ERROR: Run: gcloud auth login && gcloud config set account <email-with-project-access>" >&2
  exit 1
fi
echo "Using gcloud account: ${ACTIVE}"

gcloud config set project "${PROJECT}"

echo "Building ${IMAGE} (cloudbuild.yaml, repo root context)..."
gcloud builds submit . \
  --config=services/change-stream-listener/cloudbuild.yaml \
  --project="${PROJECT}"

ENV_FILE="$(mktemp)"
python3 scripts/cloud-run-env-from-dotenv.py .env | grep -E '^(MONGODB_URI|MONGODB_DB_NAME):' > "${ENV_FILE}"
echo 'CHANGE_STREAM_DEBOUNCE_SEC: "5"' >> "${ENV_FILE}"

echo "Deploying ${SERVICE} to ${REGION} (min-instances=1)..."
gcloud run deploy "${SERVICE}" \
  --image "${IMAGE}" \
  --region "${REGION}" \
  --platform managed \
  --min-instances 1 \
  --max-instances 1 \
  --cpu 1 \
  --memory 512Mi \
  --timeout 300 \
  --no-allow-unauthenticated \
  --env-vars-file "${ENV_FILE}"

rm -f "${ENV_FILE}"

echo ""
echo "Verify logs:"
echo "  gcloud run services logs read ${SERVICE} --region=${REGION} --limit=30"
echo "Look for: Listening on portfolio_entries change stream"
