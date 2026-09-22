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
        } + (0..<6).map { "rfr-prep-\($0)" } + ["rfr-eve-before"]
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: ids)
        guard enrolled else { return }
        let granted = await requestAuthorization()
        guard granted else { return }

        let prep: [(date: String, title: String, body: String)] = [
            ("2026-09-22", "Don't clean the pantry", "Just open it. How much of what you eat comes from a package? No throwing anything away."),
            ("2026-09-23", "Look at breakfast first", "Tomorrow morning, see it before you eat it. Don't change it yet. Curiosity, not shoulds."),
            ("2026-09-24", "One “healthy” package", "Find a food you bought because the front looked good. Don't toss it. Notice why you chose it."),
            ("2026-09-25", "Follow the packages today", "Every time you open one to eat, just notice. After dinner too. No scorekeeping."),
            ("2026-09-26", "Please don't throw your food out", "What whole foods do you already like? That's enough to start. Simple beats fancy."),
            ("2026-09-27", "Tomorrow we start seeing", "No last supper. No proving anything. Come as you are — live is 1:00 pm Mountain, in the app."),
        ]
        let days: [(date: String, n: Int, live: Bool, morningTitle: String, morningBody: String, liveTitle: String, liveBody: String, eveningTitle: String, eveningBody: String)] = [
            ("2026-09-28", 1, true,
             "Day 1 — start seeing", "Notice one ultra-processed food. Swap one. That's the whole job. Live at 1:00.",
             "We're live in 15 minutes", "Processed vs whole. Come curious, not perfect. Tap to join.",
             "What actually surprised you?", "One swap. One “I didn't realize.” Write it in Challenge — messy days count."),
            ("2026-09-29", 2, false,
             "Day 2 — flip it", "Grab two of the same kind of food. Turn them over. The front is marketing.",
             "", "",
             "Which would you choose now?", "Two labels. One why. Log it in Challenge before you forget."),
            ("2026-09-30", 3, true,
             "Day 3 — sugar detective", "Find 3 foods you already eat with added sugar. No food police. Live at 1:00.",
             "Sugar talk in 15 minutes", "We're naming what's on the label — not judging your pantry. Tap to join.",
             "Wait… sugar was in THAT?", "Keep it, swap it, or choose it on purpose. Write the sneakiest one in Challenge."),
            ("2026-10-01", 4, false,
             "Day 4 — build it", "Protein + fat + fiber. One real plate. Ugly broccoli and paper plates count.",
             "", "",
             "What was on the plate?", "Protein, fat, fiber — then where you still get stuck even when you know what to eat."),
            ("2026-10-02", 5, true,
             "Day 5 — keep going", "Restaurants. 9pm. Weekends. Live at 1:00. You do not have to have been perfect to show up.",
             "Last live in 15 minutes", "How you keep going when life isn't perfect. Questions welcome. Tap to join.",
             "Don't start over Monday", "Five days. Your next choice is your next choice. Journal's in Challenge if you want it."),
        ]

        await addOnce(
            id: "rfr-eve-before",
            mountainDate: "2026-09-27",
            hour: 19,
            minute: 0,
            title: "Tomorrow we start seeing",
            body: "Don't clean the pantry tonight. Just show up. Live is 1:00 pm Mountain — join from the app.",
            tab: "challenge"
        )

        for (i, p) in prep.enumerated() {
            await addOnce(
                id: "rfr-prep-\(i)",
                mountainDate: p.date,
                hour: 8,
                minute: 0,
                title: p.title,
                body: p.body,
                tab: "challenge"
            )
        }

        for (i, day) in days.enumerated() {
            await addOnce(
                id: "rfr-morning-\(i)",
                mountainDate: day.date,
                hour: 8,
                minute: 0,
                title: day.morningTitle,
                body: day.morningBody,
                tab: "challenge"
            )
            if day.live {
                await addOnce(
                    id: "rfr-live-\(i)",
                    mountainDate: day.date,
                    hour: 12,
                    minute: 45,
                    title: day.liveTitle,
                    body: day.liveBody,
                    tab: "challenge"
                )
            }
            await addOnce(
                id: "rfr-evening-\(i)",
                mountainDate: day.date,
                hour: 19,
                minute: 0,
                title: day.eveningTitle,
                body: day.eveningBody,
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
