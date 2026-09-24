import Foundation
import HealthKit

@MainActor
@Observable
final class HealthKitService {
    private let store = HKHealthStore()
    var isAvailable: Bool { HKHealthStore.isHealthDataAvailable() }
    var authorizationAsked = false
    var lastError: String?
    var stepsToday: Double = 0
    var sleepHoursLastNight: Double = 0
    var weightKg: Double?
    var weightPounds: Double? {
        guard let kg = weightKg else { return nil }
        return kg * 2.2046226218
    }
    var exerciseMinutesToday: Double = 0
    var workoutMinutesToday: Double = 0
    var mindfulMinutesToday: Double = 0

    /// Best “move” signal: Apple Exercise minutes, or logged workout time if higher.
    var moveMinutesToday: Double { max(exerciseMinutesToday, workoutMinutesToday) }
    var restfulSleepMet: Bool { sleepHoursLastNight >= 7 }
    var moveBodyMet: Bool { moveMinutesToday >= 20 }
    var mindfulMet: Bool { mindfulMinutesToday >= 1 }

    private var writeTypes: Set<HKSampleType> {
        var set: Set<HKSampleType> = [HKObjectType.workoutType()]
        if let mindful = HKObjectType.categoryType(forIdentifier: .mindfulSession) {
            set.insert(mindful)
        }
        for id in Self.cycleCategoryIds {
            if let t = HKObjectType.categoryType(forIdentifier: id) { set.insert(t) }
        }
        return set
    }

    private var readTypes: Set<HKObjectType> {
        var set: Set<HKObjectType> = []
        if let s = HKObjectType.quantityType(forIdentifier: .stepCount) { set.insert(s) }
        if let s = HKObjectType.quantityType(forIdentifier: .bodyMass) { set.insert(s) }
        if let s = HKObjectType.quantityType(forIdentifier: .activeEnergyBurned) { set.insert(s) }
        if let s = HKObjectType.quantityType(forIdentifier: .appleExerciseTime) { set.insert(s) }
        if let s = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) { set.insert(s) }
        if let s = HKObjectType.categoryType(forIdentifier: .mindfulSession) { set.insert(s) }
        set.insert(HKObjectType.workoutType())
        for id in Self.cycleCategoryIds {
            if let t = HKObjectType.categoryType(forIdentifier: id) { set.insert(t) }
        }
        return set
    }

    private static var cycleCategoryIds: [HKCategoryTypeIdentifier] {
        var ids: [HKCategoryTypeIdentifier] = [
            .menstrualFlow,
            .intermenstrualBleeding,
            .abdominalCramps,
            .headache,
            .breastPain,
            .hotFlashes,
            .moodChanges,
            .sleepChanges,
        ]
        ids.append(.nightSweats)
        return ids
    }

    func requestAccess() async {
        guard isAvailable else {
            lastError = "Health data is not available on this device."
            return
        }
        do {
            try await store.requestAuthorization(toShare: writeTypes, read: readTypes)
            authorizationAsked = true
            await refreshToday()
        } catch {
            lastError = error.localizedDescription
        }
    }

    func refreshToday() async {
        guard isAvailable else { return }
        async let steps = sum(.stepCount, unit: .count(), start: startOfToday())
        async let energy = sum(.activeEnergyBurned, unit: .kilocalorie(), start: startOfToday())
        async let exercise = sum(.appleExerciseTime, unit: .minute(), start: startOfToday())
        async let sleep = sleepHours(from: startOfYesterday())
        async let mass = latest(.bodyMass, unit: .gramUnit(with: .kilo))
        async let workouts = workoutMinutes(from: startOfToday())
        async let mindful = mindfulMinutes(from: startOfToday())
        stepsToday = (try? await steps) ?? 0
        _ = try? await energy
        exerciseMinutesToday = (try? await exercise) ?? 0
        sleepHoursLastNight = (try? await sleep) ?? 0
        weightKg = try? await mass
        workoutMinutesToday = (try? await workouts) ?? 0
        mindfulMinutesToday = (try? await mindful) ?? 0
    }

    struct HealthWorkout: Identifiable, Hashable {
        var id: UUID
        var name: String
        var minutes: Int
        var fromWatch: Bool
        var fromThisApp: Bool
    }

    func workouts(on dateStr: String) async -> [HealthWorkout] {
        guard isAvailable else { return [] }
        let (start, end) = dayRange(dateStr)
        do {
            let samples = try await workoutSamples(from: start, to: end)
            return samples.map { workout in
                let mins = max(1, Int((workout.duration / 60).rounded()))
                let bundle = workout.sourceRevision.source.bundleIdentifier.lowercased()
                let sourceName = workout.sourceRevision.source.name.lowercased()
                let fromThisApp = bundle.contains("mindandbodyreset") || workout.metadata?[Self.appSourceKey] as? String == Self.appSourceValue
                let fromWatch = bundle.contains("watch") || sourceName.contains("watch")
                return HealthWorkout(
                    id: workout.uuid,
                    name: displayName(for: workout.workoutActivityType, fallback: workout.metadata?[Self.appNameKey] as? String),
                    minutes: mins,
                    fromWatch: fromWatch,
                    fromThisApp: fromThisApp
                )
            }
            .sorted { $0.minutes > $1.minutes }
        } catch {
            lastError = error.localizedDescription
            return []
        }
    }

    func saveWorkout(named name: String, minutes: Int, on dateStr: String = MountainDate.today()) async {
        guard isAvailable, minutes > 0 else { return }
        let existing = await workouts(on: dateStr)
        if existing.contains(where: { abs($0.minutes - minutes) <= 2 }) {
            return
        }
        let end = endDate(on: dateStr)
        let start = end.addingTimeInterval(-Double(minutes) * 60)
        let configuration = HKWorkoutConfiguration()
        configuration.activityType = activityType(for: name)
        let builder = HKWorkoutBuilder(healthStore: store, configuration: configuration, device: .local())
        do {
            try await beginCollection(builder, at: start)
            try await addMetadata(builder, [
                Self.appSourceKey: Self.appSourceValue,
                Self.appNameKey: name,
            ])
            try await endCollection(builder, at: end)
            try await finishWorkout(builder)
            await refreshToday()
        } catch {
            lastError = error.localizedDescription
        }
    }

    private static let appSourceKey = "MBRSource"
    private static let appSourceValue = "habit-tracker"
    private static let appNameKey = "MBRWorkoutName"

    private func beginCollection(_ builder: HKWorkoutBuilder, at start: Date) async throws {
        try await withCheckedThrowingContinuation { (cont: CheckedContinuation<Void, Error>) in
            builder.beginCollection(withStart: start) { success, error in
                Self.resume(cont, success: success, error: error, fail: "Could not start the workout in Apple Health.")
            }
        }
    }

    private func endCollection(_ builder: HKWorkoutBuilder, at end: Date) async throws {
        try await withCheckedThrowingContinuation { (cont: CheckedContinuation<Void, Error>) in
            builder.endCollection(withEnd: end) { success, error in
                Self.resume(cont, success: success, error: error, fail: "Could not finish the workout in Apple Health.")
            }
        }
    }

    private func finishWorkout(_ builder: HKWorkoutBuilder) async throws {
        try await withCheckedThrowingContinuation { (cont: CheckedContinuation<Void, Error>) in
            builder.finishWorkout { _, error in
                if let error {
                    cont.resume(throwing: error)
                    return
                }
                cont.resume()
            }
        }
    }

    private static func resume(
        _ cont: CheckedContinuation<Void, Error>,
        success: Bool,
        error: Error?,
        fail: String
    ) {
        if let error {
            cont.resume(throwing: error)
            return
        }
        if success {
            cont.resume()
            return
        }
        cont.resume(throwing: NSError(
            domain: "HabitTracker.Health",
            code: 1,
            userInfo: [NSLocalizedDescriptionKey: fail]
        ))
    }

    func saveMindfulSession(minutes: Double, on dateStr: String = MountainDate.today()) async {
        guard isAvailable, minutes > 0,
              let type = HKObjectType.categoryType(forIdentifier: .mindfulSession)
        else { return }
        let end = endDate(on: dateStr)
        let start = end.addingTimeInterval(-minutes * 60)
        let sample = HKCategorySample(type: type, value: 0, start: start, end: end)
        do {
            try await store.save(sample)
            await refreshToday()
        } catch {
            lastError = error.localizedDescription
        }
    }

    func menstrualBleeding(from startStr: String, to endStr: String) async -> [String: CycleBleeding] {
        guard isAvailable, let type = HKObjectType.categoryType(forIdentifier: .menstrualFlow) else { return [:] }
        let start = MountainDate.date(from: startStr) ?? Date()
        let endExclusive = (MountainDate.date(from: endStr) ?? Date()).addingTimeInterval(86400)
        do {
            let samples = try await categorySamples(type, from: start, to: endExclusive)
            var map: [String: CycleBleeding] = [:]
            for sample in samples.sorted(by: { $0.endDate < $1.endDate }) {
                let key = MountainDate.string(from: sample.startDate)
                map[key] = mapFlow(sample.value)
            }
            let spotting = try await spottingDates(from: start, to: endExclusive)
            for day in spotting where map[day] == nil || map[day] == .none {
                map[day] = .spotting
            }
            return map
        } catch {
            lastError = error.localizedDescription
            return [:]
        }
    }

    func saveCycle(_ day: CycleDay) async {
        guard isAvailable else { return }
        let (start, end) = dayRange(day.dateStr)
        let sampleEnd = end.addingTimeInterval(-60)
        do {
            try await deleteOurCycleSamples(from: start, to: end)
            if day.bleeding != .none, let flowType = HKObjectType.categoryType(forIdentifier: .menstrualFlow) {
                let existing = try await categorySamples(flowType, from: start, to: end)
                let others = existing.filter { $0.metadata?[Self.appSourceKey] as? String != Self.appSourceValue }
                let alreadyMatches = others.contains { mapFlow($0.value) == day.bleeding }
                if !alreadyMatches {
                    let sample = HKCategorySample(
                        type: flowType,
                        value: flowValue(day.bleeding),
                        start: start,
                        end: sampleEnd,
                        metadata: [Self.appSourceKey: Self.appSourceValue]
                    )
                    try await store.save(sample)
                }
                if day.bleeding == .spotting, let bleed = HKObjectType.categoryType(forIdentifier: .intermenstrualBleeding) {
                    let sample = HKCategorySample(
                        type: bleed,
                        value: HKCategoryValue.notApplicable.rawValue,
                        start: start,
                        end: sampleEnd,
                        metadata: [Self.appSourceKey: Self.appSourceValue]
                    )
                    try await store.save(sample)
                }
            }
            for symptom in day.symptoms {
                if let type = categoryType(for: symptom) {
                    let sample = HKCategorySample(
                        type: type,
                        value: HKCategoryValue.notApplicable.rawValue,
                        start: start,
                        end: sampleEnd,
                        metadata: [Self.appSourceKey: Self.appSourceValue]
                    )
                    try await store.save(sample)
                }
            }
        } catch {
            lastError = error.localizedDescription
        }
    }

    private func spottingDates(from start: Date, to end: Date) async throws -> [String] {
        guard let type = HKObjectType.categoryType(forIdentifier: .intermenstrualBleeding) else { return [] }
        let samples = try await categorySamples(type, from: start, to: end)
        return samples.map { MountainDate.string(from: $0.startDate) }
    }

    private func deleteOurCycleSamples(from start: Date, to end: Date) async throws {
        for id in Self.cycleCategoryIds {
            guard let type = HKObjectType.categoryType(forIdentifier: id) else { continue }
            let samples = try await categorySamples(type, from: start, to: end)
            let ours = samples.filter { $0.metadata?[Self.appSourceKey] as? String == Self.appSourceValue }
            if !ours.isEmpty {
                try await store.delete(ours)
            }
        }
    }

    private func categorySamples(_ type: HKCategoryType, from start: Date, to end: Date) async throws -> [HKCategorySample] {
        let pred = HKQuery.predicateForSamples(withStart: start, end: end)
        return try await withCheckedThrowingContinuation { cont in
            let q = HKSampleQuery(sampleType: type, predicate: pred, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, err in
                if let err { cont.resume(throwing: err); return }
                cont.resume(returning: samples as? [HKCategorySample] ?? [])
            }
            store.execute(q)
        }
    }

    private func mapFlow(_ value: Int) -> CycleBleeding {
        switch HKCategoryValueMenstrualFlow(rawValue: value) {
        case .light: return .light
        case .medium: return .medium
        case .heavy: return .heavy
        default: return .none
        }
    }

    private func flowValue(_ bleeding: CycleBleeding) -> Int {
        switch bleeding {
        case .none: return HKCategoryValueMenstrualFlow.unspecified.rawValue
        case .spotting, .light: return HKCategoryValueMenstrualFlow.light.rawValue
        case .medium: return HKCategoryValueMenstrualFlow.medium.rawValue
        case .heavy: return HKCategoryValueMenstrualFlow.heavy.rawValue
        }
    }

    private func categoryType(for symptom: CycleSymptom) -> HKCategoryType? {
        let id: HKCategoryTypeIdentifier
        switch symptom {
        case .hotFlash: id = .hotFlashes
        case .nightSweats: id = .nightSweats
        case .sleepOff: id = .sleepChanges
        case .mood: id = .moodChanges
        case .cramps: id = .abdominalCramps
        case .headache: id = .headache
        case .breast: id = .breastPain
        }
        return HKObjectType.categoryType(forIdentifier: id)
    }

    private func addMetadata(_ builder: HKWorkoutBuilder, _ metadata: [String: Any]) async throws {
        try await withCheckedThrowingContinuation { (cont: CheckedContinuation<Void, Error>) in
            builder.add(metadata) { success, error in
                Self.resume(cont, success: success, error: error, fail: "Could not tag the workout.")
            }
        }
    }

    private func endDate(on dateStr: String) -> Date {
        let today = MountainDate.today()
        if dateStr == today { return Date() }
        guard let day = MountainDate.date(from: dateStr) else { return Date() }
        return day.addingTimeInterval(12 * 60 * 60)
    }

    private func displayName(for type: HKWorkoutActivityType, fallback: String?) -> String {
        if let fallback, !fallback.trimmingCharacters(in: .whitespaces).isEmpty { return fallback }
        switch type {
        case .walking: return "Walk"
        case .running: return "Run"
        case .traditionalStrengthTraining, .functionalStrengthTraining: return "Strength"
        case .yoga, .flexibility: return "Stretch"
        case .cycling: return "Cycle"
        case .hiking: return "Hike"
        case .elliptical: return "Elliptical"
        case .coreTraining: return "Core"
        default: return "Workout"
        }
    }

    private func activityType(for name: String) -> HKWorkoutActivityType {
        let key = name.lowercased()
        if key.contains("walk") { return .walking }
        if key.contains("run") || key.contains("jog") { return .running }
        if key.contains("strength") || key.contains("lift") { return .traditionalStrengthTraining }
        if key.contains("yoga") || key.contains("stretch") { return .yoga }
        if key.contains("cycle") || key.contains("bike") { return .cycling }
        return .other
    }

    private func dayRange(_ dateStr: String) -> (Date, Date) {
        let day = MountainDate.date(from: dateStr) ?? Date()
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = AppConfig.mountainTimeZone
        let start = cal.startOfDay(for: day)
        let end = cal.date(byAdding: .day, value: 1, to: start) ?? start.addingTimeInterval(86400)
        return (start, end)
    }

    private func startOfToday() -> Date {
        Calendar.current.startOfDay(for: Date())
    }

    private func startOfYesterday() -> Date {
        Calendar.current.date(byAdding: .day, value: -1, to: startOfToday()) ?? startOfToday()
    }

    private func sum(_ id: HKQuantityTypeIdentifier, unit: HKUnit, start: Date) async throws -> Double {
        guard let type = HKQuantityType.quantityType(forIdentifier: id) else { return 0 }
        let pred = HKQuery.predicateForSamples(withStart: start, end: Date())
        return try await withCheckedThrowingContinuation { cont in
            let q = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: pred, options: .cumulativeSum) { _, stats, err in
                if let err { cont.resume(throwing: err); return }
                cont.resume(returning: stats?.sumQuantity()?.doubleValue(for: unit) ?? 0)
            }
            store.execute(q)
        }
    }

    private func latest(_ id: HKQuantityTypeIdentifier, unit: HKUnit) async throws -> Double? {
        guard let type = HKQuantityType.quantityType(forIdentifier: id) else { return nil }
        return try await withCheckedThrowingContinuation { cont in
            let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
            let q = HKSampleQuery(sampleType: type, predicate: nil, limit: 1, sortDescriptors: [sort]) { _, samples, err in
                if let err { cont.resume(throwing: err); return }
                let qty = (samples?.first as? HKQuantitySample)?.quantity.doubleValue(for: unit)
                cont.resume(returning: qty)
            }
            store.execute(q)
        }
    }

    private func sleepHours(from start: Date) async throws -> Double {
        guard let type = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else { return 0 }
        let pred = HKQuery.predicateForSamples(withStart: start, end: Date())
        return try await withCheckedThrowingContinuation { cont in
            let q = HKSampleQuery(sampleType: type, predicate: pred, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, err in
                if let err { cont.resume(throwing: err); return }
                let asleep: Set<Int> = [
                    HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue,
                    HKCategoryValueSleepAnalysis.asleepCore.rawValue,
                    HKCategoryValueSleepAnalysis.asleepDeep.rawValue,
                    HKCategoryValueSleepAnalysis.asleepREM.rawValue,
                ]
                let seconds = (samples as? [HKCategorySample] ?? [])
                    .filter { asleep.contains($0.value) }
                    .reduce(0.0) { $0 + $1.endDate.timeIntervalSince($1.startDate) }
                cont.resume(returning: seconds / 3600)
            }
            store.execute(q)
        }
    }

    private func workoutMinutes(from start: Date) async throws -> Double {
        let samples = try await workoutSamples(from: start, to: Date())
        return samples.reduce(0.0) { $0 + $1.duration } / 60
    }

    private func workoutSamples(from start: Date, to end: Date) async throws -> [HKWorkout] {
        let pred = HKQuery.predicateForSamples(withStart: start, end: end)
        return try await withCheckedThrowingContinuation { cont in
            let q = HKSampleQuery(sampleType: .workoutType(), predicate: pred, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, err in
                if let err { cont.resume(throwing: err); return }
                cont.resume(returning: samples as? [HKWorkout] ?? [])
            }
            store.execute(q)
        }
    }

    private func mindfulMinutes(from start: Date) async throws -> Double {
        guard let type = HKObjectType.categoryType(forIdentifier: .mindfulSession) else { return 0 }
        let pred = HKQuery.predicateForSamples(withStart: start, end: Date())
        return try await withCheckedThrowingContinuation { cont in
            let q = HKSampleQuery(sampleType: type, predicate: pred, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, err in
                if let err { cont.resume(throwing: err); return }
                let seconds = (samples as? [HKCategorySample] ?? [])
                    .reduce(0.0) { $0 + $1.endDate.timeIntervalSince($1.startDate) }
                cont.resume(returning: seconds / 60)
            }
            store.execute(q)
        }
    }
}
