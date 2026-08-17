import SwiftUI

struct MealPlanView: View {
    @Bindable var food: FoodViewModel
    @Bindable var auth: AuthStore

    private let days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Text("This week").font(HTTheme.serif).foregroundStyle(HTTheme.forest)
                    if let plan = food.mealPlan {
                        Text(plan.title).font(.headline).foregroundStyle(HTTheme.forest)
                        if let d = plan.description { Text(d).font(.subheadline).foregroundStyle(HTTheme.muted) }
                        if auth.isSignedIn {
                            Button("Build shopping list") { Task { await food.buildShop() } }
                                .font(.subheadline.weight(.bold))
                                .foregroundStyle(HTTheme.gold)
                        }
                        ForEach(0..<7, id: \.self) { day in
                            let slots = (plan.slots ?? []).filter { $0.dayOfWeek == day }
                            if !slots.isEmpty {
                                Text(days[day])
                                    .font(.caption.weight(.bold))
                                    .foregroundStyle(day == MountainDate.weekdayIndex(MountainDate.today()) ? HTTheme.gold : HTTheme.muted)
                                ForEach(Array(slots.enumerated()), id: \.offset) { _, slot in
                                    if let rec = slot.recipe {
                                        NavigationLink(value: rec.slug) {
                                            HStack {
                                                Text(slot.slot.capitalized).font(.caption.weight(.bold)).foregroundStyle(HTTheme.gold)
                                                Text(rec.title).foregroundStyle(HTTheme.forest)
                                                Spacer()
                                            }
                                            .padding(12)
                                            .background(Color.white)
                                            .clipShape(RoundedRectangle(cornerRadius: 14))
                                        }
                                        .buttonStyle(.plain)
                                    }
                                }
                            }
                        }
                    } else {
                        Text("Lee Anne hasn’t assigned a week yet — browse the vault.")
                            .foregroundStyle(HTTheme.muted)
                    }
                }
                .padding(16)
            }
            .background(HTTheme.cream.ignoresSafeArea())
            .navigationTitle("This week")
            .navigationDestination(for: String.self) { slug in
                RecipeDetailView(slug: slug, food: food, auth: auth)
            }
            .task(id: food.sessionEpoch) { await food.loadPlan() }
            .refreshable { await food.loadPlan() }
        }
    }
}

struct ShopView: View {
    @Bindable var food: FoodViewModel
    @State private var newItem = ""

    var body: some View {
        NavigationStack {
            List {
                ForEach(food.shop) { item in
                    Button {
                        Task { await food.toggleShop(item) }
                    } label: {
                        HStack {
                            Image(systemName: item.isChecked ? "checkmark.circle.fill" : "circle")
                                .foregroundStyle(item.isChecked ? HTTheme.gold : HTTheme.muted)
                            VStack(alignment: .leading) {
                                Text(item.name)
                                    .strikethrough(item.isChecked)
                                    .foregroundStyle(HTTheme.forest)
                                if let amt = item.amount {
                                    Text("\(amt) \(item.unit ?? "")").font(.caption).foregroundStyle(HTTheme.muted)
                                }
                            }
                        }
                    }
                }
                HStack {
                    TextField("Add item", text: $newItem)
                    Button("Add") {
                        let name = newItem
                        newItem = ""
                        Task { await food.addShopItem(name) }
                    }
                    .disabled(newItem.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
            .navigationTitle("Shop")
            .task(id: food.sessionEpoch) { await food.loadShop() }
            .refreshable { await food.loadShop() }
        }
    }
}

struct CaloriesView: View {
    @Bindable var food: FoodViewModel
    @State private var name = ""
    @State private var meal = "snack"
    @State private var calories = 0
    @State private var protein = 0
    @State private var showAdd = false

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

                    if showAdd {
                        HTCard {
                            TextField("What did you eat?", text: $name)
                            HStack {
                                Stepper("\(calories) kcal", value: $calories, in: 0...2000, step: 10)
                                Stepper("\(protein)g protein", value: $protein, in: 0...200, step: 5)
                            }
                            .font(.caption)
                            Button("Log \(meal)") {
                                Task {
                                    await food.addManual(name: name, meal: meal, calories: calories, protein: protein, carbs: 0, fat: 0, fiber: 0)
                                    name = ""
                                    calories = 0
                                    protein = 0
                                    showAdd = false
                                }
                            }
                            .font(.headline)
                            .foregroundStyle(HTTheme.forest)
                            .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                        }
                    }

                    if food.logs.isEmpty {
                        Text("No meals logged yet. Tap a meal chip, or log a recipe from the Recipes tab.")
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
            }
            .background(HTTheme.cream.ignoresSafeArea())
            .navigationTitle("Macros")
            .task(id: food.sessionEpoch) { await food.loadLogs() }
            .refreshable { await food.loadLogs() }
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
}
