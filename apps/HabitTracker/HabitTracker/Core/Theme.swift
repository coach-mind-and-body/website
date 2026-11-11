import SwiftUI
import UIKit

enum Keyboard {
    static func dismiss() {
        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
    }
}

/// One tap recognizer on the window. It ignores text fields and does not cancel other taps.
private struct KeyboardDismissInstaller: UIViewRepresentable {
    func makeUIView(context: Context) -> UIView {
        let view = UIView()
        view.isUserInteractionEnabled = false
        view.backgroundColor = .clear
        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        DispatchQueue.main.async {
            guard let window = uiView.window else { return }
            context.coordinator.attach(to: window)
        }
    }

    func makeCoordinator() -> Coordinator { Coordinator() }

    final class Coordinator: NSObject, UIGestureRecognizerDelegate {
        private weak var attached: UIView?

        func attach(to view: UIView) {
            guard attached !== view else { return }
            let tap = UITapGestureRecognizer(target: self, action: #selector(dismiss))
            tap.cancelsTouchesInView = false
            tap.delegate = self
            view.addGestureRecognizer(tap)
            attached = view
        }

        @objc func dismiss() { Keyboard.dismiss() }

        func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldReceive touch: UITouch) -> Bool {
            var view: UIView? = touch.view
            while let current = view {
                if current is UITextField || current is UITextView { return false }
                view = current.superview
            }
            return true
        }
    }
}

extension View {
    /// Drag a list or scroll view to hide the keyboard, and Done to dismiss it.
    func keyboardTyping() -> some View {
        scrollDismissesKeyboard(.interactively)
            .toolbar {
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button("Done") { Keyboard.dismiss() }
                        .fontWeight(.semibold)
                }
            }
    }

    func installKeyboardDismissTap() -> some View {
        background(KeyboardDismissInstaller())
    }
}

extension Notification.Name {
    static let mbrFoodLogged = Notification.Name("mbr.foodLogged")
    static let mbrOpenDeepLink = Notification.Name("mbr.openDeepLink")
    static let mbrDeviceToken = Notification.Name("mbr.deviceToken")
}

enum DeepLink: String {
    case challenge
    case coach
    case habits
    case programs

    static var pending: DeepLink?
    /// Set when a push names a thread. The coach inbox consumes it.
    static var pendingConversationId: Int?

    static func conversationId(from userInfo: [AnyHashable: Any]) -> Int? {
        if let n = userInfo["conversationId"] as? Int { return n }
        if let n = userInfo["conversationId"] as? NSNumber { return n.intValue }
        if let s = userInfo["conversationId"] as? String, let n = Int(s) { return n }
        return nil
    }

    static func post(_ link: DeepLink) {
        let conversationId = pendingConversationId
        DispatchQueue.main.async {
            pending = link
            var info: [String: Any] = ["link": link.rawValue]
            if let conversationId { info["conversationId"] = conversationId }
            NotificationCenter.default.post(
                name: .mbrOpenDeepLink,
                object: nil,
                userInfo: info
            )
        }
    }

    static func consumePending() -> DeepLink? {
        let link = pending
        pending = nil
        return link
    }

    static func fromNotification(_ userInfo: [AnyHashable: Any]) -> DeepLink? {
        if let id = conversationId(from: userInfo) {
            pendingConversationId = id
        }
        if let raw = userInfo["tab"] as? String, let link = DeepLink(rawValue: raw.lowercased()) {
            return link
        }
        let url = (userInfo["url"] as? String ?? "").lowercased()
        if url.contains("program") { return .programs }
        if url.contains("challenge") { return .challenge }
        if url.contains("coach") { return .coach }
        if url.contains("habit") { return .habits }
        return nil
    }

    static func fromURL(_ url: URL) -> DeepLink? {
        let host = (url.host ?? "").lowercased()
        if host == "auth" { return nil }
        if let link = DeepLink(rawValue: host) { return link }
        let path = url.path.lowercased()
        if path.contains("program") { return .programs }
        if path.contains("challenge") { return .challenge }
        if path.contains("coach") { return .coach }
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
    /// Extra scroll room so the last row can sit above the floating glass pill and chat button.
    /// Used on the compact outer display, where that pill is overlaid rather than in the safe area.
    static let dockClearance: CGFloat = 112
    /// Inner-display column. Wide enough to use the unfolded screen, narrow enough that lines stay readable.
    static let regularContentMax: CGFloat = 760
}

/// iPhone Duo: compact width is the outer display, regular width is the inner display.
/// Size class is read from the environment on every layout pass, so a fold or unfold updates these layouts.
enum DuoLayout {
    static func isRegularWidth(_ sizeClass: UserInterfaceSizeClass?) -> Bool {
        sizeClass == .regular
    }

    static func cardColumns(_ sizeClass: UserInterfaceSizeClass?) -> [GridItem] {
        if isRegularWidth(sizeClass) {
            return [
                GridItem(.flexible(), spacing: 12),
                GridItem(.flexible(), spacing: 12),
            ]
        }
        return [GridItem(.flexible(), spacing: 12)]
    }
}

extension View {
    func dockScrollClearance() -> some View {
        modifier(DockScrollClearance())
    }

    /// Same clearance as the floating dock, applied as padding on bars that sit above it.
    func dockBottomPadding() -> some View {
        modifier(DockBottomPadding())
    }

    /// Centers a column on the inner display. On the outer display the proposal is already narrower than the cap.
    func duoReadableColumn() -> some View {
        modifier(DuoReadableColumn())
    }

    func duoCenteredMeasure(_ maxWidth: CGFloat) -> some View {
        frame(maxWidth: maxWidth)
            .frame(maxWidth: .infinity)
    }

    /// Trailing rail only while the width is regular, so the compact outer display is left untouched.
    @ViewBuilder
    func duoTrailingRail<Rail: View>(active: Bool, @ViewBuilder rail: () -> Rail) -> some View {
        if active {
            safeAreaInset(edge: .trailing, spacing: 0) { rail() }
        } else {
            self
        }
    }

    /// Compact keeps today's fixed stage height. Regular follows a 16:9 frame of the width just offered.
    func duoStage(compactHeight: CGFloat) -> some View {
        modifier(DuoStage(compactHeight: compactHeight))
    }

    /// Full-bleed fill on the outer display. Fit on the inner display so a wider frame does not crop the subject.
    func duoHeroContent() -> some View {
        modifier(DuoHeroContent())
    }
}

private struct DockScrollClearance: ViewModifier {
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    @ViewBuilder func body(content: Content) -> some View {
        if DuoLayout.isRegularWidth(horizontalSizeClass) {
            content
        } else {
            content.safeAreaPadding(.bottom, HTTheme.dockClearance)
        }
    }
}

private struct DockBottomPadding: ViewModifier {
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    @ViewBuilder func body(content: Content) -> some View {
        if DuoLayout.isRegularWidth(horizontalSizeClass) {
            content
        } else {
            content.padding(.bottom, HTTheme.dockClearance)
        }
    }
}

private struct DuoReadableColumn: ViewModifier {
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    @ViewBuilder func body(content: Content) -> some View {
        if DuoLayout.isRegularWidth(horizontalSizeClass) {
            content
                .frame(maxWidth: HTTheme.regularContentMax, maxHeight: .infinity)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else {
            content
        }
    }
}

private struct DuoStage: ViewModifier {
    var compactHeight: CGFloat
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    @ViewBuilder func body(content: Content) -> some View {
        if DuoLayout.isRegularWidth(horizontalSizeClass) {
            HTTheme.roseBorder
                .aspectRatio(16.0 / 9.0, contentMode: .fit)
                .overlay { content }
                .clipped()
        } else {
            content
                .frame(maxWidth: .infinity)
                .frame(height: compactHeight)
                .clipped()
        }
    }
}

private struct DuoHeroContent: ViewModifier {
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    @ViewBuilder func body(content: Content) -> some View {
        if DuoLayout.isRegularWidth(horizontalSizeClass) {
            content.scaledToFit()
        } else {
            content.scaledToFill()
        }
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
    var spacing: CGFloat = 10
    @ViewBuilder var content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: spacing) {
            content()
        }
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
