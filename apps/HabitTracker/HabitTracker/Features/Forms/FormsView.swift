import PhotosUI
import SwiftUI
import UIKit

struct ClientFormSummary: Codable, Identifiable {
    let id: Int
    var title: String
    var kind: String
    var status: String
    var programTags: [String]
    var sourceFileIds: [Int]?
}

struct FormFieldModel: Codable, Identifiable, Hashable {
    let id: String
    var type: String
    var label: String
    var help: String
    var required: Bool
    var options: [String]
    var rows: [String]
    var columns: [String]
    var content: String
    var allowExtraRows: Bool
    var scaleMin: Int?
    var scaleMax: Int?
    var scaleLow: String?
    var scaleHigh: String?
}

struct FormAnswerModel: Codable, Hashable {
    var text: String?
    var number: Double?
    var date: String?
    var choices: [String]?
    var checked: Bool?
    var scale: Int?
    var table: [[String]]?
    var photoKey: String?
}

struct FormPageModel: Codable, Identifiable, Hashable {
    let id: Int
    var fileName: String
    var fileUrl: String
    var mimeType: String?
}

struct FormTemplateModel: Codable {
    var id: Int
    var title: String
    var instructions: String
    var kind: String
    var content: String
    var fields: [FormFieldModel]
    var programTags: [String]
}

struct FormSubmissionModel: Codable {
    var id: Int
    var status: String
    var answers: [String: FormAnswerModel]
    var feedback: String?
}

struct FormDetailModel: Codable {
    var form: FormTemplateModel
    var submission: FormSubmissionModel?
    var pages: [FormPageModel]
}

struct LibraryListItemModel: Codable, Identifiable {
    var id: String
    var kind: String
    var refId: Int
    var title: String
    var programTags: [String]
    var pages: [FormPageModel]
}

private struct FormIdInput: Encodable { let formId: Int }
private struct SaveFormInput: Encodable { let formId: Int; let answers: [String: FormAnswerModel] }
private struct UploadPhotoInput: Encodable {
    let formId: Int
    let fieldId: String
    let mimeType: String
    let base64Data: String
}
private struct UploadPhotoResult: Decodable { let key: String }
private struct SaveFormResult: Decodable { let id: Int; let status: String }
private struct LibraryRefInput: Encodable { let kind: String; let id: Int }

struct FormsListView: View {
    @Bindable var auth: AuthStore
    @State private var forms: [ClientFormSummary] = []
    @State private var library: [LibraryListItemModel] = []
    @State private var errorMessage: String?

    var body: some View {
        DuoPanes(style: .augment) {
        List {
            if let errorMessage {
                Text(errorMessage).foregroundStyle(.red)
            }
            Section("Forms") {
                if forms.isEmpty {
                    Text("Nothing is published for your programs yet.")
                        .foregroundStyle(HTTheme.muted)
                }
                ForEach(forms) { form in
                    NavigationLink {
                        FormFillView(auth: auth, formId: form.id)
                    } label: {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(form.title).font(.headline).foregroundStyle(HTTheme.forest)
                            Text(form.kind == "handout" ? "Read" : statusLabel(form.status))
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(HTTheme.gold)
                        }
                        .padding(.vertical, 8)
                    }
                }
            }
            if !visibleLibrary.isEmpty {
                Section("Files") {
                    ForEach(visibleLibrary) { item in
                        NavigationLink {
                            LibraryPagesView(title: item.title, pages: item.pages)
                        } label: {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(item.title).foregroundStyle(HTTheme.forest)
                                Text("Original file")
                                    .font(.caption)
                                    .foregroundStyle(HTTheme.muted)
                            }
                            .padding(.vertical, 6)
                        }
                    }
                }
            }
        }
        .dockScrollClearance()
        .keyboardTyping()
        .navigationTitle("Worksheets")
        .task { await load() }
        .refreshable { await load() }
        } controls: {
            DuoControlWell {
                Text(forms.isEmpty ? "No worksheets yet" : "\(forms.count) worksheets")
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(HTTheme.forest)
                Text("Open one to read or fill it in. On a half-folded phone, the list stays up top and this note stays in reach.")
                    .foregroundStyle(HTTheme.muted)
            }
        }
    }

    private var visibleLibrary: [LibraryListItemModel] {
        let covered = Set(forms.flatMap { $0.sourceFileIds ?? [] })
        guard !covered.isEmpty else { return library }
        return library.filter { item in
            !item.pages.contains { covered.contains($0.id) }
        }
    }

    private func load() async {
        guard auth.isSignedIn else { return }
        do {
            forms = try await auth.client.query("forms.listMine")
            library = try await auth.client.query("forms.myLibrary")
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

/// Answers live on this class so the Duo pane and a folded compact page share one copy.
@MainActor
@Observable
final class FormFillSession {
    let formId: Int
    let auth: AuthStore
    var detail: FormDetailModel?
    var answers: [String: FormAnswerModel] = [:]
    var note = "Not started"
    var errorMessage: String?
    var ready = false
    var submitting = false
    var preview: ProgramFilePreview?
    @ObservationIgnored private var saveTask: Task<Void, Never>?
    @ObservationIgnored private var saveGeneration = 0
    @ObservationIgnored private var answersDirty = false
    @ObservationIgnored private var loadGeneration = 0

    init(auth: AuthStore, formId: Int) {
        self.auth = auth
        self.formId = formId
    }

    var canSubmit: Bool {
        guard let detail else { return false }
        return detail.form.kind != "handout" && detail.submission?.status != "reviewed"
    }

    func setAnswer(_ answer: FormAnswerModel, for id: String) {
        answers[id] = answer
        answersDirty = true
        scheduleSave()
    }

    func scheduleSave() {
        guard canSave else { return }
        saveTask?.cancel()
        saveGeneration += 1
        let generation = saveGeneration
        saveTask = Task {
            try? await Task.sleep(for: .milliseconds(800))
            guard !Task.isCancelled else { return }
            await self.persistDraft()
            if self.saveGeneration == generation {
                self.saveTask = nil
            }
        }
    }

    /// Writes pending answers immediately. A fold should not wait out the debounce.
    func flush() async {
        guard canSave, answersDirty || saveTask != nil else { return }
        saveTask?.cancel()
        saveTask = nil
        saveGeneration += 1
        await persistDraft()
    }

    private var canSave: Bool {
        detail?.form.kind != "handout" && detail?.submission?.status != "reviewed" && ready
    }

    private func persistDraft() async {
        note = "Saving…"
        do {
            let result: SaveFormResult = try await auth.client.mutate(
                "forms.saveDraft",
                input: SaveFormInput(formId: formId, answers: answers)
            )
            note = result.status == "submitted" ? "Submitted" : "Draft saved"
        } catch {
            if Task.isCancelled { return }
            note = "Could not save"
        }
    }

    func load() async {
        if ready { return }
        loadGeneration += 1
        let generation = loadGeneration
        do {
            let loaded: FormDetailModel = try await auth.client.query("forms.get", input: FormIdInput(formId: formId))
            guard generation == loadGeneration else { return }
            let typed = answersDirty ? answers : nil
            detail = loaded
            if let typed {
                answers = typed
            } else {
                answers = loaded.submission?.answers ?? [:]
            }
            if !answersDirty {
                note = statusLabel(loaded.submission?.status ?? "not_started")
            }
            ready = true
            errorMessage = nil
            if answersDirty { scheduleSave() }
        } catch {
            guard generation == loadGeneration, !Task.isCancelled else { return }
            errorMessage = error.localizedDescription
        }
    }

    func submit() async {
        submitting = true
        defer { submitting = false }
        saveTask?.cancel()
        do {
            let result: SaveFormResult = try await auth.client.mutate(
                "forms.submit",
                input: SaveFormInput(formId: formId, answers: answers)
            )
            note = statusLabel(result.status)
            answersDirty = false
            ready = false
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func upload(fieldId: String, data: Data) async {
        do {
            let result: UploadPhotoResult = try await auth.client.mutate(
                "forms.uploadPhoto",
                input: UploadPhotoInput(
                    formId: formId,
                    fieldId: fieldId,
                    mimeType: "image/jpeg",
                    base64Data: data.base64EncodedString()
                )
            )
            var next = answers[fieldId] ?? FormAnswerModel()
            next.photoKey = result.key
            setAnswer(next, for: fieldId)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

/// Keeps one session per form for the life of My Programs, including across a fold.
@MainActor
final class FormSessionCache {
    private var sessions: [Int: FormFillSession] = [:]

    func session(auth: AuthStore, formId: Int) -> FormFillSession {
        if let existing = sessions[formId] { return existing }
        let created = FormFillSession(auth: auth, formId: formId)
        sessions[formId] = created
        return created
    }

    func existing(formId: Int) -> FormFillSession? {
        sessions[formId]
    }
}

struct FormFillView: View {
    @Bindable var auth: AuthStore
    let formId: Int
    /// Right-pane presentation skips a second Duo split and the shared navigation title.
    var embedded = false
    @State private var owned: FormFillSession

    init(auth: AuthStore, formId: Int, embedded: Bool = false, session: FormFillSession? = nil) {
        self.auth = auth
        self.formId = formId
        self.embedded = embedded
        _owned = State(initialValue: session ?? FormFillSession(auth: auth, formId: formId))
    }

    var body: some View {
        FormFillContent(auth: auth, session: owned, embedded: embedded)
    }
}

private struct FormFillContent: View {
    @Bindable var auth: AuthStore
    @Bindable var session: FormFillSession
    var embedded: Bool

    var body: some View {
        Group {
            if embedded {
                formPage(bottomPadding: 12)
            } else {
                DuoPanes(style: .augment) {
                    formPage(bottomPadding: 56)
                } controls: {
                    if session.canSubmit {
                        Button {
                            Task { await session.submit() }
                        } label: {
                            Text(session.submitting ? "Submitting…" : "Submit")
                                .font(.headline)
                                .frame(maxWidth: .infinity, minHeight: 56)
                                .background(HTTheme.gold)
                                .foregroundStyle(.white)
                                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                        }
                        .buttonStyle(.plain)
                        .disabled(session.submitting)
                        .padding(16)
                    } else {
                        Text(session.note)
                            .font(.title3.weight(.semibold))
                            .foregroundStyle(HTTheme.forest)
                            .padding(16)
                    }
                }
                .navigationTitle(session.detail?.form.title ?? "Worksheet")
                .navigationBarTitleDisplayMode(.inline)
            }
        }
        .sheet(item: $session.preview) { item in
            InAppFilePreview(remote: item.url, name: item.name)
        }
        .task { await session.load() }
        .onDisappear { Task { await session.flush() } }
    }

    private func formPage(bottomPadding: CGFloat) -> some View {
        let detail = session.detail
        return ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                if let errorMessage = session.errorMessage {
                    Text(errorMessage).foregroundStyle(.red)
                }
                if embedded, let title = detail?.form.title {
                    Text(title)
                        .font(HTTheme.title)
                        .foregroundStyle(HTTheme.forest)
                        .fixedSize(horizontal: false, vertical: true)
                }
                if let detail {
                    Text(session.note)
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(HTTheme.gold)
                    if !detail.form.instructions.isEmpty {
                        Text(detail.form.instructions)
                            .font(.body)
                            .foregroundStyle(HTTheme.muted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    if let page = detail.pages.first, let url = URL(string: page.fileUrl) {
                        Button("View original PDF") {
                            session.preview = ProgramFilePreview(id: "form-\(session.formId)-\(page.id)", url: url, name: page.fileName)
                        }
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(HTTheme.gold)
                    }
                    if detail.form.kind == "handout" {
                        Text(detail.form.content)
                            .font(.body)
                            .foregroundStyle(HTTheme.forest)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    ForEach(detail.form.fields) { field in
                        fieldView(field, locked: detail.submission?.status == "reviewed")
                    }
                    if let feedback = detail.submission?.feedback, !feedback.isEmpty {
                        HTCard {
                            Text("From your coach").font(.caption.weight(.bold)).foregroundStyle(HTTheme.gold)
                            Text(feedback).foregroundStyle(HTTheme.forest)
                        }
                    }
                } else {
                    ProgressView()
                        .frame(maxWidth: .infinity)
                        .padding(.top, 40)
                }
            }
            .padding(16)
        }
        .keyboardTyping()
        .safeAreaInset(edge: .bottom, spacing: 0) {
            if session.canSubmit {
                Button {
                    Task { await session.submit() }
                } label: {
                    Text(session.submitting ? "Submitting…" : "Submit")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .frame(minHeight: 52)
                        .background(HTTheme.gold)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                }
                .disabled(session.submitting)
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .padding(.bottom, bottomPadding)
                .background(HTTheme.cream)
            }
        }
        .background(HTTheme.cream)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
    }

    @ViewBuilder
    private func fieldView(_ field: FormFieldModel, locked: Bool) -> some View {
        if field.type == "info" {
            HTCard {
                Text(field.label).font(.headline).foregroundStyle(HTTheme.forest)
                if !field.content.isEmpty {
                    Text(field.content).foregroundStyle(HTTheme.muted)
                }
            }
        } else {
            HTCard(spacing: 10) {
                Text(field.label + (field.required ? " *" : ""))
                    .font(.system(.title3, design: .serif).weight(.semibold))
                    .foregroundStyle(HTTheme.forest)
                    .fixedSize(horizontal: false, vertical: true)
                if !field.help.isEmpty {
                    Text(field.help).font(.caption).foregroundStyle(HTTheme.muted)
                }
                control(field, locked: locked)
            }
        }
    }

    @ViewBuilder
    private func control(_ field: FormFieldModel, locked: Bool) -> some View {
        let answer = session.answers[field.id] ?? FormAnswerModel()
        switch field.type {
        case "short_text":
            TextField("Type here", text: textBinding(field.id))
                .textFieldStyle(.roundedBorder)
                .frame(minHeight: 48)
                .disabled(locked)
        case "long_text":
            TextField("Type here", text: textBinding(field.id), axis: .vertical)
                .lineLimit(4...10)
                .textFieldStyle(.roundedBorder)
                .disabled(locked)
        case "number":
            TextField("Number", text: numberBinding(field.id))
                .keyboardType(.decimalPad)
                .textFieldStyle(.roundedBorder)
                .frame(minHeight: 48)
                .disabled(locked)
        case "date":
            DatePicker(
                "Date",
                selection: dateBinding(field.id),
                displayedComponents: .date
            )
            .datePickerStyle(.compact)
            .disabled(locked)
        case "single_choice", "multi_choice":
            ForEach(field.options, id: \.self) { option in
                let on = field.type == "multi_choice"
                    ? (answer.choices ?? []).contains(option)
                    : answer.text == option
                Button {
                    choose(field, option: option)
                } label: {
                    Text(option)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .frame(minHeight: 48)
                        .padding(.horizontal, 12)
                        .background(on ? HTTheme.forest : Color.white)
                        .foregroundStyle(on ? Color.white : HTTheme.forest)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                .disabled(locked)
            }
        case "checkbox":
            Button {
                var next = answer
                next.checked = answer.checked != true
                session.setAnswer(next, for: field.id)
            } label: {
                Text(answer.checked == true ? "Checked" : "Tap to check")
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .frame(minHeight: 48)
                    .padding(.horizontal, 12)
                    .background(Color.white)
                    .foregroundStyle(HTTheme.forest)
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            }
            .disabled(locked)
        case "scale":
            ScaleRating(field: field, value: answer.scale, locked: locked) { picked in
                var next = answer
                next.scale = picked
                session.setAnswer(next, for: field.id)
            }
        case "signature":
            TextField("Type your full name", text: textBinding(field.id))
                .textFieldStyle(.roundedBorder)
                .font(.title3.weight(.semibold))
                .frame(minHeight: 48)
                .disabled(locked)
        case "photo":
            if let key = answer.photoKey {
                FormPhotoImage(auth: auth, key: key)
            }
            PhotosPickerButton(locked: locked) { data in
                Task { await session.upload(fieldId: field.id, data: data) }
            }
        case "table":
            table(field, answer: answer, locked: locked)
        default:
            TextField("Type here", text: textBinding(field.id))
                .textFieldStyle(.roundedBorder)
                .frame(minHeight: 48)
                .disabled(locked)
        }
    }

    private func table(_ field: FormFieldModel, answer: FormAnswerModel, locked: Bool) -> some View {
        let columns = field.columns.isEmpty ? ["Notes"] : field.columns
        let rowCount = max(field.rows.count, answer.table?.count ?? 0, 1)
        return VStack(alignment: .leading, spacing: 8) {
            ForEach(0..<rowCount, id: \.self) { row in
                Text(row < field.rows.count ? field.rows[row] : "Row \(row + 1)")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(HTTheme.muted)
                ForEach(0..<columns.count, id: \.self) { col in
                    TextField(columns[col], text: tableBinding(field.id, row: row, col: col, columns: columns.count))
                        .textFieldStyle(.roundedBorder)
                        .disabled(locked)
                }
            }
            if field.allowExtraRows && !locked {
                Button("Add a row") {
                    var next = session.answers[field.id] ?? FormAnswerModel()
                    var rows = next.table ?? []
                    rows.append(Array(repeating: "", count: columns.count))
                    next.table = rows
                    session.setAnswer(next, for: field.id)
                }
                .frame(minHeight: 48)
            }
        }
    }

    private func textBinding(_ id: String) -> Binding<String> {
        Binding(
            get: { session.answers[id]?.text ?? "" },
            set: { value in
                var next = session.answers[id] ?? FormAnswerModel()
                next.text = value
                session.setAnswer(next, for: id)
            }
        )
    }

    private func numberBinding(_ id: String) -> Binding<String> {
        Binding(
            get: {
                guard let number = session.answers[id]?.number else { return "" }
                return String(number)
            },
            set: { value in
                var next = session.answers[id] ?? FormAnswerModel()
                next.number = Double(value)
                session.setAnswer(next, for: id)
            }
        )
    }

    private func dateBinding(_ id: String) -> Binding<Date> {
        Binding(
            get: { MountainDate.date(from: session.answers[id]?.date ?? "") ?? Date() },
            set: { value in
                var next = session.answers[id] ?? FormAnswerModel()
                next.date = MountainDate.string(from: value)
                session.setAnswer(next, for: id)
            }
        )
    }

    private func tableBinding(_ id: String, row: Int, col: Int, columns: Int) -> Binding<String> {
        Binding(
            get: {
                let table = session.answers[id]?.table ?? []
                guard row < table.count, col < table[row].count else { return "" }
                return table[row][col]
            },
            set: { value in
                var next = session.answers[id] ?? FormAnswerModel()
                var table = next.table ?? []
                while table.count <= row { table.append(Array(repeating: "", count: columns)) }
                while table[row].count <= col { table[row].append("") }
                table[row][col] = value
                next.table = table
                session.setAnswer(next, for: id)
            }
        )
    }

    private func choose(_ field: FormFieldModel, option: String) {
        var next = session.answers[field.id] ?? FormAnswerModel()
        if field.type == "single_choice" {
            next.text = option
        } else {
            var choices = next.choices ?? []
            if choices.contains(option) { choices.removeAll { $0 == option } }
            else { choices.append(option) }
            next.choices = choices
        }
        session.setAnswer(next, for: field.id)
    }
}

private struct ScaleRating: View {
    var field: FormFieldModel
    var value: Int?
    var locked: Bool
    var onPick: (Int) -> Void

    private var minValue: Int { field.scaleMin ?? 1 }
    private var maxValue: Int {
        let raw = field.scaleMax ?? 10
        return raw > minValue ? raw : minValue + 1
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(value.map(String.init) ?? "Tap to rate")
                .font(value == nil ? .subheadline.weight(.semibold) : .system(size: 40, weight: .bold, design: .serif))
                .foregroundStyle(value == nil ? HTTheme.muted : HTTheme.forest)
                .frame(maxWidth: .infinity)
            Slider(
                value: Binding(
                    get: { Double(value ?? minValue) },
                    set: { next in
                        let rounded = min(max(Int(next.rounded()), minValue), maxValue)
                        guard rounded != value else { return }
                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                        onPick(rounded)
                    }
                ),
                in: Double(minValue)...Double(maxValue),
                step: 1
            )
            .tint(HTTheme.gold)
            .disabled(locked)
            HStack {
                Text(endLabel(field.scaleLow, fallback: minValue))
                Spacer()
                Text(endLabel(field.scaleHigh, fallback: maxValue))
            }
            .font(.caption.weight(.bold))
            .foregroundStyle(HTTheme.gold)
        }
    }

    private func endLabel(_ custom: String?, fallback: Int) -> String {
        let trimmed = custom?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return trimmed.isEmpty ? "\(fallback)" : trimmed
    }
}

struct LibraryPagesView: View {
    var title: String
    var pages: [FormPageModel]
    @State private var preview: ProgramFilePreview?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(.headline).foregroundStyle(HTTheme.forest)
            TabView {
                ForEach(pages) { page in
                    Group {
                        if (page.mimeType ?? "").hasPrefix("image") || page.fileName.lowercased().hasSuffix("png") || page.fileName.lowercased().hasSuffix("jpg") {
                            AsyncImage(url: URL(string: page.fileUrl)) { image in
                                image.resizable().scaledToFit()
                            } placeholder: {
                                ProgressView()
                            }
                        } else if let url = URL(string: page.fileUrl) {
                            Button(page.fileName) {
                                preview = ProgramFilePreview(id: "page-\(page.id)", url: url, name: page.fileName)
                            }
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(HTTheme.forest)
                        }
                    }
                    .padding(8)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                }
            }
            .frame(height: 420)
            .tabViewStyle(.page(indexDisplayMode: .always))
            Text("Swipe for the next page")
                .font(.caption)
                .foregroundStyle(HTTheme.muted)
        }
        .sheet(item: $preview) { item in
            InAppFilePreview(remote: item.url, name: item.name)
        }
    }
}

private struct FormPhotoImage: View {
    var auth: AuthStore
    var key: String
    @State private var image: UIImage?

    var body: some View {
        Group {
            if let image {
                Image(uiImage: image).resizable().scaledToFit().frame(maxHeight: 220)
            } else {
                ProgressView()
            }
        }
        .task(id: key) { await load() }
    }

    private func load() async {
        guard let token = auth.token else { return }
        var parts = URLComponents(url: AppConfig.apiRoot.appending(path: "api/form-photo"), resolvingAgainstBaseURL: false)
        parts?.queryItems = [URLQueryItem(name: "key", value: key)]
        guard let url = parts?.url else { return }
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        if let (data, response) = try? await URLSession.shared.data(for: request),
           (response as? HTTPURLResponse)?.statusCode == 200 {
            image = UIImage(data: data)
        }
    }
}

private struct PhotosPickerButton: View {
    var locked: Bool
    var onPick: (Data) -> Void
    @State private var item: PhotosPickerItem?

    var body: some View {
        PhotosPicker(selection: $item, matching: .images) {
            Text("Add photo")
                .frame(maxWidth: .infinity, minHeight: 48)
                .background(Color.white)
                .foregroundStyle(HTTheme.forest)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        .disabled(locked)
        .onChange(of: item) { _, next in
            guard let next else { return }
            Task {
                if let data = try? await next.loadTransferable(type: Data.self),
                   let image = UIImage(data: data),
                   let jpeg = image.jpegData(compressionQuality: 0.7) {
                    onPick(jpeg)
                }
            }
        }
    }
}

private func statusLabel(_ status: String) -> String {
    switch status {
    case "draft": return "Draft"
    case "submitted": return "Submitted"
    case "reviewed": return "Reviewed"
    default: return "Not started"
    }
}
