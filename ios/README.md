# Iris — iOS (SwiftUI)

**Display name:** Iris · **Bundle ID:** `com.prasadtilloo.practicecompanion`

Mobile Iris per **`docs/ios-product-spec.md`**: Home · Practice · Mentor · Settings + **Shoot FAB**. Shares Cloud Run API with web.

| Phase | Status |
|-------|--------|
| **0** | Tab shell, API client, Practice propose/accept/complete |
| **1** | Shoot FAB → camera/gallery → `analyze-photo` (assignment optional) |
| **1.5** | Home: trends, recent photos, active practice card |
| **2** | Practice: propose/accept/complete, Shoot for this |
| **2.5** | Mentor chat (`POST /api/v1/agent/chat`) |
| **3** | Firebase Google Sign-In + persona onboarding |
| **A** | Decline, reflection sheet, persona in Settings, app icon, offline banner |
| **3.5+** | Live Field Coach — see `docs/ios-product-spec.md` |

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

## Sign-in & persona (Phase 3)

**First launch:** Sign in with Google **or** Continue in demo mode → choose **Hobbyist** or **Working pro** → main app.

### Enable Google Sign-In (one-time)

1. Firebase Console → project **practice-companion-hackathon** → add **iOS app** with bundle ID `com.prasadtilloo.practicecompanion`.  
2. Download **`GoogleService-Info.plist`** → save as **`ios/GoogleService-Info.plist`** (same folder as `Iris.xcodeproj`).  
   Then run `cd ios && xcodegen generate` — no drag-and-drop needed.  
   Template: `ios/GoogleService-Info.plist.example`  
   **Or in Xcode:** Project navigator (folder icon) → **File → Add Files to "Iris"…** → pick the plist → **Copy items if needed** + target **Iris** only.  
3. Open `ios/Iris/Info.plist` → replace `com.googleusercontent.apps.REPLACE_WITH_REVERSED_CLIENT_ID` with the **`REVERSED_CLIENT_ID`** value from your plist (URL Types → URL Schemes).  
4. Enable **Google** provider under Firebase Authentication.  
5. `cd ios && xcodegen generate` → build in Xcode.

Without the plist, the app still runs in **demo mode** (same as web without Firebase env).

### Demo / developer

- **Continue in demo mode** on sign-in (server `DEMO_USER_ID` when configured).  
- In demo, **Settings → Developer** still allows pasting a Firebase uid to match web portfolio.

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

## UI (web parity — warm gallery)

Dark **canvas** + **amber** brand, serif titles, bordered cards, score bars, and Glass Box tabs — aligned with `frontend/src/index.css`. Not yet: spatial overlays, radar chart, full “How to Fix” tab (web Studio).

## Shoot (Phase 1)

1. Tap **Shoot** (amber FAB) from Home, Practice, or Mentor — no assignment required.  
2. Shutter (device) or **Gallery** (simulator).  
3. Analyze overlay with tips + **Cancel** (~30–90s).  
4. Critique sheet → optional link to active practice via `assignment_id`.

## Home / Mentor (1.5 / 2.5)

- **Home:** progress from `/portfolio/trends`, recent photos, active practice card, link to web portfolio.  
- **Mentor:** real chat with local message history + server `sessionId`.  
- **Practice:** badge for proposed count; **Shoot for this** on active assignment.

## Next steps

- [ ] Test Google sign-in on physical iPhone (optional for demo)
- [ ] Record demo: [`docs/ios-demo-video-script.md`](../docs/ios-demo-video-script.md)
- [ ] Custom fonts (Newsreader + DM Sans)
- [ ] Live Field Coach (Phase 3.5+)

---

## Regenerate project

After editing `project.yml` or adding Swift files:

```bash
cd ios && xcodegen generate
```

---

## Xcode warnings and device errors

### “All interface orientations must be supported…” / “launch storyboard must be provided…”

`project.yml` sets a generated launch screen, portrait-only iPhone orientations, and `UIRequiresFullScreen`. After pulling changes, run `xcodegen generate`, then **Product → Clean Build Folder** (⇧⌘K) and build again.

### `dyld_shared_cache_extract_dylibs failed` (Code 908)

This is an **Xcode ↔ device symbols** issue, not your Swift code. The app often still installs; the debugger fails to attach.

Try in order:

1. **Simulator first** (iPhone 16) to confirm the build is fine.  
2. On the physical iPhone: unplug/replug, unlock, trust the Mac, **Developer Mode** on.  
3. Xcode → **Window → Devices and Simulators** → select the device → wait for symbol processing to finish.  
4. **Delete Derived Data**: Xcode → Settings → Locations → Derived Data → arrow → delete `Iris-*` folder.  
5. Quit Xcode, run: `rm -rf ~/Library/Developer/Xcode/iOS\ DeviceSupport/*` (forces re-download of device support; slow once).  
6. Reboot the iPhone and Mac if it persists.  
7. Update Xcode to the latest patch for your iOS version.

If run still fails on device: **Product → Run** with debugger detached is not built-in; use **Run without debugging** is not standard — instead try **Release** scheme on device, or use Simulator until symbols finish indexing.

### “Paused Iris on PT iPhone” in `.nasm` / system code

Debugger stopped in Apple framework code — press **Continue** (▶) in Xcode; check the phone for the Iris UI.
