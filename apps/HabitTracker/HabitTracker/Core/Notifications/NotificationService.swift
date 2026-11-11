import Foundation
import UIKit
import UserNotifications

/// Category identifiers. The server sends the same strings in aps.category.
enum NotificationCategory {
    static let coachMessage = "coach-message"
    static let habitReminder = "habit-reminder"
    static let waterProtein = "water-protein"
    static let moveReminder = "move-reminder"
    static let sessionReminder = "session-reminder"
    static let homeworkForm = "homework-form"
    static let foodLog = "food-log"
    static let coachClientMessage = "coach-client-message"
    static let coachIntake = "coach-intake"
    static let challenge = "challenge"
}

enum NotificationAction {
    static let coachReply = "coach.reply"
    static let coachRead = "coach.read"
    static let habitSnooze = "habit.snooze"
    static let habitDone = "habit.done"
    static let habitSkip = "habit.skip"
    static let water = "nudge.water"
    static let protein = "nudge.protein"
    static let walk10 = "move.walk10"
    static let walk20 = "move.walk20"
    static let sessionJoin = "session.join"
    static let sessionRemind = "session.remind5"
    static let formOpen = "form.open"
    static let formTonight = "form.tonight"
    static let foodLog = "food.log"
    static let foodScan = "food.scan"
    static let adminReply = "admin.reply"
    static let adminRead = "admin.read"
    static let adminOpen = "admin.open"

    static let foreground: Set<String> = [
        sessionJoin, formOpen, foodLog, foodScan, adminOpen,
    ]
}

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
    static let remindersKey = "notify.dailyReminders"
    static let dailyIds = ["evening-habits", "nudge-water-protein", "nudge-move", "nudge-food"]

    static func registerCategories() {
        let reply = UNTextInputNotificationAction(
            identifier: NotificationAction.coachReply,
            title: "Reply",
            options: [.authenticationRequired],
            textInputButtonTitle: "Send",
            textInputPlaceholder: "Write Lee Anne back"
        )
        let adminReply = UNTextInputNotificationAction(
            identifier: NotificationAction.adminReply,
            title: "Reply",
            options: [.authenticationRequired],
            textInputButtonTitle: "Send",
            textInputPlaceholder: "Write back"
        )
        let markRead = UNNotificationAction(identifier: NotificationAction.coachRead, title: "Mark read", options: [.authenticationRequired])
        let adminRead = UNNotificationAction(identifier: NotificationAction.adminRead, title: "Mark read", options: [.authenticationRequired])
        let snooze = UNNotificationAction(identifier: NotificationAction.habitSnooze, title: "Snooze 10 min", options: [])
        let done = UNNotificationAction(identifier: NotificationAction.habitDone, title: "Mark done", options: [.authenticationRequired])
        let skip = UNNotificationAction(identifier: NotificationAction.habitSkip, title: "Skip today", options: [.authenticationRequired])
        let water = UNNotificationAction(identifier: NotificationAction.water, title: "+8 oz water", options: [.authenticationRequired])
        let protein = UNNotificationAction(identifier: NotificationAction.protein, title: "+20g protein", options: [.authenticationRequired])
        let walk10 = UNNotificationAction(identifier: NotificationAction.walk10, title: "Log 10-min walk", options: [.authenticationRequired])
        let walk20 = UNNotificationAction(identifier: NotificationAction.walk20, title: "Log 20-min walk", options: [.authenticationRequired])
        let join = UNNotificationAction(identifier: NotificationAction.sessionJoin, title: "Join", options: [.foreground])
        let remind = UNNotificationAction(identifier: NotificationAction.sessionRemind, title: "Remind me 5 min before", options: [])
        let openForm = UNNotificationAction(identifier: NotificationAction.formOpen, title: "Open now", options: [.foreground])
        let tonight = UNNotificationAction(identifier: NotificationAction.formTonight, title: "Remind me tonight", options: [])
        let logFood = UNNotificationAction(identifier: NotificationAction.foodLog, title: "Log food", options: [.foreground])
        let scan = UNNotificationAction(identifier: NotificationAction.foodScan, title: "Scan my written log", options: [.foreground])
        let openAdmin = UNNotificationAction(identifier: NotificationAction.adminOpen, title: "Open in admin", options: [.foreground])

        let categories: [UNNotificationCategory] = [
            UNNotificationCategory(identifier: NotificationCategory.coachMessage, actions: [reply, markRead], intentIdentifiers: [], options: []),
            UNNotificationCategory(identifier: NotificationCategory.habitReminder, actions: [done, snooze, skip], intentIdentifiers: [], options: []),
            UNNotificationCategory(identifier: NotificationCategory.waterProtein, actions: [water, protein], intentIdentifiers: [], options: []),
            UNNotificationCategory(identifier: NotificationCategory.moveReminder, actions: [walk10, walk20], intentIdentifiers: [], options: []),
            UNNotificationCategory(identifier: NotificationCategory.sessionReminder, actions: [join, remind], intentIdentifiers: [], options: []),
            UNNotificationCategory(identifier: NotificationCategory.homeworkForm, actions: [openForm, tonight], intentIdentifiers: [], options: []),
            UNNotificationCategory(identifier: NotificationCategory.foodLog, actions: [logFood, scan], intentIdentifiers: [], options: []),
            UNNotificationCategory(identifier: NotificationCategory.coachClientMessage, actions: [adminReply, adminRead], intentIdentifiers: [], options: []),
            UNNotificationCategory(identifier: NotificationCategory.coachIntake, actions: [openAdmin], intentIdentifiers: [], options: []),
            UNNotificationCategory(identifier: NotificationCategory.challenge, actions: [], intentIdentifiers: [], options: []),
        ]
        UNUserNotificationCenter.current().setNotificationCategories(Set(categories))
    }

    static func requestAuthorization() async -> Bool {
        registerCategories()
        let center = UNUserNotificationCenter.current()
        do {
            let ok = try await center.requestAuthorization(options: [.alert, .badge, .sound, .timeSensitive])
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
        content.categoryIdentifier = NotificationCategory.coachMessage
        content.threadIdentifier = "coach"
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

    static func clearDailyReminders() {
        UserDefaults.standard.set(false, forKey: remindersKey)
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: dailyIds)
    }

    /// Reschedules the daytime nudges and the 8 pm check-in when reminders are on.
    static func refreshDailyReminders() async {
        let defaults = UserDefaults.standard
        let enabled: Bool
        if defaults.object(forKey: remindersKey) != nil {
            enabled = defaults.bool(forKey: remindersKey)
        } else {
            enabled = await isAuthorized()
        }
        if enabled, await isAuthorized() {
            await scheduleEveningNudge()
        }
    }

    static func scheduleEveningNudge() async {
        UserDefaults.standard.set(true, forKey: remindersKey)
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: dailyIds)
        await addDaily(
            id: "nudge-water-protein",
            hour: 14,
            minute: 0,
            title: "Water or protein",
            body: "A glass, or a little protein, if you want it.",
            category: NotificationCategory.waterProtein,
            tab: "habits",
            url: "/habit-tracker"
        )
        await addDaily(
            id: "nudge-move",
            hour: 16,
            minute: 30,
            title: "A short walk",
            body: "Ten or twenty minutes counts.",
            category: NotificationCategory.moveReminder,
            tab: "fitness",
            url: "/habit-tracker"
        )
        await addDaily(
            id: "nudge-food",
            hour: 18,
            minute: 30,
            title: "What did you eat?",
            body: "Log it here, or scan the page you already wrote.",
            category: NotificationCategory.foodLog,
            tab: "food",
            url: "/habit-tracker"
        )
        await addDaily(
            id: "evening-habits",
            hour: 20,
            minute: 0,
            title: "Evening check-in",
            body: "A quiet look at today's habits — no scoreboard.",
            category: NotificationCategory.habitReminder,
            tab: "habits",
            url: "/habit-tracker"
        )
    }

    private static func addDaily(
        id: String,
        hour: Int,
        minute: Int,
        title: String,
        body: String,
        category: String,
        tab: String,
        url: String
    ) async {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        content.categoryIdentifier = category
        content.userInfo = ["tab": tab, "url": url]
        var date = DateComponents()
        date.hour = hour
        date.minute = minute
        let trigger = UNCalendarNotificationTrigger(dateMatching: date, repeats: true)
        let req = UNNotificationRequest(identifier: id, content: content, trigger: trigger)
        try? await UNUserNotificationCenter.current().add(req)
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
        content.categoryIdentifier = NotificationCategory.challenge
        content.userInfo = ["tab": tab, "url": "/habit-tracker?focus=challenge"]
        let trigger = UNCalendarNotificationTrigger(dateMatching: local, repeats: false)
        let req = UNNotificationRequest(identifier: id, content: content, trigger: trigger)
        try? await UNUserNotificationCenter.current().add(req)
    }

    static func installDelegate() {
        registerCategories()
        UNUserNotificationCenter.current().delegate = NotificationTapDelegate.shared
    }
}

struct CoachingReminder: Equatable {
    var id: Int
    var scheduledAt: Date
    var programLabel: String
    var meetURL: String? = nil
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
        let pendingStamp = pendingRequest.flatMap { Self.stamp(in: $0) }
        let deliveredNote = delivered.first { $0.request.identifier == identifier }
        let deliveredStamp = deliveredNote.flatMap { Self.stamp(in: $0.request) }

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
        content.categoryIdentifier = NotificationCategory.sessionReminder
        content.interruptionLevel = .timeSensitive
        content.threadIdentifier = "session-\(reminder.id)"
        var info: [AnyHashable: Any] = [
            "tab": "programs",
            "at": stamp,
            "sessionId": reminder.id,
        ]
        if let meetURL = reminder.meetURL, !meetURL.isEmpty {
            info["sessionUrl"] = meetURL
        }
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
        Task {
            await NotificationActionCenter.handle(response)
            completionHandler()
        }
    }
}

/// Background actions use the signed-in token and finish without opening the app.
enum NotificationActionCenter {
    static func handle(_ response: UNNotificationResponse) async {
        let action = response.actionIdentifier
        if action == UNNotificationDismissActionIdentifier { return }
        let content = response.notification.request.content
        let info = content.userInfo
        switch action {
        case NotificationAction.coachReply:
            await replyToCoach(text(from: response))
        case NotificationAction.coachRead:
            await markCoachRead()
        case NotificationAction.habitSnooze:
            await snooze(content)
        case NotificationAction.habitDone:
            await markHabit(done: true, info: info)
        case NotificationAction.habitSkip:
            await markHabit(done: false, info: info)
        case NotificationAction.water:
            await addWater()
        case NotificationAction.protein:
            await addProtein()
        case NotificationAction.walk10:
            await logWalk(minutes: 10)
        case NotificationAction.walk20:
            await logWalk(minutes: 20)
        case NotificationAction.sessionJoin:
            await openSession(info)
        case NotificationAction.sessionRemind:
            await remindBeforeSession(content)
        case NotificationAction.formOpen:
            openForm(info)
        case NotificationAction.formTonight:
            await remindTonight(content)
        case NotificationAction.foodLog:
            openFood("log")
        case NotificationAction.foodScan:
            openFood("scan")
        case NotificationAction.adminReply:
            await replyAsCoach(text(from: response), info: info)
        case NotificationAction.adminRead:
            await markAdminRead(info)
        case NotificationAction.adminOpen:
            await openAdmin(info)
        case UNNotificationDefaultActionIdentifier:
            await openFromTap(content)
        default:
            break
        }
    }

    private static func text(from response: UNNotificationResponse) -> String {
        (response as? UNTextInputNotificationResponse)?.userText.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    }

    private static func replyToCoach(_ text: String) async {
        guard !text.isEmpty, let client = await signedInClient() else { return }
        let _: SuccessFlag? = try? await client.mutate(
            "coach.send",
            input: SendCoachInput(content: text, mediaUrl: nil, replyToId: nil)
        )
        notifyRefresh()
    }

    private static func markCoachRead() async {
        guard let client = await signedInClient() else { return }
        let _: SuccessFlag? = try? await client.mutateEmpty("coach.markRead")
        notifyRefresh()
    }

    private static func replyAsCoach(_ text: String, info: [AnyHashable: Any]) async {
        guard !text.isEmpty, let conversationId = intValue(info, key: "conversationId") ?? intValue(info, key: "threadId"),
              let client = await signedInClient() else { return }
        let _: SuccessFlag? = try? await client.mutate(
            "messaging.mockSendSms",
            input: SendAdminMessageInput(conversationId: conversationId, content: text, mediaUrl: nil, replyToId: nil)
        )
        notifyRefresh()
    }

    private static func markAdminRead(_ info: [AnyHashable: Any]) async {
        guard let conversationId = intValue(info, key: "conversationId") ?? intValue(info, key: "threadId"),
              let client = await signedInClient() else { return }
        let _: SuccessFlag? = try? await client.mutate(
            "messaging.markAsRead",
            input: AdminTypingInput(conversationId: conversationId)
        )
        notifyRefresh()
    }

    private static func markHabit(done: Bool, info: [AnyHashable: Any]) async {
        let habitId = intValue(info, key: "habitId")
        let day = MountainDate.today()
        if let client = await signedInClient() {
            let path = done ? "notificationActions.markHabitDone" : "notificationActions.skipHabit"
            let _: SuccessFlag? = try? await client.mutate(path, input: HabitActionInput(habitId: habitId, dateStr: day))
            notifyRefresh()
            return
        }
        patchGuestHabit(done: done, habitId: habitId, day: day)
        notifyRefresh()
    }

    private static func addWater() async {
        let day = MountainDate.today()
        if let client = await signedInClient() {
            let _: SuccessFlag? = try? await client.mutate("notificationActions.addWater", input: DateStrInput(dateStr: day))
            notifyRefresh()
            return
        }
        bumpGuestWater(day: day)
        notifyRefresh()
    }

    private static func addProtein() async {
        let day = MountainDate.today()
        if let client = await signedInClient() {
            let _: SuccessFlag? = try? await client.mutate("notificationActions.addProtein", input: ProteinActionInput(dateStr: day))
            await MainActor.run {
                NotificationCenter.default.post(name: .mbrFoodLogged, object: nil)
            }
            return
        }
        var logs = GuestLocalStore.loadCalories()
        logs.insert(
            CalorieLog(
                id: Int(Date().timeIntervalSince1970),
                dateStr: day,
                mealType: "snack",
                foodName: "Quick protein",
                calories: 80,
                protein: 20,
                carbs: 0,
                fat: 0,
                fiber: 0,
                createdAt: Date()
            ),
            at: 0
        )
        GuestLocalStore.saveCalories(logs)
        await MainActor.run {
            NotificationCenter.default.post(name: .mbrFoodLogged, object: nil)
        }
    }

    private static func logWalk(minutes: Int) async {
        let day = MountainDate.today()
        let name = minutes >= 20 ? "Walk 20m" : "Walk 10m"
        if let client = await signedInClient() {
            do {
                let _: SuccessFlag = try await client.mutate(
                    "notificationActions.logWalk",
                    input: WalkActionInput(minutes: minutes, dateStr: day)
                )
            } catch {
                return
            }
        } else {
            var logs = GuestLocalStore.loadFitness()
            logs.insert(
                FitnessLog(
                    id: Int(Date().timeIntervalSince1970),
                    dateStr: day,
                    exerciseName: name,
                    sets: 1,
                    reps: 0,
                    weight: 0,
                    durationMinutes: minutes
                ),
                at: 0
            )
            GuestLocalStore.saveFitness(logs)
        }
        let health = await MainActor.run { HealthKitService() }
        await health.saveWorkout(named: name, minutes: minutes, on: day)
        notifyRefresh()
    }

    private static func snooze(_ content: UNNotificationContent) async {
        let copy = cloned(content)
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 10 * 60, repeats: false)
        let id = "snooze-\(Int(Date().timeIntervalSince1970))"
        let request = UNNotificationRequest(identifier: id, content: copy, trigger: trigger)
        try? await UNUserNotificationCenter.current().add(request)
    }

    private static func remindBeforeSession(_ content: UNNotificationContent) async {
        let info = content.userInfo
        guard let stamp = doubleValue(info, key: "at") else { return }
        let fire = Date(timeIntervalSince1970: stamp).addingTimeInterval(-5 * 60)
        guard fire.timeIntervalSinceNow > 1 else { return }
        let copy = cloned(content)
        copy.title = "Coming up in 5 minutes"
        copy.categoryIdentifier = NotificationCategory.sessionReminder
        copy.interruptionLevel = .timeSensitive
        copy.sound = .default
        let sessionId = intValue(info, key: "sessionId") ?? intValue(info, key: "habitId") ?? Int(stamp)
        let request = UNNotificationRequest(
            identifier: "coaching-session-\(sessionId)-five",
            content: copy,
            trigger: UNTimeIntervalNotificationTrigger(timeInterval: fire.timeIntervalSinceNow, repeats: false)
        )
        try? await UNUserNotificationCenter.current().add(request)
    }

    private static func remindTonight(_ content: UNNotificationContent) async {
        var calendar = Calendar.current
        var parts = calendar.dateComponents([.year, .month, .day], from: Date())
        parts.hour = 19
        parts.minute = 0
        var fire = calendar.date(from: parts) ?? Date()
        if fire.timeIntervalSinceNow < 60 {
            fire = calendar.date(byAdding: .day, value: 1, to: fire) ?? fire.addingTimeInterval(24 * 60 * 60)
        }
        let copy = cloned(content)
        copy.title = content.title.isEmpty ? "Tonight" : content.title
        copy.categoryIdentifier = NotificationCategory.homeworkForm
        copy.sound = .default
        let formId = intValue(content.userInfo, key: "formId") ?? 0
        let when = calendar.dateComponents([.year, .month, .day, .hour, .minute], from: fire)
        let request = UNNotificationRequest(
            identifier: "form-tonight-\(formId)",
            content: copy,
            trigger: UNCalendarNotificationTrigger(dateMatching: when, repeats: false)
        )
        try? await UNUserNotificationCenter.current().add(request)
    }

    private static func openSession(_ info: [AnyHashable: Any]) async {
        if let raw = stringValue(info, key: "sessionUrl"), let url = URL(string: raw) {
            await MainActor.run { UIApplication.shared.open(url) }
            return
        }
        await MainActor.run {
            if let link = DeepLink.fromNotification(info) {
                DeepLink.post(link)
            } else {
                DeepLink.post(.programs)
            }
        }
    }

    private static func openForm(_ info: [AnyHashable: Any]) {
        if let id = intValue(info, key: "formId") {
            DeepLink.pendingFormId = id
        }
        DeepLink.post(.form)
    }

    private static func openFood(_ intent: String) {
        FoodIntentStore.pending = intent
        DeepLink.post(intent == "scan" ? .scan : .food)
    }

    private static func openAdmin(_ info: [AnyHashable: Any]) async {
        guard let url = adminURL(info) else { return }
        await MainActor.run { UIApplication.shared.open(url) }
    }

    private static func openFromTap(_ content: UNNotificationContent) async {
        let info = content.userInfo
        let category = content.categoryIdentifier
        if category == NotificationCategory.coachIntake || isAdminDestination(info, category: category) {
            await openAdmin(info)
            return
        }
        if category == NotificationCategory.homeworkForm || intValue(info, key: "formId") != nil {
            openForm(info)
            return
        }
        if category == NotificationCategory.foodLog || (info["tab"] as? String) == "food" {
            await MainActor.run { DeepLink.post(.food) }
            return
        }
        if category == NotificationCategory.moveReminder || (info["tab"] as? String) == "fitness" {
            await MainActor.run { DeepLink.post(.fitness) }
            return
        }
        await MainActor.run {
            if let link = DeepLink.fromNotification(info) {
                DeepLink.post(link)
            }
        }
    }

    private static func signedInClient() async -> TRPCClient? {
        guard let token = KeychainStore.readToken(), !token.isEmpty else { return nil }
        let client = TRPCClient()
        await client.setToken(token)
        return client
    }

    private static func notifyRefresh() {
        DispatchQueue.main.async {
            NotificationCenter.default.post(name: .mbrNotificationAction, object: nil)
        }
    }

    private static func patchGuestHabit(done: Bool, habitId: Int?, day: String) {
        let habits = GuestLocalStore.loadHabits().filter { $0.isActive != false }
        var logs = GuestLocalStore.loadLogs()
        let completedIds = Set(logs.filter { $0.dateStr == day && $0.completed }.map(\.userHabitId))
        let id = habitId ?? habits
            .sorted { ($0.order ?? 0) < ($1.order ?? 0) }
            .first { habit in
                !completedIds.contains(habit.id)
                    && !isMacro(habit.title)
                    && !isVictory(habit.title)
            }?.id
        guard let id, habits.contains(where: { $0.id == id }) else { return }
        if let index = logs.firstIndex(where: { $0.userHabitId == id && $0.dateStr == day }) {
            logs[index].completed = done
        } else if done {
            logs.append(HabitLog(id: nil, userHabitId: id, dateStr: day, completed: true, numericValue: nil))
        }
        GuestLocalStore.saveLogs(logs)
    }

    private static func bumpGuestWater(day: String) {
        let habits = GuestLocalStore.loadHabits().filter { $0.isActive != false }
        guard let habit = habits.first(where: { isWater($0.title) && $0.isNumeric })
            ?? habits.first(where: { isWater($0.title) }) else { return }
        let step = (habit.unit ?? "").lowercased().contains("cup") ? 1 : 8
        var logs = GuestLocalStore.loadLogs()
        if let index = logs.firstIndex(where: { $0.userHabitId == habit.id && $0.dateStr == day }) {
            let next = (logs[index].numericValue ?? 0) + step
            logs[index].numericValue = next
            let goal = habit.targetValue ?? 0
            logs[index].completed = goal > 0 ? next >= goal : next > 0
        } else {
            let goal = habit.targetValue ?? 0
            logs.append(HabitLog(
                id: nil,
                userHabitId: habit.id,
                dateStr: day,
                completed: goal > 0 ? step >= goal : true,
                numericValue: step
            ))
        }
        GuestLocalStore.saveLogs(logs)
    }

    private static func cloned(_ content: UNNotificationContent) -> UNMutableNotificationContent {
        if let copy = content.mutableCopy() as? UNMutableNotificationContent {
            return copy
        }
        let copy = UNMutableNotificationContent()
        copy.title = content.title
        copy.body = content.body
        copy.sound = content.sound
        copy.categoryIdentifier = content.categoryIdentifier
        copy.userInfo = content.userInfo
        copy.threadIdentifier = content.threadIdentifier
        copy.interruptionLevel = content.interruptionLevel
        return copy
    }

    private static func isWater(_ title: String) -> Bool {
        let t = title.lowercased()
        return t.contains("water") || t.contains("hydrate")
    }

    private static func isMacro(_ title: String) -> Bool {
        let t = title.lowercased()
        return t.contains("protein") || t.contains("fiber")
    }

    private static func isVictory(_ title: String) -> Bool {
        let t = title.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        return t.contains("3 win") || t.contains("three win") || t.contains("3 victories")
            || t.contains("victory list") || t == "write 3 wins" || t == "write 3 wins tonight"
    }

    private static func adminURL(_ info: [AnyHashable: Any]) -> URL? {
        let raw = stringValue(info, key: "url") ?? "/admin?tab=intakes"
        if let absolute = URL(string: raw), absolute.scheme != nil { return absolute }
        let path = raw.hasPrefix("/") ? raw : "/\(raw)"
        return URL(string: path, relativeTo: AppConfig.apiRoot)?.absoluteURL
    }

    private static func isAdminDestination(_ info: [AnyHashable: Any], category: String) -> Bool {
        if category == NotificationCategory.coachClientMessage { return false }
        if (info["tab"] as? String)?.lowercased() == "coach" { return false }
        let url = (stringValue(info, key: "url") ?? "").lowercased()
        return url.contains("/admin")
    }

    private static func intValue(_ info: [AnyHashable: Any], key: String) -> Int? {
        if let n = info[key] as? Int { return n }
        if let n = info[key] as? NSNumber { return n.intValue }
        if let s = info[key] as? String, let n = Int(s) { return n }
        return nil
    }

    private static func doubleValue(_ info: [AnyHashable: Any], key: String) -> Double? {
        if let n = info[key] as? Double { return n }
        if let n = info[key] as? NSNumber { return n.doubleValue }
        if let s = info[key] as? String, let n = Double(s) { return n }
        return nil
    }

    private static func stringValue(_ info: [AnyHashable: Any], key: String) -> String? {
        info[key] as? String
    }
}

private struct HabitActionInput: Encodable {
    let habitId: Int?
    let dateStr: String

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(dateStr, forKey: .dateStr)
        try container.encodeIfPresent(habitId, forKey: .habitId)
    }

    private enum CodingKeys: String, CodingKey {
        case habitId
        case dateStr
    }
}

private struct ProteinActionInput: Encodable {
    let dateStr: String
}

private struct WalkActionInput: Encodable {
    let minutes: Int
    let dateStr: String
}
