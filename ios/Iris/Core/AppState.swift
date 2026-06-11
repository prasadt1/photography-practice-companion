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
    /// Optimistic recent photo shown on Home until the next portfolio fetch.
    @Published var pendingRecentPortfolioItem: PortfolioListItem?

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

    func registerNewCapture(_ result: AnalysisResult, localPreviewFileURL: URL? = nil) {
        if let item = result.asPortfolioListItem(
            fallbackImageUrl: localPreviewFileURL?.absoluteString
        ) {
            pendingRecentPortfolioItem = item
        }
        notifyPortfolioChanged()
        Task { await refreshPortfolioFromServer() }
    }

    func clearPendingRecentIfMatched(fetchedEntries: [PortfolioListItem]) {
        guard let pending = pendingRecentPortfolioItem else { return }
        if fetchedEntries.contains(where: { $0.id == pending.id }) {
            pendingRecentPortfolioItem = nil
        }
    }

    private func refreshPortfolioFromServer() {
        Task {
            try? await Task.sleep(nanoseconds: 400_000_000)
            notifyPortfolioChanged()
        }
    }

    func checkAPIHealth(auth: AuthViewModel) async {
        APIClient.shared.userId = auth.userId.isEmpty ? nil : auth.userId
        do {
            let health = try await practice.checkHealth()
            let phase = health.phase ?? "?"
            bannerMessage = "API OK · phase \(phase)"
            Task { try? await refreshAssignmentsSnapshot() }
        } catch {
            bannerMessage = "API unreachable: \(error.localizedDescription)"
        }
        Task {
            try? await Task.sleep(nanoseconds: 3_000_000_000)
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

    /// Brief text for live coach + viewfinder — resolves from active or proposed list.
    func assignmentBriefForShoot() async -> String? {
        if let id = effectiveAssignmentIdForShoot(),
           let active = activeAssignment, active.id == id {
            return active.brief
        }
        do {
            let data = try await practice.fetchAssignments()
            if let id = effectiveAssignmentIdForShoot() {
                if let match = data.active.first(where: { $0.id == id }) {
                    return match.brief
                }
                if let match = data.proposed.first(where: { $0.id == id }) {
                    return match.brief
                }
            }
            return data.active.first?.brief
        } catch {
            return activeAssignment?.brief
        }
    }
}
