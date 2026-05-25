import React, { useState } from 'react';
import type { UserMode } from '../types/practice';

interface Props {
  mode: UserMode;
  onModeChange: (mode: UserMode) => void;
  /** Persist persona to MongoDB (orchestrator toolset). */
  onPersistPersona?: (mode: UserMode) => Promise<void>;
  onPersistError?: (message: string) => void;
}

export const ModeToggle: React.FC<Props> = ({
  mode,
  onModeChange,
  onPersistPersona,
  onPersistError,
}) => {
  const [saving, setSaving] = useState(false);

  const handleChange = async (next: UserMode) => {
    onModeChange(next);
    if (!onPersistPersona) return;
    setSaving(true);
    try {
      await onPersistPersona(next);
    } catch (e) {
      onPersistError?.(
        e instanceof Error ? e.message : 'Could not save persona to server',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="py-3 flex flex-wrap items-center gap-4">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        Persona (orchestrator)
      </span>
      <div className="flex p-1 bg-slate-800 rounded-lg border border-slate-700">
        {(
          [
            { id: 'hobbyist' as const, label: 'Hobbyist' },
            { id: 'working_pro' as const, label: 'Working pro' },
          ] as const
        ).map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => void handleChange(m.id)}
            disabled={saving}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === m.id
                ? 'bg-brand-500 text-slate-900'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500">
        {saving ? 'Saving…' : 'Saved to MongoDB — orchestrator & Mentor chat use this persona.'}
      </p>
    </div>
  );
};
