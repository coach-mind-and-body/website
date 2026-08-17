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

    private var readTypes: Set<HKObjectType> {
        var set: Set<HKObjectType> = []
        if let s = HKObjectType.quantityType(forIdentifier: .stepCount) { set.insert(s) }
        if let s = HKObjectType.quantityType(forIdentifier: .bodyMass) { set.insert(s) }
        if let s = HKObjectType.quantityType(forIdentifier: .activeEnergyBurned) { set.insert(s) }
        if let s = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) { set.insert(s) }
        set.insert(HKObjectType.workoutType())
        return set
    }

    func requestAccess() async {
        guard isAvailable else {
            lastError = "Health data is not available on this device."
            return
        }
        do {
            try await store.requestAuthorization(toShare: [], read: readTypes)
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
        async let sleep = sleepHours(from: startOfYesterday())
        async let mass = latest(.bodyMass, unit: .gramUnit(with: .kilo))
        stepsToday = (try? await steps) ?? 0
        _ = try? await energy
        sleepHoursLastNight = (try? await sleep) ?? 0
        weightKg = try? await mass
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
}
