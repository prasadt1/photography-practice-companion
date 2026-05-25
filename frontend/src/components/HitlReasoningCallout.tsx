import React from 'react';

interface Props {
  reasoning: string;
}

/** HITL: agent reasoning visible before approve/reject (Pass 6). */
export const HitlReasoningCallout: React.FC<Props> = ({ reasoning }) => (
  <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
    <p className="text-[10px] font-bold uppercase text-amber-400/90 tracking-wide mb-1.5">
      Why I&apos;m suggesting this
    </p>
    <p className="text-sm text-stone-200 leading-relaxed">{reasoning}</p>
  </div>
);
