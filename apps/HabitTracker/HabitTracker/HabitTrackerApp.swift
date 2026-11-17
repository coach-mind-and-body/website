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

    func application(
        _ application: UIApplication,
        continue userActivity: NSUserActivity,
        restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
    ) -> Bool {
        guard userActivity.activityType == NSUserActivityTypeBrowsingWeb,
              let url = userActivity.webpageURL else { return false }
        DeepLink.open(url, applyToken: { _ in })
        return true
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
                    DeepLink.open(url) { token in
                        Task { await auth.applyTokenOnly(token) }
                    }
                }
                .onContinueUserActivity(NSUserActivityTypeBrowsingWeb) { activity in
                    guard let url = activity.webpageURL else { return }
                    DeepLink.open(url, applyToken: { _ in })
                }
        }
    }
}
