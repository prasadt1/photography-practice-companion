import SwiftUI

struct MentorView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @EnvironmentObject private var appState: AppState
    @StateObject private var chatStore = MentorChatStore()

    @State private var input = ""
    @State private var loading = false
    @State private var errorMessage: String?
    @State private var starters: [String] = []
    @State private var persona = "hobbyist"

    private let mentor = MentorService()

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if chatStore.messages.isEmpty {
                    emptyState
                } else {
                    messageList
                }
                if let errorMessage {
                    IrisAlertBanner(message: errorMessage, style: .error)
                        .padding(.horizontal)
                        .padding(.top, 8)
                }
                composer
            }
            .irisScreen()
            .navigationTitle("Mentor")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Color.irisCanvas, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    if !chatStore.messages.isEmpty {
                        Button("Clear") {
                            chatStore.clearSession()
                        }
                        .font(IrisFont.sans(13, weight: .medium))
                        .foregroundStyle(Color.irisTextMuted)
                    }
                }
            }
            .onChange(of: appState.selectedTab) { _, tab in
                if tab == .mentor { prepareIfNeeded() }
            }
            .onChange(of: auth.userId) { _, _ in
                if appState.selectedTab == .mentor { prepareIfNeeded() }
            }
            .onChange(of: auth.persona) { _, _ in
                if appState.selectedTab == .mentor {
                    Task { await loadStarters() }
                }
            }
            .onAppear {
                if appState.selectedTab == .mentor { prepareIfNeeded() }
            }
        }
    }

    private func prepareIfNeeded() {
        chatStore.load(forUserId: auth.userId)
        if starters.isEmpty {
            Task { await loadStarters() }
        }
    }

    private var emptyState: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Ask Mentor")
                        .font(IrisFont.serif(26))
                        .foregroundStyle(Color.irisTextPrimary)
                    Text("Portfolio-aware chat — tuned for \(auth.personaLabel.lowercased()) goals.")
                        .font(IrisFont.sans(14))
                        .foregroundStyle(Color.irisTextMuted)
                }
                .padding(.top, 8)
                IrisSectionLabel(text: "Suggested")
                ForEach(starters, id: \.self) { q in
                    Button {
                        input = q
                        Task { await send() }
                    } label: {
                        Text(q)
                            .font(IrisFont.sans(14))
                            .foregroundStyle(Color.irisTextPrimary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(12)
                            .background(Color.irisSurface2)
                            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                    }
                    .buttonStyle(.plain)
                    .disabled(loading)
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 24)
        }
    }

    private var messageList: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 12) {
                    ForEach(chatStore.messages) { msg in
                        messageBubble(msg)
                            .id(msg.id)
                    }
                    if loading {
                        HStack(spacing: 8) {
                            ProgressView()
                                .tint(Color.irisBrandLight)
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Mentor is thinking…")
                                    .font(IrisFont.sans(13))
                                    .foregroundStyle(Color.irisTextMuted)
                                Text(auth.isWorkingPro
                                    ? "Often 60–90 seconds when digging through your library."
                                    : "Usually 30–60 seconds when digging through your library.")
                                    .font(IrisFont.sans(11))
                                    .foregroundStyle(Color.irisTextMuted.opacity(0.85))
                            }
                        }
                        .padding(.vertical, 8)
                    }
                }
                .padding(.horizontal)
                .padding(.vertical, 12)
                .padding(.bottom, 4)
            }
            .onChange(of: chatStore.messages.count) { _, _ in
                if let last = chatStore.messages.last {
                    withAnimation {
                        proxy.scrollTo(last.id, anchor: .bottom)
                    }
                }
            }
        }
    }

    private func messageBubble(_ msg: MentorChatMessage) -> some View {
        HStack {
            if msg.isUser { Spacer(minLength: 40) }
            Text(msg.content)
                .font(IrisFont.sans(14))
                .foregroundStyle(msg.isUser ? Color.irisOnBrand : Color.irisTextPrimary)
                .padding(12)
                .background(msg.isUser ? Color.irisBrand : Color.irisSurface2)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            if !msg.isUser { Spacer(minLength: 40) }
        }
    }

    private var composer: some View {
        HStack(alignment: .bottom, spacing: 10) {
            TextField("Ask about your photography…", text: $input, axis: .vertical)
                .lineLimit(1 ... 4)
                .font(IrisFont.sans(15))
                .foregroundStyle(Color.irisTextPrimary)
                .padding(10)
                .background(Color.irisSurface2)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            Button {
                Task { await send() }
            } label: {
                Image(systemName: "arrow.up.circle.fill")
                    .font(.system(size: 32))
                    .foregroundStyle(canSend ? Color.irisBrand : Color.irisTextMuted)
            }
            .disabled(!canSend)
        }
        .padding(.leading, 16)
        .padding(.trailing, 16)
        .padding(.vertical, 10)
        .background(Color.irisCanvasElevated)
    }

    private var canSend: Bool {
        !loading && !input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private func loadStarters() async {
        APIClient.shared.userId = auth.userId.isEmpty ? nil : auth.userId
        do {
            persona = auth.persona == "working_pro" ? "working_pro" : "hobbyist"
            if !auth.userId.isEmpty {
                let profile = try await MemoryService().fetchUserProfile()
                persona = profile.persona == "working_pro" ? "working_pro" : "hobbyist"
            }
            starters = try await mentor.suggestedQuestions(persona: persona)
        } catch {
            starters = [
                "What should I practice next?",
                "How has my composition changed lately?",
                "Review my recent portfolio themes.",
            ]
        }
    }

    private func send() async {
        let text = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        input = ""
        errorMessage = nil
        loading = true
        chatStore.appendUser(text)
        APIClient.shared.userId = auth.userId.isEmpty ? nil : auth.userId
        defer { loading = false }
        do {
            let res = try await mentor.sendMessage(
                text,
                persona: persona,
                sessionId: chatStore.currentSessionId()
            )
            chatStore.applySessionId(res.sessionId)
            chatStore.appendAssistant(res.reply)
            persona = res.persona == "working_pro" ? "working_pro" : "hobbyist"
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
