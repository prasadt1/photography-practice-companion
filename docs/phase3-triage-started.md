# Phase 3 — Triage tab (web HITL)

## Live URLs (existing — redeploy for latest features)

| Service | URL |
|---------|-----|
| **Firebase Hosting** | https://practice-companion-hackathon.web.app |
| **Cloud Run API** | https://practice-companion-api-l6kusl5xcq-uc.a.run.app |

Production today: Studio, Practice, Memory, Field (phase 3 API). **Mentor + Triage** need a **redeploy** after this work.

```bash
./scripts/deploy-coach-api.sh
export API_URL=https://practice-companion-api-l6kusl5xcq-uc.a.run.app
make deploy-hosting
```

## Local verify

```bash
make api-dev
make frontend-dev
```

1. Open **Triage** tab (Hobbyist or Working pro).
2. **Run triage scan** → pending approval cards appear.
3. **Approve** or **Reject** — no auto-delete without approve.

## API

- `POST /api/v1/triage/scan` — fast deterministic triage + proposals
- `GET /api/v1/pending-approvals?status=pending&agent_name=triage`
- `PATCH /api/v1/pending-approvals/{id}` — `{ "action": "approve" | "reject" }`

Agentic triage (slow): Mentor chat — “Run backlog triage on my portfolio and propose tag harmonization.”
