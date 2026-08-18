import SwiftUI

enum HTTheme {
    static let forest = Color(red: 45 / 255, green: 59 / 255, blue: 45 / 255)
    static let gold = Color(red: 201 / 255, green: 169 / 255, blue: 110 / 255)
    static let cream = Color(red: 250 / 255, green: 245 / 255, blue: 245 / 255)
    static let roseBorder = Color(red: 240 / 255, green: 232 / 255, blue: 228 / 255)
    static let muted = Color(red: 107 / 255, green: 122 / 255, blue: 107 / 255)

    static let serif = Font.system(.largeTitle, design: .serif).weight(.bold)
    static let title = Font.system(.title, design: .serif).weight(.bold)
    /// Extra scroll room so the last row can sit above the floating glass pill.
    static let dockClearance: CGFloat = 72
}

extension View {
    func dockScrollClearance() -> some View {
        contentMargins(.bottom, HTTheme.dockClearance, for: .scrollContent)
    }
}

private struct OpenProfileKey: EnvironmentKey {
    static let defaultValue: () -> Void = {}
}

extension EnvironmentValues {
    var openProfile: () -> Void {
        get { self[OpenProfileKey.self] }
        set { self[OpenProfileKey.self] = newValue }
    }
}

struct ProfileAvatarButton: View {
    var auth: AuthStore
    var isActive = false
    var action: (() -> Void)? = nil
    @Environment(\.openProfile) private var openProfile

    var body: some View {
        Button {
            (action ?? openProfile)()
        } label: {
            Image(systemName: auth.isSignedIn ? "person.crop.circle.fill" : "person.crop.circle")
                .font(.system(size: 22, weight: .regular))
                .foregroundStyle(isActive ? Color.white : HTTheme.forest)
                .frame(width: 40, height: 40)
                .background(isActive ? HTTheme.forest : Color.white.opacity(0.92))
                .clipShape(Circle())
                .overlay(Circle().stroke(isActive ? HTTheme.forest : HTTheme.roseBorder))
                .shadow(color: HTTheme.forest.opacity(0.1), radius: 6, y: 2)
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Profile")
    }
}

struct HTCard<Content: View>: View {
    @ViewBuilder var content: () -> Content

    var body: some View {
        content()
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .stroke(HTTheme.roseBorder, lineWidth: 1)
            )
    }
}
