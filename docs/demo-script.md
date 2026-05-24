# Demo script (3 minutes)

**Canonical:** [`spec.md`](spec.md) §13–16 · **UI flows:** [`ui-ux-design.md`](ui-ux-design.md)

**Trademark:** Say “industry-standard photo management software” for Lightroom; avoid prominent Adobe logos. MongoDB/Google logos OK.

---

## 0:00–0:15 — Setup

> “Meet Maya, a hobbyist working on portraiture. Her last three shoots live in Practice Companion — an AI mentor that remembers who she is as a photographer.”

Show **Memory** tab timeline (seed data).

---

## 0:15–0:30 — Practice tab

> “She’s on an active assignment: use rule of thirds deliberately. Baseline: 2 of 15 frames showed intentional thirds.”

Show **Practice** tab: assignment card, baseline thumbnails.

---

## 0:30–0:50 — Upload + Coach (Studio)

Upload one new image (GCS-backed).

> “Coach grounds in curated principles — not a black box.”

Point to **grounding citation** (e.g. `composition.md — rule of thirds`).  
Show Glass Box + spatial overlay (lighting map, subject relationships).

---

## 0:50–1:10 — Reflection + ISAR

> “Reflection compares baseline vs this shoot and computes Intentional Skill Application Rate.”

Show ISAR delta (e.g. 13% → 67%). Side-by-side baseline vs current.

---

## 1:10–1:15 — Change stream (background)

> “When a new portfolio entry lands, MongoDB change streams recompute her aesthetic profile — no polling.”

Flip to **Memory** tab; show `aesthetic_profile` updated (`computed_from_portfolio_size`).

---

## 1:15–1:25 — Planner

> “Planner proposes the next assignment from memory + profile.”

Show new assignment `rationale`.

---

## 1:25–1:30 — XMP export

> “Export XMP sidecars for her existing workflow.”

Download ZIP; optional 5s Lightroom import (no sustained branded UI).

---

## 1:30–2:00 — Judge pitch (MongoDB)

1. Atlas = memory substrate (vectors + full-text + change streams + documents).  
2. Orchestrator **reads** via **MongoDB MCP**.  
3. Vector + Atlas Search + change streams work together.  
4. Pattern generalizes to other creators.

---

## 2:00–2:30 — Judge pitch (Google)

5. Agent Builder Data Store grounds Coach.  
6. ADK multi-agent + Agent Engine + Gemini 3 Pro multimodal.  
7. Firebase Hosting + GCP-only stack (rules-compliant).

---

## 2:30–3:00 — Field Mode (optional)

30s: iPhone on LAN HTTPS, voice hint after capture.  
“If short on time, cut Field Mode; Studio loop is the core.”

---

## Pre-demo checklist

- [ ] Seed data loaded (`scripts/seed-demo-data.py`)  
- [ ] Agent Engine warm (min instances if configured)  
- [ ] MCP + Atlas reachable from demo network  
- [ ] Demo images license-cleared (own work or Unsplash/Pexels documented)
