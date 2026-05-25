# Phase 4 — Print Sales HITL (web)

## Architecture

- **Sub-agent:** `print_sales_agent` (`app/sub_agents/print_sales.py`) — ADK `LlmAgent`, working_pro only on orchestrator.
- **Tools:** `propose_listing_publication` → `pending_approvals` (no live marketplace API).
- **Fast demo:** `POST /api/v1/print-sales/scan` → `api/print_sales_scan.py` calls tools directly (same as Triage scan).
- **Approve:** `PATCH /api/v1/pending-approvals/{id}` → inserts `print_sales` document.

## UI

- **Print** tab (Working pro persona only): `frontend/src/components/PrintSalesTab.tsx`
- Per-listing approve / reject / editable price (modify → merged payload).
- No batch-approve button.

## Demo

1. Toggle **Working pro**.
2. **Print** → **Draft listing proposals** (or Mentor: Etsy / Society6 question).
3. Edit price on one card → **Approve listing**.
4. Reject another — only approved rows land in `print_sales`.

## Deploy

Redeploy API + hosting after changes:

```bash
./scripts/deploy-coach-api.sh
export API_URL=https://practice-companion-api-l6kusl5xcq-uc.a.run.app
make deploy-hosting
```
