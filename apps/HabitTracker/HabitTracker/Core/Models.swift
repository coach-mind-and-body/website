import Foundation

struct Habit: Codable, Identifiable, Hashable {
    let id: Int
    var title: String
    var description: String?
    var type: String
    var targetValue: Int?
    var unit: String?
    var isActive: Bool?
    var order: Int?

    var isNumeric: Bool { type == "numeric" }
}

struct HabitLog: Codable, Hashable {
    var id: Int?
    var userHabitId: Int
    var dateStr: String
    var completed: Bool
    var numericValue: Int?

    var stableId: String { "\(userHabitId)-\(dateStr)" }
}

struct DailyNote: Codable, Hashable {
    var dateStr: String
    var note: String
}

struct HabitsPayload: Codable {
    var habits: [Habit]
    var logs: [HabitLog]
    var notes: [DailyNote]?
    var shareHabitsWithCoach: Bool?
}

struct ToggleLogInput: Encodable {
    let userHabitId: Int
    let dateStr: String
    let completed: Bool
    let numericValue: Int?
}

struct SuccessFlag: Decodable {
    let success: Bool?
}

struct FromDateInput: Encodable {
    let fromDate: String
}

struct Recipe: Codable, Identifiable, Hashable {
    let id: Int
    var slug: String
    var title: String
    var description: String?
    var imageUrl: String?
    var source: String?
    var tags: [String]?
    var mealSlots: [String]?
    var prepMinutes: Int?
    var cookMinutes: Int?
    var servings: Int?
    var calories: Int?
    var protein: Int?
    var carbs: Int?
    var fat: Int?
    var fiber: Int?
    var ingredients: [RecipeIngredient]?
    var steps: [RecipeStep]?
    var notes: String?
    var showNutrition: Bool?
    var isPublished: Bool?
    var isFeatured: Bool?
    var isFavorite: Bool?
}

struct RecipeIngredient: Codable, Hashable {
    var name: String
    var amount: String?
    var unit: String?
    var notes: String?
}

struct RecipeStep: Codable, Hashable {
    var text: String
}

struct RecipeListInput: Encodable {
    var q: String?
    var tag: String?
    var mealSlot: String?
    var favoritesOnly: Bool?
}

struct SlugInput: Encodable {
    let slug: String
}

struct MealPlanSlot: Codable, Hashable {
    var id: Int?
    var dayOfWeek: Int
    var slot: String
    var servings: Int?
    var recipeId: Int?
    var recipe: Recipe?
}

struct MealPlan: Codable, Identifiable, Hashable {
    var id: Int
    var title: String
    var description: String?
    var notes: String?
    var showNutrition: Bool?
    var assigned: Bool?
    var slots: [MealPlanSlot]?
}

struct CalorieLog: Codable, Identifiable, Hashable {
    var id: Int
    var dateStr: String
    var mealType: String
    var foodName: String
    var calories: Int
    var protein: Int
    var carbs: Int
    var fat: Int
    var fiber: Int
    var recipeId: Int?
}

struct DateStrInput: Encodable {
    let dateStr: String
}

struct AddCalorieInput: Encodable {
    let dateStr: String
    let mealType: String
    let foodName: String
    let calories: Int
    let protein: Int
    let carbs: Int
    let fat: Int
    let fiber: Int
    var recipeId: Int?
    var servings: Int?
}

struct ShoppingItem: Codable, Identifiable, Hashable {
    var id: Int
    var name: String
    var amount: String?
    var unit: String?
    var aisle: String?
    var isChecked: Bool
    var source: String?
}

struct MealPlanIdInput: Encodable {
    let mealPlanId: Int
}

struct CheckInput: Encodable {
    let id: Int
    let checked: Bool
}

struct AddShopInput: Encodable {
    let name: String
    var amount: String?
}

struct IdInput: Codable {
    let id: Int
}

struct CoachThread: Codable {
    var conversationId: Int
    var coachName: String
    var messages: [CoachMessage]
}

struct CoachMessage: Codable, Identifiable, Hashable {
    var id: Int
    var direction: String
    var senderName: String?
    var content: String?
    var mediaUrl: String?
    var createdAt: Date?
    var isAutomated: Bool?

    var isMine: Bool { direction == "inbound" }

    var recipeSlug: String? {
        guard let content else { return nil }
        guard let match = content.range(of: #"/habit-tracker/recipes/([a-z0-9-]+)"#, options: .regularExpression) else {
            return nil
        }
        let slice = content[match]
        return slice.split(separator: "/").last.map(String.init)
    }

    var isImageAttachment: Bool {
        guard let mediaUrl else { return false }
        return mediaUrl.range(of: #"\.(png|jpe?g|gif|webp|svg)(\?|$)"#, options: [.regularExpression, .caseInsensitive]) != nil
    }
}

struct UnreadCount: Codable {
    var count: Int
}

struct SendCoachInput: Encodable {
    var content: String?
    var mediaUrl: String?
}

struct FavoriteInput: Encodable {
    let recipeId: Int
}

struct FavoriteResult: Decodable {
    let favorited: Bool
}

struct MeUser: Codable {
    var id: Int?
    var name: String?
    var email: String?
    var role: String?
    var shareHabitsWithCoach: Bool?
}

struct ShareInput: Encodable {
    let share: Bool
}

struct FitnessLog: Codable, Identifiable, Hashable {
    var id: Int
    var dateStr: String
    var exerciseName: String
    var sets: Int
    var reps: Int
    var weight: Int
    var durationMinutes: Int
}

struct FitnessAddInput: Encodable {
    let dateStr: String
    let exerciseName: String
    var sets: Int = 1
    var reps: Int = 0
    var weight: Int = 0
    var durationMinutes: Int = 0
}

struct WorkoutVideo: Codable, Identifiable, Hashable {
    var id: Int
    var title: String
    var description: String?
    var videoUrl: String
    var category: String?
}

struct PodcastEpisode: Codable, Identifiable, Hashable {
    var id: String
    var title: String
    var description: String?
    var thumbnail: String?
    var publishedAt: String?
    var videoId: String
    var slug: String?
    var habitActionsJson: String?
}

struct PodcastPayload: Codable {
    var episodes: [PodcastEpisode]
}

struct Challenge: Codable, Identifiable, Hashable {
    var id: Int
    var title: String
    var description: String?
    var durationDays: Int?
    var isActive: Bool?
    var isFeatured: Bool?
    var linkedPodcastSlug: String?
}

struct UserChallenge: Codable, Identifiable, Hashable {
    var id: Int
    var challengeId: Int
    var status: String?
    var startDate: String?
}

struct ChallengeLog: Codable, Identifiable, Hashable {
    var id: Int?
    var userChallengeId: Int
    var dateStr: String
}

struct UserChallengesPayload: Codable {
    var challenges: [UserChallenge]
    var logs: [ChallengeLog]?
}

struct JoinChallengeInput: Encodable {
    let challengeId: Int
    var deviceId: String?
}

struct ToggleChallengeLogInput: Encodable {
    let userChallengeId: Int
    let dateStr: String
    let completed: Bool
    var deviceId: String?
}

struct AppUpdate: Codable, Identifiable, Hashable {
    var id: Int
    var title: String
    var message: String
    var videoUrl: String?
}

struct WeeklyInsight: Codable, Hashable {
    var weekCompletedDays: Int?
    var lastWeekCompletedDays: Int?
    var currentStreak: Int?
    var bestStreak: Int?
    var victoryDaysThisWeek: Int?
    var bestWeekday: String?
    var topHabitTitle: String?
    var headline: String?
    var body: String?
    var tip: String?
}

struct VictoryList: Codable, Identifiable, Hashable {
    var id: Int?
    var dateStr: String
    var win1: String?
    var win2: String?
    var win3: String?
}

struct SaveVictoryInput: Encodable {
    let dateStr: String
    let win1: String
    let win2: String
    let win3: String
    var deviceId: String?
}

struct VictoryQueryInput: Encodable {
    var fromDate: String?
    var deviceId: String?
}

struct HabitAction: Codable, Hashable {
    var title: String
    var type: String?
    var targetValue: Int?
    var unit: String?
    var description: String?
}

struct DeleteCalorieInput: Encodable {
    let id: Int
    let dateStr: String
}

struct FoodEstimate: Codable, Hashable {
    var foodName: String
    var calories: Int
    var protein: Int
    var carbs: Int
    var fat: Int
    var fiber: Int
}

struct AnalyzeTextInput: Encodable {
    let foodName: String
    var deviceId: String?
}

struct AnalyzeImageInput: Encodable {
    let imageBase64: String
    var userHint: String?
    var deviceId: String?
}

struct FatSecretStatus: Codable {
    var configured: Bool?
}

struct FatSecretSearchInput: Encodable {
    let q: String
    var page: Int?
}

struct FatSecretFood: Codable, Identifiable, Hashable {
    var foodId: String
    var name: String
    var brand: String?
    var description: String?
    var calories: Int
    var protein: Int
    var carbs: Int
    var fat: Int
    var id: String { foodId }
}

struct FatSecretFoodsPayload: Codable {
    var foods: [FatSecretFood]
    var total: Int?
}

struct DeviceIdInput: Encodable {
    var deviceId: String?
}

struct SyncHabitInput: Encodable {
    var title: String
    var description: String?
    var type: String
    var targetValue: Int?
    var unit: String?
    var order: Int
    var isActive: Bool
}

struct SaveNoteInput: Encodable {
    let dateStr: String
    let note: String
}
