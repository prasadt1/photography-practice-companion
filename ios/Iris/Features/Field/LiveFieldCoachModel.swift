import Foundation

@MainActor
final class LiveFieldCoachModel: ObservableObject {
    @Published var hint: String?
    @Published var isFetching = false
    @Published var isSessionActive = false
    @Published var statusMessage: String?
    @Published var isEnabled: Bool
    @Published var lastError: String?
    @Published private(set) var isCompositionLocked = false

    private let service = FieldCoachService()
    private let speaker = CueSpeaker()
    private var sessionId: String?
    private var assignmentBrief: String?
    private var persona = "hobbyist"
    private var inFlight = false
    private var isStarting = false
    private var lastCueText: String?
    private var lastCueAt: Date?
    private var lastSubmitAt: Date?
    private var submitGeneration = 0
    private var samplingTask: Task<Void, Never>?
    private var consecutiveFrameFailures = 0
    private weak var boundCamera: CameraSessionModel?

    // Coaching cadence — slows down after each delivered cue so the coach feels
    // helpful early, then quiet while the user steadies the frame.
    private let baseSamplingInterval: TimeInterval = 3.5
    private let minSubmitInterval: TimeInterval = 3.0
    private var currentSamplingInterval: TimeInterval = 3.5
    private let maxSamplingInterval: TimeInterval = 10

    // Graduation: stop nagging and declare the frame shootable.
    private var cuesThisAttempt = 0
    private var nearReadyStreak = 0
    private var lastCueCategory: String?
    private var lastCategoryAt: Date?
    private var postCaptureGraceUntil: Date?
    private let maxCuesBeforeGraduation = 5
    private let nearReadyStreakToLock = 2
    private let duplicateCueWindow: TimeInterval = 35
    private let sameCategoryQuietWindow: TimeInterval = 45
    private let postCaptureGraceSeconds: TimeInterval = 12

    init() {
        isEnabled = AppConfig.liveCoachEnabled
    }

    func setEnabled(
        _ enabled: Bool,
        camera: CameraSessionModel,
        auth: AuthViewModel? = nil,
        appState: AppState? = nil
    ) {
        guard isEnabled != enabled else { return }
        isEnabled = enabled
        AppConfig.liveCoachEnabled = enabled
        submitGeneration += 1

        if enabled {
            statusMessage = "Live coach on"
            if isSessionActive {
                resume(camera: camera)
            } else if let auth, let appState {
                Task { await start(camera: camera, auth: auth, appState: appState) }
            }
        } else {
            haltSamplingAndSpeech()
            statusMessage = "Coach off — pinch and shoot still work."
        }
    }

    func start(
        camera: CameraSessionModel,
        auth: AuthViewModel,
        appState: AppState
    ) async {
        guard !isStarting else { return }
        if isSessionActive, sessionId != nil {
            resume(camera: camera)
            return
        }

        auth.ensureDemoUserId()
        boundCamera = camera
        persona = auth.persona == "working_pro" ? "working_pro" : "hobbyist"
        assignmentBrief = await appState.assignmentBriefForShoot()
        APIClient.shared.userId = auth.userId.isEmpty ? nil : auth.userId

        guard !CameraSessionModel.isSimulator else { return }

        if !NetworkMonitor.shared.isOnline {
            statusMessage = "Offline — rule-of-thirds grid only."
            lastError = statusMessage
            isSessionActive = false
            return
        }

        guard isEnabled else {
            statusMessage = "Coach off — toggle on below."
            isSessionActive = false
            return
        }

        isStarting = true
        defer { isStarting = false }

        do {
            let session = try await service.createSession(
                persona: persona,
                assignmentId: appState.effectiveAssignmentIdForShoot()
            )
            sessionId = session.sessionId
            isSessionActive = true
            resetFramingAttempt()
            lastError = nil
            statusMessage = "Live coach on — first cue in ~2s."
            speaker.prepare()
            beginSampling(on: camera)
        } catch {
            let msg = error.localizedDescription
            statusMessage = "Coach unavailable — \(msg)"
            lastError = msg
            isSessionActive = false
        }
    }

    func stop(camera: CameraSessionModel) async {
        submitGeneration += 1
        haltSamplingAndSpeech()
        if let sessionId {
            try? await service.endSession(sessionId: sessionId)
        }
        self.sessionId = nil
        isSessionActive = false
        isStarting = false
        boundCamera = nil
    }

    func pause() {
        submitGeneration += 1
        haltSamplingAndSpeech()
    }

    /// Resume after capture/analysis — brief grace so the coach doesn't immediately nag again.
    func resume(camera: CameraSessionModel) {
        guard isEnabled, isSessionActive, sessionId != nil else { return }
        isCompositionLocked = false
        resetFramingAttempt()
        postCaptureGraceUntil = Date().addingTimeInterval(postCaptureGraceSeconds)
        statusMessage = "Frame when ready — coach waits a moment."
        beginSampling(on: camera)
    }

    /// Camera recovered after an interruption / media-services reset — resume frame sampling.
    func onCameraRecovered(camera: CameraSessionModel) {
        guard isEnabled, isSessionActive, sessionId != nil, !isCompositionLocked else { return }
        guard camera.isRunning else { return }
        statusMessage = "Camera back — coaching resumes."
        beginSampling(on: camera)
    }

    /// User changed zoom or focus — re-open coaching if we had locked composition.
    func onFrameChanged(camera: CameraSessionModel) {
        guard isCompositionLocked else { return }
        unlockComposition(camera: camera)
    }

    func unlockComposition(camera: CameraSessionModel) {
        guard isCompositionLocked else { return }
        isCompositionLocked = false
        resetFramingAttempt()
        hint = nil
        statusMessage = "Adjusting — one cue at a time."
        beginSampling(on: camera)
    }

    func askIrisNow() async {
        guard isEnabled, isSessionActive, let camera = boundCamera else { return }
        if isCompositionLocked {
            unlockComposition(camera: camera)
        }
        guard !inFlight else {
            statusMessage = "Coach still thinking…"
            return
        }

        isFetching = true
        defer { if !inFlight { isFetching = false } }

        do {
            let data = try await camera.captureCoachFrame()
            await submitFrame(data, force: true)
        } catch {
            statusMessage = "Couldn’t grab a frame — try again."
            lastError = statusMessage
        }
    }

    private func resetFramingAttempt() {
        cuesThisAttempt = 0
        nearReadyStreak = 0
        lastCueCategory = nil
        lastCategoryAt = nil
        lastCueText = nil
        lastCueAt = nil
        currentSamplingInterval = baseSamplingInterval
    }

    private func haltSamplingAndSpeech() {
        inFlight = false
        isFetching = false
        isCompositionLocked = false
        hint = nil
        speaker.stop()
        stopSampling()
        postCaptureGraceUntil = nil
        consecutiveFrameFailures = 0
        resetFramingAttempt()
    }

    private func stopSampling() {
        samplingTask?.cancel()
        samplingTask = nil
    }

    private func beginSampling(on camera: CameraSessionModel) {
        guard camera.isRunning, !isCompositionLocked else { return }
        boundCamera = camera
        stopSampling()
        samplingTask = Task { @MainActor [weak self] in
            while !Task.isCancelled {
                guard let self else { return }
                let wait = self.currentSamplingInterval
                try? await Task.sleep(nanoseconds: UInt64(wait * 1_000_000_000))
                guard !Task.isCancelled else { return }
                await self.coachTick(camera: camera)
            }
        }
    }

    private func coachTick(camera: CameraSessionModel) async {
        guard isEnabled, isSessionActive, !inFlight, !isCompositionLocked else { return }
        if let grace = postCaptureGraceUntil, Date() < grace { return }
        if let lastSubmitAt, Date().timeIntervalSince(lastSubmitAt) < minSubmitInterval { return }

        if !camera.isRunning {
            await camera.ensureRunning()
            return
        }

        do {
            let data = try await camera.captureCoachFrame()
            consecutiveFrameFailures = 0
            await handleSampledFrame(data)
        } catch {
            consecutiveFrameFailures += 1
            if consecutiveFrameFailures >= 2 {
                await camera.ensureRunning()
                consecutiveFrameFailures = 0
                statusMessage = "Camera recovering — coach will retry."
            }
        }
    }

    private func handleSampledFrame(_ data: Data) async {
        guard isEnabled, isSessionActive, !inFlight, !isCompositionLocked else { return }
        if let grace = postCaptureGraceUntil, Date() < grace { return }
        if let lastSubmitAt, Date().timeIntervalSince(lastSubmitAt) < minSubmitInterval {
            return
        }
        await submitFrame(data)
    }

    private func submitFrame(_ data: Data, force: Bool = false) async {
        guard let sessionId, isEnabled, isSessionActive else { return }
        guard !inFlight || force else { return }

        if !force, let lastSubmitAt, Date().timeIntervalSince(lastSubmitAt) < minSubmitInterval {
            return
        }

        inFlight = true
        isFetching = true
        let generation = submitGeneration

        defer {
            if generation == submitGeneration {
                inFlight = false
                isFetching = false
            }
        }

        do {
            let cue = try await service.submitFrame(
                sessionId: sessionId,
                imageData: data,
                persona: persona,
                assignmentBrief: assignmentBrief
            )
            guard generation == submitGeneration, isEnabled, isSessionActive else { return }
            lastSubmitAt = Date()
            lastError = nil
            applyCue(cue)
        } catch let error as APIClientError {
            guard generation == submitGeneration else { return }
            let msg = error.localizedDescription
            lastError = msg
            if case let .httpStatus(code, _) = error, code == 429 {
                statusMessage = "Coach pacing — hold steady."
                lastSubmitAt = Date()
            } else if msg.contains("couldn't read the frame") || msg.contains("temporarily unavailable") {
                statusMessage = msg + " Retrying…"
                lastSubmitAt = Date()
            } else {
                statusMessage = msg
            }
        } catch {
            guard generation == submitGeneration else { return }
            let msg = error.localizedDescription
            statusMessage = msg
            lastError = msg
        }
    }

    private func applyCue(_ cue: FieldCaptureCueResponse) {
        let text = cue.onScreenHint.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }

        let spoken = cue.spokenCue.trimmingCharacters(in: .whitespacesAndNewlines)
        let combined = (text + " " + spoken).lowercased()
        let category = Self.cueCategory(for: combined)

        if cue.readyToCapture || shouldTreatAsReady(cue, text: text, spoken: spoken) {
            enterCompositionLock(
                spoken: spoken.isEmpty ? "Good frame — shoot now." : spoken,
                hint: text.isEmpty ? "Tap Shutter" : text
            )
            return
        }

        if cuesThisAttempt >= maxCuesBeforeGraduation {
            enterCompositionLock(
                spoken: "You're close enough — shoot and we'll refine after.",
                hint: "Good enough — tap Shutter"
            )
            return
        }

        if isDuplicateCue(text: text, combined: combined) {
            bumpNearReadyIfStable(cue: cue, combined: combined)
            if nearReadyStreak >= nearReadyStreakToLock {
                enterCompositionLock(
                    spoken: "Frame looks steady — shoot when you're ready.",
                    hint: "Ready — tap Shutter"
                )
            }
            return
        }

        if let lastCueCategory, let lastCategoryAt, category == lastCueCategory,
           Date().timeIntervalSince(lastCategoryAt) < sameCategoryQuietWindow {
            bumpNearReadyIfStable(cue: cue, combined: combined)
            if nearReadyStreak >= nearReadyStreakToLock {
                enterCompositionLock(
                    spoken: "You've got it — shoot now.",
                    hint: "Locked — tap Shutter"
                )
            }
            return
        }

        updateNearReadyStreak(cue: cue, combined: combined)

        if nearReadyStreak >= nearReadyStreakToLock {
            enterCompositionLock(
                spoken: "Looking good — tap shutter when ready.",
                hint: "Ready — tap Shutter"
            )
            return
        }

        if cue.confidence >= 0.86, !Self.containsFixImperative(combined) {
            enterCompositionLock(
                spoken: spoken.isEmpty ? "Strong frame — shoot now." : spoken,
                hint: text.isEmpty ? "Tap Shutter" : text
            )
            return
        }

        cuesThisAttempt += 1
        lastCueText = text
        lastCueAt = Date()
        lastCueCategory = category
        lastCategoryAt = Date()
        hint = text
        statusMessage = nil
        speaker.speak(spoken.isEmpty ? text : spoken)
        slowDownSampling()
    }

    private func bumpNearReadyIfStable(cue: FieldCaptureCueResponse, combined: String) {
        if cue.confidence >= 0.72, !Self.containsFixImperative(combined) {
            nearReadyStreak += 1
        } else if cue.confidence >= 0.78 {
            nearReadyStreak += 1
        }
    }

    private func updateNearReadyStreak(cue: FieldCaptureCueResponse, combined: String) {
        if Self.containsReadyLanguage(combined) || (!Self.containsFixImperative(combined) && cue.confidence >= 0.75) {
            nearReadyStreak += 1
        } else if cue.confidence < 0.65 {
            nearReadyStreak = 0
        }
    }

    private func isDuplicateCue(text: String, combined: String) -> Bool {
        guard let lastCueText, let lastCueAt else { return false }
        guard Date().timeIntervalSince(lastCueAt) < duplicateCueWindow else { return false }
        if lastCueText.caseInsensitiveCompare(text) == .orderedSame { return true }
        return Self.normalizedTokens(lastCueText).intersection(Self.normalizedTokens(text)).count >= 2
            && Self.cueCategory(for: combined) == Self.cueCategory(for: lastCueText.lowercased())
    }

    private func slowDownSampling() {
        currentSamplingInterval = min(maxSamplingInterval, currentSamplingInterval + 2)
        if let camera = boundCamera, !isCompositionLocked {
            beginSampling(on: camera)
        }
    }

    private func shouldTreatAsReady(_ cue: FieldCaptureCueResponse, text: String, spoken: String) -> Bool {
        let combined = (text + " " + spoken).lowercased()
        if Self.containsReadyLanguage(combined) { return true }
        if cue.confidence >= 0.88 { return true }
        if cue.confidence >= 0.82, !Self.containsFixImperative(combined) { return true }
        return false
    }

    private func enterCompositionLock(spoken: String, hint: String) {
        isCompositionLocked = true
        stopSampling()
        lastCueText = hint
        lastCueAt = Date()
        self.hint = hint
        statusMessage = "Composition set — tap Shutter"
        speaker.speak(spoken)
    }

    // MARK: - Cue text helpers

    private static func normalizedTokens(_ text: String) -> Set<String> {
        Set(
            text.lowercased()
                .components(separatedBy: CharacterSet.alphanumerics.inverted)
                .filter { $0.count > 2 }
        )
    }

    private static func containsReadyLanguage(_ text: String) -> Bool {
        let readyWords = [
            "shoot", "ready", "locked", "good frame", "capture now", "take the shot",
            "tap shutter", "looks good", "strong frame", "well composed", "nice frame",
        ]
        return readyWords.contains { text.contains($0) }
    }

    private static func containsFixImperative(_ text: String) -> Bool {
        let fixWords = [
            "move", "step", "tilt", "try", "adjust", "shift", "rotate", "closer", "farther",
            "back up", "left", "right", "level the", "lower", "raise", "crop", "reframe",
        ]
        return fixWords.contains { text.contains($0) }
    }

    private static func cueCategory(for text: String) -> String {
        if text.contains("closer") || text.contains("move in") || text.contains("step forward") {
            return "closer"
        }
        if text.contains("back") || text.contains("farther") || text.contains("wider") {
            return "farther"
        }
        if text.contains("level") || text.contains("horizon") || text.contains("tilt") || text.contains("straight") {
            return "level"
        }
        if text.contains("light") || text.contains("shadow") || text.contains("exposure") || text.contains("bright") {
            return "light"
        }
        if text.contains("third") || text.contains("center") || text.contains("subject") || text.contains("off-center") {
            return "placement"
        }
        if containsReadyLanguage(text) || text.contains("hold") || text.contains("steady") {
            return "ready"
        }
        return "general"
    }
}
