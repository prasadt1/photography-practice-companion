import SwiftUI

/// ISAR-style reflection after marking an assignment complete (web Practice parity).
struct ReflectionSheet: View {
    let reflection: ReflectionResult
    var onDismiss: () -> Void

    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var speechReader: SpeechReader

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    HStack {
                        IrisSectionLabel(text: "Reflection complete")
                        Spacer()
                        VoiceoverButton(
                            speechId: "practice-reflection",
                            text: reflection.summary,
                            label: "reflection summary"
                        )
                    }
                    IrisMarkdownText(
                        markdown: reflection.summary,
                        font: IrisFont.sans(15),
                        foreground: Color.irisTextPrimary.opacity(0.92)
                    )

                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Text("Skill progress")
                                .font(IrisFont.sans(14, weight: .semibold))
                                .foregroundStyle(Color.irisTextPrimary)
                            Spacer()
                            deltaLabel(reflection.skillDelta.delta)
                        }
                        Text(reflection.skillDelta.metric)
                            .font(IrisFont.sans(12))
                            .foregroundStyle(Color.irisTextMuted)
                        HStack(spacing: 16) {
                            statBlock(
                                title: "Baseline",
                                value: reflection.skillDelta.baselineValue
                            )
                            statBlock(
                                title: "Practice",
                                value: reflection.skillDelta.currentValue
                            )
                        }
                    }
                    .irisCard(borderBrand: true)

                    HStack(spacing: 8) {
                        Image(systemName: reflection.appliedBrief ? "checkmark.circle.fill" : "circle")
                            .foregroundStyle(
                                reflection.appliedBrief ? Color.irisBrandLight : Color.irisTextMuted
                            )
                        Text(
                            reflection.appliedBrief
                                ? "You applied the assignment brief in your practice shots."
                                : "Brief not clearly applied yet — keep practicing this focus."
                        )
                        .font(IrisFont.sans(13))
                        .foregroundStyle(Color.irisTextMuted)
                    }

                    if let baseline = reflection.baselinePhotoCount,
                       let practice = reflection.practicePhotoCount {
                        Text("Compared \(baseline) baseline photo(s) with \(practice) practice shot(s).")
                            .font(IrisFont.sans(12))
                            .foregroundStyle(Color.irisTextMuted)
                    }

                    IrisPrimaryButton(title: "Done", icon: "checkmark") {
                        onDismiss()
                        dismiss()
                    }
                }
                .padding()
            }
            .background(Color.irisCanvas)
            .navigationTitle("Assignment reflection")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") {
                        onDismiss()
                        dismiss()
                    }
                    .foregroundStyle(Color.irisBrandLight)
                }
            }
        }
        .preferredColorScheme(.dark)
        .onDisappear {
            speechReader.stop()
        }
    }

    private func statBlock(title: String, value: Double) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(IrisFont.sans(11, weight: .medium))
                .foregroundStyle(Color.irisTextMuted)
            Text(String(format: "%.1f", value))
                .font(IrisFont.sans(18, weight: .bold))
                .foregroundStyle(Color.irisBrandLight)
                .monospacedDigit()
        }
    }

    private func deltaLabel(_ delta: Double) -> some View {
        let sign = delta >= 0 ? "+" : ""
        let color: Color = delta > 0.4 ? .irisBrandLight : (delta < -0.4 ? .irisRose : .irisTextMuted)
        return Text("\(sign)\(String(format: "%.1f", delta))")
            .font(IrisFont.sans(14, weight: .bold))
            .foregroundStyle(color)
            .monospacedDigit()
    }
}
