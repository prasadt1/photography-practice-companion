#!/usr/bin/env bash
# v5 consolidation verification suite (items 1–13 + persona isolation)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
APP="$ROOT/app"
export PYTHONPATH="$APP${PYTHONPATH:+:$PYTHONPATH}"

fail() { echo "FAIL: $*"; exit 1; }
pass() { echo "PASS: $*"; }

echo "=== Item 1: Iris branding ==="
grep -q "Iris" README.md docs/demo-script.md docs/spec.md docs/mongodb-story-document.md || fail "Iris missing from docs"
grep -q "Iris" frontend/src/config/brand.ts frontend/index.html || fail "Iris missing from web"
grep -rq "practice-companion\|practice_companion" app/ --include="*.py" || fail "repo id missing"
pass "Item 1 branding"

echo "=== Item 2: change-stream-listener ==="
test -f services/change-stream-listener/main.py || fail "listener main missing"
test -f services/change-stream-listener/Dockerfile || fail "listener Dockerfile missing"
pass "Item 2 service files present (Cloud Run deploy: manual)"

echo "=== Item 3: MCP primary path ==="
count=$(grep -l "mcp_reads" app/sub_agents/*.py 2>/dev/null | wc -l | tr -d ' ')
test "$count" -ge 5 || fail "sub_agents mcp_reads imports: $count"
test -f app/memory/mcp_http_client.py || fail "mcp_http_client.py missing"
cd "$APP" && uv run python -m pytest ../tests/test_mcp_primary.py ../tests/test_mcp_http_reads.py -q --tb=no || fail "mcp tests"
cd "$ROOT"
pass "Item 3 MCP routing + HTTP client (production: ./scripts/verify_mcp_in_production.sh)"

echo "=== Item 4: multi-user scoping ==="
demo_count=$(grep -r "DEMO_USER_ID" app/sub_agents/ 2>/dev/null | wc -l | tr -d ' ' || true)
demo_count=${demo_count:-0}
test "$demo_count" -eq 0 || fail "DEMO_USER_ID in sub_agents: $demo_count"
test -f frontend/src/auth/FirebaseAuthProvider.tsx || fail "FirebaseAuthProvider missing (frontend/src/auth/)"
pass "Item 4 auth + no DEMO_USER_ID in sub_agents"

echo "=== Item 5: override loop ==="
cd "$APP" && uv run python -m pytest ../tests/test_override_loop.py -q --tb=no || fail "test_override_loop"
cd "$ROOT"
pass "Item 5 override loop"

echo "=== Item 6: atomic HITL ==="
grep -q "find_one_and_update" app/memory/pending_approvals.py || fail "atomic update missing"
cd "$APP" && uv run python -m pytest ../tests/test_atomic_hitl.py -q --tb=no || fail "test_atomic_hitl"
cd "$ROOT"
pass "Item 6 atomic transitions"

echo "=== Item 7: supersession ==="
test -f app/memory/supersession.py || fail "supersession.py missing"
cd "$APP" && uv run python -m pytest ../tests/test_supersession.py -q --tb=no || fail "test_supersession"
cd "$ROOT"
pass "Item 7 supersession"

echo "=== Item 8: Field Coach LlmAgent ==="
test -f app/sub_agents/field_coach.py || fail "field_coach.py missing"
test -f app/prompts/field_coach.txt || fail "field_coach prompt missing"
test "$(wc -l < app/prompts/field_coach.txt | tr -d ' ')" -ge 30 || fail "field_coach prompt short"
grep -q "field_coach" app/agent.py || fail "field_coach not in agent.py"
grep -q "AgentTool" app/agent.py || fail "AgentTool registration"
pass "Item 8 Field Coach"

echo "=== Item 9: persona isolation ==="
cd "$APP" && uv run python -m pytest ../tests/test_persona_isolation.py -v --tb=short || fail "persona isolation"
cd "$ROOT"
pass "Item 9 persona tests"

echo "=== Item 10: scene_search index ==="
grep -q "scene_search" app/sub_agents/tools/visual_describer_tools.py || fail "scene_search usage"
pass "Item 10 scene_search wired (Atlas UI index: manual if aggregate fails)"

echo "=== Item 11: MONGODB_REQUIRE_ATLAS_FEATURES ==="
test -f app/memory/atlas_features.py || fail "atlas_features.py missing"
grep -q "require_atlas_features" app/sub_agents/tools/mentor_tools.py || fail "mentor atlas guard"
pass "Item 11 atlas feature flag"

echo "=== Item 12: marketplace schemas ==="
test -f app/sub_agents/print_sales_marketplace_schemas.py || fail "schemas missing"
cd "$APP" && uv run python -m pytest ../tests/test_marketplace_schemas.py -q --tb=no || fail "marketplace schemas"
cd "$ROOT"
pass "Item 12 marketplace schemas"

echo "=== Item 13: description_style ==="
test -f app/memory/description_style.py || fail "description_style missing"
cd "$APP" && uv run python -m pytest ../tests/test_description_style_override.py -q --tb=no || fail "description_style tests"
cd "$ROOT"
pass "Item 13 description style"

echo ""
echo "=== verify_v5_spec.sh: ALL CHECKS PASSED ==="
