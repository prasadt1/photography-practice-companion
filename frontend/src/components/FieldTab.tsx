import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Loader2, Target, Upload } from 'lucide-react';
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
      setError(e instanceof Error ? e.message : 'Analysis failed');
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
      <div className="max-w-lg mx-auto text-center p-10 rounded-2xl border border-dashed border-slate-700">
        <Target className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Field mode</h2>
        <p className="text-slate-400 text-sm mb-4">
          Accept a practice assignment first — then choose &quot;Shoot now&quot; to practice with
          your camera.
        </p>
        <button
          type="button"
          onClick={onGoToPractice}
          className="text-brand-400 font-semibold text-sm hover:underline"
        >
          Go to Practice
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Field</h2>
        <p className="text-slate-400 text-sm">
          Live capture for your active assignment — uploads are tagged automatically.
        </p>
      </div>

      <div className="rounded-2xl border border-brand-500/40 bg-slate-800/50 p-4">
        <p className="text-[10px] font-bold text-brand-400 uppercase tracking-wider mb-2">
          Active brief
        </p>
        <p className="text-sm text-slate-200 leading-relaxed">{assignment.brief}</p>
      </div>

      <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-700 aspect-[4/3]">
        <video
          ref={videoRef}
          playsInline
          muted
          className="w-full h-full object-contain"
          aria-label="Camera preview"
        />
        {analyzing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80">
            <Loader2 className="w-10 h-10 animate-spin text-brand-400 mb-2" />
            <p className="text-sm text-slate-300">Analyzing with Gemini…</p>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />

      {error && (
        <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {lastCaptureOk && (
        <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
          Captured and linked to this assignment. Mark complete in Practice when you are done, or
          take another shot.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!streaming || analyzing}
          onClick={captureFromVideo}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-500 text-slate-900 font-semibold text-sm disabled:opacity-50"
        >
          <Camera className="w-4 h-4" />
          Capture &amp; analyze
        </button>
        <button
          type="button"
          disabled={analyzing}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-600 text-slate-200 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          Pick from gallery
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void runAnalysis(file);
          }}
        />
      </div>

      <p className="text-xs text-slate-500">
        HTTPS or localhost required for camera. On HTTP, use gallery pick (still tags the
        assignment).
      </p>
    </div>
  );
};
