import Foundation

enum SuperJSON {
    /// Unwrap tRPC + superjson: `{ "result": { "data": { "json": T, "meta": ... } } }`
    static func decode<T: Decodable>(_ type: T.Type, from data: Data) throws -> T {
        let raw = try JSONSerialization.jsonObject(with: data)
        let jsonValue = try unwrapPayload(raw)
        let normalized = applyDateMeta(jsonValue)
        let encoded = try JSONSerialization.data(withJSONObject: normalized, options: [.fragmentsAllowed])
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { dec in
            let c = try dec.singleValueContainer()
            if let s = try? c.decode(String.self) {
                if let d = ISO8601DateFormatter.full.date(from: s) { return d }
                if let d = ISO8601DateFormatter.frac.date(from: s) { return d }
            }
            if let ms = try? c.decode(Double.self) {
                return Date(timeIntervalSince1970: ms / 1000)
            }
            throw DecodingError.dataCorruptedError(in: c, debugDescription: "Not a date")
        }
        return try decoder.decode(T.self, from: encoded)
    }

    static func encodeInput<T: Encodable>(_ value: T) throws -> Data {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        let inner = try encoder.encode(value)
        let obj = try JSONSerialization.jsonObject(with: inner)
        return try JSONSerialization.data(withJSONObject: ["json": obj])
    }

    static func encodeEmptyInput() throws -> Data {
        try JSONSerialization.data(withJSONObject: ["json": NSNull()])
    }

    private static func unwrapPayload(_ raw: Any) throws -> Any {
        guard let root = raw as? [String: Any] else {
            throw APIError.badPayload("Root is not an object")
        }
        if let err = root["error"] as? [String: Any] {
            let msg = ((err["json"] as? [String: Any])?["message"] as? String)
                ?? (err["message"] as? String)
                ?? "Request failed"
            throw APIError.server(msg)
        }
        if let result = root["result"] as? [String: Any] {
            if let data = result["data"] as? [String: Any], let json = data["json"] {
                return applyMeta(json: json, meta: data["meta"] as? [String: Any])
            }
            if let data = result["data"] {
                return data
            }
        }
        if let json = root["json"] {
            return applyMeta(json: json, meta: root["meta"] as? [String: Any])
        }
        throw APIError.badPayload("Unrecognized tRPC envelope")
    }

    private static func applyMeta(json: Any, meta: [String: Any]?) -> Any {
        guard let values = meta?["values"] as? [String: Any] else { return json }
        return applyValues(json, values: values, prefix: "")
    }

    private static func applyValues(_ json: Any, values: [String: Any], prefix: String) -> Any {
        if let dict = json as? [String: Any] {
            var out: [String: Any] = [:]
            for (k, v) in dict {
                let path = prefix.isEmpty ? k : "\(prefix).\(k)"
                out[k] = applyValues(v, values: values, prefix: path)
            }
            return out
        }
        if let arr = json as? [Any] {
            return arr.enumerated().map { i, v in
                applyValues(v, values: values, prefix: prefix.isEmpty ? "\(i)" : "\(prefix).\(i)")
            }
        }
        return json
    }

    private static func applyDateMeta(_ json: Any) -> Any { json }
}

private extension ISO8601DateFormatter {
    static let full: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    static let frac: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime]
        return f
    }()
}
