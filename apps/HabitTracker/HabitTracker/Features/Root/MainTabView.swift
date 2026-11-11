import SwiftUI

enum AppTab: Hashable {
    case habits, macros, recipes, fitness, profile, coach, podcast, programs
}

struct MainTabView: View {
    var auth: AuthStore
    var health: HealthKitService
    @State private var habits: HabitsViewModel
    @State private var food: FoodViewModel
    @State private var coach: CoachViewModel
    @State private var fitness: FitnessViewModel
    @State private var podcast: PodcastViewModel
    @State private var tab: AppTab
    @State private var showHealth = false
    @State private var showNotifyPrompt = false
    @State private var showSharePrompt = false
    @Environment(\.scenePhase) private var scenePhase
    @State private var showProfile = false
    @State private var openForm: FormLink?

    init(auth: AuthStore, health: HealthKitService) {
        self.auth = auth
        self.health = health
        _habits = State(initialValue: HabitsViewModel(auth: auth, health: health))
        _food = State(initialValue: FoodViewModel(auth: auth))
        _coach = State(initialValue: CoachViewModel(auth: auth))
        _fitness = State(initialValue: FitnessViewModel(auth: auth, health: health))
        _podcast = State(initialValue: PodcastViewModel(auth: auth))
        _tab = State(initialValue: auth.usesAdminChrome ? .coach : .habits)
    }

    var body: some View {
        rootTabs
            .overlay {
                ConfettiBurst(token: habits.confettiBurst)
                    .ignoresSafeArea()
                    .allowsHitTesting(false)
            }
            .background(HTTheme.cream.ignoresSafeArea())
            .fullScreenCover(isPresented: $showProfile) {
                ProfileView(auth: auth, health: health, onClose: { showProfile = false })
            }
        .environment(\.openProfile) {
            if auth.usesAdminChrome {
                tab = .profile
            } else {
                showProfile = true
            }
        }
        .onChange(of: auth.preferClientPreview) { _, preview in
            if auth.isAdmin {
                tab = preview ? .habits : .coach
            }
        }
        .tint(HTTheme.forest)
        .task {
            if auth.usesAdminChrome {
                _ = await NotificationService.requestAuthorization()
            } else {
                await NotificationService.registerIfAuthorized()
                await NotificationService.refreshDailyReminders()
            }
            if let token = DeviceTokenStore.current {
                await auth.uploadDeviceToken(token)
            }
            applyDeepLink(DeepLink.consumePending())
            await habits.load()
            applyDeepLink(DeepLink.consumePending())
            await coach.refreshUnread()
            await refreshSessionReminders()
            promptNextOnboarding()
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(30))
                if tab == .coach { continue }
                let before = coach.unread
                await coach.refreshUnread()
                if coach.notifyEnabled, coach.unread > before {
                    await NotificationService.notifyCoachReply(preview: "New message in Coach")
                }
            }
        }
        .onChange(of: tab) { _, next in
            if next == .habits {
                Task { await habits.onFoodLogged() }
            }
            if next == .podcast {
                Task { await podcast.load() }
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .mbrFoodLogged)) { _ in
            Task { await habits.onFoodLogged() }
        }
        .onReceive(NotificationCenter.default.publisher(for: .mbrNotificationAction)) { _ in
            Task {
                await habits.load()
                await food.loadLogs()
                await fitness.load()
            }
        }
        .sheet(item: $openForm) { form in
            NavigationStack {
                FormFillView(auth: auth, formId: form.id)
                    .toolbar {
                        ToolbarItem(placement: .cancellationAction) {
                            Button("Close") { openForm = nil }
                        }
                    }
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .mbrDeviceToken)) { note in
            guard let token = note.object as? String else { return }
            Task { await auth.uploadDeviceToken(token) }
        }
        .onReceive(NotificationCenter.default.publisher(for: .mbrOpenDeepLink)) { note in
            let raw = note.userInfo?["link"] as? String
            applyDeepLink(raw.flatMap(DeepLink.init(rawValue:)) ?? DeepLink.consumePending())
        }
        .onChange(of: auth.isSignedIn) { _, _ in
            Task { await refreshSessionReminders() }
        }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active {
                Task {
                    if tab != .programs {
                        await refreshSessionReminders()
                    }
                    if tab == .coach {
                        await coach.load(announce: false)
                    } else {
                        await coach.refreshUnread()
                    }
                }
            }
        }
        .sheet(isPresented: $showNotifyPrompt, onDismiss: {
            promptNextOnboarding()
            Task { await refreshSessionReminders() }
        }) {
            NotifyPromptView(isPresented: $showNotifyPrompt)
        }
        .sheet(isPresented: $showSharePrompt, onDismiss: { promptNextOnboarding() }) {
            ShareHabitsPromptView(auth: auth, isPresented: $showSharePrompt)
        }
        .sheet(isPresented: $showHealth, onDismiss: {
            Task { await habits.syncFromHealth() }
            promptNextOnboarding()
        }) {
            HealthPermissionView(health: health, isPresented: $showHealth)
        }
    }

    private func applyDeepLink(_ link: DeepLink?) {
        guard let link else { return }
        DeepLink.pending = nil
        switch link {
        case .challenge:
            tab = .habits
            Task { await habits.openChallengePane() }
        case .coach:
            if auth.isAdmin, DeepLink.pendingConversationId != nil {
                auth.preferClientPreview = false
            } else if !auth.isAdmin {
                DeepLink.pendingConversationId = nil
            }
            tab = .coach
        case .habits:
            tab = .habits
        case .programs:
            tab = .programs
        case .food, .scan:
            if !auth.usesAdminChrome { tab = .recipes }
        case .fitness:
            if !auth.usesAdminChrome { tab = .fitness }
        case .form:
            if !auth.usesAdminChrome { tab = .programs }
            if let id = DeepLink.pendingFormId {
                openForm = FormLink(id: id)
                DeepLink.pendingFormId = nil
            }
        }
    }

    /// Schedules coaching reminders after the hub loads, even if My Programs isn't open.
    /// My Programs loads the same hub itself, so this skips that tab to avoid a second fetch.
    private func refreshSessionReminders() async {
        guard auth.isSignedIn, !auth.usesAdminChrome else {
            if !auth.isSignedIn {
                let token = await CoachingReminderCoordinator.shared.begin()
                await CoachingReminderCoordinator.shared.apply(token: token, reminders: [])
            }
            return
        }
        if tab == .programs { return }
        guard await NotificationService.isAuthorized() else { return }
        let token = await CoachingReminderCoordinator.shared.begin()
        do {
            let hub: ProgramHub = try await auth.client.query(
                "reclaimHub.myHub",
                cachePolicy: .reloadIgnoringLocalCacheData
            )
            guard auth.isSignedIn, !auth.usesAdminChrome else { return }
            await CoachingReminderCoordinator.shared.apply(token: token, reminders: hub.coachingReminders())
        } catch {
            return
        }
    }

    private func promptNextOnboarding() {
        if auth.usesAdminChrome { return }
        if !UserDefaults.standard.bool(forKey: "notify.prompted") {
            showNotifyPrompt = true
            return
        }
        if auth.isSignedIn && !UserDefaults.standard.bool(forKey: "share.prompted") && !habits.shareHabitsWithCoach {
            showSharePrompt = true
            return
        }
        if health.isAvailable && !UserDefaults.standard.bool(forKey: "health.prompted") {
            showHealth = true
        }
    }

    /// System tabs, each with a title and a symbol, so iPhone Duo can place the bar on the side
    /// and overflow the less-used items. Coach stays ahead of Podcast so the badge remains reachable.
    @ViewBuilder
    private var rootTabs: some View {
        if auth.usesAdminChrome {
            TabView(selection: $tab) {
                CoachInboxView(coach: coach, auth: auth, showsModePicker: false)
                    .countBadge(coach.unread)
                    .tabItem { Label("Coach", systemImage: "message") }
                    .tag(AppTab.coach)
                AdminHabitsPhoneView(auth: auth)
                    .tabItem { Label("Habits", systemImage: "checklist") }
                    .tag(AppTab.habits)
                ProfileView(auth: auth, health: health)
                    .tabItem { Label("Profile", systemImage: "person.crop.circle") }
                    .tag(AppTab.profile)
            }
        } else {
            TabView(selection: $tab) {
                HabitsView(model: habits, health: health, auth: auth, food: food)
                    .tabItem { Label("Habits", systemImage: "square.grid.2x2") }
                    .tag(AppTab.habits)
                ProgramsView(auth: auth)
                    .tabItem { Label("My Programs", systemImage: "book.closed") }
                    .tag(AppTab.programs)
                RecipesHubView(food: food, auth: auth)
                    .tabItem { Label("Recipes", systemImage: "frying.pan") }
                    .tag(AppTab.recipes)
                FitnessView(model: fitness, auth: auth)
                    .tabItem { Label("Fitness", systemImage: "figure.strengthtraining.traditional") }
                    .tag(AppTab.fitness)
                CoachView(model: coach, auth: auth)
                    .countBadge(coach.unread)
                    .tabItem { Label("Coach", systemImage: "message") }
                    .tag(AppTab.coach)
                PodcastView(model: podcast, auth: auth)
                    .tabItem { Label("Podcast", systemImage: "headphones") }
                    .tag(AppTab.podcast)
            }
        }
    }
}

struct RecipesHubView: View {
    @Bindable var food: FoodViewModel
    @Bindable var auth: AuthStore
    @State private var page = 0
    @State private var foodPane = FoodPaneBridge()

    var body: some View {
        NavigationStack {
            DuoPanes(style: .augment) {
            VStack(spacing: 0) {
                Picker("", selection: $page) {
                    Text("Today").tag(0)
                    Text("Recipes").tag(1)
                    Text("Week").tag(2)
                    Text("Shop").tag(3)
                }
                .pickerStyle(.segmented)
                .padding(.horizontal, 16)
                .padding(.top, 4)
                .padding(.bottom, 10)

                Group {
                    switch page {
                    case 0:
                        CaloriesView(food: food, auth: auth, pane: foodPane)
                    case 2:
                        MealPlanView(food: food, auth: auth, pane: foodPane) { page = 3 }
                    case 3:
                        ShopView(food: food, auth: auth)
                    default:
                        RecipesView(food: food, auth: auth, pane: foodPane)
                    }
                }
            }
            .background(HTTheme.cream.ignoresSafeArea())
            .navigationTitle(page == 0 ? "Today" : page == 2 ? "This week" : page == 3 ? "Shop" : "Recipes")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    ProfileAvatarButton(auth: auth)
                }
            }
            .navigationDestination(for: String.self) { slug in
                RecipeDetailView(slug: slug, food: food, auth: auth)
            }
            .onChange(of: page) { _, _ in
                foodPane.log = nil
                foodPane.recipeSlug = nil
            }
            } controls: {
                if page == 0 {
                    FoodTodayOpenPane(food: food, auth: auth, pane: foodPane)
                } else {
                    FoodOpenPane(food: food, auth: auth, pane: foodPane)
                }
            }
        }
    }
}

private struct NotifyPromptView: View {
    @Binding var isPresented: Bool

    var body: some View {
        NavigationStack {
            DuoPanes(style: .augment) {
            VStack(alignment: .leading, spacing: 16) {
                Text("Evening check-in")
                    .font(HTTheme.serif)
                    .foregroundStyle(HTTheme.forest)
                Text("A few quiet nudges through the day — water, a walk, food — then an 8:00 pm look at today’s habits. No scoreboard. Turn this off anytime in You.")
                    .foregroundStyle(HTTheme.muted)
                Spacer()
                Button("Turn on reminders") {
                    Task {
                        UserDefaults.standard.set(true, forKey: "notify.prompted")
                        let ok = await NotificationService.requestAuthorization()
                        if ok { await NotificationService.scheduleEveningNudge() }
                        isPresented = false
                    }
                }
                .buttonStyle(.borderedProminent)
                .tint(HTTheme.forest)
                .frame(maxWidth: .infinity)
                Button("Not now") {
                    UserDefaults.standard.set(true, forKey: "notify.prompted")
                    isPresented = false
                }
                .frame(maxWidth: .infinity)
            }
            .padding(24)
            .background(HTTheme.cream.ignoresSafeArea())
            } controls: {
                Button("Turn on reminders") {
                    Task {
                        UserDefaults.standard.set(true, forKey: "notify.prompted")
                        let ok = await NotificationService.requestAuthorization()
                        if ok { await NotificationService.scheduleEveningNudge() }
                        isPresented = false
                    }
                }
                .font(.headline)
                .frame(maxWidth: .infinity, minHeight: 56)
                .buttonStyle(.borderedProminent)
                .tint(HTTheme.forest)
                .padding(16)
            }
        }
        .presentationDetents([.medium])
    }
}

private struct ShareHabitsPromptView: View {
    var auth: AuthStore
    @Binding var isPresented: Bool

    var body: some View {
        NavigationStack {
            DuoPanes(style: .augment) {
            VStack(alignment: .leading, spacing: 16) {
                Text("Share habits with Lee Anne?")
                    .font(HTTheme.serif)
                    .foregroundStyle(HTTheme.forest)
                Text("If you say yes, Lee Anne can see your daily targets so she can coach you. You can change this later in You.")
                    .foregroundStyle(HTTheme.muted)
                Spacer()
                Button("Share with Lee Anne") {
                    Task {
                        UserDefaults.standard.set(true, forKey: "share.prompted")
                        _ = try? await auth.client.mutate(
                            "habit.toggleShareHabits",
                            input: ShareInput(share: true)
                        ) as SuccessFlag
                        isPresented = false
                    }
                }
                .buttonStyle(.borderedProminent)
                .tint(HTTheme.forest)
                .frame(maxWidth: .infinity)
                Button("Keep private") {
                    UserDefaults.standard.set(true, forKey: "share.prompted")
                    isPresented = false
                }
                .frame(maxWidth: .infinity)
            }
            .padding(24)
            .background(HTTheme.cream.ignoresSafeArea())
            } controls: {
                Button("Share with Lee Anne") {
                    Task {
                        UserDefaults.standard.set(true, forKey: "share.prompted")
                        _ = try? await auth.client.mutate(
                            "habit.toggleShareHabits",
                            input: ShareInput(share: true)
                        ) as SuccessFlag
                        isPresented = false
                    }
                }
                .font(.headline)
                .frame(maxWidth: .infinity, minHeight: 56)
                .buttonStyle(.borderedProminent)
                .tint(HTTheme.forest)
                .padding(16)
            }
        }
        .presentationDetents([.medium])
    }
}

struct HealthPermissionView: View {
    @Bindable var health: HealthKitService
    @Binding var isPresented: Bool

    var body: some View {
        NavigationStack {
            DuoPanes(style: .augment) {
            VStack(alignment: .leading, spacing: 16) {
                Text("Apple Health")
                    .font(HTTheme.serif)
                    .foregroundStyle(HTTheme.forest)
                Text("With your permission, Habit Tracker reads exercise, workouts, mindful minutes, sleep, steps, weight, and cycle data — and writes back workouts, mindful sessions, and cycle days you log here. Cycle stays on this iPhone; Lee Anne cannot see it. We never sell Health data. This is a coaching tool, not a medical device.")
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
            } controls: {
                Button("Continue") {
                    Task {
                        await health.requestAccess()
                        UserDefaults.standard.set(true, forKey: "health.prompted")
                        isPresented = false
                    }
                }
                .font(.headline)
                .frame(maxWidth: .infinity, minHeight: 56)
                .buttonStyle(.borderedProminent)
                .tint(HTTheme.forest)
                .padding(16)
            }
        }
        .presentationDetents([.medium])
    }
}

struct RootView: View {
    var auth: AuthStore
    var health: HealthKitService

    var body: some View {
        DuoPostureHost {
            Group {
                if auth.isRestoring {
                    ProgressView("Loading")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(HTTheme.cream.ignoresSafeArea())
                } else {
                    MainTabView(auth: auth, health: health)
                }
            }
        }
        .installKeyboardDismissTap()
        .task { await auth.restore() }
    }
}
