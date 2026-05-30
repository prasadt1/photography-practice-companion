import SwiftUI
import UIKit

@main
struct IrisApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var auth = AuthViewModel()
    @StateObject private var appState = AppState()

    init() {
        _ = FirebaseBootstrap.configureIfPossible()
        IrisTabBarAppearance.apply()
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(auth)
                .environmentObject(appState)
                .preferredColorScheme(.dark)
                .onOpenURL { url in
                    _ = auth.handleOpenURL(url)
                }
                .task {
                    auth.bootstrap()
                }
                .task {
                    await appState.checkAPIHealth(auth: auth)
                }
        }
    }
}

enum IrisTabBarAppearance {
    static func apply() {
        let appearance = UITabBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor(Color.irisCanvas)
        appearance.shadowColor = UIColor(Color.irisWarmBorder)

        let item = UITabBarItemAppearance()
        item.normal.iconColor = UIColor(Color.irisTextMuted)
        item.normal.titleTextAttributes = [.foregroundColor: UIColor(Color.irisTextMuted)]
        item.selected.iconColor = UIColor(Color.irisBrand)
        item.selected.titleTextAttributes = [.foregroundColor: UIColor(Color.irisBrand)]
        appearance.stackedLayoutAppearance = item
        appearance.inlineLayoutAppearance = item
        appearance.compactInlineLayoutAppearance = item

        UITabBar.appearance().standardAppearance = appearance
        UITabBar.appearance().scrollEdgeAppearance = appearance
    }
}
