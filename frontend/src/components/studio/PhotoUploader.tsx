/**
 * Upload UI — gemini3 dark theme (photography-coach-ai-gemini3)
 */

import React, { useCallback, useState, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Loader2,
  Aperture,
  ArrowUp,
  Brain,
  Zap,
  Target,
  Eye,
  Sparkles,
} from 'lucide-react';

interface PhotoUploaderProps {
  onImageSelected: (file: File, previewUrl: string) => void;
  isAnalyzing: boolean;
}

const THINKING_STEPS = [
  { text: 'Grounding in photography principles…', icon: Brain },
  { text: 'Analyzing composition and framing…', icon: Target },
  { text: 'Evaluating lighting and exposure…', icon: Zap },
  { text: 'Assessing technique and sharpness…', icon: Eye },
  { text: 'Building Glass Box critique…', icon: Sparkles },
];

const PhotoUploader: React.FC<PhotoUploaderProps> = ({ onImageSelected, isAnalyzing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [currentThinkingStep, setCurrentThinkingStep] = useState(0);

  useEffect(() => {
    if (!isAnalyzing) return;
    setCurrentThinkingStep(0);
    const interval = setInterval(() => {
      setCurrentThinkingStep((prev) =>
        prev < THINKING_STEPS.length - 1 ? prev + 1 : prev,
      );
    }, 2000);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    onImageSelected(file, URL.createObjectURL(file));
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
    if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto relative z-10">
      <div
        className={`relative group flex flex-col items-center justify-center w-full min-h-[320px] md:min-h-[400px] rounded-[2rem] border-2 border-dashed transition-all duration-500 cursor-pointer overflow-hidden
          ${
            dragActive
              ? 'border-brand-400 bg-brand-500/10 scale-[1.02] shadow-2xl shadow-brand-500/20'
              : 'border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 hover:border-brand-500/50 hover:shadow-2xl hover:shadow-brand-500/10'
          }
          ${isAnalyzing ? 'border-brand-500/20 bg-slate-900/80 cursor-default' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className={`absolute inset-0 w-full h-full opacity-0 z-20 ${isAnalyzing ? 'pointer-events-none' : 'cursor-pointer'}`}
          onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
          accept="image/*"
          disabled={isAnalyzing}
          aria-label="Upload a photo for analysis"
        />

        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-500/5 via-transparent to-transparent" />
        </div>

        <div className="flex flex-col items-center justify-center p-6 md:p-8 text-center relative z-10 w-full max-w-lg">
          {isAnalyzing ? (
            <div className="w-full animate-fadeIn flex flex-col items-center" role="status" aria-live="polite">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-brand-500/20 blur-xl rounded-full animate-pulse" />
                <Loader2 className="w-16 h-16 text-brand-400 animate-spin relative z-10" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-4">Coach is analyzing…</h3>
              <div className="w-full mt-2 bg-slate-800/80 rounded-xl border border-slate-700 p-4 font-mono text-sm text-left shadow-inner">
                <div className="space-y-3">
                  {THINKING_STEPS.map((step, index) => {
                    const isActive = index === currentThinkingStep;
                    const isPast = index < currentThinkingStep;
                    if (index > currentThinkingStep + 1) return null;
                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-3 transition-all ${isPast ? 'opacity-40' : ''}`}
                      >
                        <div
                          className={`p-1.5 rounded-md ${
                            isActive ? 'bg-brand-500/20 text-brand-400' : 'bg-slate-700 text-slate-500'
                          }`}
                        >
                          <step.icon className={`w-3.5 h-3.5 ${isActive ? 'animate-pulse' : ''}`} />
                        </div>
                        <span
                          className={
                            isActive ? 'text-slate-100 font-semibold' : 'text-slate-400'
                          }
                        >
                          {step.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 md:mb-8 relative group-hover:scale-110 transition-transform duration-500">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center shadow-xl group-hover:border-brand-500/50 transition-colors">
                  <Upload className="w-8 h-8 md:w-10 md:h-10 text-slate-400 group-hover:text-brand-400 transition-colors" />
                </div>
                <Aperture className="absolute -top-2 -right-2 w-6 h-6 text-slate-600 group-hover:text-brand-500/50 animate-pulse" />
                <ImageIcon className="absolute -bottom-2 -left-2 w-6 h-6 text-slate-600 group-hover:text-brand-500/50" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">
                Upload for{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-emerald-400">
                  Glass Box
                </span>{' '}
                critique
              </h3>
              <p className="text-base text-slate-400 max-w-md mb-8">
                Drag and drop or click to browse. JPG, PNG, WEBP.
              </p>
              <div className="px-6 py-3 bg-brand-600 hover:bg-brand-500 rounded-full text-white text-sm font-semibold shadow-lg shadow-brand-500/20 flex items-center gap-2 transition-colors">
                <ArrowUp className="w-4 h-4" />
                Start analysis
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoUploader;
