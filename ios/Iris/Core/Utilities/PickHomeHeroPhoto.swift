import Foundation

enum PickHomeHeroPhoto {
    private static let tieEpsilon = 0.4

    /// Highest score wins; heuristics only break near-ties (matches web).
    static func pick(
        strongest: PortfolioListItem?,
        candidates: [PortfolioListItem]
    ) -> PortfolioListItem? {
        let pool = candidates.filter { !$0.imageUrl.isEmpty && $0.overallAverage > 0 }
        guard !pool.isEmpty else { return strongest }

        let best = pool.max { a, b in
            let scoreDiff = a.overallAverage - b.overallAverage
            if abs(scoreDiff) > tieEpsilon { return scoreDiff < 0 }
            return heuristicBonus(a) < heuristicBonus(b)
        }
        return best ?? strongest
    }

    private static func heuristicBonus(_ photo: PortfolioListItem) -> Double {
        var bonus = 0.0
        let tags = (photo.aestheticTags ?? []).map { $0.lowercased() }
        let desc = (photo.sceneDescription ?? "").lowercased()

        if tags.contains(where: { ["golden_hour", "sunset", "tropical_sunset", "backlit"].contains($0) }) {
            bonus += 2
        }
        if tags.contains("landscape"), !desc.contains("vertical") { bonus += 1 }
        if desc.contains("wide-angle") || desc.contains("wide angle") { bonus += 1 }
        if desc.contains("glacier") { bonus -= 4 }
        if desc.range(of: #"\bvertical\b"#, options: .regularExpression) != nil,
           desc.range(of: #"\b(photograph|landscape|portrait)\b"#, options: .regularExpression) != nil {
            bonus -= 2
        }
        return bonus
    }
}
