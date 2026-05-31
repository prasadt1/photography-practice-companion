# Phase 3 — Closed

**Date:** 2026-05-31  
**Spec:** `docs/superpowers/specs/2026-05-31-iris-full-polish-design.md` (§Phase 3)

## Closure checklist

| Item | Status |
|------|--------|
| **3.4** Persistent post-approve banner, “Your approved listings”, proposal vs saved labels, reject dismissed + collapsed history | Done |
| **3.1** Draft label “Proposal — not listed until you approve”; saved rows with Saved badge; trust copy (not live on Etsy) | Done |
| **3.2** `listed_for_sale` user tag on approve; My Work **Listed** thumbnail badge; filter “Listed for sale” | Done |
| **3.3** `PrintListingCardsSkeleton`; lazy-loaded listing/gallery images; scan progress banner; clarified scan copy | Done |
| **API** `GET /api/v1/print-sales` | Done |
| `npm run build` | Run at close |
| `pytest app/tests/` | Run at close |

## Key files

- `app/memory/print_sales_list.py`, `app/api/server.py`
- `app/memory/pending_approvals.py` — tag on approve
- `frontend/src/components/PrintSalesTab.tsx`
- `frontend/src/services/printSalesClient.ts`
- `frontend/src/components/MyWorkTab.tsx`, `frontend/src/lib/listedForSale.ts`

## Out of scope (unchanged)

- Live Etsy publishing
- Full light mode / breadcrumbs
