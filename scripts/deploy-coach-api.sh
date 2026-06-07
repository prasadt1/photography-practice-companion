#!/usr/bin/env bash
# Deploy Coach FastAPI to Cloud Run (no local Docker required — uses Cloud Build).
# Usage: ./scripts/deploy-coach-api.sh
# Optional: USE_LOCAL_DOCKER=1 if you have Docker and prefer local build.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT="${GOOGLE_CLOUD_PROJECT:-practice-companion-hackathon}"
REGION="${CLOUD_RUN_REGION:-us-central1}"
SERVICE="${CLOUD_RUN_SERVICE:-practice-companion-api}"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "ERROR: gcloud CLI not found. Install Google Cloud SDK." >&2
  exit 1
fi

# Runtime SA (from gcp-service-account.json) cannot push to Artifact Registry / Cloud Build.
check_gcloud_deploy_identity() {
  local active="${1}"
  if [[ "${ALLOW_RUNTIME_SA_DEPLOY:-}" == "1" ]]; then
    return 0
  fi
  if [[ "${active}" != *"gserviceaccount.com" ]]; then
    return 0
  fi
  echo "ERROR: gcloud is using the runtime service account:" >&2
  echo "  ${active}" >&2
  echo "" >&2
  echo "Deploy needs a user or deployer account (Artifact Registry + Cloud Build + Cloud Run)." >&2
  echo "The runtime key in gcp-service-account.json is for local Vertex/GCS only." >&2
  echo "" >&2
  echo "Fix — use your Google account for deploy:" >&2
  echo "  gcloud auth login" >&2
  echo "  gcloud config set account YOUR_EMAIL@gmail.com" >&2
  echo "  gcloud config set project ${PROJECT}" >&2
  echo "  ./scripts/deploy-coach-api.sh" >&2
  echo "" >&2
  echo "Other logged-in accounts:" >&2
  gcloud auth list 2>/dev/null | sed 's/^/  /' >&2 || true
  echo "" >&2
  echo "Keep GOOGLE_APPLICATION_CREDENTIALS in .env for the API; that does not change gcloud's active account." >&2
  exit 1
}

if [[ ! -f .env ]]; then
  echo "ERROR: .env not found. Copy .env.example to .env and set MONGODB_URI." >&2
  exit 1
fi

ENV_FILE="$(mktemp)"
trap 'rm -f "${ENV_FILE}"' EXIT

if ! python3 scripts/cloud-run-env-from-dotenv.py .env >"${ENV_FILE}"; then
  exit 1
fi

gcloud config set project "${PROJECT}" >/dev/null

if [[ -n "${DEPLOY_GCLOUD_ACCOUNT:-}" ]]; then
  gcloud config set account "${DEPLOY_GCLOUD_ACCOUNT}" >/dev/null
fi

ACTIVE_ACCOUNT="$(gcloud config get-value account 2>/dev/null || true)"
check_gcloud_deploy_identity "${ACTIVE_ACCOUNT}"
echo "Deploying as: ${ACTIVE_ACCOUNT}"

RUN_DEPLOY=(gcloud run deploy "${SERVICE}"
  --project="${PROJECT}"
  --region="${REGION}"
  --platform=managed
  --allow-unauthenticated
  --memory=1Gi
  --cpu=1
  --timeout=300
  --min-instances=0
  --max-instances=3
  --set-secrets="MONGODB_URI=mongodb-uri:latest"
  --env-vars-file="${ENV_FILE}")

deploy_source() {
  echo "Deploying ${SERVICE} via Cloud Build (no local Docker) ..."
  echo "  Source: ${ROOT} (Dockerfile at repo root)"
  "${RUN_DEPLOY[@]}" --source .
}

deploy_docker() {
  IMAGE="gcr.io/${PROJECT}/${SERVICE}"
  echo "Building ${IMAGE} with local Docker ..."
  docker build -t "${IMAGE}" .
  echo "Pushing ..."
  docker push "${IMAGE}"
  echo "Deploying ..."
  "${RUN_DEPLOY[@]}" --image="${IMAGE}"
}

if [[ "${USE_LOCAL_DOCKER:-}" == "1" ]]; then
  if ! command -v docker >/dev/null 2>&1; then
    echo "ERROR: USE_LOCAL_DOCKER=1 but docker not in PATH" >&2
    exit 1
  fi
  deploy_docker
else
  deploy_source
fi

URL="$(gcloud run services describe "${SERVICE}" --project="${PROJECT}" --region="${REGION}" --format='value(status.url)')"
echo ""
echo "Coach API URL: ${URL}"
echo "Health: ${URL}/health"
echo ""
echo "Next:"
echo "  API_URL=${URL} make deploy-hosting"
