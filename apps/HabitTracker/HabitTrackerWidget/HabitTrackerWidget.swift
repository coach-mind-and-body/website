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
            updatedAt: Date()
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
        VStack(alignment: .leading, spacing: 6) {
            Text("HABIT TRACKER")
                .font(.caption2.weight(.bold))
                .foregroundStyle(Color(red: 201 / 255, green: 169 / 255, blue: 110 / 255))
            Text(entry.snapshot.habitLine)
                .font(.headline)
                .foregroundStyle(Color(red: 45 / 255, green: 59 / 255, blue: 45 / 255))
            Text(entry.snapshot.proteinLine)
                .font(.subheadline)
                .foregroundStyle(Color(red: 45 / 255, green: 59 / 255, blue: 45 / 255).opacity(0.8))
            if family != .systemSmall, let next = entry.snapshot.nextHabitTitle {
                Text("Next: \(next)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer(minLength: 0)
        }
        .containerBackground(for: .widget) {
            Color(red: 250 / 255, green: 245 / 255, blue: 245 / 255)
        }
    }
}

struct HabitTrackerWidget: Widget {
    let kind = "HabitTrackerWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            HabitTrackerWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Today")
        .description("Habits checked and protein so far today.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
