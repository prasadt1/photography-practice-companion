# Iris — Pending work, out of scope, and validation prompt

**As of:** 2026-05-31  
**Repo HEAD (when written):** `c963a55` and later (`da50c0f` review doc, `b87c08e` listing dedupe)  
**Polish status:** Phases 1–3 **closed** — see [`docs/superpowers/reviews/2026-05-31-phases-1-3-review-for-claude.md`](superpowers/reviews/2026-05-31-phases-1-3-review-for-claude.md)

**Production:**

- Web: https://practice-companion-hackathon.web.app  
- API: https://practice-companion-api-l6kusl5xcq-uc.a.run.app  

---

## 1. What is done (do not re-implement)

### Web polish (Phases 1–3)

| Phase | Delivered |
|-------|-----------|
| **1** | Layered Home, sidebar dashboard, footer (all viewports), At a glance (3 columns), contact sheet, Then/Now growth (≥6 photos), PNG logo in chrome, reduced amber on non-CTAs |
| **2** | Organize on Mentor (badges, humanized HITL, feedback banner), Field desktop upload, assignment “Submitted for”, Practice Win, `appliedBrief`, `SubViewBack`, `make api-dev` MCP fallback |
| **3** | Print Sales trust banner, **Your approved listings**, `GET /api/v1/print-sales`, proposal vs saved labels, `listed_for_sale` + My Work Listed badge/filter, listing skeletons, lazy images on key surfaces |
| **Post-close** | Print listing dedupe per `shoot_id`; Your growth caption uses **frame delta** (oldest vs strongest), not portfolio trend |

### Core product (pre-polish, still true)

Glass Box critique, portfolio memory (MongoDB), Practice assignments + reflection, triage HITL, print sales HITL, user tags + filter, Mentor orchestrator chat, XMP export, Cloud Run + Firebase hosting.

### iOS (parallel track — not Phase 1–3 web spec)

Native app: Shoot FAB, camera/gallery → `analyze-photo`, Practice, Mentor chat, **live field coach** on physical device (`field_capture`). Details: [`ios/README.md`](../ios/README.md). Root [`README.md`](../README.md) roadmap checkboxes are **stale**; prefer `ios/README.md`.

### External review

Claude reviewer pass (2026-05-31): **0 material gaps** vs Phases 1–3 spec.

---

## 2. Pending (not required to call “polish complete”)

### A. Hackathon / submission (no product code)

| Item | Notes |
|------|--------|
| Devpost **demo video** (~3 min max; only first 3 min judged) | Scripts: `docs/ios-demo-video-script.md`; 3-min structure discussed in chat — not yet a single `docs/demo-video-script-3min.md` |
| Devpost **written submission** | `docs/devpost-article-draft.md` exists locally; may be untracked |
| **Manual QA** | Checklist in phases 1–3 review doc — boxes may be unchecked |
| **Physical iPhone** recording | Live coach + shutter for video B-roll |
| Push **review docs** | Done — `origin/main` includes `8608a76` (`PENDING-AND-SCOPE.md`, phases review) |

### B. Code / features (optional or post-hackathon)

| Item | Source | Notes |
|------|--------|--------|
| Field “Continue on phone” QR | Polish spec §2.2 optional | Not implemented |
| Practice **assignment detail** sub-route | Spec §2.4 example | Inline expand only on Practice tab |
| SVG logo at 44–56px | Phase 1 | PNG + srcSet; `iris-mark.svg` reads as flower |
| Intersection Observer lazy gallery | Phase 3 | `loading="lazy"` on Print Sales / My Work; not full IO pattern |
| **Web** live field coach | Product gap vs iOS | Web Field = upload + Glass Box; iOS has periodic cues |
| **Vision-impairment** in onboarding | `spec.md` persona | API/tooling exists; web/iOS UI = hobbyist + working pro only |
| **Agent Engine** as production URL | `agent_runtime_app.py` | Judges use **Cloud Run** FastAPI |
| **Backlog Triage** sub-agent | `spec.md` | Explicitly deferred post-hackathon |
| Triage dedupe by shoot | Parity with print scan | Print Sales dedupes; Organize may still propose per duplicate row |
| Pitch band on returning Home | Spec §1.1 | **Removed** for scroll (intentional deviation) |

### C. Design / UX (partial vs mockups)

| Item | Status |
|------|--------|
| Amber reduction on all non-CTA surfaces | Partial |
| Formal WCAG contrast audit | Spec test note; not filed as report |
| iOS custom fonts (Newsreader + DM Sans) | `ios/README.md` next |
| iOS Studio parity | No spatial overlays, radar, full “How to Fix” tab |
| Footer “How it works” | Opens **onboarding tour**, not separate modal |

### D. iOS / platform (from `ios/README.md` + Devpost “What’s next”)

| Item | Status |
|------|--------|
| Test Google Sign-In on physical device | Optional for demo |
| ARKit horizon / subject boxes from server JSON | Roadmap |
| Offline upload queue | Planned |
| Apple Watch | Planned |
| VI: VoiceOver, haptics, onboarding picker | Roadmap |

### E. Infrastructure / honesty (not “pending polish”)

| Topic | Truth |
|-------|--------|
| Etsy / marketplace live API | Not shipped; listings saved in MongoDB only |
| Live coach latency | ~3–5s between cues; not 30 FPS video |
| MCP | Production reads; many writes via PyMongo (documented) |
| Cross-region | Atlas `europe-west3`, Vertex/GCS `us-central1` |

---

## 3. Known limitations (behavior, not backlog unless spec changes)

| Topic | Behavior |
|--------|----------|
| Duplicate portfolio rows | Re-upload / re-analyze → multiple entries; print scan dedupes by shoot; Organize may not |
| Growth vs trend | **At a glance** = recent half vs older half of last N uploads; **Your growth** = oldest vs highest-scoring photo |
| `appliedBrief` | Only on assignments completed after backend persist; older rows `null` |
| Practice detail | No dedicated detail page |
| Simulator | No live coach story; use Gallery or device |

---

## 4. Out of scope (do not claim in Devpost or judge Q&A)

### From polish spec (`2026-05-31-iris-full-polish-design.md`)

- Full **light mode** / theme toggle  
- **Tab-based** homepage navigation  
- Full **breadcrumb** trails (only one-level `SubViewBack`)  
- **Auto-apply** Organize tags or deletions  
- **Live Etsy** (or other marketplace) publishing  

### From product spec / Devpost honesty

- **Desktop native macOS** / Lightroom file watcher  
- **Backlog Triage** agent (deferred)  
- **Vision-impairment** as primary shipped demo persona (orchestrator support ≠ full UI)  
- **Agent Engine** as the URL judges hit today (scaffold only)  
- **Atelier** marketplace, vertical expansion (video, music, writers, …)  
- **Lightroom Lua plugin** (XMP sidecar exists)  
- **Apple Watch** companion  
- **Offline-first** queue  
- **Web Speech** live coach parity with iOS  
- **True real-time** field coach (periodic frames by design)  

---

## 5. What to do next (by goal)

| Goal | Action |
|------|--------|
| **Submit hackathon** | Record ≤3 min video (web HITL + optional iPhone live coach); paste URL in Devpost; use `devpost-article-draft.md` |
| **No more product polish** | Stop at Phases 1–3 unless a judge files a bug |
| **Post-hackathon** | VI UI, web field coach, Agent Engine deploy, logo SVG, iOS Studio parity, triage dedupe |

---

## 6. Related docs

| Document | Purpose |
|----------|---------|
| [`superpowers/specs/2026-05-31-iris-full-polish-design.md`](superpowers/specs/2026-05-31-iris-full-polish-design.md) | Approved polish spec |
| [`superpowers/reviews/2026-05-31-phases-1-3-review-for-claude.md`](superpowers/reviews/2026-05-31-phases-1-3-review-for-claude.md) | Handoff + QA + review prompts |
| [`superpowers/reviews/2026-05-31-phase1-closed.md`](superpowers/reviews/2026-05-31-phase1-closed.md) | Phase 1 closure |
| [`superpowers/reviews/2026-05-31-phase2-closed.md`](superpowers/reviews/2026-05-31-phase2-closed.md) | Phase 2 closure |
| [`superpowers/reviews/2026-05-31-phase3-closed.md`](superpowers/reviews/2026-05-31-phase3-closed.md) | Phase 3 closure |
| [`ios-demo-video-script.md`](ios-demo-video-script.md) | Short iPhone script |
| [`devpost-article-draft.md`](devpost-article-draft.md) | Submission narrative (draft) |
| [`deploy.md`](deploy.md) | Push + deploy commands |

---

## 7. Prompt for Claude — validate this document

Copy everything in the fenced block below into a **new Claude session** with repo access (or paste file contents if read-only).

```markdown
You are validating an inventory document for the Iris hackathon project
(photography-practice-companion). Do not implement code unless I ask after the review.

## Your task

1. Read these files in order:
   - docs/PENDING-AND-SCOPE.md (this inventory — verify every claim)
   - docs/superpowers/reviews/2026-05-31-phases-1-3-review-for-claude.md
   - docs/superpowers/specs/2026-05-31-iris-full-polish-design.md (Phases 1–3 + Out of Scope)
   - README.md and ios/README.md (note contradictions)

2. Spot-check the codebase for **5 claims** (cite file paths):
   - Print Sales: GET /api/v1/print-sales + listed_for_sale on approve
   - Print scan dedupe by shoot_id (app/api/print_sales_scan.py)
   - Home growth caption uses growthFrameOverallDelta, not trendDelta (HomeTab.tsx)
   - Organize: humanizeOrganizeReasoning + OrganizeFeedbackBanner (MentorTab.tsx)
   - iOS live coach: LiveFieldCoachModel + field_capture path (ios/)

3. Produce three outputs:

### A. Validation verdict (2–3 sentences)
Is docs/PENDING-AND-SCOPE.md accurate as a hackathon status doc? Yes / Mostly / No.

### B. Corrections table (only wrong or misleading rows)
| Section | Claim | Verdict (wrong / misleading / ok) | Evidence (file or line) | Suggested fix |

If none: say "No corrections."

### C. Prioritized follow-ups (max 5)
Split into:
- **Submit blockers** (must fix before Devpost)
- **Post-submit** (nice to have)
- **Out of scope confirm** (items that must NOT be built before submit)

Do not invent features not in the repo. Distinguish:
- **Done** (Phases 1–3 web polish)
- **Pending** (optional / hackathon ops)
- **Out of scope** (explicit never for this submission)
- **Known limitations** (documented behavior)

### D. Devpost safety check
List any phrase in devpost-article-draft.md (if present) that over-claims vs PENDING-AND-SCOPE.md
(e.g. live Etsy, Agent Engine as prod URL, VI as shipped UI, real-time 30fps coach).

## Rules
- Material gaps only; no nits.
- If README.md conflicts with ios/README.md on iOS phase status, report it and state which to trust.
- Production URLs: practice-companion-hackathon.web.app and practice-companion-api-l6kusl5xcq-uc.a.run.app
```

---

## 8. External validation (Claude, 2026-05-31)

**Verdict:** Yes — inventory accurate; five spot-checks passed; no corrections.

| Claim | Evidence cited |
|-------|----------------|
| `GET /api/v1/print-sales` + `listed_for_sale` | `pending_approvals.py`, `print_sales_list.py`, `test_print_sales_hitl.py` |
| Print dedupe by `shoot_id` | `print_sales_scan.py` (`_dedupe_key`) |
| Growth caption = `growthFrameOverallDelta` | `HomeTab.tsx` |
| Organize humanize + feedback banner | `humanizeOrganizeReasoning.ts`, `MentorTab.tsx` |
| iOS live coach + `field_capture` | `LiveFieldCoachModel.swift`, `FieldCoachService.swift` |

**Submit blocker (remaining):** Devpost **demo video URL** only.

**Devpost draft:** `devpost-article-draft.md` — no over-claims vs this doc (Cloud Run not Agent Engine prod; VI not shipped UI; no live Etsy; coach = periodic snapshots).

---

*Maintainer: update this file when scope changes or after major releases.*
