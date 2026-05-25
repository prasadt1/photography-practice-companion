# Product

## Register

product

## Users

**Primary: Photographers seeking growth over time**

- **Hobbyist photographers** building skills through deliberate practice. They want honest critique, structured assignments, and visible progress. Context: reviewing photos after a shoot, planning what to practice next, understanding why a photo works or doesn't.

- **Working professionals** balancing skill growth with commercial output. They want portfolio-aware mentorship plus print sales guidance. Context: deciding which work to list, understanding market fit, maintaining creative growth while running a business.

- **Photographers with vision impairment** (roadmap): seeking creative expression through non-visual feedback. Voice-first coaching, scene narration, haptic guidance. Context: field capture with audio/haptic support, understanding composition through description.

**What they share:** They want an AI that *remembers* them, tracks their growth, and explains its reasoning. Not a black-box score generator. Not a chatbot with amnesia.

## Product Purpose

Iris is an AI photography mentor with persistent portfolio memory.

**What it does:**
- Critiques photos with transparent "Glass Box" reasoning (not just scores, but *why*)
- Remembers every photo across sessions (MongoDB-backed portfolio)
- Tracks skill growth over time (composition, lighting, technique trends)
- Generates personalized practice assignments based on weaknesses
- Drafts print sales listings for working professionals (human approval required)

**What it is NOT:**
- Not a photo editor (that's Lightroom)
- Not a culling tool (that's Aftershoot)
- Not a social platform (no likes, followers, feeds)
- Not a workflow accelerator (it's deliberately slow and thoughtful)

**Success looks like:** A photographer uploads their 50th photo and Iris says "Your composition has improved 23% since you started. You've mastered leading lines. Let's work on backlighting next." The relationship compounds over time.

## Brand Personality

**Three words:** Thoughtful, Editorial, Warm

- **Thoughtful:** Glass Box reasoning. Scores aren't arbitrary judgments; they're explained step-by-step. The UI pacing doesn't rush. Critique appears with context, not just numbers.

- **Editorial:** Photography magazine curator voice. Visual-first presentation where photos dominate over UI chrome. Serif headlines for gravitas. Gallery-grade layouts that honor the user's work.

- **Warm:** Mentor relationship, not cold algorithm. First-person voice ("I noticed your lighting improved"). Encouraging but honest. Amber tones. Coaching language that builds confidence.

**Voice:** First-person singular. "I analyzed your photo" not "The system processed your image." "I remember you struggled with backlighting" not "Historical data indicates suboptimal exposure patterns."

## Anti-references

**Do NOT look like:**

1. **Generic AI SaaS** — Purple/blue gradients, "AI-powered" badges, dashboard chrome everywhere, chatbot message bubbles, empty upload zones as hero content. This is the primary identity threat.

2. **Photo editing tools** — Sliders, filters, curves panels, before/after editing comparisons. That's Lightroom's domain. Iris teaches; it doesn't edit.

3. **Social media apps** — Feeds, likes, comments, follower counts, viral mechanics, endless scroll. Iris is about personal growth, not social validation.

4. **Culling/workflow tools** — Aftershoot-style rapid grid selection, speed metrics, "process 1000 photos in 2 minutes." Iris is deliberately slow and thoughtful.

5. **Stock photography sites** — Generic photo grids, search-first interfaces, transactional "add to cart" patterns. User photos are precious work, not inventory.

## Design Principles

1. **Photos are the interface**
   Every screen should be dominated by photography, not UI chrome. The photo IS the hero. Empty states show example critiques, not abstract illustrations. Memory is a gallery, not a dashboard.

2. **Show, then tell**
   Lead with visual proof (photo with critique overlay visible), then explain in text. Never lead with empty upload zones, abstract cards, or walls of copy. The product's value should be obvious in 5 seconds.

3. **Mentor, not machine**
   First-person voice throughout. "I noticed your composition improved" not "Composition score increased." Glass Box is a teaching moment, not a debug log. Coaching language that builds confidence.

4. **Memory makes meaning**
   Surface the user's history. "This is your 47th photo" matters. Trends and growth are visible. The app knows you. Returning users see continuity, not a blank slate.

5. **Respect the craft**
   Use photography terminology (aperture, rule of thirds, Rembrandt lighting), not CS jargon (CV, grounding corpus, orchestrator). Equipment-inspired visual motifs. Gallery-grade presentation of user work.

## Accessibility & Inclusion

**Baseline:** WCAG 2.1 AA compliance

- Color contrast: 4.5:1 minimum for text (current amber on warm charcoal passes)
- Focus indicators: Visible on all interactive elements (implemented)
- Semantic HTML: Proper heading hierarchy, ARIA labels where needed
- Keyboard navigation: Full app usable without mouse

**Motion:** Respect `prefers-reduced-motion`. Disable non-essential animations. Keep functional transitions (page changes, loading states).

**Roadmap (vision impairment persona):**
- Voice-first field coaching mode
- High-contrast theme variant
- Screen reader optimization pass
- Haptic feedback patterns (native app)

**Inclusion notes:**
- Photography terminology should be explained on first use (tooltip or inline)
- Glass Box reasoning helps users learn, regardless of prior expertise
- Avoid assumptions about equipment (not everyone has a DSLR)
