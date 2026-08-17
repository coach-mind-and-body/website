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
        return set
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

    func saveWorkout(named name: String, minutes: Int, on dateStr: String = MountainDate.today()) async {
        guard isAvailable, minutes > 0 else { return }
        let end = endDate(on: dateStr)
        let start = end.addingTimeInterval(-Double(minutes) * 60)
        let workout = HKWorkout(activityType: activityType(for: name), start: start, end: end)
        do {
            try await store.save(workout)
            await refreshToday()
        } catch {
            lastError = error.localizedDescription
        }
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

    private func endDate(on dateStr: String) -> Date {
        let today = MountainDate.today()
        if dateStr == today { return Date() }
        guard let day = MountainDate.date(from: dateStr) else { return Date() }
        return day.addingTimeInterval(12 * 60 * 60)
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
        let pred = HKQuery.predicateForSamples(withStart: start, end: Date())
        return try await withCheckedThrowingContinuation { cont in
            let q = HKSampleQuery(sampleType: .workoutType(), predicate: pred, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, err in
                if let err { cont.resume(throwing: err); return }
                let seconds = (samples as? [HKWorkout] ?? []).reduce(0.0) { $0 + $1.duration }
                cont.resume(returning: seconds / 60)
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
