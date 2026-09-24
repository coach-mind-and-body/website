import SwiftUI

struct ProfileView: View {
    @Bindable var auth: AuthStore
    @Bindable var health: HealthKitService
    @State private var notifyOn = false
    @State private var shareWithCoach = false
    @State private var showLogin = false

    var body: some View {
        NavigationStack {
            List {
                Section {
                    if auth.isSignedIn {
                        Text(auth.user?.name ?? "Signed in")
                            .font(.headline)
                        if let email = auth.user?.email {
                            Text(email).foregroundStyle(HTTheme.muted)
                        }
                    } else {
                        Text("On this iPhone")
                            .font(.headline)
                        Text("Sign in to sync, message Lee Anne, and save a shopping list.")
                            .font(.caption)
                            .foregroundStyle(HTTheme.muted)
                        Button("Sign in or create account") { showLogin = true }
                    }
                    if let err = auth.errorMessage {
                        Text(err).font(.caption).foregroundStyle(.red)
                    }
                }

                if !auth.usesAdminChrome {
                Section("Health") {
                    if health.isAvailable {
                        Button("Allow Apple Health") {
                            Task { await health.requestAccess() }
                        }
                        LabeledContent("Steps today", value: "\(Int(health.stepsToday))")
                        LabeledContent("Sleep last night", value: String(format: "%.1f hr", health.sleepHoursLastNight))
                        if let lb = health.weightPounds {
                            LabeledContent("Weight", value: String(format: "%.0f lb", lb))
                        }
                        Text("We read exercise, mindfulness, sleep, steps, weight, and cycle data if you allow it — and write workouts, mindful sessions, and cycle days you log here back to Apple Health. Cycle stays on this iPhone; Lee Anne cannot see it. We do not sell Health data. This is not a medical device.")
                            .font(.caption)
                            .foregroundStyle(HTTheme.muted)
                        Text("Add the widget: long-press the Home Screen → tap Edit → Add Widget → Habit Tracker.")
                            .font(.caption)
                            .foregroundStyle(HTTheme.muted)
                    } else {
                        Text("Health data is not available on this device.")
                    }
                }

                Section("Notifications") {
                    Toggle("Evening habit check-in", isOn: $notifyOn)
                        .onChange(of: notifyOn) { _, on in
                            Task {
                                if on {
                                    let ok = await NotificationService.requestAuthorization()
                                    if ok { await NotificationService.scheduleEveningNudge() }
                                    notifyOn = ok
                                }
                            }
                        }
                }
                }

                if auth.isAdmin {
                    Section("Coach mode") {
                        Toggle("Preview client app", isOn: $auth.preferClientPreview)
                        Text(auth.preferClientPreview
                             ? "You’re seeing the same five tabs a client sees. Turn this off to get back to Inbox."
                             : "Inbox, daily habits, and You. Turn on to check the client app without signing out.")
                            .font(.caption)
                            .foregroundStyle(HTTheme.muted)
                    }
                }

                if auth.isSignedIn && !auth.usesAdminChrome {
                    Section("Coach") {
                        Toggle("Share habits with Lee Anne", isOn: $shareWithCoach)
                            .onChange(of: shareWithCoach) { _, on in
                                Task {
                                    _ = try? await auth.client.mutate(
                                        "habit.toggleShareHabits",
                                        input: ShareInput(share: on)
                                    ) as SuccessFlag
                                }
                            }
                    }
                }

                Section {
                    Link("Privacy policy", destination: AppConfig.privacyURL)
                    if auth.isSignedIn {
                        Button("Sign out", role: .destructive) { auth.signOut() }
                    }
                }
            }
            .dockScrollClearance()
            .navigationTitle("You")
            .sheet(isPresented: $showLogin) {
                LoginView(auth: auth, allowsSkip: true)
            }
            .task {
                await health.refreshToday()
                notifyOn = await NotificationService.isAuthorized()
                if auth.isSignedIn {
                    if let payload: HabitsPayload = try? await auth.client.query(
                        "habit.getUserHabits",
                        input: FromDateInput(fromDate: MountainDate.today())
                    ) {
                        shareWithCoach = payload.shareHabitsWithCoach ?? false
                    }
                }
            }
            .refreshable { await auth.restore(); await health.refreshToday() }
        }
    }
}
