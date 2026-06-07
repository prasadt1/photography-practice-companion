import Foundation

final class MemoryService {
    private let client: APIClient

    init(client: APIClient = .shared) {
        self.client = client
    }

    func fetchPortfolio(
        limit: Int = 5,
        sortBy: String = "date",
        sortOrder: String = "desc"
    ) async throws -> PortfolioListResponse {
        try await client.getJSON(
            PortfolioListResponse.self,
            path: "/api/v1/portfolio?limit=\(limit)&sort_by=\(sortBy)&sort_order=\(sortOrder)"
        )
    }

    func fetchPortfolioStats() async throws -> PortfolioStatsResponse {
        try await client.getJSON(PortfolioStatsResponse.self, path: "/api/v1/portfolio/stats")
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
