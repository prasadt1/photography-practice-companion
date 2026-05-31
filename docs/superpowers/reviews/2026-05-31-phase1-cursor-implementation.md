# Phase 1 Implementation Review (Cursor)

**Date:** 2026-05-31  
**Plan:** `docs/superpowers/plans/2026-05-31-phase1-homepage-polish.md`  
**Spec:** `docs/superpowers/specs/2026-05-31-iris-full-polish-design.md` (Phase 1)

## Summary

Phase 1 implemented inline in Cursor across 4 checkpoints. Frontend build (`npm run build`) passes.

## Task status

| Task | Status | Notes |
|------|--------|-------|
| 1 Backend `get_portfolio_stats` + `count_documents` | Done | `app/memory/portfolio.py` |
| 2 `/api/v1/portfolio/stats` endpoint | Done | `app/api/server.py` |
| 3 `fetchPortfolioStats` service | Done | `memoryClient.ts`, `memory.ts` |
| 4 First-visit pitch hero + demo scroll | Done | `HomeTab.tsx` |
| 5 Returning full-bleed hero + pitch band | Done | `HomeTab.tsx` |
| 6 Elevated mentor card | Done | Threshold: ≥3 photos, ≥1 demo scope |
| 7 Contact sheet + Upload CTA | Done | Returning users only |
| 8 Footer 3-line, all viewports | Done | `App.tsx`; "How it works" → tour |
| 9 Sidebar dashboard strip | Done | `AppSidebar.tsx` + `App.tsx` data fetch |
| 10 BrandLogo simplified lockup | Done | Tagline removed from icon variant |
| 11 Palette / logo zone | Partial | Film grain moved to main column; `.sidebar-logo-zone` CSS |
| 12 Capabilities grid | Done | First visit only |
| 13 Integration & testing | Partial | `npm run build` OK; backend pytest not run (python unavailable in shell) |

## Files changed

- `app/memory/portfolio.py` — `_portfolio_user_query`, `get_portfolio_stats`, real `total`
- `app/api/server.py` — `GET /api/v1/portfolio/stats`
- `frontend/src/types/memory.ts` — `PortfolioStats`
- `frontend/src/services/memoryClient.ts` — `fetchPortfolioStats`
- `frontend/src/components/HomeTab.tsx` — layered homepage rewrite
- `frontend/src/components/AppSidebar.tsx` — dashboard strip
- `frontend/src/components/BrandLogo.tsx` — sidebar lockup
- `frontend/src/App.tsx` — footer, sidebar props, film grain scope, demo library flag
- `frontend/src/index.css` — `.sidebar-logo-zone`

## Spec deviations / gaps

### Non-blocking

- **Practice Win card** — deferred to Phase 2 (assignment visibility).
- **3-column "At a glance"** — kept 2-card layout (score trend + practice); mockup had assignments count.
- **SVG logo asset** — still uses `iris-icon.png`; lockup simplified only.
- **Amber surface reduction** — partial; hero overlay no longer uses `backdrop-blur`.
- **Backend pytest** — not executed in Cursor shell; run locally before deploy.

### For Claude review

- Verify `/portfolio/stats` with live API + demo user.
- Manual: first visit (0 photos), returning (1+, 3+), dismiss pitch band, footer on mobile.
- Sidebar mentor line uses dynamic copy from profile/trends.

## Manual test checklist (Task 13)

- [ ] First visit: pitch hero, demo critique scroll, capabilities grid
- [ ] Returning: full-bleed hero, real total + strongest photo, member since
- [ ] Pitch band dismiss persists (`iris:pitchBandDismissed`)
- [ ] Mentor card ≥3 photos (≥1 demo)
- [ ] Then/Now growth when earliest ≠ strongest
- [ ] Contact sheet Upload + Open library
- [ ] Sidebar thumbs, badges, contextual blocks
- [ ] Footer 3 lines desktop + mobile (above bottom nav)

## Next steps

- Phase 2: Organize elevation, Field upload desktop, assignment visibility, back nav
- Deploy after manual QA + `python3 -m pytest app/tests/`
