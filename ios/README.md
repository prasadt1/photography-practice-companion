# Iris — iOS (SwiftUI)

**Display name:** Iris · **Bundle ID:** `com.prasadtilloo.practicecompanion`

Native **viewfinder companion** for Field / Practice — shares the Cloud Run API with web.

| Phase | Status |
|-------|--------|
| **0** (this scaffold) | Tab shell, API client, assignments list, Field placeholder |
| **1** | AVFoundation capture → `POST /api/v1/analyze-photo` |
| **2** | Backend `field_capture` + `capture_sessions` |
| **3** | Live Field Coach |

Full iOS roadmap: local `docs/ios-implementation-plan.md` (private; see root `.gitignore`).

---

## Prerequisites

- **Mac** with **Xcode 15+** (full app, not Command Line Tools only)
- Apple Developer account (for device / TestFlight)
- Same Firebase project as web (Phase 0.5)

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

---

## Open the project

```bash
cd ios
brew install xcodegen   # once
xcodegen generate       # regenerates Iris.xcodeproj from project.yml
open Iris.xcodeproj
```

1. Select the **Iris** scheme → iPhone simulator or your device  
2. **Signing & Capabilities** → set your **Team**  
3. Run (⌘R)

---

## API configuration

`Config/Debug.xcconfig` and `Release.xcconfig` set:

```text
API_BASE_URL = https://practice-companion-api-l6kusl5xcq-uc.a.run.app
```

Override in Xcode: target **Iris** → Build Settings → `API_BASE_URL`.

---

## Identity (Phase 0)

Web uses Firebase → `X-User-Id` header. Until Firebase iOS is wired:

1. Sign in on **https://practice-companion-hackathon.web.app** (Settings)  
2. Copy your Firebase **uid** from browser devtools or MongoDB `users`  
3. Paste into **Settings → X-User-Id** in the iOS app  

Or tap **Use demo scope** (empty header → server `DEMO_USER_ID` when configured).

---

## Project layout

```text
ios/
  project.yml          # XcodeGen source
  Iris.xcodeproj/      # generated — commit after xcodegen
  Config/              # API_BASE_URL xcconfig
  Iris/
    App/               # IrisApp, ContentView (tabs)
    Core/              # APIClient, models, AuthViewModel, AppState
    Features/          # Field, Practice, Mentor, Settings
    Design/            # irisColors (warm amber)
    Resources/         # Assets.xcassets
```

---

## Verify API from simulator

On launch you should see a brief banner **API OK · phase …** if Cloud Run is reachable.

---

## Next steps (Phase 1)

- [ ] `GoogleService-Info.plist` + Firebase Auth Google sign-in  
- [ ] `AVCaptureSession` in `FieldView`  
- [ ] Multipart upload `AnalyzeService` → `/api/v1/analyze-photo`  
- [ ] App icon: drag `frontend/public/iris-icon-512.png` into `AppIcon`

---

## Regenerate project

After editing `project.yml` or adding Swift files:

```bash
cd ios && xcodegen generate
```
