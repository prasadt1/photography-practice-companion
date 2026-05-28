import SwiftUI

/// Full-screen capture → analyze → critique (Phase 1 FAB flow).
struct ShootFlowView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var auth: AuthViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    if let assignment = contextualAssignment {
                        assignmentBanner(assignment)
                    } else {
                        Text("Open shoot — saves to your portfolio with a full critique.")
                            .font(IrisFont.sans(13))
                            .foregroundStyle(Color.irisTextMuted)
                    }
                    FieldCaptureView {
                        appState.notifyPortfolioChanged()
                        Task {
                            try? await appState.refreshAssignmentsSnapshot()
                        }
                    } onFinished: {
                        dismiss()
                        appState.closeShoot()
                    }
                }
                .padding(.horizontal)
                .padding(.bottom, 24)
            }
            .irisScreen()
            .navigationTitle("Shoot")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Color.irisCanvas, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") {
                        dismiss()
                        appState.closeShoot()
                    }
                    .foregroundStyle(Color.irisBrandLight)
                }
            }
        }
        .preferredColorScheme(.dark)
    }

    private var contextualAssignment: Assignment? {
        if let id = appState.shootAssignmentId {
            guard appState.activeAssignment?.id == id else { return nil }
            return appState.activeAssignment
        }
        return appState.activeAssignment
    }

    private func assignmentBanner(_ assignment: Assignment) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            IrisSectionLabel(text: "Linked to practice")
            Text(assignment.brief)
                .font(IrisFont.sans(14))
                .foregroundStyle(Color.irisTextPrimary.opacity(0.92))
                .lineSpacing(3)
                .lineLimit(3)
        }
        .irisCard(borderBrand: true)
    }
}
