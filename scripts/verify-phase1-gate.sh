#!/usr/bin/env bash
# Phase 1 verification gate — run from repo root: ./scripts/verify-phase1-gate.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
pass=0
fail=0
warn=0

ok()   { echo -e "${GREEN}PASS${NC}  $*"; pass=$((pass + 1)); }
bad()  { echo -e "${RED}FAIL${NC}  $*"; fail=$((fail + 1)); }
note() { echo -e "${YELLOW}WARN${NC}  $*"; warn=$((warn + 1)); }

echo "=== Practice Companion — Phase 1 gate ==="
echo "Repo: $ROOT"
echo

# 1. ADK scaffold
if [[ -f app/orchestrator/agent.py && -f app/prompts/orchestrator.txt ]]; then
  ok "ADK scaffold (google-agents-cli) present"
else
  bad "Missing app/orchestrator/agent.py or prompts"
fi

# 2. Agent import
if (cd app && uv run python -c "from orchestrator.agent import root_agent; assert root_agent.name" 2>/dev/null); then
  ok "Orchestrator imports (practice_companion_orchestrator)"
else
  bad "Orchestrator import failed — run: cd app && uv sync"
fi

# 3. Principles corpus
count=$(find principles -name '*.md' 2>/dev/null | wc -l | tr -d ' ')
if [[ "$count" -ge 5 ]]; then
  ok "principles/ has $count markdown docs"
else
  bad "Expected 5+ files in principles/ (found $count)"
fi

# 4. MongoDB bootstrap
if python3 scripts/bootstrap-mongodb.py 2>&1 | grep -q "Done"; then
  ok "MongoDB bootstrap (collections + compound indexes)"
else
  bad "bootstrap-mongodb.py failed — check MONGODB_URI in .env"
fi

# 5. GCS bucket
if command -v gsutil >/dev/null 2>&1; then
  if gsutil ls -b gs://practice-companion-portfolio >/dev/null 2>&1; then
    loc=$(gcloud storage buckets describe gs://practice-companion-portfolio --format="value(location)" 2>/dev/null || echo "?")
    ok "GCS bucket gs://practice-companion-portfolio ($loc)"
  else
    bad "GCS bucket missing — run: ./scripts/setup-gcs-portfolio.sh"
  fi
else
  note "gsutil not installed — skip GCS check"
fi

# 6. Frontend build
if (cd frontend && npm run build >/dev/null 2>&1); then
  ok "frontend npm run build"
else
  bad "frontend build failed"
fi

# 7. Studio components (ported layout)
for f in \
  frontend/src/components/studio/StudioAnalysisResults.tsx \
  frontend/src/components/studio/GlassBoxPanel.tsx \
  frontend/src/services/agentClient.ts; do
  [[ -f "$f" ]] || { bad "Missing $f"; break; }
done
[[ -f frontend/src/components/studio/StudioAnalysisResults.tsx ]] && ok "Studio UI + agentClient mock wired"

# 8. No Ollama in frontend source
if rg -i 'ollama' frontend/src >/dev/null 2>&1; then
  bad "Ollama references still in frontend/src"
else
  ok "No Ollama references in frontend/src"
fi

# 9. Vertex AI verification
echo
echo "--- Vertex AI (test_vertex_ai.py) ---"
if python3 test_vertex_ai.py; then
  ok "Vertex AI script exited 0"
else
  note "Vertex AI script failed — enable Gemini on project or fix gcp-service-account.json"
fi

# 10. App unit tests
if (cd app && uv run pytest tests/unit -q >/dev/null 2>&1); then
  ok "app unit tests"
else
  bad "app unit tests failed"
fi

# 11. Manual / cannot auto-verify
echo
echo "--- Manual (document in docs/phase1-gate.md) ---"
note "Playground: cd app && uvx google-agents-cli playground"
note "MongoDB MCP: Cursor/Claude with mcp-config.json — list collections"
note "Agent Builder Data Store: confirm DATA_STORE_ID + principles uploaded in console"
note "Git push: git push origin main when ready (secrets not committed)"

echo
echo "=== Summary: $pass passed, $fail failed, $warn warnings ==="
[[ "$fail" -eq 0 ]]
