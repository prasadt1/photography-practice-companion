import React from 'react';
import { Settings } from 'lucide-react';
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
}

export const SettingsTab: React.FC<Props> = ({
  mode,
  onModeChange,
  onPersistPersona,
  onPersistError,
  onRestartOnboarding,
}) => {
  const isLocal = isLocalDevHost();

  return (
    <div className="animate-fadeIn max-w-lg space-y-8">
      <div>
        <div className="flex items-center gap-2 text-brand-400 mb-2">
          <Settings className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wide">Settings</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white">Your profile</h1>
        <p className="text-muted text-sm mt-2">
          Switch between hobbyist and working pro. I&apos;ll adjust listings, suggestions, and how
          I coach you.
        </p>
      </div>

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
    </div>
  );
};
