/**
 * Glass Box — transparent reasoning UI (from gemini3 AnalysisResults thinking block;
 * grounding chips integrated once, not duplicated in Evidence).
 */

import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, Eye, Target, Database } from 'lucide-react';
import type { StudioAnalysis, EvidenceItem } from '../../types/studio';
import EvidencePanel from './EvidencePanel';

interface Props {
  rationale: StudioAnalysis['rationale'];
  groundingPrinciples: string[];
  groundingCitations: StudioAnalysis['groundingCitations'];
  evidence: EvidenceItem[];
  className?: string;
}

const GlassBoxPanel: React.FC<Props> = ({
  rationale,
  groundingPrinciples,
  groundingCitations,
  evidence,
  className = '',
}) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={`space-y-4 animate-fadeIn ${className}`}>
      <div className="rounded-2xl p-[1px] bg-gradient-to-r from-emerald-500 to-purple-600 shadow-xl shadow-brand-500/10">
        <div className="bg-slate-950/60 rounded-2xl overflow-hidden backdrop-blur-md border border-slate-800/80">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-slate-900/50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-purple-600 rounded-lg text-white shadow-lg">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm md:text-base">Glass Box · Gemini 3.1 Pro</h3>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <p className="text-xs text-slate-400 font-mono">Structured reasoning you can audit</p>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 rounded font-mono">
                    thinking_level: high
                  </span>
                </div>
              </div>
            </div>
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
            )}
          </button>

          {expanded && (
            <div className="p-5 md:p-6 border-t border-slate-800 bg-slate-950/80 font-mono text-sm space-y-6">
              <div>
                <h4 className="flex items-center gap-2 text-emerald-400 font-bold mb-3 uppercase text-xs tracking-wider">
                  <Eye className="w-4 h-4" /> Key observations
                </h4>
                <ul className="space-y-2 pl-2 border-l border-emerald-500/20">
                  {rationale.observations.map((obs, i) => (
                    <li
                      key={i}
                      className="text-slate-300 pl-4 relative before:content-['>'] before:absolute before:left-0 before:text-emerald-500/50"
                    >
                      {obs}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="flex items-center gap-2 text-purple-400 font-bold mb-3 uppercase text-xs tracking-wider">
                  <Brain className="w-4 h-4" /> Reasoning steps
                </h4>
                <ol className="space-y-3">
                  {rationale.reasoningSteps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-slate-300">
                      <span className="text-purple-500/70 font-bold">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {rationale.priorityFixes.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 text-amber-400 font-bold mb-3 uppercase text-xs tracking-wider">
                    <Target className="w-4 h-4" /> Priority fixes
                  </h4>
                  <div className="space-y-2">
                    {rationale.priorityFixes.map((fix, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-2 rounded bg-slate-900 border border-slate-800"
                      >
                        <div className="w-4 h-4 rounded border border-amber-500/50 flex items-center justify-center shrink-0">
                          <div className="w-2 h-2 bg-amber-500 rounded-sm" />
                        </div>
                        <span className="text-slate-300">{fix}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(groundingCitations.length > 0 || groundingPrinciples.length > 0) && (
                <div className="pt-2 border-t border-slate-800">
                  <h4 className="flex items-center gap-2 text-brand-400 font-bold mb-3 uppercase text-xs tracking-wider">
                    <Database className="w-4 h-4" /> Grounded in Agent Builder
                  </h4>
                  <div className="space-y-2">
                    {(groundingCitations.length > 0
                      ? groundingCitations
                      : groundingPrinciples.map((id) => ({ id, title: id, excerpt: '' }))
                    ).map((c) => (
                      <div
                        key={c.id}
                        className="text-xs rounded-lg bg-brand-500/5 border border-brand-500/20 px-3 py-2"
                      >
                        <span className="font-semibold text-brand-400">{c.title}</span>
                        {c.excerpt && (
                          <p className="text-slate-400 mt-1 leading-relaxed">{c.excerpt}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {evidence.length > 0 && <EvidencePanel evidence={evidence} />}
    </div>
  );
};

export default GlassBoxPanel;
