import Foundation
import PhotosUI
import SwiftUI
import UIKit
import UniformTypeIdentifiers

struct ProgramHub: Decodable {
    var programs: [ProgramBundle]
}

struct ProgramBundle: Decodable, Identifiable {
    var program: String
    var label: String
    var enrollment: ProgramEnrollment?
    var modules: [ProgramModule]
    var assignments: [ProgramAssignment]
    var submissions: [ProgramSubmission]
    var files: [ProgramFile]
    var forms: [ProgramFormCard]?
    /// Soonest joinable session. Missing on older servers; module `session` is the fallback.
    var nextSession: ProgramSession?
    var id: String { program }
}

struct ProgramEnrollment: Decodable {
    var id: Int
}

struct ProgramModule: Decodable, Identifiable {
    var id: Int
    var title: String
    var description: String?
    var content: String?
    var videoUrl: String?
    var pdfUrl: String?
    var order: Int
    var isUnlocked: Bool
    /// Present on Reclaim modules. Older responses omit it.
    var session: ProgramSession?
}

/// One coaching session from the hub. Extra server fields are ignored.
struct ProgramSession: Decodable, Equatable {
    /// Still offer Join for an hour after the start.
    static let upcomingGrace: TimeInterval = 60 * 60

    var id: Int
    var sessionNumber: Int?
    var status: String
    var scheduledAt: Date?
    var googleMeetLink: String?

    private enum CodingKeys: String, CodingKey {
        case id, sessionNumber, status, scheduledAt, googleMeetLink
    }

    init(id: Int, sessionNumber: Int? = nil, status: String, scheduledAt: Date? = nil, googleMeetLink: String? = nil) {
        self.id = id
        self.sessionNumber = sessionNumber
        self.status = status
        self.scheduledAt = scheduledAt
        self.googleMeetLink = googleMeetLink
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = Self.value(c, .id) ?? 0
        sessionNumber = Self.value(c, .sessionNumber)
        status = Self.value(c, .status) ?? ""
        googleMeetLink = Self.value(c, .googleMeetLink)
        scheduledAt = Self.date(c)
    }

    var joinURL: URL? {
        let raw = googleMeetLink?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        guard !raw.isEmpty, let url = URL(string: raw) else { return nil }
        let scheme = url.scheme?.lowercased()
        guard scheme == "https" || scheme == "http" else { return nil }
        return url
    }

    func isUpcoming(at now: Date = Date()) -> Bool {
        guard status == "scheduled", let scheduledAt else { return false }
        return scheduledAt.timeIntervalSince(now) > -Self.upcomingGrace
    }

    private static func value<T: Decodable>(_ c: KeyedDecodingContainer<CodingKeys>, _ key: CodingKeys) -> T? {
        do {
            return try c.decodeIfPresent(T.self, forKey: key)
        } catch {
            return nil
        }
    }

    private static func date(_ c: KeyedDecodingContainer<CodingKeys>) -> Date? {
        if let date: Date = value(c, .scheduledAt) { return date }
        if let raw: String = value(c, .scheduledAt) { return parseDate(raw) }
        return nil
    }

    private static func parseDate(_ raw: String) -> Date? {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }
        let withFraction = ISO8601DateFormatter()
        withFraction.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = withFraction.date(from: trimmed) { return date }
        let plain = ISO8601DateFormatter()
        plain.formatOptions = [.withInternetDateTime]
        if let date = plain.date(from: trimmed) { return date }
        // MySQL "YYYY-MM-DD HH:MM:SS" and zone-less ISO are UTC instants from the server.
        var normalized = trimmed.replacingOccurrences(of: " ", with: "T")
        let hasZone = normalized.hasSuffix("Z")
            || normalized.range(of: #"[+-]\d{2}:?\d{2}$"#, options: .regularExpression) != nil
        if !hasZone { normalized += "Z" }
        if let date = withFraction.date(from: normalized) { return date }
        return plain.date(from: normalized)
    }
}

extension ProgramBundle {
    /// Joinable sessions we know about, soonest first. The same session can arrive
    /// both as `nextSession` and on a module; the id keeps one copy.
    func upcomingSessions(now: Date = Date()) -> [ProgramSession] {
        var byId: [Int: ProgramSession] = [:]
        var unkeyed: [ProgramSession] = []
        for session in [nextSession].compactMap({ $0 }) + modules.compactMap(\.session) {
            guard session.isUpcoming(at: now) else { continue }
            if session.id > 0 {
                byId[session.id] = session
            } else {
                unkeyed.append(session)
            }
        }
        return (Array(byId.values) + unkeyed).sorted {
            ($0.scheduledAt ?? .distantFuture) < ($1.scheduledAt ?? .distantFuture)
        }
    }

    func nextUpcomingSession(now: Date = Date()) -> ProgramSession? {
        upcomingSessions(now: now).first
    }
}

extension ProgramHub {
    func coachingReminders(now: Date = Date()) -> [CoachingReminder] {
        var byId: [Int: CoachingReminder] = [:]
        for program in programs {
            for session in program.upcomingSessions(now: now) {
                guard session.id > 0, let when = session.scheduledAt else { continue }
                byId[session.id] = CoachingReminder(
                    id: session.id,
                    scheduledAt: when,
                    programLabel: program.label
                )
            }
        }
        return Array(byId.values)
    }
}

struct ProgramAssignment: Decodable, Identifiable {
    var id: Int
    var moduleId: Int
    var question: String
    var order: Int
    /// "Homework" marks the lesson's written answer. Older responses omit it.
    var title: String?
}

struct ProgramSubmission: Decodable, Identifiable {
    var id: Int
    var assignmentId: Int
    var answer: String?
    var fileUrl: String?
    var feedback: String?
}

struct ProgramFile: Decodable, Identifiable {
    var id: Int
    var fileName: String
    var fileUrl: String
    var source: String
    var libraryFileId: Int?
    var listId: String { "\(source)-\(id)" }
}

struct ProgramFormCard: Decodable, Identifiable, Hashable {
    var id: Int
    var title: String
    var kind: String
    var label: String
    var status: String
    var moduleId: Int?
    var sourceFileIds: [Int]

    var isDone: Bool { status == "submitted" || status == "reviewed" }
}

struct ProgramUploadResult: Decodable {
    var url: String
}

private struct AssignmentInput: Encodable {
    var assignmentId: Int
    var answer: String?
    var fileUrl: String?
}

private struct FileUploadInput: Encodable {
    var enrollmentId: Int
    var fileName: String
    var mimeType: String
    var base64Data: String
}

@MainActor
@Observable
final class ProgramsModel {
    var hub: ProgramHub?
    var selectedProgram: String?
    var errorMessage: String?
    var notice: String?
    var loading = false
    var sendingAssignmentId: Int?
    private let auth: AuthStore
    private var loadGeneration = 0

    init(auth: AuthStore) { self.auth = auth }

    var current: ProgramBundle? {
        guard let hub else { return nil }
        if let selectedProgram, let match = hub.programs.first(where: { $0.program == selectedProgram }) {
            return match
        }
        return hub.programs.first
    }

    /// Hub reads always skip the URL cache. Pull-to-refresh and foreground use the same path.
    func load(bypassCache: Bool = true) async {
        guard auth.isSignedIn else {
            hub = nil
            let token = await CoachingReminderCoordinator.shared.begin()
            await CoachingReminderCoordinator.shared.apply(token: token, reminders: [])
            return
        }
        loadGeneration += 1
        let generation = loadGeneration
        let reminderToken = await CoachingReminderCoordinator.shared.begin()
        loading = hub == nil
        defer {
            if generation == loadGeneration { loading = false }
        }
        do {
            let policy: URLRequest.CachePolicy = bypassCache ? .reloadIgnoringLocalCacheData : .useProtocolCachePolicy
            let next: ProgramHub = try await auth.client.query("reclaimHub.myHub", cachePolicy: policy)
            guard generation == loadGeneration, auth.isSignedIn else { return }
            hub = next
            if selectedProgram == nil {
                selectedProgram = next.programs.first?.program
            }
            errorMessage = nil
            await CoachingReminderCoordinator.shared.apply(token: reminderToken, reminders: next.coachingReminders())
        } catch {
            guard generation == loadGeneration else { return }
            if !error.isCancellation { errorMessage = error.localizedDescription }
        }
    }

    func submit(assignmentId: Int, answer: String?, file: Data?, fileName: String, mimeType: String) async {
        let text = answer?.trimmingCharacters(in: .whitespacesAndNewlines)
        let hasText = text?.isEmpty == false
        if file != nil && current?.enrollment?.id == nil {
            errorMessage = "This program is not open for uploads yet."
            return
        }
        if !hasText && file == nil {
            errorMessage = "Write an answer or add a photo."
            return
        }
        sendingAssignmentId = assignmentId
        defer { sendingAssignmentId = nil }
        do {
            var fileUrl: String?
            if let file, let enrollmentId = current?.enrollment?.id {
                let uploaded: ProgramUploadResult = try await auth.client.mutate(
                    "clientFiles.upload",
                    input: FileUploadInput(
                        enrollmentId: enrollmentId,
                        fileName: fileName,
                        mimeType: mimeType,
                        base64Data: file.base64EncodedString()
                    )
                )
                fileUrl = uploaded.url
            }
            if (text == nil || text?.isEmpty == true) && fileUrl == nil {
                errorMessage = "Write an answer or add a photo."
                return
            }
            let _: SuccessFlag = try await auth.client.mutate(
                "reclaimHub.submitAssignment",
                input: AssignmentInput(assignmentId: assignmentId, answer: text?.isEmpty == true ? nil : text, fileUrl: fileUrl)
            )
            notice = "Sent to Lee Anne."
            errorMessage = nil
            await load()
        } catch {
            if !error.isCancellation { errorMessage = error.localizedDescription }
        }
    }
}

private enum ProgramPaneItem: Hashable {
    case module(Int)
    case form(Int)
    case file(ProgramFilePreview)
}

/// Module answer text, kept across a fold so the compact page shows the same draft.
@MainActor
@Observable
final class AssignmentDraftStore {
    var drafts: [Int: String] = [:]
}

struct ProgramsView: View {
    var auth: AuthStore
    @State private var model: ProgramsModel
    @State private var preview: ProgramFilePreview?
    @State private var paneItem: ProgramPaneItem?
    @State private var moduleFullScreen = false
    @State private var formCache = FormSessionCache()
    @State private var moduleDrafts = AssignmentDraftStore()
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.duoPosture) private var posture

    init(auth: AuthStore) {
        self.auth = auth
        _model = State(initialValue: ProgramsModel(auth: auth))
    }

    /// Inner display: side by side, or tabletop with the list above and the detail below.
    private var detailInPane: Bool {
        posture == .sideBySide || posture == .tabletop
    }

    /// A form or module opened on the inner display stays on screen when the phone folds.
    private var showingCompactDetail: Bool {
        guard posture == .compact else { return false }
        switch paneItem {
        case .module, .form: return true
        case .file, nil: return false
        }
    }

    var body: some View {
        NavigationStack {
            DuoPanes(style: .augment) {
            Group {
                if showingCompactDetail, let paneItem {
                    compactDetail(paneItem)
                } else if !auth.isSignedIn {
                    signedOut
                } else if model.loading && model.hub == nil {
                    ProgressView("Opening your programs")
                        .tint(HTTheme.gold)
                } else if let current = model.current {
                    programList(current)
                } else {
                    emptyState
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(HTTheme.cream)
            .navigationTitle(showingCompactDetail ? compactTitle : "My Programs")
            .navigationBarTitleDisplayMode(showingCompactDetail ? .inline : .large)
            .toolbar {
                if showingCompactDetail {
                    ToolbarItem(placement: .topBarLeading) {
                        Button {
                            paneItem = nil
                        } label: {
                            HStack(spacing: 4) {
                                Image(systemName: "chevron.backward")
                                Text("My Programs")
                            }
                        }
                        .accessibilityLabel("Back to My Programs")
                    }
                } else {
                    ToolbarItem(placement: .topBarTrailing) {
                        ProfileAvatarButton(auth: auth)
                    }
                }
            }
            .task(id: auth.isSignedIn) { await model.load(bypassCache: true) }
            .onChange(of: scenePhase) { _, phase in
                guard phase == .active, auth.isSignedIn else { return }
                Task { await model.load(bypassCache: true) }
            }
            .onChange(of: auth.isSignedIn) { _, signedIn in
                if !signedIn { paneItem = nil }
            }
            .onChange(of: model.selectedProgram) { _, _ in
                paneItem = nil
            }
            .onChange(of: paneItem) { previous, _ in
                guard case .form = previous else { return }
                Task { await model.load(bypassCache: true) }
            }
            .onChange(of: posture) { _, new in
                guard new == .compact, case .file(let file) = paneItem else { return }
                preview = file
                paneItem = nil
            }
            .sheet(item: $preview) { item in
                InAppFilePreview(remote: item.url, name: item.name)
            }
            .fullScreenCover(isPresented: $moduleFullScreen) {
                if case .module(let id) = paneItem {
                    NavigationStack {
                        ProgramModuleView(
                            moduleId: id,
                            model: model,
                            auth: auth,
                            sharedDrafts: moduleDrafts,
                            formCache: formCache
                        )
                        .toolbar {
                            ToolbarItem(placement: .cancellationAction) {
                                Button("Close") { moduleFullScreen = false }
                            }
                        }
                    }
                }
            }
            } controls: {
                if let paneItem {
                    detailPane(paneItem)
                } else {
                    programControls
                }
            }
        }
    }

    private var compactTitle: String {
        switch paneItem {
        case .module(let id):
            if let module = model.current?.modules.first(where: { $0.id == id }) {
                return "Module \(module.order)"
            }
            return "Module"
        case .form(let id):
            return formCache.existing(formId: id)?.detail?.form.title ?? "Worksheet"
        case .file(let file):
            return file.name
        case nil:
            return "My Programs"
        }
    }

    private func openInPane(_ item: ProgramPaneItem) {
        if case .form(let id) = item {
            _ = formCache.session(auth: auth, formId: id)
        }
        paneItem = item
    }

    private func detailPane(_ item: ProgramPaneItem) -> some View {
        detailView(item, embedded: true)
            .safeAreaInset(edge: .top, spacing: 0) {
                HStack {
                    Button {
                        paneItem = nil
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "chevron.backward")
                                .font(.caption.weight(.bold))
                            Text("Close")
                                .font(.subheadline.weight(.semibold))
                        }
                        .foregroundStyle(HTTheme.forest)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(HTTheme.gold.opacity(0.2))
                        .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Close and return to the program summary")
                    Spacer()
                    if case .module = item {
                        Button {
                            moduleFullScreen = true
                        } label: {
                            Image(systemName: "arrow.up.left.and.arrow.down.right")
                                .font(.subheadline.weight(.bold))
                                .foregroundStyle(HTTheme.forest)
                                .padding(8)
                                .background(HTTheme.gold.opacity(0.2))
                                .clipShape(Circle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Full screen")
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 10)
                .padding(.bottom, 8)
                .background(HTTheme.cream)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            .background(HTTheme.cream)
    }

    private func compactDetail(_ item: ProgramPaneItem) -> some View {
        detailView(item, embedded: false)
    }

    @ViewBuilder
    private func detailView(_ item: ProgramPaneItem, embedded: Bool) -> some View {
        switch item {
        case .module(let id):
            ProgramModuleView(
                moduleId: id,
                model: model,
                auth: auth,
                embedded: embedded,
                sharedDrafts: moduleDrafts,
                formCache: formCache,
                onOpenForm: embedded ? { openInPane(.form($0)) } : nil
            )
            .id(item)
        case .form(let id):
            FormFillView(
                auth: auth,
                formId: id,
                embedded: embedded,
                session: formCache.session(auth: auth, formId: id)
            )
            .id(item)
        case .file(let file):
            InAppFilePreview(remote: file.url, name: file.name) {
                paneItem = nil
            }
            .id(item)
        }
    }

    @ViewBuilder
    private var programControls: some View {
        DuoControlWell {
            if let current = model.current {
                Text(current.label)
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(HTTheme.forest)
                if let session = current.nextUpcomingSession(), let when = session.scheduledAt {
                    NextSessionCard(when: when, joinURL: session.joinURL)
                } else {
                    Text("No session on the calendar.")
                        .foregroundStyle(HTTheme.muted)
                }
                Text("\(current.modules.count) modules")
                    .foregroundStyle(HTTheme.muted)
            } else {
                Text("Sign in to see your program.")
                    .foregroundStyle(HTTheme.muted)
            }
        }
    }

    private var signedOut: some View {
        VStack(spacing: 12) {
            Text("Your programs live here")
                .font(HTTheme.title)
                .foregroundStyle(HTTheme.forest)
            Text("Sign in and you'll see the modules, assignments, and files Lee Anne has opened for you.")
                .font(.body)
                .foregroundStyle(HTTheme.muted)
                .multilineTextAlignment(.center)
        }
        .padding(28)
    }

    private var emptyState: some View {
        ScrollView {
            VStack(spacing: 12) {
                Text("Nothing here yet")
                    .font(HTTheme.title)
                    .foregroundStyle(HTTheme.forest)
                Text(model.errorMessage ?? "When you join a program, it will show up in this quiet little list.")
                    .font(.body)
                    .foregroundStyle(HTTheme.muted)
                    .multilineTextAlignment(.center)
            }
            .padding(28)
            .frame(maxWidth: .infinity)
        }
        .refreshable { await model.load(bypassCache: true) }
        .dockScrollClearance()
        .keyboardTyping()
    }

    private func programList(_ current: ProgramBundle) -> some View {
        let forms = current.forms ?? []
        let files = shownFiles(in: current)
        return ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                if (model.hub?.programs.count ?? 0) > 1 {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(model.hub?.programs ?? []) { program in
                                Button(program.label) {
                                    guard model.selectedProgram != program.program else { return }
                                    model.selectedProgram = program.program
                                    paneItem = nil
                                }
                                .font(.subheadline.weight(.semibold))
                                .padding(.horizontal, 14)
                                .padding(.vertical, 8)
                                .background(program.program == current.program ? HTTheme.forest : Color.white)
                                .foregroundStyle(program.program == current.program ? Color.white : HTTheme.forest)
                                .clipShape(Capsule())
                            }
                        }
                    }
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxHeight: 48)
                }

                Text(current.label)
                    .font(HTTheme.title)
                    .foregroundStyle(HTTheme.forest)

                if let session = current.nextUpcomingSession(), let when = session.scheduledAt {
                    NextSessionCard(when: when, joinURL: session.joinURL)
                }

                if let notice = model.notice {
                    Text(notice).font(.footnote).foregroundStyle(HTTheme.forest)
                }
                if let errorMessage = model.errorMessage {
                    Text(errorMessage).font(.footnote).foregroundStyle(.red)
                }

                if current.modules.isEmpty {
                    Text("Lee Anne hasn't opened a module in this program yet.")
                        .foregroundStyle(HTTheme.muted)
                }

                ForEach(current.modules) { module in
                    if detailInPane {
                        Button {
                            openInPane(.module(module.id))
                        } label: {
                            moduleCard(module)
                        }
                        .buttonStyle(.plain)
                        .modifier(PaneHighlight(on: paneItem == .module(module.id)))
                    } else {
                        NavigationLink {
                            ProgramModuleView(moduleId: module.id, model: model, auth: auth)
                        } label: {
                            moduleCard(module)
                        }
                        .buttonStyle(.plain)
                    }
                }

                if !forms.isEmpty {
                    Text("Assignments & forms")
                        .font(.headline)
                        .foregroundStyle(HTTheme.forest)
                    ForEach(forms) { form in
                        if detailInPane {
                            Button {
                                openInPane(.form(form.id))
                            } label: {
                                formCard(form)
                            }
                            .buttonStyle(.plain)
                            .modifier(PaneHighlight(on: paneItem == .form(form.id)))
                        } else {
                            NavigationLink {
                                FormFillView(auth: auth, formId: form.id, session: formCache.existing(formId: form.id))
                                    .onDisappear { Task { await model.load(bypassCache: true) } }
                            } label: {
                                formCard(form)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }

                if !files.isEmpty {
                    Text("Files")
                        .font(.headline)
                        .foregroundStyle(HTTheme.forest)
                    ForEach(files, id: \.listId) { file in
                        Button {
                            openFile(file)
                        } label: {
                            HTCard(spacing: 4) {
                                Text(file.fileName)
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundStyle(HTTheme.forest)
                                Text(file.source == "library" ? "From your program" : "Your file")
                                    .font(.caption)
                                    .foregroundStyle(HTTheme.muted)
                            }
                        }
                        .buttonStyle(.plain)
                        .modifier(PaneHighlight(on: selectedFileId == file.listId))
                    }
                }
            }
            .padding(20)
        }
        .dockScrollClearance()
        .keyboardTyping()
        .refreshable { await model.load(bypassCache: true) }
    }

    private func moduleCard(_ module: ProgramModule) -> some View {
        HTCard {
            Text("Module \(module.order)")
                .font(.caption.weight(.bold))
                .foregroundStyle(HTTheme.gold)
            Text(module.title)
                .font(.title3.weight(.semibold))
                .foregroundStyle(HTTheme.forest)
            if let description = module.description, !description.isEmpty {
                Text(description)
                    .font(.subheadline)
                    .foregroundStyle(HTTheme.muted)
                    .lineLimit(3)
            }
        }
    }

    private var selectedFileId: String? {
        guard detailInPane, case .file(let file) = paneItem else { return nil }
        return file.id
    }

    private func formCard(_ form: ProgramFormCard) -> some View {
        HTCard {
            HStack {
                Text(form.label.isEmpty ? (form.kind == "handout" ? "Assignment" : "Form") : form.label)
                    .font(.caption.weight(.bold))
                    .foregroundStyle(HTTheme.gold)
                Spacer()
                if form.isDone {
                    Text("Done")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(HTTheme.forest)
                } else if form.status == "draft" {
                    Text("Draft")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(HTTheme.muted)
                }
            }
            Text(form.title)
                .font(.title3.weight(.semibold))
                .foregroundStyle(HTTheme.forest)
        }
    }

    private func shownFiles(in bundle: ProgramBundle) -> [ProgramFile] {
        let replaced = Set((bundle.forms ?? []).flatMap(\.sourceFileIds))
        guard !replaced.isEmpty else { return bundle.files }
        return bundle.files.filter { file in
            if let libraryId = file.libraryFileId, replaced.contains(libraryId) { return false }
            if file.source == "library", replaced.contains(file.id) { return false }
            return true
        }
    }

    private func openFile(_ file: ProgramFile) {
        guard let url = URL(string: file.fileUrl) else { return }
        let item = ProgramFilePreview(id: file.listId, url: url, name: file.fileName)
        if detailInPane {
            paneItem = .file(item)
        } else {
            preview = item
        }
    }
}

private struct PaneHighlight: ViewModifier {
    var on: Bool

    func body(content: Content) -> some View {
        content
            .overlay {
                if on {
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .strokeBorder(HTTheme.gold, lineWidth: 2)
                        .allowsHitTesting(false)
                }
            }
            .overlay(alignment: .leading) {
                if on {
                    Capsule()
                        .fill(HTTheme.forest)
                        .frame(width: 4)
                        .padding(.vertical, 18)
                        .padding(.leading, 8)
                        .allowsHitTesting(false)
                }
            }
            .accessibilityAddTraits(on ? .isSelected : AccessibilityTraits())
    }
}

/// Date and time use the device calendar and time zone.
struct NextSessionCard: View {
    var when: Date
    var joinURL: URL?

    var body: some View {
        HTCard {
            Text("Next session")
                .font(.caption.weight(.bold))
                .foregroundStyle(HTTheme.gold)
            Text(when.formatted(.dateTime.weekday(.wide).month(.wide).day().year().hour().minute()))
                .font(.title3.weight(.semibold))
                .foregroundStyle(HTTheme.forest)
                .fixedSize(horizontal: false, vertical: true)
            if let joinURL {
                Button("Join") {
                    UIApplication.shared.open(joinURL)
                }
                .font(.subheadline.weight(.bold))
                .padding(.horizontal, 18)
                .padding(.vertical, 8)
                .background(HTTheme.gold)
                .foregroundStyle(Color.white)
                .clipShape(Capsule())
                .buttonStyle(.plain)
                .accessibilityHint("Opens the meeting link")
            }
        }
        .accessibilityElement(children: .contain)
    }
}

private struct ProgramModuleView: View {
    var moduleId: Int
    @Bindable var model: ProgramsModel
    var auth: AuthStore
    var embedded = false
    var sharedDrafts: AssignmentDraftStore? = nil
    var formCache: FormSessionCache? = nil
    var onOpenForm: ((Int) -> Void)? = nil
    @State private var localDrafts: [Int: String] = [:]
    @State private var preview: ProgramFilePreview?
    @State private var video: IdentifiedURL?

    private var draftsBinding: Binding<[Int: String]> {
        if let sharedDrafts {
            return Binding(
                get: { sharedDrafts.drafts },
                set: { sharedDrafts.drafts = $0 }
            )
        }
        return $localDrafts
    }

    private var bundle: ProgramBundle? { model.current }
    private var module: ProgramModule? { bundle?.modules.first { $0.id == moduleId } }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                if let module {
                    Text(module.title)
                        .font(HTTheme.title)
                        .foregroundStyle(HTTheme.forest)
                    if let description = module.description, !description.isEmpty {
                        Text(description)
                            .foregroundStyle(HTTheme.muted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    if let session = bundle?.nextUpcomingSession(), let when = session.scheduledAt {
                        NextSessionCard(when: when, joinURL: session.joinURL)
                    }
                    if let content = module.content, !content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        let sections = programLessonSections(from: content)
                        let inlineId = homeworkAssignmentId(moduleId: module.id, sections: sections)
                        ForEach(Array(sections.enumerated()), id: \.offset) { _, section in
                            if !section.blocks.isEmpty {
                                ProgramRichText(blocks: section.blocks)
                            }
                            if section.answerAfter, let inlineId, let bundle {
                                assignmentTask(inlineId, bundle: bundle, showsQuestion: false)
                            }
                        }
                    }
                    if let videoUrl = module.videoUrl, let url = URL(string: videoUrl) {
                        Button("Watch the lesson") { video = IdentifiedURL(url: url) }
                            .font(.subheadline.weight(.bold))
                            .foregroundStyle(HTTheme.gold)
                    }
                    if let pdfUrl = module.pdfUrl, let url = URL(string: pdfUrl) {
                        Button("Open the worksheet") {
                            let name = url.lastPathComponent.isEmpty ? "Worksheet" : (url.lastPathComponent.removingPercentEncoding ?? url.lastPathComponent)
                            preview = ProgramFilePreview(id: "pdf-\(module.id)", url: url, name: name)
                        }
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(HTTheme.gold)
                    }
                    if let bundle {
                        let inlineId = module.content.map { homeworkAssignmentId(moduleId: module.id, sections: programLessonSections(from: $0)) } ?? nil
                        let tasks = bundle.assignments
                            .filter { $0.moduleId == module.id && $0.id != inlineId }
                            .sorted { $0.order < $1.order }
                        ForEach(tasks) { task in
                            assignmentTask(task.id, bundle: bundle)
                        }
                    }
                } else {
                    Text("This module is no longer open.")
                        .foregroundStyle(HTTheme.muted)
                }
            }
            .padding(20)
        }
        .dockScrollClearance()
        .keyboardTyping()
        .refreshable { await model.load(bypassCache: true) }
        .background(HTTheme.cream)
        .modifier(ModuleNavigationChrome(
            embedded: embedded,
            title: module.map { "Module \($0.order)" } ?? "Module"
        ))
        .onAppear(perform: fillDrafts)
        .onChange(of: bundle?.submissions.count) { _, _ in fillDrafts() }
        .sheet(item: $preview) { item in
            InAppFilePreview(remote: item.url, name: item.name)
        }
        .sheet(item: $video) { item in
            InAppSafari(url: item.url)
        }
    }

    private func homeworkAssignmentId(moduleId: Int, sections: [ProgramLessonSection]) -> Int? {
        guard sections.contains(where: { $0.answerAfter }), let bundle else { return nil }
        return bundle.assignments.first { task in
            task.moduleId == moduleId
                && task.title?.trimmingCharacters(in: .whitespacesAndNewlines).caseInsensitiveCompare("Homework") == .orderedSame
        }?.id
    }

    @ViewBuilder
    private func assignmentTask(_ taskId: Int, bundle: ProgramBundle, showsQuestion: Bool = true) -> some View {
        if let task = bundle.assignments.first(where: { $0.id == taskId }) {
            if let form = (bundle.forms ?? []).first(where: { $0.id == task.id }) {
                if let onOpenForm {
                    Button {
                        onOpenForm(form.id)
                    } label: {
                        moduleFormCard(form)
                    }
                    .buttonStyle(.plain)
                } else {
                    NavigationLink {
                        FormFillView(
                            auth: auth,
                            formId: form.id,
                            session: formCache?.existing(formId: form.id)
                        )
                        .onDisappear { Task { await model.load(bypassCache: true) } }
                    } label: {
                        moduleFormCard(form)
                    }
                    .buttonStyle(.plain)
                }
            } else {
                AssignmentComposer(
                    task: task,
                    bundle: bundle,
                    model: model,
                    drafts: draftsBinding,
                    showsQuestion: showsQuestion
                )
            }
        }
    }

    private func moduleFormCard(_ form: ProgramFormCard) -> some View {
        HTCard {
            Text(form.label)
                .font(.caption.weight(.bold))
                .foregroundStyle(HTTheme.gold)
            Text(form.title)
                .font(.body.weight(.semibold))
                .foregroundStyle(HTTheme.forest)
            if form.isDone {
                Text("Done")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(HTTheme.forest)
            }
        }
    }

    private func fillDrafts() {
        guard let bundle, let module else { return }
        var map = draftsBinding.wrappedValue
        var changed = false
        for task in bundle.assignments where task.moduleId == module.id {
            if map[task.id] == nil {
                map[task.id] = bundle.submissions.first { $0.assignmentId == task.id }?.answer ?? ""
                changed = true
            }
        }
        if changed { draftsBinding.wrappedValue = map }
    }
}

/// Pushed module pages keep their navigation title. The Duo pane leaves the list title alone.
private struct ModuleNavigationChrome: ViewModifier {
    var embedded: Bool
    var title: String

    @ViewBuilder
    func body(content: Content) -> some View {
        if embedded {
            content
        } else {
            content
                .navigationTitle(title)
                .navigationBarTitleDisplayMode(.inline)
        }
    }
}

private struct AssignmentComposer: View {
    var task: ProgramAssignment
    var bundle: ProgramBundle
    var model: ProgramsModel
    @Binding var drafts: [Int: String]
    var showsQuestion: Bool = true
    @State private var photoItem: PhotosPickerItem?
    @State private var showFiles = false

    var body: some View {
        let submission = bundle.submissions.first { $0.assignmentId == task.id }
        HTCard {
            if showsQuestion {
                Text(task.question)
                    .font(.body.weight(.semibold))
                    .foregroundStyle(HTTheme.forest)
            }
            TextField("Your answer", text: Binding(
                get: { drafts[task.id] ?? "" },
                set: { drafts[task.id] = $0 }
            ), axis: .vertical)
            .lineLimit(3...8)
            .padding(10)
            .background(HTTheme.cream)
            .clipShape(RoundedRectangle(cornerRadius: 12))

            HStack(spacing: 8) {
                PhotosPicker(selection: $photoItem, matching: .images) {
                    Text("Photo")
                        .font(.caption.weight(.bold))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Color.white)
                        .clipShape(Capsule())
                        .overlay(Capsule().stroke(HTTheme.roseBorder))
                }
                Button("File") { showFiles = true }
                    .font(.caption.weight(.bold))
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color.white)
                    .clipShape(Capsule())
                    .overlay(Capsule().stroke(HTTheme.roseBorder))
                Button(model.sendingAssignmentId == task.id ? "Sending…" : "Send") {
                    Task {
                        await model.submit(
                            assignmentId: task.id,
                            answer: drafts[task.id],
                            file: nil,
                            fileName: "",
                            mimeType: ""
                        )
                    }
                }
                .font(.caption.weight(.bold))
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(HTTheme.gold)
                .foregroundStyle(Color.white)
                .clipShape(Capsule())
                .disabled(model.sendingAssignmentId == task.id)
            }
            .foregroundStyle(HTTheme.forest)

            if let feedback = submission?.feedback, !feedback.isEmpty {
                Text("From Lee Anne")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(HTTheme.gold)
                Text(feedback).foregroundStyle(HTTheme.forest)
            }
            if submission?.fileUrl != nil {
                Text("A file is already attached.")
                    .font(.caption)
                    .foregroundStyle(HTTheme.muted)
            }
        }
        .onChange(of: photoItem) { _, item in
            guard let item else { return }
            Task {
                if let data = try? await item.loadTransferable(type: Data.self) {
                    await model.submit(
                        assignmentId: task.id,
                        answer: drafts[task.id],
                        file: data,
                        fileName: "photo.jpg",
                        mimeType: "image/jpeg"
                    )
                }
                photoItem = nil
            }
        }
        .fileImporter(isPresented: $showFiles, allowedContentTypes: [.item]) { result in
            guard case .success(let url) = result else { return }
            Task {
                let didAccess = url.startAccessingSecurityScopedResource()
                defer { if didAccess { url.stopAccessingSecurityScopedResource() } }
                if let data = try? Data(contentsOf: url) {
                    await model.submit(
                        assignmentId: task.id,
                        answer: drafts[task.id],
                        file: data,
                        fileName: url.lastPathComponent,
                        mimeType: "application/octet-stream"
                    )
                }
            }
        }
    }
}

