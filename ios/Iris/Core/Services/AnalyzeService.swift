import Foundation

final class AnalyzeService {
    private let client: APIClient

    init(client: APIClient = .shared) {
        self.client = client
    }

    func analyzePhoto(
        imageData: Data,
        assignmentId: String? = nil,
        filename: String = "field-capture.jpg"
    ) async throws -> AnalysisResult {
        let prepared = ImageUploadPrep.jpegForUpload(from: imageData)
        var fields: [String: String] = [:]
        if let assignmentId, !assignmentId.isEmpty {
            fields["assignment_id"] = assignmentId
        }
        var lastError: Error?
        for attempt in 1 ... 3 {
            do {
                return try await client.postMultipart(
                    AnalysisResult.self,
                    path: "/api/v1/analyze-photo",
                    fileField: "image",
                    fileData: prepared,
                    filename: filename,
                    mimeType: "image/jpeg",
                    fields: fields
                )
            } catch {
                lastError = error
                guard attempt < 3, Self.shouldRetry(error) else { throw error }
                try await Task.sleep(nanoseconds: UInt64(attempt) * 2_000_000_000)
            }
        }
        throw lastError ?? APIClientError.httpStatus(-1, "Upload failed")
    }

    private static func shouldRetry(_ error: Error) -> Bool {
        let ns = error as NSError
        if ns.domain == NSURLErrorDomain {
            switch ns.code {
            case NSURLErrorNetworkConnectionLost,
                 NSURLErrorTimedOut,
                 NSURLErrorCannotConnectToHost,
                 NSURLErrorNotConnectedToInternet:
                return true
            default:
                return false
            }
        }
        return false
    }
}
