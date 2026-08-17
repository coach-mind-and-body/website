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
    private let auth: AuthStore
    var sessionEpoch: Int { auth.sessionEpoch }

    init(auth: AuthStore) { self.auth = auth }

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            let payload: PodcastPayload = try await auth.client.query("podcast.getEpisodes")
            episodes = payload.episodes
            if selected == nil { selected = episodes.first }
        } catch {
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

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Text("Podcast")
                        .font(HTTheme.serif)
                        .foregroundStyle(HTTheme.forest)
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
                    } else if !model.isLoading && model.episodes.isEmpty {
                        Text("No episodes yet. Pull to refresh.")
                            .font(.subheadline)
                            .foregroundStyle(HTTheme.muted)
                    }

                    if let ep = model.selected {
                        AsyncImage(url: ep.thumbnail.flatMap(URL.init(string:))) { phase in
                            if case .success(let img) = phase { img.resizable().scaledToFill() }
                            else { HTTheme.roseBorder }
                        }
                        .frame(height: 180)
                        .clipShape(RoundedRectangle(cornerRadius: 16))

                        Text(ep.title).font(.headline).foregroundStyle(HTTheme.forest)
                        if let d = ep.description, !d.isEmpty {
                            Text(d).font(.caption).foregroundStyle(HTTheme.muted).lineLimit(4)
                        }
                        if let url = URL(string: "https://www.youtube.com/watch?v=\(ep.videoId)") {
                            Link("Play on YouTube", destination: url)
                                .font(.subheadline.weight(.bold))
                                .foregroundStyle(HTTheme.gold)
                        }
                        let actions = model.actions(for: ep)
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
                                        Text("Add habit").font(.caption.weight(.bold))
                                    }
                                }
                                .font(.subheadline)
                                .foregroundStyle(HTTheme.forest)
                            }
                        }
                    }

                    ForEach(model.episodes) { ep in
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
                                    if let d = ep.publishedAt { Text(String(d.prefix(10))).font(.caption).foregroundStyle(HTTheme.muted) }
                                }
                                Spacer()
                            }
                        }
                    }
                }
                .padding(16)
            }
            .background(HTTheme.cream.ignoresSafeArea())
            .navigationTitle("Podcast")
            .task(id: model.sessionEpoch) { await model.load() }
            .refreshable { await model.load() }
        }
    }
}
