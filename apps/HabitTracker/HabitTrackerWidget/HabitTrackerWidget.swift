import WidgetKit
import SwiftUI

private enum WColor {
    static let forest = Color(red: 45 / 255, green: 59 / 255, blue: 45 / 255)
    static let gold = Color(red: 201 / 255, green: 169 / 255, blue: 110 / 255)
    static let cream = Color(red: 250 / 255, green: 245 / 255, blue: 245 / 255)
    static let track = Color(red: 240 / 255, green: 232 / 255, blue: 228 / 255)
    static let muted = Color(red: 107 / 255, green: 122 / 255, blue: 107 / 255)
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), snapshot: previewSnap)
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> Void) {
        completion(SimpleEntry(date: Date(), snapshot: WidgetSnapshotStore.load()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SimpleEntry>) -> Void) {
        let snap = WidgetSnapshotStore.load()
        let entry = SimpleEntry(date: Date(), snapshot: snap)
        let next = Calendar.current.date(byAdding: .minute, value: 15, to: Date()) ?? Date()
        completion(Timeline(entries: [entry], policy: .after(next)))
    }

    private var previewSnap: WidgetSnapshot {
        WidgetSnapshot(
            dateStr: "Today",
            habitsDone: 3,
            habitsTotal: 6,
            proteinGrams: 62,
            proteinGoal: 100,
            nextHabitTitle: "Move your body",
            updatedAt: Date(),
            stepsToday: 4218,
            moveMinutes: 24,
            sleepHours: 7.4
        )
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let snapshot: WidgetSnapshot
}

struct HabitTrackerWidgetEntryView: View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        Group {
            if family == .systemSmall {
                small
            } else {
                medium
            }
        }
        .containerBackground(for: .widget) { WColor.cream }
        .widgetURL(URL(string: "habittracker://habits"))
    }

    private var snap: WidgetSnapshot { entry.snapshot }

    private var proteinPct: Double {
        let goal = max(snap.proteinGoal, 1)
        return min(1, Double(snap.proteinGrams) / Double(goal))
    }

    private var habitPct: Double {
        let total = max(snap.habitsTotal, 1)
        return min(1, Double(snap.habitsDone) / Double(total))
    }

    private var small: some View {
        VStack(spacing: 0) {
            Text("TODAY")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(WColor.gold)
                .frame(maxWidth: .infinity, alignment: .leading)
            Spacer(minLength: 4)
            ProteinRing(percent: proteinPct, grams: snap.proteinGrams, size: 86)
            Spacer(minLength: 6)
            Text("\(snap.habitsDone) of \(max(snap.habitsTotal, 0)) done")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(WColor.forest)
            if snap.moveMinutes > 0 {
                Text("\(snap.moveMinutes) min move")
                    .font(.system(size: 11))
                    .foregroundStyle(WColor.muted)
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var medium: some View {
        HStack(spacing: 16) {
            ProteinRing(percent: proteinPct, grams: snap.proteinGrams, size: 112)
            VStack(alignment: .leading, spacing: 8) {
                Text("TODAY")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(WColor.gold)
                metricRow(label: "Habits", value: "\(snap.habitsDone)/\(max(snap.habitsTotal, 0))", pct: habitPct)
                metricRow(label: "Protein", value: "\(snap.proteinGrams)g", pct: proteinPct)
                HStack(spacing: 12) {
                    if snap.moveMinutes > 0 {
                        Label("\(snap.moveMinutes) min", systemImage: "figure.walk")
                    }
                    if snap.stepsToday > 0 {
                        Text("\(snap.stepsToday.formatted()) steps")
                    }
                }
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(WColor.forest)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
                Spacer(minLength: 0)
                if snap.moveMinutes == 0, snap.stepsToday == 0, let next = snap.nextHabitTitle {
                    Text(next)
                        .font(.system(size: 12))
                        .foregroundStyle(WColor.muted)
                        .lineLimit(1)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        }
        .padding(16)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func metricRow(label: String, value: String, pct: Double) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack {
                Text(label)
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(WColor.muted)
                Spacer()
                Text(value)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(WColor.forest)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(WColor.track)
                    Capsule().fill(WColor.gold)
                        .frame(width: max(6, geo.size.width * pct))
                }
            }
            .frame(height: 7)
        }
    }
}

private struct ProteinRing: View {
    var percent: Double
    var grams: Int
    var size: CGFloat

    var body: some View {
        ZStack {
            Circle()
                .stroke(WColor.track, lineWidth: 10)
            Circle()
                .trim(from: 0, to: max(0.02, percent))
                .stroke(WColor.gold, style: StrokeStyle(lineWidth: 10, lineCap: .round))
                .rotationEffect(.degrees(-90))
            VStack(spacing: 0) {
                Text("\(grams)g")
                    .font(.system(size: size > 100 ? 28 : 22, weight: .bold, design: .rounded))
                    .foregroundStyle(WColor.forest)
                Text("protein")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(WColor.muted)
            }
        }
        .frame(width: size, height: size)
    }
}

struct HabitTrackerWidget: Widget {
    let kind = "HabitTrackerWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            HabitTrackerWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Today")
        .description("Protein, habits, and move — at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
