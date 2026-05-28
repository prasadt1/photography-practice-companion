import SwiftUI

struct PracticeShootBanner: View {
    let assignment: Assignment
    let onField: () -> Void
    let onDismiss: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                IrisSectionLabel(text: "Ready to shoot?")
                Spacer()
                Button(action: onDismiss) {
                    Image(systemName: "xmark")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(Color.irisTextMuted)
                        .padding(8)
                }
                .accessibilityLabel("Dismiss")
            }
            Text(assignment.brief)
                .font(IrisFont.sans(13))
                .foregroundStyle(Color.irisTextPrimary.opacity(0.9))
                .lineLimit(2)
            IrisPrimaryButton(title: "Shoot now", icon: "camera.fill", action: onField)
        }
        .padding(14)
        .background(Color.irisBrand.opacity(0.12))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(Color.irisBrand.opacity(0.4), lineWidth: 1)
        )
    }
}
