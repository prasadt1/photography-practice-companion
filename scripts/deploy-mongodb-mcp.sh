#!/usr/bin/env bash
# Deploy MongoDB MCP Server (Streamable HTTP) to Cloud Run.
# Usage: ./scripts/deploy-mongodb-mcp.sh
# Then redeploy Coach API with MONGODB_MCP_HTTP_URL from output.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT="${GOOGLE_CLOUD_PROJECT:-practice-companion-hackathon}"
REGION="${CLOUD_RUN_REGION:-us-central1}"
SERVICE="${MONGODB_MCP_SERVICE:-mongodb-mcp}"
COACH_SERVICE="${CLOUD_RUN_SERVICE:-practice-companion-api}"
IMAGE="gcr.io/${PROJECT}/${SERVICE}:latest"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "ERROR: gcloud CLI not found." >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "ERROR: .env not found (need MONGODB_URI)." >&2
  exit 1
fi

# Do not `source .env` — passwords with & # ! break bash. Use dotenv (same as deploy-coach-api.sh).
load_dotenv_var() {
  python3 - "$1" <<'PY'
import os
import sys
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:
    print("ERROR: pip install python-dotenv", file=sys.stderr)
    raise SystemExit(1)

load_dotenv(Path(".env"))
print(os.getenv(sys.argv[1], "").strip())
PY
}

MONGODB_URI="$(load_dotenv_var MONGODB_URI)"
MONGODB_MCP_API_KEY="$(load_dotenv_var MONGODB_MCP_API_KEY)"

if [[ -z "${MONGODB_URI}" ]] && [[ -f mcp-config.json ]]; then
  MONGODB_URI="$(python3 - <<'PY'
import json
from pathlib import Path
cfg = json.loads(Path("mcp-config.json").read_text(encoding="utf-8"))
srv = (cfg.get("mcpServers") or {}).get("mongodb-mcp-server") or {}
print((srv.get("env") or {}).get("MDB_MCP_CONNECTION_STRING", "").strip())
PY
)"
fi

if [[ -z "${MONGODB_URI}" ]]; then
  echo "ERROR: MONGODB_URI not set in .env (or MDB_MCP_CONNECTION_STRING in mcp-config.json)." >&2
  echo "Tip: quote the URI in .env if it contains & — see .env.example" >&2
  exit 1
fi

if [[ -z "${MONGODB_MCP_API_KEY}" ]]; then
  MONGODB_MCP_API_KEY="$(openssl rand -hex 24)"
  echo "Generated MONGODB_MCP_API_KEY (add to .env): ${MONGODB_MCP_API_KEY}"
fi

ACTIVE="$(gcloud config get-value account 2>/dev/null || true)"
if [[ "${ACTIVE}" == *"gserviceaccount.com" ]] && [[ "${ALLOW_RUNTIME_SA_DEPLOY:-}" != "1" ]]; then
  echo "ERROR: gcloud account is a service account. Run: gcloud auth login" >&2
  exit 1
fi
echo "Using gcloud account: ${ACTIVE}"
gcloud config set project "${PROJECT}" >/dev/null

echo "Building ${IMAGE}..."
gcloud builds submit . --config=services/mongodb-mcp/cloudbuild.yaml --project="${PROJECT}"

ENV_FILE="$(mktemp)"
trap 'rm -f "${ENV_FILE}"' EXIT
{
  echo "MDB_MCP_CONNECTION_STRING: \"${MONGODB_URI}\""
  echo "MONGODB_MCP_API_KEY: \"${MONGODB_MCP_API_KEY}\""
  echo "MDB_MCP_READ_ONLY: \"true\""
  echo "MDB_MCP_HTTP_RESPONSE_TYPE: \"json\""
} > "${ENV_FILE}"

echo "Deploying ${SERVICE} (min-instances=1, authenticated)..."
gcloud run deploy "${SERVICE}" \
  --image "${IMAGE}" \
  --region "${REGION}" \
  --platform managed \
  --min-instances 1 \
  --max-instances 2 \
  --cpu 1 \
  --memory 1Gi \
  --timeout 300 \
  --port 8080 \
  --no-allow-unauthenticated \
  --env-vars-file "${ENV_FILE}"

MCP_BASE="$(gcloud run services describe "${SERVICE}" --region="${REGION}" --format='value(status.url)')"
MCP_URL="${MCP_BASE%/}/mcp"

COACH_SA="$(gcloud run services describe "${COACH_SERVICE}" --region="${REGION}" --format='value(spec.template.spec.serviceAccountName)' 2>/dev/null || true)"
if [[ -z "${COACH_SA}" ]]; then
  PROJECT_NUM="$(gcloud projects describe "${PROJECT}" --format='value(projectNumber)')"
  COACH_SA="${PROJECT_NUM}-compute@developer.gserviceaccount.com"
fi

echo "Granting roles/run.invoker on ${SERVICE} to ${COACH_SA}..."
gcloud run services add-iam-policy-binding "${SERVICE}" \
  --region="${REGION}" \
  --member="serviceAccount:${COACH_SA}" \
  --role="roles/run.invoker" \
  --quiet

echo ""
echo "=== MongoDB MCP deployed ==="
echo "MONGODB_MCP_HTTP_URL=${MCP_URL}"
echo "MONGODB_MCP_API_KEY=${MONGODB_MCP_API_KEY}"
echo ""
echo "Add to .env, then redeploy Coach API:"
echo "  MONGODB_MCP_HTTP_URL=${MCP_URL}"
echo "  MONGODB_MCP_API_KEY=${MONGODB_MCP_API_KEY}"
echo "  MONGODB_MCP_ALLOW_PYMONGO_FALLBACK=false"
echo "  ./scripts/deploy-coach-api.sh"
