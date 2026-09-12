import SwiftUI

@main
struct HabitTrackerApp: App {
    @State private var auth = AuthStore()
    @State private var health = HealthKitService()

    init() {
        NotificationService.installDelegate()
    }

    var body: some Scene {
        WindowGroup {
            RootView(auth: auth, health: health)
                .preferredColorScheme(.light)
                .onOpenURL { url in
                    guard url.scheme == "habittracker" else { return }
                    if let token = URLComponents(url: url, resolvingAgainstBaseURL: false)?
                        .queryItems?.first(where: { $0.name == "token" })?.value {
                        Task { await auth.applyTokenOnly(token) }
                    }
                    if let link = DeepLink.fromURL(url) {
                        DeepLink.post(link)
                    }
                }
        }
    }
}
