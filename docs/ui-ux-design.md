# Practice Companion - UI/UX Design

> **Canonical:** [`spec.md`](spec.md) §3, Phase 3 UI · **Index:** [`README.md`](README.md)

**Version:** 1.0
**Date:** May 24, 2026
**Status:** Design Phase

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [User Personas](#user-personas)
3. [Information Architecture](#information-architecture)
4. [User Flows](#user-flows)
5. [Component Hierarchy](#component-hierarchy)
6. [Visual Design System](#visual-design-system)
7. [Key Screens](#key-screens)
8. [Interaction Patterns](#interaction-patterns)
9. [Responsive Design](#responsive-design)
10. [Accessibility](#accessibility)

---

## Design Principles

### 1. Glass Box Transparency

**Principle**: Show the "why" behind AI decisions, not just the "what."

**Application**:
- Critique displays reasoning steps, not just scores
- Assignments show rationale grounded in portfolio observations
- Spatial overlays explain composition issues visually

**Anti-Pattern**: Black box AI that says "7/10" without explanation.

### 2. Progress Over Perfection

**Principle**: Focus on growth trajectory, not absolute quality.

**Application**:
- ISAR metric shows improvement delta (13% → 67% = +54pp)
- Baseline vs. current side-by-side comparison
- Practice tab emphasizes "what you're working on" over "what's wrong"

**Anti-Pattern**: Harsh critique that demotivates ("This is bad").

### 3. Memory as First-Class Feature

**Principle**: Make persistent memory visible and tangible.

**Application**:
- Memory tab shows portfolio timeline, aesthetic profile
- "As of [date], based on [N] images" transparency
- Cross-session continuity ("Remember when we talked about...")

**Anti-Pattern**: Hidden memory that feels like magic.

### 4. Lightweight Workflow Integration

**Principle**: Don't replace the photographer's tools; fit into their existing workflow.

**Application**:
- XMP export to Lightroom (photographers already use Lightroom)
- Field Mode as optional enhancement (doesn't require abandoning existing process)
- Upload any image (no format restrictions beyond standard web support)

**Anti-Pattern**: Walled garden that forces users to change their entire workflow.

### 5. Dual Audience Respect

**Principle**: Hobbyists and working pros have different needs. Respect both.

**Application**:
- Hobbyist mode: pedagogical tone, detailed explanations, skill growth focus
- Working-pro mode: concise feedback, aesthetic consistency focus, business-aware suggestions
- Mode toggle visible but not intrusive

**Anti-Pattern**: One-size-fits-all that patronizes pros or overwhelms beginners.

---

## User Personas

### Persona 1: Maya (Hobbyist Photographer)

**Demographics**: 32, product designer, photography hobbyist for 3 years

**Goals**:
- Improve portraiture skills systematically
- Understand composition principles (not just "try this")
- Track progress over time
- Feel encouraged, not criticized

**Pain Points**:
- Generic photo feedback ("nice shot!")
- Can't tell if she's improving
- Unclear what to practice next

**How Practice Companion Helps**:
- Glass Box critique explains *why* composition works/doesn't
- ISAR metric shows measurable improvement
- Assignments calibrated to current skill level
- Supportive, pedagogical tone

### Persona 2: Carlos (Working Professional Photographer)

**Demographics**: 45, wedding/portrait photographer, 15 years experience

**Goals**:
- Maintain aesthetic consistency across clients
- Identify drift in editing style
- Deliver client-ready work efficiently
- Integrate with existing Lightroom workflow

**Pain Points**:
- Editing 500+ images per wedding, hard to maintain consistency
- Client feedback sometimes vague ("doesn't feel like your usual work")
- No objective measure of style drift

**How Practice Companion Helps**:
- Aesthetic profile tracks consistency score
- Cross-shoot comparison (this wedding vs. last 3)
- XMP export syncs with Lightroom (no workflow disruption)
- Concise, business-aware feedback

---

## Information Architecture

### Site Map

```
Practice Companion
├── Studio Mode (default landing)
│   ├── Upload Area
│   ├── Analysis Results
│   │   ├── 5-Axis Scores
│   │   ├── Glass Box Reasoning
│   │   └── Spatial Overlay
│   └── XMP Export
│
├── Practice Tab
│   ├── Active Assignment
│   │   ├── Brief + Rationale
│   │   ├── Baseline Shoot
│   │   └── ISAR Progress
│   └── Completed Assignments (list)
│
├── Memory Tab
│   ├── Portfolio Timeline (grid view)
│   ├── Aesthetic Profile
│   │   ├── Dominant Tones
│   │   ├── Preferred Lighting
│   │   ├── Subject Patterns
│   │   └── Consistency Score
│   └── Search
│       ├── Vector Search (visual similarity)
│       └── Atlas Search (text query)
│
└── Field Mode (optional, demo segment)
    ├── Live Camera Preview
    ├── Voice Coaching
    └── Quick Capture
```

### Navigation

**Primary Navigation**: Tab bar (top or side)
- Studio | Practice | Memory | Field

**Secondary Actions**:
- Mode Toggle (Hobbyist ⇄ Working Pro) - settings icon or toggle in header
- XMP Export - action button in Studio Mode after critique
- Search - input field in Memory tab

---

## User Flows

### Flow 1: Studio Mode - Upload & Critique

```
┌─────────────────────┐
│ Landing (Studio)    │
│ "Upload photos"     │
└──────────┬──────────┘
           │ User drags/drops or selects images
           │
┌──────────▼──────────┐
│ Upload Progress     │
│ "Analyzing 3        │
│  images..."         │
└──────────┬──────────┘
           │ ~5-15s per image (Coach analysis)
           │
┌──────────▼──────────┐
│ Analysis Results    │
│ ┌─────────────────┐ │
│ │ Image 1         │ │
│ │ Scores: 7 8 6 9 │ │
│ │ Glass Box ▼     │ │
│ └─────────────────┘ │
│ [Next Image]        │
└──────────┬──────────┘
           │ User reads critique, clicks spatial overlay
           │
┌──────────▼──────────┐
│ Spatial Overlay     │
│ ┌─────────────────┐ │
│ │ [Image with     │ │
│ │  annotations]   │ │
│ │ Red box: "Subject│
│ │  centered - try  │
│ │  rule of thirds"│ │
│ └─────────────────┘ │
└──────────┬──────────┘
           │ User closes overlay
           │
┌──────────▼──────────┐
│ Practice Update     │
│ "New assignment     │
│  based on your      │
│  recent uploads"    │
│ [View Practice]     │
└──────────┬──────────┘
           │ User clicks "View Practice"
           │
┌──────────▼──────────┐
│ Practice Tab        │
│ (see Flow 2)        │
└─────────────────────┘
```

### Flow 2: Practice Tab - View Assignment & Progress

```
┌─────────────────────┐
│ Practice Tab        │
│ Active Assignment   │
│ ┌─────────────────┐ │
│ │ "Use rule of    │ │
│ │  thirds..."     │ │
│ │ Rationale: "I   │ │
│ │  noticed you    │ │
│ │  often center..." │
│ └─────────────────┘ │
└──────────┬──────────┘
           │ User has worked on assignment
           │
┌──────────▼──────────┐
│ Baseline vs Current │
│ ┌────────┬────────┐ │
│ │Baseline│Current │ │
│ │ (2/15) │ (10/15)│ │
│ │  13%   │  67%   │ │
│ └────────┴────────┘ │
│ ISAR Delta: +54pp   │
└──────────┬──────────┘
           │ User scrolls down
           │
┌──────────▼──────────┐
│ Completed           │
│ Assignments List    │
│ ┌─────────────────┐ │
│ │ ✓ "Experiment   │ │
│ │    with side    │ │
│ │    lighting"    │ │
│ │   +40pp         │ │
│ └─────────────────┘ │
└─────────────────────┘
```

### Flow 3: Memory Tab - Explore Portfolio

```
┌─────────────────────┐
│ Memory Tab          │
│ Portfolio Timeline  │
│ ┌───┬───┬───┬───┐  │
│ │img│img│img│img│  │
│ ├───┼───┼───┼───┤  │
│ │img│img│img│img│  │
│ └───┴───┴───┴───┘  │
└──────────┬──────────┘
           │ User clicks image
           │
┌──────────▼──────────┐
│ Full Critique       │
│ ┌─────────────────┐ │
│ │ [Large image]   │ │
│ │ Scores, Glass   │ │
│ │ Box, etc.       │ │
│ └─────────────────┘ │
│ [Close]             │
└──────────┬──────────┘
           │ User closes, scrolls to search
           │
┌──────────▼──────────┐
│ Search              │
│ [Input: "warm       │
│  tones"]            │
│ ○ Visual Similarity │
│ ○ Text Search       │
└──────────┬──────────┘
           │ User selects "Visual Similarity", submits
           │
┌──────────▼──────────┐
│ Search Results      │
│ ┌───┬───┬───┐      │
│ │img│img│img│      │  (Vector search hits)
│ └───┴───┴───┘      │
│ "8 matches"         │
└─────────────────────┘
```

---

## Component Hierarchy

### Top-Level App Structure

```
<App>
  ├─ <Header>
  │   ├─ <Logo>
  │   ├─ <Navigation>  (Studio | Practice | Memory | Field)
  │   └─ <ModeToggle>  (Hobbyist ⇄ Working Pro)
  │
  ├─ <MainContent>
  │   ├─ <StudioMode>       (if active tab)
  │   ├─ <PracticeTab>      (if active tab)
  │   ├─ <MemoryTab>        (if active tab)
  │   └─ <FieldMode>        (if active tab)
  │
  └─ <Footer> (optional, minimal)
</App>
```

### StudioMode Component Tree

```
<StudioMode>
  ├─ <PhotoUploader>
  │   ├─ <DropZone>         (drag-drop area)
  │   └─ <FileInput>        (file picker button)
  │
  ├─ <UploadProgress>       (if uploading)
  │   └─ <Spinner>
  │
  └─ <AnalysisResults>      (after analysis completes)
      ├─ <ImageCarousel>    (if multiple images)
      ├─ <ScoreDisplay>     (5-axis scores)
      │   ├─ <ScoreBar composition>
      │   ├─ <ScoreBar lighting>
      │   ├─ <ScoreBar technique>
      │   ├─ <ScoreBar creativity>
      │   └─ <ScoreBar subject_impact>
      │
      ├─ <GlassBox>
      │   ├─ <ObservationsList>
      │   ├─ <ReasoningSteps>
      │   └─ <PriorityFixes>
      │
      ├─ <SpatialOverlay>   (click to open)
      │   ├─ <ImageWithAnnotations>
      │   └─ <AnnotationTooltip>
      │
      └─ <ExportButton>     (download XMP)
</StudioMode>
```

### PracticeTab Component Tree

```
<PracticeTab>
  ├─ <ActiveAssignment>     (if exists)
  │   ├─ <AssignmentBrief>
  │   ├─ <Rationale>
  │   ├─ <BaselineShoot>    (thumbnail grid)
  │   └─ <ISARProgress>     (if in progress or completed)
  │       ├─ <BaselineVsCurrent>  (side-by-side comparison)
  │       └─ <ISARDelta>
  │
  └─ <CompletedAssignments> (list)
      └─ <AssignmentCard> (repeating)
          ├─ <Brief>
          ├─ <ISARDelta>
          └─ <Timestamp>
</PracticeTab>
```

### MemoryTab Component Tree

```
<MemoryTab>
  ├─ <PortfolioTimeline>
  │   └─ <ImageGrid>
  │       └─ <ImageCard> (repeating)
  │           ├─ <Thumbnail>
  │           └─ <Timestamp>
  │
  ├─ <AestheticProfile>
  │   ├─ <DominantTones>        (color chips)
  │   ├─ <PreferredLighting>    (bar chart or tags)
  │   ├─ <SubjectPatterns>      (tag cloud)
  │   ├─ <ConsistencyScore>     (gauge, percentage)
  │   └─ <ComputedTimestamp>    ("As of [date], from [N] images")
  │
  └─ <Search>
      ├─ <SearchInput>
      ├─ <SearchTypeToggle>     (Visual Similarity | Text Search)
      └─ <SearchResults>
          └─ <ImageGrid>        (results)
</MemoryTab>
```

---

## Visual Design System

### Color Palette

**Primary (Trust, Clarity)**:
- Blue 600: `#2563eb` (buttons, links, active states)
- Blue 100: `#dbeafe` (backgrounds, hover states)

**Secondary (Warmth, Encouragement)**:
- Amber 500: `#f59e0b` (highlights, positive feedback)
- Amber 100: `#fef3c7` (subtle accents)

**Neutral (Readability)**:
- Gray 900: `#111827` (text)
- Gray 600: `#4b5563` (secondary text)
- Gray 200: `#e5e7eb` (borders, dividers)
- White: `#ffffff` (backgrounds)

**Semantic (Feedback)**:
- Success Green: `#10b981` (completed assignments, positive delta)
- Warning Orange: `#f97316` (moderate issues)
- Error Red: `#ef4444` (critical fixes, negative delta)

### Typography

**Font Stack**:
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Scale**:
- H1 (Page Title): 32px, 700 weight
- H2 (Section): 24px, 600 weight
- H3 (Subsection): 18px, 600 weight
- Body: 16px, 400 weight
- Small: 14px, 400 weight
- Caption: 12px, 400 weight

### Spacing

**8px Base Grid**:
- XS: 4px
- SM: 8px
- MD: 16px
- LG: 24px
- XL: 32px
- 2XL: 48px

### Components

#### Button

```
Primary:
  bg: Blue 600
  text: White
  hover: Blue 700
  padding: 12px 24px
  border-radius: 8px

Secondary:
  bg: Gray 200
  text: Gray 900
  hover: Gray 300
  padding: 12px 24px
  border-radius: 8px
```

#### Card

```
bg: White
border: 1px solid Gray 200
border-radius: 12px
padding: 24px
shadow: 0 1px 3px rgba(0,0,0,0.1)
```

#### Score Bar

```
Container:
  bg: Gray 200
  height: 8px
  border-radius: 4px

Fill (based on score):
  0-4: Error Red
  5-7: Warning Orange
  8-10: Success Green
```

#### Spatial Overlay

```
Base Image: Full viewport
Annotations:
  - Bounding box: 2px solid (Red/Orange/Green by severity)
  - Tooltip: White card, shadow, arrow pointing to box
  - Tooltip text: 14px, Gray 900
```

---

## Key Screens

### Studio Mode (Default Landing)

**Layout**:
```
┌─────────────────────────────────────────┐
│ Header: Logo | Studio Practice Memory  │
│                            Field  [Mode]│
├─────────────────────────────────────────┤
│                                         │
│          ┌─────────────────┐            │
│          │                 │            │
│          │  Drag & Drop    │            │
│          │  Photos Here    │            │
│          │                 │            │
│          │  or [Browse]    │            │
│          └─────────────────┘            │
│                                         │
│  "Upload photos to receive detailed    │
│   critique and personalized practice   │
│   assignments."                        │
│                                         │
└─────────────────────────────────────────┘
```

**After Upload (Analysis Complete)**:
```
┌─────────────────────────────────────────┐
│ Header                                  │
├─────────────────────────────────────────┤
│ ┌──────────────┐  Scores:              │
│ │              │  Composition     ████░ 7│
│ │  [Image]     │  Lighting        █████ 8│
│ │              │  Technique       ███░░ 6│
│ │              │  Creativity      ████░ 9│
│ └──────────────┘  Subject Impact ████░ 7│
│                                         │
│ Glass Box Reasoning (expandable):      │
│ ▼ Observations:                         │
│   • Good use of rule of thirds         │
│   • Natural light well-balanced        │
│                                         │
│ ▼ Reasoning:                            │
│   [Detailed explanation...]            │
│                                         │
│ [View Spatial Overlay] [Export XMP]    │
└─────────────────────────────────────────┘
```

### Practice Tab

```
┌─────────────────────────────────────────┐
│ Header                                  │
├─────────────────────────────────────────┤
│ Active Assignment:                      │
│ ┌─────────────────────────────────────┐ │
│ │ "Use rule of thirds deliberately"  │ │
│ │                                     │ │
│ │ Rationale: "I noticed you often    │ │
│ │ center your subjects. Exploring    │ │
│ │ the rule of thirds will add        │ │
│ │ visual interest..."                │ │
│ │                                     │ │
│ │ Baseline Shoot (May 10):           │ │
│ │ [thumb][thumb][thumb]... (2/15)    │ │
│ │                                     │ │
│ │ Current Progress:                  │ │
│ │ ┌──────────┬──────────┐            │ │
│ │ │ Baseline │ Current  │            │ │
│ │ │  [img]   │  [img]   │            │ │
│ │ │   13%    │   67%    │            │ │
│ │ └──────────┴──────────┘            │ │
│ │ ISAR Delta: +54pp                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Completed Assignments:                 │
│ ┌─────────────────────────────────────┐ │
│ │ ✓ "Experiment with side lighting"  │ │
│ │   ISAR Delta: +40pp                │ │
│ │   Completed: April 28              │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Memory Tab

```
┌─────────────────────────────────────────┐
│ Header                                  │
├─────────────────────────────────────────┤
│ Portfolio Timeline:                     │
│ ┌───┬───┬───┬───┬───┬───┐              │
│ │img│img│img│img│img│img│              │
│ ├───┼───┼───┼───┼───┼───┤              │
│ │img│img│img│img│img│img│              │
│ └───┴───┴───┴───┴───┴───┘              │
│ (30 images total)                       │
│                                         │
│ Aesthetic Profile:                      │
│ ┌─────────────────────────────────────┐ │
│ │ Dominant Tones:                     │ │
│ │ [warm][neutral][cool]               │ │
│ │                                     │ │
│ │ Preferred Lighting:                 │ │
│ │ Natural (67%) | Studio (33%)        │ │
│ │                                     │ │
│ │ Subject Patterns:                   │ │
│ │ portraits (60%) | landscapes (30%)  │ │
│ │                                     │ │
│ │ Stylistic Consistency: 78%          │ │
│ │ [gauge showing 78/100]              │ │
│ │                                     │ │
│ │ As of May 24, 2026 | 30 images      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Search:                                 │
│ [Input: "warm tones"       ]  [Search] │
│ ○ Visual Similarity  ○ Text Search     │
└─────────────────────────────────────────┘
```

---

## Interaction Patterns

### Upload Interaction

**Drag & Drop**:
- Hover state: Dashed border animates, background lightens
- Drop: Immediate upload start, progress bar appears
- Multi-file: Queue shown, processes one at a time

**File Picker**:
- Click "Browse" → native file dialog
- Accept: `.jpg`, `.jpeg`, `.png`, `.heic`
- Max size: 20 MB per image

### Loading States

**Upload Progress**:
```
Analyzing image 1 of 3...
[████████░░░░░░░░░░░░] 40%
```

**Analysis In Progress** (after upload):
```
┌─────────────────────┐
│ [Spinner animation] │
│                     │
│ Analyzing your      │
│ photo...            │
│                     │
│ This may take       │
│ 5-15 seconds.       │
└─────────────────────┘
```

### Error States

**Upload Failed**:
```
┌─────────────────────┐
│ ⚠️  Upload Failed    │
│                     │
│ Could not upload    │
│ IMG_001.jpg         │
│                     │
│ [Try Again]         │
└─────────────────────┘
```

**Analysis Failed**:
```
┌─────────────────────┐
│ ⚠️  Analysis Failed  │
│                     │
│ We couldn't analyze │
│ this image. Try     │
│ uploading a         │
│ different format.   │
│                     │
│ [Upload Another]    │
└─────────────────────┘
```

### Expandable Sections

**Glass Box Reasoning**:
- Collapsed: "▶ Observations (3)" → Click to expand
- Expanded: "▼ Observations (3)" → List visible, click to collapse

### Modal Overlays

**Spatial Overlay** (full-screen modal):
- Background: Semi-transparent black (overlay)
- Content: Image with bounding boxes + tooltips
- Close: X button (top-right) or ESC key

**Full Critique** (Memory tab, click image):
- Modal card with image + full Glass Box + scores
- Close: X button or click outside modal

---

## Responsive Design

### Breakpoints

- **Desktop**: ≥1024px (primary demo target)
- **Tablet**: 768px - 1023px (not prioritized for hackathon)
- **Mobile**: <768px (not prioritized for desktop demo; Field Mode uses iPhone native)

### Desktop Layout (Primary)

- Max content width: 1200px (centered)
- Sidebar navigation (left) or top tab bar
- Two-column layout for Studio Mode (image left, scores/Glass Box right)

### Field Mode (iPhone)

- Full-screen camera preview
- Minimal UI (capture button, voice coaching indicator)
- Optimized for iOS Safari (PWA install)

---

## Accessibility

### Hackathon Scope (Minimal)

**Implemented**:
- Semantic HTML (`<main>`, `<nav>`, `<article>`, etc.)
- Alt text for all images
- Keyboard navigation (tab order, focus states)
- Color contrast ≥4.5:1 (WCAG AA)

**Not Prioritized** (Post-Hackathon):
- Screen reader optimization
- ARIA labels (beyond basics)
- High contrast mode
- Font size preferences

---

## Appendix: Component Style Specifications

### ScoreBar Component

```tsx
<ScoreBar
  label="Composition"
  score={7}
  maxScore={10}
/>
```

**Visual**:
```
Composition          ████████░░  7/10
```

**Colors**:
- 0-4: Error Red (`#ef4444`)
- 5-7: Warning Orange (`#f97316`)
- 8-10: Success Green (`#10b981`)

### GlassBox Component

```tsx
<GlassBox
  observations={[...]}
  reasoning_steps={[...]}
  priority_fixes={[...]}
/>
```

**Visual**:
```
┌─────────────────────────────────┐
│ ▼ Observations (3)              │
│   • Good use of rule of thirds  │
│   • Natural light well-balanced │
│   • Subject expression authentic│
│                                 │
│ ▶ Reasoning Steps (5)           │
│ ▶ Priority Fixes (1 critical)   │
└─────────────────────────────────┘
```

**Interactions**:
- Click section header to expand/collapse
- Expanded sections show nested content with indentation

---

**End of UI/UX Design Document**
