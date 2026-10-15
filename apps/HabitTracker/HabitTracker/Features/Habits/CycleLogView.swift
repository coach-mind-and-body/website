import SwiftUI

struct CycleCard: View {
    @Bindable var store: CycleStore
    @Binding var logDate: String
    @Binding var showLog: Bool
    var onVisibleMonth: (String) -> Void = { _ in }

    var body: some View {
        let todayStr = MountainDate.today()
        let today = store.entry(on: todayStr)
        let status = store.bleedStatus(on: todayStr)
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Cycle")
                    .font(.headline)
                    .foregroundStyle(HTTheme.forest)
                Spacer()
                Text("Private")
                    .font(.caption2.weight(.bold))
                    .foregroundStyle(HTTheme.muted)
            }
            if let today, !today.isEmpty {
                Text("Today: \(today.summary)")
                    .font(.subheadline)
                    .foregroundStyle(HTTheme.forest)
            }
            if let status {
                Text(status)
                    .font(.subheadline)
                    .foregroundStyle(HTTheme.muted)
            }
            if (today == nil || today?.isEmpty == true) && status == nil {
                Text("Log bleeding and how you feel. Stays on this iPhone — Lee Anne cannot see this.")
                    .font(.subheadline)
                    .foregroundStyle(HTTheme.muted)
                    .fixedSize(horizontal: false, vertical: true)
            }

            Button {
                logDate = todayStr
                showLog = true
            } label: {
                Text(today == nil ? "Log cycle" : "Update today")
                    .font(.subheadline.weight(.bold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(HTTheme.forest)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
            }
            .buttonStyle(.plain)

            CycleMonthStrip(store: store, onVisibleMonth: onVisibleMonth) { dateStr in
                logDate = dateStr
                showLog = true
            }

            Text("Stays on this iPhone. Lee Anne cannot see this.")
                .font(.caption)
                .foregroundStyle(HTTheme.muted)
        }
        .padding(16)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 18))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(HTTheme.roseBorder))
    }
}

struct CycleMonthStrip: View {
    @Bindable var store: CycleStore
    var onVisibleMonth: (String) -> Void = { _ in }
    var onSelect: (String) -> Void
    @State private var month = MountainDate.monthDays(MountainDate.today()).first ?? MountainDate.today()

    private let weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

    var body: some View {
        let today = MountainDate.today()
        let onCurrentMonth = String(month.prefix(7)) == String(today.prefix(7))
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(MountainDate.monthTitle(month))
                    .font(.headline)
                    .foregroundStyle(HTTheme.forest)
                Spacer()
                Button {
                    month = shifted(by: -1)
                } label: {
                    Image(systemName: "chevron.left")
                        .frame(width: 32, height: 32)
                }
                .accessibilityLabel("Previous month")
                Button("Today") {
                    month = MountainDate.monthDays(today).first ?? today
                }
                .font(.caption.weight(.bold))
                .disabled(onCurrentMonth)
                Button {
                    month = shifted(by: 1)
                } label: {
                    Image(systemName: "chevron.right")
                        .frame(width: 32, height: 32)
                }
                .disabled(onCurrentMonth)
                .opacity(onCurrentMonth ? 0.35 : 1)
                .accessibilityLabel("Next month")
            }
            .foregroundStyle(HTTheme.muted)
            .buttonStyle(.plain)

            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 6), count: 7), spacing: 6) {
                ForEach(weekdays, id: \.self) { day in
                    Text(day)
                        .font(.caption2.weight(.bold))
                        .foregroundStyle(HTTheme.muted)
                        .frame(maxWidth: .infinity)
                }
                ForEach(0..<MountainDate.leadingBlanks(month), id: \.self) { _ in
                    Color.clear.frame(height: 36)
                }
                ForEach(MountainDate.monthDays(month), id: \.self) { dateStr in
                    dayCell(dateStr, today: today)
                }
            }

            legend

            Text("Tap a day to log it. A dot means symptoms or a note.")
                .font(.caption2)
                .foregroundStyle(HTTheme.muted)
                .frame(maxWidth: .infinity)
        }
        .onChange(of: month) { _, newValue in
            onVisibleMonth(newValue)
        }
    }

    private var legend: some View {
        HStack(spacing: 8) {
            legendItem("Spotting", CycleBleeding.spotting)
            legendItem("Light", .light)
            legendItem("Medium", .medium)
            legendItem("Heavy", .heavy)
        }
        .frame(maxWidth: .infinity)
    }

    private func legendItem(_ label: String, _ bleeding: CycleBleeding) -> some View {
        HStack(spacing: 4) {
            Circle()
                .fill(fill(for: bleeding))
                .frame(width: 8, height: 8)
            Text(label)
                .font(.caption2)
                .foregroundStyle(HTTheme.muted)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
    }

    private func dayCell(_ dateStr: String, today: String) -> some View {
        let entry = store.entry(on: dateStr)
        let bleeding = entry?.bleeding ?? .none
        let isToday = dateStr == today
        let future = dateStr > today
        let marked = hasMark(entry)
        return Button {
            onSelect(dateStr)
        } label: {
            VStack(spacing: 2) {
                Text(dayNumber(dateStr))
                    .font(.caption.weight(.bold))
                Circle()
                    .fill(marked ? markColor(bleeding) : Color.clear)
                    .frame(width: 4, height: 4)
            }
            .frame(maxWidth: .infinity, minHeight: 36)
            .background(fill(for: bleeding))
            .foregroundStyle(numberColor(bleeding, future: future))
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(isToday ? HTTheme.gold : Color.clear, lineWidth: isToday ? 2 : 0)
            )
        }
        .buttonStyle(.plain)
        .accessibilityLabel(accessibilityText(dateStr, entry: entry, isToday: isToday))
    }

    private func shifted(by months: Int) -> String {
        let next = MountainDate.shiftMonth(month, months: months)
        return MountainDate.monthDays(next).first ?? next
    }

    private func dayNumber(_ dateStr: String) -> String {
        let raw = MountainDate.dayNumber(dateStr)
        if let n = Int(raw) { return String(n) }
        return raw
    }

    private func hasMark(_ entry: CycleDay?) -> Bool {
        guard let entry else { return false }
        return !entry.symptoms.isEmpty || !entry.note.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private func fill(for bleeding: CycleBleeding) -> Color {
        switch bleeding {
        case .none: return HTTheme.cream
        case .spotting: return HTTheme.gold.opacity(0.55)
        case .light: return Color(red: 0.86, green: 0.62, blue: 0.66)
        case .medium: return Color(red: 0.75, green: 0.38, blue: 0.46)
        case .heavy: return HTTheme.forest
        }
    }

    private func numberColor(_ bleeding: CycleBleeding, future: Bool) -> Color {
        switch bleeding {
        case .medium, .heavy: return .white
        default: return future ? HTTheme.muted : HTTheme.forest
        }
    }

    private func markColor(_ bleeding: CycleBleeding) -> Color {
        switch bleeding {
        case .medium, .heavy: return .white
        default: return HTTheme.forest
        }
    }

    private func accessibilityText(_ dateStr: String, entry: CycleDay?, isToday: Bool) -> String {
        var parts = [MountainDate.long(dateStr)]
        if isToday { parts.append("today") }
        if let entry, !entry.isEmpty {
            parts.append(entry.summary)
        } else {
            parts.append("nothing logged")
        }
        return parts.joined(separator: ", ")
    }
}

struct CycleLogSheet: View {
    @Bindable var store: CycleStore
    var health: HealthKitService
    var dateStr: String
    @Environment(\.dismiss) private var dismiss
    @State private var bleeding: CycleBleeding = .none
    @State private var symptoms: Set<CycleSymptom> = []
    @State private var note = ""

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text(MountainDate.friendly(dateStr))
                        .font(.title3.weight(.semibold))
                        .foregroundStyle(HTTheme.forest)

                    VStack(alignment: .leading, spacing: 10) {
                        Text("Bleeding")
                            .font(.headline)
                            .foregroundStyle(HTTheme.forest)
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                            ForEach(CycleBleeding.allCases) { level in
                                Button {
                                    bleeding = level
                                } label: {
                                    Text(level.label)
                                        .font(.subheadline.weight(.bold))
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 12)
                                        .background(bleeding == level ? HTTheme.forest : Color.white)
                                        .foregroundStyle(bleeding == level ? Color.white : HTTheme.forest)
                                        .clipShape(RoundedRectangle(cornerRadius: 12))
                                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(HTTheme.roseBorder))
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }

                    VStack(alignment: .leading, spacing: 10) {
                        Text("How you feel")
                            .font(.headline)
                            .foregroundStyle(HTTheme.forest)
                        Text("Optional. Perimenopause is messy — log what showed up.")
                            .font(.subheadline)
                            .foregroundStyle(HTTheme.muted)
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                            ForEach(CycleSymptom.allCases) { symptom in
                                let on = symptoms.contains(symptom)
                                Button {
                                    if on { symptoms.remove(symptom) } else { symptoms.insert(symptom) }
                                } label: {
                                    Text(symptom.label)
                                        .font(.subheadline.weight(.semibold))
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 12)
                                        .background(on ? HTTheme.gold.opacity(0.25) : Color.white)
                                        .foregroundStyle(HTTheme.forest)
                                        .clipShape(RoundedRectangle(cornerRadius: 12))
                                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(on ? HTTheme.gold : HTTheme.roseBorder))
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Note")
                            .font(.headline)
                            .foregroundStyle(HTTheme.forest)
                        TextField("Anything else today…", text: $note, axis: .vertical)
                            .lineLimit(3...6)
                            .padding(14)
                            .background(HTTheme.cream)
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                    }

                    Text("This stays on this iPhone. It is not sent to Lee Anne or the website.")
                        .font(.caption)
                        .foregroundStyle(HTTheme.muted)

                    Button {
                        save()
                    } label: {
                        Text("Save")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(HTTheme.forest)
                            .foregroundStyle(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                    }
                    .buttonStyle(.plain)

                    Button("Clear this day", role: .destructive) {
                        bleeding = .none
                        symptoms = []
                        note = ""
                        save()
                    }
                    .font(.subheadline)
                    .frame(maxWidth: .infinity)
                }
                .padding(20)
            }
            .background(HTTheme.cream.ignoresSafeArea())
            .navigationTitle("Cycle")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
            .onAppear { load() }
        }
    }

    private func load() {
        if let existing = store.entry(on: dateStr) {
            bleeding = existing.bleeding
            symptoms = Set(existing.symptoms)
            note = existing.note
        } else {
            bleeding = .none
            symptoms = []
            note = ""
        }
    }

    private func save() {
        let day = CycleDay(
            dateStr: dateStr,
            bleeding: bleeding,
            symptoms: CycleSymptom.allCases.filter { symptoms.contains($0) },
            note: note,
            fromHealth: false
        )
        store.upsert(day)
        Task { await health.saveCycle(day) }
        dismiss()
    }
}
