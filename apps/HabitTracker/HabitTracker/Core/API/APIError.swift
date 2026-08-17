import Foundation

enum APIError: LocalizedError {
    case notConfigured
    case unauthorized
    case server(String)
    case badPayload(String)
    case http(Int, String)
    case network(Error)

    var errorDescription: String? {
        switch self {
        case .notConfigured: return "The app is not configured."
        case .unauthorized: return "Please sign in again."
        case .server(let m): return m
        case .badPayload(let m): return "Unexpected response: \(m)"
        case .http(let c, let m): return "Server \(c): \(m)"
        case .network(let e): return e.localizedDescription
        }
    }
}
