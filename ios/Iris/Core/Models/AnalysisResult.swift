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

/// Coach `analyze_photo` API payload (subset used on Field).
struct AnalysisResult: Codable {
    let portfolioEntryId: String
    let assignmentId: String?
    let sceneDescription: String?
    let scores: AnalysisScores
    let glassBox: GlassBoxSummary?
    let aestheticTags: [String]?

    enum CodingKeys: String, CodingKey {
        case portfolioEntryId
        case assignmentId
        case sceneDescription
        case scores
        case glassBox
        case aestheticTags
    }
}
