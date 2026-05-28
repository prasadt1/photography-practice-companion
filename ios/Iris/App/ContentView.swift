import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @EnvironmentObject private var appState: AppState
    @ObservedObject private var network = NetworkMonitor.shared

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            TabView(selection: $appState.selectedTab) {
                HomeView()
                    .tag(AppTab.home)
                    .tabItem {
                        Label("Home", systemImage: "house.fill")
                    }

                PracticeView()
                    .tag(AppTab.practice)
                    .tabItem {
                        Label("Practice", systemImage: "target")
                    }
                    .badge(appState.proposedAssignmentCount)

                MentorView()
                    .tag(AppTab.mentor)
                    .tabItem {
                        Label("Mentor", systemImage: "bubble.left.and.text.bubble.right")
                    }

                SettingsView()
                    .tag(AppTab.settings)
                    .tabItem {
                        Label("Settings", systemImage: "gearshape")
                    }
            }
            .tint(Color.irisBrand)

            if appState.showsShootFAB {
                IrisFAB {
                    appState.openShoot()
                }
                .padding(.trailing, 20)
                .padding(
                    .bottom,
                    appState.selectedTab == .mentor
                        ? IrisFABMetrics.bottomInsetAboveComposer
                        : IrisFABMetrics.bottomInsetStandard
                )
            }
        }
        .overlay(alignment: .top) {
            VStack(spacing: 0) {
                if !network.isOnline {
                    OfflineBanner()
                }
                if let banner = appState.bannerMessage {
                    APIBanner(message: banner)
                }
            }
            .animation(.easeInOut(duration: 0.25), value: appState.bannerMessage)
            .animation(.easeInOut(duration: 0.25), value: network.isOnline)
        }
        .fullScreenCover(isPresented: $appState.showShootFlow) {
            ShootFlowView()
                .environmentObject(appState)
                .environmentObject(auth)
        }
    }
}

private struct OfflineBanner: View {
    var body: some View {
        Text("You're offline — shoot and chat need a connection.")
            .font(IrisFont.sans(12, weight: .medium))
            .foregroundStyle(Color.irisTextPrimary)
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .frame(maxWidth: .infinity)
            .background(Color.irisRose.opacity(0.25))
            .overlay(
                Rectangle()
                    .frame(height: 1)
                    .foregroundStyle(Color.irisRose.opacity(0.4)),
                alignment: .bottom
            )
    }
}

private struct APIBanner: View {
    let message: String

    var body: some View {
        Text(message)
            .font(IrisFont.sans(12, weight: .medium))
            .foregroundStyle(Color.irisTextPrimary)
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .frame(maxWidth: .infinity)
            .background(
                message.contains("OK")
                    ? Color.irisBrand.opacity(0.2)
                    : Color.orange.opacity(0.2)
            )
            .overlay(
                Rectangle()
                    .frame(height: 1)
                    .foregroundStyle(Color.irisWarmBorder),
                alignment: .bottom
            )
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthViewModel())
        .environmentObject(AppState())
}
