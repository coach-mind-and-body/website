import AppIntents
import SwiftUI

struct HabitTrackerShortcuts: AppShortcutsProvider {
    @AppShortcutsBuilder
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: OpenTodayIntent(),
            phrases: [
                "Open \(.applicationName)",
                "Check my habits in \(.applicationName)",
            ],
            shortTitle: "Open today",
            systemImageName: "checkmark.circle"
        )
        AppShortcut(
            intent: OpenCoachIntent(),
            phrases: [
                "Message my coach in \(.applicationName)",
            ],
            shortTitle: "Message coach",
            systemImageName: "message"
        )
    }
}

struct OpenTodayIntent: AppIntent {
    static var title: LocalizedStringResource = "Open today's habits"
    static var openAppWhenRun = true

    func perform() async throws -> some IntentResult {
        .result()
    }
}

struct OpenCoachIntent: AppIntent {
    static var title: LocalizedStringResource = "Open coach chat"
    static var openAppWhenRun = true

    func perform() async throws -> some IntentResult {
        .result()
    }
}
