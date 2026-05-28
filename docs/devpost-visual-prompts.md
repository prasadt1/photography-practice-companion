# Iris — Devpost visual & diagram prompts

**Project:** Iris — AI Photography Mentor  
**Use with:** ChatGPT (Images), Gemini (Imagen), or any image model  
**Repo diagrams (precision):** `docs/diagrams/*.mmd` → export PNG at [mermaid.live](https://mermaid.live) when labels must be exact  

**How to use:** Copy one prompt block below **in full** (including the `---` lines if your tool ignores them). Do not merge sections manually. Regenerate or edit in Figma if text is wrong — verify labels against the [Fact checklist](#fact-checklist-after-generation) at the end.

---

## Table of contents

1. [Hero banner (16:9)](#1-hero-banner-169)
2. [Hero variant — memory / growth (16:9)](#2-hero-variant--memory--growth-169)
3. [Square thumbnail / app tile (1:1)](#3-square-thumbnail--app-tile-11)
4. [System architecture diagram (16:9)](#4-system-architecture-diagram-169)
5. [Agentic landscape — ADK orchestrator (16:9)](#5-agentic-landscape--adk-orchestrator-169)
6. [Agentic landscape — simplified 5-node (16:9)](#6-agentic-landscape--simplified-5-node-169)
7. [MongoDB persistent memory capabilities (16:9)](#7-mongodb-persistent-memory-capabilities-169)
8. [User journey — hobbyist (16:9)](#8-user-journey--hobbyist-169)
9. [User journey — working professional (16:9)](#9-user-journey--working-professional-169)
10. [Glass Box critique pipeline / data flow (16:9)](#10-glass-box-critique-pipeline--data-flow-169)
11. [Persona split — three modes (16:9)](#11-persona-split--three-modes-169)
12. [Web + iOS — one portfolio (16:9)](#12-web--ios--one-portfolio-169)
13. [Glass Box concept explainer (4:3)](#13-glass-box-concept-explainer-43)
14. [Polish pass — existing diagram PNG](#14-polish-pass--existing-diagram-png)
15. [Devpost asset checklist](#devpost-asset-checklist)
16. [Fact checklist after generation](#fact-checklist-after-generation)

---

## 1. Hero banner (16:9)

```
Create a wide 16:9 hero illustration for the hackathon project "Iris — AI Photography Mentor".

Brand and mood: dark warm charcoal background #1a1816, amber/gold accents #f59e0b and #fbbf24, cream text tones #e7e5e4, editorial photography-gallery aesthetic like a photo magazine — thoughtful, warm, mentor-not-machine. No generic purple AI SaaS gradients, no "AI powered" badges, no cartoon robots, no robot hands.

Scene: a photographer holds a smartphone showing a camera viewfinder with a subtle rule-of-thirds grid. Beside the phone, a semi-transparent critique card shows horizontal score bars and short coaching lines about composition and lighting (Glass Box feedback) — not a wall of chat bubbles. Background: soft golden-hour landscape bokeh.

Composition: leave clean negative space on the left third for a title overlay reading "Iris". Photorealistic with subtle UI overlay. Resolution mindset 1920×1080, high detail, cinematic lighting.
```

---

## 2. Hero variant — memory / growth (16:9)

```
Create a wide 16:9 hero illustration for "Iris — AI Photography Mentor" emphasizing persistent memory and skill growth over time.

Brand and mood: dark warm charcoal background #1a1816, amber/gold rim light #f59e0b and #fbbf24, cream highlights #e7e5e4, editorial photography-gallery aesthetic — thoughtful, warm, not generic purple AI art.

Visual metaphor: a contact sheet or film strip of photos transitions into a glowing connection thread in MongoDB green #47A248 that links to a subtle upward trend line suggesting improvement. Silhouette or partial figure of a photographer in amber rim light. No readable lorem ipsum — use blurred lines for any text. No robots, no purple gradients.

Composition: space on the left for title "Iris" and subtitle "remembers every frame". 1920×1080, cinematic, high detail.
```

---

## 3. Square thumbnail / app tile (1:1)

```
Create a square 1:1 app listing image for "Iris — AI Photography Mentor".

Brand: charcoal background #1a1816, amber/gold accent #f59e0b, minimal editorial style — not purple gradients, not generic AI clipart.

Subject: a minimal symbol merging an iris flower suggestion with a camera aperture / lens ring, App Store quality, subtle 3D depth or soft bevel, centered, no words, no watermark.

Output: 1024×1024 mindset, clean icon suitable for Devpost thumbnail and social tile.
```

---

## 4. System architecture diagram (16:9)

```
Create a landscape 16:9 technical architecture infographic titled "Iris — System Architecture".

Visual style: professional solution diagram on dark warm charcoal #1a1816, amber #f59e0b connection lines, cream #e7e5e4 labels, high-contrast readable sans-serif text (12pt equivalent or larger), not cartoon, not purple AI aesthetic.

Layout top to bottom:

TOP ROW — label "Clients":
- Box: "React Web App (Vite, Firebase Hosting)"
- Box: "iOS App (SwiftUI, AVFoundation)"

MIDDLE — label "API":
- Box: "FastAPI on Google Cloud Run"

AGENT LAYER — label "Google ADK (9 LlmAgents)":
- Central hub: "Orchestrator"
- Spokes to: "Coach", "Mentor", "Planner", "Reflection", "Field Coach", "Triage", "Print Sales", "Visual Describer"

RIGHT SIDE — label "AI Services":
- "Gemini 3.1 Pro (Vertex AI)"
- "Agent Builder Data Store (photography principles)"

BOTTOM — label "Data":
- Large emphasis: "MongoDB Atlas" with green accent #47A248
- "Google Cloud Storage (image files, URLs in MongoDB)"

AUTH — left side:
- "Firebase Authentication" arrows to Web, iOS, and API

Arrows: Clients → FastAPI → Orchestrator → sub-agents → Gemini; Coach also connects to MongoDB Atlas and GCS; small callout "Orchestrator reads via MongoDB MCP; agents write via PyMongo".

Hackathon submission quality, all labels spelled exactly as above.
```

---

## 5. Agentic landscape — ADK orchestrator (16:9)

```
Create a landscape 16:9 infographic titled "Agentic Landscape — Iris on Google ADK".

Visual style: dark charcoal #1a1816 background, amber #f59e0b hub and connectors, cream text, MongoDB green #47A248 only for memory-related notes, Google blue #4285F4 subtle for GCP — no purple gradients, no fantasy characters, readable labels.

Center: large node "Orchestrator (ADK LlmAgent)" with subtitle "persona-filtered tool routing".

Incoming arrows labeled:
- "POST /api/v1/agent/chat (Mentor)"
- "tool calls from orchestrator"

Outgoing nodes in a ring (rounded rectangles):
- "Coach — Glass Box critique, analyze-photo pipeline"
- "Mentor — portfolio-aware chat"
- "Planner — propose practice assignments"
- "Reflection — post-assignment learning"
- "Field Coach — live capture coaching (roadmap)"
- "Triage — batch labeling (working pro only)"
- "Print Sales — Etsy-style drafts (working pro only, HITL)"
- "Visual Describer — scene narration (vision impairment)"

Below the ring: "Gemini 3.1 Pro (Vertex AI)" and "Agent Builder Data Store — photography principles".

Side callout box with border: "Human-in-the-loop: pending_approvals before portfolio tags and print listings go live".

Footer: "Google Cloud Rapid Agent Hackathon — Iris".

All agent names spelled exactly as listed.
```

---

## 6. Agentic landscape — simplified 5-node (16:9)

```
Create a simplified landscape 16:9 infographic for Devpost thumbnail use, titled "Iris Agents".

Visual style: dark charcoal #1a1816, amber #f59e0b hubs, cream labels, minimal clutter, no purple AI aesthetic, no characters.

Center: "Orchestrator (Google ADK)".

Four spokes only:
- "Coach — photo critique"
- "Mentor — remembers your portfolio"
- "Planner — practice assignments"
- "Field Coach — camera coaching (roadmap)"

Below center: "Gemini 3.1 Pro" and small "MongoDB Atlas memory".

Large readable text, 5 nodes total including Orchestrator, suitable for small preview size.
```

---

## 7. MongoDB persistent memory capabilities (16:9)

```
Create a landscape 16:9 infographic titled "Persistent Memory — MongoDB Atlas" for the Iris AI photography mentor.

Visual style: dark warm charcoal #1a1816, MongoDB green #47A248 accents on database elements, amber #f59e0b for highlights, cream text, clean editorial infographic — not cartoon, not purple gradients. Leave empty space top-right for optional MongoDB Atlas logo placement.

Center: database cylinder labeled "MongoDB Atlas".

Six connected capability cards (exact labels):
1. "portfolio_entries — critiques, scores, Glass Box text, GCS image URLs"
2. "assignments — practice briefs, active/completed, linked shoots"
3. "aesthetic_profile — strengths, weaknesses, focus skills"
4. "users — persona: hobbyist | working_pro | vision_impairment"
5. "conversations — mentor session context"
6. "pending_approvals — HITL for tags and print listings"

Bottom row as pills or badges:
"Atlas Vector Search" | "Atlas Search (full-text)" | "Change Streams → profile updates" | "MCP reads (Orchestrator)" | "PyMongo writes (agents)"

Tagline footer: "One database — portfolio, practice, and mentor context".

Sponsor-friendly, hackathon submission quality.
```

---

## 8. User journey — hobbyist (16:9)

```
Create a landscape 16:9 horizontal user journey diagram titled "Hobbyist Journey — Iris".

Visual style: dark charcoal #1a1816, amber numbered step circles #f59e0b, cream text, small camera icons, editorial clean layout — no purple gradients, no robots.

Five steps left to right:

Step 1 — "Onboard": Choose Hobbyist persona.
Step 2 — "Upload": Home or Studio — any photo.
Step 3 — "Glass Box": Coach + Gemini scores with transparent reasoning.
Step 4 — "Practice": Accept AI assignment → shoot → analyze linked to assignment.
Step 5 — "Growth": Portfolio trends, focus areas, Mentor remembers history.

Footer text: "Memory makes meaning — Iris remembers every frame."

Maximum 5 words visible per step title; short subtitle under each if needed. 1920×1080 mindset.
```

---

## 9. User journey — working professional (16:9)

```
Create a landscape 16:9 horizontal user journey diagram titled "Working Pro Journey — Iris".

Visual style: dark charcoal #1a1816, amber accents #f59e0b, cream text, professional business tone — no purple AI aesthetic, no cartoon characters.

Six steps left to right:

Step 1 — "Upload": Client work → Glass Box critique.
Step 2 — "Triage": AI groups similar photos, proposes labels.
Step 3 — "Approve labels": Human-in-the-loop (HITL) confirmation.
Step 4 — "Print Sales": AI drafts Etsy-style listings.
Step 5 — "Approve listings": HITL before anything goes live.
Step 6 — "Organize": Filter portfolio by user tags (portfolio picks, client work).

Steps 3 and 5: small shield or checkmark icon with label "HITL".

Footer: "Same memory as hobbyist — plus pro workflow tools."

Readable at Devpost article width.
```

---

## 10. Glass Box critique pipeline / data flow (16:9)

```
Create a landscape 16:9 sequence-style technical flow diagram titled "Critique Pipeline — POST /api/v1/analyze-photo".

Visual style: dark charcoal #1a1816, amber arrows #f59e0b, cream node labels, professional systems diagram — not cartoon.

Left-to-right numbered steps:

1. User
2. React UI (Web) or iOS
3. FastAPI on Cloud Run
4. Google Cloud Storage — upload image, signed URL
5. Coach Agent (pipeline)
6. Branch down: "Agent Builder Data Store — photography principles grounding"
7. Gemini 3.1 Pro — multimodal analysis
8. MongoDB Atlas — read portfolio history, write portfolio_entry
9. Return Glass Box result to UI — scores + reasoning

Title at top: "Glass Box — show, then tell". Subtitle: "Images in GCS; metadata and memory in MongoDB."

All component names spelled exactly as above. High contrast readable text.
```

---

## 11. Persona split — three modes (16:9)

```
Create a landscape 16:9 three-column infographic titled "One Mentor — Three Personas" for Iris.

Visual style: dark charcoal #1a1816, amber column headers #f59e0b, cream body text, respectful inclusive imagery (no stereotypes), no purple gradients.

Column 1 header "Hobbyist":
- Glass Box critique
- Practice assignments
- Progress trends
- Mentor chat

Column 2 header "Working Pro":
- Everything in Hobbyist
- Triage labeling
- Print Sales drafts
- HITL approvals

Column 3 header "Vision impairment (roadmap)":
- Voice-first Field
- Haptic guidance
- Visual Describer agent
- Audio Glass Box summaries

Shared footer bar across all columns: "Same MongoDB portfolio · Same Gemini · Persona-filtered agent tools".

Editorial layout, hackathon quality.
```

---

## 12. Web + iOS — one portfolio (16:9)

```
Create a landscape 16:9 illustration showing Iris on web and mobile as one product.

Visual style: dark charcoal #1a1816, amber accents #f59e0b, subtle Google Cloud blue #4285F4 for a small cloud icon near API label — no purple gradients, no robots.

Left: laptop browser mockup with dark gallery UI — photo grid and warm borders (UI text blurred, not readable).

Right: iPhone mockup with camera viewfinder, rule-of-thirds grid, amber shutter button (UI text blurred).

Center: curved connector labeled "One API · One portfolio · Firebase identity" pointing to a small "Cloud Run + MongoDB Atlas" badge.

Do not invent fake readable UI copy — use blurred placeholder blocks. Photorealistic devices, soft shadow. 1920×1080 mindset.

Note for post-production: replace blurred screens with real screenshots from practice-companion-hackathon.web.app and iOS app.
```

---

## 13. Glass Box concept explainer (4:3)

```
Create a 4:3 educational diagram explaining "Glass Box" photography critique for Iris.

Visual style: dark charcoal #1a1816, amber #f59e0b accents, cream text, museum placard meets modern app UI — not purple AI aesthetic.

Left half: a strong landscape photograph with overlay callouts — leading lines, exposure zones (simple arrows and labels).

Right half: critique panel with:
- Score bars labeled Composition, Lighting, Technique
- Section "Why" with 3 bullet lines referencing real photography concepts (rule of thirds, Rembrandt lighting, etc.) — not generic AI jargon

Title: "Show, then tell — transparent mentoring". Subtitle: "Iris · AI Photography Mentor".

Readable when embedded in Devpost article body. No lorem ipsum paragraphs.
```

---

## 14. Polish pass — existing diagram PNG

Use when you already exported a Mermaid diagram and want a visual upgrade without changing topology.

```
I am attaching an architecture diagram PNG for the project "Iris — AI Photography Mentor".

Task: visually polish this diagram only. Keep every box, arrow, and label text identical — do not add, remove, or rename components. Do not invent new services.

Apply brand: background #1a1816, amber #f59e0b lines and highlights, cream #e7e5e4 text, MongoDB green #47A248 only on MongoDB Atlas element, subtle Google blue on GCP elements.

Improve: spacing, alignment, font readability, subtle shadows, hackathon submission polish. Output landscape 16:9, high resolution.

If any label is illegible, sharpen it while preserving exact wording.
```

*(Attach your PNG when sending this prompt.)*

---

## Devpost asset checklist

| Asset | Prompt # | Also capture from real app? |
|-------|----------|-----------------------------|
| Cover / hero | 1 or 2 | Optional overlay of real UI |
| Listing thumbnail | 3 | Overlay `frontend/public/iris-icon-512.png` if desired |
| Architecture | 4 | Or export `docs/diagrams/architecture.mmd` |
| Agentic landscape | 5 or 6 | Verify against `/health` feature flags |
| MongoDB story | 7 | Sponsor section |
| Hobbyist journey | 8 | Pair with web screenshots |
| Working pro journey | 9 | Pair with Triage / Print UI shots |
| Data flow | 10 | Or export `docs/diagrams/data-flow.mmd` |
| Personas | 11 | Onboarding screenshot |
| Web + iOS | 12 | **Must** composite real screenshots |
| Glass Box explainer | 13 | Pair with Studio critique screenshot |
| Gallery (3–5 images) | — | **Real screenshots only** — do not AI-fake UI |

**Live demo URLs for captions:**  
Web: https://practice-companion-hackathon.web.app  
API health: https://practice-companion-api-l6kusl5xcq-uc.a.run.app/health  

---

## Fact checklist after generation

Verify every diagram before publishing:

**Agents (9):** Orchestrator, Coach, Mentor, Planner, Reflection, Field Coach, Triage, Print Sales, Visual Describer  

**MongoDB collections:** portfolio_entries, assignments, users, aesthetic_profile, conversations, pending_approvals  

**GCP / Google:** Cloud Run (FastAPI), Google Cloud Storage, Vertex AI / Gemini 3.1 Pro, Agent Builder Data Store, Firebase Auth, Firebase Hosting  

**Key APIs:** POST /api/v1/analyze-photo (Coach pipeline), POST /api/v1/agent/chat (ADK orchestrator)  

**Personas:** hobbyist, working_pro, vision_impairment (roadmap)  

**Brand colors:** canvas #1a1816, brand #f59e0b / #fbbf24, MongoDB #47A248  

---

*Last updated: May 27, 2026 — align with README and `docs/diagrams/` in photography-practice-companion.*
