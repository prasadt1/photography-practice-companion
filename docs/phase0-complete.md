# Phase 0 complete (v5 migration)

Completed per `docs/spec.md` Phase 0 / §1.5.

## Automated checks

```bash
bash scripts/phase0-verify.sh          # PASSED
app/.venv/bin/python scripts/bootstrap-mongodb.py
cd app && .venv/bin/python -m pytest ../tests/test_persona_isolation.py -v
```

## What changed

- Deleted v3 `app/coach/service.py`, `app/planner/service.py`, `app/reflection/service.py`, `app/coach/agent.py`
- Pipelines live in `app/sub_agents/*_pipeline.py`; REST/API imports use `sub_agents`
- Created `app/agent.py`, eight `app/sub_agents/*.py` LlmAgents, nine prompts (line minimums met)
- `app/memory/indexes.py` + bootstrap: v5 collections, indexes, `users.persona` migration
- `docs/mongodb-story-document.md` copied from strategic report
- `ios/README.md` placeholder for SwiftUI (Phase 4)

## Still manual (Phase 0)

- Mac / Xcode / Apple Developer enrollment
- Atlas UI: vector index, `glass_box_search`, `scene_search`
- Infra smoke: Firebase deploy, Vertex, Agent Builder Data Store, GCS

## Next: Phase 1

Wire real ADK `AgentTool` delegation, sub-agent tools, playground traces; gate §2.4 + §2.4.b + behavioral queries. Legacy `app/orchestrator/agent.py` remains for playground until cutover.
