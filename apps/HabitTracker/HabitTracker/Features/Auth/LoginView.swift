import SwiftUI

struct LoginView: View {
    @Bindable var auth: AuthStore
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var isSignup = false
    @State private var busy = false

    var body: some View {
        VStack(spacing: 20) {
            Spacer()
            Text("Habit Tracker")
                .font(HTTheme.serif)
                .foregroundStyle(HTTheme.forest)
            Text("Mind and Body Reset")
                .font(.subheadline)
                .foregroundStyle(HTTheme.muted)

            VStack(spacing: 12) {
                if isSignup {
                    TextField("Your name", text: $name)
                        .textContentType(.name)
                        .padding(12)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                TextField("Email", text: $email)
                    .textContentType(.username)
                    .textInputAutocapitalization(.never)
                    .keyboardType(.emailAddress)
                    .padding(12)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                SecureField("Password", text: $password)
                    .textContentType(isSignup ? .newPassword : .password)
                    .padding(12)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .padding(.horizontal, 24)

            if let err = auth.errorMessage {
                Text(err).font(.caption).foregroundStyle(.red).multilineTextAlignment(.center).padding(.horizontal)
            }

            Button {
                busy = true
                Task {
                    if isSignup {
                        await auth.signUp(name: name, email: email, password: password)
                    } else {
                        await auth.signIn(email: email, password: password)
                    }
                    busy = false
                }
            } label: {
                Group {
                    if busy { ProgressView().tint(.white) }
                    else { Text(isSignup ? "Create account" : "Sign in") }
                }
                .font(.headline)
                .frame(maxWidth: .infinity)
                .padding(14)
                .background(HTTheme.forest)
                .foregroundStyle(.white)
                .clipShape(Capsule())
            }
            .disabled(busy || email.isEmpty || password.count < 8 || (isSignup && name.isEmpty))
            .padding(.horizontal, 24)

            Button(isSignup ? "Already have an account" : "Create an account") {
                isSignup.toggle()
            }
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(HTTheme.gold)

            Text("This is a coaching and wellness tool, not medical advice.")
                .font(.caption2)
                .foregroundStyle(HTTheme.muted)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            Spacer()
        }
        .background(HTTheme.cream.ignoresSafeArea())
    }
}
