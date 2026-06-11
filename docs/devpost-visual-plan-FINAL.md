# Iris — Devpost Visual Plan (FINAL / single source of truth)

> This file **supersedes** the visual-placement guidance scattered across
> `devpost-media-checklist.md`, `devpost-media-matrix.md`, `FIGURES.md`,
> `devpost-screenshot-guide.md`, `COLLAGES.md`, `diagram-slice-specs.md`,
> and `devpost-visual-prompts.md`. When those disagree, this wins.
> Last decided: 2026-06-08.

---

## The three decisions that matter

1. **Hero singles, not collages, are the primary gallery format.** Collages shrink every
   screenshot until the text is illegible. Hero singles (`hero-0X-*.png`) keep scores,
   labels, and reasoning readable. Collages are *optional* "full flow" extras only.
2. **Lead every surface with Glass Box.** It's the one true wow vs one-shot graders.
   Cover, first inline image, first gallery slot — all Glass Box.
3. **The architecture/data-flow diagrams must show MCP.** As shipped they don't contain
   the letters "MCP" and draw reads/writes identically. That undersells the MongoDB track.
   Rebuild before submit (see "Known gaps" below). Until rebuilt, do **not** feature them inline.

---

## Inline embeds (in the written story) — exactly 3

Judges skim. Inline images are for the few who read; keep it to three, all `raw.githubusercontent.com`
URLs from `docs/devpost-public/`.

| Slot | File | Section | Caption |
|------|------|---------|---------|
| 1 | `hero-02-glass-box-studio.png` | Top, under tagline / "What it does" | Glass Box — five-axis scores, inspectable reasoning, grounded principles. |
| 2 | `diagram-architecture.png` *(rebuilt, MCP shown)* | "How I built it" | Clients → FastAPI → ADK orchestrator (9 agents) → Gemini + Agent Builder + MongoDB Atlas via MCP. |
| 3 | `mcp-cloud-trace.png` **or** `diagram-03-vector-similar.png` | "Why MongoDB" | Production reads via MongoDB MCP (`mongodb.mcp.find` spans) + Atlas Vector Search for similar photos. |

Rule: a diagram slice lives **either** inline **or** in the gallery, never both.

---

## Image gallery — 8 slots, this order

Hero singles first (legible, branded), diagrams last (context). This is the order a judge
who scrubs the gallery should experience.

| # | File | Title | Caption |
|---|------|-------|---------|
| 1 | `hero-02-glass-box-studio.png` | Glass Box — Studio critique | Gemini multimodal critique: five-axis scores, spatial overlay, "Why I scored it," concrete fixes. |
| 2 | `hero-01-home-memory.png` | Home — your library, remembered | Dashboard with at-a-glance scores, best-in-library hero, growing contact sheet. Persistent portfolio memory. |
| 3 | `hero-05-organize-hitl.png` | Organize — human approval required | Triage proposes tag harmonization + dedupe; every bulk change waits in Pending Approvals. |
| 4 | `hero-06-my-work-library.png` | My Work — NL search + similar photos | Atlas Search (Gemini query expansion) + vector "similar photos" row on expand. |
| 5 | `hero-04-mentor-chat.png` | Mentor — ADK orchestrator chat | Orchestrator delegates to sub-agents and grounds answers in your portfolio history. |
| 6 | `hero-03-practice.png` | Practice — HITL assignments | AI-proposed brief targeting your weakest skills; you accept or decline. |
| 7 | `diagram-architecture.png` *(rebuilt)* | Architecture | Three tiers: clients, ADK agent layer, MongoDB Atlas + GCS. MCP reads labeled. |
| 8 | `diagram-agent-orchestration.png` | Nine agents, one orchestrator | Persona-filtered tool lists across Coach, Mentor, Planner, Reflection, Triage, Print Sales, Field Coach, Visual Describer. |

**Cover / thumbnail:** crop of `hero-02-glass-box-studio.png`.

Optional 9th/10th if room: `hero-07-working-pro.png` (Print Sales HITL), `diagram-data-flow.png` *(rebuilt)*.

---

## Impact ranking (where effort actually moves judges)

1. **Demo video (~3 min).** Heavily weighted; only first 3 min judged. Everything else is secondary.
2. **Glass Box hero single.** The differentiator. Cover + inline #1 + gallery #1.
3. **Rebuilt architecture diagram showing MCP + 9 agents.** Anchors "Technological Implementation."
4. **Organize / Pending Approvals (HITL) screenshot.** Free points on the Design criterion.
5. **MCP Cloud Trace screenshot.** Hard partner-track proof almost no competitor will have.

Gallery filler (good to have, low marginal impact): Practice, Print Sales, light mode, iPhone stills —
the video already carries mobile.

---

## What to demote / cut

- **Collages (`collage-0X-*.png`)** — illegible at gallery scale. Keep out of the primary set;
  use only if you specifically want to show a numbered multi-step flow, and never as the cover.
- **`diagram-user-journey-*.png`, `diagram-ios-architecture.png`** — fine for the GitHub README,
  not the Devpost gallery. They dilute a skimming judge's attention.
- **Light mode, theme toggle, VI persona UI** — do not show as shipped (VI UI is roadmap).

---

## Known gaps to close before submit

- [ ] **Rebuild `diagram-architecture.png` + `diagram-data-flow.png`** in brand aesthetic
      (canvas `#1a1816`, amber `#f59e0b`, MongoDB green `#47A248` on Atlas nodes only),
      with an explicit **MCP** layer and a "Reads: MCP · Writes: PyMongo" label.
      Current versions are plain Mermaid and omit MCP entirely.
- [ ] Fix model label: "Gemini 3.1 Pro" consistently (architecture diagram currently says "Gemini 3 Pro").
- [ ] Capture `mcp-cloud-trace.png` (GCP Console → Trace → expand `mongodb.mcp.find` / `aggregate` spans).
- [ ] Confirm iPhone stills exist if used in gallery (`ios-shoot-horizon.png`, `ios-critique-radar.png`).

---

## Brand quick-reference (for any new/rebuilt asset)

- Canvas `#1a1816` · amber `#f59e0b` / `#fbbf24` · cream `#e7e5e4` · MongoDB green `#47A248` (Atlas only) · Google blue `#4285F4` (subtle).
- Editorial photography-gallery / darkroom feel. **Not** purple-gradient AI SaaS.
- Serif headlines, mono for scores, sans for UI.
- Capture web at 1440×900; iPhone native.
