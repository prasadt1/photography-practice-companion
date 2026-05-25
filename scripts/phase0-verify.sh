#!/usr/bin/env bash
# Phase 0 gate checks (docs/spec.md §1.5, §2.4, Phase 0 gate)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/app"

echo "=== §1.5 migration (paths relative to app/) ==="
for f in coach/service.py planner/service.py reflection/service.py; do
  if test -f "$f"; then
    echo "FAIL: v3 file still exists: $f"
    exit 1
  fi
done
echo "OK: v3 service files deleted"

test -f agent.py || { echo "FAIL: missing app/agent.py"; exit 1; }
SUB=$(ls sub_agents/*.py 2>/dev/null | grep -v __init__ | grep -v _common | grep -v _pipeline | grep -v _toolsets | wc -l | tr -d ' ')
test "$SUB" -eq 8 || { echo "FAIL: expected 8 sub-agent modules, got $SUB"; exit 1; }
PROMPTS=$(ls prompts/*.txt 2>/dev/null | wc -l | tr -d ' ')
test "$PROMPTS" -eq 9 || { echo "FAIL: expected 9 prompt files, got $PROMPTS"; exit 1; }
echo "OK: agent.py, 8 sub-agents, 9 prompts"

echo "=== §2.4 LlmAgent / AgentTool ==="
LLM=$(grep -rh "LlmAgent(" . --include='*.py' --exclude-dir=.venv | grep -v "^#" | wc -l | tr -d ' ')
test "$LLM" -eq 9 || { echo "FAIL: expected 9 LlmAgent instances, got $LLM"; exit 1; }
AT=$(grep "AgentTool(agent=" agent.py | wc -l | tr -d ' ')
test "$AT" -ge 5 || { echo "FAIL: expected AgentTool registrations in agent.py"; exit 1; }
echo "OK: $LLM LlmAgent instances, AgentTool in agent.py"

echo "=== prompt line counts (≥30; orchestrator ≥80) ==="
for f in prompts/*.txt; do
  L=$(wc -l < "$f" | tr -d ' ')
  base=$(basename "$f")
  if test "$base" = "orchestrator.txt"; then
    test "$L" -ge 80 || { echo "FAIL: $f has $L lines (need ≥80)"; exit 1; }
  else
    test "$L" -ge 30 || { echo "FAIL: $f has $L lines (need ≥30)"; exit 1; }
  fi
done
echo "OK: all prompts meet line minimums"

cd "$ROOT"
test -f docs/mongodb-story-document.md || { echo "FAIL: missing docs/mongodb-story-document.md"; exit 1; }
test -f docs/spec.md || { echo "FAIL: missing docs/spec.md"; exit 1; }
echo "OK: companion doc and spec present"

echo ""
echo "Phase 0 file-structure checks PASSED."
