# Design review brief — Practice Companion

**Purpose:** Ground UI/UX reviewers (human or AI) in what this product **is**, **who it serves**, and **what is shipped vs planned**. Do not invent features, personas, or integrations not listed here.

**Repository:** `photography-practice-companion`  
**Hackathon:** Google Cloud Rapid Agent Hackathon — MongoDB partner track  
**Public demo (typical):** Firebase Hosting + Cloud Run API  
**Author voice:** First person singular in user-facing copy unless noted.

---

## 1. Product vision (one paragraph)

Practice Companion is an **AI photography mentor** that **remembers** your work across sessions. A single orchestrator routes to specialized sub-agents (critique, practice planning, portfolio memory, marketplace drafts, field coaching) based on **persona**. The differentiator for judges: **proper ADK multi-agent architecture** + **MongoDB as the memory layer** (portfolio, HITL approvals, aesthetic profile, print sales history) — not a single chatbot with a memory sticker.

**What we are not claiming:** Live Etsy/Shopify publish, medical/accessibility certification, or replacement for professional photo education.

---

## 2. Audiences (personas)

| Persona | Who they are | Product promise | Access pattern |
|--------|----------------|-----------------|----------------|
| **Hobbyist** | Skill-building photographer | Critique, practice assignments, portfolio memory, light HITL | Web: Studio, Practice, Memory, Mentor, Organize |
| **Working pro** | Commercial / print-sales oriented | Above + Print Sales listing drafts with **per-listing** human approval | Web: all hobbyist tabs + **Print** |
| **Photographer with vision impairment** | Creative expression via non-visual feedback | Voice-first field coaching, scene narration, haptic guidance (spec); Visual Describer sub-agent | **Backend + tests only today** — see §5 |

**International readers:** Gloss Indian/global health terms only if we add India-specific facility copy later; current demo is persona-first, not geography-first.

---

## 3. Architecture (for “don’t fake multi-agent”)

- **9 ADK `LlmAgent` instances:** 1 orchestrator + 8 sub-agents (`app/sub_agents/*.py`).
- **Persona enforcement:** Orchestrator `AgentTool` list is **filtered by persona** (`app/agent.py`) — forbidden agents are omitted from the toolset, not just prompt-suggested.
- **Web chat:** `POST /api/v1/agent/chat` → ADK Runner → orchestrator → sub-agents. Replies may arrive via `function_response` (sub-agent), not only plain text.
- **Studio critique:** Deterministic `POST /api/v1/analyze-photo` (Coach pipeline) — fast, Glass Box scores, writes `portfolio_entries`.
- **HITL:** `pending_approvals` collection — **no** autonomous delete, tag apply, or marketplace publish until user approves in UI.

---

## 4. Shipped features (web — as of this brief)

| Area | User-facing name | What it does | Persona |
|------|------------------|--------------|---------|
| **Studio** | Studio | Upload → multimodal critique → scores + Glass Box | All (default entry) |
| **Practice** | Practice | Proposed assignments → Accept → Shoot now / Studio later → Complete → Reflection | Hobbyist + Working pro |
| **Memory** | Memory | Portfolio grid, aesthetic snapshot, dominant tags | All |
| **Mentor** | Mentor | Orchestrator chat; markdown replies; suggested questions per persona | Hobbyist + Working pro |
| **Organize** | Organize (nav was “Triage”) | Library scan → tag/delete **proposals** → approve per card | Hobbyist + Working pro |
| **Print** | Print | Listing drafts → edit price → approve/reject **per card**; writes `print_sales` in MongoDB only | **Working pro only** |
| **Field** | Field | Browser camera/gallery → analyze with active assignment | Hobbyist + Working pro |

**Persona toggle in UI:** Only **Hobbyist** and **Working pro** (`ModeToggle.tsx`). API/DB accept `vision_impairment` but the web app does not expose it.

**Integrations (honest):**

| Integration | Status |
|-------------|--------|
| MongoDB Atlas | Yes — portfolio, users, assignments, pending_approvals, print_sales |
| Vertex / Gemini (Coach, agents) | Yes |
| GCS signed URLs for portfolio images | Yes |
| Firebase Hosting | Yes |
| Cloud Run API | Yes |
| Etsy / Society6 live API | **No** — “Listed on etsy” = DB record + UI message |
| Native iOS app | **No** — `ios/README.md` placeholder only |
| Agent Engine separate URL for web | **No** — orchestrator on same Cloud Run service |

---

## 5. Third persona — vision impairment (truth table)

| Layer | Status |
|-------|--------|
| MongoDB `users.persona` | `vision_impairment` valid |
| `visual_describer` sub-agent | Implemented |
| Orchestrator tool filter | Visual Describer only for this persona; no print_sales/triage |
| `tests/test_persona_isolation.py` | Covers vision_impairment |
| Web persona toggle | **Not implemented** |
| Voice / haptic / ARKit field flow | **Not implemented** (spec Phase 3–4) |
| Dedicated UI copy / a11y pass for low vision | **Not done** |

**Design implication:** Do not design marketing or primary nav around three personas until product exposes the third. Optional: “Accessibility roadmap” section or future mode — do not present as live in web demo.

---

## 6. Current UI/UX character (honest critique seed)

**Strengths**

- Functional tab model; Glass Box / Memory reads as “serious tool”
- Mentor markdown rendering; Organize/Print explain HITL in plain language
- Green-on-slate brand tokens (`index.css` `@theme`)

**Weaknesses (why a design pass is warranted)**

- Reads as **generic AI SaaS**: gradient hero patterns, Inter-like stack, “Gemini 3.1 Pro” badge — hackathon/demo, not consumer brand
- **Engineering chrome** visible: `make api-dev`, “orchestrator”, “persona”, MongoDB collection names in footers
- Inconsistent tab naming (Organize vs internal “triage”)
- No marketing **landing** narrative — app opens straight into tool tabs
- Vision persona absent — accessibility story under-served on web
- Mobile Field tab is utilitarian, not “viewfinder companion”

---

## 7. Design goals for the review

1. **Consumer-first** — Photographer audience, not judge/developer. Hide or relegate dev instructions to docs/README.
2. **Persona-coherent flows** — Not a re-color: different **journeys, nav emphasis, and copy** per persona (see §16). Tab bar alone is not enough.
3. **Photography-native** — Feels like a tool for people who shoot, curate, and sell prints — not a hackathon landing page (see §17).
4. **Trust** — HITL and memory explained without jargon; avoid implying live marketplace publish.
5. **Distinct brand** — Move away from template “AI startup” dark mode; editorial/gallery-adjacent art direction (still accessible).
6. **Responsive + field-ready** — Phone and narrow viewports are first-class (see §14); Field tab is a real capture path today.
7. **Accessibility by design** — Baseline WCAG for all users; expanded patterns for low-vision photographers (see §15).
8. **Informed by market** — Borrow patterns from proven photo products, not generic SaaS (see §13).
9. **Do not break** — Tab routes, API env (`VITE_API_BASE_URL`), persona API, HITL flows.

**Explicit non-goal for this pass:** “Re-skin only” (new palette + font on the same flat 7-tab chrome). Reject proposals that only change colors without IA, flow, or copy changes.

---

## 8. What reviewers should avoid (anti-hallucination)

- Do not add **Stripe**, **Instagram**, or **real Etsy OAuth** unless explicitly scoped as future.
- Do not claim **9 agents visible in UI** — traces/playground are dev-facing.
- Do not design **batch approve** for Print or Organize — spec forbids for working pro financial actions.
- Do not replace ADK sub-agents with a single “super prompt” architecture in copy or diagrams for the shipped product.
- Do not show **vision_impairment** as a third toggle unless implementation is scheduled in the same sprint.
- Do not use **“we”** in author-facing README/Devpost unless Prasad prefers otherwise — default **I** per project conventions.

---

## 9. Key user journeys (for journey-based critique)

**Hobbyist — first session**

1. Studio upload → critique → entry in Memory  
2. Practice → suggest assignment → accept → Field or Studio shoot  
3. Mentor → “How am I doing?” → narrative from portfolio  
4. Organize → scan → approve tags on a cluster  

**Working pro — commercial**

1. Switch persona → Print tab appears  
2. Draft listings → change price on one → approve one, reject one  
3. Mentor → print-sales-oriented starter question (slow; 60–90s possible)  

**Judge / investor — 90 seconds**

1. One Studio critique (Glass Box visible)  
2. Memory aesthetic snapshot  
3. One HITL approve (Organize or Print)  
4. One sentence: multi-agent + MongoDB memory  

---

## 10. Suggested review deliverables

| Deliverable | Description |
|-------------|-------------|
| **Competitive matrix** | §13 — 6–8 products; what to adopt vs avoid per persona |
| **Heuristic audit** | Nielsen + photography-app expectations (upload, compare, progress) |
| **Persona IA proposal** | §16 — nav grouping, onboarding, tab count reduction; wireframe-level |
| **Visual direction** | 1–2 mood boards: typography, color, photography treatment — not only Tailwind tweaks |
| **Responsive audit** | §14 — breakpoints, Field on phone, touch targets, overflow tab bar |
| **a11y checklist** | §15 — WCAG + low-vision photographer patterns |
| **Copy pass** | Replace dev-speak; consumer headlines per tab |
| **Component priorities** | Top 5 components to redesign (hero, nav, chat bubble, HITL card, portfolio tile) |
| **Judge vs user dual path** | §18 — 90s judge route without harming real-user onboarding |

---

## 13. Market comparison — design inspiration (not feature copy)

Reviewers should **compare UX patterns**, not assume we build full competitors. For each reference, note **what to borrow** (layout, metaphor, tone) vs **what we already have differently** (multi-agent memory, HITL).

| Product / category | Why it matters | Inspiration to consider | Avoid copying |
|-------------------|----------------|-------------------------|---------------|
| **Adobe Lightroom Mobile** | Gold standard for culling, ratings, portfolio grid | Filmstrip + large preview; score/rating visual language; “develop” mental model for Studio | Full non-destructive editor scope |
| **VSCO** | Aesthetic identity, minimal chrome | Calm UI; photography-first typography; subtle brand | Social feed complexity |
| **Google Photos** | Memory, search, “things you shot” | Timeline/grid; “dominant themes”; search-as-memory for Mentor | Generic consumer cloud branding |
| **Aftershoot / AI culling tools** | AI-assisted workflow | Clear before/after critique; batch triage → **our Organize HITL is stricter** | Autonomous delete without approval |
| **Pixieset / ShootProof / SmugMug** | Working pro delivery & sales | Client-ready presentation; listing cards; pricing edit per item | Full client portal scope |
| **Etsy Seller Hub** (pattern only) | Listing draft → review → publish | Per-listing approval cards — aligns with Print tab | Live Etsy integration (we don’t have it) |
| **PhotoPills / Halide** | Field / capture intent | “Assignment active” banner; capture-first mobile layout | Astronomy calculator scope |
| **Voice dream / Seeing AI** (reference) | Non-visual photo description | Spoken summaries, sequential scene narrative | Medical device claims |
| **Generic AI chat SaaS** (ChatGPT, etc.) | What judges have seen too much | — | Purple gradients, “powered by AI” hero, feature grid landing |

**Deliverable ask:** A short **“steal list”** (5 patterns) and **“reject list”** (5 anti-patterns) tied to Practice Companion tabs.

---

## 14. Responsive design, PWA, and phone (including Field)

**Current state:** Single React SPA; **Field** uses `getUserMedia` / gallery on mobile browsers. **No** installed PWA manifest called out in this brief; **no** native iOS app in repo. Deploy is responsive-capable via Tailwind but **not systematically audited**.

Reviewers must treat **phone width as a primary canvas**, not desktop-only with shrink:

| Principle | Application to this app |
|-----------|---------------------------|
| **Touch targets** | Approve/Reject, persona toggle, tab nav ≥ 44×44pt; spacing on Organize/Print cards |
| **Tab overflow** | 7–8 top tabs **will not fit** on mobile — propose bottom nav (max 5), “More” menu, or persona-scoped subset (§16) |
| **Field / capture** | Full-bleed camera preview; minimal chrome; assignment context sticky; works in portrait |
| **Chat (Mentor)** | Input fixed to bottom; readable line length; suggested chips wrap |
| **Portfolio (Memory)** | 2-column grid on phone, 3+ on tablet/desktop; images `object-cover` with consistent aspect |
| **Typography** | Scale down hero marketing; keep critique body readable (16px+ effective) |
| **Safe areas** | `env(safe-area-inset-*)` for notched iPhones when Field is used |
| **Performance** | Large uploads in Studio — progress and error states visible on slow mobile networks |

**PWA / installable (future-friendly):** If recommending PWA, scope as **add-to-home-screen** for Field + Mentor without promising offline agent calls. Native iOS (SwiftUI) remains the spec path for ARKit/voice/haptics — web Field is **bridge**, not replacement.

**Reviewer deliverable:** Breakpoint checklist (e.g. 390×844, 768, 1280) with pass/fail per tab; one recommended mobile nav pattern.

---

## 15. Accessibility — especially low-vision photographers

Two layers: **(A) baseline WCAG** for all personas; **(B) vision_impairment persona** when shipped (voice/haptic/native). Design review should cover **A now** and **B as a specified future shell**.

### A. Baseline (ship on web regardless of third toggle)

- Color contrast (text, buttons, chips) on slate/green theme  
- Visible focus indicators for keyboard and VoiceOver  
- Semantic structure: `nav`, `main`, headings per tab, `aria-live` for chat replies and HITL success messages  
- Form labels on price inputs (Print), upload controls (Studio)  
- `prefers-reduced-motion` for animations (`animate-fadeIn`)  
- Do not rely on color alone for scores — use labels/numbers (Glass Box already numeric)  
- Error messages programmatically associated with controls  

### B. Low-vision / blind photographer (product intent — partial backend today)

Align with spec: **voice-first HITL**, scene **narration**, not visual-only affordances.

| Need | Design direction (future + partial web now) |
|------|---------------------------------------------|
| Screen reader | Mentor replies as structured headings/lists; portfolio entries with descriptive `alt` from `scene_description` |
| Low vision | Optional high-contrast theme; larger type scale; reduce reliance on thumbnail-only cues |
| Voice | Mentor readable by TTS; Field commands (“capture”, “describe scene”) — native iOS primary |
| Haptic | Confirmation on approve/capture — native iOS; web: clear spoken/text confirmation fallback |
| Cognitive load | One primary action per screen; avoid 7 equal-weight tabs (§16) |

**Do not claim** WCAG AAA certification or disability compliance in marketing unless tested.

**Reviewer deliverable:** Prioritized a11y backlog (P0/P1/P2) + mock copy for `alt` text strategy on portfolio tiles.

---

## 16. Beyond re-skin — persona-coherent IA (tab sprawl problem)

### Problem today

- **One shell** for everyone: horizontal tabs (~7–8 items with Working pro: Studio, Practice, Memory, Mentor, Organize, Print, Field).  
- **Persona toggle** is a small control; it **adds/removes Print** but does not reshape the whole experience.  
- Users think in **journeys** (“critique this shot”, “work on my assignment”, “sell a print”), not in agent names or internal tab history.

### Design intent (what “good” looks like)

| Persona | Home emphasis | Secondary | Rare / settings |
|---------|---------------|-----------|-----------------|
| **Hobbyist** | Studio + Practice | Memory, Mentor | Organize, Field |
| **Working pro** | Studio + Print | Memory, Mentor, Practice | Organize, Field |
| **Vision impairment (future)** | Field + Mentor (voice) | Memory (auditory list) | Studio (assisted upload) |

Flows should feel **natural**: assignment → capture → critique → reflection → memory, without hunting tabs.

### Login vs onboarding vs “role-based shell”

| Approach | Hackathon fit | Recommendation |
|----------|---------------|----------------|
| **Keep demo user** (`DEMO_USER_ID`) | Required for judges today | Keep for deploy; hide from consumer copy |
| **Onboarding: pick your path** (3 cards: Hobbyist / Pro / Accessible) | High value, no OAuth required | **Recommend** — writes `users.persona` via existing `PATCH /api/v1/users/me`, sets nav profile |
| **Full auth (Firebase Auth, etc.)** | Post-hackathon | Design for it (persona on `users` doc) but not blocking UI pass |
| **Role-based render** | Same SPA, different `navConfig[persona]` | **Recommend** — one codebase, conditional nav + home dashboard per persona |

**Not required:** Three separate websites. **Required:** Persona choice **early** (onboarding or settings) → **different default tab**, **grouped nav**, **persona-specific home panel** (“Continue your assignment”, “3 listings awaiting approval”).

### Nav patterns to evaluate (reviewer should pick one)

1. **Grouped top nav:** Create · Progress · Library · Business (items inside change by persona)  
2. **Bottom bar (mobile) + “More”** — max 4 icons + overflow  
3. **Home hub** — dashboard cards deep-link to Studio/Print/Mentor; reduce always-visible tabs to 4  
4. **Contextual nav** — during active assignment, shell shifts to Field-forward until complete  

### What to preserve

- Deep links / tab IDs for demo script (judge path in §9)  
- HITL screens (Organize, Print) remain discoverable for working pro / hobbyist stories  

---

## 17. Photography users first — not a demo website

**End goal:** Real photographers (and judges convinced we thought about reals) see a **credible product**, not an engineering poster.

| Demo-site signal (reduce) | Photographer-product signal (increase) |
|---------------------------|----------------------------------------|
| “Gemini 3.1 Pro” badge as hero | Your work, your progress — AI unnamed or secondary |
| `make api-dev` in UI | Help link / status only in dev builds |
| “Orchestrator”, “persona”, collection names | Critique, assignments, library, listings |
| Generic dark SaaS gradient | Photos visible early; UI supports images (grid, lightbox) |
| Feature list for judges | Outcome copy: “Improve backlighting”, “Approve this listing” |
| Empty engineering footer | Trust: privacy note, what AI remembers, HITL in plain language |

**Content hierarchy:** Photography is the **hero asset** (user’s images), not stock icons. Glass Box and scores should read like **coach feedback**, not JSON-with-skin.

**Judge journey (§9) vs real user:** Design a **first-time onboarding** that does not require reading tabs left-to-right; optionally keep a “Demo walkthrough” hidden behind keyboard shortcut or `/demo` for judges only.

---

## 18. Additional topics reviewers should cover

| Topic | Notes |
|-------|--------|
| **Loading & latency** | Mentor/Print agent paths 30–90s — skeleton, staged messages, cancel? |
| **Empty states** | No portfolio → guided Studio upload; no pending listings → single CTA |
| **Error recovery** | API down, 502 — consumer-friendly, not stack traces |
| **Trust & memory** | Short “What we store” for MongoDB memory story without jargon |
| **Internationalization** | English first; avoid idioms; room for longer strings in buttons |
| **Light vs dark** | Photo apps often use dark UI; ensure images don’t look washed out; consider true black borders for OLED |
| **Comparison / before-after** | Studio results: optional slider or side-by-side for same shoot (future) |
| **Export / share** | Not shipped — label “future” if suggested |
| **Settings** | Persona change, accessibility prefs, demo reset — consolidate engineering controls |
| **SEO / landing** | Public URL may need one consumer landing section before app shell (optional) |
| **Ethics** | AI critique not “truth”; HITL for destructive/financial actions — copy tone |

---

## 11. Files reviewers should open

| File | Why |
|------|-----|
| `frontend/src/App.tsx` | Shell, nav, tabs |
| `frontend/src/components/MentorTab.tsx` | Chat UX |
| `frontend/src/components/PrintSalesTab.tsx` | HITL commercial |
| `frontend/src/components/TriageTab.tsx` | Organize / HITL |
| `frontend/src/components/MemoryTab.tsx` | Portfolio memory |
| `frontend/src/components/ModeToggle.tsx` | Persona (2-way today) |
| `frontend/src/index.css` | Design tokens |
| `docs/spec.md` | Full requirements (read §5 HITL, §10 demo) |
| `docs/mongodb-story-document.md` | Partner narrative |

---

## 19. Review session prompts (paste into AI design skill)

### Pass 1 — Audit

```text
Read docs/design-review-brief.md in full. Audit the Practice Companion web app (Firebase deploy or local).
Ground every recommendation in §4 (shipped) and §5 (vision persona truth table).
Include: competitive steal/reject list (§13), responsive/mobile (§14), a11y (§15), persona IA (§16).
Output: executive summary, top 10 issues by user impact, anti-patterns to remove, phased plan
(quick <2h, medium <1 day, large). No re-skin-only proposals. No net-new features unless labeled "future".
Prefer I-voice for sample UI copy.
```

### Pass 2 — Persona shells

```text
Using design-review-brief.md §16–§17, propose ONE nav architecture for mobile + desktop:
onboarding flow, nav items per persona (hobbyist, working_pro, vision_impairment future),
and home dashboard wireframe (text). Address 7–8 tab sprawl. Note what requires login vs onboarding-only.
```

---

*Last updated: expanded with market comparison, responsive/PWA, a11y, persona IA, photography-native goals, and supplementary topics. Update §4–§5 when vision persona or iOS ships.*
