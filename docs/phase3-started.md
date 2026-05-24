# Phase 3 — started (Memory tab)

## What works now

1. **Memory API** (Coach server, port 8081)
   - `GET /api/v1/portfolio` — recent `portfolio_entries` (signed GCS image URLs)
   - `GET /api/v1/aesthetic-profile` — lightweight snapshot from recent scores/tags

2. **Memory tab** — grid of past critiques, aesthetic snapshot, expand card for Glass Box notes.

3. **Health** — `{"status":"ok","phase":"3"}`

## Run

```bash
make api-dev      # restart after pull — picks up new routes
make frontend-dev
```

Open **Memory** tab after at least one Studio upload.

## Optional env

Set `DEMO_USER_ID` to a fixed MongoDB ObjectId hex string so Studio writes and Memory reads filter the same user. If unset, Memory lists **all** portfolio entries (fine for solo demo).

## Practice tab (HITL)

- `GET /api/v1/assignments` — proposed / active / completed
- `POST /api/v1/assignments/propose?mode=hobbyist|working_pro` — Gemini Planner from portfolio
- `POST /api/v1/assignments/{id}/accept` · `…/decline`
- Practice tab: Suggest practice → Accept / Decline → active brief

## Demo seed data

```bash
make seed-demo
# Add to .env: DEMO_USER_ID=6577a1f2b3c4d5e6f7a8b9c0
make api-dev   # restart
```

Re-seed: `python3 scripts/seed-demo-data.py --reset`  
Images: [Unsplash License](https://unsplash.com/license).

## Assignment loop (Studio ↔ Practice)

- Active assignment → **Studio banner**; uploads send `assignment_id`.
- Portfolio entries store `assignment_id`; assignment tracks `practice_shoot_id` + `completion_shoot_ids`.
- **Mark complete** → Reflection (Gemini summary + ISAR-style `skill_delta` on target skill).

## Still Phase 3

- Accept → “shoot now / later” + Field mode (Phase 4)
- Atlas Search bar in Memory
- Change-stream `aesthetic_profile` listener
- Vector similarity search

See [`implementation-plan.md`](implementation-plan.md) § Phase 3.
