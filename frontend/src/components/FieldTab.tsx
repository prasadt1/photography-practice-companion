import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, ChevronDown, ChevronUp, Loader2, Target, Upload } from 'lucide-react';
import { friendlyErrorMessage } from '../lib/friendlyError';
import { analyzePhoto } from '../services/agentClient';
import type { Assignment } from '../types/practice';

interface Props {
  assignment: Assignment | null;
  onCaptureAnalyzed?: () => void;
  onGoToPractice: () => void;
}

function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, b64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

export const FieldTab: React.FC<Props> = ({
  assignment,
  onCaptureAnalyzed,
  onGoToPractice,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastCaptureOk, setLastCaptureOk] = useState(false);
  const [briefExpanded, setBriefExpanded] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStreaming(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera not available. Use “Pick from gallery” below.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
    } catch {
      setError('Camera permission denied or unavailable. Use gallery upload instead.');
    }
  }, []);

  useEffect(() => {
    void startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const runAnalysis = async (file: File) => {
    if (!assignment) return;
    setAnalyzing(true);
    setLastCaptureOk(false);
    setError(null);
    try {
      await analyzePhoto({ imageFile: file, assignmentId: assignment.id });
      setLastCaptureOk(true);
      onCaptureAnalyzed?.();
    } catch (e) {
      setError(friendlyErrorMessage(e));
    } finally {
      setAnalyzing(false);
    }
  };

  const captureFromVideo = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streaming) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    void runAnalysis(dataUrlToFile(dataUrl, 'field-capture.jpg'));
  };

  if (!assignment) {
    return (
      <div className="max-w-lg mx-auto text-center p-10 rounded-2xl border border-dashed border-warm">
        <Target className="w-10 h-10 text-stone-600 mx-auto mb-3" aria-hidden />
        <h2 className="text-xl font-bold text-white mb-2">Shoot Now</h2>
        <p className="text-muted text-sm mb-4">
          Accept a practice assignment first — then choose &quot;Shoot now&quot; to practice with
          your camera.
        </p>
        <button
          type="button"
          onClick={onGoToPractice}
          className="text-brand-400 font-semibold text-sm hover:underline"
        >
          Go to My Practice
        </button>
      </div>
    );
  }

  const briefLong = assignment.brief.length > 200;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn pb-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Shoot Now</h2>
        <p className="text-muted text-sm">
          Use your camera for the assignment you accepted — I&apos;ll critique the frame right away.
        </p>
      </div>

      <div className="rounded-2xl border border-brand-500/40 bg-surface-1 p-4">
        <p className="text-[10px] font-bold text-brand-400 uppercase tracking-wider mb-2">
          Active brief
        </p>
        <p
          className={`text-sm text-stone-200 leading-relaxed ${
            briefExpanded || !briefLong ? '' : 'line-clamp-3'
          }`}
        >
          {assignment.brief}
        </p>
        {briefLong && (
          <button
            type="button"
            onClick={() => setBriefExpanded((e) => !e)}
            className="mt-2 inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300"
          >
            {briefExpanded ? (
              <>
                <ChevronUp className="w-3 h-3" /> Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" /> Show full brief
              </>
            )}
          </button>
        )}
      </div>

      <div className="relative rounded-2xl overflow-hidden bg-photo-black border border-warm min-h-[320px] md:min-h-[420px] sm:aspect-[4/3]">
        <video
          ref={videoRef}
          playsInline
          muted
          className="w-full h-full min-h-[320px] md:min-h-[420px] sm:min-h-0 object-cover sm:object-contain"
          aria-label="Camera preview for practice assignment"
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-30 sm:opacity-20"
          aria-hidden
        >
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/40" />
          <div className="absolute right-1/3 top-0 bottom-0 w-px bg-white/40" />
          <div className="absolute top-1/3 left-0 right-0 h-px bg-white/40" />
          <div className="absolute bottom-1/3 left-0 right-0 h-px bg-white/40" />
        </div>
        {analyzing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-canvas-elevated/80">
            <Loader2 className="w-10 h-10 animate-spin text-brand-400 mb-2" />
            <p className="text-sm text-stone-300">Analyzing your shot…</p>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />

      {error && (
        <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2" role="alert">
          {error}
        </p>
      )}

      {lastCaptureOk && (
        <p className="text-sm text-brand-400 bg-brand-500/10 border border-brand-500/30 rounded-lg px-3 py-2">
          Captured and linked to this assignment. Mark complete in Practice when you are done, or
          take another shot.
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          disabled={!streaming || analyzing}
          onClick={captureFromVideo}
          className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-brand-500 text-on-brand font-bold text-sm disabled:opacity-50 min-h-[52px] flex-1 sm:flex-none shadow-lg shadow-brand-500/25 ring-2 ring-brand-400/30 ring-offset-2 ring-offset-canvas hover:bg-brand-400 transition-colors"
          aria-label="Capture and analyze"
        >
          <span className="w-10 h-10 rounded-full border-2 border-on-brand/40 flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5 shrink-0" />
          </span>
          <span className="sm:inline tracking-wide">Shutter · Capture</span>
        </button>
        <button
          type="button"
          disabled={analyzing}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-warm text-stone-200 text-sm font-medium hover:bg-surface-2 disabled:opacity-50 min-h-[44px] flex-1 sm:flex-none"
          aria-label="Pick from gallery"
        >
          <Upload className="w-5 h-5 shrink-0" />
          Gallery
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          aria-hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void runAnalysis(file);
          }}
        />
      </div>

      <p className="text-xs text-muted">
        HTTPS or localhost required for camera. On HTTP, use gallery pick (still tags the
        assignment).
      </p>
    </div>
  );
};
