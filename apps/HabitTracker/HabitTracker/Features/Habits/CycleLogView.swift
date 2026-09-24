import SwiftUI

struct CycleCard: View {
    @Bindable var store: CycleStore
    @Binding var logDate: String
    @Binding var showLog: Bool

    var body: some View {
        let today = store.entry(on: MountainDate.today())
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
            Text(today.map { "Today: \($0.summary)" } ?? "Log bleeding and how you feel. Stays on this iPhone — Lee Anne cannot see this.")
                .font(.subheadline)
                .foregroundStyle(HTTheme.muted)
                .fixedSize(horizontal: false, vertical: true)

            Button {
                logDate = MountainDate.today()
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

            CycleMonthStrip(store: store) { dateStr in
                logDate = dateStr
                showLog = true
            }
        }
        .padding(16)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 18))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(HTTheme.roseBorder))
    }
}

struct CycleMonthStrip: View {
    @Bindable var store: CycleStore
    var onSelect: (String) -> Void

    var body: some View {
        let dates = store.historyDates(months: 6)
        let padded = pad(dates)
        VStack(alignment: .leading, spacing: 8) {
            Text("Last 6 months")
                .font(.caption.weight(.bold))
                .foregroundStyle(HTTheme.muted)
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 4), count: 7), spacing: 4) {
                ForEach(Array(["S", "M", "T", "W", "T", "F", "S"].enumerated()), id: \.offset) { _, d in
                    Text(d)
                        .font(.caption2.weight(.bold))
                        .foregroundStyle(HTTheme.muted)
                        .frame(maxWidth: .infinity)
                }
                ForEach(Array(padded.enumerated()), id: \.offset) { _, dateStr in
                    if let dateStr {
                        Button {
                            onSelect(dateStr)
                        } label: {
                            Circle()
                                .fill(color(for: dateStr))
                                .frame(width: 10, height: 10)
                                .frame(maxWidth: .infinity, minHeight: 16)
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel(dateStr)
                    } else {
                        Color.clear.frame(height: 16)
                    }
                }
            }
        }
    }

    private func pad(_ dates: [String]) -> [String?] {
        guard let first = dates.first else { return [] }
        let lead = MountainDate.weekdayIndex(first)
        return Array(repeating: nil, count: lead) + dates.map { Optional($0) }
    }

    private func color(for dateStr: String) -> Color {
        switch store.entry(on: dateStr)?.bleeding {
        case .spotting: return HTTheme.gold.opacity(0.55)
        case .light: return Color(red: 0.86, green: 0.62, blue: 0.66)
        case .medium: return Color(red: 0.75, green: 0.38, blue: 0.46)
        case .heavy: return HTTheme.forest
        default: return HTTheme.roseBorder
        }
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
