import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var auth: AuthViewModel

    @State private var entries: [PortfolioListItem] = []
    @State private var trends: PortfolioTrendsResponse?
    @State private var loading = true
    @State private var errorMessage: String?
    @State private var selectedEntry: PortfolioListItem?

    private let memory = MemoryService()

    var body: some View {
        NavigationStack {
            Group {
                if loading {
                    loadingView
                } else if let errorMessage, entries.isEmpty {
                    errorView(errorMessage)
                } else {
                    scrollContent
                }
            }
            .irisScreen()
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Color.irisCanvas, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .task(id: auth.userId) { await load() }
            .task(id: appState.portfolioRevision) { await load() }
            .refreshable { await load() }
            .sheet(item: $selectedEntry) { entry in
                HomePhotoDetailSheet(entry: entry)
            }
        }
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
                Task { await load() }
            }
            emptyFirstShotCard
        }
        .padding()
    }

    private var scrollContent: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                header
                if entries.isEmpty {
                    emptyFirstShotCard
                } else {
                    progressCard
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

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Home")
                .font(IrisFont.serif(28))
                .foregroundStyle(Color.irisTextPrimary)
            Text("Memory makes meaning — Iris remembers every frame.")
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
            IrisSectionLabel(text: "Recent photos")
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

    private var openWebWorkLink: some View {
        Link(destination: AppConfig.webAppURL) {
            HStack {
                Text("Full portfolio on web")
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

    private func load() async {
        loading = entries.isEmpty
        errorMessage = nil
        defer { loading = false }

        APIClient.shared.userId = auth.userId.isEmpty ? nil : auth.userId
        do {
            async let portfolio = memory.fetchPortfolio(limit: 5)
            async let trendData = memory.fetchTrends(limit: 12)
            try? await appState.refreshAssignmentsSnapshot()
            let (p, t) = try await (portfolio, trendData)
            entries = p.entries
            trends = t
        } catch is CancellationError {
            return
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
