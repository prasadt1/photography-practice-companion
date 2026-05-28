import Foundation

final class MentorService {
    private let client: APIClient

    init(client: APIClient = .shared) {
        self.client = client
    }

    func suggestedQuestions(persona: String = "hobbyist") async throws -> [String] {
        let res = try await client.getJSON(
            MentorSuggestedQuestionsResponse.self,
            path: "/api/v1/mentor/suggested-questions?persona=\(persona)"
        )
        return res.questions
    }

    func sendMessage(
        _ message: String,
        persona: String,
        sessionId: String?
    ) async throws -> ChatResponseBody {
        try await client.postJSON(
            ChatResponseBody.self,
            path: "/api/v1/agent/chat",
            body: ChatRequestBody(message: message, sessionId: sessionId, persona: persona),
            timeout: 180
        )
    }
}
