import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @State private var signingOut = false
    @State private var pendingPersona: String?
    @State private var savingPersona = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Settings")
                            .font(IrisFont.serif(28))
                            .foregroundStyle(Color.irisTextPrimary)
                        Text("Account, persona, and studio links")
                            .font(IrisFont.sans(14))
                            .foregroundStyle(Color.irisTextMuted)
                    }
                    .padding(.top, 8)

                    accountCard
                    personaCard

                    VStack(alignment: .leading, spacing: 12) {
                        IrisSectionLabel(text: "API")
                        Text(AppConfig.apiBaseURL.absoluteString)
                            .font(IrisFont.sans(11))
                            .foregroundStyle(Color.irisTextMuted)
                            .textSelection(.enabled)
                    }
                    .irisCard()

                    if auth.isDemoMode {
                        developerCard
                    }

                    webStudioCard

                    VStack(alignment: .leading, spacing: 8) {
                        IrisSectionLabel(text: "About")
                        row("App", "Iris")
                        row("Persona", auth.persona == "working_pro" ? "Working pro" : "Hobbyist")
                        row("Build", "Phase A — polish")
                    }
                    .irisCard()
                }
                .padding(.horizontal)
                .padding(.bottom, 24)
            }
            .irisScreen()
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Color.irisCanvas, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .alert("Change persona?", isPresented: Binding(
                get: { pendingPersona != nil },
                set: { if !$0 { pendingPersona = nil } }
            )) {
                Button("Cancel", role: .cancel) {
                    pendingPersona = nil
                }
                Button("Change") {
                    guard let mode = pendingPersona else { return }
                    pendingPersona = nil
                    Task {
                        savingPersona = true
                        await auth.updatePersonaSetting(mode)
                        savingPersona = false
                    }
                }
            } message: {
                Text("Mentor chat history will reset so tool routing matches your new path.")
            }
        }
    }

    private var personaCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            IrisSectionLabel(text: "Persona")
            Text("Shapes practice proposals and how Mentor coaches you.")
                .font(IrisFont.sans(13))
                .foregroundStyle(Color.irisTextMuted)
            Picker("Persona", selection: Binding(
                get: { auth.persona },
                set: { newValue in
                    if newValue != auth.persona {
                        pendingPersona = newValue
                    }
                }
            )) {
                Text("Hobbyist").tag("hobbyist")
                Text("Working pro").tag("working_pro")
            }
            .pickerStyle(.segmented)
            .disabled(savingPersona)
            if auth.persona == "working_pro" {
                Text("Triage and print sales: use the web studio link below.")
                    .font(IrisFont.sans(12))
                    .foregroundStyle(Color.irisBrandLight.opacity(0.9))
            }
            if let err = auth.authError {
                Text(err)
                    .font(IrisFont.sans(12))
                    .foregroundStyle(Color.irisRose)
            }
        }
        .irisCard()
    }

    private var accountCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            IrisSectionLabel(text: "Account")
            if auth.isDemoMode {
                Text("Demo scope — server uses DEMO_USER_ID when configured.")
                    .font(IrisFont.sans(13))
                    .foregroundStyle(Color.irisTextMuted)
            } else if let email = auth.email {
                Text(email)
                    .font(IrisFont.sans(14, weight: .medium))
                    .foregroundStyle(Color.irisTextPrimary)
                Text("User id: \(auth.userId)")
                    .font(IrisFont.sans(11))
                    .foregroundStyle(Color.irisTextMuted)
                    .textSelection(.enabled)
            } else {
                Text("Signed in")
                    .font(IrisFont.sans(14))
                    .foregroundStyle(Color.irisTextPrimary)
            }
            IrisSecondaryButton(
                title: signingOut ? "Signing out…" : "Sign out",
                icon: "rectangle.portrait.and.arrow.right",
                disabled: signingOut
            ) {
                Task {
                    signingOut = true
                    await auth.signOut()
                    signingOut = false
                }
            }
        }
        .irisCard()
    }

    private var developerCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            IrisSectionLabel(text: "Developer")
            Text("Optional: paste a Firebase uid to match your web portfolio.")
                .font(IrisFont.sans(13))
                .foregroundStyle(Color.irisTextMuted)
            TextField("X-User-Id (Firebase uid)", text: $auth.userId)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .font(IrisFont.sans(14))
                .foregroundStyle(Color.irisTextPrimary)
                .padding(12)
                .background(Color.irisSurface2)
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
            IrisSecondaryButton(title: "Use demo scope", icon: "person.crop.circle") {
                auth.applyDemoScope()
            }
        }
        .irisCard()
    }

    private var webStudioCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            IrisSectionLabel(text: "Web studio")
            Text("Full portfolio, triage, and print sales live on the web app.")
                .font(IrisFont.sans(13))
                .foregroundStyle(Color.irisTextMuted)
            Link(destination: AppConfig.webAppURL) {
                HStack {
                    Text("Open Iris on web")
                        .font(IrisFont.sans(14, weight: .semibold))
                    Spacer()
                    Image(systemName: "arrow.up.right")
                }
                .foregroundStyle(Color.irisBrandLight)
            }
        }
        .irisCard()
    }

    private func row(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label)
                .font(IrisFont.sans(13))
                .foregroundStyle(Color.irisTextMuted)
            Spacer()
            Text(value)
                .font(IrisFont.sans(13, weight: .medium))
                .foregroundStyle(Color.irisTextPrimary)
        }
    }
}
