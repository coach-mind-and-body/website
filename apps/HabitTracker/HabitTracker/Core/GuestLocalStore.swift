import Foundation

enum GuestLocalStore {
    private static let habitsKey = "guest.habits.v1"
    private static let logsKey = "guest.habitLogs.v1"
    private static let notesKey = "guest.notes.v1"
    private static let caloriesKey = "guest.calorieLogs.v1"

    static func loadHabits() -> [Habit] { decode(habitsKey, as: [Habit].self) ?? [] }
    static func saveHabits(_ v: [Habit]) { encode(habitsKey, v) }

    static func loadLogs() -> [HabitLog] { decode(logsKey, as: [HabitLog].self) ?? [] }
    static func saveLogs(_ v: [HabitLog]) { encode(logsKey, v) }

    static func loadNotes() -> [DailyNote] { decode(notesKey, as: [DailyNote].self) ?? [] }
    static func saveNotes(_ v: [DailyNote]) { encode(notesKey, v) }

    static func loadCalories() -> [CalorieLog] { decode(caloriesKey, as: [CalorieLog].self) ?? [] }
    static func saveCalories(_ v: [CalorieLog]) { encode(caloriesKey, v) }

    private static let fitnessKey = "guest.fitnessLogs.v1"
    static func loadFitness() -> [FitnessLog] { decode(fitnessKey, as: [FitnessLog].self) ?? [] }
    static func saveFitness(_ v: [FitnessLog]) { encode(fitnessKey, v) }

    private static let victoriesKey = "guest.victories.v1"
    static func loadVictories() -> [VictoryList] { decode(victoriesKey, as: [VictoryList].self) ?? [] }
    static func saveVictories(_ v: [VictoryList]) { encode(victoriesKey, v) }

    private static let dismissedKey = "guest.dismissedUpdates.v1"
    static func loadDismissedUpdates() -> [Int] {
        UserDefaults.standard.array(forKey: dismissedKey) as? [Int] ?? []
    }
    static func saveDismissedUpdates(_ ids: [Int]) {
        UserDefaults.standard.set(ids, forKey: dismissedKey)
    }

    private static func decode<T: Decodable>(_ key: String, as: T.Type) -> T? {
        guard let data = UserDefaults.standard.data(forKey: key) else { return nil }
        return try? JSONDecoder().decode(T.self, from: data)
    }

    private static func encode<T: Encodable>(_ key: String, _ value: T) {
        if let data = try? JSONEncoder().encode(value) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }
}
