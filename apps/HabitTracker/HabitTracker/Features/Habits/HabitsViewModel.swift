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
    var notesExpanded = false
    var showPastDays = false
    var mainTab = 0
    var weekAnchor = MountainDate.today()

    var challenges: [Challenge] = []
    var userChallenges: [UserChallenge] = []
    var challengeLogs: [ChallengeLog] = []
    var showChallenges = false
    var challengeTab = 0

    var updates: [AppUpdate] = []
    var dismissedUpdateIds: [Int] = GuestLocalStore.loadDismissedUpdates()
    var showUpdates = false
    var showDismissedUpdates = false

    var insight: WeeklyInsight?
    var win1 = ""
    var win2 = ""
    var win3 = ""
    var victoriesExpanded = false

    var progressMonth = MountainDate.today()
    var progressDay: String?
    var progressFood: [CalorieLog] = []

    private let auth: AuthStore
    private let health: HealthKitService
    private var didMergeGuest = false
    private var skipHealthWrite = false
    var sessionEpoch: Int { auth.sessionEpoch }

    init(auth: AuthStore, health: HealthKitService) {
        self.auth = auth
        self.health = health
    }

    func log(for habitId: Int, on day: String? = nil) -> HabitLog? {
        let day = day ?? dateStr
        return logs.first { $0.userHabitId == habitId && $0.dateStr == day }
    }

    func isCompleted(_ habit: Habit, on day: String? = nil) -> Bool {
        log(for: habit.id, on: day)?.completed == true
    }

    func numericValue(_ habit: Habit, on day: String? = nil) -> Int {
        log(for: habit.id, on: day)?.numericValue ?? 0
    }

    var doneCount: Int {
        habits.filter { isCompleted($0) }.count
    }

    var completedDateStrs: Set<String> {
        let ids = Set(habits.map(\.id))
        return Set(logs.filter { $0.completed && ids.contains($0.userHabitId) }.map(\.dateStr))
    }

    var currentStreak: Int {
        var streak = 0
        var day = MountainDate.today()
        let done = completedDateStrs
        while true {
            if done.contains(day) {
                streak += 1
                day = MountainDate.shift(day, days: -1)
            } else if day == MountainDate.today() {
                day = MountainDate.shift(day, days: -1)
            } else {
                break
            }
        }
        return streak
    }

    var bestStreak: Int {
        let done = completedDateStrs.sorted()
        guard !done.isEmpty else { return currentStreak }
        var best = 1
        var run = 1
        for i in 1..<done.count {
            if MountainDate.shift(done[i - 1], days: 1) == done[i] {
                run += 1
                best = max(best, run)
            } else {
                run = 1
            }
        }
        return max(best, currentStreak)
    }

    var weekDays: [String] {
        (-3...3).map { MountainDate.shift(weekAnchor, days: $0) }
    }

    var visibleUpdates: [AppUpdate] {
        if showDismissedUpdates { return updates }
        return updates.filter { !dismissedUpdateIds.contains($0.id) }
    }

    var unreadUpdateCount: Int {
        updates.filter { !dismissedUpdateIds.contains($0.id) }.count
    }

    func userChallenge(for challengeId: Int) -> UserChallenge? {
        userChallenges.first { $0.challengeId == challengeId }
    }

    func challengeProgress(_ challenge: Challenge) -> Int {
        guard let uc = userChallenge(for: challenge.id) else { return 0 }
        return challengeLogs.filter { $0.userChallengeId == uc.id }.count
    }

    func challengePercent(_ challenge: Challenge) -> Int {
        let days = max(challenge.durationDays ?? 7, 1)
        return min(100, Int((Double(challengeProgress(challenge)) / Double(days) * 100).rounded()))
    }

    func challengeDoneToday(_ challenge: Challenge) -> Bool {
        guard let uc = userChallenge(for: challenge.id) else { return false }
        return challengeLogs.contains { $0.userChallengeId == uc.id && $0.dateStr == MountainDate.today() }
    }

    var featuredChallenges: [Challenge] {
        let joined = challenges.filter { userChallenge(for: $0.id) != nil }
        let featured = challenges.filter { $0.isFeatured == true || userChallenge(for: $0.id) != nil }
        if !featured.isEmpty { return Array(featured.prefix(3)) }
        if !joined.isEmpty { return Array(joined.prefix(3)) }
        return Array(challenges.prefix(2))
    }

    func filteredChallenges(completed: Bool) -> [Challenge] {
        challenges.filter { challengePercent($0) == 100 ? completed : !completed }
    }

    func load() async {
        isLoading = true
        defer { isLoading = false }
        if auth.isSignedIn {
            await mergeGuestIfNeeded()
            do {
                let lookback = mainTab == 1 ? -400 : -21
                let from = MountainDate.shift(MountainDate.today(), days: lookback)
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
        } else {
            await loadGuest()
        }
        await loadDashboard()
    }

    func loadDashboard() async {
        challenges = (try? await auth.client.query("challenges.getActiveChallenges")) ?? []
        if let payload: UserChallengesPayload = try? await auth.client.query(
            "challenges.getUserChallenges",
            input: DeviceIdInput(deviceId: AppConfig.deviceId)
        ) {
            userChallenges = payload.challenges
            challengeLogs = payload.logs ?? []
        }
        updates = (try? await auth.client.query("appUpdates.getUpdates")) ?? []
        if auth.isSignedIn {
            insight = try? await auth.client.query("habit.getWeeklyInsight")
        } else {
            insight = nil
        }
        await loadVictories()
    }

    private func loadGuest() async {
        var stored = GuestLocalStore.loadHabits()
        if stored.isEmpty {
            let templates: [Habit] = (try? await auth.client.query("habit.getTemplates")) ?? []
            stored = templates.map {
                Habit(
                    id: $0.id,
                    title: $0.title,
                    description: $0.description,
                    type: $0.type,
                    targetValue: $0.targetValue,
                    unit: $0.unit,
                    isActive: true,
                    order: $0.order
                )
            }
            GuestLocalStore.saveHabits(stored)
        }
        habits = stored
        logs = GuestLocalStore.loadLogs()
        notes = GuestLocalStore.loadNotes()
        noteDraft = notes.first(where: { $0.dateStr == dateStr })?.note ?? ""
        publishWidget()
    }

    private func mergeGuestIfNeeded() async {
        guard !didMergeGuest else { return }
        didMergeGuest = true
        _ = try? await auth.client.mutate(
            "challenges.mergeGuestData",
            input: DeviceIdInput(deviceId: AppConfig.deviceId)
        ) as SuccessFlag
        _ = try? await auth.client.mutate(
            "habit.mergeGuestVictories",
            input: DeviceIdInput(deviceId: AppConfig.deviceId)
        ) as SuccessFlag
    }

    func toggle(_ habit: Habit, on day: String? = nil) async {
        let day = day ?? dateStr
        let current = log(for: habit.id, on: day)
        let next = !(current?.completed ?? false)
        if auth.isSignedIn {
            do {
                let _: SuccessFlag = try await auth.client.mutate(
                    "habit.toggleLog",
                    input: ToggleLogInput(
                        userHabitId: habit.id,
                        dateStr: day,
                        completed: next,
                        numericValue: current?.numericValue
                    )
                )
                await load()
                if next, !skipHealthWrite { await writeHealthIfNeeded(habit, on: day) }
            } catch {
                errorMessage = error.localizedDescription
            }
            return
        }
        upsertGuestLog(habitId: habit.id, day: day, completed: next, numeric: current?.numericValue)
        if next, !skipHealthWrite { await writeHealthIfNeeded(habit, on: day) }
    }

    func startMindfulSession(minutes: Int) async {
        await health.saveMindfulSession(minutes: Double(minutes), on: dateStr)
        skipHealthWrite = true
        defer { skipHealthWrite = false }
        if let habit = habits.first(where: { $0.title.lowercased().contains("mindful") }) {
            await completeFromHealth(habit, numeric: habit.isNumeric ? minutes : nil)
        }
    }

    private func writeHealthIfNeeded(_ habit: Habit, on day: String) async {
        let key = habit.title.lowercased()
        if key.contains("mindful") {
            let mins = habit.isNumeric ? max(numericValue(habit, on: day), 1) : 1
            await health.saveMindfulSession(minutes: Double(mins), on: day)
        }
    }

    func setNumeric(_ habit: Habit, value: Int, on day: String? = nil) async {
        let day = day ?? dateStr
        let completed = value >= (habit.targetValue ?? 0)
        if auth.isSignedIn {
            do {
                let _: SuccessFlag = try await auth.client.mutate(
                    "habit.toggleLog",
                    input: ToggleLogInput(
                        userHabitId: habit.id,
                        dateStr: day,
                        completed: completed,
                        numericValue: value
                    )
                )
                await load()
            } catch {
                errorMessage = error.localizedDescription
            }
            return
        }
        upsertGuestLog(habitId: habit.id, day: day, completed: completed, numeric: value)
    }

    private func upsertGuestLog(habitId: Int, day: String, completed: Bool, numeric: Int?) {
        var all = GuestLocalStore.loadLogs()
        if let i = all.firstIndex(where: { $0.userHabitId == habitId && $0.dateStr == day }) {
            all[i].completed = completed
            all[i].numericValue = numeric
        } else {
            all.append(HabitLog(id: Int(Date().timeIntervalSince1970), userHabitId: habitId, dateStr: day, completed: completed, numericValue: numeric))
        }
        GuestLocalStore.saveLogs(all)
        logs = all
        publishWidget()
    }

    func saveNote() async {
        if auth.isSignedIn {
            do {
                let _: SuccessFlag = try await auth.client.mutate(
                    "habit.saveDailyNote",
                    input: SaveNoteInput(dateStr: dateStr, note: noteDraft)
                )
            } catch {
                errorMessage = error.localizedDescription
            }
            return
        }
        var all = GuestLocalStore.loadNotes()
        if let i = all.firstIndex(where: { $0.dateStr == dateStr }) {
            all[i].note = noteDraft
        } else {
            all.append(DailyNote(dateStr: dateStr, note: noteDraft))
        }
        GuestLocalStore.saveNotes(all)
        notes = all
    }

    func healthCaption(for habit: Habit) -> String? {
        let key = habit.title.lowercased()
        if key.contains("move") {
            let mins = Int(health.moveMinutesToday.rounded())
            return mins > 0 ? "Apple Health · \(mins) min move" : nil
        }
        if key.contains("mindful") {
            let mins = Int(health.mindfulMinutesToday.rounded())
            return mins > 0 ? "Apple Health · \(mins) mindful min" : nil
        }
        if key.contains("sleep") {
            guard health.sleepHoursLastNight > 0 else { return nil }
            return String(format: "Apple Health · %.1fh sleep", health.sleepHoursLastNight)
        }
        return nil
    }

    func syncFromHealth() async {
        await health.refreshToday()
        guard dateStr == MountainDate.today() else { return }
        for habit in habits {
            let key = habit.title.lowercased()
            if key.contains("move"), health.moveBodyMet {
                let minutes = max(Int(health.moveMinutesToday.rounded()), habit.targetValue ?? 20)
                await completeFromHealth(habit, numeric: habit.isNumeric ? minutes : nil)
            } else if key.contains("mindful"), health.mindfulMet {
                let minutes = max(Int(health.mindfulMinutesToday.rounded()), 1)
                await completeFromHealth(habit, numeric: habit.isNumeric ? minutes : nil)
            } else if key.contains("sleep"), health.restfulSleepMet {
                let hours = Int(health.sleepHoursLastNight.rounded())
                await completeFromHealth(habit, numeric: habit.isNumeric ? hours : nil)
            }
        }
    }

    private func completeFromHealth(_ habit: Habit, numeric: Int?) async {
        if habit.isNumeric, let numeric {
            if numericValue(habit) >= numeric && isCompleted(habit) { return }
            await setNumeric(habit, value: max(numeric, numericValue(habit)))
            return
        }
        if !isCompleted(habit) {
            await toggle(habit)
        }
    }

    func selectDay(_ day: String) async {
        dateStr = day
        noteDraft = notes.first(where: { $0.dateStr == dateStr })?.note ?? ""
        await loadVictories()
    }

    func shiftWeek(_ delta: Int) {
        weekAnchor = MountainDate.shift(weekAnchor, days: delta * 7)
    }

    func join(_ challenge: Challenge) async {
        do {
            let _: SuccessFlag = try await auth.client.mutate(
                "challenges.joinChallenge",
                input: JoinChallengeInput(challengeId: challenge.id, deviceId: AppConfig.deviceId)
            )
            await loadDashboard()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func tapChallengeChip(_ challenge: Challenge) async {
        if userChallenge(for: challenge.id) == nil {
            await join(challenge)
            return
        }
        if !challengeDoneToday(challenge) {
            await toggleChallenge(challenge)
            return
        }
        showChallenges = true
    }

    func toggleChallenge(_ challenge: Challenge) async {
        guard let uc = userChallenge(for: challenge.id) else { return }
        let today = MountainDate.today()
        let next = !challengeDoneToday(challenge)
        do {
            let _: SuccessFlag = try await auth.client.mutate(
                "challenges.toggleChallengeLog",
                input: ToggleChallengeLogInput(
                    userChallengeId: uc.id,
                    dateStr: today,
                    completed: next,
                    deviceId: AppConfig.deviceId
                )
            )
            await loadDashboard()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func dismissUpdate(_ id: Int) {
        if !dismissedUpdateIds.contains(id) {
            dismissedUpdateIds.append(id)
            GuestLocalStore.saveDismissedUpdates(dismissedUpdateIds)
        }
    }

    func loadVictories() async {
        if auth.isSignedIn {
            let from = MountainDate.shift(MountainDate.today(), days: -30)
            let rows: [VictoryList] = (try? await auth.client.query(
                "habit.getVictoryLists",
                input: VictoryQueryInput(fromDate: from, deviceId: AppConfig.deviceId)
            )) ?? []
            applyVictory(rows.first { $0.dateStr == dateStr })
            return
        }
        applyVictory(GuestLocalStore.loadVictories().first { $0.dateStr == dateStr })
    }

    private func applyVictory(_ row: VictoryList?) {
        win1 = row?.win1 ?? ""
        win2 = row?.win2 ?? ""
        win3 = row?.win3 ?? ""
    }

    func saveVictories() async {
        _ = try? await auth.client.mutate(
            "habit.saveVictoryList",
            input: SaveVictoryInput(
                dateStr: dateStr,
                win1: win1,
                win2: win2,
                win3: win3,
                deviceId: AppConfig.deviceId
            )
        ) as SuccessFlag
        var all = GuestLocalStore.loadVictories()
        if let i = all.firstIndex(where: { $0.dateStr == dateStr }) {
            all[i].win1 = win1
            all[i].win2 = win2
            all[i].win3 = win3
        } else {
            all.append(VictoryList(dateStr: dateStr, win1: win1, win2: win2, win3: win3))
        }
        GuestLocalStore.saveVictories(all)
    }

    func openProgressDay(_ day: String) async {
        progressDay = day
        if auth.isSignedIn {
            progressFood = (try? await auth.client.query("calories.getLogs", input: DateStrInput(dateStr: day))) ?? []
        } else {
            progressFood = GuestLocalStore.loadCalories().filter { $0.dateStr == day }
        }
    }

    func youtubeId(from url: String?) -> String? {
        guard let url, !url.isEmpty else { return nil }
        let pattern = #"(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^\"&?\/\s]{11})"#
        guard let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive),
              let match = regex.firstMatch(in: url, range: NSRange(url.startIndex..., in: url)),
              let range = Range(match.range(at: 1), in: url)
        else { return nil }
        return String(url[range])
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
