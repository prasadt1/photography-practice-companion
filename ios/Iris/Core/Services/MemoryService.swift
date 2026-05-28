import Foundation

final class MemoryService {
    private let client: APIClient

    init(client: APIClient = .shared) {
        self.client = client
    }

    func fetchPortfolio(limit: Int = 5) async throws -> PortfolioListResponse {
        try await client.getJSON(
            PortfolioListResponse.self,
            path: "/api/v1/portfolio?limit=\(limit)&sort_by=date&sort_order=desc"
        )
    }

    func fetchTrends(limit: Int = 12) async throws -> PortfolioTrendsResponse {
        try await client.getJSON(
            PortfolioTrendsResponse.self,
            path: "/api/v1/portfolio/trends?limit=\(limit)"
        )
    }

    func fetchUserProfile() async throws -> UserProfile {
        try await client.getJSON(UserProfile.self, path: "/api/v1/users/me")
    }
}
