import Foundation
import Observation
import SwiftUI

@MainActor
@Observable
final class PodcastViewModel {
    var episodes: [PodcastEpisode] = []
    var selected: PodcastEpisode?
    var isLoading = false
    var errorMessage: String?
    var page = 1
    private let pageSize = 8

    var visibleEpisodes: [PodcastEpisode] {
        Array(episodes.prefix(page * pageSize))
    }

    var canShowMore: Bool {
        visibleEpisodes.count < episodes.count
    }

    var remainingCount: Int {
        max(0, episodes.count - visibleEpisodes.count)
    }
    private let auth: AuthStore
    var sessionEpoch: Int { auth.sessionEpoch }

    init(auth: AuthStore) { self.auth = auth }

    func load() async {
        if Task.isCancelled { return }
        isLoading = episodes.isEmpty
        defer { isLoading = false }
        do {
            let payload: PodcastPayload = try await auth.client.query("podcast.getEpisodes")
            guard !Task.isCancelled else { return }
            episodes = payload.episodes
            if selected == nil { selected = episodes.first }
            if page < 1 { page = 1 }
            errorMessage = nil
        } catch {
            if error.isCancellation { return }
            errorMessage = error.localizedDescription
        }
    }

    func actions(for episode: PodcastEpisode) -> [HabitAction] {
        guard let raw = episode.habitActionsJson, let data = raw.data(using: .utf8) else { return [] }
        return (try? JSONDecoder().decode([HabitAction].self, from: data)) ?? []
    }

    func addHabit(_ action: HabitAction) async {
        if auth.isSignedIn {
            _ = try? await auth.client.mutate(
                "habit.syncHabit",
                input: SyncHabitInput(
                    title: action.title,
                    description: action.description,
                    type: action.type ?? "boolean",
                    targetValue: action.targetValue,
                    unit: action.unit,
                    order: 99,
                    isActive: true
                )
            ) as SuccessFlag
        } else {
            var habits = GuestLocalStore.loadHabits()
            habits.append(
                Habit(
                    id: Int(Date().timeIntervalSince1970),
                    title: action.title,
                    description: action.description,
                    type: action.type ?? "boolean",
                    targetValue: action.targetValue,
                    unit: action.unit,
                    isActive: true
                )
            )
            GuestLocalStore.saveHabits(habits)
        }
    }
}

struct PodcastView: View {
    @Bindable var model: PodcastViewModel
    @Bindable var auth: AuthStore
    @State private var playback = YouTubeHold()
    @State private var showNotes = false
    @Environment(\.duoPosture) private var posture

    var body: some View {
        NavigationStack {
            DuoPanes(style: .split) {
                VStack(alignment: .leading, spacing: 14) {
                    if posture != .tabletop {
                    Text("Lee Anne’s Mind and Body Reset — listen on YouTube, then add a habit from the episode.")
                        .font(.subheadline)
                        .foregroundStyle(HTTheme.muted)
                    HStack {
                        Link("YouTube channel", destination: URL(string: "https://www.youtube.com/@MindandBodyResetCoach")!)
                        Link("Full playlist", destination: URL(string: "https://www.youtube.com/playlist?list=PL7rk7dm4oyzKumv4UU53xInS8sNof9q7H")!)
                    }
                    .font(.caption.weight(.bold))
                    .foregroundStyle(HTTheme.gold)

                    if model.isLoading { ProgressView().frame(maxWidth: .infinity) }
                    if let err = model.errorMessage {
                        Text(err).font(.caption).foregroundStyle(.red)
                        Button("Try again") { Task { await model.load() } }
                            .font(.caption.weight(.bold))
                            .foregroundStyle(HTTheme.gold)
                    } else if !model.isLoading && model.episodes.isEmpty {
                        Text("No episodes yet. Pull to refresh.")
                            .font(.subheadline)
                            .foregroundStyle(HTTheme.muted)
                    }
                    }

                    if let ep = model.selected {
                        if let vid = YouTubeID.parse(ep.videoId) ?? YouTubeID.parse(ep.id) {
                            if posture == .tabletop {
                                YouTubeEmbed(videoId: vid, hold: playback)
                                    .duoStage()
                                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                            } else {
                                YouTubePlayer(videoId: vid, hold: playback)
                            }
                        } else {
                            AsyncImage(url: ep.thumbnail.flatMap(URL.init(string:))) { phase in
                                if case .success(let img) = phase { img.resizable().scaledToFill() }
                                else { HTTheme.roseBorder }
                            }
                            .duoStage()
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                        }

                        Text(ep.title).font(.headline).foregroundStyle(HTTheme.forest)
                        if let d = ep.publishedAt, !d.isEmpty {
                            Text(MountainDate.long(d)).font(.caption).foregroundStyle(HTTheme.muted)
                        }
                        if posture != .tabletop {
                        if let d = ep.description, !d.isEmpty {
                            Text(d).font(.caption).foregroundStyle(HTTheme.muted).lineLimit(4)
                        }
                        episodeHabits(ep)
                        }
                    }
                }
                .padding(16)
            } controls: {
                VStack(alignment: .leading, spacing: 0) {
                    if posture != .compact {
                        podcastTransport
                            .padding(.bottom, 8)
                    }
                    if posture == .tabletop, let ep = model.selected {
                        episodeHabits(ep)
                            .padding(.bottom, 8)
                        if let d = ep.description, !d.isEmpty {
                            Button(showNotes ? "Hide description" : "Description") {
                                showNotes.toggle()
                            }
                            .font(.subheadline.weight(.bold))
                            .foregroundStyle(HTTheme.forest)
                            if showNotes {
                                Text(d)
                                    .font(.caption)
                                    .foregroundStyle(HTTheme.muted)
                            }
                        }
                    }
                    Group {
                        if posture == .tabletop {
                            ScrollView { episodeList }
                                .frame(maxHeight: .infinity)
                                .safeAreaPadding(.bottom)
                        } else {
                            episodeList
                        }
                    }
                }
                .padding(16)
                .onChange(of: model.selected?.id) { _, _ in showNotes = false }
            }
            .dockScrollClearance()
            .keyboardTyping()
            .background(HTTheme.cream.ignoresSafeArea())
            .navigationTitle("Podcast")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    ProfileAvatarButton(auth: auth)
                }
            }
            .task(id: model.sessionEpoch) {
                await model.load()
                if model.episodes.isEmpty {
                    try? await Task.sleep(for: .milliseconds(400))
                    await model.load()
                }
            }
            .refreshable { await model.load() }
        }
    }

    private var episodeList: some View {
        VStack(alignment: .leading, spacing: 14) {
            ForEach(model.visibleEpisodes) { ep in
                Button {
                    model.selected = ep
                } label: {
                    HStack(alignment: .top, spacing: 10) {
                        AsyncImage(url: ep.thumbnail.flatMap(URL.init(string:))) { phase in
                            if case .success(let img) = phase { img.resizable().scaledToFill() }
                            else { HTTheme.roseBorder }
                        }
                        .frame(width: 72, height: 54)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        VStack(alignment: .leading) {
                            Text(ep.title).font(.subheadline.weight(.semibold)).foregroundStyle(HTTheme.forest).multilineTextAlignment(.leading)
                            if let d = ep.publishedAt, !d.isEmpty {
                                Text(MountainDate.long(d)).font(.caption).foregroundStyle(HTTheme.muted)
                            }
                        }
                        Spacer()
                    }
                }
            }
            if model.canShowMore {
                Button {
                    model.page += 1
                } label: {
                    Text("Show more (\(model.remainingCount) left)")
                        .font(.subheadline.weight(.bold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(Color.white)
                        .foregroundStyle(HTTheme.forest)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(HTTheme.roseBorder))
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func episodeHabits(_ ep: PodcastEpisode) -> some View {
        let actions = model.actions(for: ep)
        return VStack(alignment: .leading, spacing: 8) {
            if actions.isEmpty {
                Button("Add “listened” habit") {
                    Task { await model.addHabit(HabitAction(title: "Listen: \(ep.title)")) }
                }
                .font(.caption.weight(.bold))
                .foregroundStyle(HTTheme.forest)
            } else {
                Text("From this episode").font(.caption.weight(.bold)).foregroundStyle(HTTheme.muted)
                ForEach(Array(actions.enumerated()), id: \.offset) { _, action in
                    Button {
                        Task { await model.addHabit(action) }
                    } label: {
                        HStack {
                            Text(action.title)
                            Spacer()
                            Text(posture == .tabletop ? "Add" : "Add habit").font(.caption.weight(.bold))
                        }
                    }
                    .font(.subheadline)
                    .foregroundStyle(HTTheme.forest)
                }
            }
        }
    }

    private var podcastTransport: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 16) {
                Button { playback.skip(-15) } label: { Image(systemName: "gobackward.15") }
                Button { playback.play() } label: { Image(systemName: "play.fill") }
                Button { playback.pause() } label: { Image(systemName: "pause.fill") }
                Button { playback.skip(15) } label: { Image(systemName: "goforward.15") }
            }
            .font(.title)
            .foregroundStyle(HTTheme.forest)
            .frame(maxWidth: .infinity, minHeight: 56)
            HStack(spacing: 8) {
                speedButton(1, "1×")
                speedButton(1.25, "1.25×")
                speedButton(1.5, "1.5×")
            }
        }
        .padding(12)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
    }

    private func speedButton(_ rate: Double, _ title: String) -> some View {
        Button(title) { playback.rate(rate) }
            .font(.headline)
            .frame(maxWidth: .infinity, minHeight: 44)
            .background(HTTheme.cream)
            .foregroundStyle(HTTheme.forest)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .buttonStyle(.plain)
    }
}
