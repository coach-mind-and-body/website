import SwiftUI

struct HabitsView: View {
    @Bindable var model: HabitsViewModel
    @Bindable var health: HealthKitService

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    header
                    healthStrip
                    dayPager
                    if model.isLoading && model.habits.isEmpty {
                        ProgressView().frame(maxWidth: .infinity).padding(.top, 40)
                    }
                    ForEach(model.habits) { habit in
                        habitRow(habit)
                    }
                    noteCard
                }
                .padding(16)
            }
            .background(HTTheme.cream.ignoresSafeArea())
            .navigationTitle("Today")
            .task { await model.load(); await health.refreshToday() }
            .refreshable { await model.load(); await health.refreshToday() }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(model.dateStr == MountainDate.today() ? "Today" : model.dateStr)
                .font(.caption.weight(.bold))
                .foregroundStyle(HTTheme.muted)
                .textCase(.uppercase)
            Text("What matters today")
                .font(HTTheme.serif)
                .foregroundStyle(HTTheme.forest)
            Text("\(model.doneCount) of \(model.habits.count) checked")
                .font(.subheadline)
                .foregroundStyle(HTTheme.muted)
        }
    }

    private var healthStrip: some View {
        HStack(spacing: 10) {
            healthChip("Steps", value: "\(Int(health.stepsToday))")
            healthChip("Sleep", value: String(format: "%.1fh", health.sleepHoursLastNight))
            if let kg = health.weightKg {
                healthChip("Weight", value: String(format: "%.1fkg", kg))
            }
        }
    }

    private func healthChip(_ label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label.uppercased()).font(.caption2.weight(.bold)).foregroundStyle(HTTheme.muted)
            Text(value).font(.headline).foregroundStyle(HTTheme.forest)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(HTTheme.roseBorder))
    }

    private var dayPager: some View {
        HStack {
            Button("←") { Task { await model.shiftDay(-1) } }
            Spacer()
            Text(model.dateStr).font(.subheadline.weight(.semibold)).foregroundStyle(HTTheme.forest)
            Spacer()
            Button("→") { Task { await model.shiftDay(1) } }
        }
        .foregroundStyle(HTTheme.gold)
        .padding(.vertical, 4)
    }

    private func habitRow(_ habit: Habit) -> some View {
        let log = model.log(for: habit.id)
        return HTCard {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(habit.title).font(.headline).foregroundStyle(HTTheme.forest)
                    if let d = habit.description, !d.isEmpty {
                        Text(d).font(.caption).foregroundStyle(HTTheme.muted)
                    }
                    if habit.isNumeric {
                        Text("\(log?.numericValue ?? 0) / \(habit.targetValue ?? 0) \(habit.unit ?? "")")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(HTTheme.gold)
                    }
                }
                Spacer()
                if habit.isNumeric {
                    Stepper("", value: Binding(
                        get: { log?.numericValue ?? 0 },
                        set: { new in Task { await model.setNumeric(habit, value: new) } }
                    ), in: 0...500)
                    .labelsHidden()
                } else {
                    Button {
                        Task { await model.toggle(habit) }
                    } label: {
                        Image(systemName: log?.completed == true ? "checkmark.circle.fill" : "circle")
                            .font(.title2)
                            .foregroundStyle(log?.completed == true ? HTTheme.gold : HTTheme.muted)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var noteCard: some View {
        HTCard {
            Text("Note").font(.caption.weight(.bold)).foregroundStyle(HTTheme.muted)
            TextField("A sentence for later-you", text: $model.noteDraft, axis: .vertical)
                .lineLimit(2...5)
            Button("Save note") { Task { await model.saveNote() } }
                .font(.subheadline.weight(.bold))
                .foregroundStyle(HTTheme.forest)
        }
    }
}
