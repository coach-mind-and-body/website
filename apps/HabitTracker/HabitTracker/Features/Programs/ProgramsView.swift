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
    var listId: String { "\(source)-\(id)" }
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

    init(auth: AuthStore) { self.auth = auth }

    var current: ProgramBundle? {
        guard let hub else { return nil }
        if let selectedProgram, let match = hub.programs.first(where: { $0.program == selectedProgram }) {
            return match
        }
        return hub.programs.first
    }

    func load() async {
        guard auth.isSignedIn else {
            hub = nil
            return
        }
        loading = hub == nil
        defer { loading = false }
        do {
            let next: ProgramHub = try await auth.client.query("reclaimHub.myHub")
            hub = next
            if selectedProgram == nil {
                selectedProgram = next.programs.first?.program
            }
            errorMessage = nil
        } catch {
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
            .task(id: auth.isSignedIn) { await model.load() }
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
    }

    private func programList(_ current: ProgramBundle) -> some View {
        ScrollView {
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
                        ProgramModuleView(moduleId: module.id, model: model)
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

                if !current.files.isEmpty {
                    Text("Files")
                        .font(.headline)
                        .foregroundStyle(HTTheme.forest)
                    ForEach(current.files, id: \.listId) { file in
                        Link(destination: URL(string: file.fileUrl) ?? URL(string: "https://mindandbodyresetcoach.com")!) {
                            HTCard(spacing: 4) {
                                Text(file.fileName)
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundStyle(HTTheme.forest)
                                Text(file.source == "library" ? "From your program" : "Your file")
                                    .font(.caption)
                                    .foregroundStyle(HTTheme.muted)
                            }
                        }
                    }
                }
            }
            .padding(20)
            .dockScrollClearance()
        }
    }
}

private struct ProgramModuleView: View {
    var moduleId: Int
    @Bindable var model: ProgramsModel
    @State private var drafts: [Int: String] = [:]

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
                        Text(description).foregroundStyle(HTTheme.muted)
                    }
                    if let plain = plainText(module.content), !plain.isEmpty {
                        Text(plain).foregroundStyle(HTTheme.forest)
                    }
                    if let videoUrl = module.videoUrl, let url = URL(string: videoUrl) {
                        Link("Watch the lesson", destination: url)
                            .font(.subheadline.weight(.bold))
                            .foregroundStyle(HTTheme.gold)
                    }
                    if let pdfUrl = module.pdfUrl, let url = URL(string: pdfUrl) {
                        Link("Open the worksheet", destination: url)
                            .font(.subheadline.weight(.bold))
                            .foregroundStyle(HTTheme.gold)
                    }
                    if let bundle {
                        let tasks = bundle.assignments.filter { $0.moduleId == module.id }.sorted { $0.order < $1.order }
                        ForEach(tasks) { task in
                            AssignmentComposer(task: task, bundle: bundle, model: model, drafts: $drafts)
                        }
                    }
                } else {
                    Text("This module is no longer open.")
                        .foregroundStyle(HTTheme.muted)
                }
            }
            .padding(20)
            .dockScrollClearance()
        }
        .background(HTTheme.cream)
        .navigationTitle(module.map { "Module \($0.order)" } ?? "Module")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear(perform: fillDrafts)
        .onChange(of: bundle?.submissions.count) { _, _ in fillDrafts() }
    }

    private func fillDrafts() {
        guard let bundle, let module else { return }
        for task in bundle.assignments where task.moduleId == module.id {
            if drafts[task.id] == nil {
                drafts[task.id] = bundle.submissions.first { $0.assignmentId == task.id }?.answer ?? ""
            }
        }
    }

    private func plainText(_ html: String?) -> String? {
        guard let html, !html.isEmpty else { return nil }
        let stripped = html.replacingOccurrences(of: "<[^>]+>", with: " ", options: .regularExpression)
        return stripped
            .replacingOccurrences(of: "&nbsp;", with: " ")
            .replacingOccurrences(of: "&amp;", with: "&")
            .replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
            .trimmingCharacters(in: .whitespacesAndNewlines)
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

