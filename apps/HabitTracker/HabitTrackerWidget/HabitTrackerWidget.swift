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
        homeOrLock
            .widgetURL(URL(string: snap.inChallenge ? "habittracker://challenge" : "habittracker://habits"))
    }

    @ViewBuilder
    private var homeOrLock: some View {
        switch family {
        case .accessoryCircular:
            lockCircle
        case .accessoryRectangular:
            lockRect
        case .accessoryInline:
            lockInline
        case .systemSmall:
            small.containerBackground(for: .widget) { WColor.cream }
        default:
            medium.containerBackground(for: .widget) { WColor.cream }
        }
    }

    private var snap: WidgetSnapshot { entry.snapshot }

    private var habitPct: Double {
        min(1, Double(snap.habitsDone) / Double(max(snap.habitsTotal, 1)))
    }

    private var proteinPct: Double {
        min(1, Double(snap.proteinGrams) / Double(max(snap.proteinGoal, 1)))
    }

    private var liveSoon: Bool {
        guard snap.inChallenge, snap.challengeIsLive, !snap.challengeDone else { return false }
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "America/Denver") ?? .current
        let hour = cal.component(.hour, from: entry.date)
        let minute = cal.component(.minute, from: entry.date)
        return hour == 12 || (hour == 13 && minute < 20) || hour == 11
    }

    private var small: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(snap.inChallenge ? (liveSoon ? "CLASS" : "DAY \(max(snap.challengeDayN, 1))") : "TODAY")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(WColor.gold)
            Spacer(minLength: 2)
            if snap.inChallenge {
                Text(liveSoon ? "1:00" : (snap.challengeBeforeStart ? "Soon" : "\(snap.habitsDone)/\(max(snap.habitsTotal, 0))"))
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundStyle(WColor.forest)
                Text(liveSoon ? "pm Mountain" : (snap.challengeDayTitle.isEmpty ? snap.challengeName : snap.challengeDayTitle))
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(WColor.forest)
                    .lineLimit(2)
                    .minimumScaleFactor(0.8)
            } else {
                ProgressRing(percent: habitPct, center: "\(snap.habitsDone)/\(max(snap.habitsTotal, 0))", caption: "done", size: 86)
                    .frame(maxWidth: .infinity)
            }
            Spacer(minLength: 4)
            Text(snap.mindsetLine)
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(WColor.muted)
                .lineLimit(2)
                .minimumScaleFactor(0.85)
        }
        .padding(12)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }

    private var medium: some View {
        HStack(spacing: 16) {
            if snap.inChallenge {
                VStack(alignment: .leading, spacing: 6) {
                    Text(liveSoon ? "LIVE TODAY" : "DAY \(max(snap.challengeDayN, 1))")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(WColor.gold)
                    Text(snap.challengeDayTitle.isEmpty ? (snap.challengeBeforeStart ? "We start soon" : snap.challengeName) : snap.challengeDayTitle)
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(WColor.forest)
                        .lineLimit(3)
                        .minimumScaleFactor(0.8)
                    Text(liveSoon ? "Join at 1:00 pm Mountain" : (snap.challengeIsLive ? "Class 1:00 pm Mountain" : "Video + recipes in Challenge"))
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(WColor.forest.opacity(0.8))
                    Spacer(minLength: 4)
                    Text(snap.mindsetLine)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(WColor.muted)
                        .lineLimit(2)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            } else {
                ProgressRing(percent: habitPct, center: "\(snap.habitsDone)/\(max(snap.habitsTotal, 0))", caption: "today", size: 108)
                VStack(alignment: .leading, spacing: 8) {
                    Text("TODAY")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(WColor.gold)
                    Text(snap.mindsetLine)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(WColor.forest)
                        .lineLimit(2)
                    metricRow(label: "Habits", value: "\(snap.habitsDone)/\(max(snap.habitsTotal, 0))", pct: habitPct)
                    metricRow(label: "Protein", value: "\(snap.proteinGrams)g", pct: proteinPct)
                    if snap.moveMinutes > 0 {
                        Text("\(snap.moveMinutes) min move")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(WColor.forest)
                    }
                    Spacer(minLength: 0)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var lockCircle: some View {
        ZStack {
            AccessoryWidgetBackground()
            VStack(spacing: 0) {
                if snap.inChallenge {
                    Text(liveSoon ? "LIVE" : "\(max(snap.challengeDayN, 1))")
                        .font(.system(size: liveSoon ? 12 : 20, weight: .bold))
                    Text(liveSoon ? "now" : "DAY")
                        .font(.system(size: 9, weight: .bold))
                } else {
                    Text("\(snap.habitsDone)")
                        .font(.system(size: 20, weight: .bold))
                    Text("/\(max(snap.habitsTotal, 0))")
                        .font(.system(size: 9, weight: .bold))
                }
            }
        }
    }

    private var lockRect: some View {
        VStack(alignment: .leading, spacing: 2) {
            if snap.inChallenge {
                Text(liveSoon ? "Class 1:00 pm" : "Day \(max(snap.challengeDayN, 1)) · \(snap.challengeDayTitle)")
                    .font(.headline)
                    .lineLimit(1)
                Text(snap.mindsetLine)
                    .font(.caption)
                    .lineLimit(1)
            } else {
                Text("\(snap.habitsDone)/\(max(snap.habitsTotal, 0)) · \(snap.proteinGrams)g")
                    .font(.headline)
                Text(snap.mindsetLine)
                    .font(.caption)
                    .lineLimit(1)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var lockInline: some View {
        Text(snap.inChallenge
             ? (liveSoon ? "Class 1:00 · tap to join" : "Day \(max(snap.challengeDayN, 1)) · \(snap.mindsetLine)")
             : snap.mindsetLine)
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

private struct ProgressRing: View {
    var percent: Double
    var center: String
    var caption: String
    var size: CGFloat

    var body: some View {
        ZStack {
            Circle().stroke(WColor.track, lineWidth: 10)
            Circle()
                .trim(from: 0, to: max(0.02, percent))
                .stroke(WColor.gold, style: StrokeStyle(lineWidth: 10, lineCap: .round))
                .rotationEffect(.degrees(-90))
            VStack(spacing: 0) {
                Text(center)
                    .font(.system(size: size > 100 ? 26 : 20, weight: .bold, design: .rounded))
                    .foregroundStyle(WColor.forest)
                Text(caption)
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
        .description("Habits, mindset, and Challenge when you’re in one.")
        .supportedFamilies([
            .systemSmall,
            .systemMedium,
            .accessoryCircular,
            .accessoryRectangular,
            .accessoryInline,
        ])
    }
}
