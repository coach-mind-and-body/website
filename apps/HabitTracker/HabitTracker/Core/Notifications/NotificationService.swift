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

    /// Local reminders for the 5-Day Real Food Reset (Mountain Time).
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
            title: "Real Food Reset starts tomorrow",
            body: "We begin September 28. Lives Mon/Wed/Fri at 12:00 pm Mountain."
        )

        for (i, day) in days.enumerated() {
            await addOnce(
                id: "rfr-morning-\(i)",
                mountainDate: day.date,
                hour: 8,
                minute: 0,
                title: "Day \(day.n): \(day.title)",
                body: "Log your food and jot a few lines in the journal — progress, not perfection."
            )
            if day.live {
                await addOnce(
                    id: "rfr-live-\(i)",
                    mountainDate: day.date,
                    hour: 11,
                    minute: 45,
                    title: "We're live in 15 minutes",
                    body: "Join from the app — 12:00 pm Mountain."
                )
            }
            await addOnce(
                id: "rfr-evening-\(i)",
                mountainDate: day.date,
                hour: 19,
                minute: 0,
                title: "Evening check-in",
                body: "Log a meal or write three lines in your journal. That counts as today."
            )
        }
    }

    private static func addOnce(
        id: String,
        mountainDate: String,
        hour: Int,
        minute: Int,
        title: String,
        body: String
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
        content.userInfo = ["url": "/habit-tracker"]
        let trigger = UNCalendarNotificationTrigger(dateMatching: local, repeats: false)
        let req = UNNotificationRequest(identifier: id, content: content, trigger: trigger)
        try? await UNUserNotificationCenter.current().add(req)
    }
}
