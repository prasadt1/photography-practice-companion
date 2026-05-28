import Foundation

#if canImport(FirebaseCore)
import FirebaseCore
#endif

enum FirebaseBootstrap {
    /// Returns whether `GoogleService-Info.plist` is present and Firebase was configured.
    @discardableResult
    static func configureIfPossible() -> Bool {
        guard Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist") != nil else {
            return false
        }
        #if canImport(FirebaseCore)
        if FirebaseApp.app() == nil {
            FirebaseApp.configure()
        }
        return true
        #else
        return false
        #endif
    }

    static var isConfigured: Bool {
        #if canImport(FirebaseCore)
        return FirebaseApp.app() != nil
        #else
        return false
        #endif
    }

    /// `CLIENT_ID` from `GoogleService-Info.plist` for Google Sign-In.
    static var clientID: String? {
        guard let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
              let dict = NSDictionary(contentsOfFile: path),
              let id = dict["CLIENT_ID"] as? String,
              !id.isEmpty
        else {
            return nil
        }
        return id
    }

    /// Add this string as a URL scheme in the app (see `Iris/Info.plist`).
    static var reversedClientID: String? {
        guard let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
              let dict = NSDictionary(contentsOfFile: path),
              let id = dict["REVERSED_CLIENT_ID"] as? String,
              !id.isEmpty
        else {
            return nil
        }
        return id
    }
}
