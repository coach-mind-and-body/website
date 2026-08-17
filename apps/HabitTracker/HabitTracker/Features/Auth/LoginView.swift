import AuthenticationServices
import SwiftUI
import UIKit

struct LoginView: View {
    @Bindable var auth: AuthStore
    var allowsSkip = true
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var isSignup = false
    @State private var busy = false
    @State private var googleHelper = GoogleAuthHelper()

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                Text("Habit Tracker")
                    .font(HTTheme.serif)
                    .foregroundStyle(HTTheme.forest)
                Text("Sign in to sync and message Lee Anne. Or skip and track on this iPhone.")
                    .font(.subheadline)
                    .foregroundStyle(HTTheme.muted)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)

                SignInWithAppleButton(.signIn) { request in
                    request.requestedScopes = [.fullName, .email]
                } onCompletion: { result in
                    switch result {
                    case .success(let authorization):
                        guard
                            let cred = authorization.credential as? ASAuthorizationAppleIDCredential,
                            let tokenData = cred.identityToken,
                            let token = String(data: tokenData, encoding: .utf8)
                        else {
                            auth.errorMessage = "Apple did not return a token."
                            return
                        }
                        let full = [cred.fullName?.givenName, cred.fullName?.familyName]
                            .compactMap { $0 }
                            .joined(separator: " ")
                        busy = true
                        Task {
                            await auth.signInWithApple(identityToken: token, name: full.isEmpty ? nil : full)
                            busy = false
                            if auth.isSignedIn { dismiss() }
                        }
                    case .failure(let error):
                        auth.errorMessage = error.localizedDescription
                    }
                }
                .signInWithAppleButtonStyle(.black)
                .frame(height: 48)
                .padding(.horizontal, 24)

                Button {
                    busy = true
                    Task {
                        do {
                            let token = try await googleHelper.signIn()
                            await auth.applyTokenOnly(token)
                        } catch {
                            // Session can report cancel while habittracker:// still delivers the token.
                            if !auth.isSignedIn {
                                auth.errorMessage = Self.googleErrorMessage(error)
                            }
                        }
                        busy = false
                        if auth.isSignedIn { dismiss() }
                    }
                } label: {
                    Text("Continue with Google")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(14)
                        .background(Color.white)
                        .foregroundStyle(HTTheme.forest)
                        .overlay(Capsule().stroke(HTTheme.roseBorder))
                        .clipShape(Capsule())
                }
                .padding(.horizontal, 24)

                Text("or email")
                    .font(.caption)
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
                        if auth.isSignedIn { dismiss() }
                    }
                } label: {
                    Group {
                        if busy { ProgressView().tint(.white) }
                        else { Text(isSignup ? "Create account" : "Sign in with email") }
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

                if allowsSkip {
                    Button("Continue without an account") {
                        dismiss()
                    }
                    .font(.subheadline)
                    .foregroundStyle(HTTheme.muted)
                }

                Text("This is a coaching and wellness tool, not medical advice. Sign in with Apple is required by Apple if you also offer Google.")
                    .font(.caption2)
                    .foregroundStyle(HTTheme.muted)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }
            .padding(.vertical, 28)
        }
        .background(HTTheme.cream.ignoresSafeArea())
        .onChange(of: auth.isSignedIn) { _, signedIn in
            if signedIn { dismiss() }
        }
    }

    private static func googleErrorMessage(_ error: Error) -> String {
        let ns = error as NSError
        if ns.domain == ASWebAuthenticationSessionError.errorDomain,
           ns.code == ASWebAuthenticationSessionError.canceledLogin.rawValue {
            return "Google sign-in was cancelled."
        }
        return error.localizedDescription
    }
}

final class GoogleAuthHelper: NSObject, ASWebAuthenticationPresentationContextProviding {
    private var session: ASWebAuthenticationSession?

    func signIn() async throws -> String {
        var comps = URLComponents(string: "https://mindandbodyresetcoach.com/api/auth/google")!
        comps.queryItems = [URLQueryItem(name: "returnTo", value: "habittracker://auth")]
        guard let url = comps.url else {
            throw APIError.server("Could not start Google sign-in.")
        }
        return try await withCheckedThrowingContinuation { cont in
            var finished = false
            let finish: (Result<String, Error>) -> Void = { result in
                guard !finished else { return }
                finished = true
                cont.resume(with: result)
            }
            let session = ASWebAuthenticationSession(url: url, callbackURLScheme: "habittracker") { [weak self] callback, error in
                self?.session = nil
                if let error {
                    finish(.failure(error))
                    return
                }
                let token = callback.flatMap {
                    URLComponents(url: $0, resolvingAgainstBaseURL: false)?
                        .queryItems?.first(where: { $0.name == "token" })?.value
                }
                if let token, !token.isEmpty {
                    finish(.success(token))
                } else {
                    finish(.failure(APIError.server("Google sign-in did not return a session.")))
                }
            }
            session.presentationContextProvider = self
            session.prefersEphemeralWebBrowserSession = true
            self.session = session
            if !session.start() {
                self.session = nil
                finish(.failure(APIError.server("Could not open Google sign-in.")))
            }
        }
    }

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first { $0.isKeyWindow } ?? ASPresentationAnchor()
    }
}
