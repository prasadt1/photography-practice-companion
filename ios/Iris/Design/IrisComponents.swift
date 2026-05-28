import SwiftUI

struct IrisSectionLabel: View {
    let text: String

    var body: some View {
        Text(text)
            .font(IrisFont.sans(10, weight: .bold))
            .foregroundStyle(Color.irisBrandLight)
            .textCase(.uppercase)
            .tracking(1.2)
    }
}

struct IrisSkillBadge: View {
    let average: Double

    private var label: String {
        switch average {
        case 7.5...: return "Advanced"
        case 5.5..<7.5: return "Intermediate"
        default: return "Developing"
        }
    }

    private var colors: (bg: Color, fg: Color, border: Color) {
        switch average {
        case 7.5...:
            return (Color.irisBrand.opacity(0.2), Color.irisBrandLight, Color.irisBrand.opacity(0.35))
        case 5.5..<7.5:
            return (Color.orange.opacity(0.15), Color.orange.opacity(0.9), Color.orange.opacity(0.35))
        default:
            return (Color.irisRose.opacity(0.15), Color.irisRose, Color.irisRose.opacity(0.35))
        }
    }

    var body: some View {
        let c = colors
        Text(label)
            .font(IrisFont.sans(12, weight: .semibold))
            .foregroundStyle(c.fg)
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(c.bg)
            .clipShape(Capsule())
            .overlay(Capsule().stroke(c.border, lineWidth: 1))
    }
}

struct IrisScoreBar: View {
    let title: String
    let score: Double

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(title)
                    .font(IrisFont.sans(13, weight: .medium))
                    .foregroundStyle(Color.irisTextPrimary)
                Spacer()
                Text(String(format: "%.1f", score))
                    .font(IrisFont.sans(13, weight: .semibold))
                    .foregroundStyle(Color.irisBrandLight)
                    .monospacedDigit()
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Color.irisSurface3)
                    Capsule()
                        .fill(
                            LinearGradient(
                                colors: [Color.irisBrand, Color.irisBrandLight],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: geo.size.width * CGFloat(min(score / 10.0, 1.0)))
                }
            }
            .frame(height: 6)
        }
    }
}

struct IrisPrimaryButton: View {
    let title: String
    let icon: String?
    var disabled: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                if let icon {
                    Image(systemName: icon)
                        .font(.body.weight(.semibold))
                }
                Text(title)
                    .font(IrisFont.sans(14, weight: .bold))
                    .tracking(0.3)
            }
            .foregroundStyle(Color.irisOnBrand)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(disabled ? Color.irisBrand.opacity(0.4) : Color.irisBrand)
            .clipShape(Capsule())
            .shadow(color: Color.irisBrand.opacity(disabled ? 0 : 0.25), radius: 12, y: 4)
            .overlay(
                Capsule()
                    .stroke(Color.irisBrandLight.opacity(0.35), lineWidth: 1)
            )
        }
        .disabled(disabled)
    }
}

struct IrisSecondaryButton: View {
    let title: String
    let icon: String
    var disabled: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                Text(title)
                    .font(IrisFont.sans(14, weight: .medium))
            }
            .foregroundStyle(Color.irisTextPrimary)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(Color.irisSurface2)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke(Color.irisWarmBorder, lineWidth: 1)
            )
        }
        .disabled(disabled)
    }
}

struct IrisAlertBanner: View {
    enum Style { case success, error }

    let message: String
    let style: Style

    var body: some View {
        Text(message)
            .font(IrisFont.sans(13))
            .foregroundStyle(style == .success ? Color.irisBrandLight : Color.irisRose)
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background((style == .success ? Color.irisBrand : Color.irisRose).opacity(0.12))
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke((style == .success ? Color.irisBrand : Color.irisRose).opacity(0.35), lineWidth: 1)
            )
    }
}

struct IrisTabPicker: View {
    @Binding var selection: Int
    let labels: [String]

    var body: some View {
        HStack(spacing: 0) {
            ForEach(labels.indices, id: \.self) { index in
                Button {
                    withAnimation(.easeInOut(duration: 0.2)) { selection = index }
                } label: {
                    Text(labels[index])
                        .font(IrisFont.sans(12, weight: .semibold))
                        .foregroundStyle(selection == index ? Color.irisOnBrand : Color.irisTextMuted)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(selection == index ? Color.irisBrand : Color.clear)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(4)
        .background(Color.irisSurface2)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}
