import SwiftUI

struct PersonaOnboardingView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @State private var saving = false

    var body: some View {
        ZStack {
            Color.irisCanvas.ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Choose your path")
                            .font(IrisFont.serif(28))
                            .foregroundStyle(Color.irisTextPrimary)
                        Text("I remember every frame and coach you like a mentor in the darkroom — not a generic chatbot.")
                            .font(IrisFont.sans(14))
                            .foregroundStyle(Color.irisTextMuted)
                            .lineSpacing(3)
                    }
                    .padding(.top, 16)

                    if let authError = auth.authError {
                        IrisAlertBanner(message: authError, style: .error)
                    }

                    personaCard(
                        title: "Hobbyist",
                        icon: "camera.aperture",
                        description: "Critique, practice assignments, and a library that grows with every shoot.",
                        action: "hobbyist"
                    )

                    personaCard(
                        title: "Working pro",
                        icon: "storefront",
                        description: "Portfolio insight and listing drafts — nothing goes live until you approve.",
                        action: "working_pro"
                    )

                    VStack(alignment: .leading, spacing: 8) {
                        IrisSectionLabel(text: "Coming soon")
                        Text("Voice-first field coaching with scene narration — vision accessibility mode.")
                            .font(IrisFont.sans(13))
                            .foregroundStyle(Color.irisTextMuted)
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .overlay(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .strokeBorder(style: StrokeStyle(lineWidth: 1, dash: [6]))
                            .foregroundStyle(Color.irisWarmBorder)
                    )
                    .opacity(0.75)

                    if saving {
                        HStack {
                            Spacer()
                            ProgressView()
                                .tint(Color.irisBrandLight)
                            Text("Saving…")
                                .font(IrisFont.sans(14))
                                .foregroundStyle(Color.irisTextMuted)
                            Spacer()
                        }
                    }
                }
                .padding(.horizontal)
                .padding(.bottom, 32)
            }
        }
        .preferredColorScheme(.dark)
    }

    private func personaCard(
        title: String,
        icon: String,
        description: String,
        action: String
    ) -> some View {
        Button {
            guard !saving else { return }
            saving = true
            Task {
                await auth.completePersonaSelection(action)
                saving = false
            }
        } label: {
            VStack(alignment: .leading, spacing: 12) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundStyle(Color.irisBrandLight)
                Text(title)
                    .font(IrisFont.sans(18, weight: .bold))
                    .foregroundStyle(Color.irisTextPrimary)
                Text(description)
                    .font(IrisFont.sans(14))
                    .foregroundStyle(Color.irisTextMuted)
                    .multilineTextAlignment(.leading)
                    .lineSpacing(2)
                Text("Start as \(title.lowercased()) →")
                    .font(IrisFont.sans(13, weight: .semibold))
                    .foregroundStyle(Color.irisBrandLight)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .irisCard()
        }
        .buttonStyle(.plain)
        .disabled(saving)
    }
}
