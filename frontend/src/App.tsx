import { useCallback, useEffect, useState } from 'react';
import { Settings, Store } from 'lucide-react';
import { AppSidebar } from './components/AppSidebar';
import { BottomNav } from './components/BottomNav';
import { BrandLogo } from './components/BrandLogo';
import { HomeTab } from './components/HomeTab';
import { MyWorkTab } from './components/MyWorkTab';
import { MentorTab } from './components/MentorTab';
import { OnboardingScreen } from './components/OnboardingScreen';
import { PracticeTab } from './components/PracticeTab';
import { PrintSalesTab } from './components/PrintSalesTab';
import { SettingsTab } from './components/SettingsTab';
import { FieldTab } from './components/FieldTab';
import { ScoreExplainer, ScoreExplainerTrigger } from './components/ScoreExplainer';
import { OnboardingTour, resetTour } from './components/OnboardingTour';
import type { AppTab } from './config/navConfig';
import { isAppTab, setTabHash, tabFromHash } from './config/navConfig';
import { useAuth } from './auth/useAuth';
import { setApiUserScope } from './lib/apiFetch';
import { clearMentorSession } from './services/mentorClient';
import { fetchActiveAssignment } from './services/practiceClient';
import { fetchUserProfile, personaToUserMode, updatePersona } from './services/userClient';
import { OfflineBanner } from './components/OfflineBanner';
import { FilmGrain } from './components/FilmGrain';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import {
  isOnboardingComplete,
  serverOnboardingComplete,
  setOnboardingComplete,
  clearOnboardingComplete,
} from './lib/onboarding';
import type { AnalysisResult } from './types';
import type { Assignment, UserMode } from './types/practice';

/** Pending analysis result to show in My Work after upload from Home */
interface PendingAnalysis {
  result: AnalysisResult;
  imageUrl: string;
  filename: string;
}

function App() {
  const [ready, setReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(!isOnboardingComplete());
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [userMode, setUserMode] = useState<UserMode>('hobbyist');
  const [personaError, setPersonaError] = useState<string | null>(null);
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  // Sub-views within Practice tab
  const [practiceView, setPracticeView] = useState<'list' | 'field'>('list');
  // Focus skill to auto-trigger in Practice (from Focus Areas CTA)
  const [practiceFocusSkill, setPracticeFocusSkill] = useState<string | null>(null);
  // Pending analysis result from Home upload (to show in My Work)
  const [pendingAnalysis, setPendingAnalysis] = useState<PendingAnalysis | null>(null);
  // Global score explainer modal
  const [showScoreExplainer, setShowScoreExplainer] = useState(false);
  // Onboarding tour
  const [showTour, setShowTour] = useState(false);
  const [onboardingBusy, setOnboardingBusy] = useState(false);
  const online = useOnlineStatus();
  const auth = useAuth();

  const navigate = useCallback((tab: AppTab) => {
    setActiveTab(tab);
    setTabHash(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const refreshActiveAssignment = useCallback(async () => {
    try {
      setActiveAssignment(await fetchActiveAssignment());
    } catch {
      setActiveAssignment(null);
    }
  }, []);

  useEffect(() => {
    const hashTab = tabFromHash();
    if (hashTab && isAppTab(hashTab)) {
      setActiveTab(hashTab);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (auth.loading) return;
    setApiUserScope(auth.userId);
    void fetchUserProfile(auth.userId ?? undefined)
      .then((p) => setUserMode(personaToUserMode(p.persona)))
      .catch(() => {});
  }, [auth.loading, auth.userId]);

  useEffect(() => {
    if (!ready || auth.loading || isOnboardingComplete() || onboardingBusy) return;
    void fetchUserProfile(auth.userId ?? undefined)
      .then((profile) => {
        if (serverOnboardingComplete(profile.preferences)) {
          setOnboardingComplete();
          setShowOnboarding(false);
          setUserMode(personaToUserMode(profile.persona));
        }
      })
      .catch(() => {});
  }, [ready, auth.loading, auth.userId, onboardingBusy]);

  useEffect(() => {
    if (!ready) return;
    void refreshActiveAssignment();
    // Reset sub-views when leaving tabs
    if (activeTab !== 'practice') {
      setPracticeView('list');
    }
  }, [activeTab, ready, refreshActiveAssignment]);

  const handleOnboardingComplete = useCallback((mode: UserMode) => {
    setOnboardingComplete();
    setShowOnboarding(false);
    setUserMode(mode);
    setActiveTab('home');
    setTabHash('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const persistPersona = useCallback(async (mode: UserMode) => {
    setOnboardingBusy(true);
    setPersonaError(null);
    try {
      await updatePersona(mode, auth.userId);
      clearMentorSession();
    } finally {
      setOnboardingBusy(false);
    }
  }, [auth.userId]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center text-muted text-sm">
        One moment…
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <OnboardingScreen
        onComplete={handleOnboardingComplete}
        onPersist={persistPersona}
      />
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-stone-200 font-sans selection:bg-brand-500/30 flex relative">
      <FilmGrain className="fixed inset-0 z-[1]" />
      <a href="#main-content" className="sr-only">
        Skip to main content
      </a>
      <AppSidebar activeTab={activeTab} mode={userMode} onNavigate={navigate} />

      <div className="flex-1 flex flex-col min-h-screen min-w-0 pb-20 lg:pb-0">
        <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between gap-3 px-3 py-2.5 border-b border-warm bg-canvas/95 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => navigate('home')}
            className="min-w-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-400 focus-visible:outline-offset-2 rounded-md"
            aria-label="Go to Home"
          >
            <BrandLogo size="sm" showWordmark={false} />
          </button>
          <div className="flex items-center gap-1 shrink-0">
            {userMode === 'working_pro' && (
              <button
                type="button"
                onClick={() => navigate('print')}
                aria-label="Print Sales"
                aria-current={activeTab === 'print' ? 'page' : undefined}
                className={`p-2.5 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-400 focus-visible:outline-offset-2 ${
                  activeTab === 'print'
                    ? 'text-brand-400 bg-brand-500/10'
                    : 'text-muted hover:text-white hover:bg-surface-2'
                }`}
              >
                <Store className="w-5 h-5" aria-hidden />
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('settings')}
              aria-label="Settings"
              aria-current={activeTab === 'settings' ? 'page' : undefined}
              className={`p-2.5 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-400 focus-visible:outline-offset-2 ${
                activeTab === 'settings'
                  ? 'text-brand-400 bg-brand-500/10'
                  : 'text-muted hover:text-white hover:bg-surface-2'
              }`}
            >
              <Settings className="w-5 h-5" aria-hidden />
            </button>
          </div>
        </header>

        <main
          id="main-content"
          key={activeTab}
          className="flex-1 max-w-7xl w-full mx-auto px-3 py-4 md:py-6 animate-tabEnter"
        >
          {!online && <OfflineBanner />}
          {personaError && activeTab === 'settings' && (
            <p className="mb-4 text-sm text-amber-400" role="alert">
              Could not save your profile mode ({personaError}).
            </p>
          )}

          {activeTab === 'home' && (
            <HomeTab
              mode={userMode}
              activeAssignment={activeAssignment}
              onNavigate={navigate}
              onOpenSettings={() => navigate('settings')}
              onAnalysisComplete={(result, imageUrl, filename) => {
                setPendingAnalysis({ result, imageUrl, filename });
                void refreshActiveAssignment();
                navigate('work');
              }}
            />
          )}

          {activeTab === 'work' && (
            <MyWorkTab
              activeAssignment={activeAssignment}
              onAssignmentComplete={refreshActiveAssignment}
              onGoHome={() => navigate('home')}
              onGoToPractice={(focusDimension) => {
                if (focusDimension) {
                  setPracticeFocusSkill(focusDimension);
                }
                navigate('practice');
              }}
              pendingAnalysis={pendingAnalysis}
              onClearPendingAnalysis={() => setPendingAnalysis(null)}
            />
          )}

          {activeTab === 'practice' && (
            practiceView === 'field' ? (
              <FieldTab
                assignment={activeAssignment}
                onCaptureAnalyzed={refreshActiveAssignment}
                onGoToPractice={() => setPracticeView('list')}
              />
            ) : (
              <PracticeTab
                mode={userMode}
                focusSkill={practiceFocusSkill}
                onClearFocusSkill={() => setPracticeFocusSkill(null)}
                onGoToStudio={() => navigate('work')}
                onGoToField={() => setPracticeView('field')}
                onAssignmentsChange={refreshActiveAssignment}
              />
            )
          )}

          {activeTab === 'mentor' && (
            <MentorTab mode={userMode} onGoToWork={() => navigate('work')} />
          )}

          {activeTab === 'print' && (
            <PrintSalesTab
              mode={userMode}
              onGoToMentor={() => navigate('mentor')}
              onOpenSettings={() => navigate('settings')}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              mode={userMode}
              onModeChange={setUserMode}
              onPersistPersona={persistPersona}
              onPersistError={setPersonaError}
              onRestartOnboarding={() => {
                clearOnboardingComplete();
                setShowOnboarding(true);
              }}
              onRestartTour={() => {
                resetTour();
                setShowTour(true);
              }}
            />
          )}
        </main>

        <footer className="hidden lg:block border-t border-warm py-6 text-center text-xs text-muted px-4 mb-0 bg-canvas">
          <div className="flex items-center justify-center gap-4">
            <p>Iris — your photos stay in your private library.</p>
            <span className="text-warm">•</span>
            <ScoreExplainerTrigger onClick={() => setShowScoreExplainer(true)} />
          </div>
        </footer>
      </div>

      <BottomNav activeTab={activeTab} mode={userMode} onNavigate={navigate} />

      {/* Global Score Explainer Modal */}
      <ScoreExplainer isOpen={showScoreExplainer} onClose={() => setShowScoreExplainer(false)} />

      {/* Onboarding Tour (shows on first visit or when restarted) */}
      <OnboardingTour
        forceShow={showTour}
        onComplete={() => setShowTour(false)}
      />
    </div>
  );
}

export default App;
