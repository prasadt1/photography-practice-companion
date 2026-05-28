import AVFoundation
import UIKit

enum CameraSessionError: LocalizedError {
    case unavailable
    case permissionDenied
    case captureFailed

    var errorDescription: String? {
        switch self {
        case .unavailable: return "Camera not available on this device."
        case .permissionDenied: return "Camera permission denied. Use “Choose photo” instead."
        case .captureFailed: return "Could not capture photo."
        }
    }
}

/// AVFoundation session for rear-camera preview + still capture.
@MainActor
final class CameraSessionModel: NSObject, ObservableObject {
    @Published private(set) var isConfigured = false
    @Published private(set) var isRunning = false
    @Published private(set) var permissionDenied = false
    @Published var errorMessage: String?

    let session = AVCaptureSession()
    private let photoOutput = AVCapturePhotoOutput()
    private let sessionQueue = DispatchQueue(label: "iris.camera.session")
    private var captureContinuation: CheckedContinuation<Data, Error>?

    static var isSimulator: Bool {
        #if targetEnvironment(simulator)
        true
        #else
        false
        #endif
    }

    func prepare() async {
        guard !Self.isSimulator else { return }

        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            break
        case .notDetermined:
            let granted = await AVCaptureDevice.requestAccess(for: .video)
            if !granted {
                permissionDenied = true
                return
            }
        default:
            permissionDenied = true
            return
        }

        await configureSession()
    }

    func start() {
        guard isConfigured, !isRunning else { return }
        sessionQueue.async { [weak self] in
            self?.session.startRunning()
            Task { @MainActor in
                self?.isRunning = true
            }
        }
    }

    func stop() {
        guard isRunning else { return }
        sessionQueue.async { [weak self] in
            self?.session.stopRunning()
            Task { @MainActor in
                self?.isRunning = false
            }
        }
    }

    func captureJPEG() async throws -> Data {
        try await withCheckedThrowingContinuation { continuation in
            sessionQueue.async { [weak self] in
                guard let self else {
                    continuation.resume(throwing: CameraSessionError.captureFailed)
                    return
                }
                Task { @MainActor in
                    self.captureContinuation = continuation
                }
                let settings = AVCapturePhotoSettings(format: [AVVideoCodecKey: AVVideoCodecType.jpeg])
                self.photoOutput.capturePhoto(with: settings, delegate: self)
            }
        }
    }

    private func configureSession() async {
        await withCheckedContinuation { (done: CheckedContinuation<Void, Never>) in
            sessionQueue.async { [weak self] in
                guard let self else {
                    done.resume()
                    return
                }
                self.session.beginConfiguration()
                self.session.sessionPreset = .photo

                defer {
                    self.session.commitConfiguration()
                    Task { @MainActor in
                        self.isConfigured = self.session.inputs.isEmpty == false
                        done.resume()
                    }
                }

                guard
                    let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
                    let input = try? AVCaptureDeviceInput(device: device),
                    self.session.canAddInput(input)
                else {
                    Task { @MainActor in
                        self.errorMessage = CameraSessionError.unavailable.localizedDescription
                    }
                    return
                }
                self.session.addInput(input)

                guard self.session.canAddOutput(self.photoOutput) else { return }
                self.session.addOutput(self.photoOutput)
            }
        }
    }
}

extension CameraSessionModel: AVCapturePhotoCaptureDelegate {
    nonisolated func photoOutput(
        _ output: AVCapturePhotoOutput,
        didFinishProcessingPhoto photo: AVCapturePhoto,
        error: Error?
    ) {
        Task { @MainActor in
            defer { captureContinuation = nil }
            guard let continuation = captureContinuation else { return }
            if let error {
                continuation.resume(throwing: error)
                return
            }
            guard let data = photo.fileDataRepresentation() else {
                continuation.resume(throwing: CameraSessionError.captureFailed)
                return
            }
            continuation.resume(returning: data)
        }
    }
}
