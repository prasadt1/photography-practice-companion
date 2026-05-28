import Foundation

@MainActor
final class AppState: ObservableObject {
    @Published var bannerMessage: String?
    @Published var activeAssignment: Assignment?
    @Published var selectedTab: AppTab = .home
    @Published var showShootBanner = false
    @Published var showShootFlow = false
    /// When set, analyze-photo includes this assignment (Practice “Shoot for this”).
    @Published var shootAssignmentId: String?
    @Published var proposedAssignmentCount = 0
    /// Bumped after a successful analyze so Home refreshes.
    @Published var portfolioRevision = 0

    private let practice = PracticeService()

    var showsShootFAB: Bool {
        selectedTab != .settings && !showShootFlow
    }

    func openShoot(assignmentId: String? = nil) {
        shootAssignmentId = assignmentId
        showShootFlow = true
    }

    func closeShoot() {
        showShootFlow = false
        shootAssignmentId = nil
    }

    func dismissShootBanner() {
        showShootBanner = false
    }

    func notifyPortfolioChanged() {
        portfolioRevision += 1
    }

    func checkAPIHealth(auth: AuthViewModel) async {
        APIClient.shared.userId = auth.userId.isEmpty ? nil : auth.userId
        do {
            let health = try await practice.checkHealth()
            let phase = health.phase ?? "?"
            bannerMessage = "API OK · phase \(phase)"
            try await refreshAssignmentsSnapshot()
        } catch {
            bannerMessage = "API unreachable: \(error.localizedDescription)"
        }
        Task {
            try? await Task.sleep(nanoseconds: 4_000_000_000)
            if bannerMessage?.hasPrefix("API OK") == true {
                bannerMessage = nil
            }
        }
    }

    func refreshActiveAssignment() async throws {
        activeAssignment = try await practice.fetchActiveAssignment()
    }

    func refreshAssignmentsSnapshot() async throws {
        let data = try await practice.fetchAssignments()
        activeAssignment = data.active.first
        proposedAssignmentCount = data.proposed.count
    }

    func effectiveAssignmentIdForShoot() -> String? {
        if let shootAssignmentId, !shootAssignmentId.isEmpty {
            return shootAssignmentId
        }
        return activeAssignment?.id
    }
}
