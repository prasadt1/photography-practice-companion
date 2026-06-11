# Iris — Demo Video Edit Map (FINAL)

> Authoritative cut + VO plan. Supersedes earlier edit-map drafts.
> Hard cap **3:00**. Picture-lock first (silent), then one VO pass over the locked cut.
> Quote only on-screen numbers: **composition 7.5 · overall 6.5**. Never the reflection delta unless the app shows it.

---

## Target timeline (3:00)

| Time | Beat | Source | Audio (VO) |
|------|------|--------|-----------|
| 0:00–0:06 | **Hook (motion, not a website screenshot)** — open on the live app: the "Find a strong subject" tip landing OR the green "Ready to capture" snap | iOS field footage | "Every AI critique forgets you the moment it answers. Iris remembers every frame — and coaches you in the field." |
| 0:06–0:12 | **App open → iOS Home** (NEW — currently missing) | iOS screen-record (capture fresh: tap Iris icon → Home dashboard) | "Open Iris and it already knows your work." |
| 0:12–0:20 | **Practice tab** — active assignment "Golden-hour composition — fill the frame with one strong subject" | clip `01-practice-assignment.mp4` | "Today's assignment targets my weakest skill — composition." |
| 0:20–0:55 | **Live coaching arc (the aha — restore the progression)** generic field → **"Find a strong subject"** → pan to oak → "Coach looking…" → **green "Ready to capture / Good frame, shoot now"** → Shutter | raw recording (best) or `02-tree-coach-to-analyze.mp4` + frames `t0227` (find a strong subject) and `c2_09` (green ready) | "It watches the frame and reacts — find a strong subject… fill the frame… now it's a good frame." (keep real coach TTS ducked under) |
| 0:55–1:05 | **Analyzing** — "Coach compares this frame to your portfolio history" | clip 02 (~19s, c2_19) | "It compares this frame to my whole library." |
| 1:05–1:30 | **Critique / Glass Box** — 6.5 overall, Composition **7.5**, radar, Glass Box tab (numbered observations + reasoning) | clip `03-critique-glassbox-complete.mp4` | "Composition 7.5 — the skill I trained. Overall 6.5, and Iris says exactly why: the backlit tree lost detail. That's my next assignment." |
| 1:30–1:55 | **WEB — memory + vector** Home trend + recent → My Work → tree card → "Similar in your library" (oak) | web screen-record (silent) | "Same account on the web — my progress, remembered. Atlas vector search ties tonight's frame to my oak." |
| 1:55–2:20 | **WEB — HITL finale** switch hobbyist→Working pro (Settings) → Print Sales scan → approve one listing | web screen-record (silent); **pre-run the scan so drafts exist** | "Switch to working pro and new agents unlock — but nothing publishes without my approval." |
| 2:20–2:50 | **Architecture + runtime proof** | `arch-slide-9agents.png` → `Live Stack Flags` /health proof slide | "Gemini 3.1 Pro for reasoning, Agent Builder for grounded principles, MongoDB via MCP for memory — shown live, not just a diagram." |
| 2:50–3:00 | **End card** | end card (add Iris mark) | "Iris remembers every frame — and you stay in control. iris-photo-mentor.web.app" |

*(If web is recorded separately as Part 2, beats 1:30–2:20 are the Part-2 cut; Part 1 = 0:00–1:30 + architecture.)*

---

## Part 1 fixes (apply to `iris-demo-part1-ios-and-architecture.mp4`)

1. **Restore the coaching payoff (highest priority).** The current cut sits on "Coach looking…" and skips the guidance. Re-cut the field segment to show, in order: generic grass + "Frame when ready" (≈2s) → **"Find a strong subject"** (≈3s, frame `t0227`) → pan to oak → **green "Ready to capture / Good frame, shoot now"** held ≈2–3s (frame `c2_09`) → Shutter. Best from the raw recording for real motion; fall back to the extracted frames with a gentle push-in if raw is unavailable.
2. **Replace the architecture diagram** (~1:30–1:45 currently) with **`arch-slide-9agents.png`**. The old pastel Mermaid is dull and inaccurate (showed 6 agents / "Gemini Live"). Keep the **Live Stack Flags** proof slide right after it.
3. **Fix "Gemini Live" on the intro card** → "Gemini 3.1 Pro" (the diagram is already fixed in the new slide).
4. **Replace the static intro** (marketing-website screenshot) with a motion hook from the app (beat 0:00–0:06 above). Don't open an iOS demo on a webpage.
5. **Add the app-open → iOS Home beat** (0:06–0:12) — currently jumps straight to Practice.

## Accuracy checklist (compliance — verify before export)
- [ ] No "Gemini Live" anywhere — use "Gemini 3.1 Pro" / "Gemini".
- [ ] Architecture shows **9** agents (now correct in the slide).
- [ ] Model strings consistent: `gemini-3.1-pro-preview` (field cues = `gemini-2.5-flash`).
- [ ] VO numbers match on-screen: composition **7.5**, overall **6.5**.
- [ ] "Similar in your library" actually renders the oak before recording that beat.

---

## Voiceover workflow
1. Picture-lock the full silent cut (iOS clips + silent web capture + slides).
2. Write VO to the timeline (≈450–500 words for 3:00 at a calm pace; lines above are the draft).
3. One clean VO pass in a quiet room; re-read bad lines without touching footage.
4. Keep the iPhone **Field Coach TTS** as diegetic audio, ducked under the VO.

## iOS device framing (no blurred-background bars)

Frame every vertical iOS clip in a real iPhone bezel instead of a blurred wallpaper fill.
Assets in `docs/demo-video-output/device-frame/` (rendered at 2× = 3840×2160; on a 1080p timeline scale each to fill the frame).

Layer order (bottom → top):
1. `ios-stage-bg.png` — branded backdrop (Iris lockup + tech line). Fills 1920×1080.
2. **Your iOS screen recording** — scale to **≈452×980** (its native ~9:19.5 fits with no crop), centered (center x=960, y=540; or top-left x=734, y=50 in 1080p coords).
3. `iphone-frame.png` — transparent overlay: bezel + side buttons, transparent screen window.

The recording shows only through the bezel window; no blur, no bars. See `frame-preview.png` for the composited look. Re-render the frame/bg from the HTML via `render-two.mjs` if you tweak it.

## Assets
- New architecture slide: `docs/demo-video-output/arch-slide-9agents.png` (source: `arch-slide.html`, re-render with `render-slide.mjs`).
- Runtime proof: existing "Live Stack Flags" /health slide.
- Coaching frames: `docs/demo-video-frames/` (`t0227` = "Find a strong subject"; `c2_09`-equivalent green-ready in clip 02 ~9s).
- Clips: `docs/demo-video-clips/01,02,03`.
