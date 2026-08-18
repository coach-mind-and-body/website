import Foundation
import Observation
import PhotosUI
import SwiftUI
import UIKit

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
    var notifyEnabled = UserDefaults.standard.bool(forKey: "coach.notifyEnabled")
    var uploading = false
    var isOnCoachTab = false
    var coachTyping = false
    var replyingTo: CoachMessage?
    private var lastSeenMessageId: Int?
    private var typingReset: Task<Void, Never>?
    private var lastTypingSent = Date.distantPast
    private var optimisticSeq = 0
    private let auth: AuthStore

    init(auth: AuthStore) { self.auth = auth }

    func load(announce: Bool = false) async {
        guard auth.isSignedIn else { return }
        do {
            let previousLast = thread?.messages.last(where: { $0.id > 0 })?.id
            let pending = thread?.messages.filter { $0.pending == true } ?? []
            thread = try await auth.client.query("coach.getThread")
            if !pending.isEmpty {
                let serverText = Set((thread?.messages ?? []).compactMap(\.content))
                let stillFlying = pending.filter { msg in
                    guard let content = msg.content, !content.isEmpty else { return true }
                    return !serverText.contains(content)
                }
                thread?.messages.append(contentsOf: stillFlying)
            }
            unread = (try? await auth.client.query("coach.unreadCount") as UnreadCount)?.count ?? 0
            let _: SuccessFlag = try await auth.client.mutateEmpty("coach.markRead")
            let newest = thread?.messages.last(where: { $0.id > 0 })
            let isNew = newest != nil && newest?.id != previousLast && newest?.isMine == false
            if announce, notifyEnabled, isNew, !isOnCoachTab {
                await NotificationService.notifyCoachReply(preview: newest?.content ?? "New message")
            }
            unread = 0
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func send(content: String? = nil, mediaUrl: String? = nil) async {
        let text = (content ?? draft).trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty || mediaUrl != nil else { return }
        optimisticSeq += 1
        let optimisticId = -(Int(Date().timeIntervalSince1970 * 1000) + optimisticSeq)
        let reply = replyingTo
        let bubble = CoachMessage(
            id: optimisticId,
            direction: "inbound",
            senderName: auth.user?.name,
            content: text.isEmpty ? nil : text,
            mediaUrl: mediaUrl,
            createdAt: Date(),
            isAutomated: false,
            pending: true,
            replyToId: reply?.id,
            replyTo: reply.map { ReplyPreview(id: $0.id, content: $0.content, senderName: $0.senderName) }
        )
        if thread != nil {
            thread?.messages.append(bubble)
        }
        draft = ""
        replyingTo = nil
        isSending = true
        defer { isSending = false }
        do {
            let _: SuccessFlag = try await auth.client.mutate(
                "coach.send",
                input: SendCoachInput(content: text.isEmpty ? nil : text, mediaUrl: mediaUrl, replyToId: reply?.id)
            )
            await load(announce: false)
        } catch {
            thread?.messages.removeAll { $0.id == optimisticId }
            draft = text
            replyingTo = reply
            errorMessage = error.localizedDescription
        }
    }

    func pingTyping() async {
        guard Date().timeIntervalSince(lastTypingSent) > 1.5 else { return }
        lastTypingSent = Date()
        _ = try? await auth.client.mutateEmpty("coach.typing") as SuccessFlag
    }

    func refreshTyping() async {
        struct TypingState: Decodable { var coachTyping: Bool? }
        let state: TypingState? = try? await auth.client.query("coach.typingState")
        if state?.coachTyping == true {
            coachTyping = true
            typingReset?.cancel()
            typingReset = Task {
                try? await Task.sleep(for: .seconds(2.8))
                if !Task.isCancelled { coachTyping = false }
            }
        }
    }

    func listenForEvents() async {
        guard let id = thread?.conversationId else { return }
        var comps = URLComponents(url: AppConfig.apiRoot.appending(path: "api/coach/events"), resolvingAgainstBaseURL: false)
        comps?.queryItems = [URLQueryItem(name: "conversationId", value: String(id))]
        guard let url = comps?.url else { return }
        var request = URLRequest(url: url)
        request.setValue("text/event-stream", forHTTPHeaderField: "Accept")
        if let token = auth.token, !token.isEmpty {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        do {
            let (bytes, _) = try await URLSession.shared.bytes(for: request)
            for try await line in bytes.lines {
                if Task.isCancelled { break }
                guard line.hasPrefix("data: ") else { continue }
                let payload = Data(line.dropFirst(6).utf8)
                struct Ev: Decodable { var type: String?; var who: String? }
                guard let ev = try? JSONDecoder().decode(Ev.self, from: payload) else { continue }
                if ev.type == "message" {
                    coachTyping = false
                    await load(announce: ev.who == "coach")
                } else if ev.type == "typing", ev.who == "coach" {
                    coachTyping = true
                    typingReset?.cancel()
                    typingReset = Task {
                        try? await Task.sleep(for: .seconds(2.5))
                        if !Task.isCancelled { coachTyping = false }
                    }
                }
            }
        } catch {
            /* stream dropped — caller may retry */
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
        if auth.user?.role == "admin" {
            let rows: [InboxConversation] = (try? await auth.client.query("messaging.listConversations")) ?? []
            unread = rows.reduce(0) { $0 + ($1.unreadCount ?? 0) }
            return
        }
        unread = (try? await auth.client.query("coach.unreadCount") as UnreadCount)?.count ?? 0
    }

    func enableNotifications() async {
        notifyEnabled = await NotificationService.requestAuthorization()
        UserDefaults.standard.set(notifyEnabled, forKey: "coach.notifyEnabled")
    }

    func sendPhoto(_ image: UIImage) async {
        guard let data = image.jpegData(compressionQuality: 0.7) else { return }
        uploading = true
        defer { uploading = false }
        do {
            let result: CoachPhotoResult = try await auth.client.mutate(
                "coach.uploadPhoto",
                input: CoachPhotoInput(mimeType: "image/jpeg", base64Data: data.base64EncodedString())
            )
            await send(mediaUrl: result.url)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct CoachView: View {
    @Bindable var model: CoachViewModel
    @Bindable var auth: AuthStore
    @State private var photoItem: PhotosPickerItem?

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
                            ForEach(Array((model.thread?.messages ?? []).enumerated()), id: \.element.id) { index, msg in
                                let messages = model.thread?.messages ?? []
                                let prev = index > 0 ? messages[index - 1] : nil
                                if ChatDay.key(msg.createdAt) != ChatDay.key(prev?.createdAt) {
                                    DateChip(label: ChatDay.label(msg.createdAt))
                                }
                                bubble(msg)
                                    .id(msg.id)
                                    .contextMenu {
                                        Button {
                                            model.replyingTo = msg
                                        } label: {
                                            Label("Reply", systemImage: "arrowshape.turn.up.left")
                                        }
                                    }
                            }
                            if model.coachTyping {
                                HStack {
                                    TypingDots()
                                        .padding(.horizontal, 14)
                                        .padding(.vertical, 11)
                                        .background(Color.white)
                                        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                                    Spacer(minLength: 40)
                                }
                                .id("typing")
                                .accessibilityLabel("Lee Anne is typing")
                            }
                        }
                        .padding(16)
                    }
                    .dockScrollClearance()
                    .onChange(of: model.thread?.messages.count) {
                        if model.coachTyping {
                            proxy.scrollTo("typing", anchor: .bottom)
                        } else if let last = model.thread?.messages.last {
                            proxy.scrollTo(last.id, anchor: .bottom)
                        }
                    }
                    .onChange(of: model.coachTyping) {
                        if model.coachTyping {
                            proxy.scrollTo("typing", anchor: .bottom)
                        }
                    }
                    .onAppear {
                        if let last = model.thread?.messages.last {
                            proxy.scrollTo(last.id, anchor: .bottom)
                        }
                    }
                }
            }
            .background(HTTheme.cream)
            .safeAreaInset(edge: .bottom, spacing: 0) {
                composer
            }
            .navigationTitle(model.thread?.coachName ?? "Coach")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    ProfileAvatarButton(auth: auth)
                }
            }
            .navigationDestination(for: String.self) { slug in
                RecipeDetailView(slug: slug, food: FoodViewModel(auth: auth), auth: auth)
            }
            .task(id: auth.isSignedIn) {
                model.isOnCoachTab = true
                await model.load(announce: false)
                while !Task.isCancelled {
                    await model.listenForEvents()
                    try? await Task.sleep(for: .seconds(2))
                }
                model.isOnCoachTab = false
            }
            .task(id: auth.isSignedIn) {
                while !Task.isCancelled {
                    await model.refreshTyping()
                    try? await Task.sleep(for: .seconds(1))
                }
            }
            .onDisappear { model.isOnCoachTab = false }
            .sheet(isPresented: $model.showRecipePicker) {
                recipePicker
            }
            .onChange(of: photoItem) { _, item in
                guard let item else { return }
                Task {
                    if let data = try? await item.loadTransferable(type: Data.self),
                       let image = UIImage(data: data) {
                        await model.sendPhoto(image)
                    }
                    photoItem = nil
                }
            }
        }
    }

    private var composer: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
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

                PhotosPicker(selection: $photoItem, matching: .images) {
                    Label(model.uploading ? "Sending…" : "Photo", systemImage: "photo")
                        .font(.caption.weight(.bold))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Color.white)
                        .clipShape(Capsule())
                        .overlay(Capsule().stroke(HTTheme.roseBorder))
                }
                .disabled(model.uploading)
                .foregroundStyle(HTTheme.forest)
            }

            if let err = model.errorMessage {
                Text(err).font(.caption).foregroundStyle(.red)
            }

            if let reply = model.replyingTo {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(reply.senderName ?? (reply.isMine ? "You" : "Lee Anne"))
                            .font(.caption2.weight(.bold))
                            .foregroundStyle(HTTheme.gold)
                        Text(reply.content ?? "Attachment")
                            .font(.caption)
                            .foregroundStyle(HTTheme.muted)
                            .lineLimit(2)
                    }
                    Spacer()
                    Button {
                        model.replyingTo = nil
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundStyle(HTTheme.muted)
                    }
                }
                .padding(10)
                .background(Color.white)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .overlay(alignment: .leading) {
                    Rectangle()
                        .fill(HTTheme.gold)
                        .frame(width: 3)
                }
            }

            HStack(alignment: .bottom) {
                TextField("Write to Lee Anne…", text: $model.draft, axis: .vertical)
                    .lineLimit(1...4)
                    .padding(10)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .onChange(of: model.draft) {
                        Task { await model.pingTyping() }
                    }
                Button {
                    Task { await model.send() }
                } label: {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.system(size: 32))
                        .foregroundStyle(HTTheme.forest)
                }
                .disabled(model.draft.trimmingCharacters(in: .whitespaces).isEmpty)
            }
        }
        .padding(.horizontal, 12)
        .padding(.top, 10)
        .padding(.bottom, 10)
        .padding(.bottom, HTTheme.dockClearance)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(HTTheme.cream.opacity(0.92))
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
                    if let quoted = msg.replyTo {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(quoted.senderName ?? "Message")
                                .font(.caption2.weight(.bold))
                            Text(quoted.content ?? "Attachment")
                                .font(.caption)
                                .lineLimit(2)
                        }
                        .padding(.leading, 8)
                        .overlay(alignment: .leading) {
                            Rectangle()
                                .fill(msg.isMine ? Color.white.opacity(0.6) : HTTheme.gold)
                                .frame(width: 2)
                        }
                        .opacity(0.85)
                    }
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
                Text(msg.pending == true ? "Sending…" : ChatDay.time(msg.createdAt))
                    .font(.caption2)
                    .foregroundStyle(HTTheme.muted)
                if msg.isMine, isLastMine(msg), msg.pending != true {
                    Text("Delivered")
                        .font(.caption2)
                        .foregroundStyle(HTTheme.muted)
                }
            }
            if !msg.isMine { Spacer(minLength: 40) }
        }
    }

    private func isLastMine(_ msg: CoachMessage) -> Bool {
        model.thread?.messages.last(where: { $0.isMine })?.id == msg.id
    }
}

struct DateChip: View {
    var label: String

    var body: some View {
        if !label.isEmpty {
            Text(label)
                .font(.caption2.weight(.semibold))
                .foregroundStyle(HTTheme.muted)
                .padding(.horizontal, 10)
                .padding(.vertical, 4)
                .background(Color.black.opacity(0.05))
                .clipShape(Capsule())
                .frame(maxWidth: .infinity)
        }
    }
}

struct TypingDots: View {
    @State private var bounce = false

    var body: some View {
        HStack(spacing: 5) {
            ForEach(0..<3, id: \.self) { i in
                Circle()
                    .fill(Color(white: 0.62))
                    .frame(width: 7, height: 7)
                    .offset(y: bounce ? -3 : 2)
                    .animation(
                        .easeInOut(duration: 0.38)
                            .repeatForever(autoreverses: true)
                            .delay(Double(i) * 0.14),
                        value: bounce
                    )
            }
        }
        .onAppear { bounce = true }
    }
}
