import SwiftUI

@main
struct HabitTrackerApp: App {
    @State private var auth = AuthStore()
    @State private var health = HealthKitService()

    var body: some Scene {
        WindowGroup {
            RootView(auth: auth, health: health)
                .preferredColorScheme(.light)
        }
    }
}
