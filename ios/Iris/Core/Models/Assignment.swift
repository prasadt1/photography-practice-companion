import Foundation

enum AssignmentStatus: String, Codable {
    case proposed
    case active
    case completed
    case abandoned
}

struct SkillDelta: Codable {
    let metric: String
    let baselineValue: Double
    let currentValue: Double
    let delta: Double

    enum CodingKeys: String, CodingKey {
        case metric
        case baselineValue = "baseline_value"
        case currentValue = "current_value"
        case delta
    }
}

struct Assignment: Codable, Identifiable {
    let id: String
    let userId: String
    let status: AssignmentStatus
    let brief: String
    let targetSkill: String
    let rationale: String
    let baselineShootIds: [String]
    let completionShootIds: [String]
    let skillDelta: SkillDelta?
    let createdAt: String
    let completedAt: String?

    enum CodingKeys: String, CodingKey {
        case id
        case userId
        case status
        case brief
        case targetSkill
        case rationale
        case baselineShootIds
        case completionShootIds
        case skillDelta
        case createdAt
        case completedAt
    }
}

struct AssignmentsResponse: Codable {
    let proposed: [Assignment]
    let active: [Assignment]
    let completed: [Assignment]
}

struct ActiveAssignmentResponse: Codable {
    let active: Assignment?
}

struct HealthResponse: Codable {
    let status: String?
    let phase: String?
}

struct ReflectionResult: Codable {
    let summary: String
    let appliedBrief: Bool
    let skillDelta: SkillDelta
    let baselinePhotoCount: Int?
    let practicePhotoCount: Int?

    enum CodingKeys: String, CodingKey {
        case summary
        case appliedBrief
        case skillDelta
        case baselinePhotoCount
        case practicePhotoCount
    }
}

struct CompleteAssignmentResponse: Codable {
    let assignment: Assignment
    let reflection: ReflectionResult
}
