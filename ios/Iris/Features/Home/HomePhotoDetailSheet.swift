import SwiftUI

struct HomePhotoDetailSheet: View {
    let entry: PortfolioListItem
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    AsyncImage(url: URL(string: entry.imageUrl)) { phase in
                        switch phase {
                        case .success(let image):
                            image
                                .resizable()
                                .scaledToFit()
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        default:
                            ProgressView()
                                .frame(maxWidth: .infinity, minHeight: 200)
                        }
                    }
                    HStack {
                        Text("Overall")
                            .font(IrisFont.sans(16, weight: .semibold))
                        Spacer()
                        Text(String(format: "%.1f", entry.overallAverage))
                            .font(IrisFont.serif(28))
                            .foregroundStyle(Color.irisBrandLight)
                    }
                    IrisScoreBar(title: "Composition", score: entry.scores.composition)
                    IrisScoreBar(title: "Lighting", score: entry.scores.lighting)
                    IrisScoreBar(title: "Technique", score: entry.scores.technique)
                    if let summary = entry.glassBoxSummary?.first, !summary.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            IrisSectionLabel(text: "Glass Box")
                            Text(summary)
                                .font(IrisFont.sans(14))
                                .foregroundStyle(Color.irisTextPrimary.opacity(0.9))
                                .lineSpacing(3)
                        }
                    }
                }
                .padding()
            }
            .background(Color.irisCanvas)
            .navigationTitle("Photo")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(Color.irisBrandLight)
                }
            }
        }
        .preferredColorScheme(.dark)
    }
}
