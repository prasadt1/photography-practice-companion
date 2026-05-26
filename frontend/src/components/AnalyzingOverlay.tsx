/**
 * AnalyzingOverlay — Full-screen overlay showing Glass Box thinking steps.
 * Used during photo analysis to show AI reasoning in progress.
 */

import React, { useEffect, useState } from 'react';
import {
  Aperture,
  BookOpen,
  Eye,
  Loader2,
  Target,
  Zap,
} from 'lucide-react';

const THINKING_STEPS = [
  { text: 'Grounding in photography principles…', icon: BookOpen },
  { text: 'Analyzing composition and framing…', icon: Target },
  { text: 'Evaluating lighting and exposure…', icon: Zap },
  { text: 'Assessing technique and sharpness…', icon: Eye },
  { text: 'Building Glass Box critique…', icon: Aperture },
];

interface Props {
  /** URL of the photo being analyzed (for preview) */
  imageUrl?: string;
}

export const AnalyzingOverlay: React.FC<Props> = ({ imageUrl }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) =>
        prev < THINKING_STEPS.length - 1 ? prev + 1 : prev
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-canvas/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-lg w-full animate-fadeIn">
        {/* Photo preview (if available) */}
        {imageUrl && (
          <div className="mb-6 rounded-2xl overflow-hidden border border-warm bg-photo-black p-2 shadow-2xl">
            <img
              src={imageUrl}
              alt="Photo being analyzed"
              className="w-full max-h-48 object-contain rounded-xl"
            />
          </div>
        )}

        {/* Spinner and title */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-brand-500/20 blur-xl rounded-full animate-pulse" />
            <Loader2 className="w-12 h-12 text-brand-400 animate-spin relative z-10" />
          </div>
          <h2 className="text-xl font-bold text-white">Iris is analyzing…</h2>
          <p className="text-sm text-muted mt-1">Building your Glass Box critique</p>
        </div>

        {/* Thinking steps */}
        <div className="rounded-xl bg-surface-1 border border-warm p-4 shadow-lg">
          <div className="space-y-3">
            {THINKING_STEPS.map((step, index) => {
              const isActive = index === currentStep;
              const isPast = index < currentStep;
              const isFuture = index > currentStep + 1;

              if (isFuture) return null;

              const StepIcon = step.icon;

              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 transition-all duration-300 ${
                    isPast ? 'opacity-40' : ''
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-md transition-colors ${
                      isActive
                        ? 'bg-brand-500/20 text-brand-400'
                        : isPast
                          ? 'bg-surface-3 text-stone-500'
                          : 'bg-surface-3 text-muted'
                    }`}
                  >
                    <StepIcon
                      className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`}
                    />
                  </div>
                  <span
                    className={`text-sm ${
                      isActive
                        ? 'text-white font-semibold'
                        : isPast
                          ? 'text-stone-500'
                          : 'text-muted'
                    }`}
                  >
                    {step.text}
                  </span>
                  {isPast && (
                    <span className="ml-auto text-xs text-brand-400">✓</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-center text-xs text-muted mt-4">
          This usually takes 5-10 seconds
        </p>
      </div>
    </div>
  );
};
