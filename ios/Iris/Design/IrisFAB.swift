import SwiftUI

/// Layout constants so tabs with bottom controls (e.g. Mentor composer) avoid FAB overlap.
enum IrisFABMetrics {
    /// Default: sits just above the tab bar.
    static let bottomInsetStandard: CGFloat = 56
    /// Mentor tab: float above the chat composer + send button.
    static let bottomInsetAboveComposer: CGFloat = 118
    /// Reserve trailing space when FAB stays bottom-trailing (belt-and-suspenders).
    static let trailingClearance: CGFloat = 8
}

struct IrisFAB: View {
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: "camera.fill")
                    .font(.body.weight(.semibold))
                Text("Shoot")
                    .font(IrisFont.sans(15, weight: .bold))
            }
            .foregroundStyle(Color.irisOnBrand)
            .padding(.horizontal, 20)
            .padding(.vertical, 14)
            .background(
                LinearGradient(
                    colors: [Color.irisBrand, Color.irisBrandLight],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .clipShape(Capsule())
            .shadow(color: Color.irisBrand.opacity(0.35), radius: 16, y: 6)
            .overlay(
                Capsule()
                    .stroke(Color.irisBrandLight.opacity(0.4), lineWidth: 1)
            )
        }
        .accessibilityLabel("Shoot photo")
    }
}
