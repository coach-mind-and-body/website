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
    var sessionEpoch = 0

    var isSignedIn: Bool { token != nil && user != nil && (user?.id ?? 0) > 0 }

    var isAdmin: Bool {
        let role = (user?.role ?? "").lowercased()
        let email = (user?.email ?? "").lowercased().trimmingCharacters(in: .whitespaces)
        return role == "admin"
            || email == "coach@mindandbodyresetcoach.com"
            || email == "carter@inseitzmarketing.com"
    }

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
            if let me = try await loadMeOptional() {
                user = me
                sessionEpoch += 1
            } else {
                signOut()
            }
        } catch {
            if let optional = try? await loadMeOptional() {
                user = optional
                sessionEpoch += 1
            } else {
                signOut()
            }
        }
    }

    private func loadMeOptional() async throws -> AuthUser? {
        struct Box: Decodable {
            let id: Int?
            let name: String?
            let email: String?
            let role: String?
        }
        do {
            let box: Box = try await client.query("auth.me")
            guard let id = box.id, id > 0 else { return nil }
            return AuthUser(id: id, name: box.name, email: box.email, role: box.role)
        } catch APIError.empty {
            return nil
        }
    }

    func signIn(email: String, password: String) async {
        errorMessage = nil
        do {
            let res = try await client.login(email: email.trimmingCharacters(in: .whitespaces), password: password)
            guard let tok = res.sessionToken, let u = res.user else {
                errorMessage = "Sign-in did not return a session. Update the server if this persists."
                return
            }
            await apply(token: tok, user: u)
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
            await apply(token: tok, user: u)
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
            await apply(token: tok, user: u)
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
            sessionEpoch += 1
            return
        }
        errorMessage = "Signed in, but your profile did not load. Pull to refresh on the You screen."
    }

    func signOut() {
        KeychainStore.deleteToken()
        token = nil
        user = nil
        sessionEpoch += 1
        Task { await client.setToken(nil) }
    }

    private func apply(token: String, user: AuthUser) async {
        self.token = token
        self.user = user
        KeychainStore.saveToken(token)
        await client.setToken(token)
        sessionEpoch += 1
    }
}
