# Iris full polish — Phases 1–3 review (for Claude)

**Date:** 2026-05-31  
**Author:** Prasad (Cursor implementation + deploy)  
**Spec:** [`docs/superpowers/specs/2026-05-31-iris-full-polish-design.md`](../specs/2026-05-31-iris-full-polish-design.md)  
**Status:** **All three phases closed.** Post-close fixes shipped through `c963a55`.

Use this document as the single handoff for code review, demo prep, Devpost copy, or follow-up work. Per-phase closure notes remain in:

- [`2026-05-31-phase1-closed.md`](2026-05-31-phase1-closed.md)
- [`2026-05-31-phase2-closed.md`](2026-05-31-phase2-closed.md)
- [`2026-05-31-phase3-closed.md`](2026-05-31-phase3-closed.md)

---

## Executive summary

Iris received a **three-phase product polish** pass on the hackathon web app (`photography-practice-companion`):

| Phase | Theme | Outcome |
|-------|--------|---------|
| **1** | Home, sidebar, palette, footer, logo | Layered returning vs first-visit Home; dashboard sidebar; footer on all viewports; real portfolio stats for hero |
| **2** | Organize, Practice/Field, assignment visibility | Organize discoverable on Mentor with HITL trust copy; desktop Field upload; Practice Win on Home; contextual back nav |
| **3** | Print Sales trust + My Work listings | Post-approve banner, saved listings list, `listed_for_sale` tag, Listed badge/filter; listing dedupe per shoot |

**Production (as of `c963a55`):**

- **App:** https://practice-companion-hackathon.web.app  
- **API:** https://practice-companion-api-l6kusl5xcq-uc.a.run.app  
- **Health:** `GET /health` → `status: ok`, `printSalesHitl: enabled`

**Do not re-implement** items marked Done below unless fixing a reported bug.

---

## Commit map (main)

| Commit | What |
|--------|------|
| `0f09b2e` | Phase 1 homepage + sidebar + footer |
| `370a098` | Phase 2 close (Organize, Field, practice wins, MCP fallback) |
| `5b9baa7` | Phase 3 close (Print Sales trust, GET print-sales, Listed badges) |
| `b87c08e` | Dedupe print proposals per `shoot_id` (not per portfolio row) |
| `c963a55` | Your growth caption matches Then/Now frames (not portfolio trend +0.7) |

---

## Phase 1 — Home, sidebar, palette, footer, logo

### Shipped

- **Layered Home:** first-visit pitch + capabilities; returning full-bleed hero (true strongest photo, real `count_documents` total, member-since from earliest entry).
- **At a glance:** 3 columns — avg score, recent trend (portfolio recent-vs-older series), assignments completed.
- **Contact sheet** + upload CTA; compact mentor strip; **Then/Now growth** when `portfolioTotal >= 6` and earliest ≠ strongest.
- **Sidebar:** portfolio glimpses, Practice/Mentor/Print badges, contextual blocks, amber mentor one-liner (pinned footer on long Home scroll).
- **Footer:** 3-line trust copy, visible on mobile (not `hidden lg:block`).
- **Logo:** `iris-icon.png` + 512 srcSet in chrome; `iris-mark.svg` avoided at small size (reads as flower).
- **Pitch band:** removed on returning Home (redundant scroll); was dismissible via localStorage when present.
- **Palette:** less amber on non-CTA cards.

### Key files

`HomeTab.tsx`, `AppSidebar.tsx`, `App.tsx`, `IrisMark.tsx` / `BrandLogo.tsx`, `app/memory/portfolio.py` (`get_portfolio_stats`), `GET /api/v1/portfolio/stats`.

### Metrics semantics (important for review)

Two different “growth” numbers exist on Home:

1. **At a glance → Recent trend** — `fetchPortfolioTrends(6)`: average of **newer half vs older half** of last N uploads per dimension (e.g. composition **+0.7**).
2. **Your growth (Then/Now)** — compares **oldest upload** vs **highest overall score**; caption shows **delta between those two frames** (e.g. **+3.8 overall**), not the trend series.

See `app/memory/trends.py` (`_delta_recent_vs_older`) and `HomeTab.tsx` (`growthFrameOverallDelta`).

### Phase 1 gaps closed in later phases

- Practice Win card → Phase 2  
- Print Sales discoverability → Phase 3  

---

## Phase 2 — Organize, Practice, Field, back nav

### Shipped

- **Organize elevation:** Mentor nav badge `Organize · N`, sidebar contextual block, tab subtitle “Tag & tidy your library”, two-path empty states (0 photos vs ready to scan).
- **Humanized HITL:** `humanizeOrganizeReasoning.ts` + `HitlReasoningCallout`; server triage copy without Mongo shoot IDs (`triage_scan.py`).
- **Post-approve feedback:** `OrganizeFeedbackBanner` (tags applied / duplicate removed / reject = nothing changed; “View in My Work”).
- **Field desktop:** `usePreferUploadCapture` → file picker + copy; mobile keeps camera; `SubViewBack` “← Practice”.
- **Assignment visibility:** “Submitted for” in My Work critique + Field; reflection on Practice complete; **Practice Win** on Home (7-day window, thumbnail, `appliedBrief` when stored).
- **Backend:** `applied_brief` on assignment complete → `appliedBrief` in API.
- **Local dev:** `make api-dev` sets `MONGODB_MCP_ALLOW_PYMONGO_FALLBACK=true` (Organize scan 500s without GCP MCP creds).

### Key files

`MentorTab.tsx`, `FieldTab.tsx`, `PracticeTab.tsx`, `MyWorkTab.tsx`, `SubViewBack.tsx`, `assignments.py`, `Makefile`.

### Deferred (optional)

- Field “Continue on phone” QR deep link.

---

## Phase 3 — Print Sales trust, My Work listings, performance

### Shipped

- **`GET /api/v1/print-sales`** — saved listings after approve (`print_sales_list.py`).
- **On approve:** `print_sales` insert + `listed_for_sale` on portfolio `user_tags`.
- **Print Sales tab:** persistent success banner; **Your approved listings**; proposals labeled **“Proposal — not listed until you approve”**; rejected drafts in collapsible section; scan copy + `PrintListingCardsSkeleton`; lazy image loading.
- **My Work:** **Listed** badge on thumbnail; filter **Listed for sale** (`listedForSale.ts`).
- **Dedupe (`b87c08e`):** one listing proposal per **shoot** (library may have multiple critiques of same upload); skip already-listed entries on scan; UI dedupes pending cards by `shootId`.

### Key files

`PrintSalesTab.tsx`, `printSalesClient.ts`, `pending_approvals.py`, `print_sales_scan.py`, `MyWorkTab.tsx`.

### Out of scope (unchanged)

- Live Etsy / marketplace API publish (preview: saved to library only).

---

## Verification (run before claiming regressions)

```bash
cd frontend && npm run build
cd .. && app/.venv/bin/python -m pytest app/tests/ -q
./scripts/verify-phase1-gate.sh   # optional broader gate
```

**Deploy (user GCP account, not runtime SA):**

```bash
./scripts/deploy-coach-api.sh
API_URL=https://practice-companion-api-l6kusl5xcq-uc.a.run.app make deploy-hosting
```

---

## Manual QA checklist (judges / demo)

### Home (returning, 6+ photos)

- [ ] Full-bleed hero = real strongest photo + score  
- [ ] At a glance: avg, **Recent trend** (portfolio series), assignments  
- [ ] Your growth: oldest vs strongest; caption = **frame delta**, not +0.7 alone  
- [ ] Practice Win when recent completion with positive skill delta  

### Organize (Mentor → Organize)

- [ ] Badge when pending; scan → proposals; approve → banner + tags in My Work  
- [ ] Reject → “nothing changed”  

### Practice / Field

- [ ] Desktop Field = upload, not webcam by default  
- [ ] Complete assignment → reflection; Home Practice Win  

### Print Sales (Working pro)

- [ ] Draft proposals → approve → banner + **Your approved listings**  
- [ ] My Work: **Listed** badge + filter  
- [ ] Re-scan: no duplicate cards for same shoot  

### Settings / persona

- [ ] Hobbyist vs Working pro gates Print Sales tab  

---

## Known limitations (not bugs unless spec changes)

| Topic | Behavior |
|--------|----------|
| Duplicate portfolio rows | Same physical upload may exist as multiple `portfolio_entries` (re-upload / re-analyze); Organize/triage may propose per row; Print Sales scan dedupes by `shoot_id`. |
| Growth vs trend | Then/Now is **not** a time-series; trend is **recent half vs older half** of last N photos. |
| Etsy | Approved listings stored in MongoDB only; copy states not live on Etsy. |
| Logo | Raster icon in sidebar; SVG mark not used at small sizes. |
| Practice detail | No separate assignment detail route; completed history expands inline on Practice tab. |

---

## Suggested next work (outside Phases 1–3)

Full inventory: **[`docs/PENDING-AND-SCOPE.md`](../../PENDING-AND-SCOPE.md)** (pending, out of scope, Claude validation prompt).

- Hackathon **Devpost** / demo script (draft exists locally: `docs/devpost-article-draft.md`, may be untracked).  
- Optional: Field QR, tour polish, light mode, Etsy integration.  
- iOS parity audit vs web (separate codebase under `ios/`).  

---

## Review prompts for Claude

1. **Spec compliance:** Walk `2026-05-31-iris-full-polish-design.md` §Phase 1–3 against this doc and open the cited files — flag only **material** gaps.  
2. **Trust / HITL:** Organize + Print Sales — does post-approve copy answer “where did my data go?”  
3. **Metric honesty:** Home growth vs At a glance trend — labels clear for non-technical judges?  
4. **Deploy drift:** Confirm hosted bundle calls `GET /api/v1/print-sales` and shows deduped proposals after scan.  
5. **Security / demo:** No secrets in repo; demo user scoping via `DEMO_USER_ID` / Firebase auth as configured in `.env`.  

---

## Related docs

| Doc | Role |
|-----|------|
| `2026-05-31-iris-full-polish-design.md` | Approved design spec |
| `2026-05-31-phase1-cursor-implementation.md` | Cursor task-by-task Phase 1 log (historical) |
| `docs/deploy.md` | Firebase + Cloud Run deploy |
| `docs/PENDING-AND-SCOPE.md` | Pending vs out of scope + validation prompt |

**End of Phases 1–3.** No Phase 4 in spec. Further product work = new spec or hackathon collateral only.
