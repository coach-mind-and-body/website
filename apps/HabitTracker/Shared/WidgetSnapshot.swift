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
    var challengeEnrolled: Bool
    var challengeBeforeStart: Bool
    var challengeDayN: Int
    var challengeDayTitle: String
    var challengeIsLive: Bool
    var challengeDone: Bool
    var challengeName: String

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
            sleepHours: 0,
            challengeEnrolled: false,
            challengeBeforeStart: false,
            challengeDayN: 0,
            challengeDayTitle: "",
            challengeIsLive: false,
            challengeDone: false,
            challengeName: ""
        )
    }

    var inChallenge: Bool {
        challengeEnrolled && (challengeDayN > 0 || challengeBeforeStart)
    }

    var mindsetLine: String {
        MindsetLine.forDate(dateStr)
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
        case challengeEnrolled, challengeBeforeStart, challengeDayN, challengeDayTitle
        case challengeIsLive, challengeDone, challengeName
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
        sleepHours: Double = 0,
        challengeEnrolled: Bool = false,
        challengeBeforeStart: Bool = false,
        challengeDayN: Int = 0,
        challengeDayTitle: String = "",
        challengeIsLive: Bool = false,
        challengeDone: Bool = false,
        challengeName: String = ""
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
        self.challengeEnrolled = challengeEnrolled
        self.challengeBeforeStart = challengeBeforeStart
        self.challengeDayN = challengeDayN
        self.challengeDayTitle = challengeDayTitle
        self.challengeIsLive = challengeIsLive
        self.challengeDone = challengeDone
        self.challengeName = challengeName
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
        challengeEnrolled = try c.decodeIfPresent(Bool.self, forKey: .challengeEnrolled) ?? false
        challengeBeforeStart = try c.decodeIfPresent(Bool.self, forKey: .challengeBeforeStart) ?? false
        challengeDayN = try c.decodeIfPresent(Int.self, forKey: .challengeDayN) ?? 0
        challengeDayTitle = try c.decodeIfPresent(String.self, forKey: .challengeDayTitle) ?? ""
        challengeIsLive = try c.decodeIfPresent(Bool.self, forKey: .challengeIsLive) ?? false
        challengeDone = try c.decodeIfPresent(Bool.self, forKey: .challengeDone) ?? false
        challengeName = try c.decodeIfPresent(String.self, forKey: .challengeName) ?? ""
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
        try c.encode(challengeEnrolled, forKey: .challengeEnrolled)
        try c.encode(challengeBeforeStart, forKey: .challengeBeforeStart)
        try c.encode(challengeDayN, forKey: .challengeDayN)
        try c.encode(challengeDayTitle, forKey: .challengeDayTitle)
        try c.encode(challengeIsLive, forKey: .challengeIsLive)
        try c.encode(challengeDone, forKey: .challengeDone)
        try c.encode(challengeName, forKey: .challengeName)
    }
}

enum MindsetLine {
    static let lines = [
        "Mind over problems.",
        "Progress, not perfection.",
        "Quiet the noise. Keep one promise.",
        "What you do today is a vote.",
        "Small kept promises rebuild trust.",
        "No scoreboard. Just today.",
        "The body follows the mind you practice.",
        "You don’t have to win the day. Show up.",
    ]

    static func forDate(_ dateStr: String) -> String {
        let sum = dateStr.unicodeScalars.reduce(0) { $0 + Int($1.value) }
        let idx = lines.isEmpty ? 0 : abs(sum) % lines.count
        return lines[idx]
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
