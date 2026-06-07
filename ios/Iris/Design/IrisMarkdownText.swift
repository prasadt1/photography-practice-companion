import SwiftUI

/// Renders Mentor replies with basic Markdown (bold, lists, headings).
struct IrisMarkdownText: View {
    let markdown: String
    var font: Font = IrisFont.sans(14)
    var foreground: Color = Color.irisTextPrimary

    var body: some View {
        Text(parsed)
            .font(font)
            .foregroundStyle(foreground)
            .tint(Color.irisBrandLight)
            .textSelection(.enabled)
    }

    private var parsed: AttributedString {
        if let attributed = try? AttributedString(
            markdown: markdown,
            options: AttributedString.MarkdownParsingOptions(interpretedSyntax: .full)
        ) {
            return attributed
        }
        return AttributedString(markdown)
    }
}
