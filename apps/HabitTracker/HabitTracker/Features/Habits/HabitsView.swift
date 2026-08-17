import SwiftUI

struct HabitsView: View {
    @Bindable var model: HabitsViewModel
    @Bindable var health: HealthKitService
    @Bindable var auth: AuthStore

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if !auth.isSignedIn {
                    guestBanner
                }
                header
                tabPicker
                if model.mainTab == 0 {
                    dailyScroll
                } else {
                    HabitProgressView(model: model, auth: auth)
                }
            }
            .background(HTTheme.cream.ignoresSafeArea())
            .navigationBarHidden(true)
            .task(id: model.sessionEpoch) { await model.load(); await health.refreshToday() }
            .refreshable { await model.load(); await health.refreshToday() }
        }
    }

    private var guestBanner: some View {
        HStack(spacing: 8) {
            Image(systemName: "info.circle")
            Text("Tracking on this iPhone only. Sign in from the profile icon to sync.")
                .font(.caption.weight(.medium))
        }
        .foregroundStyle(.white)
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .frame(maxWidth: .infinity)
        .background(HTTheme.gold)
    }

    private var header: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 2) {
                Text("Today · \(MountainDate.dayNumber(MountainDate.today()))")
                    .font(.caption2.weight(.bold))
                    .foregroundStyle(HTTheme.muted)
                    .textCase(.uppercase)
                Text("My Daily Reset")
                    .font(HTTheme.title)
                    .foregroundStyle(HTTheme.forest)
            }
            Spacer()
            HStack(spacing: 4) {
                Image(systemName: model.currentStreak >= 3 ? "flame.fill" : "flame")
                Text("\(model.currentStreak)")
                    .font(.subheadline.weight(.bold))
            }
            .foregroundStyle(model.currentStreak >= 3 ? Color.orange : HTTheme.muted)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(model.currentStreak >= 3 ? Color.orange.opacity(0.15) : Color.white)
            .clipShape(Capsule())
            .overlay(Capsule().stroke(model.currentStreak >= 3 ? Color.orange.opacity(0.4) : HTTheme.roseBorder))
            Color.clear.frame(width: 40, height: 40)
        }
        .padding(.horizontal, 16)
        .padding(.top, 12)
    }

    private var tabPicker: some View {
        HStack(spacing: 4) {
            pill("Today", tag: 0)
            pill("Progress", tag: 1)
        }
        .padding(4)
        .background(Color.white)
        .clipShape(Capsule())
        .overlay(Capsule().stroke(HTTheme.roseBorder))
        .padding(.vertical, 12)
    }

    private func pill(_ title: String, tag: Int) -> some View {
        Button {
            model.mainTab = tag
            Task { await model.load() }
        } label: {
            Text(title)
                .font(.caption.weight(.bold))
                .padding(.horizontal, 20)
                .padding(.vertical, 8)
                .background(model.mainTab == tag ? HTTheme.forest : Color.clear)
                .foregroundStyle(model.mainTab == tag ? Color.white : HTTheme.muted)
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }

    private var dailyScroll: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                healthStrip
                if let insight = model.insight, let headline = insight.headline {
                    HTCard {
                        Text("This week").font(.caption2.weight(.bold)).foregroundStyle(HTTheme.gold).textCase(.uppercase)
                        Text(headline).font(.headline).foregroundStyle(HTTheme.forest)
                        if let body = insight.body { Text(body).font(.subheadline).foregroundStyle(HTTheme.muted) }
                    }
                }
                updatesSection
                challengeChips
                challengesSection
                habitsCard
                victoriesCard
            }
            .padding(16)
            .padding(.bottom, 12)
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

    private var updatesSection: some View {
        Group {
            if !model.updates.isEmpty {
                Button {
                    model.showUpdates.toggle()
                } label: {
                    HStack {
                        Image(systemName: "megaphone.fill").foregroundStyle(HTTheme.gold)
                        Text("From Lee Anne")
                            .font(.subheadline.weight(.bold))
                            .foregroundStyle(HTTheme.forest)
                        Text("(\(model.unreadUpdateCount))")
                            .font(.caption)
                            .foregroundStyle(HTTheme.muted)
                        Spacer()
                        Text(model.showUpdates ? "−" : "+")
                            .font(.headline)
                            .foregroundStyle(HTTheme.muted)
                    }
                    .padding(14)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 18))
                    .overlay(RoundedRectangle(cornerRadius: 18).stroke(HTTheme.roseBorder))
                }
                .buttonStyle(.plain)

                if model.showUpdates {
                    ForEach(model.visibleUpdates) { update in
                        updateCard(update)
                    }
                }
            }
        }
    }

    private func updateCard(_ update: AppUpdate) -> some View {
        HTCard {
            HStack {
                Text(update.title).font(.headline).foregroundStyle(HTTheme.forest)
                Spacer()
                if !model.dismissedUpdateIds.contains(update.id) {
                    Button("Dismiss") { model.dismissUpdate(update.id) }
                        .font(.caption.weight(.bold))
                        .foregroundStyle(HTTheme.muted)
                }
            }
            Text(update.message).font(.subheadline).foregroundStyle(HTTheme.muted)
            if let vid = model.youtubeId(from: update.videoUrl),
               let url = URL(string: "https://www.youtube.com/watch?v=\(vid)") {
                Link("Watch video", destination: url)
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(HTTheme.gold)
            }
        }
    }

    private var challengeChips: some View {
        Group {
            if !model.featuredChallenges.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(model.featuredChallenges) { challenge in
                            let joined = model.userChallenge(for: challenge.id) != nil
                            let done = model.challengeDoneToday(challenge)
                            Button {
                                Task { await model.tapChallengeChip(challenge) }
                            } label: {
                                HStack(spacing: 6) {
                                    Image(systemName: "target")
                                    Text("\(done ? "✓ " : joined ? "" : "+ ")\(challenge.title)")
                                    if challenge.linkedPodcastSlug != nil {
                                        Image(systemName: "headphones")
                                    }
                                }
                                .font(.caption.weight(.bold))
                                .padding(.horizontal, 12)
                                .padding(.vertical, 8)
                                .background(done ? Color.green.opacity(0.12) : Color.white)
                                .foregroundStyle(HTTheme.forest)
                                .clipShape(Capsule())
                                .overlay(
                                    Capsule().stroke(done ? Color.green.opacity(0.4) : joined ? HTTheme.gold : HTTheme.roseBorder)
                                )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
        }
    }

    private var challengesSection: some View {
        Group {
            if !model.challenges.isEmpty {
                Button {
                    model.showChallenges.toggle()
                } label: {
                    HStack {
                        Image(systemName: "target").foregroundStyle(HTTheme.gold)
                        Text("All challenges")
                            .font(.subheadline.weight(.bold))
                            .foregroundStyle(HTTheme.forest)
                        Spacer()
                        Text(model.showChallenges ? "−" : "+")
                            .font(.headline)
                            .foregroundStyle(HTTheme.muted)
                    }
                    .padding(14)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 18))
                    .overlay(RoundedRectangle(cornerRadius: 18).stroke(HTTheme.roseBorder))
                }
                .buttonStyle(.plain)

                if model.showChallenges {
                    HStack(spacing: 4) {
                        challengeFilter("Active", tag: 0)
                        challengeFilter("Completed", tag: 1)
                    }
                    .padding(4)
                    .background(Color.white)
                    .clipShape(Capsule())

                    let rows = model.filteredChallenges(completed: model.challengeTab == 1)
                    if rows.isEmpty {
                        Text(model.challengeTab == 1 ? "No completed challenges yet. Keep going!" : "You’ve completed all active challenges!")
                            .font(.subheadline)
                            .foregroundStyle(HTTheme.muted)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                    }
                    ForEach(rows) { challenge in
                        challengeCard(challenge)
                    }
                }
            }
        }
    }

    private func challengeFilter(_ title: String, tag: Int) -> some View {
        Button {
            model.challengeTab = tag
        } label: {
            Text(title)
                .font(.caption.weight(.bold))
                .padding(.horizontal, 16)
                .padding(.vertical, 6)
                .background(model.challengeTab == tag ? HTTheme.forest : Color.clear)
                .foregroundStyle(model.challengeTab == tag ? Color.white : HTTheme.muted)
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }

    private func challengeCard(_ challenge: Challenge) -> some View {
        let joined = model.userChallenge(for: challenge.id) != nil
        let done = model.challengeDoneToday(challenge)
        let pct = model.challengePercent(challenge)
        return HTCard {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(challenge.title).font(.headline).foregroundStyle(HTTheme.forest)
                    if let d = challenge.description { Text(d).font(.caption).foregroundStyle(HTTheme.muted) }
                }
                Spacer()
                if !joined {
                    Button("Join") { Task { await model.join(challenge) } }
                        .font(.caption.weight(.bold))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(HTTheme.gold)
                        .foregroundStyle(.white)
                        .clipShape(Capsule())
                } else {
                    Text(done ? "Done today" : "Joined")
                        .font(.caption2.weight(.bold))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(done ? Color.green.opacity(0.2) : HTTheme.roseBorder)
                        .clipShape(Capsule())
                }
            }
            if joined {
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text("\(model.challengeProgress(challenge)) of \(challenge.durationDays ?? 7) days")
                        Spacer()
                        Text("\(pct)%")
                    }
                    .font(.caption.weight(.bold))
                    .foregroundStyle(HTTheme.muted)
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(HTTheme.roseBorder)
                            Capsule().fill(HTTheme.gold).frame(width: geo.size.width * CGFloat(pct) / 100)
                        }
                    }
                    .frame(height: 8)
                    if pct < 100 {
                        Button(done ? "Completed for today" : "Complete for today") {
                            Task { await model.toggleChallenge(challenge) }
                        }
                        .font(.subheadline.weight(.bold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(done ? Color.clear : HTTheme.gold)
                        .foregroundStyle(done ? HTTheme.gold : Color.white)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(HTTheme.gold))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    } else {
                        Text("Challenge completed")
                            .font(.subheadline.weight(.bold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(Color.green.opacity(0.18))
                            .foregroundStyle(HTTheme.forest)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }
            }
        }
    }

    private var habitsCard: some View {
        HTCard {
            HStack {
                Text("Today’s habits").font(.headline).foregroundStyle(HTTheme.forest)
                Spacer()
                Button(model.showPastDays ? "Hide calendar" : "Edit past days") {
                    model.showPastDays.toggle()
                }
                .font(.caption.weight(.bold))
                .foregroundStyle(HTTheme.muted)
            }

            if model.showPastDays {
                HStack {
                    Button("← Week") { model.shiftWeek(-1) }
                    Spacer()
                    Text("\(MountainDate.dayNumber(model.weekDays.first ?? ""))–\(MountainDate.dayNumber(model.weekDays.last ?? ""))")
                        .font(.subheadline.weight(.semibold))
                    Spacer()
                    Button("Week →") { model.shiftWeek(1) }
                }
                .font(.caption.weight(.bold))
                .foregroundStyle(HTTheme.gold)

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(model.weekDays, id: \.self) { day in
                            let selected = day == model.dateStr
                            let today = day == MountainDate.today()
                            Button {
                                Task { await model.selectDay(day) }
                            } label: {
                                VStack(spacing: 6) {
                                    Text(MountainDate.weekdayShort(day))
                                        .font(.caption2.weight(.bold))
                                        .foregroundStyle(selected ? HTTheme.gold : HTTheme.muted)
                                    Text(MountainDate.dayNumber(day))
                                        .font(.subheadline.weight(.bold))
                                        .frame(width: 36, height: 36)
                                        .background(today ? HTTheme.gold : selected ? Color.white : Color.clear)
                                        .foregroundStyle(today ? Color.white : HTTheme.forest)
                                        .clipShape(Circle())
                                }
                                .padding(8)
                                .background(selected ? HTTheme.cream : Color.clear)
                                .clipShape(RoundedRectangle(cornerRadius: 14))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                Text("Habits for \(MountainDate.friendly(model.dateStr))")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(HTTheme.muted)
                    .frame(maxWidth: .infinity)
            }

            if model.isLoading && model.habits.isEmpty {
                ProgressView().frame(maxWidth: .infinity).padding(.top, 20)
            }

            ForEach(model.habits) { habit in
                habitRow(habit)
            }

            DisclosureGroup(isExpanded: $model.notesExpanded) {
                TextField("How are you feeling today?", text: $model.noteDraft, axis: .vertical)
                    .lineLimit(3...6)
                    .padding(10)
                    .background(HTTheme.cream)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                Button("Save note") { Task { await model.saveNote() } }
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(HTTheme.forest)
            } label: {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Daily notes").font(.headline).foregroundStyle(HTTheme.forest)
                    Text("Reflect on \(MountainDate.friendly(model.dateStr))")
                        .font(.caption)
                        .foregroundStyle(HTTheme.muted)
                }
            }
            .tint(HTTheme.forest)
        }
    }

    private func habitRow(_ habit: Habit) -> some View {
        let done = model.isCompleted(habit)
        let card = VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(habit.title)
                        .font(.headline)
                        .foregroundStyle(done ? Color.white : HTTheme.forest)
                    if let d = habit.description, !d.isEmpty {
                        Text(d).font(.caption).foregroundStyle(done ? Color.white.opacity(0.85) : HTTheme.muted)
                    }
                }
                Spacer()
                if habit.isNumeric {
                    let val = model.numericValue(habit)
                    Stepper("", value: Binding(
                        get: { val },
                        set: { new in Task { await model.setNumeric(habit, value: new) } }
                    ), in: 0...500)
                    .labelsHidden()
                    .tint(done ? .white : HTTheme.forest)
                } else {
                    Image(systemName: done ? "checkmark.circle.fill" : "circle")
                        .font(.title2)
                        .foregroundStyle(done ? Color.white : HTTheme.muted)
                }
            }
            if habit.isNumeric {
                let val = model.numericValue(habit)
                let target = max(habit.targetValue ?? 1, 1)
                let pct = min(1, Double(val) / Double(target))
                ProgressView(value: pct)
                    .tint(done ? Color.white : HTTheme.gold)
                Text("\(val) / \(target) \(habit.unit ?? "")")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(done ? Color.white : HTTheme.muted)
                    .frame(maxWidth: .infinity, alignment: .trailing)
            }
        }
        .padding(14)
        .background(done ? HTTheme.gold : HTTheme.cream)
        .clipShape(RoundedRectangle(cornerRadius: 16))

        if habit.isNumeric {
            return AnyView(card)
        }
        return AnyView(
            Button {
                Task { await model.toggle(habit) }
            } label: {
                card
            }
            .buttonStyle(.plain)
        )
    }

    private var victoriesCard: some View {
        DisclosureGroup(isExpanded: $model.victoriesExpanded) {
            TextField("Win 1", text: $model.win1)
            TextField("Win 2", text: $model.win2)
            TextField("Win 3", text: $model.win3)
            Button("Save victories") { Task { await model.saveVictories() } }
                .font(.subheadline.weight(.bold))
                .foregroundStyle(HTTheme.forest)
        } label: {
            HStack {
                Image(systemName: "sparkles").foregroundStyle(HTTheme.gold)
                VStack(alignment: .leading, spacing: 2) {
                    Text("3 victories").font(.headline).foregroundStyle(HTTheme.forest)
                    Text("Evidence for later-you").font(.caption).foregroundStyle(HTTheme.muted)
                }
            }
        }
        .padding(16)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 24))
        .overlay(RoundedRectangle(cornerRadius: 24).stroke(HTTheme.roseBorder))
        .tint(HTTheme.forest)
    }
}
