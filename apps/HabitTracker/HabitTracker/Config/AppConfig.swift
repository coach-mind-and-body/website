import Foundation

enum AppConfig {
    static let displayName = "Habit Tracker"
    static let apiRoot = URL(string: "https://mindandbodyresetcoach.com")!
    static let bundleId = "com.mindandbodyreset.habittracker"
    static let appGroupId = "group.com.mindandbodyreset.habittracker"
    static let mountainTimeZone = TimeZone(identifier: "America/Denver")!
    static let privacyURL = URL(string: "https://mindandbodyresetcoach.com/privacy")!
    static let coachName = "Lee Anne"

    static var trpcURL: URL { apiRoot.appending(path: "api/trpc") }
    static var loginURL: URL { apiRoot.appending(path: "api/auth/login") }
    static var signupURL: URL { apiRoot.appending(path: "api/auth/signup") }
}

enum MountainDate {
    static func today() -> String { string(from: Date()) }

    static func string(from date: Date) -> String {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = AppConfig.mountainTimeZone
        let c = calendar.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }

    static func date(from string: String) -> Date? {
        let parts = string.split(separator: "-").compactMap { Int($0) }
        guard parts.count == 3 else { return nil }
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = AppConfig.mountainTimeZone
        return calendar.date(from: DateComponents(year: parts[0], month: parts[1], day: parts[2]))
    }

    static func shift(_ dateStr: String, days: Int) -> String {
        guard let date = date(from: dateStr) else { return dateStr }
        let next = Calendar(identifier: .gregorian).date(byAdding: .day, value: days, to: date) ?? date
        return string(from: next)
    }

    static func weekdayIndex(_ dateStr: String) -> Int {
        guard let date = date(from: dateStr) else { return 0 }
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = AppConfig.mountainTimeZone
        return calendar.component(.weekday, from: date) - 1
    }
}
