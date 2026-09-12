import Foundation

struct WidgetSnapshot: Codable, Equatable {
    var dateStr: String
    var habitsDone: Int
    var habitsTotal: Int
    var proteinGrams: Int
    var proteinGoal: Int
    var nextHabitTitle: String?
    var updatedAt: Date
    var stepsToday: Int
    var moveMinutes: Int
    var sleepHours: Double

    static var empty: WidgetSnapshot {
        WidgetSnapshot(
            dateStr: "",
            habitsDone: 0,
            habitsTotal: 0,
            proteinGrams: 0,
            proteinGoal: 100,
            nextHabitTitle: nil,
            updatedAt: Date(),
            stepsToday: 0,
            moveMinutes: 0,
            sleepHours: 0
        )
    }

    var habitLine: String {
        guard habitsTotal > 0 else { return "No habits yet" }
        return "\(habitsDone)/\(habitsTotal) today"
    }

    var proteinLine: String {
        "\(proteinGrams)g protein"
    }

    var moveLine: String {
        "\(moveMinutes) min · \(stepsToday.formatted()) steps"
    }

    enum CodingKeys: String, CodingKey {
        case dateStr, habitsDone, habitsTotal, proteinGrams, proteinGoal
        case nextHabitTitle, updatedAt, stepsToday, moveMinutes, sleepHours
    }

    init(
        dateStr: String,
        habitsDone: Int,
        habitsTotal: Int,
        proteinGrams: Int,
        proteinGoal: Int,
        nextHabitTitle: String?,
        updatedAt: Date,
        stepsToday: Int = 0,
        moveMinutes: Int = 0,
        sleepHours: Double = 0
    ) {
        self.dateStr = dateStr
        self.habitsDone = habitsDone
        self.habitsTotal = habitsTotal
        self.proteinGrams = proteinGrams
        self.proteinGoal = proteinGoal
        self.nextHabitTitle = nextHabitTitle
        self.updatedAt = updatedAt
        self.stepsToday = stepsToday
        self.moveMinutes = moveMinutes
        self.sleepHours = sleepHours
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        dateStr = try c.decodeIfPresent(String.self, forKey: .dateStr) ?? ""
        habitsDone = try c.decodeIfPresent(Int.self, forKey: .habitsDone) ?? 0
        habitsTotal = try c.decodeIfPresent(Int.self, forKey: .habitsTotal) ?? 0
        proteinGrams = try c.decodeIfPresent(Int.self, forKey: .proteinGrams) ?? 0
        proteinGoal = try c.decodeIfPresent(Int.self, forKey: .proteinGoal) ?? 100
        nextHabitTitle = try c.decodeIfPresent(String.self, forKey: .nextHabitTitle)
        updatedAt = try c.decodeIfPresent(Date.self, forKey: .updatedAt) ?? Date()
        stepsToday = try c.decodeIfPresent(Int.self, forKey: .stepsToday) ?? 0
        moveMinutes = try c.decodeIfPresent(Int.self, forKey: .moveMinutes) ?? 0
        sleepHours = try c.decodeIfPresent(Double.self, forKey: .sleepHours) ?? 0
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(dateStr, forKey: .dateStr)
        try c.encode(habitsDone, forKey: .habitsDone)
        try c.encode(habitsTotal, forKey: .habitsTotal)
        try c.encode(proteinGrams, forKey: .proteinGrams)
        try c.encode(proteinGoal, forKey: .proteinGoal)
        try c.encodeIfPresent(nextHabitTitle, forKey: .nextHabitTitle)
        try c.encode(updatedAt, forKey: .updatedAt)
        try c.encode(stepsToday, forKey: .stepsToday)
        try c.encode(moveMinutes, forKey: .moveMinutes)
        try c.encode(sleepHours, forKey: .sleepHours)
    }
}

enum WidgetSnapshotStore {
    static func save(_ snapshot: WidgetSnapshot) {
        guard let data = try? JSONEncoder().encode(snapshot) else { return }
        AppGroup.defaults.set(data, forKey: AppGroup.snapshotKey)
    }

    static func load() -> WidgetSnapshot {
        guard
            let data = AppGroup.defaults.data(forKey: AppGroup.snapshotKey),
            let snap = try? JSONDecoder().decode(WidgetSnapshot.self, from: data)
        else { return .empty }
        return snap
    }
}
