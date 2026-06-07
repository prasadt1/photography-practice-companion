import UIKit

@objc(AppDelegate)
final class AppDelegate: NSObject, UIApplicationDelegate {
    override init() {
        super.init()
        _ = FirebaseBootstrap.configureIfPossible()
    }

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        _ = FirebaseBootstrap.configureIfPossible()
        return true
    }
}
