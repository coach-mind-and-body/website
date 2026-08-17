import Foundation
import Observation
import WidgetKit

@MainActor
@Observable
final class HabitsViewModel {
    var dateStr = MountainDate.today()
    var habits: [Habit] = []
    var logs: [HabitLog] = []
    var notes: [DailyNote] = []
    var isLoading = false
    var errorMessage: String?
    var noteDraft = ""

    private let auth: AuthStore
    private let health: HealthKitService

    init(auth: AuthStore, health: HealthKitService) {
        self.auth = auth
        self.health = health
    }

    func log(for habitId: Int) -> HabitLog? {
        logs.first { $0.userHabitId == habitId && $0.dateStr == dateStr }
    }

    var doneCount: Int {
        habits.filter { log(for: $0.id)?.completed == true }.count
    }

    func load() async {
        guard auth.isSignedIn else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            let from = MountainDate.shift(dateStr, days: -21)
            let payload: HabitsPayload = try await auth.client.query(
                "habit.getUserHabits",
                input: FromDateInput(fromDate: from)
            )
            habits = payload.habits.filter { $0.isActive != false }
            logs = payload.logs
            notes = payload.notes ?? []
            noteDraft = notes.first(where: { $0.dateStr == dateStr })?.note ?? ""
            publishWidget()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func toggle(_ habit: Habit) async {
        let current = log(for: habit.id)
        let next = !(current?.completed ?? false)
        do {
            let _: SuccessFlag = try await auth.client.mutate(
                "habit.toggleLog",
                input: ToggleLogInput(
                    userHabitId: habit.id,
                    dateStr: dateStr,
                    completed: next,
                    numericValue: current?.numericValue
                )
            )
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func setNumeric(_ habit: Habit, value: Int) async {
        let completed = value >= (habit.targetValue ?? 0)
        do {
            let _: SuccessFlag = try await auth.client.mutate(
                "habit.toggleLog",
                input: ToggleLogInput(
                    userHabitId: habit.id,
                    dateStr: dateStr,
                    completed: completed,
                    numericValue: value
                )
            )
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func saveNote() async {
        do {
            let _: SuccessFlag = try await auth.client.mutate(
                "habit.saveDailyNote",
                input: SaveNoteInput(dateStr: dateStr, note: noteDraft)
            )
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func shiftDay(_ delta: Int) async {
        dateStr = MountainDate.shift(dateStr, days: delta)
        noteDraft = notes.first(where: { $0.dateStr == dateStr })?.note ?? ""
        await load()
    }

    private func publishWidget() {
        let next = habits.first { log(for: $0.id)?.completed != true }
        let proteinHabit = habits.first { $0.isNumeric && $0.title.lowercased().contains("protein") }
        let protein = proteinHabit.flatMap { log(for: $0.id)?.numericValue } ?? 0
        WidgetSnapshotStore.save(
            WidgetSnapshot(
                dateStr: dateStr,
                habitsDone: doneCount,
                habitsTotal: habits.count,
                proteinGrams: protein,
                proteinGoal: proteinHabit?.targetValue ?? 100,
                nextHabitTitle: next?.title,
                updatedAt: Date()
            )
        )
        WidgetReloader.reload()
    }
}

enum WidgetReloader {
    static func reload() {
        WidgetCenter.shared.reloadAllTimelines()
    }
}
