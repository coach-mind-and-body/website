import SwiftUI

extension Notification.Name {
    static let mbrFoodLogged = Notification.Name("mbr.foodLogged")
    static let mbrOpenDeepLink = Notification.Name("mbr.openDeepLink")
}

enum DeepLink {
    case challenge
    case coach
    case habits

    static func post(_ link: DeepLink) {
        NotificationCenter.default.post(name: .mbrOpenDeepLink, object: link)
    }

    static func fromNotification(_ userInfo: [AnyHashable: Any]) -> DeepLink? {
        let tab = (userInfo["tab"] as? String ?? "").lowercased()
        let url = (userInfo["url"] as? String ?? "").lowercased()
        if tab == "challenge" || url.contains("challenge") { return .challenge }
        if tab == "coach" || url.contains("coach") { return .coach }
        if tab == "habits" || url.contains("habit-tracker") { return .habits }
        return nil
    }

    static func fromURL(_ url: URL) -> DeepLink? {
        let host = (url.host ?? "").lowercased()
        let path = url.path.lowercased()
        if host == "challenge" || path.contains("challenge") { return .challenge }
        if host == "coach" || path.contains("coach") { return .coach }
        if host == "habits" || path.contains("habit") { return .habits }
        return nil
    }
}

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

private struct ConfettiPiece: Identifiable {
    let id: Int
    let x: CGFloat
    let delay: Double
    let duration: Double
    let rotation: Double
    let drift: CGFloat
    let color: Color
    let w: CGFloat
    let h: CGFloat
}

/// iMessage-style confetti: pieces fall from the top of the screen.
struct ConfettiBurst: View {
    var token: Int
    @State private var pieces: [ConfettiPiece] = []

    var body: some View {
        GeometryReader { geo in
            ZStack {
                ForEach(pieces) { p in
                    FallingConfettiPiece(piece: p, canvas: geo.size)
                }
            }
        }
        .allowsHitTesting(false)
        .onChange(of: token) { old, new in
            guard new > old else { return }
            spawn()
        }
    }

    private func spawn() {
        let colors: [Color] = [
            HTTheme.gold,
            HTTheme.forest,
            Color.orange,
            Color.white,
            Color(red: 0.90, green: 0.45, blue: 0.48),
            Color(red: 0.95, green: 0.82, blue: 0.40),
            Color(red: 0.55, green: 0.72, blue: 0.55),
        ]
        pieces = (0..<72).map { i in
            ConfettiPiece(
                id: i,
                x: CGFloat.random(in: 0...1),
                delay: Double.random(in: 0...0.5),
                duration: Double.random(in: 1.9...3.1),
                rotation: Double.random(in: 180...780),
                drift: CGFloat.random(in: -50...50),
                color: colors.randomElement() ?? HTTheme.gold,
                w: CGFloat.random(in: 6...11),
                h: CGFloat.random(in: 8...18)
            )
        }
        Task { @MainActor in
            try? await Task.sleep(for: .seconds(3.4))
            pieces = []
        }
    }
}

private struct FallingConfettiPiece: View {
    let piece: ConfettiPiece
    let canvas: CGSize
    @State private var y: CGFloat = -24
    @State private var xOff: CGFloat = 0
    @State private var rot: Double = 0
    @State private var opacity: Double = 1

    var body: some View {
        RoundedRectangle(cornerRadius: 1.5)
            .fill(piece.color)
            .frame(width: piece.w, height: piece.h)
            .rotationEffect(.degrees(rot))
            .position(x: piece.x * canvas.width + xOff, y: y)
            .opacity(opacity)
            .onAppear {
                y = -24
                opacity = 1
                withAnimation(.easeIn(duration: piece.duration).delay(piece.delay)) {
                    y = canvas.height + 36
                    xOff = piece.drift
                    rot = piece.rotation
                    opacity = 0.12
                }
            }
    }
}
