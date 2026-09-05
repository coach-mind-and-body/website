import SwiftUI

struct HabitsView: View {
    @Bindable var model: HabitsViewModel
    @Bindable var health: HealthKitService
    @Bindable var auth: AuthStore
    @State private var showMindful = false
    @State private var mindfulMinutes = 2
    @State private var mindfulRemaining = 0
    @State private var mindfulRunning = false
    @State private var showForYou = false
    @State private var showLogin = false
    @Environment(\.openURL) private var openURL

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
            .task(id: model.sessionEpoch) {
                await model.load()
                await health.refreshToday()
                await model.syncFromHealth()
            }
            .refreshable {
                await model.load()
                await health.refreshToday()
                await model.syncFromHealth()
            }
            .onChange(of: health.moveMinutesToday) {
                Task { await model.syncFromHealth() }
            }
            .onChange(of: health.mindfulMinutesToday) {
                Task { await model.syncFromHealth() }
            }
            .sheet(isPresented: $showMindful) {
                mindfulSheet
            }
            .sheet(isPresented: $showForYou) {
                forYouSheet
            }
            .sheet(isPresented: $showLogin) {
                LoginView(auth: auth, allowsSkip: true)
            }
        }
    }

    private var guestBanner: some View {
        Button {
            showLogin = true
        } label: {
            HStack(spacing: 8) {
                Image(systemName: "info.circle")
                Text("Tracking on this iPhone only. Tap to sign in and sync.")
                    .font(.caption.weight(.medium))
                    .multilineTextAlignment(.leading)
                Spacer(minLength: 8)
                Text("Sign in")
                    .font(.caption.weight(.bold))
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .frame(maxWidth: .infinity)
            .background(HTTheme.gold)
        }
        .buttonStyle(.plain)
    }

    private var header: some View {
        HStack(alignment: .center, spacing: 8) {
            VStack(alignment: .leading, spacing: 2) {
                Text("Today · \(MountainDate.shortMonthDay(MountainDate.today()))")
                    .font(.caption2.weight(.bold))
                    .foregroundStyle(HTTheme.muted)
                    .textCase(.uppercase)
                Text("My Daily Reset")
                    .font(HTTheme.title)
                    .foregroundStyle(HTTheme.forest)
            }
            Spacer(minLength: 8)
            HStack(spacing: 4) {
                Image(systemName: model.currentStreak >= 3 ? "flame.fill" : "flame")
                Text("\(model.currentStreak)")
                    .font(.subheadline.weight(.bold))
            }
            .foregroundStyle(model.currentStreak >= 3 ? Color.orange : HTTheme.muted)
            .frame(height: 40)
            .padding(.horizontal, 12)
            .background(model.currentStreak >= 3 ? Color.orange.opacity(0.15) : Color.white)
            .clipShape(Capsule())
            .overlay(Capsule().stroke(model.currentStreak >= 3 ? Color.orange.opacity(0.4) : HTTheme.roseBorder))
            ProfileAvatarButton(auth: auth)
        }
        .padding(.horizontal, 16)
        .padding(.top, 8)
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
                forYouRow
                todayChallengeCard
                challengeChips
                habitsCard
                victoriesCard
            }
            .padding(16)
        }
        .dockScrollClearance()
    }

    private var forYouRow: some View {
        let unread = model.unreadUpdateCount
        return Group {
            if unread > 0 {
                Button {
                    model.showUpdates = true
                    model.showChallenges = false
                    showForYou = true
                } label: {
                    HStack(spacing: 10) {
                        Image(systemName: "megaphone.fill")
                            .foregroundStyle(HTTheme.gold)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("From Lee Anne")
                                .font(.subheadline.weight(.bold))
                                .foregroundStyle(HTTheme.forest)
                            Text(unread == 1 ? "1 new note" : "\(unread) new notes")
                                .font(.caption)
                                .foregroundStyle(HTTheme.muted)
                        }
                        Spacer()
                        if unread > 0 {
                            Text("\(unread)")
                                .font(.caption2.weight(.bold))
                                .padding(.horizontal, 7)
                                .padding(.vertical, 3)
                                .background(HTTheme.gold)
                                .foregroundStyle(.white)
                                .clipShape(Capsule())
                        }
                        Image(systemName: "chevron.right")
                            .font(.caption.weight(.bold))
                            .foregroundStyle(HTTheme.muted)
                    }
                    .padding(14)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 18))
                    .overlay(RoundedRectangle(cornerRadius: 18).stroke(HTTheme.roseBorder))
                }
                .buttonStyle(.plain)
            }
        }
    }

    private var forYouSheet: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
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
                }
                .padding(16)
            }
            .background(HTTheme.cream.ignoresSafeArea())
            .navigationTitle("For you")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { showForYou = false }
                }
            }
        }
        .presentationDetents([.medium, .large])
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
            if let vid = YouTubeID.parse(update.videoUrl) {
                YouTubePlayer(videoId: vid)
            }
        }
    }

    @ViewBuilder
    private var todayChallengeCard: some View {
        if let today = model.todayChallenge, today.enrolled {
            HTCard {
                Text("Real Food Reset")
                    .font(.caption2.weight(.bold))
                    .foregroundStyle(HTTheme.gold)
                    .textCase(.uppercase)
                Text(today.title ?? "The 5-Day Real Food Reset")
                    .font(.headline)
                    .foregroundStyle(HTTheme.forest)
                if today.beforeStart == true {
                    Text("You’re in. We start September 28. Lives Mon/Wed/Fri at 12:00 pm Mountain.")
                        .font(.subheadline)
                        .foregroundStyle(HTTheme.muted)
                }
                if today.afterEnd == true {
                    Text("The five days are complete. Your journal is still here.")
                        .font(.subheadline)
                        .foregroundStyle(HTTheme.muted)
                }
                if let day = today.today {
                    Text("Day \(day.n) · \(day.weekday)")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(HTTheme.muted)
                    Text(day.title)
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(HTTheme.forest)
                    Text(day.win)
                        .font(.caption)
                        .foregroundStyle(HTTheme.muted)
                    if let meet = today.meetUrl, let url = URL(string: meet) {
                        Button {
                            openURL(url)
                        } label: {
                            Label("Join live (Google Meet)", systemImage: "video.fill")
                                .font(.subheadline.weight(.bold))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 10)
                                .background(HTTheme.forest)
                                .foregroundStyle(.white)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                        .buttonStyle(.plain)
                    }
                    if day.format == "video" {
                        Text("No live call today. Log your food and jot a few lines below.")
                            .font(.caption)
                            .foregroundStyle(HTTheme.muted)
                    }
                    Text("Logging a meal in Macros or saving your journal counts as today’s check-in.")
                        .font(.caption2)
                        .foregroundStyle(HTTheme.muted)
                    Button {
                        Task { await model.toggleTodayChallenge() }
                    } label: {
                        Text((day.done ?? false) ? "Done today" : "Check off today")
                            .font(.subheadline.weight(.bold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background((day.done ?? false) ? Color.clear : HTTheme.gold)
                            .foregroundStyle((day.done ?? false) ? HTTheme.gold : Color.white)
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(HTTheme.gold))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .buttonStyle(.plain)
                    Text("Daily journal")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(HTTheme.forest)
                        .padding(.top, 4)
                    Text(day.journal?.noticed ?? "What did you notice today?")
                        .font(.caption2)
                        .foregroundStyle(HTTheme.muted)
                    TextField("", text: $model.journalNoticed, axis: .vertical)
                        .lineLimit(2...4)
                        .textFieldStyle(.roundedBorder)
                    Text(day.journal?.glad ?? "One choice you’re glad you made")
                        .font(.caption2)
                        .foregroundStyle(HTTheme.muted)
                    TextField("", text: $model.journalGlad, axis: .vertical)
                        .lineLimit(2...4)
                        .textFieldStyle(.roundedBorder)
                    Text(day.journal?.hard ?? "One thing that was hard")
                        .font(.caption2)
                        .foregroundStyle(HTTheme.muted)
                    TextField("", text: $model.journalHard, axis: .vertical)
                        .lineLimit(2...4)
                        .textFieldStyle(.roundedBorder)
                    Button {
                        Task { await model.saveTodayJournal() }
                    } label: {
                        Text(model.journalSaving ? "Saving…" : "Save journal")
                            .font(.caption.weight(.bold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                    }
                    .buttonStyle(.plain)
                    .disabled(model.journalSaving)
                }
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

            ForEach(model.checklistHabits) { habit in
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

    private var mindfulSheet: some View {
        NavigationStack {
            VStack(spacing: 20) {
                Text("Mindful minutes")
                    .font(HTTheme.title)
                    .foregroundStyle(HTTheme.forest)
                Text("This session is saved to Apple Health when you finish.")
                    .font(.subheadline)
                    .foregroundStyle(HTTheme.muted)
                    .multilineTextAlignment(.center)
                if mindfulRunning {
                    Text("\(mindfulRemaining / 60):\(String(format: "%02d", mindfulRemaining % 60))")
                        .font(.system(size: 48, weight: .bold, design: .rounded))
                        .foregroundStyle(HTTheme.forest)
                    Button("End early & save") {
                        Task {
                            let elapsed = max(1, mindfulMinutes * 60 - mindfulRemaining)
                            await model.startMindfulSession(minutes: max(1, Int((Double(elapsed) / 60.0).rounded(.up))))
                            stopMindful()
                        }
                    }
                    .font(.headline)
                    .foregroundStyle(HTTheme.gold)
                } else {
                    Picker("Minutes", selection: $mindfulMinutes) {
                        Text("1 min").tag(1)
                        Text("2 min").tag(2)
                        Text("5 min").tag(5)
                        Text("10 min").tag(10)
                    }
                    .pickerStyle(.segmented)
                    Button("Begin") {
                        mindfulRemaining = mindfulMinutes * 60
                        mindfulRunning = true
                        tickMindful()
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(HTTheme.forest)
                }
                Spacer()
            }
            .padding(24)
            .background(HTTheme.cream.ignoresSafeArea())
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { stopMindful() }
                }
            }
        }
        .presentationDetents([.medium])
    }

    private func tickMindful() {
        Task {
            while mindfulRunning, mindfulRemaining > 0 {
                try? await Task.sleep(for: .seconds(1))
                if !mindfulRunning { return }
                mindfulRemaining -= 1
            }
            if mindfulRunning, mindfulRemaining <= 0 {
                await model.startMindfulSession(minutes: mindfulMinutes)
                stopMindful()
            }
        }
    }

    private func stopMindful() {
        mindfulRunning = false
        showMindful = false
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
                    if let cap = model.healthCaption(for: habit) {
                        Text(cap)
                            .font(.caption2.weight(.bold))
                            .foregroundStyle(done ? Color.white.opacity(0.9) : HTTheme.gold)
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
                    if habit.title.lowercased().contains("mindful") {
                        Button("Start") {
                            showMindful = true
                        }
                        .font(.caption.weight(.bold))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(done ? Color.white.opacity(0.25) : Color.white)
                        .foregroundStyle(done ? Color.white : HTTheme.forest)
                        .clipShape(Capsule())
                        .buttonStyle(.plain)
                    }
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
        VStack(alignment: .leading, spacing: 10) {
            Button {
                model.victoriesExpanded.toggle()
            } label: {
                HStack {
                    Image(systemName: "sparkles").foregroundStyle(HTTheme.gold)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("3 victories").font(.headline).foregroundStyle(HTTheme.forest)
                        Text(filledWins == 0 ? "What did you do right today?" : "\(filledWins)/3 wins logged")
                            .font(.caption)
                            .foregroundStyle(HTTheme.muted)
                    }
                    Spacer()
                    Image(systemName: model.victoriesExpanded ? "chevron.up" : "chevron.down")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(HTTheme.muted)
                }
            }
            .buttonStyle(.plain)

            if model.victoriesExpanded {
                TextField("Win 1 — walked, hit protein, paused a craving", text: $model.win1)
                    .textFieldStyle(.roundedBorder)
                TextField("Win 2", text: $model.win2)
                    .textFieldStyle(.roundedBorder)
                TextField("Win 3", text: $model.win3)
                    .textFieldStyle(.roundedBorder)
                if let err = model.victoriesError {
                    Text(err).font(.caption).foregroundStyle(.red)
                }
                Button {
                    Task { await model.saveVictories() }
                } label: {
                    Text(model.victoriesSaving ? "Saving…" : model.victoriesSaved ? "Saved" : "Save victories")
                        .font(.subheadline.weight(.bold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(HTTheme.gold)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .disabled(model.victoriesSaving)
                .buttonStyle(.plain)
            }
        }
        .padding(16)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 24))
        .overlay(RoundedRectangle(cornerRadius: 24).stroke(HTTheme.roseBorder))
    }

    private var filledWins: Int {
        [model.win1, model.win2, model.win3].filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty }.count
    }
}
