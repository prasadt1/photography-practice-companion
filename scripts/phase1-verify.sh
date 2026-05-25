#!/usr/bin/env bash
# Phase 1 gate (docs/spec.md §2.4, §2.4.b, Phase 1)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

bash "$ROOT/scripts/phase0-verify.sh"

cd "$ROOT/app"
echo "=== §2.4.b persona isolation ==="
.venv/bin/python -m pytest ../tests/test_persona_isolation.py -v

echo "=== AgentTool registrations (app/agent.py) ==="
AT=$(grep "AgentTool(agent=" agent.py | wc -l | tr -d ' ')
test "$AT" -ge 5 || { echo "FAIL: expected AgentTool lines in agent.py"; exit 1; }

echo "=== Import v5 orchestrator ==="
.venv/bin/python -c "
from agent import build_orchestrator_agent, build_persona_filtered_tool_list
from google.adk.tools import AgentTool
o = build_orchestrator_agent('hobbyist')
assert o.name == 'orchestrator'
names = {t.agent.name for t in build_persona_filtered_tool_list('hobbyist') if isinstance(t, AgentTool)}
assert 'coach' in names and 'print_sales' not in names
print('OK: hobbyist orchestrator', len(o.tools), 'tools')
"

echo ""
echo "Phase 1 automated checks PASSED."
echo "Manual: ADK playground behavioral queries (§Phase 1) — critique photo, planner, Etsy hobbyist fallback."
