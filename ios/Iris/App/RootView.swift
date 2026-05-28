import SwiftUI

struct RootView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @EnvironmentObject private var appState: AppState

    var body: some View {
        Group {
            switch auth.phase {
            case .loading:
                loadingGate
            case .signIn:
                SignInView()
            case .persona:
                PersonaOnboardingView()
            case .ready:
                ContentView()
            }
        }
        .animation(.easeInOut(duration: 0.25), value: auth.phase)
    }

    private var loadingGate: some View {
        VStack(spacing: 16) {
            ProgressView()
                .tint(Color.irisBrandLight)
                .scaleEffect(1.2)
            Text("Iris")
                .font(IrisFont.serif(28))
                .foregroundStyle(Color.irisTextPrimary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.irisCanvas)
    }
}
