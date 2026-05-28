import Foundation

final class PracticeService {
    private let client: APIClient

    init(client: APIClient = .shared) {
        self.client = client
    }

    func fetchAssignments() async throws -> AssignmentsResponse {
        try await client.getJSON(AssignmentsResponse.self, path: "/api/v1/assignments")
    }

    func fetchActiveAssignment() async throws -> Assignment? {
        let res = try await client.getJSON(ActiveAssignmentResponse.self, path: "/api/v1/assignments/active")
        return res.active
    }

    func proposeAssignment(mode: String = "hobbyist", focusSkill: String? = nil) async throws -> Assignment {
        var path = "/api/v1/assignments/propose?mode=\(mode)"
        if let focusSkill, !focusSkill.isEmpty {
            let encoded = focusSkill.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? focusSkill
            path += "&focus_skill=\(encoded)"
        }
        return try await client.postJSON(Assignment.self, path: path)
    }

    func acceptAssignment(id: String) async throws -> Assignment {
        try await client.postJSON(Assignment.self, path: "/api/v1/assignments/\(id)/accept")
    }

    func declineAssignment(id: String) async throws -> Assignment {
        try await client.postJSON(Assignment.self, path: "/api/v1/assignments/\(id)/decline")
    }

    func completeAssignment(id: String) async throws -> CompleteAssignmentResponse {
        try await client.postJSON(
            CompleteAssignmentResponse.self,
            path: "/api/v1/assignments/\(id)/complete",
            timeout: 120
        )
    }

    func checkHealth() async throws -> HealthResponse {
        try await client.getJSON(HealthResponse.self, path: "/health")
    }
}
