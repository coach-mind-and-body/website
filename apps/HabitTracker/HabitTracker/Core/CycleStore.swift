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
        if day.isEmpty {
            days.removeValue(forKey: day.dateStr)
        } else {
            var stored = day
            stored.fromHealth = false
            days[day.dateStr] = stored
        }
        save()
    }

    func mergeHealth(_ bleedingByDate: [String: CycleBleeding]) {
        for (dateStr, bleeding) in bleedingByDate {
            if days[dateStr] != nil { continue }
            if bleeding == .none { continue }
            days[dateStr] = CycleDay(
                dateStr: dateStr,
                bleeding: bleeding,
                symptoms: [],
                note: "",
                fromHealth: true
            )
        }
        save()
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
            if out.count > 200 { break }
        }
        return out
    }
}
