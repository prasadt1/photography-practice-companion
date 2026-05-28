import SwiftUI

struct SignInView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @State private var signingIn = false

    var body: some View {
        ZStack {
            Color.irisCanvas.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 28) {
                    Spacer(minLength: 40)
                    VStack(spacing: 12) {
                        Image(systemName: "camera.aperture")
                            .font(.system(size: 48))
                            .foregroundStyle(Color.irisBrandLight)
                        Text("Iris")
                            .font(IrisFont.serif(36))
                            .foregroundStyle(Color.irisTextPrimary)
                        Text("Your AI photography mentor with perfect memory.")
                            .font(IrisFont.sans(15))
                            .foregroundStyle(Color.irisTextMuted)
                            .multilineTextAlignment(.center)
                            .lineSpacing(3)
                            .padding(.horizontal, 8)
                    }

                    if let authError = auth.authError {
                        IrisAlertBanner(message: authError, style: .error)
                    }

                    if IrisPlatform.isSimulator {
                        simulatorGoogleNote
                    }

                    VStack(spacing: 12) {
                        if auth.isFirebaseAvailable, !IrisPlatform.isSimulator {
                            IrisPrimaryButton(
                                title: signingIn ? "Signing in…" : "Sign in with Google",
                                icon: "g.circle.fill",
                                disabled: signingIn
                            ) {
                                Task {
                                    signingIn = true
                                    defer { signingIn = false }
                                    await auth.signInWithGoogle()
                                }
                            }
                        } else if auth.isFirebaseAvailable, IrisPlatform.isSimulator {
                            IrisSecondaryButton(
                                title: "Sign in with Google (use a real iPhone)",
                                icon: "iphone",
                                disabled: true
                            ) {}
                        } else {
                            VStack(alignment: .leading, spacing: 8) {
                                IrisSectionLabel(text: "Google sign-in")
                                Text(
                                    "Add GoogleService-Info.plist from your Firebase project to the Iris target, then add the URL scheme from REVERSED_CLIENT_ID in Info.plist (see ios/README.md)."
                                )
                                .font(IrisFont.sans(13))
                                .foregroundStyle(Color.irisTextMuted)
                                .lineSpacing(2)
                            }
                            .irisCard()
                        }

                        IrisSecondaryButton(title: "Continue in demo mode", icon: "person.crop.circle") {
                            auth.continueInDemoMode()
                        }
                    }

                    Spacer(minLength: 24)
                }
                .padding(.horizontal, 24)
            }
        }
        .preferredColorScheme(.dark)
    }

    private var simulatorGoogleNote: some View {
        VStack(alignment: .leading, spacing: 8) {
            IrisSectionLabel(text: "Simulator")
            Text(
                "Google sign-in often shows a passkey QR code that stalls when you scan it from your phone. That is a Simulator limitation, not Iris. Run the app on your physical iPhone (Xcode → your device), or tap Continue in demo mode below."
            )
            .font(IrisFont.sans(13))
            .foregroundStyle(Color.irisTextMuted)
            .lineSpacing(2)
        }
        .irisCard()
    }
}
