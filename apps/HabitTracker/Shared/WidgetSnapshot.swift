import Foundation

struct WidgetSnapshot: Codable, Equatable {
    var dateStr: String
    var habitsDone: Int
    var habitsTotal: Int
    var proteinGrams: Int
    var proteinGoal: Int
    var nextHabitTitle: String?
    var updatedAt: Date

    static var empty: WidgetSnapshot {
        WidgetSnapshot(
            dateStr: "",
            habitsDone: 0,
            habitsTotal: 0,
            proteinGrams: 0,
            proteinGoal: 100,
            nextHabitTitle: nil,
            updatedAt: Date()
        )
    }

    var habitLine: String {
        guard habitsTotal > 0 else { return "No habits yet" }
        return "\(habitsDone)/\(habitsTotal) habits"
    }

    var proteinLine: String {
        "\(proteinGrams)g protein"
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
