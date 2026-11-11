import SwiftUI

/// How the inner display is being held.
///
/// Apple documents closed, partially open, and fully open hinge states, plus a horizontal
/// fold used as a tabletop. A tent (an upside-down V with the screen facing out) is mentioned
/// only as a standing pose for camera accessories and AlarmKit, not as its own layout API.
/// A horizontal fold uses the tabletop arrangement. Rotation is left to the system.
enum DuoPosture: Equatable {
    /// Outer display, a normal iPhone, or iOS before 27.1.
    case compact
    /// Unfolded inner display, or a book fold. Two panes meet at the center.
    case sideBySide
    /// Half-folded with a horizontal hinge. Content on top, controls underneath.
    case tabletop

    /// Inner display is open. Folded and regular phones stay on the compact layout.
    var isOpenDisplay: Bool { self != .compact }
}

private struct DuoPostureKey: EnvironmentKey {
    static let defaultValue = DuoPosture.compact
}

extension EnvironmentValues {
    var duoPosture: DuoPosture {
        get { self[DuoPostureKey.self] }
        set { self[DuoPostureKey.self] = newValue }
    }
}

enum DuoPaneStyle {
    /// Compact shows only the primary view. The second pane appears on iPhone Duo.
    case augment
    /// Compact stacks both panes in one scroll, which is the phone layout.
    case split
    /// Compact pins the second pane to the bottom. Duo moves it beside or below.
    case dock
}

/// One parent for both panes, so a fold resizes them instead of rebuilding them.
struct DuoPanes<Primary: View, Secondary: View>: View {
    var style: DuoPaneStyle = .augment
    @ViewBuilder var primary: () -> Primary
    @ViewBuilder var controls: () -> Secondary
    @Environment(\.duoPosture) private var posture

    init(style: DuoPaneStyle = .augment, @ViewBuilder primary: @escaping () -> Primary, @ViewBuilder controls: @escaping () -> Secondary) {
        self.style = style
        self.primary = primary
        self.controls = controls
    }

    var body: some View {
        if style == .augment && posture == .compact {
            primary()
        } else {
            GeometryReader { geo in
                let placement = DuoPlacement.resolve(posture, style)
                ScrollView {
                    DuoPaneLayout(placement: placement, viewport: geo.size) {
                        primary()
                        controls()
                            .controlSize(posture == .tabletop ? .large : .regular)
                    }
                    .frame(width: geo.size.width, height: placement.fills(geo.size) ? geo.size.height : nil)
                }
                .scrollDisabled(placement != .stack)
            }
            .background(HTTheme.cream)
        }
    }
}

struct DuoPostureHost<Content: View>: View {
    @ViewBuilder var content: () -> Content
    @State private var posture = DuoPosture.compact

    var body: some View {
        content()
            .environment(\.duoPosture, posture)
            .background {
                DuoHingeMonitor(posture: $posture)
                    .allowsHitTesting(false)
            }
    }
}

private enum DuoPlacement: Equatable {
    case primaryOnly
    case stack
    case dock
    case sideBySide
    case tabletop

    static func resolve(_ posture: DuoPosture, _ style: DuoPaneStyle) -> DuoPlacement {
        switch posture {
        case .compact:
            switch style {
            case .augment: return .primaryOnly
            case .split: return .stack
            case .dock: return .dock
            }
        case .sideBySide:
            return .sideBySide
        case .tabletop:
            return .tabletop
        }
    }

    func fills(_ viewport: CGSize) -> Bool {
        _ = viewport
        return self != .stack
    }
}

private struct DuoPaneLayout: Layout {
    var placement: DuoPlacement
    var viewport: CGSize
    var spacing: CGFloat = 16
    /// Clear of the hinge. Not a device-size check; it is the gap between the two panes.
    var hingeGap: CGFloat = 28

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? viewport.width
        if placement == .stack {
            return CGSize(width: width, height: stackedHeight(subviews, width: width))
        }
        let height = proposal.height ?? viewport.height
        return CGSize(width: width, height: max(height, 1))
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        guard subviews.count >= 2 else {
            if let only = subviews.first {
                only.place(at: bounds.origin, anchor: .topLeading, proposal: ProposedViewSize(bounds.size))
            }
            return
        }
        let primary = subviews[0]
        let controls = subviews[1]
        switch placement {
        case .primaryOnly:
            primary.place(at: bounds.origin, anchor: .topLeading, proposal: ProposedViewSize(bounds.size))
            controls.place(at: bounds.origin, anchor: .topLeading, proposal: ProposedViewSize(width: 0, height: 0))
        case .stack:
            let primaryHeight = primary.sizeThatFits(ProposedViewSize(width: bounds.width, height: nil)).height
            primary.place(
                at: bounds.origin,
                anchor: .topLeading,
                proposal: ProposedViewSize(width: bounds.width, height: primaryHeight)
            )
            let controlsHeight = controls.sizeThatFits(ProposedViewSize(width: bounds.width, height: nil)).height
            controls.place(
                at: CGPoint(x: bounds.minX, y: bounds.minY + primaryHeight + spacing),
                anchor: .topLeading,
                proposal: ProposedViewSize(width: bounds.width, height: controlsHeight)
            )
        case .dock:
            let controlsHeight = min(
                bounds.height * 0.45,
                controls.sizeThatFits(ProposedViewSize(width: bounds.width, height: nil)).height
            )
            let primaryHeight = max(0, bounds.height - controlsHeight)
            primary.place(
                at: bounds.origin,
                anchor: .topLeading,
                proposal: ProposedViewSize(width: bounds.width, height: primaryHeight)
            )
            controls.place(
                at: CGPoint(x: bounds.minX, y: bounds.minY + primaryHeight),
                anchor: .topLeading,
                proposal: ProposedViewSize(width: bounds.width, height: controlsHeight)
            )
        case .sideBySide:
            let column = max(0, (bounds.width - hingeGap) / 2)
            primary.place(
                at: bounds.origin,
                anchor: .topLeading,
                proposal: ProposedViewSize(width: column, height: bounds.height)
            )
            controls.place(
                at: CGPoint(x: bounds.minX + column + hingeGap, y: bounds.minY),
                anchor: .topLeading,
                proposal: ProposedViewSize(width: column, height: bounds.height)
            )
        case .tabletop:
            let top = max(0, (bounds.height - hingeGap) * 0.58)
            let bottom = max(0, bounds.height - hingeGap - top)
            primary.place(
                at: bounds.origin,
                anchor: .topLeading,
                proposal: ProposedViewSize(width: bounds.width, height: top)
            )
            controls.place(
                at: CGPoint(x: bounds.minX, y: bounds.minY + top + hingeGap),
                anchor: .topLeading,
                proposal: ProposedViewSize(width: bounds.width, height: bottom)
            )
        }
    }

    private func stackedHeight(_ subviews: Subviews, width: CGFloat) -> CGFloat {
        guard subviews.count >= 2 else { return 0 }
        let primary = subviews[0].sizeThatFits(ProposedViewSize(width: width, height: nil)).height
        let controls = subviews[1].sizeThatFits(ProposedViewSize(width: width, height: nil)).height
        return primary + spacing + controls
    }
}

/// A screen that already sits in a parent split. Compact keeps DuoPanes. The open
/// inner display stays one column so the parent can use the other side.
struct DuoNested<Primary: View, Secondary: View>: View {
    var style: DuoPaneStyle = .augment
    @ViewBuilder var primary: () -> Primary
    @ViewBuilder var controls: () -> Secondary
    @Environment(\.duoPosture) private var posture

    init(style: DuoPaneStyle = .augment, @ViewBuilder primary: @escaping () -> Primary, @ViewBuilder controls: @escaping () -> Secondary) {
        self.style = style
        self.primary = primary
        self.controls = controls
    }

    var body: some View {
        if posture == .compact {
            DuoPanes(style: style, primary: primary, controls: controls)
        } else {
            primary()
        }
    }
}

struct DuoControlWell<Content: View>: View {
    @ViewBuilder var content: () -> Content

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                content()
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(16)
        }
        .background(HTTheme.cream)
    }
}

private struct DuoHingeMonitor: View {
    @Binding var posture: DuoPosture

    var body: some View {
        #if compiler(>=6.3)
        if #available(iOS 27.1, *) {
            DuoHingeProbe(posture: $posture)
        } else {
            Color.clear
        }
        #else
        Color.clear
        #endif
    }
}

#if compiler(>=6.3)
@available(iOS 27.1, *)
private struct DuoHingeProbe: View {
    @Binding var posture: DuoPosture
    @State private var hasHinge = false
    @State private var closed = false
    @State private var partial = false

    var body: some View {
        GeometryReader { proxy in
            Color.clear
                .onAppear { posture = current(proxy) }
                .onHingeChange { _, context in
                    hasHinge = context.hinge != nil
                    closed = context.hinge?.status == .closed
                    partial = context.hinge?.status == .partiallyOpen
                    posture = current(proxy)
                }
                .onChange(of: proxy.size) { _, _ in
                    posture = current(proxy)
                }
        }
    }

    private func current(_ proxy: GeometryProxy) -> DuoPosture {
        let active = proxy.reservedRegions(kind: .division).map(\.frame)
        if partial {
            return horizontal(active) ? .tabletop : .sideBySide
        }
        if !hasHinge || closed {
            if horizontal(active) { return .tabletop }
            if !active.isEmpty { return .sideBySide }
            return .compact
        }
        return .sideBySide
    }

    private func horizontal(_ frames: [CGRect]) -> Bool {
        guard let frame = frames.first, frame.width > 1, frame.height > 1 else { return false }
        return frame.width > frame.height
    }
}
#endif
