import { useCallback, useEffect, useState } from 'react';
import { Camera, Sparkles } from 'lucide-react';
import { ModeToggle } from './components/ModeToggle';
import { PracticeTab } from './components/PracticeTab';
import { FieldTab } from './components/FieldTab';
import { MemoryTab } from './components/MemoryTab';
import { MentorTab } from './components/MentorTab';
import { TriageTab } from './components/TriageTab';
import { PrintSalesTab } from './components/PrintSalesTab';
import { clearMentorSession } from './services/mentorClient';
import { fetchUserProfile, personaToUserMode, updatePersona } from './services/userClient';
import { ActivePracticeBanner } from './components/studio/ActivePracticeBanner';
import PhotoUploader from './components/studio/PhotoUploader';
import { fetchActiveAssignment } from './services/practiceClient';
import StudioAnalysisResults from './components/studio/StudioAnalysisResults';
import { analyzePhoto } from './services/agentClient';
import { mapAnalysisResult } from './lib/mapAnalysisResult';
import type { AnalysisResult } from './types';
import type { Assignment, UserMode } from './types/practice';

type Tab = 'studio' | 'practice' | 'memory' | 'mentor' | 'triage' | 'print' | 'field';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('studio');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState('photo.jpg');
  const [userMode, setUserMode] = useState<UserMode>('hobbyist');
  const [personaError, setPersonaError] = useState<string | null>(null);
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);

  const refreshActiveAssignment = useCallback(async () => {
    try {
      setActiveAssignment(await fetchActiveAssignment());
    } catch {
      setActiveAssignment(null);
    }
  }, []);

  useEffect(() => {
    void refreshActiveAssignment();
  }, [activeTab, refreshActiveAssignment]);

  useEffect(() => {
    if (userMode !== 'working_pro' && activeTab === 'print') {
      setActiveTab('mentor');
    }
  }, [userMode, activeTab]);

  useEffect(() => {
    void fetchUserProfile()
      .then((p) => setUserMode(personaToUserMode(p.persona)))
      .catch(() => {
        /* API offline — keep local default */
      });
  }, []);

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

  const handleGoHome = () => {
    setActiveTab('studio');
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setResult(null);
    setImageUrl(null);
    setFilename('photo.jpg');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navTabs: { id: Tab; label: string }[] = [
    { id: 'studio', label: 'Studio' },
    { id: 'practice', label: 'Practice' },
    { id: 'memory', label: 'Memory' },
    { id: 'mentor', label: 'Mentor' },
    { id: 'triage', label: 'Organize' },
    ...(userMode === 'working_pro' ? [{ id: 'print' as const, label: 'Print' }] : []),
    { id: 'field', label: 'Field' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-brand-500/30">
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
          <button
            type="button"
            onClick={handleGoHome}
            aria-label="Return to Studio home"
            className="flex items-center gap-3 group text-left"
          >
            <div className="bg-gradient-to-br from-brand-400 to-brand-600 p-2 md:p-2.5 rounded-xl shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/40 transition-shadow">
              <Camera className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl md:text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
                  Practice Companion
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-purple-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wide">
                  <Sparkles className="w-3 h-3" />
                  Gemini 3.1 Pro
                </span>
              </div>
              <span className="text-[11px] text-brand-400 font-semibold uppercase tracking-wide hidden sm:block">
                AI mentor · Glass Box · Persistent memory
              </span>
            </div>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 border-b border-slate-800">
        <ModeToggle
          mode={userMode}
          onModeChange={setUserMode}
          onPersistPersona={async (m) => {
            setPersonaError(null);
            await updatePersona(m);
            clearMentorSession();
          }}
          onPersistError={(msg) => setPersonaError(msg)}
        />
        {personaError && (
          <p className="max-w-7xl mx-auto px-4 pb-2 text-sm text-amber-400" role="alert">
            Persona not saved on server ({personaError}). Mentor chat still uses your
            selected toggle.
          </p>
        )}
      </div>

      <nav
        className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap gap-2"
        aria-label="Main navigation"
      >
        {navTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
              activeTab === tab.id
                ? 'bg-brand-500 text-slate-900 shadow-lg shadow-brand-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {activeTab === 'studio' && (
          <div className="animate-fadeIn">
            {!result && (
              <div className="flex flex-col items-center space-y-8">
                {activeAssignment && (
                  <ActivePracticeBanner assignment={activeAssignment} />
                )}
                <div className="text-center max-w-2xl">
                  <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
                    Studio{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-emerald-400">
                      critique
                    </span>
                  </h1>
                  <p className="text-slate-400">
                  Upload a photo for multimodal Glass Box feedback powered by Gemini 3.1 Pro.
                  Run <code className="text-brand-400">make api-dev</code> on port 8081 first.
                  </p>
                </div>
                <PhotoUploader onImageSelected={handleImageSelected} isAnalyzing={analyzing} />
              </div>
            )}
            {result && imageUrl && (
              <StudioAnalysisResults
                analysis={mapAnalysisResult(result)}
                imageSrc={imageUrl}
                originalFilename={filename}
                onReset={handleGoHome}
              />
            )}
          </div>
        )}
        {activeTab === 'practice' && (
          <PracticeTab
            mode={userMode}
            onGoToStudio={() => setActiveTab('studio')}
            onGoToField={() => setActiveTab('field')}
            onAssignmentsChange={refreshActiveAssignment}
          />
        )}
        {activeTab === 'memory' && <MemoryTab />}
        {activeTab === 'mentor' && <MentorTab mode={userMode} />}
        {activeTab === 'triage' && (
          <TriageTab mode={userMode} onGoToMemory={() => setActiveTab('memory')} />
        )}
        {activeTab === 'print' && (
          <PrintSalesTab mode={userMode} onGoToMentor={() => setActiveTab('mentor')} />
        )}
        {activeTab === 'field' && (
          <FieldTab
            assignment={activeAssignment}
            onCaptureAnalyzed={refreshActiveAssignment}
            onGoToPractice={() => setActiveTab('practice')}
          />
        )}
      </main>

      <footer className="border-t border-slate-800 py-8 text-center text-xs text-slate-500">
        <p>Google Cloud Rapid Agent Hackathon — MongoDB track</p>
        <p className="mt-1">UI theme: photography-coach-ai-gemini3 · Studio layout: gemma4</p>
      </footer>
    </div>
  );
}

export default App;
