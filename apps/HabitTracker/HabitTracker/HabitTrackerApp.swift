import SwiftUI

@main
struct HabitTrackerApp: App {
    @State private var auth = AuthStore()
    @State private var health = HealthKitService()

    var body: some Scene {
        WindowGroup {
            RootView(auth: auth, health: health)
                .preferredColorScheme(.light)
                .onOpenURL { url in
                    guard url.scheme == "habittracker",
                          let token = URLComponents(url: url, resolvingAgainstBaseURL: false)?
                            .queryItems?.first(where: { $0.name == "token" })?.value
                    else { return }
                    Task { await auth.applyTokenOnly(token) }
                }
        }
    }
}
