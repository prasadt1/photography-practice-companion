# Iris iOS — Product Specification

**Status:** Supersedes IA/journey sections of `ios-implementation-plan.md`
**Date:** May 27, 2026
**Scope:** Full mobile Iris experience — not a web port, not a demo stub
**Audience:** Implementation (Cursor), App Store review, judges

---

## Executive Summary

Iris iOS is **the mentor in your pocket** — a complete photography companion that remembers you, coaches you in the field, and grows with you over time. It shares the same brain (Gemini), memory (MongoDB), and identity (Firebase) as web Iris, but optimized for how photographers actually use their phones:

- **Capture first** — the camera is always one tap away
- **Quick check-ins** — see progress, review recent work, chat with Mentor
- **Practice in context** — assignments that travel with you

Web remains the **studio** for deep portfolio review, triage, and print sales. iOS is the **field companion** that makes memory meaningful on the go.

---

## 1. Recommended Information Architecture

### Challenge to 4-Tab Model

The proposed **Home | Work | Practice | Mentor** structure mirrors web too closely. Web's tabs reflect desktop workflows (sit, browse, organize). Mobile needs **action-first** navigation.

**Problem with pure tab parity:**
- "Work" on mobile is low-value (small screen, no triage/print tools)
- "Home" without prominent capture action wastes mobile's primary affordance
- Splitting "Shoot" from "Practice" creates the duplicate Field problem

### Recommended IA: 4 Tabs + Contextual Capture

```
┌─────────────────────────────────────────────────────────────────┐
│                         [Iris iOS]                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│   │  Home   │  │ Practice│  │ Mentor  │  │Settings │           │
│   │    ◉    │  │    ○    │  │    ○    │  │    ○    │           │
│   └─────────┘  └─────────┘  └─────────┘  └─────────┘           │
│                                                                 │
│   [━━━━━━━━━━━━━━━━ FAB: Shoot ━━━━━━━━━━━━━━━━]               │
│                      (amber, persistent)                        │
└─────────────────────────────────────────────────────────────────┘
```

### Tab Structure

| Tab | Purpose | Entry Point |
|-----|---------|-------------|
| **Home** | Your Iris relationship — progress snapshot, recent activity, quick stats | Default on launch |
| **Practice** | Assignments — propose, accept, shoot-with-context, complete | When learning |
| **Mentor** | Real chat — portfolio-aware, mode-aware, remembers history | When curious |
| **Settings** | Persona, account, coaching preferences, accessibility | Configuration |

### Where Shoot Lives

**Primary: Floating Action Button (FAB)**
- Persistent amber button, bottom-right, visible on Home/Practice/Mentor
- Hidden on Settings and during camera session
- Single tap → full-screen camera
- Context-aware: if active assignment exists, pre-loads assignment brief

**Secondary: Practice inline**
- Active assignment card has "Shoot for this" action
- Opens same camera, but with assignment explicitly attached
- Mirrors web Field behavior (inside Practice, not separate)

**Why FAB over tab:**
1. Camera is an **action**, not a **place** — you don't "browse" the camera
2. Accessible from any screen without navigation
3. Avoids "which shoot button?" confusion (Home vs Practice)
4. Standard iOS pattern for primary creation action
5. Assignment context flows automatically when relevant

### Intentional Divergence from Web

| Web | iOS | Reason |
|-----|-----|--------|
| 4 tabs: Home / My Work / Practice / Mentor | 4 tabs: Home / Practice / Mentor / Settings | "My Work" is low-value on mobile; Settings earns a tab for accessibility/persona config |
| Field inside Practice only | FAB from anywhere + Practice contextual | Mobile = capture-first; assignment now optional |
| Portfolio grid primary on Home | Progress snapshot primary on Home | Small screen; deep browse stays on web |
| Full triage/print tools | Deep link to web | Pro tools need screen real estate |

### Navigation Model

| From | To | Method |
|------|-----|--------|
| Any tab | Camera | FAB tap |
| Camera | Critique sheet | Auto after capture |
| Critique sheet | Home | Dismiss or "Done" |
| Practice | Camera (with assignment) | Card action or FAB |
| Mentor | Camera | FAB (assignment context if active) |
| Settings | Web (triage/print) | Deep link |
| Home | Recent photo detail | Tap card → sheet |

**Stacks, not modals:** Camera and critique are full-screen **pushed** views (swipe to dismiss), not modal sheets. This allows proper back navigation and state preservation.

---

## 2. Screen Inventory

| Screen | User Job | APIs | Personas |
|--------|----------|------|----------|
| **Splash/Launch** | Brand moment, auth check | — | All |
| **Sign In** | Authenticate with Google | Firebase Auth | All |
| **Persona Selection** | Choose hobbyist/working_pro (first launch) | `PATCH /users/me` | All (once) |
| **Home** | See myself — progress, trends, recent activity | `GET /users/me`, `GET /portfolio` (limit 5) | All |
| **Home > Photo Detail** | Quick view of recent photo + scores | Local (from Home fetch) | All |
| **Practice > List** | Browse available/active assignments | `GET /assignments`, `GET /assignments/active` | All |
| **Practice > Assignment Detail** | See brief, focus areas, accept/decline | `POST /assignments/{id}/accept` | All |
| **Practice > Active** | Current assignment with "Shoot" CTA | `GET /assignments/active` | All |
| **Practice > Complete** | Reflection prompt, mark done | `POST /assignments/{id}/complete` | All |
| **Camera** | Shoot — viewfinder, compose, capture | — (local until shutter) | All |
| **Camera > Live Coaching** | Real-time cues while framing | `POST /agent/field_capture` (Phase 3+) | All |
| **Critique Sheet** | Glass Box results after capture | `POST /analyze-photo` | All |
| **Mentor > Chat** | Conversation with portfolio context | `POST /agent/chat` | All |
| **Settings > Profile** | View/edit persona, name | `GET/PATCH /users/me` | All |
| **Settings > Coaching** | Voice speed, cue frequency, mute prefs | Local + `PATCH /users/me` | All |
| **Settings > Accessibility** | VoiceOver hints, haptic intensity, high contrast | Local | All (VI focus) |
| **Settings > Account** | Sign out, delete account, export data | Firebase, `DELETE /users/me` | All |
| **Empty States** | No photos, no assignments, no chat history | — | All |
| **Error/Timeout** | 60-90s analyze timeout, network errors | — | All |

### Screens NOT on iOS v1 (web deep-link)

| Screen | Reason | Access |
|--------|--------|--------|
| Portfolio grid (full) | Small screen, no value | `iris://work` → Safari |
| Triage scan | Pro tool, needs comparison UI | Settings → "Open Web" |
| Print sales | Pro tool, needs editing | Settings → "Open Web" |
| User tags management | Bulk operations | Settings → "Open Web" |

---

## 3. Persona Journeys

### Hobbyist Journeys

#### Journey H1: Cold Start (First Launch)

```
1. Download from App Store
2. Launch → Splash with Iris mark
3. "Sign in with Google" → Firebase
4. Persona selection: "What describes you best?"
   - Hobbyist (learning, improving)
   - Working Professional (client work, sales)
5. Welcome: "I'm Iris. I'll remember every photo and help you grow."
6. Home tab: Empty state with "Take your first photo" FAB highlight
7. Tap FAB → Camera opens
8. Frame shot → See rule-of-thirds overlay
9. Capture → "Analyzing..." (progress indicator, 20-60s)
10. Critique sheet: Scores, observations, "What went well", "Try next time"
11. "Save to Portfolio" → Home now shows first entry
12. Badge: "You've started your journey"
```

#### Journey H2: Return User with Portfolio

```
1. Launch → Home tab (default)
2. See: Progress card ("Composition: +12% this month"), 3 recent photos
3. Tap recent photo → Detail sheet with scores, date
4. Notice Practice badge (1 pending)
5. Switch to Practice tab
6. See proposed assignment: "Golden hour silhouettes"
7. "Accept" → Assignment moves to Active
8. Later: At sunset location, open app
9. FAB shows assignment context: "Shooting: Golden hour silhouettes"
10. Capture → Critique → "Great use of backlighting!"
11. Return to Practice → "Mark Complete" → Reflection prompt
12. Home updates: New trend data, skill deltas
```

#### Journey H3: Active Practice Loop

```
1. Open app → See active assignment on Home (inline card)
2. Tap card → Practice tab, assignment detail
3. Read brief: "Focus on leading lines in urban environments"
4. "Shoot for this" button → Camera with assignment context
5. Live coaching (Phase 3+): "Strong diagonal — try moving left"
6. Capture → Critique with assignment relevance highlighted
7. Not satisfied → "Try Again" → Camera reopens
8. Satisfied → Save → "Complete Assignment?"
9. Complete → Propose next assignment automatically
10. Mentor prompt: "Want to discuss what you learned?"
```

### Working Professional Journeys

#### Journey W1: Cold Start

```
1. Sign in → Select "Working Professional"
2. Persona stored → Unlocks: User tags, future triage/print
3. Welcome: "I'll help you refine your eye and prep work for clients."
4. Home: Same empty state, but messaging hints at organization tools
5. First capture → Critique includes "Market positioning" observation
6. Settings shows "Pro Tools (Web)" link for triage/print
```

#### Journey W2: Quick Portfolio Check

```
1. Open app between client shoots
2. Home: See recent client work scores, consistency trend
3. "Last 5 photos: 4.2 avg composition" — tracking quality
4. Tap Mentor: "How's my lighting consistency this week?"
5. Mentor (portfolio-aware): "Your studio shots are strong (4.5),
   but outdoor varied (3.2-4.8). Consider reflector consistency."
6. Quick insight, close app, back to shoot
```

#### Journey W3: Assignment for Skill Gap

```
1. Mentor chat: "I keep struggling with backlit subjects"
2. Mentor: "I've noticed that too. Want a practice assignment?"
3. "Yes" → Practice tab shows proposed: "Backlit portraits with fill"
4. Accept → Shoot over next week
5. Complete → Scores show +0.8 on "exposure balance"
6. Home reflects improvement in trend graph
```

### Vision Impairment Journeys (Roadmap — Phase 4+)

#### Journey V1: Voice-First Field Session

```
1. Settings > Accessibility > "Voice-First Mode" ON
2. VoiceOver active throughout
3. FAB announces: "Shoot button"
4. Camera opens → Scene description spoken: "Outdoor, daylight,
   subject appears to be a person, slightly left of center"
5. Live cues (Phase 3+): "Move camera right for better framing"
6. Haptic pulse pattern: "Ready to capture"
7. Double-tap → Capture
8. Critique spoken: "Strong composition. Subject well-placed."
9. "Save to portfolio?" → Voice confirm: "Yes"
```

---

## 4. Unified Phased Roadmap

### Phase 0 — Foundation (Complete)
*Scaffold in repo: `ios/Iris.xcodeproj`*

**Outcomes:**
- Xcode project builds and runs on device/simulator
- Firebase Auth integrated (Google Sign-In)
- API client skeleton with `X-User-Id` header
- Tab bar shell (4 tabs)
- Design tokens (`IrisTheme`) from web CSS

**Acceptance Criteria:**
- [ ] `cmd+R` builds without error
- [ ] Sign in flow completes, token persisted
- [ ] `GET /health` returns 200 from app
- [ ] All 4 tabs navigate correctly
- [ ] Colors match web (spot check 3 tokens)

**Out of Scope:**
- Any real screens beyond placeholder
- Camera access
- API calls beyond health

**Dependencies:**
- Apple Developer account enrolled
- Firebase iOS SDK configured
- Cloud Run API deployed

---

### Phase 1 — Capture + Critique (Current Target)

**Outcomes:**
- Users can shoot and get Glass Box critique
- Works WITHOUT assignment (assignment_id optional)
- Critique displayed in polished sheet
- Photo saved to portfolio on confirm

**Acceptance Criteria:**
- [ ] FAB opens full-screen camera
- [ ] AVFoundation rear camera preview renders
- [ ] Rule-of-thirds overlay visible
- [ ] Shutter captures JPEG, shows progress (handle 60-90s)
- [ ] Critique sheet displays: scores, observations, tags
- [ ] "Save" calls API, confirms success
- [ ] "Discard" returns to previous screen
- [ ] Works on airplane mode: appropriate error
- [ ] Empty state on Home before first photo

**Out of Scope:**
- Live coaching (field_capture)
- Assignment context (Practice integration)
- Mentor chat
- Persona selection (hardcode hobbyist)

**Dependencies:**
- `POST /analyze-photo` (exists, assignment_id optional)
- Camera privacy string in Info.plist

---

### Phase 1.5 — Home + Progress

**Outcomes:**
- Home shows portfolio snapshot (not full grid)
- Recent photos (3-5) with scores
- Progress indicators (trends, deltas)
- "Memory makes meaning" — user sees Iris remembers them

**Acceptance Criteria:**
- [ ] Home fetches `GET /users/me` + `GET /portfolio?limit=5`
- [ ] Progress card: "Composition: X.X avg (↑Y% this month)"
- [ ] Recent photos: thumbnail, date, overall score
- [ ] Tap photo → Detail sheet (scores, observations)
- [ ] Empty state: "Take your first photo" with FAB highlight
- [ ] Pull-to-refresh updates data
- [ ] Loading skeleton while fetching

**Out of Scope:**
- Full portfolio grid
- Filtering/search
- User tags

**Dependencies:**
- `GET /portfolio` endpoint (exists)
- Progress/trend calculation (server or client)

---

### Phase 2 — Practice Integration

**Outcomes:**
- Full assignment lifecycle on device
- Shoot-with-assignment flows correctly
- Assignment context enhances critique relevance

**Acceptance Criteria:**
- [ ] Practice tab shows: Proposed, Active, Completed sections
- [ ] Proposed: "Accept" / "Decline" actions work
- [ ] Active: Assignment brief, focus areas, "Shoot for this"
- [ ] "Shoot for this" → Camera with assignment_id attached
- [ ] Critique mentions assignment relevance
- [ ] "Mark Complete" → Reflection prompt → `POST complete`
- [ ] Home inline card for active assignment
- [ ] Badge on Practice tab when proposed exists
- [ ] Empty state: "No assignments — ask Mentor for one"

**Out of Scope:**
- Creating assignments from iOS (Mentor proposes)
- Editing assignments
- Assignment history beyond "completed" section

**Dependencies:**
- `GET /assignments` (exists)
- `GET /assignments/active` (exists)
- `POST /assignments/{id}/accept` (exists)
- `POST /assignments/{id}/complete` (exists)

---

### Phase 2.5 — Mentor Chat

**Outcomes:**
- Real conversational Mentor on device
- Portfolio-aware responses
- Mode-aware (knows persona, recent work)

**Acceptance Criteria:**
- [ ] Mentor tab shows chat interface
- [ ] Send message → `POST /agent/chat` → Display response
- [ ] Supports multi-turn conversation
- [ ] Mentor references portfolio ("I see your recent landscape...")
- [ ] Mentor can propose assignments (deep link to Practice)
- [ ] Loading state for 10-30s responses
- [ ] Error handling for timeouts
- [ ] Empty state: Suggested prompts ("What should I work on?")
- [ ] Chat history persists (local cache or API)

**Out of Scope:**
- Voice input (Phase 4)
- Streaming responses (nice-to-have)

**Dependencies:**
- `POST /agent/chat` (exists)
- Chat history storage decision (local vs server)

---

### Phase 3 — Persona + Onboarding

**Outcomes:**
- First-launch persona selection
- Settings reflect and allow persona change
- Pro users see appropriate messaging/links

**Acceptance Criteria:**
- [ ] First launch → Persona selection screen (after auth)
- [ ] Selection calls `PATCH /users/me` with persona
- [ ] Home/Practice messaging adapts to persona
- [ ] Settings > Profile shows current persona
- [ ] Persona change triggers confirmation ("This affects your experience")
- [ ] Working pro: "Pro Tools (Web)" link in Settings
- [ ] Hobbyist: No triage/print references

**Out of Scope:**
- Vision impairment persona (Phase 4)
- In-app triage/print

**Dependencies:**
- `PATCH /users/me` persona field (exists)

---

### Phase 3.5 — Backend: Live Coaching API

**Outcomes:**
- Server endpoints ready for live viewfinder coaching
- iOS can receive real-time cues during capture

**Acceptance Criteria:**
- [ ] `POST /capture_sessions` creates session doc
- [ ] `POST /agent/field_capture` accepts frame + session_id
- [ ] Response includes: `spoken_cue`, `on_screen_hint`, `confidence`
- [ ] Rate limiting: max 1 inference / 3s per session
- [ ] Session timeout: 15 min max
- [ ] Integration test: curl drives field_capture successfully

**Out of Scope:**
- SSE/WebSocket (Phase 5 if needed)
- Haptic patterns (Phase 4)
- Voice input (Phase 4)

**Dependencies:**
- Field Coach agent (exists)
- OpenAPI spec for contracts

---

### Phase 4 — iOS Live Coaching

**Outcomes:**
- Real-time coaching cues during capture
- Voice output for cues
- Meaningful differentiation from web

**Acceptance Criteria:**
- [ ] Camera session starts `POST /capture_sessions`
- [ ] Frame sent every 3-4s via `POST /agent/field_capture`
- [ ] Cue displayed as subtitle overlay
- [ ] Cue spoken via `AVSpeechSynthesizer` (respects mute)
- [ ] "Ask Iris" button sends immediate frame
- [ ] Duplicate cue suppression (no repeat within 30s)
- [ ] Graceful degradation: local grid if API fails
- [ ] Battery target: <8% per 15-min session
- [ ] Settings: Coaching frequency, voice speed, mute option

**Out of Scope:**
- ARKit overlays (Phase 5)
- Full VI mode (Phase 4.5)

**Dependencies:**
- Phase 3.5 backend complete
- Core ML model for offline grid (optional)

---

### Phase 4.5 — Vision Impairment Support

**Outcomes:**
- Voice-first field experience
- Haptic feedback patterns
- Full VoiceOver compatibility

**Acceptance Criteria:**
- [ ] Settings > Accessibility > "Voice-First Mode"
- [ ] Camera announces scene description on open
- [ ] All cues spoken, not just displayed
- [ ] Haptic patterns: ready, warning, success, error
- [ ] Voice confirmation before portfolio save
- [ ] VoiceOver labels on all interactive elements
- [ ] High contrast mode option
- [ ] `field_voice` endpoint integration (voice input)

**Out of Scope:**
- Apple Watch haptics
- Braille display support

**Dependencies:**
- `POST /agent/field_voice` (new backend)
- Haptic pattern definitions (server or client)

---

### Phase 5 — Polish + App Store

**Outcomes:**
- Production-ready for App Store submission
- Push notifications for engagement
- Complete error/empty/loading states

**Acceptance Criteria:**
- [ ] Onboarding flow polished (3-screen intro optional)
- [ ] Push: Assignment proposed, critique ready
- [ ] All empty states designed and implemented
- [ ] All error states with retry actions
- [ ] Timeout UX for 60-90s analyze (progress, cancel option)
- [ ] Privacy policy linked
- [ ] App Store screenshots (6.7", 6.1")
- [ ] App Store description and keywords
- [ ] TestFlight beta with 5-10 photographers
- [ ] Crash-free rate >99%
- [ ] Cold start <2s

**Out of Scope:**
- iPad layout
- Mac Catalyst

**Dependencies:**
- Privacy policy URL
- App Store Connect setup

---

### Phase 6 — Stretch (Post-Launch)

| Feature | Notes |
|---------|-------|
| Offline queue | Upload when connected, "coaching paused" UX |
| ARKit overlays | Horizon, subject box from server JSON |
| Apple Watch | Assignment notification, quick stats |
| Live Activities | "Coaching active" on lock screen |
| SSE/WebSocket | If REST latency >4s median |
| iPad layout | Larger critique view, side-by-side |
| Widgets | Progress snapshot, active assignment |

---

## 5. Reconciliation: Viewfinder Companion vs Full Mobile Iris

### The Tension

The original implementation plan positioned iOS as a **viewfinder companion** — real-time coaching during capture, with portfolio/mentor staying on web. The new direction wants **full Iris on mobile** — memory, chat, progress, not just shooting.

### The Resolution: Same Brain, Different Hands

Iris iOS is **one product with two modes of engagement**:

**Quick Check-In Mode** (most sessions)
- Open app → See progress on Home
- Glance at recent work
- Quick Mentor question
- Close app — 30 seconds total

**Field Session Mode** (when shooting)
- FAB → Camera → Live coaching
- Extended session (5-15 min)
- Multiple captures, cues, refinement
- End with critique and save

These aren't competing — they're **complementary**. The mentor relationship (memory, chat, progress) makes the field coaching meaningful. Without portfolio context, coaching is generic. Without coaching, the portfolio is just storage.

### Narrative for Users

> "Iris lives on your phone now. Check in anytime to see your progress, chat about your work, or get a quick assignment. When you're ready to shoot, Iris coaches you in real-time — remembering everything you've learned together."

### Narrative for App Store

> **Iris — AI Photography Mentor**
>
> Your personal photography coach with perfect memory. Iris remembers every photo you share, tracks your growth over time, and helps you improve with targeted practice.
>
> **In your pocket:** Check progress, review recent work, chat with your mentor.
> **In the field:** Real-time coaching while you frame, instant critique when you capture.
>
> One mentor. Every photo. Always learning.

### Narrative for Judges

> Iris demonstrates how AI agents can maintain persistent, personalized relationships. Unlike stateless photo critique tools, Iris remembers — every photo, every lesson, every breakthrough. The iOS app brings this relationship into the field, where photographers actually shoot, while maintaining the full mentor experience on mobile.

---

## 6. Open Decisions — Resolved (May 27, 2026)

*Owner: Prasad / implementation agent. Use these unless explicitly reopened.*

| # | Decision | Answer | Rationale |
|---|----------|--------|-----------|
| 1 | Chat history | **Hybrid** | **UI:** persist messages in Swift (`@AppStorage` or lightweight SwiftData) for instant reopen. **Server:** pass `sessionId` on each `POST /agent/chat` (same contract as web `mentorClient.ts`); ADK session continuity lives server-side today (`InMemorySessionService`). Clear local + `sessionId` on persona change (match web). **Later:** optional `GET /conversations` if we add durable Mongo-backed chat — not blocking v1. |
| 2 | Progress calculation | **Server** | Reuse existing `GET /api/v1/portfolio/trends` and `GET /api/v1/aesthetic-profile` (same as web Home). Do **not** recompute trends on device. Optional `GET /users/me/progress` only if those two calls are awkward on mobile — defer new endpoint. |
| 3 | Offline behavior | **Explicit offline** (v1) | No silent upload queue in v1. Show banner when unreachable; block analyze/chat with clear copy. **Phase 6** (spec stretch) adds queue + “coaching paused.” Honest UX beats fake success. |
| 4 | Assignment proposals | **In-app propose + Mentor** | **Practice:** “Get new assignment” → `POST /assignments/propose` (parity with web Practice tab). **Mentor:** planner via orchestrator can suggest; deep-link to Practice to accept. **No push** for v1 (no APNs dependency for proposals). |
| 5 | Critique timeout UX | **Interstitial with elapsed time + tips + Cancel** | Indeterminate progress (not fake %). Copy: “Coach can take up to 90 seconds.” Rotate 2–3 photography tips. **Cancel** returns to camera and aborts in-flight `URLSession` task. Allow minimize via `beginBackgroundTask` but don’t promise completion in background. |
| 6 | FAB visibility | **Always visible** | Show on Home, Practice, Mentor; hide on Settings and during camera/critique full-screen. **Do not** hide on scroll in v1 — capture is the product’s primary action; scroll-hide adds bugs for little gain. |
| 7 | Deep links | **Both, phased** | **v1:** custom URL scheme `iris://` — `iris://practice`, `iris://mentor`, `iris://shoot`, `iris://open-web-work` (opens Safari to web My Work). **v1.1 / Phase 5:** Universal Links on `practice-companion-hackathon.web.app` for shared links from email/Devpost. |
| 8 | Analytics | **Minimal Firebase Analytics** | Log only: `app_open`, `sign_in`, `analyze_started` / `analyze_completed` / `analyze_failed`, `assignment_accepted`, `mentor_message_sent`, `mentor_reply_received`. No photo content, no critique text. Enough for App Store + funnel; skip custom pipeline until post-launch. |
| 9 | Minimum iOS | **iOS 17** | Already set in `ios/project.yml` / Xcode. Keeps SwiftUI APIs consistent; acceptable for photographer audience on recent devices. Revisit 16 only if TestFlight feedback demands it. |
| 10 | TestFlight | **Invite-only first, then wider** | **Beta 1:** 5–10 photographers (invite list). **Beta 2:** expand to ~30 after crash-free >99%. **Public open TestFlight** only after Phase 2.5 (real Mentor) + Phase 1.5 (Home) ship — avoid placeholder-heavy builds. |

### IA note (Cursor alignment with this spec)

**Agree:** Home | Practice | Mentor | Settings + amber FAB; no Work tab; web for full portfolio/triage/print.

**Refinement:** Rename current **Field** tab implementation to **Shoot flow** behind FAB (retire “Field” tab label in UI). Migrate `AppTab.field` → remove from tab bar when FAB lands; keep `FieldCaptureView` as the camera module.

**Phase order tweak (recommended):** Ship **1.5 Home** before expanding Practice polish; ship **Firebase auth (spec Phase 0 checkbox)** before TestFlight — manual `X-User-Id` is dev-only, not App Store story.

---

## 7. Risks and Anti-Patterns

### Risk: Duplicate Shoot Entry Points

**Anti-pattern:** Separate "Field" tab AND FAB AND Practice shoot button, confusing users about which to use.

**Mitigation:** FAB is THE shoot entry. Practice "Shoot for this" is contextual shortcut that uses same camera flow with pre-attached assignment. No separate Field tab.

### Risk: Manual X-User-Id Forever

**Anti-pattern:** Never implementing proper auth token refresh, relying on header injection indefinitely.

**Mitigation:** Phase 5 acceptance criteria includes auth token refresh. Document current `X-User-Id` as transitional in code comments. Track tech debt.

### Risk: Mentor Placeholder

**Anti-pattern:** Shipping Mentor tab with "Coming soon" or web redirect, breaking the "full Iris" promise.

**Mitigation:** Phase 2.5 delivers real Mentor chat before App Store submission. If blocked, delay App Store, don't ship placeholder.

### Risk: Skipping Home/Work, Losing Memory Meaning

**Anti-pattern:** Shipping camera-only app that feels like a photo critique utility, not a mentor relationship.

**Mitigation:** Phase 1.5 (Home + Progress) ships before Phase 2 (Practice). Users see their history before we add more features. "Memory makes meaning" is core to differentiation.

### Risk: 60-90s Analyze Timeout

**Anti-pattern:** Spinner with no feedback, user thinks app crashed, force-quits.

**Mitigation:**
- Progress indication (even if approximate)
- "This can take up to 90 seconds" messaging
- Cancel button that returns to camera
- Background task so app can be minimized

### Risk: Web-Style Gallery on Small Screen

**Anti-pattern:** Porting My Work grid to iOS, unusable on phone.

**Mitigation:** Home shows 3-5 recent photos only. Full portfolio browse stays on web. Deep link for "See all" goes to web.

### Risk: Persona Drift

**Anti-pattern:** Hobbyist and pro experiences diverge so much that switching persona feels like different app.

**Mitigation:** Core flows identical. Pro adds: different messaging, web links for tools, market-aware critique phrasing. Not different UI structure.

### Risk: Phase Creep

**Anti-pattern:** Each phase grows scope, nothing ships.

**Mitigation:** "Out of scope" explicitly listed per phase. Acceptance criteria are testable, not subjective. Ship increments to TestFlight.

---

## Appendix A: API Endpoints Summary

### Existing (Reuse As-Is)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/v1/analyze-photo` | Glass Box critique, assignment_id optional |
| `GET /api/v1/users/me` | User profile, persona |
| `PATCH /api/v1/users/me` | Update persona, prefs |
| `GET /api/v1/portfolio` | Portfolio entries, supports limit/offset |
| `GET /api/v1/assignments` | All assignments for user |
| `GET /api/v1/assignments/active` | Current active assignment |
| `POST /api/v1/assignments/{id}/accept` | Accept proposed |
| `POST /api/v1/assignments/{id}/complete` | Mark done |
| `POST /api/v1/agent/chat` | Mentor conversation |

### New (Backend Work Required)

| Endpoint | Phase | Purpose |
|----------|-------|---------|
| `POST /api/v1/capture_sessions` | 3.5 | Start live coaching session |
| `POST /api/v1/agent/field_capture` | 3.5 | Send frame, receive cue |
| `POST /api/v1/agent/field_voice` | 4.5 | Voice input during session |
| `GET /api/v1/users/me/progress` | 1.5 (optional) | Computed trends, deltas |
| `DELETE /api/v1/users/me` | 5 | Account deletion |

---

## Appendix B: Design Token Reference

From `IrisTheme.swift` (translate web tokens):

```swift
// Surfaces
static let canvas = Color(hex: "#1a1816")
static let surface1 = Color(hex: "#2a2724")
static let surface2 = Color(hex: "#343130")
static let surface3 = Color(hex: "#3d3834")

// Borders
static let warmBorder = Color(hex: "#44403c")

// Accent (amber)
static let brand400 = Color(hex: "#fbbf24")
static let brand500 = Color(hex: "#f59e0b")
static let brand600 = Color(hex: "#d97706")

// Text
static let textPrimary = Color(hex: "#e7e5e4")
static let textSecondary = Color(hex: "#a8a29e")
static let textMuted = Color(hex: "#78716c")

// Typography
static let fontBody = "DM Sans"
static let fontHeadline = "Newsreader"
```

---

## Appendix C: Screen Wireframes (ASCII)

### Home Tab

```
┌─────────────────────────────────┐
│ ● Iris                     [👤] │
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐  │
│  │ Your Progress             │  │
│  │ Composition: 4.2 (↑12%)   │  │
│  │ Lighting: 3.8 (↑5%)       │  │
│  │ [View details →]          │  │
│  └───────────────────────────┘  │
│                                 │
│  Recent Photos                  │
│  ┌───────┐ ┌───────┐ ┌───────┐  │
│  │       │ │       │ │       │  │
│  │ 4.3 ★ │ │ 4.1 ★ │ │ 3.9 ★ │  │
│  └───────┘ └───────┘ └───────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 📋 Active: Golden hour... │  │
│  │ [Shoot for this →]        │  │
│  └───────────────────────────┘  │
│                                 │
│                           [📷]  │  ← FAB
├─────────────────────────────────┤
│ [Home] [Practice] [Mentor] [⚙]  │
└─────────────────────────────────┘
```

### Camera (via FAB)

```
┌─────────────────────────────────┐
│ [✕]              [Assignment] ⓘ │
├─────────────────────────────────┤
│                                 │
│     │           │               │
│ ────┼───────────┼────           │
│     │           │               │
│     │  (live    │               │
│     │  preview) │               │
│     │           │               │
│ ────┼───────────┼────           │
│     │           │               │
│                                 │
├─────────────────────────────────┤
│  "Move left for better framing" │  ← Live cue (Phase 4)
├─────────────────────────────────┤
│                                 │
│         [ ◉ Capture ]           │
│                                 │
│   [Ask Iris]                    │
└─────────────────────────────────┘
```

### Critique Sheet

```
┌─────────────────────────────────┐
│ ─────────── (drag to dismiss)   │
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │      [Photo preview]      │  │
│  │                           │  │
│  └───────────────────────────┘  │
│                                 │
│  Overall: 4.2 ★                 │
│                                 │
│  Composition    ████████░░ 4.3  │
│  Lighting       ███████░░░ 3.8  │
│  Subject        █████████░ 4.5  │
│  Technical      ███████░░░ 4.0  │
│                                 │
│  What went well                 │
│  • Strong leading lines guide   │
│    the eye to the subject       │
│  • Good use of negative space   │
│                                 │
│  Try next time                  │
│  • Watch for slight horizon     │
│    tilt — level it in post      │
│                                 │
│  [Discard]           [Save ✓]   │
└─────────────────────────────────┘
```

---

*End of specification*
