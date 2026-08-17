import Foundation

actor TRPCClient {
    var token: String?

    func setToken(_ token: String?) {
        self.token = token
    }

    func query<T: Decodable>(_ path: String) async throws -> T {
        try await send(path: path, body: try SuperJSON.encodeEmptyInput(), decode: T.self, method: "GET")
    }

    func query<T: Decodable, I: Encodable>(_ path: String, input: I) async throws -> T {
        try await send(path: path, body: try SuperJSON.encodeInput(input), decode: T.self, method: "GET")
    }

    func mutate<T: Decodable, I: Encodable>(_ path: String, input: I) async throws -> T {
        try await send(path: path, body: try SuperJSON.encodeInput(input), decode: T.self, method: "POST")
    }

    func mutateEmpty<T: Decodable>(_ path: String) async throws -> T {
        try await send(path: path, body: try SuperJSON.encodeEmptyInput(), decode: T.self, method: "POST")
    }

    private func send<T: Decodable>(path: String, body: Data, decode: T.Type, method: String) async throws -> T {
        let base = AppConfig.trpcURL.appending(path: path)
        var request = URLRequest(url: base)
        request.httpMethod = method
        if let token, !token.isEmpty {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if method == "GET" {
            var comps = URLComponents(url: base, resolvingAgainstBaseURL: false)
            comps?.queryItems = [
                URLQueryItem(name: "input", value: String(data: body, encoding: .utf8))
            ]
            guard let getURL = comps?.url else {
                throw APIError.badPayload("Could not build request URL")
            }
            request.url = getURL
        } else {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = body
        }

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw APIError.badPayload("No HTTP response")
        }
        if http.statusCode == 401 {
            throw APIError.unauthorized
        }
        if http.statusCode >= 400 {
            let snippet = String(data: data, encoding: .utf8) ?? ""
            throw APIError.http(http.statusCode, String(snippet.prefix(240)))
        }
        do {
            return try SuperJSON.decode(T.self, from: data)
        } catch {
            if let fallback = try? JSONDecoder().decode(T.self, from: data) {
                return fallback
            }
            throw error
        }
    }

    func login(email: String, password: String) async throws -> AuthResponse {
        var request = URLRequest(url: AppConfig.loginURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(LoginBody(email: email, password: password))
        let (data, response) = try await URLSession.shared.data(for: request)
        let http = response as? HTTPURLResponse
        if http?.statusCode == 401 {
            throw APIError.server("Invalid email or password")
        }
        if let code = http?.statusCode, code >= 400 {
            if let obj = try? JSONDecoder().decode(ErrorBody.self, from: data) {
                throw APIError.server(obj.error)
            }
            throw APIError.http(code, String(data: data, encoding: .utf8) ?? "")
        }
        return try JSONDecoder().decode(AuthResponse.self, from: data)
    }

    func apple(identityToken: String, name: String?) async throws -> AuthResponse {
        var request = URLRequest(url: AppConfig.apiRoot.appending(path: "api/auth/apple"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        struct Body: Encodable { let identityToken: String; let name: String? }
        request.httpBody = try JSONEncoder().encode(Body(identityToken: identityToken, name: name))
        let (data, response) = try await URLSession.shared.data(for: request)
        let http = response as? HTTPURLResponse
        if let code = http?.statusCode, code >= 400 {
            if let obj = try? JSONDecoder().decode(ErrorBody.self, from: data) {
                throw APIError.server(obj.error)
            }
            throw APIError.http(code, String(data: data, encoding: .utf8) ?? "")
        }
        return try JSONDecoder().decode(AuthResponse.self, from: data)
    }

    func signup(name: String, email: String, password: String) async throws -> AuthResponse {
        var request = URLRequest(url: AppConfig.signupURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(SignupBody(name: name, email: email, password: password))
        let (data, response) = try await URLSession.shared.data(for: request)
        let http = response as? HTTPURLResponse
        if let code = http?.statusCode, code >= 400 {
            if let obj = try? JSONDecoder().decode(ErrorBody.self, from: data) {
                throw APIError.server(obj.error)
            }
            throw APIError.http(code, String(data: data, encoding: .utf8) ?? "")
        }
        return try JSONDecoder().decode(AuthResponse.self, from: data)
    }
}

private struct LoginBody: Encodable {
    let email: String
    let password: String
}

private struct SignupBody: Encodable {
    let name: String
    let email: String
    let password: String
}

private struct ErrorBody: Decodable {
    let error: String
}

struct AuthUser: Codable, Equatable {
    let id: Int
    let name: String?
    let email: String?
    let role: String?
}

struct AuthResponse: Decodable {
    let success: Bool?
    let sessionToken: String?
    let user: AuthUser?
}
