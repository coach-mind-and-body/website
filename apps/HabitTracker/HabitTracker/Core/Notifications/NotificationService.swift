import Foundation
import UserNotifications

enum NotificationService {
    static func requestAuthorization() async -> Bool {
        let center = UNUserNotificationCenter.current()
        do {
            return try await center.requestAuthorization(options: [.alert, .badge, .sound])
        } catch {
            return false
        }
    }

    static func isAuthorized() async -> Bool {
        let status = await UNUserNotificationCenter.current().notificationSettings().authorizationStatus
        return status == .authorized || status == .provisional
    }

    static func notifyCoachReply(preview: String) async {
        let granted = await requestAuthorization()
        guard granted else { return }
        let content = UNMutableNotificationContent()
        content.title = "Lee Anne sent a message"
        content.body = preview
        content.sound = .default
        content.userInfo = ["tab": "coach", "url": "/habit-tracker/coach"]
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 0.5, repeats: false)
        let req = UNNotificationRequest(
            identifier: "coach-\(Int(Date().timeIntervalSince1970))",
            content: content,
            trigger: trigger
        )
        try? await UNUserNotificationCenter.current().add(req)
    }

    static func scheduleEveningNudge() async {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: ["evening-habits"])
        let content = UNMutableNotificationContent()
        content.title = "Evening check-in"
        content.body = "A quiet look at today's habits — no scoreboard."
        content.sound = .default
        content.userInfo = ["tab": "habits", "url": "/habit-tracker"]
        var date = DateComponents()
        date.hour = 20
        date.minute = 0
        let trigger = UNCalendarNotificationTrigger(dateMatching: date, repeats: true)
        let req = UNNotificationRequest(identifier: "evening-habits", content: content, trigger: trigger)
        try? await center.add(req)
    }

    /// Local reminders for the 5-Day No Processed Food Challenge (Mountain Time).
    /// Remote APNs still needs the paid Apple team + TestFlight; this covers the phone
    /// once the app has been opened and permission granted.
    static func scheduleChallengeNudges(enrolled: Bool) async {
        let ids = (0..<5).flatMap { n -> [String] in
            ["rfr-morning-\(n)", "rfr-live-\(n)", "rfr-evening-\(n)"]
        } + ["rfr-eve-before"]
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: ids)
        guard enrolled else { return }
        let granted = await requestAuthorization()
        guard granted else { return }

        let days: [(date: String, n: Int, title: String, live: Bool)] = [
            ("2026-09-28", 1, "Processed food vs. whole food", true),
            ("2026-09-29", 2, "Become a food-label detective", false),
            ("2026-09-30", 3, "Let’s talk sugar", true),
            ("2026-10-01", 4, "Protein is not the answer", false),
            ("2026-10-02", 5, "Real food in the real world", true),
        ]

        await addOnce(
            id: "rfr-eve-before",
            mountainDate: "2026-09-27",
            hour: 19,
            minute: 0,
            title: "No Processed Food Challenge starts tomorrow",
            body: "We begin September 28. Lives Mon/Wed/Fri at 1:00 pm Mountain.",
            tab: "challenge"
        )

        for (i, day) in days.enumerated() {
            await addOnce(
                id: "rfr-morning-\(i)",
                mountainDate: day.date,
                hour: 8,
                minute: 0,
                title: "Day \(day.n): \(day.title)",
                body: day.live
                    ? "Class is at 1:00 pm Mountain. Open Challenge when you’re ready."
                    : "Today’s video and recipes are in Challenge.",
                tab: "challenge"
            )
            if day.live {
                await addOnce(
                    id: "rfr-live-\(i)",
                    mountainDate: day.date,
                    hour: 12,
                    minute: 45,
                    title: "Class starts in 15 minutes",
                    body: "Tap to join live — 1:00 pm Mountain.",
                    tab: "challenge"
                )
            }
            await addOnce(
                id: "rfr-evening-\(i)",
                mountainDate: day.date,
                hour: 19,
                minute: 0,
                title: "Evening check-in",
                body: "Open Challenge to log today and write three lines. That counts.",
                tab: "challenge"
            )
        }
    }

    private static func addOnce(
        id: String,
        mountainDate: String,
        hour: Int,
        minute: Int,
        title: String,
        body: String,
        tab: String = "challenge"
    ) async {
        let parts = mountainDate.split(separator: "-").compactMap { Int($0) }
        guard parts.count == 3 else { return }
        var mt = Calendar(identifier: .gregorian)
        mt.timeZone = AppConfig.mountainTimeZone
        guard let fire = mt.date(from: DateComponents(
            year: parts[0], month: parts[1], day: parts[2], hour: hour, minute: minute
        )), fire > Date() else { return }

        let local = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: fire)
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        content.userInfo = ["tab": tab, "url": "/habit-tracker?focus=challenge"]
        let trigger = UNCalendarNotificationTrigger(dateMatching: local, repeats: false)
        let req = UNNotificationRequest(identifier: id, content: content, trigger: trigger)
        try? await UNUserNotificationCenter.current().add(req)
    }

    static func installDelegate() {
        UNUserNotificationCenter.current().delegate = NotificationTapDelegate.shared
    }
}

final class NotificationTapDelegate: NSObject, UNUserNotificationCenterDelegate {
    static let shared = NotificationTapDelegate()

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .sound, .list])
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let info = response.notification.request.content.userInfo
        DispatchQueue.main.async {
            if let link = DeepLink.fromNotification(info) {
                DeepLink.post(link)
            }
            completionHandler()
        }
    }
}
