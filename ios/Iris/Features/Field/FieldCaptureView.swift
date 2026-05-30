import PhotosUI
import SwiftUI
import UIKit

struct FieldCaptureView: View {
    var onAnalyzed: () -> Void
    var onFinished: (() -> Void)?

    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var auth: AuthViewModel
    @StateObject private var camera = CameraSessionModel()
    @StateObject private var liveCoach = LiveFieldCoachModel()

    @State private var analyzing = false
    @State private var analysisCancelled = false
    @State private var analyzeTipIndex = 0
    @State private var errorMessage: String?
    @State private var successMessage: String?
    @State private var lastResult: AnalysisResult?
    @State private var lastCaptureImage: UIImage?
    @State private var showResult = false
    @State private var pickerItem: PhotosPickerItem?
    @State private var tipRotationTask: Task<Void, Never>?

    private let analyzeService = AnalyzeService()
    private let analyzeTips = [
        "Coach compares this frame to your portfolio history.",
        "Glass Box explains why — not just a score.",
        "This can take up to 90 seconds on cellular.",
        "Keep Iris in the foreground while analyzing.",
    ]

    var body: some View {
        VStack(spacing: 0) {
            viewfinder
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .layoutPriority(1)

            VStack(spacing: 12) {
                controls
                if let successMessage {
                    IrisAlertBanner(message: successMessage, style: .success)
                }
                if let errorMessage {
                    IrisAlertBanner(message: errorMessage, style: .error)
                }
                if let coachError = liveCoach.lastError, coachError != errorMessage {
                    IrisAlertBanner(message: coachError, style: .error)
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 12)
            .padding(.bottom, 16)
            .background(Color.irisCanvas)
        }
        .task {
            await startCameraAndCoach()
        }
        .onDisappear {
            Task { await liveCoach.stop(camera: camera) }
            camera.stop()
            tipRotationTask?.cancel()
        }
        .onChange(of: pickerItem) { _, item in
            guard let item else { return }
            Task { await importPhoto(item) }
        }
        .sheet(isPresented: $showResult) {
            if let lastResult {
                CritiqueResultsView(result: lastResult, previewImage: lastCaptureImage) {
                    showResult = false
                    let previewURL = previewFileURL(image: lastCaptureImage, entryId: lastResult.portfolioEntryId)
                    appState.registerNewCapture(lastResult, localPreviewFileURL: previewURL)
                    if appState.activeAssignment != nil {
                        successMessage =
                            "Saved and linked to your practice. Mark complete in Practice when you are done, or take another shot."
                    } else {
                        successMessage = "Saved to your portfolio with a full critique."
                    }
                    onAnalyzed()
                    onFinished?()
                }
                .environmentObject(appState)
                .environmentObject(auth)
                .presentationDetents([.large])
                .presentationDragIndicator(.visible)
                .presentationBackground(Color.irisCanvas)
            }
        }
    }

    @ViewBuilder
    private var viewfinder: some View {
        GeometryReader { geo in
            ZStack(alignment: .topTrailing) {
                Color.irisPhotoBlack

                if CameraSessionModel.isSimulator || camera.permissionDenied {
                    simulatorPlaceholder
                } else if camera.isConfigured {
                    CameraPreviewView(session: camera.session, camera: camera) {
                        liveCoach.onFrameChanged(camera: camera)
                    }
                        .frame(width: geo.size.width, height: geo.size.height)
                        .clipped()
                } else {
                    ProgressView()
                        .tint(Color.irisBrandLight)
                }

                thirdsGrid(in: geo.size)
                    .allowsHitTesting(false)

                if camera.isConfigured, !CameraSessionModel.isSimulator, !camera.permissionDenied, !analyzing {
                    VStack(alignment: .trailing, spacing: 8) {
                        zoomIndicator
                        zoomStepper
                    }
                    .padding(12)
                    .allowsHitTesting(true)
                }

                if analyzing {
                    analyzingOverlay(in: geo.size)
                        .allowsHitTesting(true)
                }
            }
            .overlay(alignment: .bottom) {
                liveCoachOverlay
                    .allowsHitTesting(liveCoach.isCompositionLocked)
                    .padding(.horizontal, 12)
                    .padding(.bottom, 12)
            }
        }
    }

    @ViewBuilder
    private var liveCoachOverlay: some View {
        VStack(spacing: 8) {
            if liveCoach.isCompositionLocked, liveCoach.isEnabled, !analyzing {
                VStack(spacing: 10) {
                    HStack(spacing: 6) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(Color.green)
                        Text("Ready to capture")
                            .font(IrisFont.sans(13, weight: .semibold))
                            .foregroundStyle(Color.irisTextPrimary)
                    }
                    if let hint = liveCoach.hint {
                        Text(hint)
                            .font(IrisFont.sans(13))
                            .foregroundStyle(Color.irisTextPrimary.opacity(0.92))
                            .multilineTextAlignment(.center)
                    }
                    Button("Keep adjusting") {
                        liveCoach.unlockComposition(camera: camera)
                    }
                    .font(IrisFont.sans(12, weight: .semibold))
                    .foregroundStyle(Color.irisBrandLight)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 12)
                .frame(maxWidth: .infinity)
                .background(Color.black.opacity(0.78))
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(Color.green.opacity(0.65), lineWidth: 1.5)
                )
            } else if liveCoach.isFetching, liveCoach.isEnabled {
                HStack(spacing: 6) {
                    ProgressView()
                        .scaleEffect(0.75)
                        .tint(Color.irisBrandLight)
                    Text("Coach looking…")
                        .font(IrisFont.sans(11, weight: .medium))
                        .foregroundStyle(Color.irisTextPrimary)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(Color.black.opacity(0.55))
                .clipShape(Capsule())
            } else if let hint = liveCoach.hint, liveCoach.isEnabled, !analyzing {
                Text(hint)
                    .font(IrisFont.sans(14, weight: .medium))
                    .foregroundStyle(Color.irisTextPrimary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .frame(maxWidth: .infinity)
                    .background(Color.black.opacity(0.72))
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .stroke(Color.irisBrand.opacity(0.45), lineWidth: 1)
                    )
            }
        }
    }

    private var zoomStepper: some View {
        HStack(spacing: 8) {
            Button {
                camera.stepZoom(by: -0.5)
                liveCoach.onFrameChanged(camera: camera)
            } label: {
                Image(systemName: "minus")
                    .font(.system(size: 13, weight: .bold))
                    .frame(width: 32, height: 32)
                    .background(Color.black.opacity(0.55))
                    .clipShape(Circle())
            }
            .accessibilityLabel("Zoom out")

            Button {
                camera.stepZoom(by: 0.5)
                liveCoach.onFrameChanged(camera: camera)
            } label: {
                Image(systemName: "plus")
                    .font(.system(size: 13, weight: .bold))
                    .frame(width: 32, height: 32)
                    .background(Color.black.opacity(0.55))
                    .clipShape(Circle())
            }
            .accessibilityLabel("Zoom in")
        }
        .foregroundStyle(Color.irisTextPrimary)
    }

    private var zoomIndicator: some View {
        Text(camera.zoomLabel)
            .font(IrisFont.sans(12, weight: .semibold))
            .foregroundStyle(Color.irisTextPrimary)
            .monospacedDigit()
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(Color.black.opacity(0.55))
            .clipShape(Capsule())
            .overlay(
                Capsule()
                    .stroke(Color.white.opacity(0.2), lineWidth: 1)
            )
            .accessibilityLabel("Zoom \(camera.zoomLabel)")
    }

    private func analyzingOverlay(in size: CGSize) -> some View {
        Color.irisCanvas.opacity(0.92)
        .frame(width: size.width, height: size.height)
        .overlay {
            VStack(spacing: 14) {
                ProgressView()
                    .tint(Color.irisBrandLight)
                    .scaleEffect(1.2)
                Text("Analyzing your shot…")
                    .font(IrisFont.sans(15, weight: .semibold))
                    .foregroundStyle(Color.irisTextPrimary)
                Text(analyzeTips[analyzeTipIndex % analyzeTips.count])
                    .font(IrisFont.sans(13))
                    .foregroundStyle(Color.irisTextMuted)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 20)
                Button("Cancel") {
                    cancelAnalysis()
                }
                .font(IrisFont.sans(14, weight: .semibold))
                .foregroundStyle(Color.irisBrandLight)
            }
        }
    }

    private var simulatorPlaceholder: some View {
        VStack(spacing: 8) {
            Image(systemName: "photo.on.rectangle.angled")
                .font(.title)
                .foregroundStyle(Color.irisBrandLight)
            Text("Simulator — tap Gallery below")
                .font(IrisFont.sans(12))
                .foregroundStyle(Color.irisTextMuted)
        }
    }

    private var controls: some View {
        VStack(spacing: 12) {
            if !CameraSessionModel.isSimulator, camera.isConfigured {
                HStack {
                    Toggle(isOn: Binding(
                        get: { liveCoach.isEnabled },
                        set: { liveCoach.setEnabled($0, camera: camera, auth: auth, appState: appState) }
                    )) {
                        Text("Live coach")
                            .font(IrisFont.sans(13, weight: .medium))
                            .foregroundStyle(Color.irisTextPrimary)
                    }
                    .tint(Color.irisBrand)
                    Spacer()
                    if let status = liveCoach.statusMessage {
                        Text(status)
                            .font(IrisFont.sans(11))
                            .foregroundStyle(Color.irisTextMuted)
                            .lineLimit(2)
                            .multilineTextAlignment(.trailing)
                    }
                }
            }

            Button {
                Task { await captureAndAnalyze() }
            } label: {
                HStack(spacing: 12) {
                    ZStack {
                        Circle()
                            .strokeBorder(Color.irisOnBrand.opacity(0.35), lineWidth: 2)
                            .frame(width: 40, height: 40)
                        Image(systemName: "camera.fill")
                            .font(.body.weight(.semibold))
                            .foregroundStyle(Color.irisOnBrand)
                    }
                    Text("Shutter · Capture")
                        .font(IrisFont.sans(14, weight: .bold))
                        .tracking(0.4)
                }
                .foregroundStyle(Color.irisOnBrand)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(analyzing ? Color.irisBrand.opacity(0.45) : Color.irisBrand)
                .clipShape(Capsule())
                .shadow(color: Color.irisBrand.opacity(0.28), radius: 14, y: 4)
            }
            .disabled(analyzing || (!CameraSessionModel.isSimulator && !camera.isConfigured))
            .accessibilityLabel("Capture and analyze")

            if liveCoach.isEnabled, liveCoach.isSessionActive, !CameraSessionModel.isSimulator {
                IrisSecondaryButton(
                    title: liveCoach.isFetching ? "Coach thinking…" : "Ask Iris",
                    icon: "sparkles",
                    disabled: analyzing || liveCoach.isFetching
                ) {
                    Task { await liveCoach.askIrisNow() }
                }
            }

            PhotosPicker(selection: $pickerItem, matching: .images) {
                HStack(spacing: 8) {
                    Image(systemName: "photo.on.rectangle")
                    Text("Gallery")
                        .font(IrisFont.sans(14, weight: .medium))
                }
                .foregroundStyle(Color.irisTextPrimary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(Color.irisSurface2)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(Color.irisWarmBorder, lineWidth: 1)
                )
            }
            .disabled(analyzing)
        }
    }

    private func thirdsGrid(in size: CGSize) -> some View {
        let w = size.width
        let h = size.height
        return Path { p in
            p.move(to: CGPoint(x: w / 3, y: 0))
            p.addLine(to: CGPoint(x: w / 3, y: h))
            p.move(to: CGPoint(x: 2 * w / 3, y: 0))
            p.addLine(to: CGPoint(x: 2 * w / 3, y: h))
            p.move(to: CGPoint(x: 0, y: h / 3))
            p.addLine(to: CGPoint(x: w, y: h / 3))
            p.move(to: CGPoint(x: 0, y: 2 * h / 3))
            p.addLine(to: CGPoint(x: w, y: 2 * h / 3))
        }
        .stroke(Color.white.opacity(0.28), lineWidth: 1)
        .frame(width: w, height: h)
    }

    private func startCameraAndCoach() async {
        guard !CameraSessionModel.isSimulator else { return }

        auth.ensureDemoUserId()
        await camera.prepare()
        guard camera.isConfigured else {
            if let msg = camera.errorMessage {
                errorMessage = msg
            }
            return
        }

        camera.start()
        for _ in 0 ..< 50 {
            if camera.isRunning { break }
            try? await Task.sleep(nanoseconds: 100_000_000)
        }

        guard camera.isRunning else {
            errorMessage = "Camera didn’t start. Close Shoot and try again."
            return
        }

        await liveCoach.start(camera: camera, auth: auth, appState: appState)
    }

    private func captureAndAnalyze() async {
        if CameraSessionModel.isSimulator {
            errorMessage = "Use Gallery on the simulator."
            return
        }
        liveCoach.pause()
        do {
            let raw = try await camera.captureJPEG()
            lastCaptureImage = UIImage(data: raw)
            await uploadForAnalysis(imageData: raw)
        } catch {
            if !analysisCancelled {
                errorMessage = friendlyNetworkMessage(error)
            }
            if liveCoach.isEnabled, liveCoach.isSessionActive {
                liveCoach.resume(camera: camera)
            }
        }
    }

    private func importPhoto(_ item: PhotosPickerItem) async {
        defer { pickerItem = nil }
        guard let data = try? await item.loadTransferable(type: Data.self) else {
            errorMessage = "Could not load image."
            return
        }
        liveCoach.pause()
        lastCaptureImage = UIImage(data: data)
        await uploadForAnalysis(imageData: data)
    }

    private func uploadForAnalysis(imageData: Data) async {
        errorMessage = nil
        successMessage = nil
        analysisCancelled = false
        analyzing = true
        analyzeTipIndex = 0
        liveCoach.pause()
        startTipRotation()
        defer {
            analyzing = false
            tipRotationTask?.cancel()
            if liveCoach.isEnabled, liveCoach.isSessionActive {
                liveCoach.resume(camera: camera)
            }
        }

        APIClient.shared.userId = auth.userId.isEmpty ? nil : auth.userId

        do {
            if appState.activeAssignment == nil {
                try? await appState.refreshActiveAssignment()
            }
            let jpeg = ImageUploadPrep.jpegForUpload(from: imageData, maxEdge: 960, quality: 0.75)
            let assignmentId = appState.effectiveAssignmentIdForShoot()
            let result = try await analyzeService.analyzePhoto(
                imageData: jpeg,
                assignmentId: assignmentId
            )
            guard !analysisCancelled else { return }
            lastResult = result
            showResult = true
        } catch {
            guard !analysisCancelled else { return }
            errorMessage = friendlyNetworkMessage(error)
        }
    }

    private func startTipRotation() {
        tipRotationTask?.cancel()
        tipRotationTask = Task { @MainActor in
            while !Task.isCancelled, analyzing, !analysisCancelled {
                try? await Task.sleep(nanoseconds: 8_000_000_000)
                if analyzing, !analysisCancelled {
                    analyzeTipIndex += 1
                }
            }
        }
    }

    private func cancelAnalysis() {
        analysisCancelled = true
        analyzing = false
        tipRotationTask?.cancel()
        if liveCoach.isEnabled, liveCoach.isSessionActive {
            liveCoach.resume(camera: camera)
        }
    }

    private func previewFileURL(image: UIImage?, entryId: String) -> URL? {
        guard let image, let data = image.jpegData(compressionQuality: 0.85) else { return nil }
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("iris-preview-\(entryId).jpg")
        do {
            try data.write(to: url)
            return url
        } catch {
            return nil
        }
    }

    private func friendlyNetworkMessage(_ error: Error) -> String {
        let ns = error as NSError
        if ns.domain == NSURLErrorDomain, ns.code == NSURLErrorNetworkConnectionLost {
            return "Connection dropped during analysis. Retry; disable VPN; keep the app in foreground."
        }
        if ns.domain == NSURLErrorDomain, ns.code == NSURLErrorTimedOut {
            return "Analysis timed out — Coach can take up to 2 minutes."
        }
        return error.localizedDescription
    }
}
