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

    static func notifyCoachReply(preview: String) async {
        let granted = await requestAuthorization()
        guard granted else { return }
        let content = UNMutableNotificationContent()
        content.title = "Lee Anne sent a message"
        content.body = preview
        content.sound = .default
        content.userInfo = ["url": "/habit-tracker/coach"]
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
        var date = DateComponents()
        date.hour = 20
        date.minute = 0
        let trigger = UNCalendarNotificationTrigger(dateMatching: date, repeats: true)
        let req = UNNotificationRequest(identifier: "evening-habits", content: content, trigger: trigger)
        try? await center.add(req)
    }
}
