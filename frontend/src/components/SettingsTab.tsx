import React from 'react';
import { LogIn, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { firebaseAuthEnabled } from '../auth/firebaseConfig';
import { ModeToggle } from './ModeToggle';
import { clearOnboardingComplete } from '../lib/onboarding';
import { isLocalDevHost } from '../lib/apiHelp';
import type { UserMode } from '../types/practice';

interface Props {
  mode: UserMode;
  onModeChange: (mode: UserMode) => void;
  onPersistPersona: (mode: UserMode) => Promise<void>;
  onPersistError: (message: string) => void;
  onRestartOnboarding: () => void;
  onRestartTour?: () => void;
}

export const SettingsTab: React.FC<Props> = ({
  mode,
  onModeChange,
  onPersistPersona,
  onPersistError,
  onRestartOnboarding,
  onRestartTour,
}) => {
  const isLocal = isLocalDevHost();
  const auth = useAuth();

  return (
    <div className="animate-fadeIn max-w-lg space-y-8">
      <div>
        <div className="flex items-center gap-2 text-brand-400 mb-2">
          <Settings className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wide">Settings</span>
        </div>
        <h1 className="font-serif text-2xl md:text-3xl text-white">Your profile</h1>
        <p className="text-muted text-sm mt-2">
          Switch between hobbyist and working pro. I&apos;ll adjust listings, suggestions, and how
          I coach you.
        </p>
      </div>

      <section className="rounded-xl border border-warm bg-surface-1 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-white">Account</h2>
        {firebaseAuthEnabled ? (
          auth.userId ? (
            <>
              <p className="text-sm text-muted">
                Signed in as <span className="text-stone-200">{auth.email ?? auth.userId}</span>.
                Your library is scoped to this account.
              </p>
              <button
                type="button"
                onClick={() => void auth.signOut()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-warm text-sm text-stone-200 hover:bg-surface-2"
              >
                <LogOut className="w-4 h-4" aria-hidden />
                Sign out
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted leading-relaxed">
                Sign in with Google to keep your portfolio and critiques on your own MongoDB user
                (multi-tenant demo). Without sign-in, the hosted API uses the shared judge demo
                profile.
              </p>
              <button
                type="button"
                onClick={() => void auth.signInWithGoogle()}
                disabled={auth.loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" aria-hidden />
                Sign in with Google
              </button>
            </>
          )
        ) : (
          <p className="text-sm text-muted leading-relaxed">
            Firebase web keys are not configured for this build — the API uses the shared demo user.
            Add <code className="text-brand-400 text-xs">VITE_FIREBASE_*</code> for sign-in.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-warm bg-surface-1 p-4">
        <ModeToggle
          mode={mode}
          onModeChange={onModeChange}
          onPersistPersona={onPersistPersona}
          onPersistError={onPersistError}
        />
      </section>

      <section className="rounded-xl border border-warm bg-surface-1 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-white">What I remember</h2>
        <p className="text-sm text-muted leading-relaxed">
          Your uploads, scores, Glass Box reasoning, tags, practice assignments, and approval
          history live in your private MongoDB library — tied to this demo profile in your browser.
          I do not publish listings or change labels until you approve each suggestion.
        </p>
      </section>

      <section className="rounded-xl border border-warm bg-surface-1 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-white">Privacy</h2>
        <p className="text-sm text-muted leading-relaxed">
          Your photos and critiques stay in your private library. Listing and label changes only
          happen when you approve them.
        </p>
      </section>

      {isLocal && (
        <section className="rounded-xl border border-warm/80 bg-canvas-elevated p-4 space-y-2">
          <h2 className="text-sm font-semibold text-muted">Developer (local only)</h2>
          <p className="text-xs text-muted">
            API: run <code className="text-brand-400">make api-dev</code> on port 8081 before using
            Mentor or approvals.
          </p>
        </section>
      )}

      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={() => {
            clearOnboardingComplete();
            onRestartOnboarding();
          }}
          className="text-sm text-muted hover:text-brand-400 underline"
        >
          Show welcome screen again
        </button>
        {onRestartTour && (
          <button
            type="button"
            onClick={onRestartTour}
            className="text-sm text-muted hover:text-brand-400 underline"
          >
            Take a feature tour
          </button>
        )}
      </div>
    </div>
  );
};
