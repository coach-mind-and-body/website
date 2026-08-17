import SwiftUI

struct MainTabView: View {
    var auth: AuthStore
    var health: HealthKitService
    @State private var habits: HabitsViewModel
    @State private var food: FoodViewModel
    @State private var coach: CoachViewModel
    @State private var showHealth = false

    init(auth: AuthStore, health: HealthKitService) {
        self.auth = auth
        self.health = health
        _habits = State(initialValue: HabitsViewModel(auth: auth, health: health))
        _food = State(initialValue: FoodViewModel(auth: auth))
        _coach = State(initialValue: CoachViewModel(auth: auth))
    }

    var body: some View {
        TabView {
            HabitsView(model: habits, health: health)
                .tabItem { Label("Habits", systemImage: "checkmark.circle") }

            FoodHubView(food: food, auth: auth)
                .tabItem { Label("Food", systemImage: "fork.knife") }

            CoachView(model: coach, auth: auth)
                .tabItem { Label("Coach", systemImage: "message") }
                .badge(coach.unread)

            ProfileView(auth: auth, health: health)
                .tabItem { Label("You", systemImage: "person") }
        }
        .tint(HTTheme.forest)
        .task {
            await coach.refreshUnread()
            if health.isAvailable && !UserDefaults.standard.bool(forKey: "health.prompted") {
                showHealth = true
            }
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(20))
                let before = coach.unread
                await coach.refreshUnread()
                if coach.notifyEnabled, coach.unread > before {
                    await NotificationService.notifyCoachReply(preview: "New message in Coach")
                }
            }
        }
        .sheet(isPresented: $showHealth) {
            HealthPermissionView(health: health, isPresented: $showHealth)
        }
    }
}

struct FoodHubView: View {
    @Bindable var food: FoodViewModel
    @Bindable var auth: AuthStore
    @State private var page = 0

    var body: some View {
        VStack(spacing: 0) {
            Picker("", selection: $page) {
                Text("Recipes").tag(0)
                Text("Week").tag(1)
                Text("Shop").tag(2)
                Text("Macros").tag(3)
            }
            .pickerStyle(.segmented)
            .padding(12)
            .background(HTTheme.cream)

            TabView(selection: $page) {
                RecipesView(food: food, auth: auth).tag(0)
                MealPlanView(food: food, auth: auth).tag(1)
                ShopView(food: food).tag(2)
                CaloriesView(food: food).tag(3)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
        }
    }
}

struct HealthPermissionView: View {
    @Bindable var health: HealthKitService
    @Binding var isPresented: Bool

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 16) {
                Text("Apple Health")
                    .font(HTTheme.serif)
                    .foregroundStyle(HTTheme.forest)
                Text("Habit Tracker can read steps, last night’s sleep, and weight so your day isn’t another form to fill out. You choose what to share. We never sell Health data. This is a coaching tool, not a medical device.")
                    .foregroundStyle(HTTheme.muted)
                if let err = health.lastError {
                    Text(err).foregroundStyle(.red).font(.caption)
                }
                Spacer()
                Button("Continue") {
                    Task {
                        await health.requestAccess()
                        UserDefaults.standard.set(true, forKey: "health.prompted")
                        isPresented = false
                    }
                }
                .buttonStyle(.borderedProminent)
                .tint(HTTheme.forest)
                .frame(maxWidth: .infinity)
                Button("Not now") {
                    UserDefaults.standard.set(true, forKey: "health.prompted")
                    isPresented = false
                }
                .frame(maxWidth: .infinity)
            }
            .padding(24)
            .background(HTTheme.cream.ignoresSafeArea())
        }
        .presentationDetents([.medium])
    }
}

struct RootView: View {
    var auth: AuthStore
    var health: HealthKitService

    var body: some View {
        Group {
            if auth.isRestoring {
                ProgressView("Loading")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(HTTheme.cream.ignoresSafeArea())
            } else {
                MainTabView(auth: auth, health: health)
            }
        }
        .task { await auth.restore() }
    }
}
