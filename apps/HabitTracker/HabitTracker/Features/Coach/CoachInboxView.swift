import Observation
import PhotosUI
import SwiftUI
import UIKit

@MainActor
@Observable
final class CoachInboxViewModel {
    var conversations: [InboxConversation] = []
    var selected: InboxConversation?
    var messages: [AdminChatMessage] = []
    var draft = ""
    var isSending = false
    var errorMessage: String?
    var replyingTo: AdminChatMessage?
    var loadingList = false
    var loadingThread = false
    var homeTab = 0
    var templates: [HabitTemplateRow] = []
    var editingTemplate: HabitTemplateRow?
    var newTitle = ""
    var library: [CommonFileRow] = []
    var showLibrary = false
    var uploading = false
    private var optimisticSeq = 0
    private let auth: AuthStore

    init(auth: AuthStore) { self.auth = auth }

    var selectedTitle: String {
        selected?.userName
            ?? selected?.contactEmail
            ?? selected?.contactPhone
            ?? "Conversation"
    }

    func loadList() async {
        guard auth.isSignedIn else { return }
        loadingList = true
        defer { loadingList = false }
        do {
            conversations = try await auth.client.query("messaging.listConversations")
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func loadTemplates() async {
        templates = (try? await auth.client.query("habit.adminGetTemplates")) ?? []
    }

    func saveTemplate(_ row: HabitTemplateRow) async {
        do {
            if row.id > 0 {
                let _: SuccessFlag = try await auth.client.mutate(
                    "habit.adminUpdateTemplate",
                    input: SaveHabitTemplateInput(
                        id: row.id,
                        title: row.title,
                        description: row.description,
                        type: row.type ?? "boolean",
                        targetValue: row.targetValue,
                        unit: row.unit,
                        order: row.order ?? 0,
                        isActive: row.isActive ?? true
                    )
                )
            } else {
                let _: SuccessFlag = try await auth.client.mutate(
                    "habit.adminCreateTemplate",
                    input: SaveHabitTemplateInput(
                        title: row.title,
                        description: row.description,
                        type: "boolean",
                        order: templates.count + 1,
                        isActive: true
                    )
                )
            }
            editingTemplate = nil
            newTitle = ""
            await loadTemplates()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func deleteTemplate(_ id: Int) async {
        _ = try? await auth.client.mutate("habit.adminDeleteTemplate", input: TemplateIdInput(id: id)) as SuccessFlag
        await loadTemplates()
    }

    func open(_ row: InboxConversation) async {
        selected = row
        await loadThread()
        listenLoop()
    }

    func closeThread() {
        selected = nil
        messages = []
        draft = ""
        replyingTo = nil
    }

    func loadThread() async {
        guard let id = selected?.id else { return }
        loadingThread = true
        defer { loadingThread = false }
        do {
            let pending = messages.filter { $0.pending == true }
            let payload: AdminThreadPayload = try await auth.client.query(
                "messaging.getConversation",
                input: ConversationIdInput(id: id)
            )
            messages = payload.messages.filter { $0.type != "call" }
            if let convo = payload.conversation {
                selected = InboxConversation(
                    id: convo.id,
                    platform: convo.platform ?? selected?.platform,
                    userName: convo.userName ?? selected?.userName,
                    contactPhone: convo.contactPhone ?? selected?.contactPhone,
                    contactEmail: convo.contactEmail ?? selected?.contactEmail,
                    unreadCount: 0,
                    lastMessagePreview: selected?.lastMessagePreview,
                    lastMessageAt: convo.lastMessageAt ?? selected?.lastMessageAt
                )
            }
            if !pending.isEmpty {
                let existing = Set(messages.compactMap(\.content))
                messages.append(contentsOf: pending.filter { msg in
                    guard let content = msg.content, !content.isEmpty else { return true }
                    return !existing.contains(content)
                })
            }
            let _: SuccessFlag = try await auth.client.mutate(
                "messaging.markAsRead",
                input: AdminTypingInput(conversationId: id)
            )
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func send(content: String? = nil, mediaUrl: String? = nil) async {
        guard let id = selected?.id else { return }
        let text = (content ?? draft).trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty || mediaUrl != nil else { return }
        optimisticSeq += 1
        let optId = -(Int(Date().timeIntervalSince1970 * 1000) + optimisticSeq)
        let reply = replyingTo
        let bubble = AdminChatMessage(
            id: optId,
            direction: "outbound",
            senderName: auth.user?.name ?? "You",
            content: text.isEmpty ? nil : text,
            mediaUrl: mediaUrl,
            createdAt: Date(),
            type: "message",
            replyToId: reply?.id,
            replyTo: reply.map { ReplyPreview(id: $0.id, content: $0.content, senderName: $0.senderName) },
            pending: true
        )
        messages.append(bubble)
        if content == nil { draft = "" }
        replyingTo = nil
        isSending = true
        defer { isSending = false }
        do {
            let _: SuccessFlag = try await auth.client.mutate(
                "messaging.mockSendSms",
                input: SendAdminMessageInput(
                    conversationId: id,
                    content: text.isEmpty ? nil : text,
                    mediaUrl: mediaUrl,
                    replyToId: reply?.id
                )
            )
            await loadThread()
            await loadList()
        } catch {
            messages.removeAll { $0.id == optId }
            if mediaUrl == nil { draft = text }
            replyingTo = reply
            errorMessage = error.localizedDescription
        }
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

    func loadLibrary() async {
        library = (try? await auth.client.query("clientFiles.listCommon")) ?? []
    }

    func sendLibraryFile(_ file: CommonFileRow) async {
        showLibrary = false
        await send(content: file.fileName, mediaUrl: file.fileUrl)
    }

    func listenLoop() {
        Task { [weak self] in
            while let self, self.selected != nil, !Task.isCancelled {
                await self.listenForEvents()
                try? await Task.sleep(for: .seconds(2))
            }
        }
    }

    func listenForEvents() async {
        guard let id = selected?.id else { return }
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
                if Task.isCancelled || selected?.id != id { break }
                guard line.hasPrefix("data: ") else { continue }
                struct Ev: Decodable { var type: String?; var who: String? }
                guard let ev = try? JSONDecoder().decode(Ev.self, from: Data(line.dropFirst(6).utf8)) else { continue }
                if ev.type == "message" {
                    await loadThread()
                    await loadList()
                }
            }
        } catch {
            /* retry */
        }
    }
}

struct CoachInboxView: View {
    @Bindable var coach: CoachViewModel
    @Bindable var auth: AuthStore
    var showsModePicker = true
    @State private var model: CoachInboxViewModel
    @State private var photoItem: PhotosPickerItem?

    init(coach: CoachViewModel, auth: AuthStore, showsModePicker: Bool = true) {
        self.coach = coach
        self.auth = auth
        self.showsModePicker = showsModePicker
        _model = State(initialValue: CoachInboxViewModel(auth: auth))
    }

    var body: some View {
        NavigationStack {
            Group {
                if model.selected != nil {
                    thread
                } else {
                    VStack(spacing: 0) {
                        if showsModePicker {
                            Picker("", selection: $model.homeTab) {
                                Text("Inbox").tag(0)
                                Text("Habits").tag(1)
                            }
                            .pickerStyle(.segmented)
                            .padding(.horizontal, 16)
                            .padding(.bottom, 8)
                        }
                        if showsModePicker && model.homeTab == 1 {
                            habitsAdmin
                        } else {
                            list
                        }
                    }
                }
            }
            .background(HTTheme.cream)
            .navigationTitle(model.selected == nil ? (model.homeTab == 0 ? "Inbox" : "Daily habits") : model.selectedTitle)
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    if model.selected != nil {
                        Button("Inbox") { model.closeThread() }
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    ProfileAvatarButton(auth: auth)
                }
            }
            .task {
                await model.loadList()
                await model.loadTemplates()
                coach.unread = model.conversations.reduce(0) { $0 + ($1.unreadCount ?? 0) }
            }
        }
    }

    private var list: some View {
        List {
            if model.loadingList && model.conversations.isEmpty {
                ProgressView()
            }
            ForEach(model.conversations) { row in
                Button {
                    Task { await model.open(row) }
                } label: {
                    HStack(alignment: .top, spacing: 10) {
                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                Text(row.userName ?? row.contactEmail ?? row.contactPhone ?? "Unknown")
                                    .font(.headline)
                                    .foregroundStyle(HTTheme.forest)
                                    .lineLimit(1)
                                Spacer()
                                Text(ChatDay.time(row.lastMessageAt))
                                    .font(.caption2)
                                    .foregroundStyle(HTTheme.muted)
                            }
                            HStack(spacing: 6) {
                                Text(channelLabel(row.platform))
                                    .font(.caption2.weight(.bold))
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(channelColor(row.platform).opacity(0.15))
                                    .foregroundStyle(channelColor(row.platform))
                                    .clipShape(Capsule())
                                Text(row.lastMessagePreview ?? "No messages")
                                    .font(.caption)
                                    .foregroundStyle(HTTheme.muted)
                                    .lineLimit(1)
                            }
                        }
                        if (row.unreadCount ?? 0) > 0 {
                            Text("\(row.unreadCount ?? 0)")
                                .font(.caption2.weight(.bold))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(HTTheme.gold)
                                .clipShape(Capsule())
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
        }
        .listStyle(.plain)
        .refreshable { await model.loadList() }
    }

    private var thread: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 10) {
                        ForEach(Array(model.messages.enumerated()), id: \.element.id) { index, msg in
                            let prev = index > 0 ? model.messages[index - 1] : nil
                            if ChatDay.key(msg.createdAt) != ChatDay.key(prev?.createdAt) {
                                DateChip(label: ChatDay.label(msg.createdAt))
                            }
                            adminBubble(msg)
                                .id(msg.id)
                                .contextMenu {
                                    Button {
                                        model.replyingTo = msg
                                    } label: {
                                        Label("Reply", systemImage: "arrowshape.turn.up.left")
                                    }
                                }
                        }
                    }
                    .padding(16)
                }
                .dockScrollClearance()
                .onChange(of: model.messages.count) {
                    if let last = model.messages.last {
                        proxy.scrollTo(last.id, anchor: .bottom)
                    }
                }
            }
            composer
        }
        .sheet(isPresented: $model.showLibrary) {
            librarySheet
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

    private var librarySheet: some View {
        NavigationStack {
            List {
                if model.library.isEmpty {
                    Text("No files in the admin library yet. Add them on the website under File library.")
                        .font(.caption)
                        .foregroundStyle(HTTheme.muted)
                }
                ForEach(model.library) { file in
                    Button {
                        Task { await model.sendLibraryFile(file) }
                    } label: {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(file.fileName).foregroundStyle(HTTheme.forest)
                            if let mime = file.mimeType {
                                Text(mime).font(.caption2).foregroundStyle(HTTheme.muted)
                            }
                        }
                    }
                }
            }
            .navigationTitle("File library")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { model.showLibrary = false }
                }
            }
            .task { await model.loadLibrary() }
        }
        .presentationDetents([.medium, .large])
    }

    private var composer: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let err = model.errorMessage {
                Text(err).font(.caption).foregroundStyle(.red)
            }
            if let reply = model.replyingTo {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(reply.senderName ?? "Message")
                            .font(.caption2.weight(.bold))
                            .foregroundStyle(HTTheme.gold)
                        Text(reply.content ?? "Attachment")
                            .font(.caption)
                            .foregroundStyle(HTTheme.muted)
                            .lineLimit(2)
                    }
                    Spacer()
                    Button { model.replyingTo = nil } label: {
                        Image(systemName: "xmark.circle.fill").foregroundStyle(HTTheme.muted)
                    }
                }
                .padding(10)
                .background(Color.white)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            HStack(spacing: 10) {
                PhotosPicker(selection: $photoItem, matching: .images) {
                    Image(systemName: model.uploading ? "arrow.triangle.2.circlepath" : "photo")
                        .font(.title3)
                        .foregroundStyle(HTTheme.forest)
                }
                .disabled(model.uploading)

                Button {
                    model.showLibrary = true
                    Task { await model.loadLibrary() }
                } label: {
                    Image(systemName: "folder")
                        .font(.title3)
                        .foregroundStyle(HTTheme.forest)
                }
            }

            HStack(alignment: .bottom) {
                TextField("Message…", text: $model.draft, axis: .vertical)
                    .lineLimit(1...4)
                    .padding(10)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                Button {
                    Task { await model.send() }
                } label: {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.system(size: 32))
                        .foregroundStyle(channelColor(model.selected?.platform))
                }
                .disabled(model.draft.trimmingCharacters(in: .whitespaces).isEmpty || model.uploading)
            }
        }
        .padding(.horizontal, 12)
        .padding(.top, 10)
        .padding(.bottom, 10)
        .padding(.bottom, HTTheme.dockClearance)
        .background(HTTheme.cream.opacity(0.92))
    }

    @ViewBuilder
    private func adminBubble(_ msg: AdminChatMessage) -> some View {
        HStack {
            if msg.isMine { Spacer(minLength: 40) }
            VStack(alignment: msg.isMine ? .trailing : .leading, spacing: 4) {
                if !msg.isMine {
                    Text(msg.senderName ?? "Client")
                        .font(.caption2.weight(.bold))
                        .foregroundStyle(HTTheme.gold)
                }
                VStack(alignment: .leading, spacing: 6) {
                    if let quoted = msg.replyTo {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(quoted.senderName ?? "Message").font(.caption2.weight(.bold))
                            Text(quoted.content ?? "Attachment").font(.caption).lineLimit(2)
                        }
                        .padding(.leading, 8)
                        .overlay(alignment: .leading) {
                            Rectangle()
                                .fill(msg.isMine ? Color.white.opacity(0.6) : HTTheme.gold)
                                .frame(width: 2)
                        }
                    }
                    if let urlStr = msg.mediaUrl, let url = URL(string: urlStr) {
                        if isImageURL(urlStr) {
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
                            Link(msg.content ?? "Open file", destination: url)
                                .font(.caption.weight(.bold))
                        }
                    }
                    if let content = msg.content, !content.isEmpty, msg.mediaUrl == nil || isImageURL(msg.mediaUrl) {
                        Text(content).font(.body)
                    }
                }
                .foregroundStyle(msg.isMine ? .white : HTTheme.forest)
                .padding(12)
                .background(msg.isMine ? channelColor(model.selected?.platform) : Color.white)
                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                Text(msg.pending == true ? "Sending…" : ChatDay.time(msg.createdAt))
                    .font(.caption2)
                    .foregroundStyle(HTTheme.muted)
            }
            if !msg.isMine { Spacer(minLength: 40) }
        }
    }

    private var habitsAdmin: some View {
        List {
            Section {
                HStack {
                    TextField("New habit title", text: $model.newTitle)
                    Button("Add") {
                        let title = model.newTitle.trimmingCharacters(in: .whitespaces)
                        guard !title.isEmpty else { return }
                        Task {
                            await model.saveTemplate(
                                HabitTemplateRow(id: 0, title: title, type: "boolean", order: model.templates.count + 1, isActive: true)
                            )
                        }
                    }
                    .disabled(model.newTitle.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            } footer: {
                Text("Changes apply to everyone’s Today list, not just new accounts.")
            }
            ForEach(model.templates) { row in
                Button {
                    model.editingTemplate = row
                } label: {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(row.title).font(.headline).foregroundStyle(HTTheme.forest)
                        if let desc = row.description, !desc.isEmpty {
                            Text(desc).font(.caption).foregroundStyle(HTTheme.muted)
                        }
                        if row.isActive == false {
                            Text("Inactive").font(.caption2.weight(.bold)).foregroundStyle(.red)
                        }
                    }
                }
                .swipeActions {
                    Button(role: .destructive) {
                        Task { await model.deleteTemplate(row.id) }
                    } label: {
                        Label("Remove", systemImage: "trash")
                    }
                }
            }
        }
        .listStyle(.plain)
        .refreshable { await model.loadTemplates() }
    }
}

struct AdminHabitsPhoneView: View {
    @Bindable var auth: AuthStore
    @State private var model: CoachInboxViewModel

    init(auth: AuthStore) {
        self.auth = auth
        _model = State(initialValue: CoachInboxViewModel(auth: auth))
    }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    HStack {
                        TextField("New habit title", text: $model.newTitle)
                        Button("Add") {
                            let title = model.newTitle.trimmingCharacters(in: .whitespaces)
                            guard !title.isEmpty else { return }
                            Task {
                                await model.saveTemplate(
                                    HabitTemplateRow(id: 0, title: title, type: "boolean", order: model.templates.count + 1, isActive: true)
                                )
                            }
                        }
                        .disabled(model.newTitle.trimmingCharacters(in: .whitespaces).isEmpty)
                    }
                } header: {
                    Text("Everyone’s Today list")
                } footer: {
                    Text("Protein, fiber, sleep, hydrate, move, mindful. Add or swipe to remove for every client.")
                }
                ForEach(model.templates) { row in
                    Button {
                        model.editingTemplate = row
                    } label: {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(row.title).font(.headline).foregroundStyle(HTTheme.forest)
                            HStack(spacing: 6) {
                                if row.type == "numeric" {
                                    Text("\(row.targetValue.map(String.init) ?? "?") \(row.unit ?? "")")
                                        .font(.caption)
                                        .foregroundStyle(HTTheme.gold)
                                }
                                if let desc = row.description, !desc.isEmpty {
                                    Text(desc).font(.caption).foregroundStyle(HTTheme.muted).lineLimit(1)
                                }
                                if row.isActive == false {
                                    Text("Off").font(.caption2.weight(.bold)).foregroundStyle(.red)
                                }
                            }
                        }
                    }
                    .swipeActions {
                        Button(role: .destructive) {
                            Task { await model.deleteTemplate(row.id) }
                        } label: {
                            Label("Remove", systemImage: "trash")
                        }
                    }
                }
            }
            .listStyle(.plain)
            .background(HTTheme.cream)
            .navigationTitle("Daily habits")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    ProfileAvatarButton(auth: auth)
                }
            }
            .sheet(item: $model.editingTemplate) { row in
                HabitEditSheet(row: row) { updated in
                    Task { await model.saveTemplate(updated) }
                } onCancel: {
                    model.editingTemplate = nil
                }
            }
            .task { await model.loadTemplates() }
            .refreshable { await model.loadTemplates() }
        }
    }
}

private struct HabitEditSheet: View {
    @State var row: HabitTemplateRow
    var onSave: (HabitTemplateRow) -> Void
    var onCancel: () -> Void

    var body: some View {
        NavigationStack {
            Form {
                TextField("Title", text: Binding(
                    get: { row.title },
                    set: { row.title = $0 }
                ))
                TextField("Description", text: Binding(
                    get: { row.description ?? "" },
                    set: { row.description = $0 }
                ))
                Picker("Type", selection: Binding(
                    get: { row.type ?? "boolean" },
                    set: { row.type = $0 }
                )) {
                    Text("Checkbox").tag("boolean")
                    Text("Number").tag("numeric")
                }
                if row.type == "numeric" {
                    TextField("Target", value: Binding(
                        get: { row.targetValue },
                        set: { row.targetValue = $0 }
                    ), format: .number)
                    TextField("Unit (oz, g, hr)", text: Binding(
                        get: { row.unit ?? "" },
                        set: { row.unit = $0 }
                    ))
                }
                Toggle("Active on everyone’s list", isOn: Binding(
                    get: { row.isActive ?? true },
                    set: { row.isActive = $0 }
                ))
            }
            .navigationTitle("Edit habit")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel", action: onCancel)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { onSave(row) }
                        .disabled(row.title.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }
}

private func channelLabel(_ platform: String?) -> String {
    switch platform {
    case "webchat": return "Habit Tracker"
    case "whatsapp": return "WhatsApp"
    case "facebook": return "Messenger"
    case "instagram": return "Instagram"
    default: return "SMS"
    }
}

private func isImageURL(_ url: String?) -> Bool {
    guard let url else { return false }
    return url.range(of: #"\.(png|jpe?g|gif|webp|heic|svg)(\?|$)"#, options: [.regularExpression, .caseInsensitive]) != nil
}

private func channelColor(_ platform: String?) -> Color {
    switch platform {
    case "webchat": return Color(red: 10 / 255, green: 132 / 255, blue: 1)
    default: return Color(red: 52 / 255, green: 199 / 255, blue: 89 / 255)
    }
}
