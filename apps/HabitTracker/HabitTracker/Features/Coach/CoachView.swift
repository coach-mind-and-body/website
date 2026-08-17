import Foundation
import Observation
import SwiftUI

@MainActor
@Observable
final class CoachViewModel {
    var thread: CoachThread?
    var draft = ""
    var unread = 0
    var isSending = false
    var errorMessage: String?
    var showRecipePicker = false
    var recipeQuery = ""
    var recipeHits: [Recipe] = []
    var recipesLoading = false
    var notifyEnabled = false
    private var lastSeenMessageId: Int?
    private let auth: AuthStore

    init(auth: AuthStore) { self.auth = auth }

    func load() async {
        guard auth.isSignedIn else { return }
        do {
            let previousLast = thread?.messages.last?.id
            thread = try await auth.client.query("coach.getThread")
            unread = (try? await auth.client.query("coach.unreadCount") as UnreadCount)?.count ?? 0
            let _: SuccessFlag = try await auth.client.mutateEmpty("coach.markRead")
            if notifyEnabled,
               let newest = thread?.messages.last,
               !newest.isMine,
               let previousLast,
               newest.id != previousLast
            {
                await NotificationService.notifyCoachReply(preview: newest.content ?? "New message")
            }
            unread = 0
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func send(content: String? = nil, mediaUrl: String? = nil) async {
        let text = (content ?? draft).trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty || mediaUrl != nil else { return }
        isSending = true
        defer { isSending = false }
        do {
            let _: SuccessFlag = try await auth.client.mutate(
                "coach.send",
                input: SendCoachInput(content: text.isEmpty ? nil : text, mediaUrl: mediaUrl)
            )
            draft = ""
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func shareRecipe(_ recipe: Recipe) async {
        let text = "A recipe for you: \(recipe.title)\nhttps://mindandbodyresetcoach.com/habit-tracker/recipes/\(recipe.slug)"
        showRecipePicker = false
        await send(content: text)
    }

    func searchRecipes() async {
        recipesLoading = true
        defer { recipesLoading = false }
        do {
            let hits: [Recipe] = try await auth.client.query(
                "food.listRecipes",
                input: RecipeListInput(q: recipeQuery.isEmpty ? nil : recipeQuery)
            )
            recipeHits = hits
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func refreshUnread() async {
        guard auth.isSignedIn else { return }
        unread = (try? await auth.client.query("coach.unreadCount") as UnreadCount)?.count ?? 0
    }

    func enableNotifications() async {
        notifyEnabled = await NotificationService.requestAuthorization()
    }
}

struct CoachView: View {
    @Bindable var model: CoachViewModel
    @Bindable var auth: AuthStore

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if !model.notifyEnabled {
                    Button {
                        Task { await model.enableNotifications() }
                    } label: {
                        Label("Notify me when Lee Anne replies", systemImage: "bell")
                            .font(.caption.weight(.bold))
                            .frame(maxWidth: .infinity)
                            .padding(10)
                    }
                    .foregroundStyle(HTTheme.forest)
                    .background(Color.white)
                }

                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 10) {
                            ForEach(model.thread?.messages ?? []) { msg in
                                bubble(msg)
                                    .id(msg.id)
                            }
                        }
                        .padding(16)
                    }
                    .onChange(of: model.thread?.messages.count) {
                        if let last = model.thread?.messages.last {
                            proxy.scrollTo(last.id, anchor: .bottom)
                        }
                    }
                }

                VStack(alignment: .leading, spacing: 8) {
                    Button {
                        model.showRecipePicker = true
                        Task { await model.searchRecipes() }
                    } label: {
                        Label("Recipe", systemImage: "book")
                            .font(.caption.weight(.bold))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Color.white)
                            .clipShape(Capsule())
                            .overlay(Capsule().stroke(HTTheme.roseBorder))
                    }
                    .foregroundStyle(HTTheme.forest)

                    HStack(alignment: .bottom) {
                        TextField("Write to Lee Anne…", text: $model.draft, axis: .vertical)
                            .lineLimit(1...4)
                            .padding(10)
                            .background(Color.white)
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                        Button {
                            Task { await model.send() }
                        } label: {
                            Image(systemName: "arrow.up.circle.fill")
                                .font(.system(size: 32))
                                .foregroundStyle(HTTheme.forest)
                        }
                        .disabled(model.isSending || model.draft.trimmingCharacters(in: .whitespaces).isEmpty)
                    }
                }
                .padding(12)
                .background(HTTheme.cream)
            }
            .background(HTTheme.cream.ignoresSafeArea())
            .navigationTitle(model.thread?.coachName ?? "Coach")
            .navigationDestination(for: String.self) { slug in
                RecipeDetailView(slug: slug, food: FoodViewModel(auth: auth), auth: auth)
            }
            .task { await model.load() }
            .sheet(isPresented: $model.showRecipePicker) {
                recipePicker
            }
        }
    }

    private var recipePicker: some View {
        NavigationStack {
            List {
                TextField("Search recipes", text: $model.recipeQuery)
                    .onSubmit { Task { await model.searchRecipes() } }
                if model.recipesLoading {
                    ProgressView()
                }
                ForEach(model.recipeHits) { recipe in
                    Button {
                        Task { await model.shareRecipe(recipe) }
                    } label: {
                        VStack(alignment: .leading) {
                            Text(recipe.title).foregroundStyle(HTTheme.forest)
                            if let p = recipe.protein {
                                Text("\(p)g protein").font(.caption).foregroundStyle(HTTheme.gold)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Share a recipe")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { model.showRecipePicker = false }
                }
            }
            .task { await model.searchRecipes() }
        }
        .presentationDetents([.medium, .large])
    }

    @ViewBuilder
    private func bubble(_ msg: CoachMessage) -> some View {
        HStack {
            if msg.isMine { Spacer(minLength: 40) }
            VStack(alignment: msg.isMine ? .trailing : .leading, spacing: 6) {
                if !msg.isMine {
                    Text(msg.senderName ?? "Lee Anne")
                        .font(.caption2.weight(.bold))
                        .foregroundStyle(HTTheme.gold)
                }
                VStack(alignment: .leading, spacing: 8) {
                    if let urlStr = msg.mediaUrl, let url = URL(string: urlStr) {
                        if msg.isImageAttachment {
                            AsyncImage(url: url) { phase in
                                if case .success(let img) = phase {
                                    img.resizable().scaledToFill()
                                } else {
                                    ProgressView()
                                }
                            }
                            .frame(maxHeight: 180)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        } else {
                            Link("Open file", destination: url)
                                .font(.caption.weight(.bold))
                        }
                    }
                    if let slug = msg.recipeSlug {
                        NavigationLink(value: slug) {
                            Text("Open recipe →")
                                .font(.caption.weight(.bold))
                                .padding(8)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(msg.isMine ? Color.white.opacity(0.15) : Color.white)
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                        }
                    }
                    if let content = msg.content, !content.isEmpty {
                        Text(content)
                            .font(.body)
                    }
                }
                .foregroundStyle(msg.isMine ? .white : HTTheme.forest)
                .padding(12)
                .background(msg.isMine ? HTTheme.forest : Color.white)
                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            }
            if !msg.isMine { Spacer(minLength: 40) }
        }
    }
}
