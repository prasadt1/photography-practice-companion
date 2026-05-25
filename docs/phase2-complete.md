# Phase 2 — Persona routing + Mentor Copilot

## Shipped

| Item | Location |
|------|----------|
| Persona in MongoDB | `memory/users.py`, `PATCH /api/v1/users/me` |
| Orchestrator reads persona | `build_orchestrator_agent(get_persona(...))` on each chat |
| Intent classification | `app/prompts/orchestrator.txt` § Intent classification |
| Mentor chat API | `POST /api/v1/agent/chat` → `api/orchestrator_service.py` (ADK Runner) |
| Mentor UI tab | `frontend/src/components/MentorTab.tsx` |
| Persona toggle → DB | `ModeToggle` + `userClient.ts` |

## Deploy choice (documented)

**Orchestrator chat runs on the same Cloud Run service as the Coach API** (FastAPI `api/server.py`), not a separate Agent Engine deploy for Phase 2.

- **Pros:** One URL for judges, same secrets/IAM, Studio + Mentor + assignments unchanged.
- **Agent Engine:** Optional later (`orchestrator/agent_runtime_app.py`); playground remains local `:8080`.

After deploy, set `VITE_API_BASE_URL` to your Cloud Run URL so the Mentor tab hits `/api/v1/agent/chat`.

## Local dev

```bash
# Terminal 1
make api-dev          # :8081 — includes orchestrator chat

# Terminal 2
make frontend-dev     # :5173 — proxies /api → 8081

# Optional: ADK playground still :8080
make playground
```

Ensure `.env` has `DEMO_USER_ID` (from `make seed-demo`).

## Verify

1. **Persona:** Toggle Working pro → refresh → `GET /api/v1/users/me` shows `working_pro`.
2. **Mentor tab:** “How am I doing so far?” → reply in ~30s (orchestrator → mentor).
3. **Etsy (hobbyist):** Persona-switch message in Mentor tab.
4. **Etsy (working pro):** Toggle persona, ask again → print_sales path in playground Traces.

## Phase 2 spec gates (5 canonical queries)

Use **playground → orchestrator** for trace-heavy flows; use **Mentor tab** for product UX. Same orchestrator code path on chat API.
