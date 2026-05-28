import Foundation

struct PortfolioListItem: Codable, Identifiable {
    let id: String
    let userId: String
    let shootId: String
    let imageUrl: String
    let createdAt: String
    let scores: AnalysisScores
    let overallAverage: Double
    let aestheticTags: [String]?
    let glassBoxSummary: [String]?

    enum CodingKeys: String, CodingKey {
        case id, userId, shootId, imageUrl, createdAt, scores, overallAverage, aestheticTags, glassBoxSummary
    }
}

struct PortfolioListResponse: Codable {
    let entries: [PortfolioListItem]
    let total: Int
}

struct PortfolioTrendDimension: Codable, Identifiable {
    var id: String { key }
    let key: String
    let label: String
    let values: [Double]
    let latest: Double?
    let delta: Double?
    let trend: String
}

struct PortfolioTrendsResponse: Codable {
    let photoCount: Int
    let dimensions: [PortfolioTrendDimension]
    let insufficientData: Bool
}

struct UserProfile: Codable {
    let userId: String?
    let persona: String
}

struct MentorSuggestedQuestionsResponse: Codable {
    let questions: [String]
    let source: String?
}

struct ChatRequestBody: Encodable {
    let message: String
    let sessionId: String?
    let persona: String
}

struct ChatResponseBody: Codable {
    let reply: String
    let persona: String
    let sessionId: String
    let userId: String
}

struct MentorChatMessage: Codable, Identifiable, Equatable {
    let id: String
    let role: String
    let content: String
    let createdAt: Date

    var isUser: Bool { role == "user" }
}
