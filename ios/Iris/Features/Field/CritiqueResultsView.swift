import SwiftUI

/// Post-capture critique — warm gallery sheet aligned with web Studio / Glass Box.
struct CritiqueResultsView: View {
    let result: AnalysisResult
    let previewImage: UIImage?
    let onDone: () -> Void

    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var auth: AuthViewModel
    @State private var tab = 0
    @State private var completing = false
    @State private var completeError: String?
    @State private var reflectionPresentation: ReflectionPresentation?
    @Environment(\.dismiss) private var dismiss

    private var hasFixes: Bool {
        !(result.glassBox?.priorityFixes?.isEmpty ?? true)
    }

    private var tabLabels: [String] {
        hasFixes ? ["Overview", "Glass Box", "How to fix"] : ["Overview", "Glass Box"]
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    header
                    if let previewImage {
                        Image(uiImage: previewImage)
                            .resizable()
                            .scaledToFit()
                            .frame(maxHeight: 220)
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .stroke(Color.irisWarmBorder, lineWidth: 1)
                            )
                    }
                    IrisTabPicker(selection: $tab, labels: tabLabels)
                    Group {
                        switch tab {
                        case 0: overviewTab
                        case 1: glassBoxTab
                        default: fixTab
                        }
                    }
                    if appState.activeAssignment != nil {
                        IrisPrimaryButton(
                            title: completing ? "Completing…" : "Mark assignment complete",
                            icon: "checkmark.circle",
                            disabled: completing
                        ) {
                            Task { await markComplete() }
                        }
                    }
                    if let completeError {
                        IrisAlertBanner(message: completeError, style: .error)
                    }
                }
                .padding()
            }
            .background(Color.irisCanvas)
            .navigationTitle("Your critique")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Color.irisCanvas, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        onDone()
                        dismiss()
                    }
                    .fontWeight(.semibold)
                    .foregroundStyle(Color.irisBrandLight)
                }
            }
        }
        .preferredColorScheme(.dark)
        .sheet(item: $reflectionPresentation) { item in
            ReflectionSheet(reflection: item.reflection) {
                reflectionPresentation = nil
                onDone()
                dismiss()
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .center) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(String(format: "%.1f", result.scores.average))
                        .font(IrisFont.serif(36))
                        .foregroundStyle(Color.irisTextPrimary)
                    Text("Average · out of 10")
                        .font(IrisFont.sans(12))
                        .foregroundStyle(Color.irisTextMuted)
                }
                Spacer()
                IrisSkillBadge(average: result.scores.average)
            }

            if let headline = result.critique?.headline {
                Text(headline)
                    .font(IrisFont.serif(18))
                    .foregroundStyle(Color.irisTextPrimary)
                    .lineSpacing(4)
                    .fixedSize(horizontal: false, vertical: true)
            } else if let first = result.glassBox?.observations?.first, !first.isEmpty {
                Text(first)
                    .font(IrisFont.sans(14))
                    .foregroundStyle(Color.irisTextMuted)
                    .lineSpacing(3)
                    .lineLimit(3)
            }
        }
    }

    private var overviewTab: some View {
        VStack(alignment: .leading, spacing: 14) {
            IrisScoreBar(title: "Composition", score: result.scores.composition)
            IrisScoreBar(title: "Lighting", score: result.scores.lighting)
            IrisScoreBar(title: "Technique", score: result.scores.technique)
            IrisScoreBar(title: "Creativity", score: result.scores.creativity)
            IrisScoreBar(title: "Subject impact", score: result.scores.subjectImpact)

            if let scene = result.sceneDescription, !scene.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    IrisSectionLabel(text: "What I see")
                    Text(scene)
                        .font(IrisFont.sans(14))
                        .foregroundStyle(Color.irisTextPrimary.opacity(0.9))
                        .lineSpacing(4)
                }
                .irisCard()
            }

            if let tags = result.aestheticTags, !tags.isEmpty {
                FlowLayout(spacing: 8) {
                    ForEach(tags, id: \.self) { tag in
                        Text(tag.replacingOccurrences(of: "_", with: " "))
                            .font(IrisFont.sans(11, weight: .medium))
                            .foregroundStyle(Color.irisBrandLight)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(Color.irisBrand.opacity(0.15))
                            .clipShape(Capsule())
                    }
                }
            }
        }
    }

    private var glassBoxTab: some View {
        VStack(alignment: .leading, spacing: 12) {
            if let observations = result.glassBox?.observations, !observations.isEmpty {
                ForEach(Array(observations.enumerated()), id: \.offset) { index, obs in
                    HStack(alignment: .top, spacing: 10) {
                        Text("\(index + 1)")
                            .font(IrisFont.sans(11, weight: .bold))
                            .foregroundStyle(Color.irisOnBrand)
                            .frame(width: 22, height: 22)
                            .background(Color.irisBrand)
                            .clipShape(Circle())
                        Text(obs)
                            .font(IrisFont.sans(14))
                            .foregroundStyle(Color.irisTextPrimary)
                            .lineSpacing(3)
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.irisSurface2)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
            }

            if let steps = result.glassBox?.reasoningSteps, !steps.isEmpty {
                IrisSectionLabel(text: "Reasoning")
                ForEach(Array(steps.enumerated()), id: \.offset) { _, step in
                    Text(step)
                        .font(IrisFont.sans(13))
                        .foregroundStyle(Color.irisTextMuted)
                        .padding(.vertical, 2)
                }
            }
        }
    }

    private var fixTab: some View {
        VStack(alignment: .leading, spacing: 12) {
            if let fixes = result.glassBox?.priorityFixes {
                ForEach(Array(fixes.enumerated()), id: \.offset) { _, fix in
                    VStack(alignment: .leading, spacing: 6) {
                        Text((fix.severity ?? "tip").uppercased())
                            .font(IrisFont.sans(10, weight: .bold))
                            .foregroundStyle(severityColor(fix.severity))
                        Text(fix.issue ?? "")
                            .font(IrisFont.sans(14))
                            .foregroundStyle(Color.irisTextPrimary)
                            .lineSpacing(3)
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.irisSurface2)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
            } else {
                Text("No priority fixes in this response.")
                    .font(IrisFont.sans(13))
                    .foregroundStyle(Color.irisTextMuted)
            }
        }
    }

    private func severityColor(_ severity: String?) -> Color {
        switch severity?.lowercased() {
        case "critical": return Color.irisRose
        case "moderate": return Color.orange
        default: return Color.irisBrandLight
        }
    }

    private func markComplete() async {
        guard let id = appState.activeAssignment?.id ?? result.assignmentId else { return }
        completing = true
        completeError = nil
        defer { completing = false }
        APIClient.shared.userId = auth.userId.isEmpty ? nil : auth.userId
        do {
            let response = try await PracticeService().completeAssignment(id: id)
            try await appState.refreshActiveAssignment()
            appState.dismissShootBanner()
            appState.notifyPortfolioChanged()
            reflectionPresentation = ReflectionPresentation(reflection: response.reflection)
        } catch {
            completeError = error.localizedDescription
        }
    }
}

private struct ReflectionPresentation: Identifiable {
    let id = UUID()
    let reflection: ReflectionResult
}

/// Simple tag flow layout (no FlowLayout in older SwiftUI).
private struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = arrange(proposal: proposal, subviews: subviews)
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = arrange(proposal: proposal, subviews: subviews)
        for (index, origin) in result.origins.enumerated() {
            subviews[index].place(at: CGPoint(x: bounds.minX + origin.x, y: bounds.minY + origin.y), proposal: .unspecified)
        }
    }

    private func arrange(proposal: ProposedViewSize, subviews: Subviews) -> (size: CGSize, origins: [CGPoint]) {
        let maxWidth = proposal.width ?? .infinity
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0
        var origins: [CGPoint] = []

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxWidth, x > 0 {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            origins.append(CGPoint(x: x, y: y))
            rowHeight = max(rowHeight, size.height)
            x += size.width + spacing
        }

        return (CGSize(width: maxWidth, height: y + rowHeight), origins)
    }
}
