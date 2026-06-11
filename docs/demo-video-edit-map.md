# Iris — Demo Video Edit Map (FINAL)

> Authoritative cut + VO plan. Supersedes all earlier drafts.
> Hard cap **3:00**. Picture-lock first (silent), then one VO pass.
> Quote only on-screen numbers: **composition 7.5 · overall 6.5**. Never the reflection delta.

---

## Target timeline (3:00)

| Time | Beat | Source | VO |
|------|------|--------|----|
| 0:00–0:06 | **Hook** — grass + **"Find a strong subject"** tip (motion, not a screenshot) | raw 227–233s | "Every AI critique forgets you the moment it answers. Iris remembers every frame — and coaches you in the field." |
| 0:06–0:12 | **App open → iOS Home** dashboard | iOS screen-record (fresh: tap Iris → Home) | "Open Iris and it already knows your work." |
| 0:12–0:20 | **Practice tab** — active brief "Golden-hour composition — fill the frame with one strong subject" | clip `01-practice-assignment.mp4` (trim to 8s) | "Today's assignment targets my weakest skill — composition." |
| 0:20–0:51 | **Live coaching arc** — grass "Find a strong subject" → pan → "Fill frame with tree" → **green "Ready to capture / Good frame, shoot now"** (held 2–3s) → Shutter | two segments: raw 227–235s + raw 279–302s (joined) | "It watches the frame and reacts — find a strong subject… fill the frame… now it's a good frame." (real coach TTS ducked under) |
| 0:51–1:01 | **Analyzing** — "Coach compares this frame to your portfolio history" | raw 295–305s | "It compares this frame to my whole library." |
| 1:01–1:30 | **Critique / Glass Box** — 6.5 overall, Composition **7.5**, radar, Glass Box numbered observations | clip `03-critique-glassbox-complete.mp4` (trim to 29s) | "Composition 7.5 — the skill I trained. Overall 6.5, and Iris says exactly why: the backlit tree lost detail. That's my next assignment." |
| 1:30–1:55 | **WEB — memory + vector** Home trend → My Work → tree card → "Similar in your library" (oak) | web screen-record (silent) | "Same account on the web — my progress, remembered. Atlas vector search ties tonight's frame to my oak." |
| 1:55–2:20 | **WEB — HITL finale** Settings → hobbyist → Working pro → Print Sales drafts → approve one | web screen-record (pre-run scan) | "Switch to working pro and new agents unlock — but nothing publishes without my approval." |
| 2:20–2:50 | **Architecture + runtime proof** — `arch-slide-9agents.png` → Live Stack Flags `/health` proof | stills | "Gemini 3.1 Pro for reasoning, Agent Builder for grounded principles, MongoDB via MCP for memory — shown live, not just a diagram." |
| 2:50–3:00 | **End card** — Iris mark + URL | end card | "Iris remembers every frame — and you stay in control. iris-photo-mentor.web.app" |

---

## Coaching arc — raw timecodes (verified from frame inspection)

| Raw second | Frame | Content |
|-----------|-------|---------|
| 227 | `t0227.jpg` | Grass scene, **"Find a strong subject"** tip (1.8×) |
| 242 | `t0242.jpg` | Tree framed wide, "Coach looking…" |
| 272 | `t0272.jpg` | Tree tighter, **"Fill frame with tree"** (5.0×) |
| 292 | `fine_292.jpg` | **GREEN "Ready to capture · Good frame, shoot now!"** |
| 295 | `fine_295.jpg` | "Analyzing your shot…" |

**Stitch strategy:** two segments joined with a straight cut (no dissolve — pacing):  
- Seg A: raw **227–235s** (8s) — grass + "Find a strong subject"  
- Seg B: raw **279–303s** (24s) — pan to tree + "Fill frame with tree" + green + shutter + analyze start  
Total: **32s** for the coaching beat (0:20–0:51 in final cut).

---

## Part 1 pre-built segments

Run `bash scripts/stitch-demo-part1.sh` to regenerate.

| File | Duration | Contents |
|------|----------|----------|
| `docs/demo-video-output/iris-demo-part1-ios-and-architecture.mp4` | ~1:45 | Full iOS draft (hook + Practice + coaching arc + critique + architecture + end card) |
| `docs/demo-video-output/iris-demo-ios-only.mp4` | ~1:22 | iOS beats only (hook through critique) |
| `docs/demo-video-output/iris-demo-architecture-outro.mp4` | ~0:28 | Architecture + end card |

Final assembly: **ios-only → web B-roll (~55s) → architecture-outro**

---

## Accuracy checklist (verify before export)

- [ ] No "Gemini Live" anywhere — use "Gemini 3.1 Pro" / "Gemini"
- [ ] Architecture shows **9 agents** (correct in `arch-slide-9agents.png`)
- [ ] Model strings: `gemini-3.1-pro-preview` (field cues = `gemini-2.5-flash`)
- [ ] VO numbers match on-screen: composition **7.5**, overall **6.5**
- [ ] "Similar in your library" renders the oak before recording web beat
- [ ] Print Sales drafts pre-run before web screen-record

---

## Voiceover workflow

1. Picture-lock the full silent cut (iOS + silent web + slides).
2. VO lines above are the draft — ~450–500 words at a calm pace for 3:00.
3. One clean pass in a quiet room; re-read bad lines without re-touching footage.
4. Keep iPhone **Field Coach TTS** as diegetic audio, ducked under the VO.

---

## Key assets

| Asset | Location |
|-------|----------|
| Architecture slide (9 agents, correct labels) | `docs/demo-video-output/arch-slide-9agents.png` |
| Runtime proof slide | `docs/devpost-public/proof-04-stack-health.png` |
| Hook frame reference | `docs/demo-video-frames/t0227.jpg` |
| Green ready frame reference | `docs/demo-video-frames/fine_292.jpg` |
| Analyzing frame reference | `docs/demo-video-frames/fine_295.jpg` |
| Pre-cut clips | `docs/demo-video-clips/01,02,03` |

---

## iOS keep vs cut (reference)

| Raw sec | Content | Verdict |
|---------|---------|---------|
| 0–28 | Lock screen | Cut |
| 28–42 | Practice tab | KEEP — clip 01 |
| 42–227 | Dead air, field trials, wrong subjects | Cut |
| **227–235** | Grass + "Find a strong subject" | **KEEP — hook / coaching seg A** |
| 235–279 | More field trials | Cut (or dissolve) |
| **279–303** | Tree + "Fill frame with tree" → green → shutter → analyze | **KEEP — coaching seg B** |
| 303–338 | Analyze wait | Trim — 10s only |
| **338–380** | Critique 7.5, Glass Box, Mark complete | **KEEP — clip 03** |
| 380–397 | Completion transition | Trim |
| 397–408 | Reflection −0.35 (buggy) | **Cut — never use** |

---

## Before recording web B-roll

1. `python3 scripts/seed-library-stock.py` — golden-hour stock entries on real account
2. Sign in with the same Google account as iPhone
3. Verify Home trend: 5.6 → 6.3 → 5.8 → 6.7 → tree 7.5 (believable dip)
4. **Pre-run Print Sales scan** (Settings → Working pro → Print Sales → scan) so drafts exist before take
5. Switch back to **hobbyist** before recording — the switch is an on-camera beat
6. Record silent 1080p+, normal speed

On-camera rules:
- Click into **real tree only** in My Work (stock entries = thumbnails, never open)
- Mentor: 1–2s hover showing "Organize · 1" badge — do not enter chat
- Never voice a number not visible on screen
