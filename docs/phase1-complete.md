# Phase 1 complete — multi-agent rewire

Per `docs/spec.md` Phase 1 (May 26–29).

## What shipped

- **Real ADK `AgentTool`** from `google.adk.tools` on `app/agent.py` (replaced stub wrapper).
- **8 sub-agents** each with own `LlmAgent`, prompt, and `FunctionTool` set under `app/sub_agents/tools/`.
- **Playground entry** `app/orchestrator/agent.py` → `build_orchestrator_agent(DEFAULT_PERSONA)`.
- **Persona filtering** at tool construction (§4.3) + session `FunctionTool`s (`get_user_persona`, `get_session_context`, `get_active_assignment`).
- **Field Coach** sub-delegation via `AgentTool(coach|mentor|visual_describer)` per persona.
- **GenAI OpenTelemetry** hook in `orchestrator/app_utils/telemetry.py`.
- **Circular-import fixes:** lazy imports in `memory/assignments.py`; empty `orchestrator/__init__.py`.

## Verify

```bash
bash scripts/phase1-verify.sh
```

## Manual playground checks (Phase 1 gate)

From `app/` with `.env` loaded, ADK playground on `orchestrator.agent`:

| Query | Persona | Expected |
|-------|---------|----------|
| "Critique this photo" + image | hobbyist | Delegate to **coach**; trace ≥2 LLM spans |
| "What should I work on next?" | hobbyist | **planner**; assignment rationale |
| "Which photos should I sell on Etsy?" | hobbyist | §4.4 persona-switch message; **no** print_sales |

Set `DEFAULT_PERSONA=working_pro` to exercise Print Sales in playground.

## REST API unchanged

Studio upload still uses `POST` Coach pipeline via `sub_agents.coach.analyze_photo` (deterministic path per §4.7).

## Next: Phase 2

Persona from MongoDB in orchestrator session, Mentor chat UI, deploy orchestrator endpoint, frontend wiring.
