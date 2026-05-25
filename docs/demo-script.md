# Demo script (3 minutes)

**Canonical:** [`spec.md`](spec.md) §13–16 · **UI flows:** [`ui-ux-design.md`](ui-ux-design.md)  
**App shell (2026-05):** Home hub · bottom nav (Home, Studio, Work, Mentor) · sidebar on desktop · `#studio`, `#memory`, `#triage`, `#print`, `#mentor`

**Trademark:** Say “industry-standard photo management software” for Lightroom; avoid prominent Adobe logos. MongoDB/Google logos OK.

---

## 0:00–0:15 — Setup

> “Meet Maya, a hobbyist working on portraiture. Her last three shoots live in **Iris** — an AI mentor that remembers who she is as a photographer.”

Open **Home** → **My Work** (`#memory`) — seed data timeline.

---

## 0:15–0:30 — Practice

> “She’s on an active assignment: use rule of thirds deliberately.”

**Home** → **My Practice** or sidebar **Practice** (via Home card) — assignment card, baseline.

---

## 0:30–0:50 — Studio critique

Upload one new image in **My Studio** (`#studio`).

> “Coach grounds in curated principles — not a black box.”

Default tab **Why I scored it** (Glass Box) + **Overview** preview. Point to photography principles / evidence sources.

---

## 0:50–1:10 — Reflection

> “Reflection compares baseline vs this shoot and how often she applied the target skill.”

Complete assignment in **My Practice** — show plain-language skill improvement (not “ISAR” in UI).

---

## 1:10–1:15 — Change stream (background)

> “When a new portfolio entry lands, MongoDB change streams recompute her aesthetic profile.”

**My Work** → Refresh → aesthetic snapshot (`computed_from_portfolio_size`).

---

## 1:15–1:25 — Planner

> “Planner proposes the next assignment from memory + profile.”

New assignment rationale on **My Practice**.

---

## 1:25–1:30 — XMP export

> “Export XMP sidecars for her existing workflow.”

From Studio results → download sidecar.

---

## 1:30–2:00 — Judge pitch (MongoDB)

1. Atlas = memory substrate (vectors + full-text + change streams + documents).  
2. Orchestrator **reads** via **MongoDB MCP**.  
3. Vector + Atlas Search + change streams work together.  
4. Pattern generalizes to other creators.

---

## 2:00–2:30 — Judge pitch (Google)

5. Agent Builder Data Store grounds Coach.  
6. ADK multi-agent + Agent Engine + Gemini multimodal.  
7. Glass Box = transparent reasoning in UI.

---

## 2:30–3:00 — HITL (choose one)

**Hobbyist — Label Photos** (`#triage` or sidebar): Scan → amber **Why I'm suggesting this** → approve one tag batch.

**Working pro — List for Sale** (`#print`): Settings → Working pro → draft listings → approve one card.

**Ask Mentor** (`#mentor`): One portfolio question — staged loading (30–90s) shows progress.

---

## Deep links (90s fast path)

| Step | URL hash |
|------|----------|
| Studio upload | `#studio` |
| Portfolio | `#memory` |
| Label HITL | `#triage` |
| Print HITL | `#print` (Working pro in Settings) |
| Mentor | `#mentor` |

**Production:** https://practice-companion-hackathon.web.app
