import PhotosUI
import SwiftUI
import UIKit

struct CaloriesView: View {
    @Bindable var food: FoodViewModel
    @Bindable var auth: AuthStore
    @State private var showLog = false
    @State private var meal = "lunch"

    private let meals = ["breakfast", "lunch", "dinner", "snack", "drink"]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                dateRow

                HStack(spacing: 12) {
                    macroChip("Protein", "\(food.proteinTotal)g")
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

                if let err = food.errorMessage {
                    Text(err).font(.subheadline).foregroundStyle(.red)
                }

                if food.logs.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Nothing logged yet")
                            .font(.headline)
                            .foregroundStyle(HTTheme.forest)
                        Text("Tap Log food. Type what you ate, snap the plate, or search a packaged item. Protein matters most.")
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
        .background(HTTheme.cream.ignoresSafeArea())
        .task(id: food.sessionEpoch) {
            await food.loadLogs()
            await food.checkFatSecret()
        }
        .refreshable { await food.loadLogs() }
        .sheet(isPresented: $showLog) {
            LogFoodSheet(food: food, meal: $meal)
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
                VStack(alignment: .leading, spacing: 4) {
                    Text(log.foodName)
                        .font(.headline)
                        .foregroundStyle(HTTheme.forest)
                    Text("\(log.protein)g protein · \(log.calories) cal")
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
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Which meal?")
                            .font(.headline)
                            .foregroundStyle(HTTheme.forest)
                        Picker("Meal", selection: $meal) {
                            ForEach(meals, id: \.self) { Text($0.capitalized).tag($0) }
                        }
                        .pickerStyle(.segmented)
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
