import SwiftUI

// MARK: - Colors (frontend/src/index.css)

extension Color {
    static let irisCanvasElevated = Color(red: 36 / 255, green: 33 / 255, blue: 32 / 255)
    static let irisSurface2 = Color(red: 51 / 255, green: 47 / 255, blue: 43 / 255)
    static let irisSurface3 = Color(red: 61 / 255, green: 56 / 255, blue: 52 / 255)
    static let irisWarmBorder = Color(red: 68 / 255, green: 64 / 255, blue: 60 / 255)
    static let irisOnBrand = Color(red: 26 / 255, green: 24 / 255, blue: 22 / 255)
    static let irisRose = Color(red: 251 / 255, green: 113 / 255, blue: 133 / 255)
}

enum IrisFont {
    static func serif(_ size: CGFloat, weight: Font.Weight = .bold) -> Font {
        .system(size: size, weight: weight, design: .serif)
    }

    static func sans(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight, design: .default)
    }
}

// MARK: - Modifiers

struct IrisScreenBackground: ViewModifier {
    func body(content: Content) -> some View {
        content
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.irisCanvas)
    }
}

struct IrisCardStyle: ViewModifier {
    var borderBrand = false

    func body(content: Content) -> some View {
        content
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.irisSurface1.opacity(0.95))
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(borderBrand ? Color.irisBrand.opacity(0.4) : Color.irisWarmBorder, lineWidth: 1)
            )
    }
}

extension View {
    func irisScreen() -> some View { modifier(IrisScreenBackground()) }
    func irisCard(borderBrand: Bool = false) -> some View { modifier(IrisCardStyle(borderBrand: borderBrand)) }
}
