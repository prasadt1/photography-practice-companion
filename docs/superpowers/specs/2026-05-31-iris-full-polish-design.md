# Iris Full Product Polish — Design Specification

**Date:** 2026-05-31
**Status:** Approved for implementation
**Approach:** Phased by Page (3 phases)

## Overview

Full product polish addressing 11 UX concerns across homepage, sidebar, palette, footer, Organize feature, Practice/Field, assignment visibility, logo, mentor insights, navigation, and Print Sales. Serves three personas equally: hackathon judges, photography hobbyists, and working professionals.

## Core Value Proposition

**Headline:** "Your AI photography mentor — that remembers every shot you upload."

**Subhead:** "Glass Box critiques on five dimensions, a private library that grows with you, practice assignments, and mentor chat — plus organize & print listings (pro) with your approval on every change."

---

## Phase 1: Homepage + Sidebar + Palette + Footer + Logo

### 1.1 Homepage Layered Structure

The homepage adapts based on user state (empty library vs. returning user) while maintaining scroll-accessible capabilities.

#### First Visit / Empty Library

**Pitch Hero Section:**
- Full-width gradient card (surface-1 → canvas)
- Headline: "Your AI photography mentor — that remembers every shot you upload."
- Subhead: "Glass Box critiques on five dimensions, a private library that grows with you, practice assignments, and mentor chat."
- Primary CTA: "Upload your first photo" (amber, prominent)
- Secondary CTA: "See demo critique" (outline, amber border)
- No backdrop-blur on hero card; clean gradient only

**Example Glass Box:**
- Below pitch hero
- Sample photo (use actual curated example, not placeholder)
- 2-3 line critique excerpt with score badges
- Demonstrates the critique experience before upload

**Capabilities Grid:**
- Section heading: "What Iris can do"
- 2×2 grid on desktop, stacked on mobile
- Cards: Glass Box Critique, Practice Assignments, Mentor Chat, Organize & Tag
- Each card: title + one-line description
- Surface-1 background, warm border

**Sidebar (empty state):**
- Upload prompt in sidebar is secondary to main hero CTAs
- Dashed border box with "+" icon and "Upload your first photo"
- Mentor one-liner: "Ready when you are — upload to begin"

#### Returning User (photoCount >= 1)

**Personal Hero — Full-Bleed Variant (default):**
- User's true strongest photo as cinematic full-bleed background
- Overlay card (bottom-left or centered) with:
  - Label: "Best in your library"
  - Score badge: overall average (e.g., "8.7")
  - Scene description or photo title
  - Stats: "47 photos · Member since Mar 2024"
  - Dominant aesthetic tags as chips
- Photo must be real (from portfolio), not placeholder
- Backend fix required: query for true highest-scoring photo, real portfolio count

**Slim Pitch Band:**
- Dismissible strip below personal hero
- Copy: "Remembers every shot you upload." (shortened)
- Dismiss button (×) persists dismissal to localStorage
- Not removed entirely — judges may use demo accounts with photos

**Elevated Mentor Card:**
- Positioned after personal hero, before capabilities/stats
- Label: "From your mentor"
- 2-3 lines of profile-driven insight (patterns + recent improvement)
- Optional sparkline or delta indicator
- Primary CTA: "Ask me anything" → Mentor tab
- Show when photoCount >= 3; softer threshold for demo accounts

**Latest Assignment Card (when applicable):**
- Shows most recent completed assignment
- Thumbnail of submitted photo
- Label: "Practice Win"
- Assignment name + skill delta (e.g., "Lighting +0.5 · Brief applied")
- Links to full assignment detail

**Contact Sheet Strip:**
- Horizontal scroll of 6-10 recent photos (thumbnails)
- Primary Upload CTA visible alongside or below strip
- "View all in My Work" link

**At a Glance Stats:**
- 3-column grid: Avg Score, This Month delta, Assignments completed
- Amber accent on score, green on positive delta

**Capabilities Section:**
- Same as first-visit, but condensed or below the fold
- Always scroll-accessible

### 1.2 Sidebar Dashboard Strip

Persistent sidebar on all pages (desktop). Never empty dark space.

**Structure (top to bottom):**

1. **Logo Zone**
   - Actual Iris mark asset (SVG or @2x/@3x PNG)
   - Wordmark "Iris" only; tagline moves to Home pitch or onboarding
   - Solid bg-canvas background — NO backdrop-blur, NO film grain
   - Test mark at 44px, 48px, 56px sizes for crispness
   - Clean border-bottom separator

2. **Navigation Menu**
   - Home, My Work, Practice, Mentor (+ Print Sales for working pro)
   - Active state: amber background at 20% opacity, amber text
   - Badges on nav items:
     - Practice: amber badge with active assignment count
     - Mentor: "Organize · N" badge when pending proposals exist (not ambiguous number)

3. **Portfolio Glimpses**
   - When library has photos:
     - 2×2 thumbnail grid (recent photos)
     - Photo count: "47 photos"
     - Mini sparkline (6 bars) with delta indicator (e.g., "+0.4" in green)
   - When empty:
     - Subtle Iris mark or aperture icon
     - "Upload your first photo" text
     - Secondary to main hero CTAs

4. **Contextual Block**
   - Changes by active tab:
     - Home: dominant tags or recent trend
     - Practice: active assignment brief (border-left accent)
     - Mentor: "Organize · N pending"
     - Print Sales: "N draft listings"
   - Surface-2 background, 12px padding

5. **Mentor One-Liner**
   - Above Settings
   - Brand accent color (amber)
   - Examples: "Your landscapes are improving — Composition +0.7 this month"
   - Updates when profile/trends load
   - Not live chat — profile-driven insight

6. **Settings**
   - Bottom of sidebar
   - Muted text, border-top separator

### 1.3 Palette Refinements ("Refined Darkroom")

Same palette tokens, better execution.

**Contrast Improvements:**
- Footer text: text-sm (14px), color #d6d3d1 for line 1, #a8a29e for line 2, #78716c for line 3
- Secondary text: ensure 4.5:1 contrast minimum
- Muted elements: #78716c minimum, not #57534e

**Amber Surface Reduction:**
- Amber reserved for: scores, primary CTAs, active nav state only
- Remove amber borders/chips from non-score cards
- Use warm-border (#44403c) for card edges instead

**Hero Treatment:**
- No backdrop-blur on pitch hero card
- Clean gradient (surface-1 → canvas) or solid surface
- Glass cards with backdrop-blur only on photo overlays where photo provides texture

**Logo Zone:**
- Solid bg-canvas
- No film grain overlay on sidebar header
- Film grain can remain on main content area if desired

**Optional Light Pitch Strip:**
- First-visit pitch hero can use slightly elevated surface (surface-2) for higher contrast
- Not a full light mode — just better separation from dark canvas

### 1.4 Footer Redesign

Visible, calm closing statement. Not a second navigation bar.

**Structure (desktop, centered):**

```
Line 1 (14px, #d6d3d1):
Iris — your AI photography mentor that remembers every shot you upload.

Line 2 (13px, #a8a29e):
Your photos stay in your private library. You approve every tag and listing. · How we score · How it works

Line 3 (12px, #78716c):
Built by a fellow photographer — for the work you do between workshops, critiques, and shoots.
```

**Styling:**
- Padding: 24px vertical, 32px horizontal
- Border-top: 1px solid warm-border
- Background: bg-canvas
- Links: amber color (#fbbf24), no underline, underline on hover
- Mobile: stack lines, reduce padding to 16px

**Constraints:**
- No emoji
- No version/changelog clutter
- No duplicate nav links (sidebar + bottom nav cover navigation)
- Optional: placeholder for creator name/link

### 1.5 Logo Zone Cleanup

**Asset Requirements:**
- SVG preferred, or @2x/@3x PNG exports
- Test rendering at 44px, 48px, 56px
- Current raster PNG (iris-icon.png) reads soft at sidebar scale

**Lockup Simplification:**
- Mark + "Iris" wordmark only
- Remove tagline from sidebar header
- Tagline appears in: Home pitch hero, onboarding, footer line 1

**Visual Consistency:**
- If mark is detailed/metallic, simplify for chrome sizes
- OR warm up Lucide nav icons slightly to match mark weight
- Logo zone should feel intentional, not a pasted asset

**Environment:**
- Logo header sits on solid bg-canvas
- No backdrop-blur on logo area
- No film grain over sidebar header strip

### 1.6 Backend/Data Fixes for Phase 1

**True Strongest Photo:**
- Query portfolio for entry with highest `overallAverage`, not most recent
- Display in personal hero with real score

**Real Portfolio Count:**
- Count actual portfolio entries, not hardcoded
- Display in personal hero stats

**Dismissible Pitch Band:**
- Persist dismissal to localStorage
- Key: `iris:pitchBandDismissed`

---

## Phase 2: Organize + Practice + Assignment Visibility + Back Navigation

### 2.1 Organize Feature Elevation

**Discoverability:**
- Badge on Mentor nav: "Organize · N" when pending proposals exist
- Sidebar contextual block on Mentor tab: "Organize · N pending"
- Consider outcome-based label: "Tag & tidy library" instead of "Organize"
- Do NOT require discovery only via toggle inside Mentor

**Value Proposition Messaging:**
- Current "suggest tags" undersells the feature
- Surface outcomes:
  - Groups similar photos (embedding clusters)
  - Flags near-duplicates for optional removal
  - Marks high-scoring untagged gems
  - Searchable library ("portrait", "backlit")
  - Less clutter
- Nothing auto-applies — user approves every tag and deletion

**Two-Path Messaging:**
- Empty library: "Upload on Home or My Work first — then scan here."
- Has photos: "Scan groups similar shots, suggests tags, and may flag near-duplicates. You approve every change."

**Approval Flow:**
- Approved tags → user_tags in portfolio entry → filterable in My Work
- Duplicate flags → remain visible until user approves deletion
- Be honest in copy about what happens

### 2.2 Field Camera Desktop Behavior

**Desktop/Laptop:**
- Button label: "Upload for this assignment"
- Opens file picker, not webcam
- Copy: "Use your phone or DSLR to shoot, then upload the frame here. Iris will critique it against your assignment brief."
- Do NOT open laptop webcam by default

**Mobile/Tablet:**
- Keep live camera capture
- Or user explicitly chooses "Use this camera"

**Optional Enhancement:**
- "Continue on phone" link with QR code for iOS Field Coach deep link
- Additive, not replacement for desktop upload

**Assignment Linking:**
- Upload with assignmentId links portfolio entry to assignment
- Critique shows "Submitted for: [assignment name]"

### 2.3 Assignment-Growth Visibility

Backend already works; UX needs to surface it.

**After Upload for Assignment:**
- Critique/Practice view shows: "Submitted for: [assignment name]" link
- Clear connection between photo and assignment

**After Mark Complete:**
- "Practice Win" card:
  - Linked photo thumbnail
  - Assignment name
  - Brief applied: yes/no indicator
  - Skill delta on target dimension (e.g., "Composition +0.7")

**Home Integration:**
- "Latest assignment" card when recent completion exists (within 7 days)
- Or fold skill_delta into "At a glance" stats
- Keep portfolio-wide growth as separate long-term view

### 2.4 Contextual Back Navigation

**Top-Level Tabs (no back button needed):**
- Home, My Work gallery, Practice list, Mentor, Print Sales
- Sidebar + mobile bottom nav provide navigation

**Sub-Views (one level deep):**
- In-content header with "← [Parent]" affordance
- Examples:
  - Field/assignment capture → "← Practice"
  - Critique/studio result → "← My Work"
  - Assignment detail → "← Practice"

**Placement:**
- Top of main content area, below mobile header if present
- Min 44px tap target on mobile

**Implementation:**
- Sync sub-views to hash segments where possible
- In-app back control regardless of hash history state
- One-level "← Parent" only; no full breadcrumb trail

---

## Phase 3: Print Sales + Final QA

### 3.1 Data Persistence & User Trust

Backend persists all data; UX must make this visible.

**After Approve:**
- Persistent success state (not fleeting animation)
- Copy: "Saved to your library (not live on Etsy)"
- Card shows "Approved" badge

**Draft Cards:**
- Label: "Proposal — not listed until you approve"
- Clear distinction from approved listings

**Rejected Drafts:**
- Clear dismissed state
- Optional: "Rejected drafts" collapsed section for trust/review
- User can see what they declined

**Price Settings:**
- Saved on approve/modify
- Editable inline on draft card
- Persisted to print_sales collection

### 3.2 My Work Visibility for Listings

**Gallery Badges:**
- Approved listings show badge on thumbnail: "Listed" or marketplace indicator
- Visual distinction from non-listed photos

**Filter Option:**
- Add "Listed for sale" to filter dropdown
- Optional user_tag on approve (e.g., `listed_for_sale`) for consistency

### 3.3 Performance Improvements

**Skeleton Loading:**
- Skeleton cards while fetching pending + portfolio entries
- Match card dimensions to prevent layout shift

**Lazy-Loaded Thumbnails:**
- Load thumbnails per-card, not blocking full page
- Intersection Observer for viewport-based loading

**Scan Progress:**
- Reuse existing scan banner pattern from Organize
- Show progress indicator during "Draft listing proposals" scan

**UI Copy Clarification:**
- Explain what "Draft listing proposals" does:
  "Iris scans your portfolio, picks strong candidates, and generates title, description, and suggested price. You approve each listing individually. Approved listings are saved to your library — not published to Etsy in this preview."

---

## Implementation Notes

### File Changes Expected

**Phase 1:**
- `frontend/src/components/HomeTab.tsx` — layered structure, personal hero, mentor card
- `frontend/src/components/AppSidebar.tsx` — dashboard strip, portfolio glimpses, contextual block
- `frontend/src/index.css` — palette refinements, contrast fixes
- `frontend/src/App.tsx` — footer redesign
- `frontend/public/` — crisp logo assets (SVG or @2x PNG)
- `app/memory/portfolio.py` — true strongest photo query, real count

**Phase 2:**
- `frontend/src/components/MentorTab.tsx` — Organize elevation, messaging
- `frontend/src/components/PracticeTab.tsx` — Field Camera desktop behavior, back nav
- `frontend/src/components/studio/StudioAnalysisResults.tsx` — assignment link visibility
- Navigation components — contextual back affordance

**Phase 3:**
- `frontend/src/components/PrintSalesTab.tsx` — save states, skeleton loading
- `frontend/src/components/MyWorkTab.tsx` — Listed badge, filter
- Service clients — lazy loading implementation

### Testing Considerations

- Test homepage with 0, 1, 3, 47+ photos in library
- Test sidebar at various viewport widths
- Verify contrast ratios meet WCAG AA (4.5:1)
- Test footer on mobile (stacked layout)
- Verify back navigation on all sub-views
- Test Print Sales with slow network (skeleton behavior)

### Out of Scope

- Full light mode / theme toggle
- Tab-based homepage navigation
- Full breadcrumb trails
- Auto-apply for Organize tags/deletions
- Live Etsy publishing (preview only)

---

## Approval

- [x] Phase 1 mockups reviewed and approved with revisions
- [ ] Spec review loop
- [ ] User spec review
- [ ] Implementation plan (writing-plans skill)
