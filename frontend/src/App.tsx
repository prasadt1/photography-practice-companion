import { useCallback, useEffect, useState } from 'react';
import { FilmGrain } from './components/FilmGrain';
import { AppSidebar } from './components/AppSidebar';
import { AssignmentStrip } from './components/AssignmentStrip';
import { BottomNav } from './components/BottomNav';
import { FieldTab } from './components/FieldTab';
import { HomeTab } from './components/HomeTab';
import { MemoryTab } from './components/MemoryTab';
import { MentorTab } from './components/MentorTab';
import { OnboardingScreen } from './components/OnboardingScreen';
import { PracticeTab } from './components/PracticeTab';
import { PrintSalesTab } from './components/PrintSalesTab';
import { SettingsTab } from './components/SettingsTab';
import { TriageTab } from './components/TriageTab';
import { ActivePracticeBanner } from './components/studio/ActivePracticeBanner';
import PhotoUploader from './components/studio/PhotoUploader';
import StudioAnalysisResults from './components/studio/StudioAnalysisResults';
import type { AppTab } from './config/navConfig';
import { isAppTab, setTabHash, tabFromHash } from './config/navConfig';
import { useAuth } from './auth/useAuth';
import { setApiUserScope } from './lib/apiFetch';
import { clearMentorSession } from './services/mentorClient';
import { analyzePhoto } from './services/agentClient';
import { fetchActiveAssignment } from './services/practiceClient';
import { fetchUserProfile, personaToUserMode, updatePersona } from './services/userClient';
import { Upload, BarChart3, Target } from 'lucide-react';
import { OfflineBanner } from './components/OfflineBanner';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { isOnboardingComplete, setOnboardingComplete } from './lib/onboarding';
import { mapAnalysisResult } from './lib/mapAnalysisResult';
import type { AnalysisResult } from './types';
import type { Assignment, UserMode } from './types/practice';

function App() {
  const [ready, setReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(!isOnboardingComplete());
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState('photo.jpg');
  const [userMode, setUserMode] = useState<UserMode>('hobbyist');
  const [personaError, setPersonaError] = useState<string | null>(null);
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
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
    if (!ready) return;
    void refreshActiveAssignment();
  }, [activeTab, ready, refreshActiveAssignment]);


  const handleImageSelected = async (file: File, previewUrl: string) => {
    setAnalyzing(true);
    setResult(null);
    setImageUrl(previewUrl);
    setFilename(file.name);

    try {
      setResult(
        await analyzePhoto({
          imageFile: file,
          assignmentId: activeAssignment?.id,
        }),
      );
      void refreshActiveAssignment();
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. See console for details.');
      URL.revokeObjectURL(previewUrl);
      setImageUrl(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const resetStudio = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setResult(null);
    setImageUrl(null);
    setFilename('photo.jpg');
  };

  const handleOnboardingComplete = (mode: UserMode) => {
    setOnboardingComplete();
    setShowOnboarding(false);
    setUserMode(mode);
    navigate('home');
  };

  const persistPersona = async (mode: UserMode) => {
    setPersonaError(null);
    await updatePersona(mode);
    clearMentorSession();
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center text-muted text-sm">
        Loading…
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

  const showAssignmentStrip =
    activeAssignment &&
    activeTab !== 'field' &&
    activeTab !== 'practice';

  return (
    <div className="min-h-screen bg-canvas text-stone-200 font-sans selection:bg-brand-500/30 flex">
      <a href="#main-content" className="sr-only">
        Skip to main content
      </a>
      <AppSidebar activeTab={activeTab} mode={userMode} onNavigate={navigate} />

      <div className="flex-1 flex flex-col min-h-screen min-w-0 pb-20 lg:pb-0">
        {showAssignmentStrip && activeAssignment && (
          <AssignmentStrip
            assignment={activeAssignment}
            onShootNow={() => navigate('field')}
            onPractice={() => navigate('practice')}
          />
        )}

        <main
          id="main-content"
          className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:py-10"
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
            />
          )}

          {activeTab === 'studio' && (
            <div className="animate-fadeIn relative">
              <FilmGrain className="rounded-2xl" />
              {!result && (
                <div className="relative z-10 flex flex-col items-center space-y-10 py-4 md:py-8">
                  {activeAssignment && (
                    <ActivePracticeBanner assignment={activeAssignment} />
                  )}
                  <div className="text-center max-w-2xl space-y-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-400/90">
                      Glass Box critique
                    </p>
                    <h2 className="font-serif text-4xl md:text-5xl font-medium text-white leading-[1.15] tracking-tight">
                      I&apos;ll remember every photo — and show you why it scored what it did
                    </h2>
                    <p className="text-muted text-sm md:text-base leading-relaxed max-w-lg mx-auto">
                      Upload once for five-axis scores, transparent reasoning, and practice tied to
                      your library — not a one-off chat.
                    </p>
                    <ol className="grid sm:grid-cols-3 gap-3 text-left max-w-2xl mx-auto pt-2">
                      <li className="rounded-xl border border-warm bg-surface-1/80 p-4 space-y-2">
                        <Upload className="w-5 h-5 text-brand-400" aria-hidden />
                        <p className="text-sm font-semibold text-white">1. Upload</p>
                        <p className="text-xs text-muted">JPG or RAW from any shoot</p>
                      </li>
                      <li className="rounded-xl border border-warm bg-surface-1/80 p-4 space-y-2">
                        <BarChart3 className="w-5 h-5 text-brand-400" aria-hidden />
                        <p className="text-sm font-semibold text-white">2. Glass Box</p>
                        <p className="text-xs text-muted">
                          Example: lighting 6.2 → 7.8 after you fix backlit faces
                        </p>
                      </li>
                      <li className="rounded-xl border border-warm bg-surface-1/80 p-4 space-y-2">
                        <Target className="w-5 h-5 text-brand-400" aria-hidden />
                        <p className="text-sm font-semibold text-white">3. Practice</p>
                        <p className="text-xs text-muted">Assignments from your real weak spots</p>
                      </li>
                    </ol>
                  </div>
                  <PhotoUploader onImageSelected={handleImageSelected} isAnalyzing={analyzing} />
                </div>
              )}
              {result && imageUrl && (
                <StudioAnalysisResults
                  analysis={mapAnalysisResult(result)}
                  imageSrc={imageUrl}
                  originalFilename={filename}
                  onReset={() => {
                    resetStudio();
                    navigate('home');
                  }}
                />
              )}
            </div>
          )}

          {activeTab === 'practice' && (
            <PracticeTab
              mode={userMode}
              onGoToStudio={() => navigate('studio')}
              onGoToField={() => navigate('field')}
              onAssignmentsChange={refreshActiveAssignment}
            />
          )}
          {activeTab === 'memory' && (
            <MemoryTab onGoToStudio={() => navigate('studio')} />
          )}
          {activeTab === 'mentor' && <MentorTab mode={userMode} />}
          {activeTab === 'triage' && (
            <TriageTab
              mode={userMode}
              onGoToMemory={() => navigate('memory')}
              onGoToStudio={() => navigate('studio')}
            />
          )}
          {activeTab === 'print' && (
            <PrintSalesTab
              mode={userMode}
              onGoToMentor={() => navigate('mentor')}
              onOpenSettings={() => navigate('settings')}
            />
          )}
          {activeTab === 'field' && (
            <FieldTab
              assignment={activeAssignment}
              onCaptureAnalyzed={refreshActiveAssignment}
              onGoToPractice={() => navigate('practice')}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsTab
              mode={userMode}
              onModeChange={setUserMode}
              onPersistPersona={persistPersona}
              onPersistError={setPersonaError}
              onRestartOnboarding={() => {
                setShowOnboarding(true);
                navigate('home');
              }}
            />
          )}
        </main>

        <footer className="hidden lg:block border-t border-warm py-6 text-center text-xs text-muted px-4 mb-0 bg-canvas">
          <p>Iris — your photos stay in your private library.</p>
        </footer>
      </div>

      <BottomNav activeTab={activeTab} mode={userMode} onNavigate={navigate} />
    </div>
  );
}

export default App;
