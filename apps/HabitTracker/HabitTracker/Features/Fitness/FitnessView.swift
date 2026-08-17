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
    var sessionEpoch: Int { auth.sessionEpoch }

    init(auth: AuthStore) { self.auth = auth }

    var minutesToday: Int { logs.reduce(0) { $0 + $1.durationMinutes } }

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
    }

    func delete(_ log: FitnessLog) async {
        if auth.isSignedIn {
            struct Del: Encodable { let id: Int; let dateStr: String }
            _ = try? await auth.client.mutate("fitness.deleteLog", input: Del(id: log.id, dateStr: dateStr)) as SuccessFlag
            await load()
            return
        }
        var all = GuestLocalStore.loadFitness().filter { $0.id != log.id }
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
                    Text(model.dateStr == MountainDate.today() ? "Today" : model.dateStr)
                        .font(.subheadline.weight(.semibold))
                    Spacer()
                    Button("→") { Task { model.dateStr = MountainDate.shift(model.dateStr, days: 1); await model.load() } }
                }
                .foregroundStyle(HTTheme.gold)

                Text("\(model.minutesToday) min today")
                    .font(HTTheme.serif)
                    .foregroundStyle(HTTheme.forest)

                HStack {
                    chip("Walk 10m", 10)
                    chip("Walk 20m", 20)
                    chip("Strength", 20)
                    chip("Stretch", 10)
                }

                HStack {
                    TextField("What did you do?", text: $model.name)
                        .padding(10)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    Stepper("\(model.minutes)m", value: $model.minutes, in: 5...120, step: 5)
                    Button("Log") { Task { await model.add(name: model.name, minutes: model.minutes); model.name = "" } }
                        .font(.headline)
                        .foregroundStyle(HTTheme.forest)
                }

                ForEach(model.logs) { log in
                    HTCard {
                        HStack {
                            VStack(alignment: .leading) {
                                Text(log.exerciseName).font(.headline).foregroundStyle(HTTheme.forest)
                                Text("\(log.durationMinutes) min").font(.caption).foregroundStyle(HTTheme.muted)
                            }
                            Spacer()
                            Button(role: .destructive) { Task { await model.delete(log) } } label: {
                                Image(systemName: "trash")
                            }
                        }
                    }
                }
            }
            .padding(16)
        }
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
                LazyVStack(alignment: .leading, spacing: 10) {
                    ForEach(model.filteredVideos) { video in
                        Link(destination: URL(string: video.videoUrl) ?? AppConfig.apiRoot) {
                            HTCard {
                                Text((video.category ?? "Workout").uppercased()).font(.caption2.weight(.bold)).foregroundStyle(HTTheme.gold)
                                Text(video.title).foregroundStyle(HTTheme.forest)
                                if let d = video.description { Text(d).font(.caption).foregroundStyle(HTTheme.muted).lineLimit(2) }
                            }
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 16)
            }
        }
    }
}
