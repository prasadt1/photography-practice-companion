#!/usr/bin/env bash
# Phase 4 — verify hosted reads use MongoDB MCP (not silent PyMongo fallback).
# Prereqs: MCP service deployed, Coach API redeployed with MONGODB_MCP_* env vars.
#
# Usage:
#   export API_URL=https://practice-companion-api-....run.app
#   export MONGODB_MCP_HTTP_URL=https://mongodb-mcp-....run.app/mcp  # optional cross-check
#   ./scripts/verify_mcp_in_production.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

API_URL="${API_URL:-}"
PROJECT="${GOOGLE_CLOUD_PROJECT:-practice-companion-hackathon}"
REGION="${CLOUD_RUN_REGION:-us-central1}"
COACH_SERVICE="${CLOUD_RUN_SERVICE:-practice-companion-api}"
MCP_SERVICE="${MONGODB_MCP_SERVICE:-mongodb-mcp}"

fail() { echo "FAIL: $*"; exit 1; }
pass() { echo "PASS: $*"; }

if [[ -z "${API_URL}" ]]; then
  API_URL="$(gcloud run services describe "${COACH_SERVICE}" --project="${PROJECT}" --region="${REGION}" --format='value(status.url)' 2>/dev/null || true)"
fi
[[ -n "${API_URL}" ]] || fail "Set API_URL or deploy Coach API first"

echo "=== 1. Coach API health ==="
HEALTH="$(curl -sf "${API_URL}/health")" || fail "Coach API /health unreachable"
echo "${HEALTH}" | grep -q '"status"' || fail "unexpected health payload"
pass "Coach API health"

echo "=== 2. Portfolio list (guaranteed mcp_reads.find on portfolio_entries) ==="
PORTFOLIO_RESP="$(curl -sf "${API_URL}/api/v1/portfolio?limit=3" --max-time 60)" || fail "GET /api/v1/portfolio failed (MCP read may be required; check API logs)"
echo "${PORTFOLIO_RESP}" | grep -q '"entries"' || fail "portfolio response missing entries"
pass "Portfolio list via API"

echo "=== 3. Mentor chat (may also trigger mcp_reads) ==="
CHAT_BODY="$(cat <<'EOF'
{"message":"List my three most recent portfolio photos with scores only.","persona":"hobbyist"}
EOF
)"
CHAT_RESP="$(curl -sf -X POST "${API_URL}/api/v1/agent/chat" \
  -H "Content-Type: application/json" \
  -d "${CHAT_BODY}" \
  --max-time 200)" || fail "Mentor /api/v1/agent/chat failed or timed out"
echo "${CHAT_RESP}" | grep -q '"reply"' || fail "chat response missing reply field"
pass "Mentor chat returned a reply"

echo "=== 4. Cloud Logging — mcp_read_ok lines (last 10 min) ==="
if ! command -v gcloud >/dev/null 2>&1; then
  echo "WARN: gcloud not available; skip log verification"
  exit 0
fi

sleep 8
FILTER="resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${COACH_SERVICE}\" AND textPayload:\"mcp_read_ok\""
LOGS="$(gcloud logging read "${FILTER}" \
  --project="${PROJECT}" \
  --limit=5 \
  --freshness=15m \
  --format='value(textPayload)' 2>/dev/null || true)"

if [[ -z "${LOGS}" ]]; then
  FILTER_JSON="resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${COACH_SERVICE}\" AND jsonPayload.message:\"mcp_read_ok\""
  LOGS="$(gcloud logging read "${FILTER_JSON}" \
    --project="${PROJECT}" \
    --limit=5 \
    --freshness=15m \
    --format='value(jsonPayload.message)' 2>/dev/null || true)"
fi

if [[ -z "${LOGS}" ]]; then
  fail "No mcp_read_ok log lines on ${COACH_SERVICE} — MCP reads may not be active (check MONGODB_MCP_HTTP_URL on API)"
fi

echo "${LOGS}" | head -3
echo "${LOGS}" | grep -q "tool=find\|tool=aggregate\|tool=find_one" || fail "mcp_read_ok logs missing tool name"
pass "Cloud Logging shows mongodb MCP read (mcp_read_ok)"

echo "=== 5. Cloud Trace — mongodb.mcp.* spans (optional) ==="
TRACE_FILTER="trace.cloud.google.com/span.name:mongodb.mcp."
TRACE_OUT="$(gcloud alpha trace list --filter="${TRACE_FILTER}" --limit=3 2>/dev/null || true)"
if [[ -n "${TRACE_OUT}" ]]; then
  echo "${TRACE_OUT}"
  pass "Cloud Trace lists mongodb.mcp.* spans"
else
  echo "WARN: No mongodb.mcp.* spans via gcloud alpha trace (OTel export may lag; use Cloud Console Trace explorer)"
fi

echo ""
echo "=== verify_mcp_in_production.sh: PASSED ==="
echo "Capture a Trace screenshot with span names mongodb.mcp.find / mongodb.mcp.aggregate for Devpost."
