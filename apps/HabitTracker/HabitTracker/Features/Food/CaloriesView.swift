import PhotosUI
import SwiftUI
import UIKit

struct CaloriesView: View {
    @Bindable var food: FoodViewModel
    @Bindable var auth: AuthStore
    @State private var name = ""
    @State private var meal = "snack"
    @State private var calories = 0
    @State private var protein = 0
    @State private var carbs = 0
    @State private var fat = 0
    @State private var fiber = 0
    @State private var showAdd = false
    @State private var showFullMacros = false
    @State private var fsQuery = ""
    @State private var photoItem: PhotosPickerItem?
    @State private var showCamera = false
    @State private var hint = ""

    private let meals = ["breakfast", "lunch", "dinner", "snack", "drink"]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    HStack {
                        Button("←") { Task { food.dateStr = MountainDate.shift(food.dateStr, days: -1); await food.loadLogs() } }
                        Spacer()
                        Text(food.dateStr == MountainDate.today() ? "Today" : MountainDate.friendly(food.dateStr))
                            .font(.subheadline.weight(.semibold))
                        Spacer()
                        Button("→") { Task { food.dateStr = MountainDate.shift(food.dateStr, days: 1); await food.loadLogs() } }
                    }
                    .foregroundStyle(HTTheme.gold)

                    HStack(spacing: 10) {
                        macroChip("Protein", "\(food.proteinTotal)g")
                        macroChip("Calories", "\(food.calorieTotal)")
                    }

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack {
                            ForEach(meals, id: \.self) { m in
                                Button(m.capitalized) { meal = m; showAdd = true }
                                    .font(.caption.weight(.bold))
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 8)
                                    .background(meal == m && showAdd ? HTTheme.forest : Color.white)
                                    .foregroundStyle(meal == m && showAdd ? Color.white : HTTheme.forest)
                                    .clipShape(Capsule())
                                    .overlay(Capsule().stroke(HTTheme.roseBorder))
                            }
                        }
                    }

                    if showAdd { addCard }

                    if let err = food.errorMessage {
                        Text(err).font(.caption).foregroundStyle(.red)
                    }

                    if food.logs.isEmpty && !showAdd {
                        Text("Tap a meal, then use ✨ AI, a photo, or FatSecret — or type it yourself.")
                            .font(.subheadline)
                            .foregroundStyle(HTTheme.muted)
                    }

                    ForEach(food.logs) { log in
                        HTCard {
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(log.mealType.capitalized)
                                        .font(.caption2.weight(.bold))
                                        .foregroundStyle(HTTheme.gold)
                                    Text(log.foodName).font(.headline).foregroundStyle(HTTheme.forest)
                                    Text("\(log.protein)p · \(log.calories) kcal")
                                        .font(.caption)
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
                }
                .padding(16)
                .padding(.bottom, 24)
            }
            .background(HTTheme.cream.ignoresSafeArea())
            .navigationTitle("Macros")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    ProfileAvatarButton(auth: auth)
                }
            }
            .task(id: food.sessionEpoch) {
                await food.loadLogs()
                await food.checkFatSecret()
            }
            .refreshable { await food.loadLogs() }
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

    private var addCard: some View {
        HTCard {
            Text("Log \(meal)")
                .font(.headline)
                .foregroundStyle(HTTheme.forest)

            HStack(spacing: 8) {
                TextField("e.g. Greek yogurt + berries", text: $name)
                    .padding(10)
                    .background(HTTheme.cream)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                Button {
                    Task { await runTextAI() }
                } label: {
                    if food.estimateBusy {
                        ProgressView()
                    } else {
                        Text("✨ AI")
                            .font(.caption.weight(.bold))
                    }
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 10)
                .background(Color(red: 251 / 255, green: 238 / 255, blue: 233 / 255))
                .foregroundStyle(HTTheme.gold)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty || food.estimateBusy)
            }

            HStack(spacing: 8) {
                PhotosPicker(selection: $photoItem, matching: .images) {
                    Label("Photo", systemImage: "photo")
                        .font(.caption.weight(.bold))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Color.white)
                        .clipShape(Capsule())
                        .overlay(Capsule().stroke(HTTheme.roseBorder))
                }
                Button {
                    showCamera = true
                } label: {
                    Label("Camera", systemImage: "camera")
                        .font(.caption.weight(.bold))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Color.white)
                        .clipShape(Capsule())
                        .overlay(Capsule().stroke(HTTheme.roseBorder))
                }
                .foregroundStyle(HTTheme.forest)
            }

            if food.fatSecretOn {
                HStack {
                    TextField("Search FatSecret…", text: $fsQuery)
                        .padding(10)
                        .background(HTTheme.cream)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    Button("Search") {
                        Task { await food.searchFatSecret(fsQuery) }
                    }
                    .font(.caption.weight(.bold))
                    .foregroundStyle(HTTheme.forest)
                }
                ForEach(food.fatSecretHits.prefix(6)) { hit in
                    Button {
                        name = hit.brand.map { "\(hit.name) (\($0))" } ?? hit.name
                        calories = hit.calories
                        protein = hit.protein
                        carbs = hit.carbs
                        fat = hit.fat
                        fiber = 0
                        showFullMacros = true
                    } label: {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(hit.brand.map { "\(hit.name) · \($0)" } ?? hit.name)
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(HTTheme.forest)
                            Text("\(hit.protein)p · \(hit.calories) kcal")
                                .font(.caption)
                                .foregroundStyle(HTTheme.muted)
                        }
                    }
                    .buttonStyle(.plain)
                }
            }

            TextField("Protein (g)", value: $protein, format: .number)
                .keyboardType(.numberPad)
                .padding(10)
                .background(HTTheme.cream)
                .clipShape(RoundedRectangle(cornerRadius: 12))

            if !showFullMacros {
                Button("+ Calories & other macros") { showFullMacros = true }
                    .font(.caption.weight(.bold))
                    .foregroundStyle(HTTheme.muted)
            } else {
                HStack {
                    field("kcal", $calories)
                    field("carbs", $carbs)
                }
                HStack {
                    field("fat", $fat)
                    field("fiber", $fiber)
                }
            }

            Button("Log \(meal)") {
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
                    resetForm()
                }
            }
            .font(.headline)
            .foregroundStyle(HTTheme.forest)
            .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
        }
    }

    private func field(_ label: String, _ value: Binding<Int>) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label.uppercased()).font(.caption2.weight(.bold)).foregroundStyle(HTTheme.muted)
            TextField("0", value: value, format: .number)
                .keyboardType(.numberPad)
                .padding(10)
                .background(HTTheme.cream)
                .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    private func macroChip(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label.uppercased()).font(.caption2.weight(.bold)).foregroundStyle(HTTheme.muted)
            Text(value).font(.title2.weight(.bold)).foregroundStyle(HTTheme.forest)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 18))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(HTTheme.roseBorder))
    }

    private func runTextAI() async {
        guard let est = await food.estimateText(name) else { return }
        applyEstimate(est)
    }

    private func applyImage(_ image: UIImage) async {
        guard let data = image.jpegData(compressionQuality: 0.7) else { return }
        let b64 = "data:image/jpeg;base64," + data.base64EncodedString()
        guard let est = await food.estimateImage(b64, hint: hint.isEmpty ? name : hint) else { return }
        applyEstimate(est)
    }

    private func applyEstimate(_ est: FoodEstimate) {
        name = est.foodName
        calories = est.calories
        protein = est.protein
        carbs = est.carbs
        fat = est.fat
        fiber = est.fiber
        showFullMacros = true
    }

    private func resetForm() {
        name = ""
        calories = 0
        protein = 0
        carbs = 0
        fat = 0
        fiber = 0
        showAdd = false
        showFullMacros = false
        food.fatSecretHits = []
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
        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            if let image = info[.originalImage] as? UIImage { onImage(image) }
            picker.dismiss(animated: true)
        }
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            picker.dismiss(animated: true)
        }
    }
}
