import Foundation
import PhotosUI
import SwiftUI
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
}

struct ProgramAssignment: Decodable, Identifiable {
    var id: Int
    var moduleId: Int
    var question: String
    var order: Int
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
            return
        }
        loadGeneration += 1
        let generation = loadGeneration
        loading = hub == nil
        defer {
            if generation == loadGeneration { loading = false }
        }
        do {
            let policy: URLRequest.CachePolicy = bypassCache ? .reloadIgnoringLocalCacheData : .useProtocolCachePolicy
            let next: ProgramHub = try await auth.client.query("reclaimHub.myHub", cachePolicy: policy)
            guard generation == loadGeneration else { return }
            hub = next
            if selectedProgram == nil {
                selectedProgram = next.programs.first?.program
            }
            errorMessage = nil
        } catch {
            guard generation == loadGeneration else { return }
            errorMessage = error.localizedDescription
        }
    }

    func submit(assignmentId: Int, answer: String?, file: Data?, fileName: String, mimeType: String) async {
        guard let enrollmentId = current?.enrollment?.id else {
            errorMessage = "This program is not open for uploads yet."
            return
        }
        let text = answer?.trimmingCharacters(in: .whitespacesAndNewlines)
        sendingAssignmentId = assignmentId
        defer { sendingAssignmentId = nil }
        do {
            var fileUrl: String?
            if let file {
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
            errorMessage = error.localizedDescription
        }
    }
}

struct ProgramsView: View {
    var auth: AuthStore
    @State private var model: ProgramsModel
    @State private var preview: ProgramFilePreview?
    @Environment(\.scenePhase) private var scenePhase

    init(auth: AuthStore) {
        self.auth = auth
        _model = State(initialValue: ProgramsModel(auth: auth))
    }

    var body: some View {
        NavigationStack {
            Group {
                if !auth.isSignedIn {
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
            .navigationTitle("My Programs")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    ProfileAvatarButton(auth: auth)
                }
            }
            .task(id: auth.isSignedIn) { await model.load(bypassCache: true) }
            .onChange(of: scenePhase) { _, phase in
                guard phase == .active, auth.isSignedIn else { return }
                Task { await model.load(bypassCache: true) }
            }
            .sheet(item: $preview) { item in
                InAppFilePreview(remote: item.url, name: item.name)
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
                                    model.selectedProgram = program.program
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
                    NavigationLink {
                        ProgramModuleView(moduleId: module.id, model: model, auth: auth)
                    } label: {
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
                    .buttonStyle(.plain)
                }

                if !forms.isEmpty {
                    Text("Assignments & forms")
                        .font(.headline)
                        .foregroundStyle(HTTheme.forest)
                    ForEach(forms) { form in
                        NavigationLink {
                            FormFillView(auth: auth, formId: form.id)
                                .onDisappear { Task { await model.load(bypassCache: true) } }
                        } label: {
                            formCard(form)
                        }
                        .buttonStyle(.plain)
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
                    }
                }
            }
            .padding(20)
        }
        .dockScrollClearance()
        .keyboardTyping()
        .refreshable { await model.load(bypassCache: true) }
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
        preview = ProgramFilePreview(id: file.listId, url: url, name: file.fileName)
    }
}

private struct ProgramModuleView: View {
    var moduleId: Int
    @Bindable var model: ProgramsModel
    var auth: AuthStore
    @State private var drafts: [Int: String] = [:]
    @State private var preview: ProgramFilePreview?
    @State private var video: IdentifiedURL?

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
                    if let content = module.content, !content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        ProgramRichText(source: content)
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
                        let tasks = bundle.assignments.filter { $0.moduleId == module.id }.sorted { $0.order < $1.order }
                        ForEach(tasks) { task in
                            if let form = (bundle.forms ?? []).first(where: { $0.id == task.id }) {
                                NavigationLink {
                                    FormFillView(auth: auth, formId: form.id)
                                        .onDisappear { Task { await model.load(bypassCache: true) } }
                                } label: {
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
                                .buttonStyle(.plain)
                            } else {
                                AssignmentComposer(task: task, bundle: bundle, model: model, drafts: $drafts)
                            }
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
        .navigationTitle(module.map { "Module \($0.order)" } ?? "Module")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear(perform: fillDrafts)
        .onChange(of: bundle?.submissions.count) { _, _ in fillDrafts() }
        .sheet(item: $preview) { item in
            InAppFilePreview(remote: item.url, name: item.name)
        }
        .sheet(item: $video) { item in
            InAppSafari(url: item.url)
        }
    }

    private func fillDrafts() {
        guard let bundle, let module else { return }
        for task in bundle.assignments where task.moduleId == module.id {
            if drafts[task.id] == nil {
                drafts[task.id] = bundle.submissions.first { $0.assignmentId == task.id }?.answer ?? ""
            }
        }
    }
}

private struct AssignmentComposer: View {
    var task: ProgramAssignment
    var bundle: ProgramBundle
    var model: ProgramsModel
    @Binding var drafts: [Int: String]
    @State private var photoItem: PhotosPickerItem?
    @State private var showFiles = false

    var body: some View {
        let submission = bundle.submissions.first { $0.assignmentId == task.id }
        HTCard {
            Text(task.question)
                .font(.body.weight(.semibold))
                .foregroundStyle(HTTheme.forest)
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

