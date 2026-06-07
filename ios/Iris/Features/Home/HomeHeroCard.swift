import SwiftUI

struct HomeHeroCard: View {
    let photo: PortfolioListItem
    let portfolioTotal: Int
    let memberSince: String?
    var onTap: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            ZStack(alignment: .topTrailing) {
                AsyncImage(url: URL(string: photo.imageUrl)) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFill()
                    default:
                        Color.irisSurface2
                            .overlay {
                                ProgressView()
                                    .tint(Color.irisBrandLight)
                            }
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: 220)
                .clipped()

                scoreBadge
                    .padding(12)
            }

            VStack(alignment: .leading, spacing: 12) {
                IrisSectionLabel(text: "Best in your library")

                Text(photo.sceneDescription ?? "Your photograph")
                    .font(IrisFont.serif(20))
                    .foregroundStyle(Color.irisTextPrimary)
                    .lineLimit(3)
                    .fixedSize(horizontal: false, vertical: true)

                if let summary = photo.glassBoxSummary?.first, !summary.isEmpty {
                    Text(summary)
                        .font(IrisFont.sans(13))
                        .foregroundStyle(Color.irisTextMuted)
                        .lineLimit(2)
                        .padding(.leading, 10)
                        .overlay(alignment: .leading) {
                            Rectangle()
                                .fill(Color.irisBrand.opacity(0.45))
                                .frame(width: 2)
                        }
                }

                Text(memberLine)
                    .font(IrisFont.sans(11))
                    .foregroundStyle(Color.irisTextMuted)

                if let tags = photo.aestheticTags?.prefix(4), !tags.isEmpty {
                    FlowLayoutTags(tags: Array(tags))
                }

                Button(action: onTap) {
                    Text("View critique")
                        .font(IrisFont.sans(13, weight: .semibold))
                        .foregroundStyle(Color.irisBrandLight)
                }
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.irisSurface1)
        }
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(Color.irisWarmBorder, lineWidth: 1)
        )
    }

    private var scoreBadge: some View {
        HStack(alignment: .firstTextBaseline, spacing: 2) {
            Text(String(format: "%.1f", photo.overallAverage))
                .font(IrisFont.serif(22, weight: .bold))
            Text("/ 10")
                .font(IrisFont.sans(10, weight: .semibold))
                .opacity(0.75)
        }
        .foregroundStyle(Color.irisOnBrand)
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(Color.irisBrand)
        .clipShape(Capsule())
    }

    private var memberLine: String {
        var parts = ["\(portfolioTotal) photo\(portfolioTotal == 1 ? "" : "s")"]
        if let memberSince, !memberSince.isEmpty {
            parts.append("Member since \(memberSince)")
        }
        return parts.joined(separator: " · ")
    }
}

private struct FlowLayoutTags: View {
    let tags: [String]

    var body: some View {
        HStack(spacing: 6) {
            ForEach(tags, id: \.self) { tag in
                Text(tag.replacingOccurrences(of: "_", with: " "))
                    .font(IrisFont.sans(11))
                    .foregroundStyle(Color.irisTextMuted)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.irisCanvas)
                    .clipShape(Capsule())
                    .overlay(Capsule().stroke(Color.irisWarmBorder.opacity(0.6), lineWidth: 1))
            }
        }
    }
}
