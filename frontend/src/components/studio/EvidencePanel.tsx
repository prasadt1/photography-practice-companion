/**
 * Ported from photography-coach-gemma4/components/EvidencePanel.tsx
 */

import React from 'react';
import { Database, Camera, Cpu } from 'lucide-react';
import type { EvidenceItem } from '../../types/studio';

const SOURCE_CONFIG: Record<
  EvidenceItem['source'],
  { label: string; icon: React.ReactNode; color: string }
> = {
  EXIF: {
    label: 'EXIF',
    icon: <Camera className="w-3.5 h-3.5" />,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  CV: {
    label: 'CV',
    icon: <Cpu className="w-3.5 h-3.5" />,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  Coach: {
    label: 'Coach + Data Store',
    icon: <Database className="w-3.5 h-3.5" />,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
};

const EvidencePanel: React.FC<{ evidence: EvidenceItem[]; className?: string }> = ({
  evidence,
  className = '',
}) => {
  if (evidence.length === 0) return null;

  return (
    <div
      className={`rounded-xl bg-slate-800/40 border border-slate-700 overflow-hidden ${className}`}
    >
      <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2">
        <Database className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-semibold text-slate-200">Evidence sources</span>
        <span className="ml-auto text-xs text-slate-500 font-mono">{evidence.length} signals</span>
      </div>
      <div className="divide-y divide-slate-700/50">
        {evidence.map((item, idx) => {
          const cfg = SOURCE_CONFIG[item.source];
          return (
            <div key={idx} className="px-4 py-3 flex items-center gap-3">
              <div
                className={`flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-1 rounded border ${cfg.color}`}
              >
                {cfg.icon}
                {cfg.label}
              </div>
              <div className="flex-1 min-w-0 text-xs text-slate-300">
                <span className="text-slate-500">{item.field}: </span>
                {item.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EvidencePanel;
