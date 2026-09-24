import Foundation
import Observation
import SwiftUI

@MainActor
@Observable
final class FitnessViewModel {
    var dateStr = MountainDate.today()
    var logs: [FitnessLog] = []
    var videos: [WorkoutVideo] = []
    var tab = 0
    var name = ""
    var minutes = 10
    var category = "All"
    var errorMessage: String?
    private let auth: AuthStore
    private let health: HealthKitService
    var sessionEpoch: Int { auth.sessionEpoch }

    init(auth: AuthStore, health: HealthKitService) {
        self.auth = auth
        self.health = health
    }

    var healthWorkouts: [HealthKitService.HealthWorkout] = []

    struct Session: Identifiable {
        var id: String
        var name: String
        var minutes: Int
        var fromHealth: Bool
        var log: FitnessLog?
    }

    var sessions: [Session] {
        var used = Set<UUID>()
        var rows: [Session] = []
        for log in logs {
            if let match = healthWorkouts.first(where: { !used.contains($0.id) && abs($0.minutes - log.durationMinutes) <= 2 }) {
                used.insert(match.id)
                rows.append(Session(
                    id: "log-\(log.id)",
                    name: log.exerciseName,
                    minutes: log.durationMinutes,
                    fromHealth: match.fromWatch,
                    log: log
                ))
            } else {
                rows.append(Session(
                    id: "log-\(log.id)",
                    name: log.exerciseName,
                    minutes: log.durationMinutes,
                    fromHealth: false,
                    log: log
                ))
            }
        }
        for workout in healthWorkouts where !used.contains(workout.id) && !workout.fromThisApp {
            rows.append(Session(
                id: "hk-\(workout.id.uuidString)",
                name: workout.name,
                minutes: workout.minutes,
                fromHealth: true,
                log: nil
            ))
        }
        return rows
    }

    var minutesToday: Int { sessions.reduce(0) { $0 + $1.minutes } }

    var categories: [String] {
        ["All"] + Array(Set(videos.map { $0.category ?? "Workout" })).sorted()
    }

    var filteredVideos: [WorkoutVideo] {
        category == "All" ? videos : videos.filter { ($0.category ?? "Workout") == category }
    }

    func load() async {
        errorMessage = nil
        if auth.isSignedIn {
            logs = (try? await auth.client.query("fitness.getLogs", input: DateStrInput(dateStr: dateStr))) ?? []
        } else {
            logs = GuestLocalStore.loadFitness().filter { $0.dateStr == dateStr }
        }
        healthWorkouts = await health.workouts(on: dateStr)
        do {
            videos = try await auth.client.query("fitness.getVideos")
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func addQuick(name: String, minutes: Int) async {
        await add(name: name, minutes: minutes)
    }

    func add(name: String, minutes: Int) async {
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        if auth.isSignedIn {
            do {
                let _: SuccessFlag = try await auth.client.mutate(
                    "fitness.addLog",
                    input: FitnessAddInput(dateStr: dateStr, exerciseName: trimmed, durationMinutes: minutes)
                )
                await health.saveWorkout(named: trimmed, minutes: minutes, on: dateStr)
                await load()
            } catch {
                errorMessage = error.localizedDescription
            }
            return
        }
        var all = GuestLocalStore.loadFitness()
        all.insert(
            FitnessLog(
                id: Int(Date().timeIntervalSince1970),
                dateStr: dateStr,
                exerciseName: trimmed,
                sets: 1,
                reps: 0,
                weight: 0,
                durationMinutes: minutes
            ),
            at: 0
        )
        GuestLocalStore.saveFitness(all)
        logs = all.filter { $0.dateStr == dateStr }
        await health.saveWorkout(named: trimmed, minutes: minutes, on: dateStr)
    }

    func delete(_ log: FitnessLog) async {
        if auth.isSignedIn {
            struct Del: Encodable { let id: Int; let dateStr: String }
            _ = try? await auth.client.mutate("fitness.deleteLog", input: Del(id: log.id, dateStr: dateStr)) as SuccessFlag
            await load()
            return
        }
        let all = GuestLocalStore.loadFitness().filter { $0.id != log.id }
        GuestLocalStore.saveFitness(all)
        logs = all.filter { $0.dateStr == dateStr }
    }
}

struct FitnessView: View {
    @Bindable var model: FitnessViewModel
    @Bindable var auth: AuthStore

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Picker("", selection: $model.tab) {
                    Text("Log").tag(0)
                    Text("Videos").tag(1)
                }
                .pickerStyle(.segmented)
                .padding(12)

                if model.tab == 0 { logTab } else { videosTab }
            }
            .background(HTTheme.cream.ignoresSafeArea())
            .navigationTitle("Fitness")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    ProfileAvatarButton(auth: auth)
                }
            }
            .navigationDestination(for: WorkoutVideo.self) { video in
                WorkoutWatchView(video: video, model: model)
            }
            .task(id: model.sessionEpoch) { await model.load() }
            .refreshable { await model.load() }
        }
    }

    private var logTab: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    Button("←") { Task { model.dateStr = MountainDate.shift(model.dateStr, days: -1); await model.load() } }
                    Spacer()
                    Text(model.dateStr == MountainDate.today() ? "Today" : MountainDate.long(model.dateStr))
                        .font(.subheadline.weight(.semibold))
                    Spacer()
                    Button("→") { Task { model.dateStr = MountainDate.shift(model.dateStr, days: 1); await model.load() } }
                }
                .foregroundStyle(HTTheme.gold)

                Text("\(model.minutesToday) min today")
                    .font(HTTheme.title)
                    .foregroundStyle(HTTheme.forest)
                Text("Apple Watch workouts show up here. Logging in the app writes to Health only if Watch didn’t already record it.")
                    .font(.caption)
                    .foregroundStyle(HTTheme.muted)

                HStack {
                    chip("Walk 10m", 10)
                    chip("Walk 20m", 20)
                    chip("Strength", 20)
                    chip("Stretch", 10)
                }

                VStack(alignment: .leading, spacing: 10) {
                    TextField("What did you do?", text: $model.name)
                        .padding(10)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    HStack(spacing: 10) {
                        Button {
                            model.minutes = max(1, model.minutes - 5)
                        } label: {
                            Image(systemName: "minus.circle.fill")
                                .font(.title2)
                                .foregroundStyle(HTTheme.forest)
                        }
                        TextField("", value: $model.minutes, format: .number)
                            .keyboardType(.numberPad)
                            .multilineTextAlignment(.center)
                            .font(.headline)
                            .foregroundStyle(HTTheme.forest)
                            .padding(.vertical, 8)
                            .frame(width: 56)
                            .background(Color.white)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                            .overlay(RoundedRectangle(cornerRadius: 10).stroke(HTTheme.roseBorder))
                        Text("min")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(HTTheme.muted)
                        Button {
                            model.minutes = min(300, model.minutes + 5)
                        } label: {
                            Image(systemName: "plus.circle.fill")
                                .font(.title2)
                                .foregroundStyle(HTTheme.forest)
                        }
                        Spacer()
                        Button("Log") {
                            let mins = min(300, max(1, model.minutes))
                            model.minutes = mins
                            Task { await model.add(name: model.name, minutes: mins); model.name = "" }
                        }
                        .font(.headline)
                        .foregroundStyle(HTTheme.forest)
                    }
                }

                ForEach(model.sessions) { session in
                    HTCard {
                        HStack {
                            VStack(alignment: .leading) {
                                Text(session.name).font(.headline).foregroundStyle(HTTheme.forest)
                                Text(session.fromHealth ? "\(session.minutes) min · Apple Watch" : "\(session.minutes) min")
                                    .font(.caption)
                                    .foregroundStyle(HTTheme.muted)
                            }
                            Spacer()
                            if let log = session.log {
                                Button(role: .destructive) { Task { await model.delete(log) } } label: {
                                    Image(systemName: "trash")
                                }
                            }
                        }
                    }
                }
            }
            .padding(16)
        }
        .dockScrollClearance()
    }

    private func chip(_ label: String, _ minutes: Int) -> some View {
        Button(label) { Task { await model.addQuick(name: label, minutes: minutes) } }
            .font(.caption.weight(.bold))
            .padding(.horizontal, 10)
            .padding(.vertical, 8)
            .background(Color.white)
            .foregroundStyle(HTTheme.forest)
            .clipShape(Capsule())
            .overlay(Capsule().stroke(HTTheme.roseBorder))
    }

    private var videosTab: some View {
        VStack(spacing: 0) {
            if model.categories.count > 1 {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack {
                        ForEach(model.categories, id: \.self) { cat in
                            Button(cat) { model.category = cat }
                                .font(.caption.weight(.bold))
                                .padding(.horizontal, 12)
                                .padding(.vertical, 8)
                                .background(model.category == cat ? HTTheme.forest : Color.white)
                                .foregroundStyle(model.category == cat ? Color.white : HTTheme.forest)
                                .clipShape(Capsule())
                        }
                    }
                    .padding(12)
                }
            }
            ScrollView {
                if let err = model.errorMessage {
                    Text(err).font(.caption).foregroundStyle(.red).padding(16)
                } else if model.filteredVideos.isEmpty {
                    Text("No videos yet. Pull to refresh.")
                        .font(.subheadline)
                        .foregroundStyle(HTTheme.muted)
                        .padding(16)
                }
                LazyVStack(alignment: .leading, spacing: 12) {
                    ForEach(model.filteredVideos) { video in
                        NavigationLink(value: video) {
                            videoCard(video)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 16)
            }
            .dockScrollClearance()
        }
    }

    private func videoCard(_ video: WorkoutVideo) -> some View {
        let vid = YouTubeID.parse(video.videoUrl)
        let moves = video.intervals.count
        return VStack(alignment: .leading, spacing: 0) {
            ZStack(alignment: .topLeading) {
                Group {
                    if let vid {
                        AsyncImage(url: YouTubeID.thumbURL(vid)) { phase in
                            if case .success(let img) = phase {
                                img.resizable().scaledToFill()
                            } else {
                                HTTheme.roseBorder
                            }
                        }
                    } else {
                        HTTheme.roseBorder
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: 180)
                .clipped()

                Image(systemName: "play.circle.fill")
                    .font(.system(size: 52))
                    .foregroundStyle(.white)
                    .shadow(radius: 8)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)

                Text((video.category ?? "Workout").uppercased())
                    .font(.caption2.weight(.bold))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(.white.opacity(0.92))
                    .foregroundStyle(HTTheme.forest)
                    .clipShape(Capsule())
                    .padding(10)

                if moves > 0 {
                    Text("\(moves) moves")
                        .font(.caption2.weight(.bold))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(HTTheme.gold)
                        .foregroundStyle(.white)
                        .clipShape(Capsule())
                        .frame(maxWidth: .infinity, alignment: .trailing)
                        .padding(10)
                }
            }
            VStack(alignment: .leading, spacing: 4) {
                Text(video.title).font(.headline).foregroundStyle(HTTheme.forest)
                if let d = video.description, !d.isEmpty {
                    Text(d).font(.caption).foregroundStyle(HTTheme.muted).lineLimit(2)
                }
            }
            .padding(12)
        }
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).stroke(HTTheme.roseBorder))
    }
}

struct WorkoutWatchView: View {
    let video: WorkoutVideo
    @Bindable var model: FitnessViewModel
    @State private var startSeconds = 0
    @State private var activeIndex = 0
    @State private var remaining = 0
    @State private var running = false
    @State private var logged = false

    private var intervals: [WorkoutInterval] { video.intervals }
    private var videoId: String? { YouTubeID.parse(video.videoUrl) }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                if let vid = videoId {
                    YouTubeEmbed(videoId: vid, startSeconds: startSeconds)
                        .frame(height: 210)
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                }

                if !intervals.isEmpty {
                    timerCard
                    Text("Lee Anne’s timestamps")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(HTTheme.muted)
                    ForEach(Array(intervals.enumerated()), id: \.element.id) { i, inv in
                        Button {
                            jump(to: i, startTimer: true)
                        } label: {
                            HStack {
                                Text(inv.startLabel)
                                    .font(.caption.weight(.bold).monospacedDigit())
                                    .foregroundStyle(HTTheme.gold)
                                    .frame(width: 44, alignment: .leading)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(inv.title).font(.subheadline.weight(.semibold)).foregroundStyle(HTTheme.forest)
                                    if let d = inv.description, !d.isEmpty {
                                        Text(d).font(.caption).foregroundStyle(HTTheme.muted)
                                    }
                                }
                                Spacer()
                                if i == activeIndex {
                                    Image(systemName: "play.fill").font(.caption).foregroundStyle(HTTheme.gold)
                                }
                            }
                            .padding(10)
                            .background(i == activeIndex ? HTTheme.cream : Color.white)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                        .buttonStyle(.plain)
                    }
                }

                if let d = video.description, !d.isEmpty {
                    Text(d).font(.subheadline).foregroundStyle(HTTheme.muted)
                }

                Button {
                    Task { await markComplete() }
                } label: {
                    Text(logged ? "Logged" : "Mark complete")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(HTTheme.forest)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                }
                .disabled(logged)
                .buttonStyle(.plain)
            }
            .padding(16)
            .padding(.bottom, HTTheme.dockClearance)
        }
        .dockScrollClearance()
        .background(HTTheme.cream.ignoresSafeArea())
        .navigationTitle(video.title)
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            if let first = intervals.first {
                remaining = first.durationSeconds
            }
        }
        .onReceive(Timer.publish(every: 1, on: .main, in: .common).autoconnect()) { _ in
            guard running, remaining > 0 else { return }
            remaining -= 1
            if remaining == 0 {
                if activeIndex + 1 < intervals.count {
                    jump(to: activeIndex + 1, startTimer: true)
                } else {
                    running = false
                }
            }
        }
    }

    private var timerCard: some View {
        VStack(spacing: 8) {
            if let current = intervals[safe: activeIndex] {
                Text(current.title.uppercased())
                    .font(.caption2.weight(.bold))
                    .foregroundStyle(HTTheme.gold)
                Text(clock(remaining))
                    .font(.system(size: 48, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(HTTheme.forest)
                if let next = intervals[safe: activeIndex + 1] {
                    Text("Next: \(next.title)")
                        .font(.caption)
                        .foregroundStyle(HTTheme.muted)
                }
                Button(running ? "Pause" : "Start") {
                    running.toggle()
                    if running { startSeconds = current.startSeconds }
                }
                .font(.subheadline.weight(.bold))
                .foregroundStyle(HTTheme.forest)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(16)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
    }

    private func jump(to index: Int, startTimer: Bool) {
        guard intervals.indices.contains(index) else { return }
        activeIndex = index
        remaining = intervals[index].durationSeconds
        startSeconds = intervals[index].startSeconds
        running = startTimer
    }

    private func clock(_ secs: Int) -> String {
        String(format: "%d:%02d", secs / 60, secs % 60)
    }

    private func markComplete() async {
        let mins: Int
        if let last = intervals.last {
            mins = max(1, Int((last.endTime + 59) / 60))
        } else {
            mins = 20
        }
        await model.add(name: video.title, minutes: mins)
        logged = true
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
