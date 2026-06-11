# Web B-roll edit map (~59s) — v3 single take with audio

**Output:** `docs/demo-video-output/iris-demo-web-broll.mp4`  
**Source:** `web-raw-3.mov` — Screen Recording 2026-06-11 at 1.56.36 AM (2:41)  
**Rebuild:** `bash scripts/stitch-web-demo.sh`

| # | Beat | Duration | In-point | What judges see |
|---|------|----------|----------|-----------------|
| 1 | Home hero | 3s | 0:00 | Camper van 8.6 hero |
| 2 | Smooth scroll | 7s | 0:06 | Hero → at-a-glance (trend +1.5) → contact sheet *(continuous scroll)* |
| 3 | Contact → growth | 3s | 0:22 | Contact scroll down toward growth comparison |
| 4 | Ask mentor CTA | 9s | 0:37 | Growth then/now → cursor on **Ask mentor →** → click → mentor landing |
| 5 | Mentor question | 6s | 0:47 | Type golden-hour question → send |
| 6 | Loading | 3s | 0:55 | YOU ASKED + "Reading your library…" |
| 7 | Mentor answer | 5s | 1:15 | Golden-hour bullets (desert camper 8.8) |
| 8 | Listen / TTS | 4s | 1:26 | **Stop** button — audio playing |
| 9 | Mentor bridge | 3s | 1:36 | Post-listen mentor answer; sidebar + Settings visible |
| 10 | Settings → Print | 6s | 2:02 | My Work → Settings → **Working pro** toggle → Print Sales click + load |
| 11 | Print proposals | 3s | 2:13 | Camper $67.90 top draft |
| 12 | Approve + success | 4s | 2:17 | HITL approve → saved banner |
| 13 | My Work listed | 3s | 2:35 | Listed-for-sale filter, camper + glacier |

**Smooth-cut rules applied:**
- Home uses adjacent scroll segments — no jump from hero straight to trend card
- Mentor arc is chronological: growth → CTA click → landing → question → load → answer → listen
- After listen: brief mentor hold (same screen) then Settings → Working pro → Print Sales as one continuous sidebar journey (skips ~20s of My Work browsing in the raw)
- **Organize tab omitted** — not captured as a separate view in this take; badge visible in sidebar throughout
- **Audio preserved** on Listen/TTS segment

**Why Settings (~6s total with Print nav):** Working pro is the unlock for Print Sales drafts — without it, the approve flow looks arbitrary. The toggle + sidebar click to Print Sales costs ~6s but pays for the HITL story. VO can gloss over the My Work detour: *"Switch to working pro — nothing lists without my approval."*

**VO hooks (optional):**
- Seg 1–3: *"Everything Iris sees becomes memory — hero, trend, growth."*
- Seg 4–8: *"Ask the mentor — it answers from your library, out loud."*
- Seg 9–13: *"Working pro unlocks drafts — I approve every listing."*

**Stitch into final:** Insert after iOS critique segment, before architecture slide.
