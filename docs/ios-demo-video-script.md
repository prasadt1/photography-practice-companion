# Iris — 60–90s demo video script (iPhone + web)

Use for Devpost, judges, or social. Record on a **physical iPhone** (demo mode is fine). Optional B-roll from web studio.

**Live app:** https://practice-companion-hackathon.web.app

---

## Before you record

- [ ] iPhone: Iris installed from Xcode (your device, not Simulator passkey flow)
- [ ] **Continue in demo mode** → pick **Hobbyist** (or Working pro)
- [ ] Optional: paste Firebase uid in Settings → Developer if you want real portfolio on device
- [ ] Quiet room, portrait orientation, Do Not Disturb on
- [ ] iOS screen recording: Control Center → Screen Recording

---

## Script (≈75 seconds)

| Time | Shot | Voiceover |
|------|------|-----------|
| **0:00–0:08** | Home tab — progress card + recent photos (or empty state) | “This is **Iris** — an AI photography mentor that **remembers** every frame you share.” |
| **0:08–0:12** | Tap **Shoot** FAB | “Shoot or upload — one tap.” |
| **0:12–0:35** | Gallery pick (simulator) or shutter (device); analyzing overlay; critique sheet (scores + Glass Box) | “Coach runs on **Gemini** with **Glass Box** reasoning — not just a score, but *why*.” |
| **0:35–0:42** | Dismiss critique → **Practice** tab | “Iris proposes **practice** from your weak areas.” |
| **0:42–0:50** | Accept challenge → **Shoot for this** (optional quick shot) or show active card | “Accept a brief, shoot with context, mark complete — get a **reflection** on growth.” |
| **0:50–0:58** | **Mentor** — tap a suggested question; show reply loading then answer | “**Mentor** chat is portfolio-aware — same memory on **MongoDB**.” |
| **0:58–1:05** | Quick cut to **Safari**: web app My Work / portfolio (optional) | “Deep portfolio and pro tools live on the **web studio**; the phone is your field companion.” |
| **1:05–1:12** | Back to Iris Home or app icon on springboard | “**Iris** — one mentor, every photo, always learning. Built on **Google Cloud** and **MongoDB Atlas**.” |

---

## One-liner variants (title card / end card)

- “Your photos are the interface. Your mentor remembers.”
- “Glass Box critique + persistent portfolio memory + practice that sticks.”
- “Google ADK agents, Gemini 3.1 Pro, MongoDB Atlas — hackathon build, product-grade UX.”

---

## If portfolio is empty on demo

1. Shoot one photo in Iris (demo mode).
2. Wait for critique (~30–90s).
3. Re-record Home with one recent thumbnail.

---

## Technical talking points (if asked)

- **REST:** `POST /api/v1/analyze-photo` (Coach), `POST /api/v1/agent/chat` (orchestrator)
- **Memory:** MongoDB `portfolio_entries`, assignments, aesthetic profile, trends
- **iOS:** SwiftUI, optional Firebase Google Sign-In, Shoot FAB, no App Store required for demo

---

*Expand with Claude’s Devpost writeup; swap voiceover to first person if you prefer author voice.*
