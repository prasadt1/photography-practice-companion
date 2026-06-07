import Foundation

struct AnalysisScores: Codable {
    let composition: Double
    let lighting: Double
    let technique: Double
    let creativity: Double
    let subjectImpact: Double

    enum CodingKeys: String, CodingKey {
        case composition, lighting, technique, creativity
        case subjectImpact = "subject_impact"
    }

    var average: Double {
        (composition + lighting + technique + creativity + subjectImpact) / 5.0
    }
}

struct PriorityFix: Codable {
    let severity: String?
    let issue: String?

    enum CodingKeys: String, CodingKey {
        case severity, issue
    }
}

struct GlassBoxSummary: Codable {
    let observations: [String]?
    let reasoningSteps: [String]?
    let priorityFixes: [PriorityFix]?

    enum CodingKeys: String, CodingKey {
        case observations
        case reasoningSteps = "reasoning_steps"
        case priorityFixes = "priority_fixes"
    }
}

struct CritiqueBreakdown: Codable {
    let composition: String?
    let lighting: String?
    let technique: String?
    let overall: String?

    /// First sentence of overall critique — matches web OverallVerdictCard headline.
    var headline: String? {
        guard let overall, !overall.isEmpty else { return nil }
        let trimmed = overall.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let end = trimmed.firstIndex(where: { ".!?".contains($0) }) else {
            return trimmed + "."
        }
        return String(trimmed[...end])
    }
}

/// Coach `analyze_photo` API payload (subset used on Field).
struct AnalysisResult: Codable {
    let portfolioEntryId: String
    let assignmentId: String?
    let sceneDescription: String?
    let imageUrl: String?
    let scores: AnalysisScores
    let critique: CritiqueBreakdown?
    let glassBox: GlassBoxSummary?
    let aestheticTags: [String]?
    let spatialMetadata: SpatialMetadata?

    enum CodingKeys: String, CodingKey {
        case portfolioEntryId
        case assignmentId
        case sceneDescription
        case imageUrl
        case scores
        case critique
        case glassBox
        case aestheticTags
        case spatialMetadata = "spatial_metadata"
    }

    func asPortfolioListItem(fallbackImageUrl: String? = nil) -> PortfolioListItem? {
        let url = imageUrl ?? fallbackImageUrl
        guard let url, !url.isEmpty else { return nil }
        return PortfolioListItem(
            id: portfolioEntryId,
            userId: "",
            shootId: "",
            imageUrl: url,
            createdAt: ISO8601DateFormatter().string(from: Date()),
            scores: scores,
            overallAverage: scores.average,
            aestheticTags: aestheticTags,
            glassBoxSummary: glassBox?.observations,
            sceneDescription: nil
        )
    }
}
