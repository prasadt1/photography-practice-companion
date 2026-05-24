import React from 'react';
import { Camera, Clock, X } from 'lucide-react';
import type { Assignment } from '../types/practice';

interface Props {
  assignment: Assignment;
  onShootNow: () => void;
  onLater: () => void;
  onStudioUpload: () => void;
}

export const ShootNowDialog: React.FC<Props> = ({
  assignment,
  onShootNow,
  onLater,
  onStudioUpload,
}) => (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    aria-labelledby="shoot-now-title"
  >
    <div className="w-full max-w-md rounded-2xl bg-slate-800 border border-slate-600 shadow-2xl p-6 animate-fadeIn">
      <div className="flex items-start justify-between gap-3 mb-4">
        <h2 id="shoot-now-title" className="text-lg font-bold text-white">
          Ready to practice?
        </h2>
        <button
          type="button"
          onClick={onLater}
          className="text-slate-500 hover:text-white p-1"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <p className="text-xs font-mono text-brand-400 mb-2">{assignment.targetSkill}</p>
      <p className="text-sm text-slate-300 leading-relaxed mb-6">{assignment.brief}</p>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onShootNow}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-500 text-slate-900 font-semibold text-sm"
        >
          <Camera className="w-4 h-4" />
          Shoot now (Field)
        </button>
        <button
          type="button"
          onClick={onStudioUpload}
          className="w-full px-4 py-3 rounded-xl border border-slate-600 text-slate-200 text-sm font-medium hover:bg-slate-700"
        >
          Upload later in Studio
        </button>
        <button
          type="button"
          onClick={onLater}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-slate-500 text-sm hover:text-slate-300"
        >
          <Clock className="w-4 h-4" />
          Not now — stay on Practice
        </button>
      </div>
    </div>
  </div>
);
