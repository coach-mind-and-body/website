import WidgetKit
import SwiftUI

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
        let next = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date()
        completion(Timeline(entries: [entry], policy: .after(next)))
    }

    private var previewSnap: WidgetSnapshot {
        WidgetSnapshot(
            dateStr: "Today",
            habitsDone: 3,
            habitsTotal: 6,
            proteinGrams: 62,
            proteinGoal: 100,
            nextHabitTitle: "Walk 10 minutes",
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
        let forest = Color(red: 45 / 255, green: 59 / 255, blue: 45 / 255)
        let gold = Color(red: 201 / 255, green: 169 / 255, blue: 110 / 255)
        VStack(alignment: .leading, spacing: 6) {
            Text("TODAY")
                .font(.caption2.weight(.bold))
                .foregroundStyle(gold)
            Text(entry.snapshot.habitLine)
                .font(.headline)
                .foregroundStyle(forest)
            Text(entry.snapshot.proteinLine)
                .font(.subheadline)
                .foregroundStyle(forest.opacity(0.85))
            if entry.snapshot.moveMinutes > 0 || entry.snapshot.stepsToday > 0 {
                Text(entry.snapshot.moveLine)
                    .font(.caption)
                    .foregroundStyle(forest.opacity(0.75))
            }
            if family != .systemSmall, entry.snapshot.sleepHours > 0 {
                Text(String(format: "%.1fh sleep", entry.snapshot.sleepHours))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else if family != .systemSmall, let next = entry.snapshot.nextHabitTitle {
                Text(next)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer(minLength: 0)
        }
        .containerBackground(for: .widget) {
            Color(red: 250 / 255, green: 245 / 255, blue: 245 / 255)
        }
        .widgetURL(URL(string: "habittracker://habits"))
    }
}

struct HabitTrackerWidget: Widget {
    let kind = "HabitTrackerWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            HabitTrackerWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Today")
        .description("Today’s habits, protein, and Apple Health move.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
