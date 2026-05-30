import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var auth: AuthViewModel

    @State private var entries: [PortfolioListItem] = []
    @State private var trends: PortfolioTrendsResponse?
    @State private var isFetching = false
    @State private var errorMessage: String?
    @State private var selectedEntry: PortfolioListItem?

    private let memory = MemoryService()

    var body: some View {
        NavigationStack {
            ZStack {
                scrollContent
                if isFetching, entries.isEmpty {
                    loadingView
                        .background(Color.irisCanvas.opacity(0.92))
                }
            }
            .irisScreen()
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Color.irisCanvas, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .task(id: homeLoadToken) {
                await load()
            }
            .refreshable { await load(force: true) }
            .sheet(item: $selectedEntry) { entry in
                HomePhotoDetailSheet(entry: entry)
            }
        }
    }

    private var homeLoadToken: String {
        "\(auth.userId)-\(appState.portfolioRevision)"
    }

    private var loadingView: some View {
        VStack(spacing: 12) {
            ProgressView()
                .tint(Color.irisBrandLight)
            Text("Loading your Iris…")
                .font(IrisFont.sans(14))
                .foregroundStyle(Color.irisTextMuted)
        }
    }

    private func errorView(_ message: String) -> some View {
        VStack(spacing: 16) {
            Text(message)
                .font(IrisFont.sans(14))
                .foregroundStyle(Color.irisTextMuted)
                .multilineTextAlignment(.center)
            IrisSecondaryButton(title: "Retry", icon: "arrow.clockwise") {
                Task { await load(force: true) }
            }
            emptyFirstShotCard
        }
        .padding()
    }

    private var scrollContent: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                header
                if let errorMessage, entries.isEmpty {
                    Text(errorMessage)
                        .font(IrisFont.sans(13))
                        .foregroundStyle(Color.irisRose.opacity(0.9))
                }
                if entries.isEmpty {
                    emptyFirstShotCard
                } else {
                    if trends != nil {
                        progressCard
                    }
                    if let active = appState.activeAssignment {
                        activePracticeCard(active)
                    }
                    recentPhotosSection
                }
                openWebWorkLink
            }
            .padding(.horizontal)
            .padding(.bottom, 88)
        }
    }

    @ViewBuilder
    private var openWebWorkLink: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(webPortfolioFootnote)
                .font(IrisFont.sans(12))
                .foregroundStyle(Color.irisTextMuted)
                .fixedSize(horizontal: false, vertical: true)
            if auth.isWorkingPro {
                webLinkRow(title: "My Work on web", url: AppConfig.webWorkURL)
                webLinkRow(title: "Print Sales on web", url: AppConfig.webPrintURL)
            } else {
                webLinkRow(title: "Full portfolio on web", url: AppConfig.webWorkURL)
            }
        }
    }

    private var webPortfolioFootnote: String {
        if auth.isDemoMode {
            return "Safari opens a separate session. Complete the welcome once, or sign in with Google on both app and web to share one library."
        }
        return "Use the same Google account on web to see these shots in My Work without signing in again."
    }

    private func webLinkRow(title: String, url: URL) -> some View {
        Link(destination: url) {
            HStack {
                Text(title)
                    .font(IrisFont.sans(13, weight: .medium))
                Spacer()
                Image(systemName: "arrow.up.right")
            }
            .foregroundStyle(Color.irisBrandLight)
            .padding(14)
            .background(Color.irisSurface2)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Home")
                .font(IrisFont.serif(28))
                .foregroundStyle(Color.irisTextPrimary)
            Text(auth.isWorkingPro
                ? "Field companion for working pros — shoot here, manage listings on Studio."
                : "Memory makes meaning — Iris remembers every frame.")
                .font(IrisFont.sans(14))
                .foregroundStyle(Color.irisTextMuted)
                .lineSpacing(2)
        }
        .padding(.top, 8)
    }

    @ViewBuilder
    private var progressCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            IrisSectionLabel(text: "Your progress")
            if let trends, !trends.insufficientData {
                let dims = trends.dimensions.filter { ["composition", "lighting", "overall"].contains($0.key) }
                ForEach(dims.prefix(3)) { dim in
                    HStack {
                        Text(dim.label)
                            .font(IrisFont.sans(14, weight: .medium))
                            .foregroundStyle(Color.irisTextPrimary)
                        Spacer()
                        if let latest = dim.latest {
                            Text(String(format: "%.1f", latest))
                                .font(IrisFont.sans(14, weight: .semibold))
                                .foregroundStyle(Color.irisBrandLight)
                                .monospacedDigit()
                        }
                        trendArrow(dim.trend, delta: dim.delta)
                    }
                }
                Text("\(trends.photoCount) photos in memory")
                    .font(IrisFont.sans(12))
                    .foregroundStyle(Color.irisTextMuted)
            } else {
                Text("Keep shooting — trends appear after a few photos.")
                    .font(IrisFont.sans(13))
                    .foregroundStyle(Color.irisTextMuted)
            }
        }
        .irisCard(borderBrand: true)
    }

    private func trendArrow(_ trend: String, delta: Double?) -> some View {
        let symbol: String
        let color: Color
        switch trend {
        case "up":
            symbol = "arrow.up.right"
            color = Color.irisBrandLight
        case "down":
            symbol = "arrow.down.right"
            color = Color.irisRose
        default:
            symbol = "arrow.right"
            color = Color.irisTextMuted
        }
        return HStack(spacing: 2) {
            Image(systemName: symbol)
                .font(.caption.weight(.bold))
            if let delta {
                Text(String(format: "%+.1f", delta))
                    .font(IrisFont.sans(11, weight: .medium))
                    .monospacedDigit()
            }
        }
        .foregroundStyle(color)
    }

    private func activePracticeCard(_ assignment: Assignment) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            IrisSectionLabel(text: "Active practice")
            Text(assignment.brief)
                .font(IrisFont.sans(14))
                .foregroundStyle(Color.irisTextPrimary.opacity(0.9))
                .lineLimit(2)
            Button {
                appState.openShoot(assignmentId: assignment.id)
            } label: {
                Text("Shoot for this")
                    .font(IrisFont.sans(13, weight: .semibold))
                    .foregroundStyle(Color.irisBrandLight)
            }
        }
        .irisCard()
    }

    private var recentPhotosSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                IrisSectionLabel(text: "Recent photos")
                Spacer()
                Text("Pull to refresh")
                    .font(IrisFont.sans(11))
                    .foregroundStyle(Color.irisTextMuted)
            }
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(entries) { entry in
                        Button {
                            selectedEntry = entry
                        } label: {
                            recentThumb(entry)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    private func recentThumb(_ entry: PortfolioListItem) -> some View {
        ZStack(alignment: .bottomTrailing) {
            AsyncImage(url: URL(string: entry.imageUrl)) { phase in
                switch phase {
                case .success(let image):
                    image
                        .resizable()
                        .scaledToFill()
                default:
                    Color.irisSurface2
                }
            }
            .frame(width: 120, height: 120)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke(Color.irisWarmBorder, lineWidth: 1)
            )
            Text(String(format: "%.1f", entry.overallAverage))
                .font(IrisFont.sans(11, weight: .bold))
                .foregroundStyle(Color.irisOnBrand)
                .padding(.horizontal, 6)
                .padding(.vertical, 3)
                .background(Color.irisBrand.opacity(0.9))
                .clipShape(Capsule())
                .padding(6)
        }
    }

    private var emptyFirstShotCard: some View {
        VStack(spacing: 12) {
            Image(systemName: "camera.aperture")
                .font(.system(size: 36))
                .foregroundStyle(Color.irisBrandLight)
            Text("Take your first photo")
                .font(IrisFont.serif(22))
                .foregroundStyle(Color.irisTextPrimary)
            Text("Tap Shoot — Iris will critique and remember it.")
                .font(IrisFont.sans(14))
                .foregroundStyle(Color.irisTextMuted)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 28)
        .irisCard()
    }

    private func load(force: Bool = false) async {
        isFetching = true
        errorMessage = nil
        defer { isFetching = false }

        applyPendingToEntries()

        APIClient.shared.userId = auth.userId.isEmpty ? nil : auth.userId
        do {
            let p = try await memory.fetchPortfolio(limit: 5)
            entries = PortfolioMerge.recentEntries(
                fetched: p.entries,
                pending: appState.pendingRecentPortfolioItem
            )
            appState.clearPendingRecentIfMatched(fetchedEntries: p.entries)

            Task {
                if let t = try? await memory.fetchTrends(limit: 12) {
                    await MainActor.run { trends = t }
                }
                try? await appState.refreshAssignmentsSnapshot()
            }
        } catch is CancellationError {
            applyPendingToEntries()
        } catch {
            if entries.isEmpty {
                errorMessage = error.localizedDescription
            }
        }
    }

    private func applyPendingToEntries() {
        if let pending = appState.pendingRecentPortfolioItem {
            entries = PortfolioMerge.recentEntries(fetched: entries, pending: pending)
        }
    }
}
