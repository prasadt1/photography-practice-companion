import Foundation

struct CaptureSessionResponse: Decodable {
    let sessionId: String
    let persona: String
}

struct FieldCaptureCueResponse: Decodable {
    let sessionId: String
    let spokenCue: String
    let onScreenHint: String
    let confidence: Double
    let readyToCapture: Bool
    let persona: String?

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        sessionId = try c.decode(String.self, forKey: .sessionId)
        spokenCue = try c.decode(String.self, forKey: .spokenCue)
        onScreenHint = try c.decode(String.self, forKey: .onScreenHint)
        confidence = try c.decode(Double.self, forKey: .confidence)
        readyToCapture = try c.decodeIfPresent(Bool.self, forKey: .readyToCapture) ?? false
        persona = try c.decodeIfPresent(String.self, forKey: .persona)
    }

    private enum CodingKeys: String, CodingKey {
        case sessionId, spokenCue, onScreenHint, confidence, readyToCapture, persona
    }
}

struct CaptureSessionCreateBody: Encodable {
    let locationDescription: String
    let assignmentId: String?
    let persona: String
    let userId: String?

    enum CodingKeys: String, CodingKey {
        case locationDescription
        case assignmentId
        case persona
        case userId
    }
}
