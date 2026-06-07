import Foundation

enum PickHomeHeroPhoto {
    /// Prefer golden-hour landscapes that read well full-bleed (matches web `pickHomeHeroPhoto.ts`).
    static func pick(
        strongest: PortfolioListItem?,
        candidates: [PortfolioListItem]
    ) -> PortfolioListItem? {
        let pool = candidates.filter { !$0.imageUrl.isEmpty && $0.overallAverage > 0 }
        guard !pool.isEmpty else { return strongest }

        let best = pool.max { rank($0) < rank($1) }
        return best ?? strongest
    }

    private static func rank(_ photo: PortfolioListItem) -> Double {
        var score = photo.overallAverage * 10
        let tags = (photo.aestheticTags ?? []).map { $0.lowercased() }
        let desc = (photo.sceneDescription ?? "").lowercased()

        if tags.contains(where: { ["golden_hour", "sunset", "tropical_sunset", "backlit"].contains($0) }) {
            score += 8
        }
        if tags.contains("landscape"), !desc.contains("vertical") { score += 3 }
        if desc.contains("wide-angle") || desc.contains("wide angle") { score += 2 }
        if desc.contains("glacier") { score -= 12 }
        if desc.range(of: #"\bvertical\b"#, options: .regularExpression) != nil,
           desc.range(of: #"\b(photograph|landscape|portrait)\b"#, options: .regularExpression) != nil {
            score -= 6
        }
        return score
    }
}
