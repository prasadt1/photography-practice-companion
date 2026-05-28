import Foundation

/// Hybrid mentor history: UI messages local, ADK continuity via sessionId (web parity).
@MainActor
final class MentorChatStore: ObservableObject {
    @Published private(set) var messages: [MentorChatMessage] = []

    private var sessionId: String?
    private var storageUserKey: String = "demo"

    private let defaults = UserDefaults.standard
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    func load(forUserId userId: String) {
        storageUserKey = userId.isEmpty ? "demo" : userId
        sessionId = defaults.string(forKey: "\(AppConfig.mentorSessionIdKey).\(storageUserKey)")
        if let data = defaults.data(forKey: "\(AppConfig.mentorMessagesKey).\(storageUserKey)"),
           let decoded = try? decoder.decode([MentorChatMessage].self, from: data) {
            messages = decoded
        } else {
            messages = []
        }
    }

    func clearSession() {
        sessionId = nil
        messages = []
        defaults.removeObject(forKey: "\(AppConfig.mentorSessionIdKey).\(storageUserKey)")
        defaults.removeObject(forKey: "\(AppConfig.mentorMessagesKey).\(storageUserKey)")
    }

    func appendUser(_ text: String) {
        append(role: "user", content: text)
    }

    func appendAssistant(_ text: String) {
        append(role: "assistant", content: text)
    }

    func applySessionId(_ id: String) {
        sessionId = id
        defaults.set(id, forKey: "\(AppConfig.mentorSessionIdKey).\(storageUserKey)")
    }

    func currentSessionId() -> String? {
        sessionId
    }

    private func append(role: String, content: String) {
        let msg = MentorChatMessage(
            id: UUID().uuidString,
            role: role,
            content: content,
            createdAt: Date()
        )
        messages.append(msg)
        persist()
    }

    private func persist() {
        guard let data = try? encoder.encode(messages) else { return }
        defaults.set(data, forKey: "\(AppConfig.mentorMessagesKey).\(storageUserKey)")
    }
}
