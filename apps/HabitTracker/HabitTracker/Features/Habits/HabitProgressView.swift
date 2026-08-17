import SwiftUI

struct HabitProgressView: View {
    @Bindable var model: HabitsViewModel
    @Bindable var auth: AuthStore

    private let weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
    private let trophies: [(days: Int, label: String, icon: String)] = [
        (7, "1 Week Streak", "star.fill"),
        (14, "2 Week Streak", "medal"),
        (30, "1 Month Streak", "rosette"),
        (100, "100 Day Streak", "trophy.fill"),
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if let insight = model.insight, let headline = insight.headline {
                    HTCard {
                        Text(headline).font(.headline).foregroundStyle(HTTheme.forest)
                        if let body = insight.body { Text(body).font(.subheadline).foregroundStyle(HTTheme.muted) }
                    }
                }
                streakCard
                calendarCard
                trophyCard
            }
            .padding(16)
        }
        .sheet(item: Binding(
            get: { model.progressDay.map { DaySheet(id: $0) } },
            set: { model.progressDay = $0?.id }
        )) { day in
            dayDetail(day.id)
        }
    }

    private var streakCard: some View {
        HTCard {
            HStack(spacing: 18) {
                VStack {
                    Text("\(model.currentStreak)")
                        .font(.system(size: 40, weight: .bold, design: .serif))
                        .foregroundStyle(HTTheme.forest)
                    Text("CURRENT")
                        .font(.caption2.weight(.bold))
                        .foregroundStyle(HTTheme.muted)
                }
                .frame(width: 120, height: 120)
                .background(HTTheme.cream)
                .overlay(Circle().stroke(model.currentStreak > 0 ? HTTheme.gold : HTTheme.roseBorder, lineWidth: 6))
                .clipShape(Circle())

                VStack(alignment: .leading, spacing: 8) {
                    Text(model.currentStreak > 0 ? "You’re on fire!" : "Time to start a new streak!")
                        .font(HTTheme.serif)
                        .foregroundStyle(HTTheme.forest)
                    Text("Every day you complete at least one habit, your streak grows.")
                        .font(.subheadline)
                        .foregroundStyle(HTTheme.muted)
                    HStack {
                        Image(systemName: "trophy.fill").foregroundStyle(HTTheme.gold)
                        VStack(alignment: .leading, spacing: 0) {
                            Text("BEST STREAK").font(.caption2.weight(.bold)).foregroundStyle(HTTheme.muted)
                            Text("\(model.bestStreak) days").font(.headline).foregroundStyle(HTTheme.forest)
                        }
                    }
                    .padding(10)
                    .background(HTTheme.cream)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                }
            }
        }
    }

    private var calendarCard: some View {
        HTCard {
            HStack {
                Image(systemName: "calendar").foregroundStyle(HTTheme.gold)
                Text(MountainDate.monthTitle(model.progressMonth))
                    .font(.headline)
                    .foregroundStyle(HTTheme.forest)
                Spacer()
                Button { model.progressMonth = MountainDate.shiftMonth(model.progressMonth, months: -1) } label: {
                    Image(systemName: "chevron.left")
                }
                Button("Today") { model.progressMonth = MountainDate.today() }
                    .font(.caption.weight(.bold))
                Button { model.progressMonth = MountainDate.shiftMonth(model.progressMonth, months: 1) } label: {
                    Image(systemName: "chevron.right")
                }
            }
            .foregroundStyle(HTTheme.muted)

            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 7), spacing: 6) {
                ForEach(weekdays, id: \.self) { d in
                    Text(d).font(.caption2.weight(.bold)).foregroundStyle(HTTheme.muted)
                }
                ForEach(0..<MountainDate.leadingBlanks(model.progressMonth), id: \.self) { _ in
                    Color.clear.frame(height: 36)
                }
                ForEach(MountainDate.monthDays(model.progressMonth), id: \.self) { day in
                    let done = model.completedDateStrs.contains(day)
                    let today = day == MountainDate.today()
                    Button {
                        Task { await model.openProgressDay(day) }
                    } label: {
                        Text(MountainDate.dayNumber(day))
                            .font(.caption.weight(.bold))
                            .frame(maxWidth: .infinity, minHeight: 36)
                            .background(done ? HTTheme.gold : today ? Color.gray.opacity(0.15) : HTTheme.cream)
                            .foregroundStyle(done ? Color.white : HTTheme.forest)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                    .buttonStyle(.plain)
                }
            }
            Text("Tap a day to see habits & meals")
                .font(.caption2)
                .foregroundStyle(HTTheme.muted)
                .frame(maxWidth: .infinity)
        }
    }

    private var trophyCard: some View {
        HTCard {
            HStack {
                Image(systemName: "trophy.fill").foregroundStyle(HTTheme.gold)
                Text("Trophy Case").font(.headline).foregroundStyle(HTTheme.forest)
            }
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                ForEach(trophies, id: \.days) { trophy in
                    let unlocked = model.bestStreak >= trophy.days
                    VStack(spacing: 8) {
                        Image(systemName: trophy.icon)
                            .font(.title)
                            .foregroundStyle(unlocked ? HTTheme.gold : Color.gray.opacity(0.4))
                        Text(trophy.label).font(.caption.weight(.bold)).foregroundStyle(HTTheme.forest)
                        Text(unlocked ? "Unlocked!" : "\(max(0, trophy.days - model.currentStreak)) days left")
                            .font(.caption2)
                            .foregroundStyle(HTTheme.muted)
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity)
                    .background(unlocked ? HTTheme.cream : Color.gray.opacity(0.06))
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .opacity(unlocked ? 1 : 0.65)
                }
            }
        }
    }

    private func dayDetail(_ day: String) -> some View {
        NavigationStack {
            List {
                Section {
                    Text("\(model.habits.filter { model.isCompleted($0, on: day) }.count) of \(model.habits.count) habits completed")
                        .foregroundStyle(HTTheme.muted)
                }
                Section("Habits") {
                    ForEach(model.habits) { habit in
                        HStack {
                            Image(systemName: model.isCompleted(habit, on: day) ? "checkmark.circle.fill" : "circle")
                                .foregroundStyle(model.isCompleted(habit, on: day) ? HTTheme.gold : HTTheme.muted)
                            Text(habit.title)
                            Spacer()
                            if habit.isNumeric {
                                Text("\(model.numericValue(habit, on: day)) \(habit.unit ?? "")")
                                    .font(.caption)
                                    .foregroundStyle(HTTheme.muted)
                            }
                        }
                    }
                }
                Section("Food logged") {
                    if model.progressFood.isEmpty {
                        Text("No food logged this day.").foregroundStyle(HTTheme.muted)
                    } else {
                        ForEach(model.progressFood) { food in
                            VStack(alignment: .leading) {
                                Text(food.foodName)
                                Text("\(food.mealType.capitalized) · \(food.protein)p · \(food.calories) kcal")
                                    .font(.caption)
                                    .foregroundStyle(HTTheme.muted)
                            }
                        }
                    }
                }
                if let note = model.notes.first(where: { $0.dateStr == day })?.note, !note.isEmpty {
                    Section("Note") { Text(note) }
                }
            }
            .navigationTitle(MountainDate.friendly(day))
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { model.progressDay = nil }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}

private struct DaySheet: Identifiable {
    var id: String
}
