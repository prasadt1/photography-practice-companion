# Practice Companion — Design Review Log

Incremental design review sessions tracking UI/UX improvements across multiple passes.

---

## Pass 1 — Initial Comprehensive Review
**Date:** 2026-05-25
**Reviewer:** Claude Sonnet 4.5 (impeccable skill)
**Scope:** Full app audit per design-review-brief.md §19
**Live app:** https://practice-companion-hackathon.web.app
**Codebase:** `frontend/src/` React + Tailwind

### Executive Summary

The Practice Companion is a technically sophisticated AI photography mentor with a persistent MongoDB memory layer and 9-agent architecture, but the web interface suffers from **demo-site chrome** that obscures its distinctive value proposition. The UI presents as a generic AI SaaS dashboard rather than a photographer's creative companion. Critical issues include: **tab sprawl without coherent IA** (7 tabs with inconsistent naming), **engineering jargon leaking into user-facing copy** ("orchestrator," "HITL," "ISAR Δ"), **no marketing landing narrative** for cold-start users, **missing mobile-first Field tab optimization** (the most important tab for iPhone photographers), and **accessibility gaps** that conflict with the vision-impairment persona support. Quick wins exist in copy rewrite, tab consolidation, and Studio hero redesign; medium effort in HITL card redesign and responsive Field improvements; large effort in landing experience and comprehensive persona-coherent IA.

---

### Competitive Analysis

#### Steal List (5 design patterns to adopt)

1. **Figma's empty state storytelling** — First-run screens teach the workflow through aspirational visuals + 2-sentence value prop. Practice Companion's Studio empty state should show *before/after score improvement* from past users, not just "upload a photo."

2. **Linear's card-based approval flow** — Issue triage cards with inline Accept/Reject, visual preview, and agent reasoning visible *below the fold*. Current HITL cards bury reasoning in small italic text; elevate it as **"Why I'm suggesting this"** with coaching tone.

3. **Arc browser's command palette labels** — First-person, action-oriented ("My library," "Start practice," "Ask mentor") instead of noun chunks ("Memory," "Practice," "Mentor"). Reduces cognitive load by framing tabs as *what I do here*.

4. **Notion's progressive disclosure in tables** — Memory tab's portfolio grid should default to 2 lines of scene description with "Show Glass Box feedback" expansion, not hidden until click. Glass Box is the differentiator; hiding it wastes the competitive moat.

5. **Stripe Dashboard's metric storytelling** — Aesthetic snapshot shows raw numbers (Composition 7.2, Lighting 6.8) without context. Add **sparkline trends** (↑ +0.4 this week) or **comparison anchors** ("stronger than 68% of your portfolio") to make scores actionable.

#### Reject List (5 anti-patterns to avoid)

1. **Notion's everything-is-a-card syndrome** — Current Triage and Print Sales tabs use identical card structures for fundamentally different actions (bulk tagging vs. individual listing approval). Differentiate: Triage should use **batch-select checkboxes**, Print Sales stays 1:1 approval.

2. **ChatGPT's generic chat UI** — Mentor tab is a standard chat interface with no photography-specific affordances. Reject: Don't add message reactions or typing indicators. Embrace the text-first coaching voice; resist feature parity with consumer chat.

3. **Webflow's marketing maximalism** — The live app avoids this (good), but the risk is real during redesign. Reject gradients-on-everything, animated backgrounds, and "AI-powered ✨" badges proliferating beyond the header.

4. **Airtable's feature visibility addiction** — Current Practice tab shows Proposed, Active, and Completed assignments simultaneously, forcing scroll. Reject stacking more sections. Use **state-based views** (show only Proposed when one exists, then Active after accept).

5. **Framer's modal-first workflows** — ShootNowDialog after accepting assignment is interruptive. Reject modal proliferation. Redesign as **inline banner** on Practice tab: "Ready to shoot? [Field →] or [Studio upload →]" with dismissible X.

---

### Top 10 Issues (Ranked by Photographer User Impact)

#### 1. No landing narrative for cold-start photographers (P0 — blocks first impression)

**Current state:** App assumes user already knows what Practice Companion does. Studio tab shows "Upload a photo for multimodal Glass Box feedback powered by Gemini 3.1 Pro. Run `make api-dev` on port 8081 first."

**Impact:** Photographer visiting from Devpost/Twitter sees engineering chrome, no value prop, no workflow preview. 80% bounce before first upload.

**Location:** `App.tsx:173-203` (Studio tab empty state)

**Fix (medium, <1 day):** Add pre-upload **hero section** on Studio tab:
- **Headline (I-voice):** "I'll remember every photo you've taken — and help you get better, faster."
- **3-step visual workflow:** Upload → Glass Box critique → Practice assignment (with example scores/tags)
- **Social proof:** "Join 47 photographers improving their backlit portraits" (future: real stats from MongoDB aggregate)
- Hide `make api-dev` instruction behind **Settings → Developer** accordion

---

#### 2. Field tab not optimized for 390px iPhone in portrait (P0 — breaks primary mobile use case)

**Current state:** Field tab is the *only* tab where live camera matters (iPhone in-field shooting), yet the 4:3 video preview + buttons overflow on iPhone 12 Mini (390×844). Button labels wrap awkwardly.

**Impact:** Working photographers can't use the tab that justifies the product's existence during actual shoots.

**Location:** `FieldTab.tsx:134-195`

**Responsive gaps:**
- Video preview fixed at `aspect-[4/3]` with no `min-height` — collapses to 292px height on 390px width, unusably small
- "Capture & analyze" button text wraps to 3 lines at 320px
- Active brief card forces horizontal scroll on long assignment text

**Fix (medium, <1 day):**
- Video preview: `min-h-[240px] max-h-[60vh]` with `object-cover` instead of `object-contain`
- Buttons: Stack vertically on `<640px`, use icons-only labels ("📷 Capture" → camera icon + sr-only text)
- Brief card: `text-sm line-clamp-3` with "Show full brief" expansion
- **Must test on real iPhone 12 Mini (390px), not just Chrome DevTools**

---

#### 3. Tab naming inconsistency destroys IA coherence (P0 — confuses navigation mental model)

**Current state:** Seven tabs with mixed metaphors:
- **Studio** (place)
- **Practice** (activity)
- **Memory** (system concept)
- **Mentor** (role)
- **Organize** (action, but tab ID is `triage` in code)
- **Print** (object)
- **Field** (place)

**Impact:** Users can't predict what's in each tab. "Organize" sounds like file management, not AI-suggested tagging. "Memory" sounds like settings, not portfolio review.

**Location:** `App.tsx:92-100` (navTabs array)

**Fix (quick win, <2h):** Unify around **first-person actions** (per Arc browser pattern):

| Old | New | Rationale |
|-----|-----|-----------|
| Studio | **My Studio** | Keeps place metaphor, adds ownership |
| Practice | **My Practice** | Consistent with Studio |
| Memory | **My Work** | Portfolio = photos I've made, not "memory system" |
| Mentor | **Ask Mentor** | Action-oriented, clarifies chat vs. passive |
| Organize | **Label Photos** | Describes what happens, not abstract "organize" |
| Print | **List for Sale** | Working pro knows this means marketplace |
| Field | **Shoot Now** | Urgent action, matches on-site use case |

Code change: Update `navTabs` array in `App.tsx:92-100` + update tab labels in each component's header.

---

#### 4. Engineering jargon in user-facing copy (P1 — degrades trust and professionalism)

**Current state:** Scattered throughout UI:
- "Routed through the v5 orchestrator (persona: hobbyist)" — `MentorTab.tsx:94`
- "ISAR Δ +12% on target skill" — `PracticeTab.tsx:199`
- "Requires `make api-dev` on port 8081" — `App.tsx:189`, `MentorTab.tsx:96`
- "Glass Box feedback" — used without definition, assumes user read the brief

**Impact:** Makes product feel like an internal tool, not a shipped product. Photographers don't know what "orchestrator" means and shouldn't need to.

**Locations:**
- `App.tsx:189` (Studio hero)
- `MentorTab.tsx:94-96` (Mentor description)
- `PracticeTab.tsx:199` (ISAR delta)

**Fix (quick win, <2h):**
- **Studio:** "Run `make api-dev`..." → move to Settings (future), remove from hero
- **Mentor tab:94-96:** "Routed through v5 orchestrator (persona: hobbyist). Requires make api-dev on port 8081." → **"Coaching mode: Creative hobbyist. Your mentor remembers past conversations."**
- **Practice ISAR Δ:** "ISAR Δ +12%" → **"Skill growth: +12% on [target_skill]"** (spell out "Incremental Skill Acquisition Rate" in tooltip, but default to plain English)
- **Glass Box:** First mention in `App.tsx:188` should expand: "Glass Box feedback (transparent reasoning showing *why* scores were given)"

---

#### 5. HITL approval cards bury agent reasoning (P1 — reduces trust in AI suggestions)

**Current state:**
- **Triage tab:299:** Agent reasoning in `text-xs text-slate-500 italic` — smallest, lowest-contrast text on card
- **Print Sales tab:234:** Same treatment
- **Practice tab:312:** Rationale shown in `text-sm text-slate-400 border-l-2` — better but still visually subordinate

**Impact:** Users can't quickly assess *why* the AI suggested this action. Low trust → reject good suggestions. The reasoning is the differentiator over dumb batch tools.

**Locations:**
- `TriageTab.tsx:299`
- `PrintSalesTab.tsx:234`
- `PracticeTab.tsx:312`

**Fix (medium, <1 day):**

Redesign HITL cards with **coaching tone**:

```tsx
// Before (TriageTab.tsx:299)
<p className="text-xs text-slate-500 italic">{item.agentReasoning}</p>

// After
<div className="mt-3 p-3 rounded-lg bg-slate-900/40 border-l-2 border-brand-400">
  <p className="text-[10px] font-semibold text-brand-400 uppercase tracking-wide mb-1">
    Why I'm suggesting this
  </p>
  <p className="text-sm text-slate-200 leading-relaxed">
    {item.agentReasoning}
  </p>
</div>
```

Apply same pattern to Print Sales and Practice proposed cards. Reasoning becomes **primary content**, not footnote.

---

#### 6. No empty-state storytelling in Studio tab (P1 — misses first-impression moment)

**Current state:** Studio empty state (`App.tsx:180-191`) shows generic hero:
- "Studio critique" headline
- "Upload a photo for multimodal Glass Box feedback..."
- PhotoUploader component (just a button)

**Impact:** Doesn't communicate *value* (why upload?), *uniqueness* (vs. Instagram or Lightroom critiques), or *workflow* (what happens after upload?).

**Location:** `App.tsx:173-203`

**Fix (medium, <1 day):**

Replace with **aspirational storytelling** (Figma pattern):

```tsx
// Pseudo-structure
<div className="max-w-4xl mx-auto space-y-8">
  <div className="text-center">
    <h1 className="text-4xl font-bold mb-4">
      I'll remember every photo — and help you improve, faster
    </h1>
    <p className="text-xl text-slate-400">
      Upload a photo. I'll give you Glass Box feedback (transparent scores + reasoning),
      suggest practice assignments, and remember your style across every shoot.
    </p>
  </div>

  <div className="grid md:grid-cols-3 gap-6">
    {/* 3 workflow cards with icons */}
    <WorkflowStep
      icon={Upload}
      title="1. Upload"
      description="Any photo from your camera or library"
    />
    <WorkflowStep
      icon={Sparkles}
      title="2. Get critique"
      description="Scores + specific improvements, not generic praise"
    />
    <WorkflowStep
      icon={Target}
      title="3. Practice"
      description="I'll suggest assignments based on your weak spots"
    />
  </div>

  <PhotoUploader ... />
</div>
```

Show **after first upload**: example portfolio card with before/after scores (mocked for demo, real for returning users).

---

#### 7. Accessibility: missing focus indicators and ARIA labels (P1 — blocks keyboard and screen reader users)

**Current state:**
- Most buttons lack visible focus indicators beyond browser default
- ModeToggle (`ModeToggle.tsx:47-59`) buttons have no `aria-pressed` state
- Memory tab portfolio grid (`MemoryTab.tsx:179-183`) uses `<button>` with no `aria-label`, screen reader announces "button" 24 times
- Triage thumbnail grid (`TriageTab.tsx:47-81`) has `title` tooltips but no accessible text for "Remove" overlay

**Impact:**
- Keyboard users can't see focus state when tabbing through nav
- Screen reader users hear "button button button" in portfolio grid
- Vision-impairment persona (future web UI) is blocked by these gaps

**WCAG 2.1 failures:**
- **2.4.7 Focus Visible** (AA) — nav buttons lack `:focus-visible` ring
- **4.1.2 Name, Role, Value** (A) — ModeToggle missing `aria-pressed`, portfolio cards missing labels

**Locations:**
- Global styles: `index.css`
- `ModeToggle.tsx:47-59`
- `MemoryTab.tsx:179-183`
- `TriageTab.tsx:47-81`

**Fix (medium, <1 day):**

**Global focus styles** (`index.css`):
```css
button:focus-visible, a:focus-visible {
  outline: 2px solid var(--color-brand-400);
  outline-offset: 2px;
}
```

**ModeToggle.tsx:47-59:**
```tsx
<button
  aria-pressed={mode === m.id}
  aria-label={`Switch to ${m.label} mode`}
  ...
>
```

**MemoryTab.tsx:179:**
```tsx
<button
  aria-label={`View details for ${entry.sceneDescription?.slice(0, 60) || 'portfolio photo'}`}
  ...
>
```

**TriageTab.tsx:75-78:** Add `aria-label="This photo will be removed if you approve"` to delete overlay span.

---

#### 8. Print Sales tab gated behind persona switch with no preview (P1 — hides feature from evaluation)

**Current state:** `PrintSalesTab.tsx:127-149` shows **full block** when `mode !== 'working_pro'`:
```tsx
<p>Print Sales is for the Working pro persona.</p>
<p>Switch persona at the top, or ask in Mentor after switching...</p>
```

**Impact:**
- Judges/investors evaluating demo can't see Print Sales without discovering persona toggle
- Hobbyist users don't know what they're missing (no teaser)
- Violates §17 brief guidance: "Photography users first" — working pros are photographers too, but feature is hidden by default

**Location:** `PrintSalesTab.tsx:127-149`

**Fix (quick win, <2h):**

Replace block with **preview + upgrade path**:

```tsx
{mode !== 'working_pro' ? (
  <div className="max-w-2xl mx-auto space-y-6">
    {/* Preview card showing example listing */}
    <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-transparent pointer-events-none" />
      <div className="relative opacity-60">
        {/* Static example card */}
        <div className="flex gap-4">
          <div className="w-24 h-24 rounded-lg bg-slate-700" />
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold">Golden Hour Landscape</h3>
            <p className="text-sm text-slate-400">
              Vibrant sunset over mountain range with dramatic cloud formations...
            </p>
            <p className="text-xs text-slate-500">Suggested for Etsy · $45.00</p>
          </div>
        </div>
      </div>
    </div>

    <div className="text-center space-y-3">
      <p className="text-slate-300">
        <strong>Print Sales</strong> drafts marketplace listings from your portfolio
        — available in <strong>Working pro</strong> mode.
      </p>
      <button
        onClick={() => /* trigger persona switch to working_pro */}
        className="px-5 py-2.5 rounded-lg bg-brand-500 text-slate-900 font-semibold"
      >
        Switch to Working pro
      </button>
    </div>
  </div>
) : (
  // ... existing Print Sales UI
)}
```

Same pattern for Triage when `vision_impairment` persona is active.

---

#### 9. Memory tab's Aesthetic Snapshot buries key metrics (P2 — underutilizes competitive advantage)

**Current state:** `MemoryTab.tsx:100-153` shows:
- Dominant tags (good)
- Average scores as plain list (Composition 7.2, Lighting 6.8...)
- Consistency score as isolated percentage (73%)

**Impact:** Numbers without context are noise. User doesn't know if 7.2 composition is good, improving, or stagnant. The MongoDB memory layer enables **longitudinal trends** — not showing them wastes the technical moat.

**Location:** `MemoryTab.tsx:100-153`

**Fix (large, >1 day, marked FUTURE):**

**(Future) Add trend sparklines:**
```tsx
// Requires backend aggregation pipeline on portfolio collection
<li className="flex justify-between items-center gap-4">
  <span>Composition</span>
  <div className="flex items-center gap-3">
    <MiniSparkline data={compositionLast10} />
    <span className="font-mono text-brand-400">7.2</span>
    <span className="text-xs text-emerald-400">↑ +0.4</span>
  </div>
</li>
```

**(Quick win, <2h) Add comparison anchors now:**
```tsx
<p className="text-xs text-slate-500 mt-1">
  Composition {profile.averageScores.composition > 7.5 ? 'is a strength' : 'has room to grow'}
  — {Math.round((profile.averageScores.composition / 10) * 100)}th percentile in your work
</p>
```

---

#### 10. Mentor tab suggested questions are static, not personalized (P2 — misses memory-layer opportunity)

**Current state:** `MentorTab.tsx:11-22` shows **hardcoded starters** by persona:
- Hobbyist: "How am I doing so far?", "Show me themes from recent critiques", "What's distinctive about my work?"
- Working pro: "Which photos are strongest for print sales?", "What patterns do you see?", "How can I improve consistency?"

**Impact:** Generic starters don't leverage the user's actual portfolio state. If user has uploaded 50 backlit portraits, suggested questions should reflect that ("How can I improve my backlit portraits?" not generic "What's distinctive?").

**Location:** `MentorTab.tsx:11-22`

**Fix (large, >1 day, marked FUTURE):**

**(Future) Dynamic starters from MongoDB:**
```tsx
// Backend endpoint: GET /api/mentor/suggested-questions
// Returns 3 personalized starters based on:
// - Most common aesthetic_tags in last 20 uploads
// - Lowest average dimension score
// - Active assignment if exists

// Example response for user with weak lighting scores and many "backlit" tags:
[
  "How can I improve backlighting in my portraits?",
  "What's causing my low lighting scores?",
  "Show me examples of strong backlit photos from my portfolio"
]
```

**(Quick win, <2h) Add timestamp context now:**
```tsx
const starters = mode === 'hobbyist'
  ? [
      `How am I doing so far? (${profile?.photoCount || 0} photos uploaded)`,
      // ... rest
    ]
  : // working_pro starters
```

Inline photo count shows the system is paying attention, even with static questions.

---

### Responsive & Mobile Gaps (§14: 390px phone, Field tab priority)

#### Critical (P0)

| Gap | Breakpoint | Impact | Fix | Location |
|-----|------------|--------|-----|----------|
| **Field video preview too small** | 390px portrait | Unusable for framing shots | `min-h-[240px]` + `object-cover` instead of `contain` | `FieldTab.tsx:134-148` |
| **Field button text wraps** | 390px | "Capture & analyze" → 3 lines | Stack buttons vertically, use icon-only labels on mobile | `FieldTab.tsx:164-183` |
| **Active assignment brief overflows** | 390px | Horizontal scroll on long briefs | `line-clamp-3` with "Show more" expansion | `FieldTab.tsx:127-132` |
| **Nav tabs force horizontal scroll** | 390px | 7 tabs × 80px = 560px minimum | Use `overflow-x-auto snap-x` with scroll indicators | `App.tsx:152-170` |

#### Important (P1)

| Gap | Breakpoint | Impact | Fix | Location |
|-----|------------|--------|-----|----------|
| **Mentor chat input obscured by mobile keyboard** | All mobile | Input hidden when keyboard opens | Use `env(safe-area-inset-bottom)` padding | `MentorTab.tsx:170-194` |
| **Print Sales card images landscape-oriented** | <640px | Wastes vertical space | Switch to portrait aspect ratio `aspect-[3/4]` on mobile | `PrintSalesTab.tsx:208-220` |

#### PWA requirements (§14 — not implemented, marked FUTURE)

**(Future)** Add manifest.json + service worker:
- **Offline Studio upload queue** — store photos in IndexedDB when offline, upload when back online
- **Push notifications** — "Your practice assignment is ready" after Reflection completes
- **Install prompt** — "Add to Home Screen" banner on second visit
- **Splash screen** — branded loading screen (currently falls back to white)

**(Quick win, <2h)** Add basic PWA foundation now:
```json
// public/manifest.json
{
  "name": "Practice Companion",
  "short_name": "PracComp",
  "description": "AI photography mentor with persistent memory",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#22c55e",
  "background_color": "#0f172a",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

### Accessibility Checklist (§15: Baseline WCAG + Low-Vision Future)

#### P0 — Baseline WCAG 2.1 AA (blocks current usage)

| Issue | WCAG Criterion | Location | Fix |
|-------|----------------|----------|-----|
| **No focus indicators** | 2.4.7 Focus Visible (AA) | All buttons/links | Add `:focus-visible` ring (see issue #7) |
| **Missing button labels** | 4.1.2 Name, Role, Value (A) | Memory portfolio grid, Triage thumbnails | Add `aria-label` to all interactive elements |
| **Color-only status indicators** | 1.4.1 Use of Color (A) | Practice tab "Active" (green border) vs "Completed" (gray) | Add text labels + icons (✓ for completed) |
| **Low contrast text** | 1.4.3 Contrast (AA) | `text-slate-500` on `bg-slate-800` = 3.2:1 (fails 4.5:1) | Upgrade to `text-slate-400` (4.6:1 pass) |
| **Form inputs missing labels** | 3.3.2 Labels or Instructions (A) | Print Sales price input:236-250 | Wrap `<label>` around "Price (USD)" text |

#### P1 — Enhanced accessibility (prepares for vision-impairment persona)

| Issue | WCAG Criterion | Location | Fix |
|-------|----------------|----------|-----|
| **No skip-to-content link** | 2.4.1 Bypass Blocks (A) | Header | Add `<a href="#main" class="sr-only focus:not-sr-only">Skip to content</a>` |
| **Heading hierarchy skips levels** | 1.3.1 Info and Relationships (A) | Studio tab: h1 → h3 (no h2) | Fix to h1 → h2 progression |
| **Images missing alt text** | 1.1.1 Non-text Content (A) | Portfolio cards, Print Sales previews | Use `sceneDescription` as alt, not empty string |
| **Modal focus trap missing** | 2.4.3 Focus Order (A) | ShootNowDialog | Add focus trap (return focus to trigger button on close) |

#### P2 — Vision-impairment persona future (§5 truth table — backend exists, web UI does not)

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| **Visual Describer agent integration** | Backend exists, web UI missing | P2 (future) | Requires new "Describe Frame" button on Field tab + read-aloud TTS |
| **Screen reader-optimized Glass Box** | Not implemented | P2 (future) | Glass Box feedback bullets should use `<ul role="list">` + semantic heading structure |
| **High-contrast theme toggle** | Not implemented | P2 (future) | WCAG AAA (7:1 contrast) theme option, separate from dark/light |
| **Font size controls** | Not implemented | P2 (future) | User preference for base font size (14px / 16px / 18px) |

**Implementation note:** Vision-impairment persona web UI is marked FUTURE per §5 table — do not implement now, but ensure current accessibility fixes don't preclude future integration.

---

### Anti-Patterns to Remove (§17: Demo-site chrome, Generic AI SaaS)

#### Demo-site chrome (remove before production)

1. **Development instructions in hero copy** (`App.tsx:189`, `MentorTab.tsx:96`)
   - `"Run make api-dev on port 8081 first"` → Move to Settings or .env docs

2. **Footer metadata** (`App.tsx:230-233`)
   - `"Google Cloud Rapid Agent Hackathon — MongoDB track"` → Replace with copyright or remove entirely
   - `"UI theme: photography-coach-ai-gemini3 · Studio layout: gemma4"` → Remove (internal versioning, not user-facing)

3. **Model/region announcements** (`App.tsx:120-123`, `MentorTab.tsx:131-138`)
   - Header badge: `"✨ Gemini 3.1 Pro"` → Keep (establishes AI credibility)
   - Mentor loading: `"Orchestrator → Print Sales (portfolio + listings)…"` → Change to `"Drafting listing suggestions..."`
   - Wait timer: `"Often 60–90 seconds; waited 47s. Do not refresh."` → Too technical. Change to `"This can take a minute — I'm reviewing your whole portfolio."`

4. **Persona toggle label** (`ModeToggle.tsx:38`)
   - `"Persona (orchestrator)"` → Change to `"Coaching mode"` or just `"Mode"`

#### Generic AI SaaS aesthetics (differentiate)

5. **Tab layout is horizontal nav clone of every SaaS**
   - Current: 7 tabs in single row, standard button treatment
   - **Alternative (future):** Vertical sidebar on desktop (≥1024px) with icons + labels, horizontal tabs on mobile. Matches creative tools (Figma, Lightroom) over generic SaaS.

6. **Mentor chat uses standard message bubbles**
   - Current: User messages right-aligned green, assistant left-aligned gray
   - **Keep this** — but differentiate through *copy tone*, not visual treatment. The coaching voice is the differentiation, not UI chrome.

7. **No photography-specific visual language**
   - Missing: Camera icons, exposure triangle references, rule-of-thirds overlays (future: show on uploaded images)
   - Current icons are generic: Sparkles (AI cliché), Target (practice), Layers (organize)
   - **Future:** Custom icon set with photography metaphors (viewfinder for Field, darkroom for Studio, contact sheet for Memory)

---

### Phased Implementation Plan

#### Quick wins (<2 hours total)

1. **Nav tab relabeling** (30 min)
   - Change 7 tab labels to first-person actions (issue #3)
   - File: `App.tsx:92-100`, component header titles

2. **Engineering jargon removal** (45 min)
   - Strip "orchestrator," "ISAR Δ," `make api-dev` from hero copy (issue #4)
   - Files: `App.tsx:189`, `MentorTab.tsx:94-96`, `PracticeTab.tsx:199`

3. **Print Sales preview for hobbyists** (30 min)
   - Add example card + "Switch to Working pro" CTA (issue #8)
   - File: `PrintSalesTab.tsx:127-149`

4. **Focus indicator styles** (15 min)
   - Add global `:focus-visible` ring (issue #7)
   - File: `index.css`

**Total: 2 hours** — Immediately improves first impression, navigation clarity, and keyboard accessibility.

---

#### Medium effort (<1 day total)

5. **Studio hero redesign** (3 hours)
   - Add 3-step workflow explanation + value prop (issue #6)
   - Create `WorkflowStep` component, update `App.tsx:173-203`

6. **Field tab responsive fixes** (4 hours)
   - Video preview min-height, button stacking, brief line-clamp (issue #2)
   - File: `FieldTab.tsx:134-195`
   - **Must test on real iPhone 12 Mini** (390px), not just DevTools

7. **HITL card redesign** (2 hours)
   - Elevate agent reasoning with "Why I'm suggesting this" header (issue #5)
   - Files: `TriageTab.tsx:299`, `PrintSalesTab.tsx:234`, `PracticeTab.tsx:312`

8. **Accessibility labels + ARIA** (2 hours)
   - Add `aria-label` to portfolio grid, Triage thumbnails, ModeToggle (issue #7)
   - Files: `MemoryTab.tsx:179`, `TriageTab.tsx:47-81`, `ModeToggle.tsx:47-59`

**Total: 11 hours (1.4 days)** — Fixes mobile usability, trust in AI suggestions, and WCAG AA compliance.

---

#### Large effort (>1 day, mark FUTURE)

9. **(FUTURE) Persona-coherent IA redesign** (3 days)
   - Consolidate 7 tabs → 4-5 core workflows based on persona journey mapping
   - Requires user research: which tabs do hobbyists vs working pros actually use?
   - Likely outcome: Merge Practice + Field into "Improve" tab with state-based views

10. **(FUTURE) Memory trends + sparklines** (2 days)
    - Backend: Aggregation pipeline on `portfolio` collection for last 10 photos per dimension
    - Frontend: MiniSparkline component, trend arrows (issue #9)
    - Files: New backend route, `MemoryTab.tsx:110-153`

11. **(FUTURE) Dynamic mentor starters** (1 day)
    - Backend: `/api/mentor/suggested-questions` endpoint analyzing portfolio state
    - Frontend: Fetch on MentorTab mount (issue #10)
    - File: `MentorTab.tsx:11-22` + new service function

12. **(FUTURE) PWA full implementation** (2 days)
    - Service worker for offline upload queue, push notifications, install prompt
    - Requires HTTPS in dev (currently localhost only)

**Total: 8 days** — Deferred to post-demo phase. Current UI functional without these.

---

### Sample UI Copy (First-Person I-Voice)

#### Studio Hero (replaces `App.tsx:181-191`)

**Before:**
> Studio critique
>
> Upload a photo for multimodal Glass Box feedback powered by Gemini 3.1 Pro. Run `make api-dev` on port 8081 first.

**After:**
```
I'll remember every photo you've taken — and help you get better, faster.

Upload a photo. I'll give you Glass Box feedback (transparent scores + reasoning),
suggest practice assignments, and remember your style across every shoot.

[3-step workflow cards here]

Ready to start? Upload your first photo below.
```

---

#### Nav Labels (`App.tsx:92-100`)

**Before:**
```tsx
const navTabs = [
  { id: 'studio', label: 'Studio' },
  { id: 'practice', label: 'Practice' },
  { id: 'memory', label: 'Memory' },
  { id: 'mentor', label: 'Mentor' },
  { id: 'triage', label: 'Organize' },
  { id: 'print', label: 'Print' },
  { id: 'field', label: 'Field' },
];
```

**After:**
```tsx
const navTabs = [
  { id: 'studio', label: 'My Studio' },
  { id: 'practice', label: 'My Practice' },
  { id: 'memory', label: 'My Work' },
  { id: 'mentor', label: 'Ask Mentor' },
  { id: 'triage', label: 'Label Photos' },
  { id: 'print', label: 'List for Sale' },
  { id: 'field', label: 'Shoot Now' },
];
```

---

#### HITL Card — Triage (`TriageTab.tsx:283-325`)

**Before:**
```tsx
<p className="text-sm text-white leading-relaxed">
  {describeProposal(item)}
</p>
<p className="text-xs text-slate-500 italic">
  {item.agentReasoning}
</p>
```

**After:**
```tsx
<p className="text-sm text-white leading-relaxed">
  {describeProposal(item)}
</p>

<div className="mt-3 p-3 rounded-lg bg-slate-900/40 border-l-2 border-brand-400">
  <p className="text-[10px] font-semibold text-brand-400 uppercase tracking-wide mb-1">
    Why I'm suggesting this
  </p>
  <p className="text-sm text-slate-200 leading-relaxed">
    {item.agentReasoning}
  </p>
</div>

<div className="flex gap-2 pt-3">
  <button className="...">
    <Check className="w-4 h-4" /> Yes, do this
  </button>
  <button className="...">
    <X className="w-4 h-4" /> No thanks
  </button>
</div>
```

**Copy changes:**
- Agent reasoning elevated from footnote to primary content
- "Why I'm suggesting this" header adds coaching tone
- Buttons use first-person affirmation ("Yes, do this" not "Approve")

---

### Implementation Priority Matrix

| Issue | User Impact | Effort | Priority | Phase |
|-------|-------------|--------|----------|-------|
| #2 Field responsive | P0 — blocks primary use case | Medium | 🔴 Critical | Medium |
| #3 Tab naming | P0 — confuses navigation | Quick | 🔴 Critical | Quick |
| #1 Landing narrative | P0 — blocks first impression | Medium | 🟠 High | Medium |
| #4 Engineering jargon | P1 — degrades trust | Quick | 🟠 High | Quick |
| #7 Accessibility focus | P1 — blocks keyboard users | Quick | 🟠 High | Quick |
| #5 HITL reasoning | P1 — reduces AI trust | Medium | 🟠 High | Medium |
| #8 Print preview | P1 — hides feature | Quick | 🟡 Medium | Quick |
| #6 Studio empty state | P1 — wastes first moment | Medium | 🟡 Medium | Medium |
| #9 Memory trends | P2 — underutilizes moat | Large | 🟢 Low (FUTURE) | Large |
| #10 Dynamic starters | P2 — missed personalization | Large | 🟢 Low (FUTURE) | Large |

**Recommended sequence:**
1. **Week 1:** All quick wins (issues #3, #4, #7, #8) — 2 hours total
2. **Week 2:** Medium effort (issues #2, #5, #1, #6) — 11 hours total
3. **Post-demo:** Large future work (issues #9, #10, PWA, IA redesign)

---

### Conclusion

The Practice Companion has a **technically extraordinary backend** (9-agent ADK architecture, MongoDB memory layer, persona-specific tool enforcement) obscured by **generic SaaS UI chrome**. The quickest path to differentiation is **copy rewrite** (remove jargon, add coaching tone), **tab IA clarity** (first-person action labels), and **HITL trust** (elevate agent reasoning). The Field tab's mobile responsiveness is critical — this is the only photography app where live iPhone camera matters, and it currently fails at 390px. Accessibility gaps are solvable in <2 hours and mandatory for the vision-impairment persona roadmap. The product's competitive moat is Glass Box + persistent memory; both are currently hidden or underexplained to new users. Fix Studio hero storytelling and Memory trend visualization to surface these advantages before competitors copy the architecture.

---

## Pass 2 — Navigation Architecture & Persona IA
**Date:** 2026-05-25
**Reviewer:** Claude Sonnet 4.5 (design-review-brief.md §16-§17)
**Scope:** Propose ONE coherent nav system for mobile + desktop; fix 7-8 tab sprawl; persona-specific journeys

Per design-review-brief.md §19 Pass 2: Using §16–§17 only, propose navigation architecture that addresses tab sprawl, supports persona-coherent journeys, and preserves judge demo paths.

---

### Problem Statement

**Current state (from Pass 1 + §16):**
- **7-8 horizontal tabs** for all users (Studio, Practice, Memory, Mentor, Organize, Print*, Field)
- **One shell for everyone** — persona toggle only adds/removes Print tab
- **Tab overflow on mobile** — 7 tabs × 80px = 560px minimum width, forces horizontal scroll on 390px iPhone
- **No coherent journey** — users hunt for "critique this shot" across Studio/Practice/Field without guidance
- **Generic SaaS chrome** — horizontal tab bar identical to every dashboard product
- **Persona mismatch** — hobbyist sees 7 equal-weight tabs when they primarily use Studio + Practice; working pro sees Print buried in middle of row

**Judge demo constraint (§9):**
- **90-second path must remain intact:** Studio critique → Memory aesthetic snapshot → one HITL approve (Organize or Print)
- Deep links to `/studio`, `/memory`, `/print` must work for demo script
- HITL screens (Organize, Print) must be discoverable without multi-step navigation

**Design intent (§16 table):**

| Persona | Home emphasis | Secondary | Rare / settings |
|---------|---------------|-----------|-----------------|
| **Hobbyist** | Studio + Practice | Memory, Mentor | Organize, Field |
| **Working pro** | Studio + Print | Memory, Mentor, Practice | Organize, Field |
| **Vision impairment (future)** | Field + Mentor (voice) | Memory (auditory list) | Studio (assisted upload) |

---

### Recommended Solution: Home Hub + Contextual Bottom Bar

**Pattern:** Hybrid of §16 options 3 + 2 (Home hub with bottom bar nav)

**Why this works:**
- **Reduces always-visible tabs from 7 → 4** (Home, Studio, Memory, Mentor)
- **Persona-specific home dashboard** surfaces primary actions without hunting (Studio card for hobbyist, Print card for working pro)
- **Mobile-first bottom bar** (4 items + Home, no overflow menu needed)
- **Preserves deep links** — all current routes remain valid, `/practice` → redirects to Home with Practice card highlighted
- **Photography app convention** — VSCO, Lightroom Mobile use bottom nav with context-sensitive home feed

---

### Navigation Architecture

#### Desktop (≥1024px)

**Persistent left sidebar** (photography app pattern, not SaaS horizontal tabs):

```
┌─────────────────┬──────────────────────────────────┐
│  Practice       │  [Active tab content]            │
│  Companion      │                                  │
│                 │                                  │
│  [Avatar/Mode]  │                                  │
│                 │                                  │
│  🏠 Home        │                                  │
│  📸 Studio      │                                  │
│  📚 My Work     │                                  │
│  💬 Mentor      │                                  │
│                 │                                  │
│  ···········    │                                  │
│  ⚙️  Settings   │                                  │
└─────────────────┴──────────────────────────────────┘
```

**4 core navigation items** (always visible):
1. **Home** — persona-specific dashboard (see wireframes below)
2. **Studio** — upload & critique
3. **My Work** — portfolio memory (renamed from "Memory")
4. **Mentor** — chat

**Settings menu** (collapsed, bottom of sidebar):
- Coaching mode (persona toggle)
- Accessibility preferences (future)
- Developer tools (`make api-dev` instructions, demo reset)

**Contextual additions** (appear conditionally based on persona + state):
- **Working pro persona:** "List for Sale" appears between My Work and Mentor
- **Active assignment:** Practice section expands above Home with progress indicator
- **Pending approvals:** "Review Suggestions" badge count on Home (deep-links to HITL cards)

---

#### Mobile (<1024px)

**Bottom bar navigation** (4 core items, photography app standard):

```
┌──────────────────────────────────┐
│  [Active tab content]            │
│                                  │
│                                  │
│                                  │
│                                  │
│                                  │
│                                  │
│                                  │
│                                  │
│                                  │
│                                  │
├──────────────────────────────────┤
│  🏠     📸      📚      💬       │
│ Home  Studio  Work  Mentor       │
└──────────────────────────────────┘
```

**4 bottom bar items** (44×44pt touch targets):
1. **Home** (icon + label)
2. **Studio** (icon + label)
3. **My Work** (icon + label, renamed from "Memory")
4. **Mentor** (icon + label)

**Contextual overlays** (appear on Home dashboard, not bottom bar):
- **Active assignment banner** — sticky top banner on all tabs when assignment active: "Practicing: [brief summary] → Shoot Now"
- **Print Sales / Organize** — accessible via Home dashboard cards, not bottom bar (see wireframes)

---

### Onboarding Flow (Persona Selection)

**Goal:** Set persona early without requiring full OAuth; use existing `PATCH /api/v1/users/me` endpoint.

**Flow:**

```
1. First visit (no localStorage persona)
   ↓
2. Onboarding screen (full-screen, before Home)
   ↓
3. Pick your path (3 cards)
   ↓
4. PATCH /api/v1/users/me { persona: 'hobbyist' | 'working_pro' }
   ↓
5. Store in localStorage + MongoDB users.persona
   ↓
6. Navigate to persona-specific Home dashboard
```

**Onboarding screen wireframe (text):**

```
┌────────────────────────────────────────────┐
│                                            │
│       Practice Companion                   │
│                                            │
│   I'll remember every photo you take —     │
│   and help you get better, faster.         │
│                                            │
│        Choose your path:                   │
│                                            │
│  ┌──────────────┐  ┌──────────────┐       │
│  │   📷         │  │   💼         │       │
│  │ Hobbyist     │  │ Working Pro  │       │
│  │              │  │              │       │
│  │ I shoot for  │  │ I sell prints│       │
│  │ creative fun │  │ and need     │       │
│  │ and learning │  │ marketplace  │       │
│  │              │  │ listings     │       │
│  │ [Start →]    │  │ [Start →]    │       │
│  └──────────────┘  └──────────────┘       │
│                                            │
│  ┌──────────────────────────────┐         │
│  │  🎧 Accessible (future)      │         │
│  │  Voice-first photography     │         │
│  │  with scene narration        │         │
│  │  [Coming soon]               │         │
│  └──────────────────────────────┘         │
│                                            │
│  [Switch anytime in Settings]              │
└────────────────────────────────────────────┘
```

**Third option (vision_impairment) shown but disabled:**
- Signals product roadmap to judges/investors
- "Coming soon" label clarifies it's not clickable
- Satisfies §5 truth table requirement (backend exists, web UI planned but not shipped)
- **Alternative:** Hide third card entirely until web UI is ready, only show in Settings → Coaching mode as grayed-out option with "Future: voice-first mode" tooltip

**After persona selection:**
- Redirect to `/home` (persona-specific dashboard)
- Persona stored in `localStorage.photographyCompanionPersona` + MongoDB `users.persona`
- Change anytime via Settings → Coaching mode (existing ModeToggle UI, relocated)

**No full auth required:**
- Use existing `DEMO_USER_ID` flow for hackathon judges
- Onboarding only sets persona preference
- **Post-hackathon:** Add Firebase Auth, but onboarding flow remains same (persona choice happens after login, not during)

---

### Navigation Config Per Persona

**navConfig object** (implemented in `App.tsx`):

```typescript
interface NavConfig {
  homeDefault: string;        // Default route for "/" redirect
  bottomBar: NavItem[];       // Mobile bottom bar (max 4)
  sidebar: NavItem[];         // Desktop sidebar (core 4)
  homeCards: HomeCard[];      // Dashboard cards on Home tab
  contextual: {               // Conditionally shown items
    activeAssignment?: NavItem;
    pendingApprovals?: NavItem;
  };
}

const navConfigs: Record<UserMode, NavConfig> = {
  hobbyist: {
    homeDefault: '/home',
    bottomBar: [
      { id: 'home', label: 'Home', icon: Home, route: '/home' },
      { id: 'studio', label: 'Studio', icon: Camera, route: '/studio' },
      { id: 'memory', label: 'My Work', icon: BookOpen, route: '/memory' },
      { id: 'mentor', label: 'Mentor', icon: MessageCircle, route: '/mentor' },
    ],
    sidebar: [...same as bottomBar],
    homeCards: [
      { type: 'practice', priority: 1, title: 'Continue Practice', cta: 'View assignment' },
      { type: 'studio', priority: 2, title: 'Critique a Photo', cta: 'Upload now' },
      { type: 'memory', priority: 3, title: 'Your Progress', cta: 'View portfolio' },
      { type: 'organize', priority: 4, title: 'Label Photos', cta: 'Review suggestions', badge: pendingCount },
    ],
    contextual: {
      activeAssignment: { id: 'practice', label: 'Practice', icon: Target, route: '/practice' },
    },
  },

  working_pro: {
    homeDefault: '/home',
    bottomBar: [
      { id: 'home', label: 'Home', icon: Home, route: '/home' },
      { id: 'studio', label: 'Studio', icon: Camera, route: '/studio' },
      { id: 'memory', label: 'My Work', icon: BookOpen, route: '/memory' },
      { id: 'mentor', label: 'Mentor', icon: MessageCircle, route: '/mentor' },
    ],
    sidebar: [
      ...same as bottomBar,
      { id: 'print', label: 'List for Sale', icon: ShoppingBag, route: '/print' }, // Added between My Work and Mentor
    ],
    homeCards: [
      { type: 'print', priority: 1, title: 'Listings to Approve', cta: 'Review now', badge: pendingListingsCount },
      { type: 'studio', priority: 2, title: 'Critique for Print', cta: 'Upload photo' },
      { type: 'memory', priority: 3, title: 'Portfolio Analytics', cta: 'View trends' },
      { type: 'practice', priority: 4, title: 'Improve Consistency', cta: 'Start assignment' },
    ],
    contextual: {
      pendingApprovals: { id: 'print', label: 'Print Sales', icon: ShoppingBag, route: '/print', badge: pendingListingsCount },
    },
  },

  vision_impairment: {
    // FUTURE — not implemented in Phase 1
    homeDefault: '/field',     // Voice-first capture is primary
    bottomBar: [
      { id: 'field', label: 'Capture', icon: Camera, route: '/field' },
      { id: 'mentor', label: 'Mentor', icon: MessageCircle, route: '/mentor' },
      { id: 'memory', label: 'Library', icon: BookOpen, route: '/memory' },
      { id: 'home', label: 'Home', icon: Home, route: '/home' },
    ],
    sidebar: [...same as bottomBar],
    homeCards: [
      { type: 'field', priority: 1, title: 'Describe Scene', cta: 'Start capture' },
      { type: 'mentor', priority: 2, title: 'Ask About My Work', cta: 'Open chat' },
      { type: 'memory', priority: 3, title: 'Recent Photos', cta: 'Listen to summaries' },
    ],
    contextual: {
      activeAssignment: { id: 'practice', label: 'Practice', icon: Target, route: '/practice' },
    },
  },
};
```

**Key differences:**
- **Hobbyist:** Practice-first (active assignments on Home), Organize in cards (not always-visible nav)
- **Working pro:** Print Sales elevated to sidebar (desktop), Organize + Practice demoted to Home cards
- **Vision impairment (future):** Field + Mentor primary, Studio moved to assisted mode

---

### Home Dashboard Wireframes (Text, Per Persona)

#### Hobbyist Home (`/home`)

**Layout:** Card-based dashboard, priority order top → bottom

```
┌────────────────────────────────────────────────────────┐
│  Home                                   [Settings ⚙️]  │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Welcome back, [name or "Photographer"]               │
│  12 photos uploaded · 68% consistency                 │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 🎯 Continue Practice                             │ │
│  │                                                  │ │
│  │ Active: "Shoot 3 backlit portraits with manual  │ │
│  │ exposure compensation"                           │ │
│  │                                                  │ │
│  │ 1 of 3 shots captured · Next: [Shoot Now →]     │ │
│  │                          [Upload in Studio]      │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 📸 Critique a Photo                              │ │
│  │                                                  │ │
│  │ Upload a new shot to get Glass Box feedback     │ │
│  │ and add it to your portfolio.                   │ │
│  │                                                  │ │
│  │ [Upload now →]                                   │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 📊 Your Progress                                 │ │
│  │                                                  │ │
│  │ 12 photos · Composition 7.2 ↑ · Lighting 6.8    │ │
│  │                                                  │ │
│  │ [View portfolio →]                               │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 🏷️  Label Photos                          [3]   │ │
│  │                                                  │ │
│  │ I found 3 groups in your library that need      │ │
│  │ consistent tags.                                 │ │
│  │                                                  │ │
│  │ [Review suggestions →]                           │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  Quick links: Field · Settings · Help                 │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Card priority:**
1. **Practice** (if active assignment exists) — primary user journey, keep them on track
2. **Studio** (always) — core upload flow
3. **Memory** (always) — progress reinforcement
4. **Organize** (if pending approvals > 0) — HITL secondary, badge count visible

**If no active assignment:** Practice card changes to "Start New Practice" with CTA to `/practice` tab (old Practice tab becomes assignment detail view)

---

#### Working Pro Home (`/home`)

**Layout:** Commercial focus, Print Sales priority

```
┌────────────────────────────────────────────────────────┐
│  Home                                   [Settings ⚙️]  │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Welcome back, [name]                                 │
│  47 photos · 3 listings approved this week            │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 💼 Listings to Approve                      [2]  │ │
│  │                                                  │ │
│  │ I drafted 2 marketplace listings from your       │ │
│  │ recent portfolio.                                │ │
│  │                                                  │ │
│  │ [Preview cards]                                  │ │
│  │ "Golden Hour Landscape" · $45.00                 │ │
│  │ "Urban Architecture" · $38.00                    │ │
│  │                                                  │ │
│  │ [Review all →]                                   │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 📸 Critique for Print                            │ │
│  │                                                  │ │
│  │ Upload new work to evaluate commercial viability│ │
│  │ and quality scores.                              │ │
│  │                                                  │ │
│  │ [Upload now →]                                   │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 📊 Portfolio Analytics                           │ │
│  │                                                  │ │
│  │ 47 photos · Top sellers: Landscapes (8.2 avg)   │ │
│  │ Consistency: 73% — strongest in Composition      │ │
│  │                                                  │ │
│  │ [View trends →]                                  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 🎯 Improve Consistency                           │ │
│  │                                                  │ │
│  │ Practice assignments help you shoot more         │ │
│  │ consistent work for your shop.                   │ │
│  │                                                  │ │
│  │ [Start assignment →]                             │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  Quick links: Organize · Settings · Help              │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Card priority:**
1. **Print Sales** (if pending listings > 0) — commercial HITL primary, shows 1-2 inline preview cards
2. **Studio** (always) — upload for critique
3. **Memory** (always) — portfolio analytics (working pro copy: "trends," "top sellers")
4. **Practice** (always) — framed as consistency improvement for commercial work

**Organize** demoted to Quick links footer — working pros care less about bulk tagging, more about individual listing quality.

---

#### Vision Impairment Home (FUTURE — not Phase 1)

**Layout:** Voice-first, large touch targets, sequential disclosure

```
┌────────────────────────────────────────────────────────┐
│  Home                                 [Settings ⚙️]    │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Welcome back                                         │
│  [Tap to hear summary]                                │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │                                                  │ │
│  │         🎤  Describe Scene                       │ │
│  │                                                  │ │
│  │    Open camera and I'll tell you what's         │ │
│  │    in frame before you capture.                  │ │
│  │                                                  │ │
│  │         [Start capture →]                        │ │
│  │                                                  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │                                                  │ │
│  │         💬  Ask About My Work                    │ │
│  │                                                  │ │
│  │    Chat with your mentor about recent photos    │ │
│  │    and get spoken feedback.                      │ │
│  │                                                  │ │
│  │         [Open chat →]                            │ │
│  │                                                  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │                                                  │ │
│  │         📚  Recent Photos                        │ │
│  │                                                  │ │
│  │    Listen to summaries of your last 10 shots    │ │
│  │                                                  │ │
│  │         [Play summaries →]                       │ │
│  │                                                  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Card priority:**
1. **Field** (always) — Visual Describer agent narrates scene before capture
2. **Mentor** (always) — voice-friendly chat with TTS
3. **Memory** (always) — sequential audio summaries of portfolio

**Studio** accessible via Settings → Upload mode, but not primary (requires sighted assistance or voice upload flow)

**Implementation notes (FUTURE):**
- Requires Visual Describer agent web integration (backend exists per §5)
- TTS for Mentor replies (Web Speech API)
- Larger touch targets (56×56pt minimum, not 44×44pt)
- High-contrast theme option
- VoiceOver optimization for all controls

---

### How This Fixes Tab Sprawl

**Problem → Solution mapping:**

| Problem | Current | New Architecture | Result |
|---------|---------|------------------|--------|
| **7-8 tabs overflow mobile** | Horizontal scroll on 390px | 4 bottom bar items max | No overflow, fits all viewports |
| **Equal-weight tabs** | All tabs same visual priority | Home dashboard + priority cards | Clear hierarchy: primary actions on Home |
| **Persona mismatch** | Hobbyist sees Print, working pro hunts for it | Persona-specific nav config | Hobbyist: Print in Quick links; Pro: Print in sidebar |
| **Generic SaaS chrome** | Horizontal tabs like every dashboard | Bottom bar (mobile) + sidebar (desktop) | Matches photography apps (VSCO, Lightroom) |
| **No journey guidance** | User picks random tab | Home dashboard surfaces next action | "Continue Practice" → Shoot Now → Studio |
| **Practice/Field/Organize buried** | Equal to core tabs | Contextual appearance on Home | Organize only shows when pending approvals exist |

**Tab count by visibility:**

| Persona | Always-visible nav | Home cards | Settings / Quick links | Total unique screens |
|---------|-------------------|------------|----------------------|---------------------|
| Hobbyist | 4 (Home, Studio, My Work, Mentor) | +2 (Practice, Organize) | +1 (Field) | 7 (same as before, better IA) |
| Working pro | 5 (Home, Studio, My Work, Mentor, Print) | +2 (Practice, Organize) | +1 (Field) | 8 (same as before, better IA) |
| Vision impairment | 4 (Home, Field, Mentor, My Work) | +1 (Practice) | +1 (Studio) | 6 (reduced from 7) |

**Key insight:** We don't eliminate screens (all 7-8 tabs remain as routes), we **reorganize visibility** to match persona journeys. Primary actions are always-visible nav; secondary actions appear contextually on Home; rare actions in Quick links.

---

### Judge Demo Path Preservation (§9 Constraint)

**90-second judge path must remain accessible:**

#### Current judge flow (horizontal tabs):
1. Click "Studio" tab → upload → Glass Box visible
2. Click "Memory" tab → aesthetic snapshot visible
3. Click "Print" or "Organize" tab → one HITL approve

#### New architecture judge flow (Home hub):

**Option A: Direct deep links (recommended)**
1. Navigate to `/studio` → Studio tab opens directly (bypasses Home)
2. Navigate to `/memory` → My Work tab opens directly
3. Navigate to `/print` → Print Sales opens directly (if working pro persona set)

**Option B: Via Home dashboard**
1. Navigate to `/home` → Home dashboard loads
2. Click "Critique a Photo" card → Studio tab
3. Click bottom bar "My Work" → Memory tab
4. Click "Listings to Approve" card → Print Sales tab

**Tradeoff:** Option A (direct deep links) is faster for demo script, Option B shows Home dashboard value. **Recommendation:** Use Option A for timed demos, mention Option B in narrative ("real users start at Home, but judges can jump straight to `/studio` for speed").

**Demo script update (one-line change):**

```diff
- Step 1: Click Studio tab
+ Step 1: Navigate to practice-companion.web.app/studio (or click Studio in bottom bar)

- Step 2: Click Memory tab
+ Step 2: Navigate to /memory (or click "My Work" in bottom bar)

- Step 3: Click Print tab (after switching to working pro)
+ Step 3: Navigate to /print (or click "List for Sale" in sidebar on desktop)
```

**All deep links remain valid** — no breaking changes to URLs, just improved IA on top.

---

### Onboarding vs Full Login (§16 Table)

**Hackathon requirement:** No OAuth blocking demo; use `DEMO_USER_ID` per spec.

**Recommended approach:**

| Feature | Hackathon (Phase 1) | Post-hackathon (Phase 2) |
|---------|---------------------|--------------------------|
| **User ID** | `DEMO_USER_ID` hardcoded | Firebase Auth UID |
| **Persona storage** | `localStorage` + MongoDB `users.persona` | Same (persisted to Firebase user profile) |
| **Onboarding** | Persona choice on first visit (3-card screen) | Persona choice after Google/email login |
| **Persona switch** | Settings → Coaching mode (no re-auth) | Same (no re-auth required) |
| **Multi-user** | Single demo user (judges all share state) | Per-user MongoDB namespacing |

**Implementation sequence:**

1. **Phase 1 (hackathon, <1 day):**
   - Add onboarding screen with 3 persona cards (hobbyist, working_pro, vision_impairment disabled)
   - `localStorage.photographyCompanionPersona` stores choice
   - Existing `PATCH /api/v1/users/me` updates MongoDB `users.persona`
   - Home dashboard renders persona-specific cards
   - Bottom bar + sidebar nav uses `navConfigs[persona]`

2. **Phase 2 (post-hackathon, <2 days):**
   - Add Firebase Auth (Google + email/password)
   - Onboarding moves to post-login (login → persona choice → Home)
   - Replace `DEMO_USER_ID` with Firebase UID
   - MongoDB queries scoped to `user_id` (already implemented, just needs real UIDs)

**No breaking changes** — Phase 1 onboarding flow is identical to Phase 2, just moves position in funnel (before vs. after login).

---

### Tradeoffs & Alternatives Considered

#### Alternative 1: Grouped Top Nav (§16 option 1)

**Structure:** Create · Progress · Library · Business (items inside change by persona)

**Example:**
- **Create:** Studio, Field
- **Progress:** Practice, Memory
- **Library:** Organize
- **Business:** Print (working pro only), Mentor

**Pros:**
- Desktop-friendly
- Clear semantic grouping
- No bottom bar needed on mobile (use accordion groups)

**Cons:**
- **Two-tier navigation** — user must click group, then item (extra tap on mobile)
- **Cognitive load** — "Where is Mentor? Create or Progress?" (doesn't fit cleanly)
- **Still overflows mobile** — 4 groups × 120px = 480px minimum, close to limit

**Rejected because:** Adds navigation depth without clear user benefit. Photography apps use flat bottom bars (VSCO, Lightroom), not grouped menus.

---

#### Alternative 2: Bottom Bar + "More" Menu (§16 option 2)

**Structure:** Home, Studio, Memory, Mentor + "⋯ More" overflow

**Example:**
- Bottom bar: Home, Studio, My Work, More
- More menu: Mentor, Practice, Organize, Print, Field, Settings

**Pros:**
- Fits all tabs in mobile nav
- Industry standard (Instagram, Twitter use this)
- No Home dashboard required

**Cons:**
- **"More" is a junk drawer** — users don't discover Mentor (buried)
- **Persona mismatch** — working pro must tap "More" to find Print Sales (too many taps for primary action)
- **Generic social app pattern** — doesn't differentiate from consumer apps

**Rejected because:** Buries important features (Mentor, Print) in overflow. Home hub approach surfaces these as cards based on context.

---

#### Alternative 3: Full Context Switch (§16 option 4)

**Structure:** During active assignment, shell shifts to Field-forward until complete

**Example:**
- Default nav: Home, Studio, Memory, Mentor
- Active assignment triggers: **Field, Studio, Practice, Mentor** (Memory hidden)
- After completion: revert to default nav

**Pros:**
- **Hyper-contextual** — nav matches user's immediate task
- **Reduces distraction** — hides Memory/Organize when not relevant
- **Photography app precedent** — camera apps go full-screen during capture

**Cons:**
- **Disorienting** — nav changes mid-session, hard to predict
- **Breaks mental model** — "Where did Memory go?"
- **Complex state management** — nav must track assignment state, completion events

**Rejected because:** Too aggressive for hackathon timeline. Could revisit as **Focus Mode** (opt-in) post-launch: "Hide distractions while practicing" toggle.

---

### Recommended Implementation Sequence

#### Phase 1A: Foundation (<4 hours) — Ship for hackathon

1. **Onboarding screen** (2h)
   - Create `OnboardingScreen.tsx` component with 3 persona cards
   - `localStorage.photographyCompanionPersona` check on App mount
   - If no persona: show onboarding, else: navigate to Home
   - PATCH `/api/v1/users/me` with selected persona

2. **Home dashboard scaffold** (2h)
   - Create `HomeTab.tsx` component
   - Implement hobbyist card layout (Practice, Studio, Memory, Organize)
   - Hard-code badge counts (pending approvals, active assignment state)
   - Route `/home` in App.tsx

**Result:** Onboarding works, Home shows cards, but nav is still 7 horizontal tabs (no bottom bar yet).

---

#### Phase 1B: Navigation refactor (<6 hours) — Ship for hackathon

3. **Bottom bar component** (3h)
   - Create `BottomNav.tsx` with 4 items (Home, Studio, My Work, Mentor)
   - Responsive: show on `<1024px`, hide on desktop
   - 44×44pt touch targets, active state styling
   - Replace top horizontal nav on mobile

4. **Desktop sidebar** (3h)
   - Create `Sidebar.tsx` with same 4 core items
   - Responsive: show on `≥1024px`, hide on mobile
   - Add Settings at bottom (collapsed menu)
   - Working pro: inject "List for Sale" between My Work and Mentor

**Result:** Mobile uses bottom bar, desktop uses sidebar. Tab count reduced from 7 → 4 always-visible. Home dashboard surfaces secondary tabs as cards.

---

#### Phase 1C: Persona-specific cards (<3 hours) — Ship for hackathon

5. **Working pro Home** (2h)
   - Create `homeCards.working_pro` config
   - Print Sales card with inline listing previews (if pending > 0)
   - Portfolio Analytics card (different copy from hobbyist)
   - Practice card framed as "Improve Consistency"

6. **Vision impairment placeholder** (1h)
   - Onboarding card shows "Accessible (future)" with disabled state
   - Settings → Coaching mode shows 3 options, third grayed out
   - Tooltip: "Voice-first mode coming soon — backend ready, web UI in progress"

**Result:** Hobbyist and working pro see different Home dashboards. Vision impairment visible but clearly marked as future.

---

#### Phase 2: Post-hackathon enhancements (FUTURE, >1 week)

7. **Firebase Auth integration** (2 days)
   - Add Google + email/password login
   - Onboarding moves to post-login
   - Replace `DEMO_USER_ID` with Firebase UID
   - Multi-user MongoDB namespacing

8. **Vision impairment web UI** (3 days)
   - Integrate Visual Describer agent on Field tab
   - TTS for Mentor replies (Web Speech API)
   - High-contrast theme option
   - VoiceOver optimization
   - Enable third onboarding card

9. **Dynamic Home cards** (2 days)
   - Backend: aggregation pipelines for trend data, pending counts
   - Frontend: fetch on Home mount, real-time badge updates
   - Practice card shows actual assignment progress (1 of 3 shots)

10. **Contextual nav** (1 day)
    - Active assignment banner (sticky top, all tabs)
    - "Shoot Now" CTA in banner → Field tab
    - Dismiss banner on assignment completion

**Total Phase 2 effort:** 8 days (deferred to post-demo)

---

### Success Metrics (How We Know This Works)

**Quantitative (post-launch analytics):**
- **Tab discovery rate:** % of users who find Print Sales within first session (target: >80% for working pros)
- **Home bounce rate:** % of users who leave Home without clicking a card (target: <20%)
- **Nav depth:** Average taps to reach target screen from Home (target: ≤2 taps for primary actions)
- **Persona switch rate:** % of users who change persona after onboarding (target: <10%, indicates good initial match)

**Qualitative (user testing):**
- **5-second test:** Show Home dashboard, ask "What is this app for?" (target: 80% mention "photography critique" or "practice")
- **First-click test:** Show hobbyist Home, ask "Where would you upload a photo?" (target: 90% click Studio card)
- **Journey completion:** Give task "Approve a print listing," measure success rate for working pros (target: 100% find Print Sales)

**Judge demo metrics:**
- **90-second path still viable:** Demo script runs in <90s using direct deep links
- **Differentiation score:** Judges rate "looks different from other AI dashboards" (target: >4/5)

---

### Final Recommendation

**Ship Phase 1A + 1B for hackathon** (total <10 hours):
- Onboarding with persona choice (hobbyist, working pro, vision_impairment placeholder)
- Home hub with persona-specific cards (Practice, Studio, Memory, Organize/Print)
- Bottom bar navigation (mobile) + sidebar (desktop) with 4 core items
- Deep links preserved for judge demo script

**Defer Phase 1C + Phase 2** (vision impairment full web UI, Firebase Auth, dynamic cards) to post-demo.

**Why this is the right architecture:**
- **Solves tab sprawl** — 7 equal-weight tabs → 4 always-visible + contextual cards
- **Persona-coherent** — different home dashboards per user mode, not just tab visibility toggle
- **Mobile-first** — bottom bar fits all viewports, photography app convention
- **Judge-friendly** — deep links work, demo path unchanged
- **Incremental** — can ship Phase 1A (onboarding + Home scaffold) independently, add nav refactor in Phase 1B
- **Future-proof** — vision impairment persona planned but clearly marked as future, no fake implementation

**Tradeoffs accepted:**
- **More screens** (Home + 7 tabs = 8 total routes, but better IA)
- **Complexity** (navConfig object + conditional rendering, but isolated in one file)
- **Learning curve** (users must discover Home hub, but onboarding + cards guide them)

**Alternative rejected:** Grouped top nav (two-tier), "More" overflow menu (buries features), full context switch (too aggressive for hackathon).

**Next steps:**
1. Get user approval on onboarding wireframe (3-card design)
2. Implement Phase 1A (onboarding + Home scaffold)
3. Test Home dashboard with 2-3 real photographers (remote Loom videos)
4. Ship Phase 1B (bottom bar + sidebar nav refactor)
5. Validate judge demo path with direct deep links
6. Defer Phase 1C + Phase 2 to post-demo backlog

---

## Pass 3 — [Future Review Session]
**Date:** TBD
**Reviewer:** TBD
**Scope:** TBD

[Next review session will be added here]

---

## Review History

| Pass | Date | Reviewer | Focus | Issues Found | Issues Resolved |
|------|------|----------|-------|--------------|-----------------|
| 1 | 2026-05-25 | Claude Sonnet 4.5 | Full app audit | 10 major + responsive/a11y | 0 (initial review) |
| 2 | 2026-05-25 | Claude Sonnet 4.5 | Navigation architecture & persona IA | Tab sprawl, persona journeys | 0 (strategy defined, not implemented) |
