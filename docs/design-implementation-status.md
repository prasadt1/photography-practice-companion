# Design review — implementation status

**Last updated:** 2026-05-25 (Tier I–L + Pass 3 warm surfaces committed; Firebase deploy pending)

Reference: [`design-reviews.md`](design-reviews.md), [`design-review-brief.md`](design-review-brief.md)

## Shipped

| Pass / issue | Status |
|--------------|--------|
| Pass 2 — Home, onboarding, bottom nav, sidebar | Done (Tier B) |
| Pass 1 — Tab copy, jargon (most), focus-visible, Studio hero steps | Done (Tier A) |
| Pass 5 — Mentor staged loading, skeletons, friendly errors | Done (Tier C) |
| Pass 6 — Glass Box sans, default tab, Why?, HITL callout | Done (Tier C) |
| Pass 3 subset — Newsreader, warm bg | Done (Tier C) |
| **Tier D** — Field 390px, rule-of-thirds overlay, brief clamp | Done |
| **Tier D** — Label Photos in sidebar + Home (all modes) | Done |
| **Tier D** — ISAR → plain skill-application copy | Done |
| **Tier D/E** — Amber accent tokens | Done |
| **Tier D/E** — Evidence human labels | Done |
| **Tier D/E** — Memory matte frames + score badge | Done |
| **Tier D/E** — Print hobbyist preview + Switch to Working pro | Done |
| **Tier F** — Triage/Print scan staged progress | Done |
| **Tier F** — Offline banner, Settings “What I remember” | Done |
| **Tier F** — Skip link, ShootNow focus trap, PWA manifest | Done |
| **Tier F** — `demo-script.md` updated for new IA | Done |
| Print price `<label>` + alt text | Done |
| Practice Active/Completed status (icon + text) | Done |
| **Tier G** — `/api/v1/portfolio/trends` + Memory sparklines | Done |
| **Tier G** — `/api/v1/mentor/suggested-questions` + Mentor tab | Done |
| **Tier G** — DM Sans body font (Pass 3) | Done |
| **Tier H** — Score ↔ Glass Box bidirectional highlight | Done |
| **Tier H** — Memory card Glass Box preview (line-clamp + expand) | Done |
| **Tier H** — Minimal PWA service worker (offline shell) | Done |
| **Tier I** — Aperture logo, warm charcoal surfaces, photo nav icons | Done |
| **Tier I** — Film grain + double-matte Studio upload | Done |
| **Tier I** — Shoot Now in sidebar; no Sparkles on Home | Done |
| **Tier I** — `config/brand.ts` (Iris display name) | Done |
| **Tier J** — Warm surfaces on all tabs (no slate/emerald/purple) | Done |
| **Tier K** — VSCO/Halide/Lightroom-inspired Studio, Memory, Field, Home layouts | Done |
| **Tier L** — Gallery Atelier visual pass (amber-only accent) | Done |
| **Pass 3 warm** — Full warm token set in `frontend/src` | Done (verified: 0 `slate-`/`emerald-`/`purple-` utility classes) |

## Deploy

| Step | Status |
|------|--------|
| `npm run build` (local) | Pass |
| Git commit on `design/tier-a` | Pending until push |
| `make deploy-hosting` with `API_URL` | **Pending** — requires Cloud Run URL + `firebase login` |

Production Firebase Hosting still serves pre–Tier I UI until hosting deploy runs.

## Still future (honest)

| Item | Why deferred |
|------|----------------|
| Vision impairment web UI | Phase 3–4 spec |
| Full PWA (offline upload queue, push) | Beyond minimal `sw.js` |
| Firebase Auth / multi-user | Consolidation Item 4 — demo `DEMO_USER_ID` for judges |
| Live Etsy API | Out of scope per brief |
| Change-stream listener on Cloud Run | Consolidation Item 2 — local service + deploy notes |
| Practice HITL callout on proposed cards | Design quick win (Phase 2) |

## Branch

`design/tier-a` — Tier I–L + Iris branding committed; run `make deploy-hosting` after setting `API_URL`.
