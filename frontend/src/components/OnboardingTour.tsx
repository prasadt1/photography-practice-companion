/**
 * OnboardingTour — Lightweight feature walkthrough for new users.
 * Shows key features with animated spotlight and brief explanations.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  Camera,
  Home,
  Images,
  Layers,
  MessageCircle,
  Sparkles,
  Target,
  X,
} from 'lucide-react';

interface TourStep {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  accent: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'home',
    icon: Home,
    title: 'Home',
    description:
      'Your dashboard. See your best recent work, track progress, and jump into your next assignment.',
    accent: 'bg-brand-500',
  },
  {
    id: 'work',
    icon: Images,
    title: 'My Work',
    description:
      'Upload photos for AI critique. Each photo gets detailed feedback on composition, lighting, technique, and more.',
    accent: 'bg-amber-500',
  },
  {
    id: 'practice',
    icon: Target,
    title: 'Practice',
    description:
      'Focused assignments to build specific skills. Pick a challenge, shoot, and get feedback tailored to that goal.',
    accent: 'bg-emerald-500',
  },
  {
    id: 'mentor-chat',
    icon: MessageCircle,
    title: 'Mentor Chat',
    description:
      'Ask questions about your progress. I search your past critiques and portfolio to give personalized advice.',
    accent: 'bg-sky-500',
  },
  {
    id: 'mentor-organize',
    icon: Layers,
    title: 'Organize',
    description:
      'Keep your library tidy. I find similar photos and suggest tags so you can search by theme later.',
    accent: 'bg-fuchsia-500',
  },
];

const STORAGE_KEY = 'iris-tour-completed';

interface Props {
  /** Force show even if previously completed */
  forceShow?: boolean;
  /** Callback when tour completes or is dismissed */
  onComplete?: () => void;
}

export const OnboardingTour: React.FC<Props> = ({ forceShow, onComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (forceShow) {
      setIsOpen(true);
      setCurrentStep(0);
      return;
    }
    // Check if tour was already completed
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Small delay so the app renders first
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  const handleNext = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      // Complete
      localStorage.setItem(STORAGE_KEY, 'true');
      setIsOpen(false);
      onComplete?.();
    }
  }, [currentStep, onComplete]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
    onComplete?.();
  }, [onComplete]);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 animate-overlayFadeIn">
      <div className="relative max-w-md w-full animate-springIn">
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-4">
          {TOUR_STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`h-1.5 rounded-full transition-all duration-150 ${
                i === currentStep
                  ? 'w-6 bg-brand-400'
                  : i < currentStep
                    ? 'w-1.5 bg-brand-400/60'
                    : 'w-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-warm bg-canvas overflow-hidden shadow-2xl">
          {/* Header with icon */}
          <div className={`${step.accent} p-6 flex justify-center`}>
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
              <StepIcon className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 text-center space-y-3">
            <h2 className="text-xl font-bold text-white">{step.title}</h2>
            <p className="text-sm text-stone-300 leading-relaxed">{step.description}</p>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-warm flex items-center justify-between">
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm text-muted hover:text-white transition-colors"
            >
              Skip tour
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-500 text-on-brand text-sm font-semibold hover:bg-brand-400 transition-colors"
            >
              {isLast ? (
                <>
                  Get started
                  <Sparkles className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={handleSkip}
          className="absolute -top-2 -right-2 p-2 rounded-full bg-surface-2 border border-warm text-muted hover:text-white transition-colors"
          aria-label="Close tour"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/** Button to restart the tour from Settings or Help */
export const TourRestartButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors"
  >
    <Camera className="w-4 h-4" />
    Take a tour
  </button>
);

/** Check if tour was completed */
export function isTourCompleted(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

/** Reset tour (for testing or restart) */
export function resetTour(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
