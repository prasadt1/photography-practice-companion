# Phase 2 — Closed

**Date:** 2026-05-31  
**Spec:** `docs/superpowers/specs/2026-05-31-iris-full-polish-design.md` (§Phase 2)

## Closure checklist

| Item | Status |
|------|--------|
| **2.1 Organize elevation** — Mentor nav badge, sidebar contextual block, tab header + two-path empty states, humanized HITL copy (no shoot UUIDs), post-approve feedback banner | Done |
| **2.2 Field desktop** — `usePreferUploadCapture`: file picker + copy on desktop; camera on mobile or explicit opt-in | Done |
| **2.2 Optional QR** — Deferred (additive; not required for close) | Skipped |
| **2.3 Assignment visibility** — “Submitted for” in My Work / Field; reflection on complete in Practice; **Practice Win** on Home (7-day window): thumbnail, skill delta, brief line, brief applied when stored | Done |
| **2.3 Backend** — `applied_brief` persisted on assignment complete → `appliedBrief` in API | Done |
| **2.4 Back navigation** — `SubViewBack` on Field (“← Practice”), My Work critique sub-view (“← My Work”); Practice list has no separate detail route (inline expand only) | Done |
| Local API Organize 500s — `MONGODB_MCP_ALLOW_PYMONGO_FALLBACK=true` in `make api-dev` | Done |
| `npm run build` | Run at close |
| `app/.venv/bin/python -m pytest app/tests/ -q` | Run at close |

## Key files

- `frontend/src/components/MentorTab.tsx` — Organize UX
- `frontend/src/lib/humanizeOrganizeReasoning.ts`, `HitlReasoningCallout.tsx`
- `app/api/triage_scan.py` — human-facing scan messages
- `frontend/src/components/FieldTab.tsx`, `hooks/usePreferUploadCapture.ts`
- `frontend/src/components/SubViewBack.tsx`, `MyWorkTab.tsx`
- `frontend/src/components/HomeTab.tsx` — Practice Win card
- `app/memory/assignments.py` — `applied_brief` on complete

## Deferred (Phase 3+)

- Print Sales approved-listings discoverability → Phase 3 §3.4
- Field “Continue on phone” QR deep link → optional enhancement

## Next phase gate

Phase 3 closed in `docs/superpowers/reviews/2026-05-31-phase3-closed.md`.
