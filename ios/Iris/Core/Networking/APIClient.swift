import Foundation

enum APIClientError: LocalizedError {
    case invalidURL
    case httpStatus(Int, String)
    case decoding(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid API URL"
        case let .httpStatus(code, body):
            if let detail = Self.parseDetail(from: body) {
                return Self.friendlyDetail(detail, code: code)
            }
            return body.isEmpty ? "Request failed (\(code))" : body
        case let .decoding(error):
            return "Could not read server response: \(error.localizedDescription)"
        }
    }

    private static func parseDetail(from body: String) -> String? {
        guard let data = body.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let detail = json["detail"] as? String,
              !detail.isEmpty
        else {
            return nil
        }
        return detail
    }

    private static func friendlyDetail(_ detail: String, code: Int) -> String {
        if detail.contains("Expecting value") {
            return "Coach couldn't read the frame — try again in a moment."
        }
        if detail.contains("Rate limited") {
            return detail
        }
        if detail.contains("Capture session") {
            return detail
        }
        if code >= 500 {
            return "Coach temporarily unavailable — grid still works."
        }
        return detail
    }
}

/// Mirrors web `apiFetch` — attaches `X-User-Id` when set.
final class APIClient {
    static let shared = APIClient()

    private let baseURL: URL
    private let session: URLSession
    private let decoder: JSONDecoder

    var userId: String? {
        didSet {
            if let userId, !userId.isEmpty {
                UserDefaults.standard.set(userId, forKey: AppConfig.demoUserIdKey)
            } else {
                UserDefaults.standard.removeObject(forKey: AppConfig.demoUserIdKey)
            }
        }
    }

    init(baseURL: URL = AppConfig.apiBaseURL, session: URLSession? = nil) {
        self.baseURL = baseURL
        if let session {
            self.session = session
        } else {
            let config = URLSessionConfiguration.default
            config.timeoutIntervalForRequest = 45
            config.timeoutIntervalForResource = 90
            config.waitsForConnectivity = false
            self.session = URLSession(configuration: config)
        }
        self.decoder = JSONDecoder()
        let stored = UserDefaults.standard.string(forKey: AppConfig.demoUserIdKey) ?? ""
        if stored.hasPrefix("demo-ios-") {
            UserDefaults.standard.removeObject(forKey: AppConfig.demoUserIdKey)
            self.userId = nil
        } else {
            self.userId = stored.isEmpty ? nil : stored
        }
    }

    func url(path: String) throws -> URL {
        let normalized = path.hasPrefix("/") ? String(path.dropFirst()) : path
        guard let url = URL(string: normalized, relativeTo: baseURL) else {
            throw APIClientError.invalidURL
        }
        return url
    }

    func request(
        path: String,
        method: String = "GET",
        body: Data? = nil,
        contentType: String? = nil
    ) async throws -> (Data, HTTPURLResponse) {
        let url = try url(path: path)
        var req = URLRequest(url: url)
        req.httpMethod = method
        if let userId, !userId.isEmpty {
            req.setValue(userId, forHTTPHeaderField: "X-User-Id")
        }
        if let contentType {
            req.setValue(contentType, forHTTPHeaderField: "Content-Type")
        }
        req.httpBody = body

        let (data, response) = try await session.data(for: req)
        guard let http = response as? HTTPURLResponse else {
            throw APIClientError.httpStatus(-1, "No HTTP response")
        }
        guard (200 ..< 300).contains(http.statusCode) else {
            let text = String(data: data, encoding: .utf8) ?? ""
            throw APIClientError.httpStatus(http.statusCode, text)
        }
        return (data, http)
    }

    func getJSON<T: Decodable>(_ type: T.Type, path: String) async throws -> T {
        let (data, _) = try await request(path: path)
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIClientError.decoding(error)
        }
    }

    func postJSON<T: Decodable>(_ type: T.Type, path: String, timeout: TimeInterval = 60) async throws -> T {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = timeout
        config.timeoutIntervalForResource = timeout
        let session = URLSession(configuration: config)
        let url = try url(path: path)
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        if let userId, !userId.isEmpty {
            req.setValue(userId, forHTTPHeaderField: "X-User-Id")
        }
        let (data, response) = try await session.data(for: req)
        guard let http = response as? HTTPURLResponse else {
            throw APIClientError.httpStatus(-1, "No HTTP response")
        }
        guard (200 ..< 300).contains(http.statusCode) else {
            let text = String(data: data, encoding: .utf8) ?? ""
            throw APIClientError.httpStatus(http.statusCode, text)
        }
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIClientError.decoding(error)
        }
    }

    func patchJSON<T: Decodable, B: Encodable>(
        _ type: T.Type,
        path: String,
        body: B,
        timeout: TimeInterval = 60
    ) async throws -> T {
        let encoder = JSONEncoder()
        let payload = try encoder.encode(body)
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = timeout
        config.timeoutIntervalForResource = timeout
        let session = URLSession(configuration: config)
        let url = try url(path: path)
        var req = URLRequest(url: url)
        req.httpMethod = "PATCH"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let userId, !userId.isEmpty {
            req.setValue(userId, forHTTPHeaderField: "X-User-Id")
        }
        req.httpBody = payload
        let (data, response) = try await session.data(for: req)
        guard let http = response as? HTTPURLResponse else {
            throw APIClientError.httpStatus(-1, "No HTTP response")
        }
        guard (200 ..< 300).contains(http.statusCode) else {
            let text = String(data: data, encoding: .utf8) ?? ""
            throw APIClientError.httpStatus(http.statusCode, text)
        }
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIClientError.decoding(error)
        }
    }

    func postJSON<T: Decodable, B: Encodable>(
        _ type: T.Type,
        path: String,
        body: B,
        timeout: TimeInterval = 180
    ) async throws -> T {
        let encoder = JSONEncoder()
        let payload = try encoder.encode(body)
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = timeout
        config.timeoutIntervalForResource = timeout
        let session = URLSession(configuration: config)
        let url = try url(path: path)
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let userId, !userId.isEmpty {
            req.setValue(userId, forHTTPHeaderField: "X-User-Id")
        }
        req.httpBody = payload
        let (data, response) = try await session.data(for: req)
        guard let http = response as? HTTPURLResponse else {
            throw APIClientError.httpStatus(-1, "No HTTP response")
        }
        guard (200 ..< 300).contains(http.statusCode) else {
            let text = String(data: data, encoding: .utf8) ?? ""
            throw APIClientError.httpStatus(http.statusCode, text)
        }
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIClientError.decoding(error)
        }
    }

    /// Multipart upload (e.g. `POST /api/v1/analyze-photo`). File-based upload + long timeouts for Coach analysis.
    func postMultipart<T: Decodable>(
        _ type: T.Type,
        path: String,
        fileField: String,
        fileData: Data,
        filename: String,
        mimeType: String,
        fields: [String: String] = [:],
        timeout: TimeInterval = 300
    ) async throws -> T {
        let boundary = "Boundary-\(UUID().uuidString)"
        var body = Data()
        for (key, value) in fields {
            body.appendFormField(name: key, value: value, boundary: boundary)
        }
        body.appendFileField(
            name: fileField,
            filename: filename,
            mimeType: mimeType,
            fileData: fileData,
            boundary: boundary
        )
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)

        let config = URLSessionConfiguration.ephemeral
        config.timeoutIntervalForRequest = timeout
        config.timeoutIntervalForResource = timeout
        config.waitsForConnectivity = false
        config.allowsCellularAccess = true
        config.httpMaximumConnectionsPerHost = 1
        config.multipathServiceType = .none
        let uploadSession = URLSession(configuration: config)

        let url = try url(path: path)
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        req.setValue("close", forHTTPHeaderField: "Connection")
        if let userId, !userId.isEmpty {
            req.setValue(userId, forHTTPHeaderField: "X-User-Id")
        }

        // `data(for:)` is more reliable than `upload(fromFile:)` on Simulator for sub‑5MB bodies.
        req.httpBody = body
        let (data, response) = try await uploadSession.data(for: req)
        guard let http = response as? HTTPURLResponse else {
            throw APIClientError.httpStatus(-1, "No HTTP response")
        }
        guard (200 ..< 300).contains(http.statusCode) else {
            let text = String(data: data, encoding: .utf8) ?? ""
            throw APIClientError.httpStatus(http.statusCode, text)
        }
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIClientError.decoding(error)
        }
    }
}

private extension Data {
    mutating func appendFormField(name: String, value: String, boundary: String) {
        append("--\(boundary)\r\n".data(using: .utf8)!)
        append("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n".data(using: .utf8)!)
        append("\(value)\r\n".data(using: .utf8)!)
    }

    mutating func appendFileField(
        name: String,
        filename: String,
        mimeType: String,
        fileData: Data,
        boundary: String
    ) {
        append("--\(boundary)\r\n".data(using: .utf8)!)
        append(
            "Content-Disposition: form-data; name=\"\(name)\"; filename=\"\(filename)\"\r\n"
                .data(using: .utf8)!
        )
        append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        append(fileData)
        append("\r\n".data(using: .utf8)!)
    }
}
