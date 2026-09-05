import Foundation

enum AppConfig {
    static let displayName = "Habit Tracker"
    static let apiRoot = URL(string: "https://mindandbodyresetcoach.com")!
    static let bundleId = "com.mindandbodyreset.habittracker"
    static let appGroupId = "group.com.mindandbodyreset.habittracker"
    static let mountainTimeZone = TimeZone(identifier: "America/Denver")!
    static let privacyURL = URL(string: "https://mindandbodyresetcoach.com/privacy")!
    static let coachName = "Lee Anne"
    static var deviceId: String {
        if let existing = UserDefaults.standard.string(forKey: "mbr.deviceId") { return existing }
        let id = UUID().uuidString
        UserDefaults.standard.set(id, forKey: "mbr.deviceId")
        return id
    }

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

    static func weekdayShort(_ dateStr: String) -> String {
        let names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        return names[weekdayIndex(dateStr)]
    }

    static func dayNumber(_ dateStr: String) -> String {
        String(dateStr.split(separator: "-").last ?? "")
    }

    static func shortMonthDay(_ dateStr: String) -> String {
        guard let date = date(from: dateStr) else { return dateStr }
        let f = DateFormatter()
        f.timeZone = AppConfig.mountainTimeZone
        f.dateFormat = "MMM d"
        return f.string(from: date)
    }

    static func monthTitle(_ dateStr: String) -> String {
        guard let date = date(from: dateStr) else { return dateStr }
        let f = DateFormatter()
        f.timeZone = AppConfig.mountainTimeZone
        f.dateFormat = "MMMM yyyy"
        return f.string(from: date)
    }

    static func friendly(_ dateStr: String) -> String {
        guard let date = date(from: dateStr) else { return dateStr }
        let f = DateFormatter()
        f.timeZone = AppConfig.mountainTimeZone
        f.dateFormat = "EEEE, MMM d"
        return f.string(from: date)
    }

    static func monthDays(_ dateStr: String) -> [String] {
        guard let date = date(from: dateStr) else { return [] }
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = AppConfig.mountainTimeZone
        guard let range = calendar.range(of: .day, in: .month, for: date),
              let start = calendar.date(from: calendar.dateComponents([.year, .month], from: date))
        else { return [] }
        return range.compactMap { day in
            calendar.date(byAdding: .day, value: day - 1, to: start).map { string(from: $0) }
        }
    }

    static func leadingBlanks(_ dateStr: String) -> Int {
        monthDays(dateStr).first.map { weekdayIndex($0) } ?? 0
    }

    static func shiftMonth(_ dateStr: String, months: Int) -> String {
        guard let date = date(from: dateStr) else { return dateStr }
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = AppConfig.mountainTimeZone
        let next = calendar.date(byAdding: .month, value: months, to: date) ?? date
        return string(from: next)
    }
}
