import SwiftUI

struct PracticeView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var auth: AuthViewModel

    @State private var assignments: AssignmentsResponse?
    @State private var loading = true
    @State private var errorMessage: String?
    @State private var acting = false
    @State private var reflectionPresentation: ReflectionPresentation?
    @State private var completingReflection = false

    private let practice = PracticeService()

    var body: some View {
        NavigationStack {
            Group {
                if loading {
                    VStack(spacing: 12) {
                        ProgressView()
                            .tint(Color.irisBrandLight)
                        Text("Loading assignments…")
                            .font(IrisFont.sans(14))
                            .foregroundStyle(Color.irisTextMuted)
                    }
                } else if let errorMessage {
                    VStack(spacing: 12) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.largeTitle)
                            .foregroundStyle(Color.irisRose)
                        Text(errorMessage)
                            .font(IrisFont.sans(14))
                            .foregroundStyle(Color.irisTextMuted)
                            .multilineTextAlignment(.center)
                    }
                    .padding()
                } else if let assignments {
                    scrollContent(assignments)
                }
            }
            .irisScreen()
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Color.irisCanvas, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .task(id: auth.userId) { await load() }
            .refreshable { await load() }
            .sheet(item: $reflectionPresentation) { item in
                ReflectionSheet(reflection: item.reflection) {
                    reflectionPresentation = nil
                }
            }
            .overlay {
                if completingReflection {
                    ZStack {
                        Color.irisCanvas.opacity(0.85).ignoresSafeArea()
                        VStack(spacing: 12) {
                            ProgressView()
                                .tint(Color.irisBrandLight)
                            Text("Reflecting on your practice…")
                                .font(IrisFont.sans(14, weight: .medium))
                                .foregroundStyle(Color.irisTextPrimary)
                            Text("This can take up to a minute.")
                                .font(IrisFont.sans(12))
                                .foregroundStyle(Color.irisTextMuted)
                        }
                    }
                }
            }
        }
    }

    private func scrollContent(_ data: AssignmentsResponse) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("My Practice")
                        .font(IrisFont.serif(28))
                        .foregroundStyle(Color.irisTextPrimary)
                    Text("Challenges from your portfolio — accept one, then tap Shoot.")
                        .font(IrisFont.sans(14))
                        .foregroundStyle(Color.irisTextMuted)
                }
                .padding(.top, 8)

                if appState.showShootBanner, let active = appState.activeAssignment ?? data.active.first {
                    PracticeShootBanner(assignment: active) {
                        appState.openShoot(assignmentId: active.id)
                    } onDismiss: {
                        appState.dismissShootBanner()
                    }
                }

                if let active = data.active.first {
                    assignmentCard(active, style: .active) {
                        VStack(spacing: 10) {
                            IrisPrimaryButton(title: "Shoot for this", icon: "camera.fill", disabled: acting) {
                                appState.openShoot(assignmentId: active.id)
                            }
                            IrisSecondaryButton(
                                title: completingReflection ? "Reflecting…" : "Mark complete",
                                icon: "checkmark.circle",
                                disabled: acting || completingReflection
                            ) {
                                Task { await complete(active.id) }
                            }
                        }
                    }
                }

                if !data.proposed.isEmpty {
                    IrisSectionLabel(text: "Proposed")
                    ForEach(data.proposed) { item in
                        assignmentCard(item, style: .proposed) {
                            VStack(spacing: 10) {
                                IrisPrimaryButton(title: "Accept challenge", icon: "sparkles", disabled: acting) {
                                    Task { await accept(item.id) }
                                }
                                Button {
                                    Task { await decline(item.id) }
                                } label: {
                                    Text("Decline")
                                        .font(IrisFont.sans(13, weight: .medium))
                                        .foregroundStyle(Color.irisTextMuted)
                                }
                                .disabled(acting)
                            }
                        }
                    }
                }

                if !data.completed.isEmpty {
                    IrisSectionLabel(text: "Completed")
                    ForEach(data.completed) { item in
                        assignmentCard(item, style: .completed, actions: { EmptyView() })
                    }
                }

                if data.proposed.isEmpty && data.active.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Start a new challenge")
                            .font(IrisFont.sans(16, weight: .semibold))
                            .foregroundStyle(Color.irisTextPrimary)
                        Text("Iris proposes assignments from your weak areas. Accept one, then use Shoot.")
                            .font(IrisFont.sans(13))
                            .foregroundStyle(Color.irisTextMuted)
                        IrisPrimaryButton(
                            title: acting ? "Proposing…" : "Propose new challenge",
                            icon: "wand.and.stars",
                            disabled: acting
                        ) {
                            Task { await proposeNew() }
                        }
                    }
                    .irisCard()
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 88)
        }
    }

    private enum CardStyle { case active, proposed, completed }

    private func assignmentCard<Actions: View>(
        _ a: Assignment,
        style: CardStyle,
        @ViewBuilder actions: () -> Actions
    ) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                if style == .active {
                    IrisSectionLabel(text: "Active")
                } else if style == .proposed {
                    IrisSectionLabel(text: "New")
                }
                Spacer()
                Text(a.targetSkill.replacingOccurrences(of: "_", with: " "))
                    .font(IrisFont.sans(10, weight: .semibold))
                    .foregroundStyle(Color.irisTextMuted)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.irisSurface3)
                    .clipShape(Capsule())
            }
            Text(a.brief)
                .font(IrisFont.sans(14))
                .foregroundStyle(Color.irisTextPrimary.opacity(0.92))
                .lineSpacing(3)
            actions()
        }
        .irisCard(borderBrand: style == .active)
        .opacity(style == .completed ? 0.75 : 1)
    }

    private func load() async {
        loading = assignments == nil
        errorMessage = nil
        defer { loading = false }

        APIClient.shared.userId = auth.userId.isEmpty ? nil : auth.userId
        do {
            assignments = try await practice.fetchAssignments()
            try await appState.refreshAssignmentsSnapshot()
        } catch is CancellationError {
            return
        } catch {
            assignments = nil
            errorMessage = error.localizedDescription
        }
    }

    private func proposeNew() async {
        acting = true
        defer { acting = false }
        do {
            _ = try await practice.proposeAssignment(mode: auth.persona)
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func accept(_ id: String) async {
        acting = true
        defer { acting = false }
        do {
            _ = try await practice.acceptAssignment(id: id)
            try? await appState.refreshActiveAssignment()
            appState.showShootBanner = true
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func decline(_ id: String) async {
        acting = true
        defer { acting = false }
        do {
            _ = try await practice.declineAssignment(id: id)
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func complete(_ id: String) async {
        acting = true
        completingReflection = true
        defer {
            acting = false
            completingReflection = false
        }
        APIClient.shared.userId = auth.userId.isEmpty ? nil : auth.userId
        do {
            let result = try await practice.completeAssignment(id: id)
            try await appState.refreshAssignmentsSnapshot()
            appState.dismissShootBanner()
            appState.notifyPortfolioChanged()
            reflectionPresentation = ReflectionPresentation(reflection: result.reflection)
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

private struct ReflectionPresentation: Identifiable {
    let id = UUID()
    let reflection: ReflectionResult
}
