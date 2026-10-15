import Foundation
import Observation

enum CycleBleeding: String, Codable, CaseIterable, Identifiable {
    case none
    case spotting
    case light
    case medium
    case heavy

    var id: String { rawValue }

    var label: String {
        switch self {
        case .none: return "None"
        case .spotting: return "Spotting"
        case .light: return "Light"
        case .medium: return "Medium"
        case .heavy: return "Heavy"
        }
    }
}

enum CycleSymptom: String, Codable, CaseIterable, Identifiable {
    case hotFlash
    case nightSweats
    case sleepOff
    case mood
    case cramps
    case headache
    case breast

    var id: String { rawValue }

    var label: String {
        switch self {
        case .hotFlash: return "Hot flash"
        case .nightSweats: return "Night sweats"
        case .sleepOff: return "Sleep off"
        case .mood: return "Mood"
        case .cramps: return "Cramps"
        case .headache: return "Headache"
        case .breast: return "Breast tenderness"
        }
    }
}

struct CycleDay: Codable, Identifiable, Hashable {
    var dateStr: String
    var bleeding: CycleBleeding
    var symptoms: [CycleSymptom]
    var note: String
    var fromHealth: Bool

    var id: String { dateStr }

    var isEmpty: Bool {
        bleeding == .none && symptoms.isEmpty && note.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var summary: String {
        var parts: [String] = []
        if bleeding != .none { parts.append(bleeding.label.lowercased()) }
        parts.append(contentsOf: symptoms.prefix(2).map { $0.label.lowercased() })
        if parts.isEmpty { return "Nothing logged" }
        return parts.joined(separator: " · ")
    }
}

@MainActor
@Observable
final class CycleStore {
    private static let key = "mbr.cycle.days.v1"
    var days: [String: CycleDay] = [:]

    func load() {
        guard let data = UserDefaults.standard.data(forKey: Self.key),
              let decoded = try? JSONDecoder().decode([String: CycleDay].self, from: data)
        else { return }
        days = decoded
    }

    func save() {
        if let data = try? JSONEncoder().encode(days) {
            UserDefaults.standard.set(data, forKey: Self.key)
        }
    }

    func entry(on dateStr: String) -> CycleDay? { days[dateStr] }

    func upsert(_ day: CycleDay) {
        var next = days
        if day.isEmpty {
            next.removeValue(forKey: day.dateStr)
        } else {
            var stored = day
            stored.fromHealth = false
            next[day.dateStr] = stored
        }
        days = next
        save()
    }

    func mergeHealth(_ bleedingByDate: [String: CycleBleeding]) {
        var next = days
        var changed = false
        for (dateStr, bleeding) in bleedingByDate {
            if next[dateStr] != nil { continue }
            if bleeding == .none { continue }
            next[dateStr] = CycleDay(
                dateStr: dateStr,
                bleeding: bleeding,
                symptoms: [],
                note: "",
                fromHealth: true
            )
            changed = true
        }
        if changed {
            days = next
            save()
        }
    }

    /// Most recent run of bleeding days on or before `today`. A gap of one empty day starts a new run.
    func latestBleedSpan(onOrBefore today: String = MountainDate.today()) -> (start: String, end: String)? {
        let bleed = Set(
            days.values
                .filter { $0.bleeding != .none && $0.dateStr <= today }
                .map(\.dateStr)
        )
        guard var start = bleed.max() else { return nil }
        let end = start
        var steps = 0
        while steps < 40 {
            let prev = MountainDate.shift(start, days: -1)
            if prev == start || !bleed.contains(prev) { break }
            start = prev
            steps += 1
        }
        return (start, end)
    }

    func bleedStatus(on today: String = MountainDate.today()) -> String? {
        guard let span = latestBleedSpan(onOrBefore: today) else { return nil }
        let startLabel = MountainDate.shortMonthDay(span.start)
        if span.end == today {
            return span.start == today ? "Bleeding started today" : "Bleeding since \(startLabel)"
        }
        if span.start == span.end { return "Last bleeding \(startLabel)" }
        return "Last bleeding \(startLabel)–\(MountainDate.shortMonthDay(span.end))"
    }

    func historyDates(months: Int = 6) -> [String] {
        let today = MountainDate.today()
        let start = MountainDate.shift(today, days: -(months * 31))
        var out: [String] = []
        var cursor = start
        while cursor <= today {
            out.append(cursor)
            let next = MountainDate.shift(cursor, days: 1)
            if next == cursor { break }
            cursor = next
            if out.count > 400 { break }
        }
        return out
    }
}
