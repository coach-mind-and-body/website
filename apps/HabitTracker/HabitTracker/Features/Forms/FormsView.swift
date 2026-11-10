import PhotosUI
import SwiftUI
import UIKit

struct ClientFormSummary: Codable, Identifiable {
    let id: Int
    var title: String
    var kind: String
    var status: String
    var programTags: [String]
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
            if !library.isEmpty {
                Section("Pages") {
                    ForEach(library) { item in
                        NavigationLink {
                            LibraryPagesView(title: item.title, pages: item.pages)
                        } label: {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(item.title).foregroundStyle(HTTheme.forest)
                                Text("\(item.pages.count) \(item.pages.count == 1 ? "page" : "pages")")
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
        .navigationTitle("Worksheets")
        .task { await load() }
        .refreshable { await load() }
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

struct FormFillView: View {
    @Bindable var auth: AuthStore
    let formId: Int
    @State private var detail: FormDetailModel?
    @State private var answers: [String: FormAnswerModel] = [:]
    @State private var note = "Not started"
    @State private var errorMessage: String?
    @State private var ready = false
    @State private var submitting = false
    @State private var saveTask: Task<Void, Never>?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                if let errorMessage {
                    Text(errorMessage).foregroundStyle(.red)
                }
                if let detail {
                    Text(note)
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(HTTheme.gold)
                    if !detail.form.instructions.isEmpty {
                        Text(detail.form.instructions).foregroundStyle(HTTheme.muted)
                    }
                    if !detail.pages.isEmpty {
                        LibraryPagesView(title: "Original pages", pages: detail.pages)
                    }
                    if detail.form.kind == "handout" {
                        Text(detail.form.content)
                            .foregroundStyle(HTTheme.forest)
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
                    if detail.form.kind != "handout" && detail.submission?.status != "reviewed" {
                        Button {
                            Task { await submit() }
                        } label: {
                            Text(submitting ? "Submitting…" : "Submit")
                                .font(.headline)
                                .frame(maxWidth: .infinity)
                                .frame(minHeight: 52)
                                .background(HTTheme.gold)
                                .foregroundStyle(.white)
                                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                        }
                        .disabled(submitting)
                    }
                } else {
                    ProgressView()
                }
            }
            .padding(16)
        }
        .background(HTTheme.cream)
        .navigationTitle(detail?.form.title ?? "Worksheet")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
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
            VStack(alignment: .leading, spacing: 8) {
                Text(field.label + (field.required ? " *" : ""))
                    .font(.headline)
                    .foregroundStyle(HTTheme.forest)
                if !field.help.isEmpty {
                    Text(field.help).font(.caption).foregroundStyle(HTTheme.muted)
                }
                control(field, locked: locked)
            }
        }
    }

    @ViewBuilder
    private func control(_ field: FormFieldModel, locked: Bool) -> some View {
        let answer = answers[field.id] ?? FormAnswerModel()
        switch field.type {
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
                answers[field.id] = next
                scheduleSave()
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
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 5), spacing: 8) {
                ForEach(1...10, id: \.self) { n in
                    Button {
                        var next = answer
                        next.scale = n
                        answers[field.id] = next
                        scheduleSave()
                    } label: {
                        Text("\(n)")
                            .font(.headline)
                            .frame(maxWidth: .infinity, minHeight: 48)
                            .background(answer.scale == n ? HTTheme.gold : Color.white)
                            .foregroundStyle(answer.scale == n ? Color.white : HTTheme.forest)
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                    .disabled(locked)
                }
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
                Task { await upload(fieldId: field.id, data: data) }
            }
        case "table":
            table(field, answer: answer, locked: locked)
        default:
            TextField(field.label, text: textBinding(field.id))
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
                    var next = answers[field.id] ?? FormAnswerModel()
                    var rows = next.table ?? []
                    rows.append(Array(repeating: "", count: columns.count))
                    next.table = rows
                    answers[field.id] = next
                    scheduleSave()
                }
                .frame(minHeight: 48)
            }
        }
    }

    private func textBinding(_ id: String) -> Binding<String> {
        Binding(
            get: { answers[id]?.text ?? "" },
            set: { value in
                var next = answers[id] ?? FormAnswerModel()
                next.text = value
                answers[id] = next
                scheduleSave()
            }
        )
    }

    private func numberBinding(_ id: String) -> Binding<String> {
        Binding(
            get: {
                guard let number = answers[id]?.number else { return "" }
                return String(number)
            },
            set: { value in
                var next = answers[id] ?? FormAnswerModel()
                next.number = Double(value)
                answers[id] = next
                scheduleSave()
            }
        )
    }

    private func dateBinding(_ id: String) -> Binding<Date> {
        Binding(
            get: { MountainDate.date(from: answers[id]?.date ?? "") ?? Date() },
            set: { value in
                var next = answers[id] ?? FormAnswerModel()
                next.date = MountainDate.string(from: value)
                answers[id] = next
                scheduleSave()
            }
        )
    }

    private func tableBinding(_ id: String, row: Int, col: Int, columns: Int) -> Binding<String> {
        Binding(
            get: {
                let table = answers[id]?.table ?? []
                guard row < table.count, col < table[row].count else { return "" }
                return table[row][col]
            },
            set: { value in
                var next = answers[id] ?? FormAnswerModel()
                var table = next.table ?? []
                while table.count <= row { table.append(Array(repeating: "", count: columns)) }
                while table[row].count <= col { table[row].append("") }
                table[row][col] = value
                next.table = table
                answers[id] = next
                scheduleSave()
            }
        )
    }

    private func choose(_ field: FormFieldModel, option: String) {
        var next = answers[field.id] ?? FormAnswerModel()
        if field.type == "single_choice" {
            next.text = option
        } else {
            var choices = next.choices ?? []
            if choices.contains(option) { choices.removeAll { $0 == option } }
            else { choices.append(option) }
            next.choices = choices
        }
        answers[field.id] = next
        scheduleSave()
    }

    private func scheduleSave() {
        guard detail?.form.kind != "handout", detail?.submission?.status != "reviewed", ready else { return }
        saveTask?.cancel()
        saveTask = Task {
            try? await Task.sleep(for: .milliseconds(800))
            if Task.isCancelled { return }
            note = "Saving…"
            do {
                let result: SaveFormResult = try await auth.client.mutate(
                    "forms.saveDraft",
                    input: SaveFormInput(formId: formId, answers: answers)
                )
                note = result.status == "submitted" ? "Submitted" : "Draft saved"
            } catch {
                note = "Could not save"
            }
        }
    }

    private func load() async {
        do {
            let loaded: FormDetailModel = try await auth.client.query("forms.get", input: FormIdInput(formId: formId))
            detail = loaded
            answers = loaded.submission?.answers ?? [:]
            note = statusLabel(loaded.submission?.status ?? "not_started")
            ready = true
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func submit() async {
        submitting = true
        defer { submitting = false }
        do {
            let result: SaveFormResult = try await auth.client.mutate(
                "forms.submit",
                input: SaveFormInput(formId: formId, answers: answers)
            )
            note = statusLabel(result.status)
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func upload(fieldId: String, data: Data) async {
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
            answers[fieldId] = next
            scheduleSave()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct LibraryPagesView: View {
    var title: String
    var pages: [FormPageModel]

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
                        } else {
                            Link(page.fileName, destination: URL(string: page.fileUrl) ?? AppConfig.apiRoot)
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
