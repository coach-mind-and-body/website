import SwiftUI

enum AppTab: Hashable {
    case habits, macros, recipes, fitness, profile, coach, podcast
}

struct MainTabView: View {
    var auth: AuthStore
    var health: HealthKitService
    @State private var habits: HabitsViewModel
    @State private var food: FoodViewModel
    @State private var coach: CoachViewModel
    @State private var fitness: FitnessViewModel
    @State private var podcast: PodcastViewModel
    @State private var tab: AppTab = .habits
    @State private var showHealth = false
    @Environment(\.scenePhase) private var scenePhase

    init(auth: AuthStore, health: HealthKitService) {
        self.auth = auth
        self.health = health
        _habits = State(initialValue: HabitsViewModel(auth: auth, health: health))
        _food = State(initialValue: FoodViewModel(auth: auth))
        _coach = State(initialValue: CoachViewModel(auth: auth))
        _fitness = State(initialValue: FitnessViewModel(auth: auth, health: health))
        _podcast = State(initialValue: PodcastViewModel(auth: auth))
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            HTTheme.cream.ignoresSafeArea()
            Group {
                switch tab {
                case .habits:
                    HabitsView(model: habits, health: health, auth: auth)
                case .macros:
                    CaloriesView(food: food, auth: auth)
                case .recipes:
                    RecipesHubView(food: food, auth: auth)
                case .fitness:
                    FitnessView(model: fitness, auth: auth)
                case .profile:
                    ProfileView(auth: auth, health: health)
                case .coach:
                    CoachView(model: coach, auth: auth)
                case .podcast:
                    PodcastView(model: podcast, auth: auth)
                }
            }
            tabBar
                .padding(.horizontal, 14)
                .padding(.bottom, 8)
                .ignoresSafeArea(.container, edges: .bottom)
        }
        .environment(\.openProfile) { tab = .profile }
        .tint(HTTheme.forest)
        .task {
            await coach.refreshUnread()
            if health.isAvailable && !UserDefaults.standard.bool(forKey: "health.prompted") {
                showHealth = true
            }
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(8))
                if tab == .coach {
                    coach.isOnCoachTab = true
                    await coach.load(announce: false)
                } else {
                    coach.isOnCoachTab = false
                    let before = coach.unread
                    await coach.refreshUnread()
                    if coach.notifyEnabled, coach.unread > before {
                        await NotificationService.notifyCoachReply(preview: "New message in Coach")
                    }
                }
            }
        }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active {
                Task {
                    if tab == .coach {
                        await coach.load(announce: false)
                    } else {
                        await coach.refreshUnread()
                    }
                }
            }
        }
        .sheet(isPresented: $showHealth, onDismiss: {
            Task { await habits.syncFromHealth() }
        }) {
            HealthPermissionView(health: health, isPresented: $showHealth)
        }
    }

    private var tabBar: some View {
        HStack(spacing: 10) {
            HStack(spacing: 0) {
                tabButton(.habits, "square.grid.2x2")
                tabButton(.macros, "fork.knife")
                tabButton(.recipes, "frying.pan")
                tabButton(.fitness, "figure.strengthtraining.traditional")
                tabButton(.podcast, "headphones")
            }
            .padding(.horizontal, 6)
            .padding(.vertical, 5)
            .background(.ultraThinMaterial)
            .clipShape(Capsule())
            .overlay(Capsule().stroke(Color.white.opacity(0.4), lineWidth: 1))
            .shadow(color: .black.opacity(0.12), radius: 12, y: 4)

            circleButton(.coach, "message", badge: coach.unread)
        }
    }

    private func tabButton(_ value: AppTab, _ icon: String) -> some View {
        let on = tab == value
        return Button {
            tab = value
        } label: {
            Image(systemName: icon)
                .font(.system(size: 18, weight: on ? .semibold : .regular))
                .foregroundStyle(on ? Color.white : HTTheme.muted)
                .frame(maxWidth: .infinity)
                .frame(height: 40)
                .background(on ? HTTheme.forest : Color.clear)
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label(for: value))
    }

    private func circleButton(_ value: AppTab, _ icon: String, badge: Int) -> some View {
        let on = tab == value
        return Button {
            tab = value
        } label: {
            ZStack(alignment: .topTrailing) {
                Image(systemName: icon)
                    .font(.system(size: 18, weight: on ? .semibold : .regular))
                    .foregroundStyle(on ? Color.white : HTTheme.muted)
                    .frame(width: 48, height: 48)
                    .background(on ? HTTheme.forest : Color.clear)
                    .background(.ultraThinMaterial)
                    .clipShape(Circle())
                    .overlay(Circle().stroke(Color.white.opacity(0.45), lineWidth: 1))
                    .shadow(color: HTTheme.forest.opacity(0.12), radius: 12, y: 4)
                if badge > 0 {
                    Text(badge > 9 ? "9+" : "\(badge)")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 5)
                        .padding(.vertical, 2)
                        .background(Color.red)
                        .clipShape(Capsule())
                        .offset(x: 4, y: -4)
                }
            }
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label(for: value))
    }

    private func label(for tab: AppTab) -> String {
        switch tab {
        case .habits: "Habits"
        case .macros: "Macros"
        case .recipes: "Recipes"
        case .fitness: "Fitness"
        case .profile: "Profile"
        case .coach: "Coach"
        case .podcast: "Podcast"
        }
    }
}

struct RecipesHubView: View {
    @Bindable var food: FoodViewModel
    @Bindable var auth: AuthStore
    @State private var page = 0

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Picker("", selection: $page) {
                    Text("Recipes").tag(0)
                    Text("Week").tag(1)
                    Text("Shop").tag(2)
                }
                .pickerStyle(.segmented)
                .padding(.horizontal, 16)
                .padding(.top, 4)
                .padding(.bottom, 10)

                Group {
                    switch page {
                    case 1:
                        MealPlanView(food: food, auth: auth)
                    case 2:
                        ShopView(food: food)
                    default:
                        RecipesView(food: food, auth: auth)
                    }
                }
            }
            .background(HTTheme.cream.ignoresSafeArea())
            .navigationTitle(page == 1 ? "This week" : page == 2 ? "Shop" : "Recipes")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    ProfileAvatarButton(auth: auth)
                }
            }
            .navigationDestination(for: String.self) { slug in
                RecipeDetailView(slug: slug, food: food, auth: auth)
            }
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
                Text("With your permission, Habit Tracker reads exercise, workouts, mindful minutes, sleep, steps, and weight — and writes back workouts and mindful sessions you start here, so Apple Health stays in sync. Move Body, Mindful Minutes, and Restful Sleep can check themselves. We never sell Health data. This is a coaching tool, not a medical device.")
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
