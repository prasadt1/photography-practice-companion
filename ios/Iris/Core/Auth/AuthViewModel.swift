import Foundation
import UIKit

#if canImport(FirebaseAuth)
import FirebaseAuth
#endif
#if canImport(GoogleSignIn)
import GoogleSignIn
#endif

enum AuthPhase: Equatable {
    case loading
    case signIn
    case persona
    case ready
}

/// Firebase Google Sign-In + demo scope + persona for API routing.
@MainActor
final class AuthViewModel: ObservableObject {
    @Published var phase: AuthPhase = .loading
    @Published var userId: String {
        didSet {
            APIClient.shared.userId = userId.isEmpty ? nil : userId
            if !userId.isEmpty {
                UserDefaults.standard.set(userId, forKey: AppConfig.demoUserIdKey)
            }
        }
    }

    @Published var email: String?
    @Published var isDemoMode = true
    @Published var persona: String = "hobbyist"
    @Published var isFirebaseAvailable = false
    @Published var authError: String?

    private let users = UserService()
    private var authListenerHandle: Any?

    init() {
        let stored = UserDefaults.standard.string(forKey: AppConfig.demoUserIdKey) ?? ""
        userId = stored
        APIClient.shared.userId = stored.isEmpty ? nil : stored
    }

    func bootstrap() {
        isFirebaseAvailable = FirebaseBootstrap.configureIfPossible()
        #if canImport(FirebaseAuth)
        if isFirebaseAvailable {
            installAuthListener()
        } else {
            resolvePhaseWithoutFirebase()
        }
        #else
        resolvePhaseWithoutFirebase()
        #endif
    }

    func handleOpenURL(_ url: URL) -> Bool {
        #if canImport(GoogleSignIn)
        return GIDSignIn.sharedInstance.handle(url)
        #else
        return false
        #endif
    }

    func signInWithGoogle() async {
        authError = nil
        #if canImport(FirebaseAuth) && canImport(GoogleSignIn)
        guard isFirebaseAvailable, let clientID = FirebaseBootstrap.clientID else {
            authError = "Add GoogleService-Info.plist to the Iris target (see ios/README.md)."
            return
        }
        guard let presenter = Self.topViewController() else {
            authError = "Could not present Google sign-in."
            return
        }
        GIDSignIn.sharedInstance.configuration = GIDConfiguration(clientID: clientID)
        do {
            let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: presenter)
            guard let idToken = result.user.idToken?.tokenString else {
                authError = "Google sign-in did not return an ID token."
                return
            }
            let accessToken = result.user.accessToken.tokenString
            let credential = GoogleAuthProvider.credential(withIDToken: idToken, accessToken: accessToken)
            _ = try await Auth.auth().signIn(with: credential)
        } catch {
            authError = error.localizedDescription
        }
        #else
        authError = "Firebase SDK not linked."
        #endif
    }

    func continueInDemoMode() {
        isDemoMode = true
        userId = ""
        email = nil
        APIClient.shared.userId = nil
        UserDefaults.standard.removeObject(forKey: AppConfig.demoUserIdKey)
        if AppConfig.isOnboardingComplete(userId: userId) {
            phase = .ready
        } else {
            phase = .persona
        }
    }

    func completePersonaSelection(_ chosen: String) async {
        authError = nil
        let mode = chosen == "working_pro" ? "working_pro" : "hobbyist"
        persona = mode
        APIClient.shared.userId = userId.isEmpty ? nil : userId
        do {
            if !userId.isEmpty {
                _ = try await users.updatePersona(mode)
            }
            AppConfig.markOnboardingComplete(userId: userId)
            phase = .ready
        } catch {
            authError = error.localizedDescription
        }
    }

    func signOut() async {
        authError = nil
        #if canImport(FirebaseAuth)
        if isFirebaseAvailable {
            try? Auth.auth().signOut()
        }
        #endif
        #if canImport(GoogleSignIn)
        GIDSignIn.sharedInstance.signOut()
        #endif
        applyDemoScope()
        phase = .signIn
    }

    func applyDemoScope() {
        isDemoMode = true
        userId = ""
        email = nil
        APIClient.shared.userId = nil
        UserDefaults.standard.removeObject(forKey: AppConfig.demoUserIdKey)
    }

    func applyFirebaseUser(_ uid: String, email: String?) {
        isDemoMode = false
        userId = uid
        self.email = email
    }

    /// Change persona from Settings (clears mentor session like web).
    func updatePersonaSetting(_ mode: String) async {
        authError = nil
        let chosen = mode == "working_pro" ? "working_pro" : "hobbyist"
        guard chosen != persona else { return }
        persona = chosen
        APIClient.shared.userId = userId.isEmpty ? nil : userId
        if !userId.isEmpty {
            do {
                _ = try await users.updatePersona(chosen)
            } catch {
                authError = error.localizedDescription
            }
        }
        clearMentorSessionStorage()
    }

    func clearMentorSessionStorage() {
        let scope = userId.isEmpty ? "demo" : userId
        UserDefaults.standard.removeObject(forKey: "\(AppConfig.mentorSessionIdKey).\(scope)")
        UserDefaults.standard.removeObject(forKey: "\(AppConfig.mentorMessagesKey).\(scope)")
    }

    // MARK: - Private

    #if canImport(FirebaseAuth)
    private func installAuthListener() {
        authListenerHandle = Auth.auth().addStateDidChangeListener { [weak self] _, user in
            Task { @MainActor in
                self?.handleAuthUser(user)
            }
        }
    }

    private func handleAuthUser(_ user: FirebaseAuth.User?) {
        if let user {
            applyFirebaseUser(user.uid, email: user.email)
            Task { await syncProfileAndPhase() }
        } else {
            if AppConfig.isOnboardingComplete(userId: userId), isDemoMode || !userId.isEmpty {
                phase = .ready
            } else if !userId.isEmpty {
                Task { await syncProfileAndPhase() }
            } else {
                phase = .signIn
            }
        }
    }

    private func syncProfileAndPhase() async {
        do {
            let profile = try await users.fetchProfile()
            persona = profile.persona == "working_pro" ? "working_pro" : "hobbyist"
        } catch {
            persona = "hobbyist"
        }
        if AppConfig.isOnboardingComplete(userId: userId) {
            phase = .ready
        } else {
            phase = .persona
        }
    }
    #endif

    private func resolvePhaseWithoutFirebase() {
        if AppConfig.isOnboardingComplete(userId: userId), isDemoMode || !userId.isEmpty {
            phase = .ready
            return
        }
        if !userId.isEmpty, !AppConfig.isOnboardingComplete(userId: userId) {
            phase = .persona
            return
        }
        if isDemoMode, !AppConfig.isOnboardingComplete(userId: "") {
            phase = .persona
            return
        }
        phase = .signIn
    }

    private static func topViewController() -> UIViewController? {
        guard let scene = UIApplication.shared.connectedScenes.first(where: {
            $0.activationState == .foregroundActive
        }) as? UIWindowScene,
            let root = scene.windows.first(where: \.isKeyWindow)?.rootViewController
        else {
            return nil
        }
        var top = root
        while let presented = top.presentedViewController {
            top = presented
        }
        return top
    }
}
