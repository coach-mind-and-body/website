import PhotosUI
import SwiftUI
import UIKit

struct CaloriesView: View {
    @Bindable var food: FoodViewModel
    @Bindable var auth: AuthStore
    @State private var showLog = false
    @State private var showScan = false
    @State private var meal = "lunch"

    private let meals = ["breakfast", "lunch", "dinner", "snack", "drink"]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                dateRow

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    macroChip("Protein", "\(food.proteinTotal)g")
                    macroChip("Carbs", "\(food.carbsTotal)g")
                    macroChip("Fiber", "\(food.fiberTotal)g")
                    macroChip("Calories", "\(food.calorieTotal)")
                }

                Button {
                    meal = suggestedMeal
                    showLog = true
                } label: {
                    Text("Log food")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(HTTheme.forest)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                }
                .buttonStyle(.plain)

                Button {
                    showScan = true
                } label: {
                    Text("Scan my written log")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Color.white)
                        .foregroundStyle(HTTheme.forest)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                        .overlay(RoundedRectangle(cornerRadius: 16).stroke(HTTheme.roseBorder))
                }
                .buttonStyle(.plain)

                if let err = food.errorMessage {
                    Text(err).font(.subheadline).foregroundStyle(.red)
                }

                if food.logs.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Nothing logged yet")
                            .font(.headline)
                            .foregroundStyle(HTTheme.forest)
                        Text("Tap Log food, or scan a page you already wrote. You can still type a meal, snap the plate, or search a packaged item.")
                            .font(.subheadline)
                            .foregroundStyle(HTTheme.muted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(18)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 18))
                    .overlay(RoundedRectangle(cornerRadius: 18).stroke(HTTheme.roseBorder))
                } else {
                    ForEach(meals, id: \.self) { slot in
                        let items = food.logs.filter { $0.mealType == slot }
                        if !items.isEmpty {
                            Text(slot.capitalized)
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(HTTheme.gold)
                                .padding(.top, 4)
                            ForEach(items) { log in
                                logRow(log)
                            }
                        }
                    }
                }
            }
            .padding(16)
        }
        .dockScrollClearance()
        .keyboardTyping()
        .background(HTTheme.cream.ignoresSafeArea())
        .task(id: food.sessionEpoch) {
            await food.loadLogs()
            await food.checkFatSecret()
        }
        .refreshable { await food.loadLogs() }
        .sheet(isPresented: $showLog) {
            LogFoodSheet(food: food, meal: $meal)
        }
        .sheet(isPresented: $showScan) {
            WrittenLogScanSheet(food: food)
        }
    }

    private var suggestedMeal: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 0..<10: return "breakfast"
        case 10..<15: return "lunch"
        case 15..<21: return "dinner"
        default: return "snack"
        }
    }

    private var dateRow: some View {
        HStack {
            Button("←") {
                Task {
                    food.dateStr = MountainDate.shift(food.dateStr, days: -1)
                    await food.loadLogs()
                }
            }
            Spacer()
            Text(food.dateStr == MountainDate.today() ? "Today" : MountainDate.friendly(food.dateStr))
                .font(.title3.weight(.semibold))
            Spacer()
            Button("→") {
                Task {
                    food.dateStr = MountainDate.shift(food.dateStr, days: 1)
                    await food.loadLogs()
                }
            }
        }
        .foregroundStyle(HTTheme.gold)
    }

    private func logRow(_ log: CalorieLog) -> some View {
        HTCard {
            HStack {
                if let key = log.imageUrl, key.hasPrefix("food-logs/") {
                    FoodLogPhoto(key: key, token: auth.token)
                        .frame(width: 44, height: 44)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text(log.foodName)
                        .font(.headline)
                        .foregroundStyle(HTTheme.forest)
                    Text("\(log.protein)g protein · \(log.carbs)g carbs · \(log.fiber)g fiber · \(log.calories) cal")
                        .font(.subheadline)
                        .foregroundStyle(HTTheme.muted)
                }
                Spacer()
                Button(role: .destructive) {
                    Task { await food.deleteLog(log) }
                } label: {
                    Image(systemName: "trash")
                }
            }
        }
    }

    private func macroChip(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label.uppercased())
                .font(.caption.weight(.bold))
                .foregroundStyle(HTTheme.muted)
            Text(value)
                .font(.title.weight(.bold))
                .foregroundStyle(HTTheme.forest)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 18))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(HTTheme.roseBorder))
    }
}

private struct LogFoodSheet: View {
    @Bindable var food: FoodViewModel
    @Binding var meal: String
    @Environment(\.dismiss) private var dismiss
    @FocusState private var focused: Bool

    @State private var name = ""
    @State private var calories = 0
    @State private var protein = 0
    @State private var proteinText = ""
    @State private var carbs = 0
    @State private var fat = 0
    @State private var fiber = 0
    @State private var showFullMacros = false
    @State private var fsQuery = ""
    @State private var fatSecretBusy = false
    @State private var photoItem: PhotosPickerItem?
    @State private var showCamera = false
    @State private var showPackaged = false

    private let meals = ["breakfast", "lunch", "dinner", "snack", "drink"]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Which meal?")
                            .font(.headline)
                            .foregroundStyle(HTTheme.forest)
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                            ForEach(meals, id: \.self) { slot in
                                Button {
                                    meal = slot
                                } label: {
                                    Text(slot.capitalized)
                                        .font(.subheadline.weight(.bold))
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 12)
                                        .background(meal == slot ? HTTheme.forest : Color.white)
                                        .foregroundStyle(meal == slot ? Color.white : HTTheme.forest)
                                        .clipShape(RoundedRectangle(cornerRadius: 12))
                                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(HTTheme.roseBorder))
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Text("What did you eat?")
                            .font(.headline)
                            .foregroundStyle(HTTheme.forest)
                        TextField("Chicken, leftover chili, yogurt…", text: $name, axis: .vertical)
                            .lineLimit(2...4)
                            .padding(14)
                            .background(HTTheme.cream)
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                            .focused($focused)

                        HStack(spacing: 10) {
                            actionButton(title: "Estimate", system: "sparkles") {
                                Task { await runTextAI() }
                            }
                            .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty || food.estimateBusy)

                            PhotosPicker(selection: $photoItem, matching: .images) {
                                actionLabel(title: "Photo", system: "photo")
                            }

                            Button {
                                showCamera = true
                            } label: {
                                actionLabel(title: "Camera", system: "camera")
                            }
                            .buttonStyle(.plain)
                        }

                        if food.estimateBusy {
                            HStack(spacing: 8) {
                                ProgressView()
                                Text("Estimating…")
                                    .font(.subheadline)
                                    .foregroundStyle(HTTheme.muted)
                            }
                        }
                    }

                    if food.fatSecretOn {
                        DisclosureGroup("Search a packaged food instead", isExpanded: $showPackaged) {
                            VStack(alignment: .leading, spacing: 10) {
                                Text("Bars, yogurt cups, restaurant items with a label.")
                                    .font(.subheadline)
                                    .foregroundStyle(HTTheme.muted)
                                HStack {
                                    TextField("Search…", text: $fsQuery)
                                        .padding(12)
                                        .background(HTTheme.cream)
                                        .clipShape(RoundedRectangle(cornerRadius: 12))
                                    Button("Search") {
                                        Task { await food.searchFatSecret(fsQuery) }
                                    }
                                    .font(.subheadline.weight(.bold))
                                    .foregroundStyle(HTTheme.forest)
                                }
                                ForEach(food.fatSecretHits.prefix(6)) { hit in
                                    Button {
                                        Task { await applyFatSecret(hit) }
                                    } label: {
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(hit.brand.map { "\(hit.name) · \($0)" } ?? hit.name)
                                                .font(.subheadline.weight(.semibold))
                                                .foregroundStyle(HTTheme.forest)
                                            Text(fatSecretSubtitle(hit))
                                                .font(.caption)
                                                .foregroundStyle(HTTheme.muted)
                                        }
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                        .padding(.vertical, 6)
                                    }
                                    .buttonStyle(.plain)
                                    .disabled(fatSecretBusy)
                                }
                            }
                            .padding(.top, 8)
                            FatSecretBadge()
                        }
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(HTTheme.forest)
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Protein (grams)")
                            .font(.headline)
                            .foregroundStyle(HTTheme.forest)
                        Text("This is the number that matters most.")
                            .font(.subheadline)
                            .foregroundStyle(HTTheme.muted)
                        TextField("e.g. 25", text: $proteinText)
                            .keyboardType(.numberPad)
                            .font(.title2)
                            .padding(14)
                            .background(HTTheme.cream)
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                            .onChange(of: proteinText) { _, next in
                                protein = Int(next.filter(\.isNumber)) ?? 0
                            }
                    }

                    if showFullMacros {
                        HStack {
                            field("Calories", $calories)
                            field("Carbs", $carbs)
                        }
                        HStack {
                            field("Fat", $fat)
                            field("Fiber", $fiber)
                        }
                    } else {
                        Button("Add calories and other macros") { showFullMacros = true }
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(HTTheme.muted)
                    }

                    if food.fatSecretOn {
                        FatSecretBadge()
                    }

                    Button {
                        Task {
                            await food.addManual(
                                name: name,
                                meal: meal,
                                calories: calories,
                                protein: protein,
                                carbs: carbs,
                                fat: fat,
                                fiber: fiber
                            )
                            dismiss()
                        }
                    } label: {
                        Text("Save \(meal)")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(name.trimmingCharacters(in: .whitespaces).isEmpty || fatSecretBusy ? HTTheme.muted.opacity(0.35) : HTTheme.forest)
                            .foregroundStyle(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                    }
                    .buttonStyle(.plain)
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty || fatSecretBusy)
                }
                .padding(20)
            }
            .keyboardTyping()
            .background(HTTheme.cream.ignoresSafeArea())
            .navigationTitle("Log food")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button("Done") { focused = false }
                }
            }
            .sheet(isPresented: $showCamera) {
                CameraPicker { image in
                    showCamera = false
                    Task { await applyImage(image) }
                }
            }
            .onChange(of: photoItem) { _, item in
                guard let item else { return }
                Task {
                    if let data = try? await item.loadTransferable(type: Data.self),
                       let image = UIImage(data: data) {
                        await applyImage(image)
                    }
                    photoItem = nil
                }
            }
        }
    }

    private func actionButton(title: String, system: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            actionLabel(title: title, system: system)
        }
        .buttonStyle(.plain)
    }

    private func actionLabel(title: String, system: String) -> some View {
        VStack(spacing: 6) {
            Image(systemName: system)
            Text(title)
                .font(.caption.weight(.bold))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(Color.white)
        .foregroundStyle(HTTheme.forest)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(HTTheme.roseBorder))
    }

    private func field(_ label: String, _ value: Binding<Int>) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.caption.weight(.bold))
                .foregroundStyle(HTTheme.muted)
            TextField("0", value: value, format: .number)
                .keyboardType(.numberPad)
                .padding(12)
                .background(HTTheme.cream)
                .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    private func runTextAI() async {
        guard let est = await food.estimateText(name) else { return }
        applyEstimate(est)
    }

    private func applyImage(_ image: UIImage) async {
        guard let data = image.jpegData(compressionQuality: 0.7) else { return }
        let b64 = "data:image/jpeg;base64," + data.base64EncodedString()
        guard let est = await food.estimateImage(b64, hint: name) else { return }
        applyEstimate(est)
    }

    private func applyEstimate(_ est: FoodEstimate) {
        name = est.foodName
        calories = est.calories
        setProteinGrams(est.protein)
        carbs = est.carbs
        fat = est.fat
        fiber = est.fiber
        showFullMacros = true
    }

    private func applyFatSecret(_ hit: FatSecretFood) async {
        applyHit(hit)
        fsQuery = ""
        food.fatSecretHits = []
        fatSecretBusy = true
        defer { fatSecretBusy = false }
        guard let detail = await food.fatSecretDetail(hit.foodId) else { return }
        applyHit(detail)
    }

    private func applyHit(_ hit: FatSecretFood) {
        name = hit.brand.map { "\(hit.name) · \($0)" } ?? hit.name
        calories = hit.calories
        setProteinGrams(hit.protein)
        carbs = hit.carbs
        fat = hit.fat
        if let grams = hit.fiber { fiber = grams }
        showFullMacros = true
    }

    private func setProteinGrams(_ grams: Int) {
        protein = grams
        proteinText = "\(grams)"
    }

    private func fatSecretSubtitle(_ hit: FatSecretFood) -> String {
        if hit.protein > 0 || hit.calories > 0 {
            return "\(hit.protein)g protein · \(hit.calories) cal"
        }
        return "Tap to fill"
    }
}

struct FatSecretBadge: View {
    var body: some View {
        Link(destination: URL(string: "https://www.fatsecret.com")!) {
            VStack(spacing: 4) {
                AsyncImage(url: URL(string: "https://platform.fatsecret.com/api/static/images/powered_by_fatsecret_horizontal_brand.png")) { phase in
                    if case .success(let img) = phase {
                        img.resizable().scaledToFit().frame(height: 22)
                    } else {
                        Text("Powered by fatsecret")
                            .font(.caption)
                            .foregroundStyle(HTTheme.muted)
                    }
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.top, 8)
        }
        .accessibilityLabel("Powered by fatsecret")
    }
}

private struct WrittenDraft: Identifiable {
    let id = UUID()
    var mealType: String
    var time: String
    var foodName: String
    var portion: String
    var calories: Int
    var protein: Int
    var carbs: Int
    var fat: Int
    var fiber: Int
    var confidence: String
    var unclear: Bool
    var note: String
    var imageIndex: Int
    var dateStr: String
    var imageUrl: String?
}

private struct WrittenLogScanSheet: View {
    @Bindable var food: FoodViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var pages: [UIImage] = []
    @State private var photoItems: [PhotosPickerItem] = []
    @State private var showCamera = false
    @State private var drafts: [WrittenDraft] = []
    @State private var sharedDate = ""
    @State private var localError: String?
    @State private var didRead = false

    private let meals = ["breakfast", "lunch", "dinner", "snack", "drink"]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Photograph the page you wrote, not the plate. A meal or a whole day is fine, up to 4 pages. Nothing is saved until you review it.")
                        .font(.subheadline)
                        .foregroundStyle(HTTheme.muted)
                        .fixedSize(horizontal: false, vertical: true)

                    if !food.isSignedIn {
                        Text("Sign in under You first. The photo is saved with your account so your coach can see it.")
                            .font(.subheadline)
                            .foregroundStyle(HTTheme.forest)
                    } else if drafts.isEmpty {
                        picker
                    }

                    if didRead && drafts.isEmpty && !food.scanBusy {
                        Text("Nothing on that page was readable. Try a closer photo in better light.")
                            .font(.subheadline)
                            .foregroundStyle(HTTheme.forest)
                    }

                    if !drafts.isEmpty {
                        review
                    }

                    if food.scanBusy {
                        HStack(spacing: 8) {
                            ProgressView()
                            Text(drafts.isEmpty ? "Reading your handwriting…" : "Saving…")
                                .font(.subheadline)
                                .foregroundStyle(HTTheme.muted)
                        }
                    }

                    if let localError {
                        Text(localError)
                            .font(.subheadline)
                            .foregroundStyle(.red)
                    }
                }
                .padding(20)
            }
            .keyboardTyping()
            .background(HTTheme.cream.ignoresSafeArea())
            .navigationTitle("Written log")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
            .onAppear { if sharedDate.isEmpty { sharedDate = food.dateStr } }
            .sheet(isPresented: $showCamera) {
                CameraPicker { image in
                    showCamera = false
                    guard pages.count < 4 else { return }
                    pages.append(image)
                    drafts = []
                    didRead = false
                }
            }
            .onChange(of: photoItems) { _, items in
                Task { await loadPicked(items) }
            }
        }
    }

    private var picker: some View {
        VStack(alignment: .leading, spacing: 12) {
            if !pages.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(Array(pages.enumerated()), id: \.offset) { index, image in
                            ZStack(alignment: .topTrailing) {
                                Image(uiImage: image)
                                    .resizable()
                                    .scaledToFill()
                                    .frame(width: 72, height: 96)
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                                Button {
                                    pages.remove(at: index)
                                    drafts = []
                                    didRead = false
                                } label: {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundStyle(HTTheme.forest)
                                        .background(Circle().fill(Color.white))
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }
            }

            HStack(spacing: 10) {
                PhotosPicker(selection: $photoItems, maxSelectionCount: 4, matching: .images) {
                    scanActionLabel(title: "Choose pages", system: "photo")
                }
                Button {
                    showCamera = true
                } label: {
                    scanActionLabel(title: "Camera", system: "camera")
                }
                .buttonStyle(.plain)
                .disabled(pages.count >= 4)
            }

            Button {
                Task { await readPages() }
            } label: {
                Text("Read my log")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(pages.isEmpty || food.scanBusy ? HTTheme.muted.opacity(0.35) : HTTheme.forest)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
            }
            .buttonStyle(.plain)
            .disabled(pages.isEmpty || food.scanBusy)
        }
    }

    private var review: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                TextField("YYYY-MM-DD", text: $sharedDate)
                    .padding(12)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                Button("Apply to all") {
                    guard sharedDate.range(of: #"^\d{4}-\d{2}-\d{2}$"#, options: .regularExpression) != nil else {
                        localError = "Use a date like 2026-11-10."
                        return
                    }
                    for index in drafts.indices {
                        drafts[index].dateStr = sharedDate
                    }
                    localError = nil
                }
                .font(.subheadline.weight(.bold))
                .foregroundStyle(HTTheme.forest)
            }

            ForEach($drafts) { $draft in
                VStack(alignment: .leading, spacing: 8) {
                    if draft.unclear || draft.confidence == "low" {
                        Text(draft.note.isEmpty ? "Check this one — the handwriting was hard to read." : draft.note)
                            .font(.caption)
                            .foregroundStyle(HTTheme.forest)
                            .padding(8)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color(red: 0.98, green: 0.93, blue: 0.91))
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                    HStack {
                        if draft.imageIndex >= 0, draft.imageIndex < pages.count {
                            Image(uiImage: pages[draft.imageIndex])
                                .resizable()
                                .scaledToFill()
                                .frame(width: 44, height: 44)
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                        Picker("Meal", selection: $draft.mealType) {
                            ForEach(meals, id: \.self) { slot in
                                Text(slot.capitalized).tag(slot)
                            }
                        }
                        .pickerStyle(.menu)
                        Spacer()
                        Button(role: .destructive) {
                            drafts.removeAll { $0.id == draft.id }
                        } label: {
                            Image(systemName: "trash")
                        }
                    }
                    TextField("Food", text: $draft.foodName, axis: .vertical)
                        .lineLimit(1...3)
                        .padding(12)
                        .background(HTTheme.cream)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    HStack {
                        TextField("Portion", text: $draft.portion)
                        TextField("Time", text: $draft.time)
                    }
                    .padding(12)
                    .background(HTTheme.cream)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    TextField("Date", text: $draft.dateStr)
                        .padding(12)
                        .background(HTTheme.cream)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    HStack {
                        scanField("Cal", $draft.calories)
                        scanField("Pro", $draft.protein)
                        scanField("Carb", $draft.carbs)
                    }
                    HStack {
                        scanField("Fat", $draft.fat)
                        scanField("Fiber", $draft.fiber)
                    }
                }
                .padding(12)
                .background(Color.white)
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(HTTheme.roseBorder))
            }

            Button {
                Task { await saveAll() }
            } label: {
                Text("Save all")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(food.scanBusy ? HTTheme.muted.opacity(0.35) : HTTheme.forest)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
            }
            .buttonStyle(.plain)
            .disabled(food.scanBusy || drafts.isEmpty)
        }
    }

    private func scanActionLabel(title: String, system: String) -> some View {
        VStack(spacing: 6) {
            Image(systemName: system)
            Text(title)
                .font(.caption.weight(.bold))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(Color.white)
        .foregroundStyle(HTTheme.forest)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(HTTheme.roseBorder))
    }

    private func scanField(_ label: String, _ value: Binding<Int>) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.caption.weight(.bold))
                .foregroundStyle(HTTheme.muted)
            TextField("0", value: value, format: .number)
                .keyboardType(.numberPad)
                .padding(8)
                .background(HTTheme.cream)
                .clipShape(RoundedRectangle(cornerRadius: 10))
        }
    }

    private func loadPicked(_ items: [PhotosPickerItem]) async {
        var images: [UIImage] = []
        for item in items.prefix(4) {
            if let data = try? await item.loadTransferable(type: Data.self),
               let image = UIImage(data: data) {
                images.append(image)
            }
        }
        if !images.isEmpty {
            pages = images
            drafts = []
            didRead = false
        }
    }

    private func readPages() async {
        localError = nil
        var payloads: [String] = []
        for image in pages {
            guard let payload = scanJpegDataUrl(from: image) else {
                localError = "One of those photos is too large. Move closer and try again."
                return
            }
            payloads.append(payload)
        }
        guard let result = await food.scanWrittenLog(payloads) else {
            localError = food.errorMessage
            didRead = true
            return
        }
        didRead = true
        let allowed = Set(meals)
        drafts = result.entries.map { entry in
            WrittenDraft(
                mealType: allowed.contains(entry.mealType) ? entry.mealType : "snack",
                time: entry.time ?? "",
                foodName: entry.foodName,
                portion: entry.portion ?? "",
                calories: entry.calories,
                protein: entry.protein,
                carbs: entry.carbs,
                fat: entry.fat,
                fiber: entry.fiber,
                confidence: entry.confidence,
                unclear: entry.unclear,
                note: entry.note ?? "",
                imageIndex: entry.imageIndex,
                dateStr: food.dateStr,
                imageUrl: result.images.first { $0.index == entry.imageIndex }?.key
            )
        }
        if drafts.isEmpty {
            localError = "Nothing on that page was readable. Try a closer photo in better light."
        }
    }

    private func saveAll() async {
        let dateOK = drafts.allSatisfy {
            $0.dateStr.range(of: #"^\d{4}-\d{2}-\d{2}$"#, options: .regularExpression) != nil
        }
        guard dateOK else {
            localError = "Use dates like 2026-11-10."
            return
        }
        guard drafts.allSatisfy({ !$0.foodName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }) else {
            localError = "Add a name or remove the blank row."
            return
        }
        let payload = drafts.map { draft in
            BatchCalorieLogInput(
                dateStr: draft.dateStr,
                mealType: draft.mealType,
                foodName: draft.foodName.trimmingCharacters(in: .whitespacesAndNewlines),
                portion: blankToNil(draft.portion),
                time: blankToNil(draft.time),
                calories: max(0, draft.calories),
                protein: max(0, draft.protein),
                carbs: max(0, draft.carbs),
                fat: max(0, draft.fat),
                fiber: max(0, draft.fiber),
                imageUrl: draft.imageUrl
            )
        }
        let saved = await food.saveWrittenLogs(payload)
        if saved {
            dismiss()
        } else {
            localError = food.errorMessage
        }
    }
}

private struct FoodLogPhoto: View {
    let key: String
    let token: String?
    @State private var image: UIImage?

    var body: some View {
        Group {
            if let image {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
            } else {
                HTTheme.cream
            }
        }
        .task(id: token ?? "") { await load() }
    }

    private func load() async {
        guard let token, !token.isEmpty else { return }
        guard var comps = URLComponents(
            url: AppConfig.apiRoot.appending(path: "api/food-log-photo"),
            resolvingAgainstBaseURL: false
        ) else { return }
        comps.queryItems = [URLQueryItem(name: "key", value: key)]
        guard let url = comps.url else { return }
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        guard let (data, response) = try? await URLSession.shared.data(for: request),
              (response as? HTTPURLResponse)?.statusCode == 200,
              let loaded = UIImage(data: data) else { return }
        image = loaded
    }
}

private func blankToNil(_ value: String) -> String? {
    let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
    return trimmed.isEmpty ? nil : trimmed
}

private func scanJpegDataUrl(from image: UIImage) -> String? {
    let maxSide: CGFloat = 1600
    let size = image.size
    guard size.width > 0, size.height > 0 else { return nil }
    let scale = min(1, maxSide / max(size.width, size.height))
    let target = CGSize(width: max(1, size.width * scale), height: max(1, size.height * scale))
    let format = UIGraphicsImageRendererFormat.default()
    format.scale = 1
    let renderer = UIGraphicsImageRenderer(size: target, format: format)
    let rendered = renderer.image { _ in
        image.draw(in: CGRect(origin: .zero, size: target))
    }
    var quality: CGFloat = 0.65
    var data = rendered.jpegData(compressionQuality: quality)
    while let current = data, current.count > 3_500_000, quality > 0.35 {
        quality -= 0.15
        data = rendered.jpegData(compressionQuality: quality)
    }
    guard let data, data.count < 4_000_000 else { return nil }
    return "data:image/jpeg;base64," + data.base64EncodedString()
}

private struct CameraPicker: UIViewControllerRepresentable {
    var onImage: (UIImage) -> Void

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = UIImagePickerController.isSourceTypeAvailable(.camera) ? .camera : .photoLibrary
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator { Coordinator(onImage: onImage) }

    final class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let onImage: (UIImage) -> Void
        init(onImage: @escaping (UIImage) -> Void) { self.onImage = onImage }
        func imagePickerController(
            _ picker: UIImagePickerController,
            didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]
        ) {
            if let image = info[.originalImage] as? UIImage { onImage(image) }
            picker.dismiss(animated: true)
        }
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            picker.dismiss(animated: true)
        }
    }
}
