import Foundation

enum APIError: LocalizedError {
    case notConfigured
    case unauthorized
    case empty
    case server(String)
    case badPayload(String)
    case http(Int, String)
    case network(Error)

    var errorDescription: String? {
        switch self {
        case .notConfigured: return "The app is not configured."
        case .unauthorized: return "Please sign in again."
        case .empty: return "Empty response."
        case .server(let m): return m
        case .badPayload(let m): return "Unexpected response: \(m)"
        case .http(let c, let m): return "Server \(c): \(m)"
        case .network(let e): return e.localizedDescription
        }
    }
}

extension Error {
    /// Task or URLSession cancellation (a refresh superseded by another, a date change, `.task` restart).
    /// Not a failure to show. Leaves any real message already on screen alone.
    var isCancellation: Bool {
        if self is CancellationError { return true }
        if (self as? URLError)?.code == .cancelled { return true }
        if let api = self as? APIError, case .network(let inner) = api {
            return inner.isCancellation
        }
        let ns = self as NSError
        // NSURLErrorCancelled is -999.
        return ns.domain == NSURLErrorDomain && ns.code == NSURLErrorCancelled
    }
}
