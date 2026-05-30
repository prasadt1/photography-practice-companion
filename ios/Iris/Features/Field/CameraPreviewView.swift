import AVFoundation
import SwiftUI

struct CameraPreviewView: UIViewRepresentable {
    let session: AVCaptureSession
    @ObservedObject var camera: CameraSessionModel
    var onUserAdjustedFrame: (() -> Void)?

    func makeCoordinator() -> Coordinator {
        Coordinator(camera: camera, onUserAdjustedFrame: onUserAdjustedFrame)
    }

    func makeUIView(context: Context) -> CameraPreviewContainerView {
        let container = CameraPreviewContainerView()
        container.previewView.previewLayer.session = session
        container.previewView.previewLayer.videoGravity = .resizeAspectFill
        container.attachGestures(coordinator: context.coordinator)
        context.coordinator.containerView = container
        context.coordinator.pinchBaseZoom = camera.zoomFactor
        return container
    }

    func updateUIView(_ uiView: CameraPreviewContainerView, context: Context) {
        uiView.previewView.previewLayer.session = session
        context.coordinator.camera = camera
        context.coordinator.onUserAdjustedFrame = onUserAdjustedFrame
        context.coordinator.containerView = uiView
    }

    @MainActor
    final class Coordinator: NSObject {
        var camera: CameraSessionModel
        var onUserAdjustedFrame: (() -> Void)?
        weak var containerView: CameraPreviewContainerView?
        var pinchBaseZoom: CGFloat = 1

        init(camera: CameraSessionModel, onUserAdjustedFrame: (() -> Void)?) {
            self.camera = camera
            self.onUserAdjustedFrame = onUserAdjustedFrame
        }

        private func notifyFrameChanged() {
            onUserAdjustedFrame?()
        }

        @objc func handlePinch(_ recognizer: UIPinchGestureRecognizer) {
            switch recognizer.state {
            case .began:
                pinchBaseZoom = camera.zoomFactor
            case .changed:
                camera.setZoomFactor(pinchBaseZoom * recognizer.scale)
                notifyFrameChanged()
            case .ended, .cancelled:
                pinchBaseZoom = camera.zoomFactor
                notifyFrameChanged()
            default:
                break
            }
        }

        @objc func handleDoubleTap(_: UITapGestureRecognizer) {
            camera.resetZoom()
            pinchBaseZoom = camera.minZoomFactor
            notifyFrameChanged()
        }

        @objc func handleSingleTap(_ recognizer: UITapGestureRecognizer) {
            guard let container = recognizer.view as? CameraPreviewContainerView else { return }
            let point = recognizer.location(in: container)
            let previewLayer = container.previewView.previewLayer
            camera.focus(at: point, previewLayer: previewLayer)
            container.showFocusReticle(at: point)
            notifyFrameChanged()
        }
    }
}

/// Hosts preview layer + pinch / tap-to-focus / double-tap reset on a transparent container.
final class CameraPreviewContainerView: UIView {
    let previewView = PreviewUIView()
    private let focusReticle = FocusReticleView()
    private weak var coordinator: CameraPreviewView.Coordinator?

    override init(frame: CGRect) {
        super.init(frame: frame)
        isUserInteractionEnabled = true
        backgroundColor = .black
        previewView.isUserInteractionEnabled = false
        focusReticle.isUserInteractionEnabled = false
        addSubview(previewView)
        addSubview(focusReticle)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        previewView.frame = bounds
    }

    func showFocusReticle(at point: CGPoint) {
        focusReticle.show(at: point)
    }

    func attachGestures(coordinator: CameraPreviewView.Coordinator) {
        self.coordinator = coordinator
        gestureRecognizers?.forEach { removeGestureRecognizer($0) }

        let pinch = UIPinchGestureRecognizer(
            target: coordinator,
            action: #selector(CameraPreviewView.Coordinator.handlePinch(_:))
        )
        pinch.delegate = self
        addGestureRecognizer(pinch)

        let doubleTap = UITapGestureRecognizer(
            target: coordinator,
            action: #selector(CameraPreviewView.Coordinator.handleDoubleTap(_:))
        )
        doubleTap.numberOfTapsRequired = 2
        doubleTap.delegate = self
        addGestureRecognizer(doubleTap)

        let singleTap = UITapGestureRecognizer(
            target: coordinator,
            action: #selector(CameraPreviewView.Coordinator.handleSingleTap(_:))
        )
        singleTap.numberOfTapsRequired = 1
        singleTap.delegate = self
        singleTap.require(toFail: doubleTap)
        addGestureRecognizer(singleTap)
    }
}

extension CameraPreviewContainerView: UIGestureRecognizerDelegate {
    func gestureRecognizer(
        _ gestureRecognizer: UIGestureRecognizer,
        shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer
    ) -> Bool {
        true
    }
}

final class PreviewUIView: UIView {
    override class var layerClass: AnyClass { AVCaptureVideoPreviewLayer.self }

    var previewLayer: AVCaptureVideoPreviewLayer {
        layer as! AVCaptureVideoPreviewLayer
    }
}

/// Yellow focus square — fades like the system Camera app.
private final class FocusReticleView: UIView {
    private static let size: CGFloat = 76

    override init(frame: CGRect) {
        super.init(frame: CGRect(x: 0, y: 0, width: Self.size, height: Self.size))
        isUserInteractionEnabled = false
        backgroundColor = .clear
        layer.borderColor = UIColor.systemYellow.cgColor
        layer.borderWidth = 1.5
        layer.cornerRadius = 3
        alpha = 0
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    func show(at point: CGPoint) {
        layer.removeAllAnimations()
        center = point
        transform = CGAffineTransform(scaleX: 1.35, y: 1.35)
        alpha = 1

        UIView.animate(
            withDuration: 0.22,
            delay: 0,
            options: [.curveEaseOut, .allowUserInteraction]
        ) {
            self.transform = .identity
        } completion: { _ in
            UIView.animate(
                withDuration: 0.35,
                delay: 0.55,
                options: [.curveEaseIn, .allowUserInteraction]
            ) {
                self.alpha = 0
            }
        }
    }
}
