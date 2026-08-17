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

                Section("Health") {
                    if health.isAvailable {
                        Button("Allow Apple Health") {
                            Task { await health.requestAccess() }
                        }
                        LabeledContent("Steps today", value: "\(Int(health.stepsToday))")
                        LabeledContent("Sleep last night", value: String(format: "%.1f hr", health.sleepHoursLastNight))
                        if let kg = health.weightKg {
                            LabeledContent("Weight", value: String(format: "%.1f kg", kg))
                        }
                        Text("We read exercise, mindfulness, sleep, steps, and weight — and write workouts and mindful sessions you start here back to Apple Health. We do not sell Health data. This is not a medical device.")
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

                if auth.isSignedIn {
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
            .navigationTitle("You")
            .sheet(isPresented: $showLogin) {
                LoginView(auth: auth, allowsSkip: true)
            }
            .task { await health.refreshToday() }
            .refreshable { await auth.restore(); await health.refreshToday() }
        }
    }
}
