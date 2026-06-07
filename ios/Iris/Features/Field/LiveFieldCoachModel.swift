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
    private var lockReleaseTask: Task<Void, Never>?
    private weak var boundCamera: CameraSessionModel?

    private let minSubmitInterval: TimeInterval = 4.5
    private let samplingInterval: TimeInterval = 6
    private let lockAutoReleaseSeconds: TimeInterval = 45

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
        assignmentBrief = appState.activeAssignment?.brief
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
            lastSubmitAt = nil
            lastError = nil
            isCompositionLocked = false
            statusMessage = "Live coach on — first cue in ~6s."
            beginSampling(on: camera)
        } catch {
            let msg = error.localizedDescription
            statusMessage = "Coach unavailable — \(msg)"
            lastError = msg
            isSessionActive = false
            // Keep session id so re-toggle can retry without orphan sessions piling up.
        }
    }

    func stop(camera: CameraSessionModel) async {
        submitGeneration += 1
        haltSamplingAndSpeech()
        camera.disableFrameSampling()
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

    func resume(camera: CameraSessionModel) {
        guard isEnabled, isSessionActive, sessionId != nil else { return }
        isCompositionLocked = false
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
        lockReleaseTask?.cancel()
        lockReleaseTask = nil
        hint = nil
        statusMessage = "Keep framing — coach will check again."
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

        guard let data = await camera.captureSampleFrameNow() else {
            statusMessage = "Couldn’t grab a frame — try again."
            lastError = statusMessage
            return
        }
        await submitFrame(data, force: true)
    }

    private func haltSamplingAndSpeech() {
        inFlight = false
        isFetching = false
        isCompositionLocked = false
        hint = nil
        speaker.stop()
        boundCamera?.disableFrameSampling()
        lockReleaseTask?.cancel()
        lockReleaseTask = nil
    }

    private func beginSampling(on camera: CameraSessionModel) {
        guard camera.isRunning, !isCompositionLocked else { return }
        boundCamera = camera
        camera.enableFrameSampling(interval: samplingInterval) { [weak self] data in
            Task { @MainActor [weak self] in
                await self?.handleSampledFrame(data)
            }
        }
    }

    private func handleSampledFrame(_ data: Data) async {
        guard isEnabled, isSessionActive, !inFlight, !isCompositionLocked else { return }
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

        if cue.readyToCapture || shouldTreatAsReady(cue, text: text) {
            enterCompositionLock(cue: cue, text: text)
            return
        }

        if let lastCueText, lastCueText == text,
           let lastCueAt, Date().timeIntervalSince(lastCueAt) < 15 {
            return
        }

        lastCueText = text
        lastCueAt = Date()
        hint = text
        statusMessage = nil
        speaker.speak(cue.spokenCue)
    }

    private func shouldTreatAsReady(_ cue: FieldCaptureCueResponse, text: String) -> Bool {
        guard cue.confidence >= 0.8 else { return false }
        let combined = (text + " " + cue.spokenCue).lowercased()
        let readyWords = ["shoot", "ready", "locked", "good frame", "capture now", "take the shot"]
        return readyWords.contains { combined.contains($0) }
    }

    private func enterCompositionLock(cue: FieldCaptureCueResponse, text: String) {
        isCompositionLocked = true
        boundCamera?.disableFrameSampling()
        lastCueText = text
        lastCueAt = Date()
        hint = text
        statusMessage = "Composition set — tap Shutter"
        let spoken = cue.spokenCue.trimmingCharacters(in: .whitespacesAndNewlines)
        speaker.speak(spoken.isEmpty ? "Good frame. Shoot when ready." : spoken)

        lockReleaseTask?.cancel()
        lockReleaseTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: UInt64((self?.lockAutoReleaseSeconds ?? 45) * 1_000_000_000))
            guard let self, !Task.isCancelled, self.isCompositionLocked,
                  let camera = self.boundCamera else { return }
            await MainActor.run {
                self.unlockComposition(camera: camera)
            }
        }
    }
}
