import Foundation
import UIKit
import UserNotifications

enum DeviceTokenStore {
    private static let key = "apns.deviceToken"

    static var current: String? {
        UserDefaults.standard.string(forKey: key)
    }

    static func save(_ token: String) {
        UserDefaults.standard.set(token, forKey: key)
    }
}

enum NotificationService {
    private static var suppressLocalCoachUntil = Date.distantPast
    private static var lastLocalCoachId: String?

    static func requestAuthorization() async -> Bool {
        let center = UNUserNotificationCenter.current()
        do {
            let ok = try await center.requestAuthorization(options: [.alert, .badge, .sound])
            if ok { registerForRemoteNotifications() }
            return ok
        } catch {
            return false
        }
    }

    static func registerForRemoteNotifications() {
        DispatchQueue.main.async {
            UIApplication.shared.registerForRemoteNotifications()
        }
    }

    /// Registers when the user already allowed alerts, without showing the system prompt again.
    static func registerIfAuthorized() async {
        if await isAuthorized() {
            registerForRemoteNotifications()
        }
    }

    static func noteRemoteCoachDelivery() {
        suppressLocalCoachUntil = Date().addingTimeInterval(30)
        guard let lastLocalCoachId else { return }
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [lastLocalCoachId])
        center.removeDeliveredNotifications(withIdentifiers: [lastLocalCoachId])
    }

    static func isAuthorized() async -> Bool {
        let status = await UNUserNotificationCenter.current().notificationSettings().authorizationStatus
        return status == .authorized || status == .provisional
    }

    static func notifyCoachReply(preview: String) async {
        if Date() < suppressLocalCoachUntil { return }
        let granted = await requestAuthorization()
        guard granted else { return }
        let content = UNMutableNotificationContent()
        content.title = "Lee Anne sent a message"
        content.body = preview
        content.sound = .default
        content.userInfo = ["tab": "coach", "url": "/habit-tracker/coach"]
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 0.5, repeats: false)
        let identifier = "coach-\(Int(Date().timeIntervalSince1970))"
        lastLocalCoachId = identifier
        let req = UNNotificationRequest(
            identifier: identifier,
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

struct CoachingReminder: Equatable {
    var id: Int
    var scheduledAt: Date
    var programLabel: String
}

/// Local reminders for coaching sessions. Identifiers stay stable per session so a
/// time change replaces the pending request, and a cancelled or finished session drops it.
enum CoachingReminders {
    static let prefix = "coaching-session-"
    private static let dayLead: TimeInterval = 24 * 60 * 60
    private static let soonLead: TimeInterval = 15 * 60

    static func sync(_ reminders: [CoachingReminder], now: Date = Date()) async {
        let center = UNUserNotificationCenter.current()
        let upcoming = reminders.filter { $0.scheduledAt.timeIntervalSince(now) > -ProgramSession.upcomingGrace }
        let upcomingIds = Set(upcoming.map(\.id))

        let pending = await center.pendingNotificationRequests()
        let delivered = await center.deliveredNotifications()
        let known = (pending.map(\.identifier) + delivered.map(\.request.identifier)).filter { $0.hasPrefix(prefix) }
        let stale = known.filter { identifier in
            guard let sessionId = sessionId(from: identifier) else { return true }
            return !upcomingIds.contains(sessionId)
        }
        if !stale.isEmpty {
            center.removePendingNotificationRequests(withIdentifiers: stale)
            center.removeDeliveredNotifications(withIdentifiers: stale)
        }

        guard await NotificationService.isAuthorized() else { return }
        for reminder in upcoming {
            await schedule(reminder, lead: dayLead, kind: "day", now: now, center: center, pending: pending, delivered: delivered)
            await schedule(reminder, lead: soonLead, kind: "soon", now: now, center: center, pending: pending, delivered: delivered)
        }
    }

    private static func schedule(
        _ reminder: CoachingReminder,
        lead: TimeInterval,
        kind: String,
        now: Date,
        center: UNUserNotificationCenter,
        pending: [UNNotificationRequest],
        delivered: [UNNotification]
    ) async {
        let fire = reminder.scheduledAt.addingTimeInterval(-lead)
        let identifier = "\(prefix)\(reminder.id)-\(kind)"
        let stamp = reminder.scheduledAt.timeIntervalSince1970
        let pendingRequest = pending.first { $0.identifier == identifier }
        let pendingStamp = pendingRequest.flatMap { stamp(in: $0) }
        let deliveredNote = delivered.first { $0.request.identifier == identifier }
        let deliveredStamp = deliveredNote.flatMap { stamp(in: $0.request) }

        // The old fire time is no longer right. Drop a pending request that would
        // still go off, and a banner that names the previous time.
        if fire.timeIntervalSince(now) <= 1 {
            if pendingRequest != nil {
                center.removePendingNotificationRequests(withIdentifiers: [identifier])
            }
            if let deliveredStamp, abs(deliveredStamp - stamp) >= 1 {
                center.removeDeliveredNotifications(withIdentifiers: [identifier])
            }
            return
        }

        if let pendingStamp, abs(pendingStamp - stamp) < 1 {
            return
        }

        if deliveredNote != nil {
            center.removeDeliveredNotifications(withIdentifiers: [identifier])
        }
        let content = UNMutableNotificationContent()
        content.title = "Next session"
        let time = reminder.scheduledAt.formatted(date: .omitted, time: .shortened)
        content.body = kind == "soon"
            ? "Your \(reminder.programLabel) session starts in about 15 minutes."
            : "Your \(reminder.programLabel) session is tomorrow at \(time)."
        content.sound = .default
        let info: [AnyHashable: Any] = [
            "tab": "programs",
            "at": stamp,
        ]
        content.userInfo = info
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: fire.timeIntervalSince(now), repeats: false)
        let request = UNNotificationRequest(identifier: identifier, content: content, trigger: trigger)
        try? await center.add(request)
    }

    private static func stamp(in request: UNNotificationRequest) -> Double? {
        let raw = request.content.userInfo["at"]
        if let number = raw as? Double { return number }
        if let number = raw as? NSNumber { return number.doubleValue }
        return nil
    }

    private static func sessionId(from identifier: String) -> Int? {
        guard identifier.hasPrefix(prefix) else { return nil }
        let digits = identifier.dropFirst(prefix.count).prefix { $0.isNumber }
        guard !digits.isEmpty else { return nil }
        return Int(digits)
    }
}

/// One in-flight sync at a time. A newer hub wins; an older response cannot put a cancelled session back.
actor CoachingReminderCoordinator {
    static let shared = CoachingReminderCoordinator()
    private var newestToken = 0
    private var latest: [CoachingReminder] = []
    private var running = false
    private var dirty = false

    func begin() -> Int {
        newestToken += 1
        return newestToken
    }

    func apply(token: Int, reminders: [CoachingReminder]) async {
        guard token == newestToken else { return }
        latest = reminders
        dirty = true
        guard !running else { return }
        running = true
        while dirty {
            dirty = false
            let next = latest
            await CoachingReminders.sync(next)
        }
        running = false
    }
}

final class NotificationTapDelegate: NSObject, UNUserNotificationCenterDelegate {
    static let shared = NotificationTapDelegate()

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        let info = notification.request.content.userInfo
        let tab = (info["tab"] as? String)?.lowercased()
        let url = (info["url"] as? String)?.lowercased() ?? ""
        if !notification.request.identifier.hasPrefix("coach-"), tab == "coach" || url.contains("coach") {
            NotificationService.noteRemoteCoachDelivery()
        }
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
