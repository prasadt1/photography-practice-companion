import AVFoundation

@MainActor
final class CueSpeaker: NSObject, AVSpeechSynthesizerDelegate {
    private let synthesizer = AVSpeechSynthesizer()

    override init() {
        super.init()
        synthesizer.delegate = self
    }

    func speak(_ text: String) {
        guard AppConfig.liveCoachVoiceEnabled else { return }
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }
        let spoken = Self.compactForSpeech(trimmed)
        let utterance = AVSpeechUtterance(string: spoken)
        utterance.rate = AppConfig.liveCoachSpeechRate
        utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
        synthesizer.speak(utterance)
    }

    func stop() {
        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }
    }

    /// Keep voice cues short — full text stays on screen.
    private static func compactForSpeech(_ text: String) -> String {
        if let match = text.range(of: #"[.!?]"#, options: .regularExpression) {
            let end = text.index(after: match.lowerBound)
            let sentence = String(text[..<end]).trimmingCharacters(in: .whitespacesAndNewlines)
            if sentence.count >= 12 {
                return sentence
            }
        }
        if text.count > 72 {
            return String(text.prefix(72)).trimmingCharacters(in: .whitespacesAndNewlines) + "…"
        }
        return text
    }
}
