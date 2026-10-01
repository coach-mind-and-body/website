import SwiftUI

/// Daily challenge: week rail, 16:9 session, one job, note + resources in sheets.
struct ChallengeExperience: View {
    @Bindable var model: HabitsViewModel
    @Binding var inAppURL: IdentifiedURL?
    @State private var showJournal = false
    @State private var showResources = false
    @Environment(\.openURL) private var openURL

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                header
                weekRail
                session
                job
                accessoryList
            }
            .padding(.horizontal, 20)
            .padding(.top, 4)
            .padding(.bottom, 28)
        }
        .sensoryFeedback(.selection, trigger: model.selectedChallengeDate)
        .sheet(isPresented: $showJournal) { journalSheet }
        .sheet(isPresented: $showResources) { resourcesSheet }
    }

    private var payload: ChallengeTodayPayload? { model.todayChallenge }

    private var week: [ChallengeWeekDay] {
        payload?.week ?? []
    }

    private var day: ChallengeWeekDay? {
        model.selectedChallengeDay ?? week.first { $0.isToday == true } ?? week.first
    }

    private var guides: ChallengeGuides? { payload?.guides }

    private var jobHeading: String {
        guard let day else { return "Today’s job" }
        if day.isToday == true { return "Today’s job" }
        return "Day \(day.n) job"
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(payload?.title ?? "The 5-Day No Processed Food Challenge")
                .font(.caption.weight(.bold))
                .foregroundStyle(HTTheme.gold)
                .textCase(.uppercase)
                .tracking(0.8)
            if let day {
                Text("Day \(day.n) of 5")
                    .font(HTTheme.serif)
                    .foregroundStyle(HTTheme.forest)
                    .minimumScaleFactor(0.8)
                    .lineLimit(1)
                Text(day.title)
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(HTTheme.forest)
                Text(day.win)
                    .font(.subheadline)
                    .foregroundStyle(HTTheme.muted)
                    .fixedSize(horizontal: false, vertical: true)
            } else if payload?.beforeStart == true {
                Text("You’re in")
                    .font(HTTheme.serif)
                    .foregroundStyle(HTTheme.forest)
                Text("We start September 28. Lives Mon/Wed/Fri at \(payload?.liveTime ?? "1:00 pm Mountain").")
                    .font(.subheadline)
                    .foregroundStyle(HTTheme.muted)
            } else if payload?.afterEnd == true {
                Text("Five days in")
                    .font(HTTheme.serif)
                    .foregroundStyle(HTTheme.forest)
                Text("Your journal and replays stay here.")
                    .font(.subheadline)
                    .foregroundStyle(HTTheme.muted)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var weekRail: some View {
        VStack(spacing: 10) {
            HStack(spacing: 0) {
                ForEach(week) { d in
                    Text(d.shortLabel)
                        .font(.caption2.weight(.bold))
                        .foregroundStyle(d.isToday == true ? HTTheme.forest : HTTheme.muted)
                        .frame(maxWidth: .infinity)
                }
            }
            ZStack {
                GeometryReader { geo in
                    let n = CGFloat(max(week.count, 1))
                    let step = geo.size.width / n
                    Capsule()
                        .fill(HTTheme.roseBorder)
                        .frame(height: 3)
                        .padding(.horizontal, step / 2)
                        .offset(y: 18)
                    let reached = week.lastIndex(where: { $0.done == true || $0.isToday == true }) ?? 0
                    Capsule()
                        .fill(HTTheme.gold)
                        .frame(width: max(0, step * CGFloat(reached)), height: 3)
                        .padding(.leading, step / 2)
                        .offset(y: 18)
                }
                HStack(spacing: 0) {
                    ForEach(week) { d in
                        Button {
                            withAnimation(.snappy(duration: 0.28)) {
                                model.selectChallengeDay(d.dateStr)
                            }
                        } label: {
                            ZStack {
                                Circle()
                                    .fill(railFill(d))
                                    .frame(width: 38, height: 38)
                                    .shadow(
                                        color: d.isToday == true && d.done != true
                                            ? HTTheme.forest.opacity(0.28)
                                            : .clear,
                                        radius: 6,
                                        y: 2
                                    )
                                if d.done == true {
                                    Image(systemName: "checkmark")
                                        .font(.system(size: 13, weight: .bold))
                                        .foregroundStyle(railFg(d))
                                } else {
                                    Text("\(d.n)")
                                        .font(.subheadline.weight(.bold))
                                        .foregroundStyle(railFg(d))
                                }
                            }
                            .overlay {
                                if d.dateStr == model.selectedChallengeDate {
                                    Circle()
                                        .stroke(HTTheme.forest, lineWidth: 2)
                                        .frame(width: 46, height: 46)
                                }
                            }
                            .frame(width: 46, height: 46)
                            .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel(railA11y(d))
                        .accessibilityAddTraits(d.dateStr == model.selectedChallengeDate ? .isSelected : [])
                    }
                }
            }
            .frame(height: 46)
        }
        .padding(.vertical, 4)
    }

    private func railA11y(_ d: ChallengeWeekDay) -> String {
        var parts = ["Day \(d.n)", d.weekday]
        if d.isToday == true { parts.append("today") }
        if d.done == true { parts.append("done") }
        if d.dateStr == model.selectedChallengeDate { parts.append("selected") }
        return parts.joined(separator: ", ")
    }

    private func railFill(_ d: ChallengeWeekDay) -> Color {
        if d.done == true { return HTTheme.gold }
        if d.isToday == true { return HTTheme.forest }
        return Color.white
    }

    private func railFg(_ d: ChallengeWeekDay) -> Color {
        if d.done == true || d.isToday == true { return .white }
        return HTTheme.muted
    }

    @ViewBuilder
    private var session: some View {
        let live = day?.liveOpen == true
        let meet = day?.meetUrl ?? payload?.meetUrl
        let embed = day?.replayEmbedUrl ?? payload?.replayEmbedUrl
        let watch = day?.videoUrl ?? payload?.videoUrl

        VStack(alignment: .leading, spacing: 10) {
            ZStack {
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .fill(Color.black)

                if let embed, let embedUrl = URL(string: embed) {
                    Group {
                        if let vid = YouTubeID.parse(watch) ?? YouTubeID.parse(embed) {
                            YouTubeEmbed(videoId: vid)
                        } else {
                            ReplayWebView(url: embedUrl)
                        }
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if live, let meet, let url = URL(string: meet) {
                    Button {
                        openURL(url)
                    } label: {
                        livePoster(title: "Join live", subtitle: payload?.liveTime ?? "1:00 pm Mountain")
                    }
                    .buttonStyle(.plain)
                } else {
                    emptyPoster
                }
            }
            .aspectRatio(16 / 9, contentMode: .fit)
            .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .stroke(HTTheme.roseBorder, lineWidth: 1)
            )
            .shadow(color: HTTheme.forest.opacity(0.08), radius: 16, y: 8)

            HStack(alignment: .center, spacing: 8) {
                if live {
                    Circle()
                        .fill(Color.green)
                        .frame(width: 7, height: 7)
                }
                Text(sessionCaption(live: live, hasVideo: watch != nil || embed != nil))
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(HTTheme.muted)
                Spacer()
                if let watch, let url = URL(string: watch), !live {
                    Button("Full screen") { inAppURL = IdentifiedURL(url: url) }
                        .font(.caption.weight(.bold))
                        .foregroundStyle(HTTheme.forest)
                }
            }
        }
    }

    private func livePoster(title: String, subtitle: String) -> some View {
        VStack(spacing: 10) {
            Image(systemName: "play.circle.fill")
                .font(.system(size: 58))
                .foregroundStyle(.white)
                .symbolRenderingMode(.hierarchical)
            Text(title)
                .font(.title2.weight(.bold))
                .foregroundStyle(.white)
            Text(subtitle)
                .font(.caption.weight(.semibold))
                .foregroundStyle(.white.opacity(0.82))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(
            LinearGradient(
                colors: [HTTheme.forest, HTTheme.forest.opacity(0.78)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
    }

    private var emptyPoster: some View {
        VStack(spacing: 8) {
            Image(systemName: "video")
                .font(.system(size: 28, weight: .semibold))
                .foregroundStyle(.white.opacity(0.7))
            Text(emptySessionCopy)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.white.opacity(0.92))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(HTTheme.forest.opacity(0.94))
    }

    private var emptySessionCopy: String {
        if day?.format == "live" {
            if day?.isFuture == true {
                return "Live \(day?.weekday ?? "this day") at 1:00 pm Mountain"
            }
            return "Replay posts here after the 1:00 pm call"
        }
        return "Lesson video posts here"
    }

    private func sessionCaption(live: Bool, hasVideo: Bool) -> String {
        if live { return "Live now · Google Meet" }
        if hasVideo {
            return day?.format == "live" ? "Live replay" : "Lesson"
        }
        return day?.formatLabel ?? ""
    }

    private var job: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(jobHeading)
                .font(.caption.weight(.bold))
                .foregroundStyle(HTTheme.gold)
                .textCase(.uppercase)
                .tracking(0.6)
            if let title = day?.assignmentTitle ?? payload?.today?.assignmentTitle {
                Text(title)
                    .font(.headline)
                    .foregroundStyle(HTTheme.forest)
            }
            let steps = day?.assignmentSteps ?? payload?.today?.assignmentSteps ?? []
            if !steps.isEmpty {
                VStack(alignment: .leading, spacing: 10) {
                    ForEach(Array(steps.enumerated()), id: \.offset) { i, step in
                        HStack(alignment: .top, spacing: 10) {
                            Text("\(i + 1)")
                                .font(.caption.weight(.bold))
                                .foregroundStyle(.white)
                                .frame(width: 20, height: 20)
                                .background(HTTheme.gold.opacity(0.95))
                                .clipShape(Circle())
                            Text(step)
                                .font(.subheadline)
                                .foregroundStyle(HTTheme.muted)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                }
            }
            if day?.n == 2, let flip = guides?.flipIt {
                flipItBlock(flip)
            }
            if day?.n == 4, let plate = guides?.plate {
                plateBlock(plate)
            }
            Button {
                Task { await model.toggleTodayChallenge() }
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: day?.done == true ? "checkmark.circle.fill" : "circle")
                        .font(.body.weight(.semibold))
                    Text(day?.done == true ? "Done" : "Mark job done")
                        .font(.subheadline.weight(.bold))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 15)
                .background(day?.done == true ? Color.clear : HTTheme.gold)
                .foregroundStyle(day?.done == true ? HTTheme.gold : Color.white)
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(HTTheme.gold, lineWidth: 1.5)
                )
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            }
            .buttonStyle(.plain)
            .disabled(day?.isFuture == true)
            .opacity(day?.isFuture == true ? 0.45 : 1)
            Text("Logging a meal in Macros also counts.")
                .font(.caption)
                .foregroundStyle(HTTheme.muted)
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .stroke(HTTheme.roseBorder)
        )
    }

    private func flipItBlock(_ flip: ChallengeFlipIt) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            if let headline = flip.headline {
                Text(headline)
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(HTTheme.forest)
            }
            if let mantra = flip.mantra {
                Text(mantra)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(HTTheme.gold)
            }
            if let checks = flip.checks, !checks.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    ForEach(Array(checks.enumerated()), id: \.offset) { i, check in
                        HStack(alignment: .top, spacing: 8) {
                            Text("\(i + 1).")
                                .font(.caption.weight(.bold))
                                .foregroundStyle(HTTheme.gold)
                                .frame(width: 18, alignment: .leading)
                            Text(check)
                                .font(.caption)
                                .foregroundStyle(HTTheme.muted)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                }
            }
            if let rows = flip.compareRows, !rows.isEmpty {
                Text("Look at")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(HTTheme.forest)
                    .padding(.top, 4)
                Text(rows.joined(separator: "  ·  "))
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(HTTheme.muted)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(.top, 4)
    }

    private func plateBlock(_ plate: ChallengePlate) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            plateLine("Protein", plate.protein)
            plateLine("Fat", plate.fat)
            plateLine("Fiber", plate.fiber)
            if let note = plate.carbsNote {
                Text(note)
                    .font(.caption)
                    .foregroundStyle(HTTheme.muted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            if let note = plate.unicityNote {
                Text(note)
                    .font(.caption)
                    .foregroundStyle(HTTheme.muted)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(.top, 4)
    }

    @ViewBuilder
    private func plateLine(_ label: String, _ value: String?) -> some View {
        if let value {
            (Text("\(label): ").font(.caption.weight(.bold)) + Text(value).font(.caption))
                .foregroundStyle(HTTheme.muted)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var accessoryList: some View {
        VStack(spacing: 0) {
            accessoryRow(
                icon: "square.and.pencil",
                title: "Daily note",
                subtitle: model.challengeJournalHasText ? "Saved for this day" : "What did you notice?",
                done: model.challengeJournalHasText
            ) { showJournal = true }
            Rectangle()
                .fill(HTTheme.roseBorder)
                .frame(height: 1)
                .padding(.leading, 56)
            accessoryRow(
                icon: "fork.knife",
                title: "Meal plan & recipes",
                subtitle: "Shopping list, recipes, what to eat",
                done: false
            ) { showResources = true }
        }
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .stroke(HTTheme.roseBorder)
        )
    }

    private func accessoryRow(
        icon: String,
        title: String,
        subtitle: String,
        done: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.body.weight(.semibold))
                    .foregroundStyle(HTTheme.forest)
                    .frame(width: 28)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(HTTheme.forest)
                    Text(subtitle)
                        .font(.caption)
                        .foregroundStyle(HTTheme.muted)
                }
                Spacer()
                if done {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(HTTheme.gold)
                }
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(HTTheme.muted)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 16)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private var journalSheet: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    Text("Three prompts. Write what you actually noticed.")
                        .font(.subheadline)
                        .foregroundStyle(HTTheme.muted)
                    journalField(
                        prompt: day?.prompts?.noticed ?? payload?.today?.journal?.noticed ?? "What did you notice today?",
                        text: $model.journalNoticed
                    )
                    journalField(
                        prompt: day?.prompts?.glad ?? payload?.today?.journal?.glad ?? "One choice you’re glad you made",
                        text: $model.journalGlad
                    )
                    journalField(
                        prompt: day?.prompts?.hard ?? payload?.today?.journal?.hard ?? "One thing that was hard",
                        text: $model.journalHard
                    )
                }
                .padding(20)
            }
            .background(HTTheme.cream.ignoresSafeArea())
            .navigationTitle("Daily note")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { showJournal = false }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(model.journalSaving ? "Saving…" : "Save") {
                        Task {
                            await model.saveTodayJournal()
                            showJournal = false
                        }
                    }
                    .fontWeight(.bold)
                    .disabled(model.journalSaving)
                }
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }

    private func journalField(prompt: String, text: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(prompt)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(HTTheme.forest)
                .fixedSize(horizontal: false, vertical: true)
            TextField("Write here", text: text, axis: .vertical)
                .lineLimit(4...10)
                .padding(14)
                .background(Color.white)
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(HTTheme.roseBorder)
                )
        }
    }

    private var resourcesSheet: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    pdfsSection
                    mealPlanSection
                    combosSection
                    whatToEatSection
                    levelsSection
                }
                .padding(20)
            }
            .background(HTTheme.cream.ignoresSafeArea())
            .navigationTitle("Meal plan & recipes")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { showResources = false }
                }
            }
        }
        .presentationDragIndicator(.visible)
    }

    @ViewBuilder
    private var pdfsSection: some View {
        let docs = (payload?.documents ?? []).filter { !$0.title.localizedCaseInsensitiveContains("replay") }
        if !docs.isEmpty {
            VStack(alignment: .leading, spacing: 10) {
                sectionLabel("Guides")
                ForEach(docs) { doc in
                    if let url = URL(string: doc.url) {
                        Button {
                            inAppURL = IdentifiedURL(url: url)
                        } label: {
                            HStack(spacing: 12) {
                                Image(systemName: "doc.text.fill")
                                    .foregroundStyle(HTTheme.gold)
                                Text(doc.title)
                                    .font(.subheadline.weight(.bold))
                                    .foregroundStyle(HTTheme.forest)
                                    .multilineTextAlignment(.leading)
                                Spacer()
                                Image(systemName: "arrow.up.right")
                                    .font(.caption.weight(.bold))
                                    .foregroundStyle(HTTheme.muted)
                            }
                            .padding(16)
                            .background(Color.white)
                            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    @ViewBuilder
    private var mealPlanSection: some View {
        if let rows = guides?.mealPlan, !rows.isEmpty {
            VStack(alignment: .leading, spacing: 10) {
                sectionLabel("This week’s plates")
                ForEach(rows) { row in
                    VStack(alignment: .leading, spacing: 6) {
                        Text(row.weekday)
                            .font(.subheadline.weight(.bold))
                            .foregroundStyle(HTTheme.forest)
                        mealLine("Breakfast", row.breakfast)
                        mealLine("Snack", row.snack)
                        mealLine("Lunch", row.lunch)
                        mealLine("Dinner", row.dinner)
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                }
            }
        }
    }

    @ViewBuilder
    private func mealLine(_ label: String, _ value: String?) -> some View {
        if let value, !value.isEmpty {
            (Text("\(label): ").font(.caption.weight(.bold)) + Text(value).font(.caption))
                .foregroundStyle(HTTheme.muted)
        }
    }

    @ViewBuilder
    private var combosSection: some View {
        if !comboGroups.isEmpty {
            VStack(alignment: .leading, spacing: 10) {
                sectionLabel("Build-it combos")
                ForEach(comboGroups, id: \.title) { group in
                    VStack(alignment: .leading, spacing: 6) {
                        Text(group.title)
                            .font(.subheadline.weight(.bold))
                            .foregroundStyle(HTTheme.forest)
                        ForEach(group.items, id: \.self) { item in
                            Text(item)
                                .font(.caption)
                                .foregroundStyle(HTTheme.muted)
                        }
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                }
            }
        }
    }

    private var comboGroups: [(title: String, items: [String])] {
        guard let combos = guides?.plate?.combos else { return [] }
        return [
            ("Breakfast", combos.breakfast ?? []),
            ("Lunch", combos.lunch ?? []),
            ("Dinner", combos.dinner ?? []),
            ("Snacks", combos.snacks ?? []),
        ]
        .filter { !$0.1.isEmpty }
        .map { (title: $0.0, items: $0.1) }
    }

    @ViewBuilder
    private var whatToEatSection: some View {
        if let images = payload?.guideImages, !images.isEmpty {
            VStack(alignment: .leading, spacing: 10) {
                sectionLabel("What to eat")
                ForEach(images) { img in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(img.title)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(HTTheme.forest)
                        AsyncImage(url: URL(string: img.url)) { phase in
                            if case .success(let image) = phase {
                                image.resizable().scaledToFit()
                            } else {
                                HTTheme.roseBorder.frame(height: 160)
                            }
                        }
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    }
                }
            }
        }
    }

    @ViewBuilder
    private var levelsSection: some View {
        if let levels = guides?.levels, !levels.isEmpty {
            VStack(alignment: .leading, spacing: 10) {
                sectionLabel("How processed")
                ForEach(levels) { row in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(row.type)
                            .font(.subheadline.weight(.bold))
                            .foregroundStyle(HTTheme.forest)
                        if let d = row.description {
                            Text(d)
                                .font(.caption)
                                .foregroundStyle(HTTheme.muted)
                        }
                        if let e = row.examples {
                            Text(e)
                                .font(.caption)
                                .foregroundStyle(HTTheme.muted)
                        }
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                }
            }
        }
    }

    private func sectionLabel(_ title: String) -> some View {
        Text(title)
            .font(.caption.weight(.bold))
            .foregroundStyle(HTTheme.gold)
            .textCase(.uppercase)
            .tracking(0.6)
    }
}
