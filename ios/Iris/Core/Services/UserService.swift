import Foundation

struct PersonaUpdateBody: Encodable {
    let persona: String
}

final class UserService {
    private let client: APIClient

    init(client: APIClient = .shared) {
        self.client = client
    }

    func fetchProfile() async throws -> UserProfile {
        try await client.getJSON(UserProfile.self, path: "/api/v1/users/me")
    }

    func updatePersona(_ persona: String) async throws -> UserProfile {
        try await client.patchJSON(
            UserProfile.self,
            path: "/api/v1/users/me",
            body: PersonaUpdateBody(persona: persona)
        )
    }
}
