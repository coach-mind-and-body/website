import Foundation
import Observation

@MainActor
@Observable
final class FoodViewModel {
    var recipes: [Recipe] = []
    var query = ""
    var mealPlan: MealPlan?
    var shop: [ShoppingItem] = []
    var logs: [CalorieLog] = []
    var dateStr = MountainDate.today()
    var isLoading = false
    var errorMessage: String?
    var selectedTag: String?

    private let auth: AuthStore

    init(auth: AuthStore) { self.auth = auth }

    var proteinTotal: Int { logs.reduce(0) { $0 + $1.protein } }
    var calorieTotal: Int { logs.reduce(0) { $0 + $1.calories } }

    func loadRecipes() async {
        isLoading = true
        defer { isLoading = false }
        do {
            let input = RecipeListInput(
                q: query.isEmpty ? nil : query,
                tag: selectedTag,
                mealSlot: nil,
                favoritesOnly: nil
            )
            recipes = try await auth.client.query("food.listRecipes", input: input)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func recipe(slug: String) async -> Recipe? {
        try? await auth.client.query("food.getRecipe", input: SlugInput(slug: slug))
    }

    func loadPlan() async {
        guard auth.isSignedIn else { return }
        do {
            mealPlan = try await auth.client.query("food.getMyMealPlan")
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func loadShop() async {
        guard auth.isSignedIn else { return }
        do {
            shop = try await auth.client.query("food.getShoppingList")
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func loadLogs() async {
        guard auth.isSignedIn else { return }
        do {
            logs = try await auth.client.query("calories.getLogs", input: DateStrInput(dateStr: dateStr))
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func logRecipe(_ recipe: Recipe, meal: String, servings: Int) async {
        let base = max(recipe.servings ?? 1, 1)
        let scale = Double(servings) / Double(base)
        do {
            let _: SuccessFlag = try await auth.client.mutate(
                "calories.addLog",
                input: AddCalorieInput(
                    dateStr: dateStr,
                    mealType: meal,
                    foodName: recipe.title,
                    calories: Int(Double(recipe.calories ?? 0) * scale),
                    protein: Int(Double(recipe.protein ?? 0) * scale),
                    carbs: Int(Double(recipe.carbs ?? 0) * scale),
                    fat: Int(Double(recipe.fat ?? 0) * scale),
                    fiber: Int(Double(recipe.fiber ?? 0) * scale),
                    recipeId: recipe.id,
                    servings: servings
                )
            )
            await loadLogs()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func buildShop() async {
        guard let id = mealPlan?.id else { return }
        do {
            let _: SuccessFlag = try await auth.client.mutate(
                "food.regenerateShoppingList",
                input: MealPlanIdInput(mealPlanId: id)
            )
            await loadShop()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func toggleShop(_ item: ShoppingItem) async {
        do {
            let _: SuccessFlag = try await auth.client.mutate(
                "food.setShoppingChecked",
                input: CheckInput(id: item.id, checked: !item.isChecked)
            )
            await loadShop()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func addShopItem(_ name: String) async {
        do {
            let _: IdInput = try await auth.client.mutate(
                "food.addShoppingItem",
                input: AddShopInput(name: name)
            )
            await loadShop()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func favorite(_ recipe: Recipe) async {
        guard auth.isSignedIn else { return }
        _ = try? await auth.client.mutate(
            "food.toggleFavorite",
            input: FavoriteInput(recipeId: recipe.id)
        ) as FavoriteResult
        await loadRecipes()
    }
}
