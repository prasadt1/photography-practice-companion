# Hackathon — 11 days to submission: strategy + prompt for Claude

**Context:** Google Cloud Rapid Agent Hackathon — deadline **June 11, 2026** (~11 days from late May 2026).  
**Product status:** Web polish **Phases 1–3 closed**; production at https://practice-companion-hackathon.web.app.  
**Inventory baseline:** [`PENDING-AND-SCOPE.md`](PENDING-AND-SCOPE.md) · **Handoff:** [`superpowers/reviews/2026-05-31-phases-1-3-review-for-claude.md`](superpowers/reviews/2026-05-31-phases-1-3-review-for-claude.md)

**Purpose of this doc:** Consolidate advisor recommendations on what to do in the remaining days (collateral vs code vs out-of-scope vs new ideas). Share with Claude for prioritization, pushback, and a realistic 11-day plan.

---

## 1. Situation summary

| Fact | Detail |
|------|--------|
| **Win condition now** | Submission quality + judge story — **not** more Phase 1–3 polish |
| **Code review** | Claude validation: **0 material gaps** vs polish spec; `PENDING-AND-SCOPE` accurate |
| **Submit blocker** | **Demo video URL** (~3 min; only first 3 min judged) + Devpost finalize |
| **Under-marketed assets** | iOS **live field coach** (built); MongoDB MCP / playground orchestrator; Agent Builder grounding (in Coach, not always visible in UI) |
| **Track** | MongoDB partner track — memory, vectors, HITL, agent reads matter in narrative |

---

## 2. Mindset (do more / do less)

### Do more of

- What judges **see in the first 3 minutes** of the video
- **iPhone live coach** B-roll (periodic cues, not 30 FPS — honest copy)
- **MongoDB + Agent Builder** proof in text and optional playground clip
- **Demo reliability** — seeded Working pro library, rehearsed path

### Do less of

- Refactors, light mode, live Etsy API
- “Brand new product” pivots unrelated to Iris memory + mentor loop
- **Agent Engine** as production URL migration (unless 2–3 dedicated days and Cloud Run stays canonical)
- **Vision-impairment** full UI unless ship + VoiceOver test within the window

---

## 3. Tier 1 — Highest ROI (mostly non-code)

| # | Item | Why | Effort |
|---|------|-----|--------|
| 1 | **~3 min demo video** | Devpost weights heavily; only blocker vs “safe to submit” | 1–2 days |
| 2 | **Devpost final pass** | MongoDB track: memory + HITL + honest Cloud Run vs Agent Engine | ~0.5 day |
| 3 | **Judge demo account** | Working pro, 10–20 photos, Organize pending, 1–2 approved listings | `make seed-demo` + manual |
| 4 | **`demo-video-script-3min.md`** | Rehearsal; web 0:00–1:50 + iPhone 1:50–2:40 + URL close | ~1 hour doc |
| 5 | **Optional 30s playground clip** | ADK orchestrator + MongoDB MCP — most judges won’t run playground | Screen record |

**Suggested video structure**

| Time | Content |
|------|---------|
| 0:00–0:20 | Hook: working photographer, Iris remembers every shot |
| 0:20–1:50 | **Web** Working pro: Home → My Work (Glass Box) → Organize approve → Print Sales approve → Listed in My Work |
| 1:50–2:40 | **iPhone**: Shoot FAB → live coach on-screen cue → shutter → critique sheet |
| 2:40–3:00 | Stack one-liner (Gemini, Cloud Run, Atlas, MCP) + **https://practice-companion-hackathon.web.app** |

**Narrative line for copy:** “Production on Cloud Run; multi-agent ADK architecture demonstrable in playground; MongoDB holds portfolio, assignments, listings, and searchable critique text.”

---

## 4. Tier 2 — Small pulls from deferred / pending (2–4 days each)

Bounded work that was **out of polish scope** or **pending** but fits the story:

| # | Feature | Rationale | Est. effort |
|---|---------|-----------|-------------|
| A | **Organize dedupe by `shoot_id`** | Parity with Print Sales scan; same photo twice → one card | ~0.5 day |
| B | **Field → iPhone QR** (“Continue on phone”) | Web + mobile one system; optional Phase 2 item | ~1 day |
| C | **“Similar in your library” UI** | Uses existing `portfolio_entries.embedding`; strong MongoDB track moment | 2–4 days |
| D | **Agent Builder grounding visible in UI** | “Grounded in …” chip on Glass Box with principle titles from Discovery Engine | 1–2 days |
| E | **Light HITL activity history** | Recent approve/reject from `pending_approvals` + `print_sales` | 2–3 days |
| F | **iOS video-only polish** | Fonts, composition-lock label, VoiceOver on Shoot — for recording quality | 1–2 days |

---

## 5. Tier 3 — Bigger bets (week 2 spike only)

| Idea | Upside | Risk |
|------|--------|------|
| **Vertex Agent Engine deploy** | Google ecosystem checkbox | Time, env drift; keep Cloud Run as judge URL |
| **MongoDB MCP on prod Mentor path** | “MCP in production” for partner track | Ops; may suffice to run `verify_mcp_in_production.sh` + playground |
| **Web live field coach (lite)** | Parity with iOS | 5–7 days; new UX + periodic API |
| **VI third persona in onboarding** | Differentiation | Over-claim risk without full a11y QA |

---

## 6. Brand-new ideas (not in polish spec)

Aligned with hackathon themes; **do not** replace core demo path:

| Idea | Pitch angle | Est. effort |
|------|-------------|-------------|
| **Judge mode / guided tour v2** | Auto-walk tabs with captions for reproducible demo | 2–3 days |
| **Portfolio NL search bar** | Atlas Search on Glass Box text (“backlit portraits”) | 2–4 days |
| **Assignment before/after compare** | Baseline vs completion shoots side-by-side | ~2 days |
| **Mentor action chips** | “Run Organize”, “Draft listings” → real API calls | 2–3 days |
| **Eval / trace admin page** | Last critique: model, latency, `mcp_read_ok` | 1–2 days |
| **XMP in video** | Pro workflow; export already exists | Copy + 30s B-roll |

---

## 7. Explicitly do NOT start before submit

| Item | Reason |
|------|--------|
| Live Etsy / marketplace API | Out of scope; honesty liability |
| Light mode, tab-based Home, full breadcrumbs | Polish spec out of scope |
| Backlog Triage agent | Spec deferred post-hackathon |
| Atelier marketplace, verticals (video, music, writers) | New product |
| Apple Watch, offline queue, Lightroom plugin | Roadmap |
| True 30 FPS real-time coach | Contradicts architecture |
| Full web–iOS feature parity | 11 days insufficient |

See full lists: [`PENDING-AND-SCOPE.md`](PENDING-AND-SCOPE.md) §4.

---

## 8. If only ONE code spike

**Pick one:**

1. **Similar photos** (vector UI) — best MongoDB track “wow” in video  
2. **Grounding chip** (Agent Builder visible) — best Google Agent Builder checkbox in UI  
3. **Organize dedupe + QR** — fastest; cleans demo annoyance + mobile bridge  

**Advisor default:** Similar photos **or** grounding chip over Agent Engine migration.

---

## 9. Calendar — Prasad availability (deadline **Jun 10, 22:00 CET**)

| Window | Hours (approx.) | Cumulative |
|--------|-------------------|------------|
| Jun 1–5 | 3–4 h/day → **~17 h** | 17 h |
| Jun 6–7 | 10 h/day → **~20 h** | 37 h |
| Jun 8–10 | 3–4 h/day → **~10 h** | **~47 h total** |

**Recommendation:** **Path B** fits comfortably (~12 h submit + ~14 h similar-photos spike + ~10 h video polish + buffer).

| Date | Hours | Deliverable |
|------|-------|---------------|
| **Jun 1** | 3–4 | `make seed-demo`; set `DEMO_USER_ID`; confirm Atlas **`portfolio_vector`** index exists |
| **Jun 2** | 3–4 | `demo-video-script-3min.md`; rehearse; upload **1 real photo** on prod demo user (embedding for spike) |
| **Jun 3** | 3–4 | Record **video v1** (web + iPhone B-roll); unlisted YouTube/Vimeo |
| **Jun 4** | 3–4 | Devpost draft + video URL; README judge path |
| **Jun 5** | 3–4 | Buffer / P0 fixes only — **soft submit possible** if v1 good |
| **Jun 6** | 10 | Similar photos: API wrapper + tests (`mentor_tools.vector_search_similar_photos`) |
| **Jun 7** | 10 | My Work UI + deploy + QA — **code freeze 22:00** |
| **Jun 8** | 3–4 | Re-record **video v2** (5–10 s similar-photos in My Work) |
| **Jun 9** | 3–4 | Final Devpost pass; optional 30 s playground clip |
| **Jun 10** | 3–4 | **Publish by 22:00 CET** — re-record only if P0 |

**Skip Agent Engine** — see §13 below.

---

## 9b. Generic 11-day calendar (template)

| Days | Focus |
|------|--------|
| **1–2** | Seed demo data; record 3-min video; draft Devpost |
| **3–4** | Finalize Devpost; README “Judge path”; optional playground clip |
| **5–7** | **One** Tier-2 spike (team choice) |
| **8–9** | Prod QA; P0 fixes from recording only |
| **10–11** | Buffer; re-record video; **submit early** |

---

## 10. References for Claude

| Doc | Use |
|-----|-----|
| `PENDING-AND-SCOPE.md` | Done / pending / out of scope / validation §8 |
| `implementation-and-hackathon-mapping.md` | Rules §7, MongoDB track, MCP honesty |
| `devpost-article-draft.md` | Narrative draft (verify no over-claims) |
| `ios/README.md` | Live coach, Shoot — trust over root README roadmap |
| `ios-demo-video-script.md` | Short iPhone script (extend for 3-min) |

---

## 11. Prompt for Claude — perspective and plan

Copy the fenced block below into a new Claude session (with repo access if possible).

```markdown
You are a hackathon strategy advisor for **Iris** (photography-practice-companion).
The author has **~11 days** until Devpost deadline (June 11, 2026).
Product polish Phases 1–3 are **done**; production web app is live.
Read first: docs/HACKATHON-11DAY-STRATEGY-FOR-CLAUDE.md (this strategy)
and docs/PENDING-AND-SCOPE.md (inventory).

## Your task

Give **perspective and a prioritized plan** — not implementation unless asked.

### 1. Reality check (1 short paragraph)
Is the Tier 1 / Tier 2 / Tier 3 framing sound for a solo builder with evenings/weekends?
What would you **cut** or **merge**?

### 2. Ranked recommendation
Pick **one path** for the 11 days:

- **Path A — Submit-first:** video + Devpost only, no code
- **Path B — Submit + one spike:** which single item (C similar photos, D grounding chip, A+B dedupe+QR, or other from doc)
- **Path C — Ambitious:** Agent Engine or MCP-in-prod — only if you justify risk vs Path B

State which path you recommend and why for **MongoDB partner track** judges.

### 3. Eleven-day plan
Day-by-day (or Mon–Sun × 2 weeks) with:
- deliverable per day
- **stop line** (when to freeze code and only re-record video)
- early-submit target date

### 4. Devil’s advocate
List **3 ways the proposed spikes could hurt** the submission (regression, over-claim, time sink).
List **3 “brand new” ideas** from §6 that are **traps** and should stay cut.

### 5. Devpost + video alignment
One paragraph: how to weave iOS live coach + MongoDB memory + HITL into **first 60 seconds** of video without cramming.

### 6. Questions for the author (max 5)
Only ask what you need to choose between Path A/B/C (e.g. hours/week, TestFlight, partner track certainty).

## Rules
- Do not suggest live Etsy, light mode, or full VI UI unless author explicitly opts in.
- Cloud Run remains production URL; Agent Engine is optional proof only.
- Prefer honest judge narrative over feature count.
- Cite repo files when recommending a spike (e.g. embeddings in portfolio.py, grounding.py).
- Material advice only; no generic hackathon platitudes.
```

---

*After Claude responds, optionally append summary to §12 below or link from Devpost checklist.*

## 12. Claude response (2026-05-31)

**Recommendation:** **Path B** — submit-first (Days 1–4), then **one spike: Similar photos** (§4.C). Skip Agent Engine (Path C).

**Stop line:** End of Day 7 (Fri Jun 6) — code freeze; Days 8–10 video re-record + early submit (Mon Jun 9).

**Spike scope:** `GET /api/v1/portfolio/{id}/similar` wrapping existing `vector_search_similar_photos` in `app/sub_agents/tools/mentor_tools.py` (index name `portfolio_vector`). My Work detail: 4-thumbnail row.

**Traps (don’t build):** NL search bar, Mentor action chips, Judge auto-tour v2.

**First 60s video:** Hook → upload + Glass Box → Home memory proof → Organize HITL → MongoDB one-liner; iPhone at 1:50.

### Cursor answers to Claude’s five questions (repo-grounded)

| # | Question | Answer |
|---|----------|--------|
| 1 | Hours per day? | **Author decides** — plan assumes ~2h evenings + one weekend block; scale Day 5–7 if full days |
| 2 | Vector index? | Code expects Atlas index **`portfolio_vector`** on `portfolio_entries.embedding` (`mentor_tools.py`). **Not** in `memory/indexes.py` bootstrap — verify in Atlas UI or create before spike. **`make seed-demo` does not seed embeddings** — spike demo needs real uploads or extend seed script |
| 3 | TestFlight? | **Author decides** — `ios/README.md`: Xcode device build; no TestFlight requirement in repo |
| 4 | Demo account? | **`make seed-demo`** exists (`scripts/seed-demo-data.py`); stable `DEMO_USER_ID=6577a1f2b3c4d5e6f7a8b9c0`; 16 Unsplash entries — re-run with `--reset` if needed |
| 5 | Track? | **Author decides** — doc assumes **MongoDB partner** primary; grounding chip secondary if also Google track |

---

## 13. Dual track vs Agent Engine (FAQ)

### What is “dual track”?

The hackathon has a **main** Google Cloud Rapid Agent competition **plus optional partner tracks** (e.g. **MongoDB**). On Devpost you typically:

1. Submit **one** project (one repo, one video, one URL).
2. **Select the MongoDB partner track** (checkbox / track field) so you are eligible for **MongoDB-specific prizes** and judging that cares about Atlas + MCP.
3. You may **also** be considered for **general** prizes (impact, design, implementation) — same submission, not two codebases.

**“Dual track”** in earlier advice meant: optimizing copy for **MongoDB partner** *and* mentioning **Google** stack (Gemini, Agent Builder, ADK) — **not** building two products or deploying twice.

**For Iris:** Submit **once**, select **MongoDB track**, lead narrative with **memory + embeddings + HITL**; mention Gemini + Agent Builder + Cloud Run in “Built with” and video.

### Will skipping Agent Engine penalize you?

**No — if you are honest and meet the written requirements.**

Official **must-haves** (from `implementation-and-hackathon-mapping.md` §7.A) are:

| Requirement | Iris |
|-------------|------|
| **Gemini** | Yes — Coach, Planner, Reflection, Mentor |
| **Google Cloud Agent Builder** | Yes — Discovery Engine Data Store for principles (`grounding.py`) |
| **Partner (MongoDB) integration** | Yes — Atlas, embeddings, MCP story, HITL |
| **Web (± mobile)** | Yes — Firebase + iOS |

**Agent Engine is not listed as a submission requirement.** It is an optional way to host ADK agents. Your production path is **Cloud Run FastAPI**, which is normal for this hackathon and documented in your Devpost draft as:

*“Production API on Cloud Run; multi-agent ADK in playground; Agent Engine scaffold in-repo for future deploy.”*

**Judging (§8)** weights implementation, design, impact, idea — not “did you deploy to Agent Engine.”

**Do not** claim “hosted on Vertex AI Agent Engine” if judges open Cloud Run. **Do** claim ADK multi-agent architecture + Agent Builder grounding + Atlas memory.

**Optional low-cost boost (no Agent Engine deploy):** 30 s screen recording of `make playground` showing orchestrator + tools — strengthens “agentic” without migrating prod.

---

*Maintainer: update when deadline, track, or scope changes.*
