# Iris — unified 3-minute demo (iOS + web)

**Target:** Devpost video under 3:00  
**Personas:** hobbyist (spine) → working pro (coda)  
**Principle:** Iris proposes, you decide — nothing writes to your library or marketplace without a yes.

---

## Before you record

1. Reseed demo data: `make seed-demo` or `python3 scripts/seed-demo-data.py --reset`
2. Confirm `.env` has `DEMO_USER_ID=6577a1f2b3c4d5e6f7a8b9c0`
3. iOS: Settings → API URL → production Cloud Run; sign in with demo Google account or developer uid
4. Web: [iris-photo-mentor.web.app](https://iris-photo-mentor.web.app) (same demo user)
5. **Outdoor iOS:** screen record with **mic off** (wind); voiceover in post. Keep on-screen coach hints visible.
6. **Subject:** **indoor flower pot** (primary — weather-proof; pre-seeded brief). Optional outdoor B-roll if weather clears.

---

## HITL through-line (say once, show four times)

> *"Iris never changes your library on its own — it proposes, you approve."*

| Gate | When | What |
|------|------|------|
| 1 | ~0:15 | Accept practice assignment (decline is available) |
| 2 | ~1:20 | Mark assignment complete → Reflection skill delta |
| 3 | ~2:25 | Organize — approve one tag/dedupe proposal |
| 4 | ~2:35 | Print Sales — approve one listing draft |

---

## Storyboard + voiceover

### Act 1 — Hobbyist field loop (iPhone, 0:00–1:35)

| Time | Screen | Action | Voiceover |
|------|--------|--------|-----------|
| 0:00 | iOS Home | Open Iris | *"I'm a hobbyist photographer. Iris remembers my whole library — and today it has a new practice assignment for me."* |
| 0:08 | Practice tab | Badge shows proposed assignment | *"The Planner agent read my portfolio and proposed a composition drill — I accept or pass."* |
| 0:15 | Practice | Tap **Accept** (HITL gate 1) | *"Iris never changes my library on its own — it proposes, I approve."* |
| 0:22 | Practice / Shoot | Tap **Shoot for this** | *"The brief follows me into the camera."* |
| 0:28 | Camera viewfinder | **PRACTICE BRIEF** pill visible; live coach starts | *"Gemini Flash coaches in real time — framed for this assignment, not generic tips."* |
| 0:35–1:05 | Camera | Coach hints (thirds, negative space); **Ready — tap Shutter** | *(Optional: lay re-recorded spoken cue under hint.)* *"When the frame is good enough, Iris stops nagging and lets me shoot."* |
| 1:05 | Shutter | Capture | *(UI sound only)* |
| 1:08–1:25 | Critique sheet | Glass Box scores + text referencing composition brief | *"The Coach agent critiques against the same brief — Glass Box, not a black box."* |
| 1:25 | Critique | **Mark complete** (HITL gate 2) → Reflection | *"I confirm completion — Reflection compares this shoot to my baseline and shows composition improved."* |
| 1:30 | Reflection sheet | Skill delta | *"That's the loop: propose, coach, critique, measure."* |
| 1:33 | — | Cut | *"The full story lives in my library on the web."* |

### Act 2 — Web library payoff (hobbyist, 1:35–2:15)

| Time | Screen | Action | Voiceover |
|------|--------|--------|-----------|
| 1:35 | My Work | New photo in grid with score | *"Same MongoDB memory — the photo I just shot appears in my library."* |
| 1:45 | My Work | Natural-language search | *"Atlas Search on the same corpus — I ask in plain language."* |
| 1:55 | Expanded tile | **Similar in your library** (vector) | *"Vector search finds frames with the same feel."* |
| 2:05 | Home | Trend / At a glance | *"Scores and trends update from persistent memory — not a one-shot critique tool."* |

### Act 3 — Working-pro coda (web, 2:15–2:45)

| Time | Screen | Action | Voiceover |
|------|--------|--------|-----------|
| 2:15 | — | Cut | *"A working pro skips the drills — Iris instead organizes the backlog and drafts print listings. Every bulk change still waits for a yes."* |
| 2:18 | Settings | Switch persona → **Working pro** | *(Brief on-screen text or VO only)* |
| 2:22 | Mentor → Organize | Scan → approve one card (gate 3) | *"Triage clusters similar shots — I approve before any tag writes."* |
| 2:32 | Print Sales | Draft proposals → approve one (gate 4) | *"Print Sales Strategist drafts marketplace copy — publish stays behind human approval."* |

### Act 4 — Architecture outro (2:45–3:00)

| Time | Asset | Voiceover |
|------|-------|-----------|
| 2:45 | `diagram-architecture.png` or `annotated-02-glass-box.png` | *"Nine ADK agents on Cloud Run — Gemini 3.1 Pro for reasoning, Flash for live field coaching. Reads through MongoDB MCP; writes through PyMongo after you approve. Glass Box critiques you can inspect."* |

---

## What stays real vs seeded

| Seeded (predictable) | Real Gemini (honest) |
|----------------------|----------------------|
| Assignment brief + target skill | Live field coaching cues |
| Prior completed baseline for delta | Glass Box critique text + scores |
| Demo portfolio library | Reflection skill delta (may vary — pick best take) |
| Organize / Print proposals (deterministic scan paths) | Mentor chat (optional B-roll) |

---

## Fallback if live API is slow

Use committed B-roll from `docs/devpost-public/`:

- `standalone-03-practice.png` — assignment HITL
- `standalone-02-glass-box.png` — critique
- `standalone-06-my-work.png` — library + search
- `standalone-05-organize.png` — Organize HITL
- `standalone-07-print.png` — Print Sales HITL
- `annotated-*.png` — architecture panels

---

## Recording checklist

- [ ] Reseed with `--reset`
- [ ] Practice tab shows **proposed** composition assignment
- [ ] Accept → Shoot → brief visible in viewfinder
- [ ] Live coach references brief (wait for 2–3 cues)
- [ ] Critique mentions composition / brief alignment
- [ ] Mark complete shows positive composition delta
- [ ] Web My Work shows new entry (may need refresh)
- [ ] Working-pro Organize + Print each get one approve tap
- [ ] Final edit ≤ 3:00 with synced VO

---

## Related docs

- [demo-prep.md](demo-prep.md) — judge no-upload path
- [demo-video-script-3min.md](demo-video-script-3min.md) — earlier web-only script (superseded by this doc for final edit)
- [ios-demo-recording-checklist.md](ios-demo-recording-checklist.md) — iOS capture settings
