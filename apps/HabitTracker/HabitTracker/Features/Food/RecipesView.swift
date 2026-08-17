import SwiftUI

struct RecipesView: View {
    @Bindable var food: FoodViewModel
    @Bindable var auth: AuthStore

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Text("The vault")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(HTTheme.muted)
                        .textCase(.uppercase)
                    Text("Recipes")
                        .font(HTTheme.serif)
                        .foregroundStyle(HTTheme.forest)
                    TextField("Search recipes", text: $food.query)
                        .textFieldStyle(.roundedBorder)
                        .onSubmit { Task { await food.loadRecipes() } }

                    if let err = food.errorMessage {
                        Text(err).font(.caption).foregroundStyle(.red)
                    } else if food.isLoading && food.recipes.isEmpty {
                        ProgressView().frame(maxWidth: .infinity).padding(.top, 24)
                    } else if food.recipes.isEmpty {
                        Text("No recipes yet. Pull to refresh.")
                            .font(.subheadline)
                            .foregroundStyle(HTTheme.muted)
                    }

                    LazyVStack(spacing: 12) {
                        ForEach(food.recipes) { recipe in
                            NavigationLink(value: recipe.slug) {
                                recipeCard(recipe)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .padding(16)
            }
            .background(HTTheme.cream.ignoresSafeArea())
            .navigationTitle("Recipes")
            .navigationDestination(for: String.self) { slug in
                RecipeDetailView(slug: slug, food: food, auth: auth)
            }
            .task(id: food.sessionEpoch) { await food.loadRecipes() }
            .refreshable { await food.loadRecipes() }
        }
    }

    private func recipeCard(_ recipe: Recipe) -> some View {
        HTCard {
            HStack(alignment: .top, spacing: 12) {
                recipeThumb(recipe.imageUrl)
                VStack(alignment: .leading, spacing: 4) {
                    Text(recipe.title).font(.headline).foregroundStyle(HTTheme.forest).multilineTextAlignment(.leading)
                    if let p = recipe.protein {
                        Text("\(p)g protein").font(.caption.weight(.semibold)).foregroundStyle(HTTheme.gold)
                    }
                    let mins = (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0)
                    if mins > 0 {
                        Text("\(mins) min").font(.caption).foregroundStyle(HTTheme.muted)
                    }
                }
                Spacer(minLength: 0)
            }
        }
    }

    private func recipeThumb(_ url: String?) -> some View {
        AsyncImage(url: url.flatMap(URL.init(string:))) { phase in
            switch phase {
            case .success(let img): img.resizable().scaledToFill()
            default: HTTheme.roseBorder
            }
        }
        .frame(width: 72, height: 72)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

struct RecipeDetailView: View {
    let slug: String
    @Bindable var food: FoodViewModel
    @Bindable var auth: AuthStore
    @State private var recipe: Recipe?
    @State private var servings = 1
    @State private var meal = "lunch"
    @State private var logged = false

    var body: some View {
        ScrollView {
            if let recipe {
                VStack(alignment: .leading, spacing: 14) {
                    AsyncImage(url: recipe.imageUrl.flatMap(URL.init(string:))) { phase in
                        switch phase {
                        case .success(let img): img.resizable().scaledToFill()
                        default: HTTheme.roseBorder
                        }
                    }
                    .frame(height: 220)
                    .clipped()
                    .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))

                    Text(recipe.title).font(HTTheme.serif).foregroundStyle(HTTheme.forest)
                    if let d = recipe.description { Text(d).foregroundStyle(HTTheme.muted) }

                    if recipe.showNutrition != false {
                        HStack {
                            macro("P", recipe.protein)
                            macro("C", recipe.carbs)
                            macro("F", recipe.fat)
                            macro("kcal", recipe.calories)
                        }
                    }

                    if let ings = recipe.ingredients, !ings.isEmpty {
                        Text("Ingredients").font(.headline).foregroundStyle(HTTheme.forest)
                        ForEach(Array(ings.enumerated()), id: \.offset) { _, ing in
                            Text("• \(ing.amount ?? "") \(ing.unit ?? "") \(ing.name)".replacingOccurrences(of: "  ", with: " "))
                                .font(.subheadline)
                        }
                    }

                    if let steps = recipe.steps, !steps.isEmpty {
                        Text("Steps").font(.headline).foregroundStyle(HTTheme.forest)
                        ForEach(Array(steps.enumerated()), id: \.offset) { i, step in
                            Text("\(i + 1). \(step.text)").font(.subheadline)
                        }
                    }

                    Picker("Meal", selection: $meal) {
                            Text("Breakfast").tag("breakfast")
                            Text("Lunch").tag("lunch")
                            Text("Dinner").tag("dinner")
                            Text("Snack").tag("snack")
                        }
                        .pickerStyle(.segmented)
                        Stepper("Servings: \(servings)", value: $servings, in: 1...8)
                        Button(logged ? "Logged" : "Log this meal") {
                            Task {
                                await food.logRecipe(recipe, meal: meal, servings: servings)
                                logged = true
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(HTTheme.forest)
                        .disabled(logged)
                    if !auth.isSignedIn {
                        Text("Saved on this iPhone. Sign in under You to sync.")
                            .font(.caption)
                            .foregroundStyle(HTTheme.muted)
                    }
                }
                .padding(16)
            } else {
                ProgressView().padding(.top, 80)
            }
        }
        .background(HTTheme.cream.ignoresSafeArea())
        .task { recipe = await food.recipe(slug: slug) }
    }

    private func macro(_ label: String, _ value: Int?) -> some View {
        VStack {
            Text("\(value ?? 0)").font(.headline).foregroundStyle(HTTheme.forest)
            Text(label).font(.caption2.weight(.bold)).foregroundStyle(HTTheme.muted)
        }
        .frame(maxWidth: .infinity)
        .padding(8)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}
