import Foundation
import Observation

@MainActor
@Observable
final class AuthStore {
    let client = TRPCClient()
    var user: AuthUser?
    var token: String?
    var isRestoring = true
    var errorMessage: String?

    var isSignedIn: Bool { token != nil && user != nil }

    func restore() async {
        isRestoring = true
        defer { isRestoring = false }
        guard let saved = KeychainStore.readToken() else {
            token = nil
            user = nil
            return
        }
        token = saved
        await client.setToken(saved)
        do {
            let me: AuthUser = try await client.query("auth.me")
            user = me
        } catch {
            // Token expired or payload shape is null
            if let optional = try? await loadMeOptional() {
                user = optional
            } else {
                signOut()
            }
        }
    }

    private func loadMeOptional() async throws -> AuthUser? {
        // auth.me returns the user or null
        struct Box: Decodable {
            let id: Int?
            let name: String?
            let email: String?
            let role: String?
        }
        let box: Box = try await client.query("auth.me")
        guard let id = box.id else { return nil }
        return AuthUser(id: id, name: box.name, email: box.email, role: box.role)
    }

    func signIn(email: String, password: String) async {
        errorMessage = nil
        do {
            let res = try await client.login(email: email.trimmingCharacters(in: .whitespaces), password: password)
            guard let tok = res.sessionToken, let u = res.user else {
                errorMessage = "Sign-in did not return a session. Update the server if this persists."
                return
            }
            apply(token: tok, user: u)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func signUp(name: String, email: String, password: String) async {
        errorMessage = nil
        do {
            let res = try await client.signup(name: name, email: email, password: password)
            guard let tok = res.sessionToken, let u = res.user else {
                errorMessage = "Account created but session missing. Try signing in."
                return
            }
            apply(token: tok, user: u)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func signInWithApple(identityToken: String, name: String?) async {
        errorMessage = nil
        do {
            let res = try await client.apple(identityToken: identityToken, name: name)
            guard let tok = res.sessionToken, let u = res.user else {
                errorMessage = "Apple sign-in did not return a session."
                return
            }
            apply(token: tok, user: u)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func applyTokenOnly(_ token: String) async {
        errorMessage = nil
        self.token = token
        KeychainStore.saveToken(token)
        await client.setToken(token)
        if let me = try? await loadMeOptional() {
            user = me
            return
        }
        if let me = try? await client.query("auth.me") as AuthUser {
            user = me
            return
        }
        // Token is valid enough to persist; keep the session even if /me is slow.
        user = AuthUser(id: 0, name: "Signed in", email: nil, role: nil)
        errorMessage = nil
    }

    func signOut() {
        KeychainStore.deleteToken()
        token = nil
        user = nil
        Task { await client.setToken(nil) }
    }

    private func apply(token: String, user: AuthUser) {
        self.token = token
        self.user = user
        KeychainStore.saveToken(token)
        Task { await client.setToken(token) }
    }
}
