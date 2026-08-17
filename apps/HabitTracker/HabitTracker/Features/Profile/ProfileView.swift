import SwiftUI

struct ProfileView: View {
    @Bindable var auth: AuthStore
    @Bindable var health: HealthKitService
    @State private var notifyOn = false
    @State private var shareWithCoach = false

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Text(auth.user?.name ?? "Signed in")
                        .font(.headline)
                    if let email = auth.user?.email {
                        Text(email).foregroundStyle(HTTheme.muted)
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
                        Text("We read steps, sleep, and weight to fill your day. We do not sell Health data. This is not a medical device.")
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

                Section {
                    Link("Privacy policy", destination: AppConfig.privacyURL)
                    Button("Sign out", role: .destructive) { auth.signOut() }
                }
            }
            .navigationTitle("Profile")
            .task { await health.refreshToday() }
        }
    }
}
