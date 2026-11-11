import SwiftUI
import UIKit

final class PushAppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        NotificationService.installDelegate()
        return true
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        DeviceTokenStore.save(token)
        NotificationCenter.default.post(name: .mbrDeviceToken, object: token)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("[Push] remote registration failed: \(error.localizedDescription)")
    }
}

@main
struct HabitTrackerApp: App {
    @UIApplicationDelegateAdaptor(PushAppDelegate.self) private var pushDelegate
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
