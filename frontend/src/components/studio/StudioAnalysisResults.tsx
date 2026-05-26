/**
 * Studio analysis UI — Gallery Atelier warm theme.
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Aperture,
  Target,
  Star,
  ScanEye,
  Download,
  Clock,
  Gauge,
} from 'lucide-react';
import type { StudioAnalysis } from '../../types/studio';
import SpatialOverlay from './SpatialOverlay';
import DimensionOverlay from './DimensionOverlay';
import GlassBoxPanel from './GlassBoxPanel';
import { LearningInsights } from './LearningInsights';
import { PortfolioTrendInsights } from './PortfolioTrendInsights';
import { ScoreBreakdownPanel } from './ScoreBreakdownPanel';
import { exportXMPSidecar } from '../../services/xmpService';

type TabId = 'overview' | 'glass-box' | 'fix';

interface Props {
  analysis: StudioAnalysis;
  imageSrc: string;
  originalFilename?: string;
  onReset: () => void;
}

const StudioAnalysisResults: React.FC<Props> = ({
  analysis,
  imageSrc,
  originalFilename = 'photo.jpg',
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('glass-box');
  const [activeBoxIndex, setActiveBoxIndex] = useState<number | null>(null);
  const [showOverlays, setShowOverlays] = useState(true);
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  const [hoveredDimension, setHoveredDimension] = useState<string | null>(null);

  const avg =
    (analysis.scores.composition +
      analysis.scores.lighting +
      analysis.scores.technique +
      analysis.scores.creativity +
      analysis.scores.subjectImpact) /
    5;

  let skillLevel = 'Developing';
  let badgeClass = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
  if (avg >= 7.5) {
    skillLevel = 'Advanced';
    badgeClass = 'bg-brand-500/20 text-brand-400 border-brand-500/30';
  } else if (avg >= 5.5) {
    skillLevel = 'Intermediate';
    badgeClass = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  }

  const chartData = [
    { subject: 'Composition', score: analysis.scores.composition, critique: analysis.critique.composition },
    { subject: 'Lighting', score: analysis.scores.lighting, critique: analysis.critique.lighting },
    { subject: 'Technique', score: analysis.scores.technique, critique: analysis.critique.technique },
    { subject: 'Creativity', score: analysis.scores.creativity, critique: analysis.critique.overall },
    { subject: 'Subject', score: analysis.scores.subjectImpact, critique: analysis.critique.overall },
  ].sort((a, b) => a.score - b.score);

  const focusDimension = hoveredDimension ?? selectedDimension;

  const focusScoreDimension = (subject: string) => {
    setSelectedDimension(subject);
    setHoveredDimension(subject);
    setActiveTab('glass-box');
  };

  const handleExportXMP = () => {
    const { filename, content } = exportXMPSidecar(analysis, originalFilename);
    const blob = new Blob([content], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'glass-box', label: 'Why I scored it', icon: Aperture },
    { id: 'fix', label: 'How to Fix', icon: Target },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto animate-fadeIn mt-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: photo + (on Overview) score breakdown directly underneath */}
        <div className="lg:col-span-5 space-y-4">
          <div className="space-y-3">
            <div className="relative rounded-2xl bg-photo-black border border-warm shadow-2xl flex justify-center p-4">
              <div className="relative inline-block max-w-full w-full">
                <img
                  src={imageSrc}
                  alt={analysis.critique.overall.slice(0, 120)}
                  className="block w-full max-h-[min(50vh,420px)] object-contain rounded-lg mx-auto"
                />
                <DimensionOverlay dimension={hoveredDimension} analysis={analysis} />
                <SpatialOverlay
                  boundingBoxes={analysis.boundingBoxes}
                  show={showOverlays && !hoveredDimension}
                  activeIndex={activeBoxIndex}
                  onHover={setActiveBoxIndex}
                  onPinClick={(idx) => {
                    setActiveTab('fix');
                    setActiveBoxIndex(idx);
                  }}
                />
              </div>
              {analysis.boundingBoxes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowOverlays((s) => !s)}
                  className="absolute top-3 right-3 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-canvas-elevated/90 text-white border border-warm backdrop-blur-md"
                >
                  <ScanEye className="w-3.5 h-3.5" />
                  {showOverlays ? 'Hide pins' : 'Show pins'}
                </button>
              )}
            </div>

            {/* Always rendered to prevent layout shift, opacity transition for smooth UX */}
            <p
              className={`text-center text-xs font-medium transition-opacity duration-200 h-4 ${
                focusDimension ? 'text-brand-400 opacity-100' : 'opacity-0'
              }`}
              role="status"
              aria-live="polite"
            >
              {focusDimension ? `Highlighting ${focusDimension} on photo` : '\u00A0'}
            </p>
          </div>

          {activeTab === 'overview' && (
            <ScoreBreakdownPanel
              rows={chartData}
              hoveredDimension={hoveredDimension}
              selectedDimension={selectedDimension}
              onHoverDimension={setHoveredDimension}
              onSelectDimension={(subject) => {
                setSelectedDimension(subject);
                setHoveredDimension(subject);
              }}
              onWhyClick={focusScoreDimension}
            />
          )}

          {(analysis.sceneDescription || analysis.colourNotes) && (
            <div className="space-y-3 rounded-2xl bg-surface-1 border border-warm p-4">
              {analysis.sceneDescription && (
                <div>
                  <p className="text-[10px] font-semibold text-brand-400 uppercase tracking-wider mb-1.5">
                    What I see
                  </p>
                  <p className="text-sm text-stone-200 leading-relaxed">
                    {analysis.sceneDescription}
                  </p>
                </div>
              )}
              {analysis.colourNotes && (
                <div className="pt-2 border-t border-warm">
                  <p className="text-[10px] font-semibold text-amber-400/90 uppercase tracking-wider mb-1.5">
                    Colour &amp; palette
                  </p>
                  <p className="text-sm text-stone-300 leading-relaxed">{analysis.colourNotes}</p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Target, label: 'Focal', value: analysis.settingsEstimate.focalLength },
              { icon: Aperture, label: 'Ap.', value: analysis.settingsEstimate.aperture },
              { icon: Clock, label: 'Shutter', value: analysis.settingsEstimate.shutterSpeed },
              { icon: Gauge, label: 'ISO', value: analysis.settingsEstimate.iso },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="bg-surface-1 p-2 rounded-xl border border-warm flex flex-col items-center text-center"
              >
                <Icon className="w-4 h-4 text-brand-400 mb-1" />
                <span className="text-[9px] text-muted uppercase">{label}</span>
                <span className="text-xs font-semibold text-stone-100">{value}</span>
              </div>
            ))}
          </div>

          {analysis.aestheticTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {analysis.aestheticTags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 rounded-full bg-surface-1 text-muted border border-warm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: tabs */}
        <div className="lg:col-span-7 pb-12">
          <div className="flex flex-wrap gap-2 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-brand-500 text-on-brand shadow-lg shadow-brand-500/20'
                    : 'bg-surface-2 text-muted border border-warm hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              {analysis.rationale.observations[0] && (
                <button
                  type="button"
                  onClick={() => setActiveTab('glass-box')}
                  className="w-full text-left rounded-xl border border-brand-500/30 bg-brand-500/5 p-4 hover:bg-brand-500/10 transition-colors"
                >
                  <p className="text-[10px] font-bold uppercase text-brand-400/90 tracking-wide mb-1">
                    Glass Box preview
                  </p>
                  <p className="text-sm text-stone-200 line-clamp-2">
                    {analysis.rationale.observations[0]}
                  </p>
                  <span className="text-xs text-brand-400 mt-2 inline-block">
                    See full reasoning →
                  </span>
                </button>
              )}

              <LearningInsights
                rows={chartData}
                onViewGlassBox={() => setActiveTab('glass-box')}
              />

              <PortfolioTrendInsights />

              <div className="bg-surface-1 rounded-3xl p-6 border border-warm">
                <h2 className="text-xl font-bold text-stone-100 flex items-start gap-2 mb-3">
                  <Star className="w-6 h-6 text-brand-400 fill-brand-400 shrink-0" />
                  {analysis.critique.overall.split(/[.!?]/)[0]}.
                </h2>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${badgeClass}`}>
                    {skillLevel}
                  </span>
                  <span className="text-sm text-muted">{avg.toFixed(1)}/10 overall</span>
                </div>
                <p className="text-sm text-muted leading-relaxed border-l-2 border-warm pl-4">
                  {analysis.critique.overall}
                </p>
              </div>

              {analysis.learningPath.length > 0 && (
                <div className="bg-surface-1 rounded-xl p-5 border border-warm">
                  <h3 className="text-sm font-bold text-stone-100 mb-3">Next skills to practice</h3>
                  <ul className="space-y-2 text-sm text-stone-100">
                    {analysis.learningPath.map((s, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-brand-400">→</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'glass-box' && (
            <div className="space-y-6 animate-fadeIn">
              <GlassBoxPanel
                rationale={analysis.rationale}
                groundingPrinciples={analysis.groundingPrinciples}
                groundingCitations={analysis.groundingCitations}
                evidence={analysis.evidence}
                focusDimension={focusDimension}
                onFocusDimension={(dim) => {
                  if (dim) focusScoreDimension(dim);
                  else {
                    setSelectedDimension(null);
                    setHoveredDimension(null);
                  }
                }}
              />
              <PortfolioTrendInsights />
            </div>
          )}

          {activeTab === 'fix' && (
            <div className="space-y-4 animate-fadeIn">
              {analysis.boundingBoxes.map((box, idx) => (
                <div
                  key={idx}
                  id={`spatial-card-${idx}`}
                  className={`p-4 rounded-xl border transition-all ${
                    activeBoxIndex === idx
                      ? 'border-brand-500 bg-brand-500/5'
                      : 'border-warm bg-surface-1'
                  }`}
                  onMouseEnter={() => setActiveBoxIndex(idx)}
                  onMouseLeave={() => setActiveBoxIndex(null)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold uppercase text-muted">
                      #{idx + 1} · {box.severity}
                    </span>
                    <span className="text-[10px] text-muted">{box.type}</span>
                  </div>
                  <p className="text-sm font-medium text-stone-100 mb-2">{box.description}</p>
                  <p className="text-sm text-brand-400 flex gap-1">
                    <span>→</span>
                    {box.suggestion}
                  </p>
                </div>
              ))}
              <div className="mt-6 p-4 rounded-xl bg-canvas-elevated/80 text-stone-200 text-sm border border-warm">
                <h4 className="font-semibold mb-2">Lighting map</h4>
                <p>Key: {analysis.lightingMap.key_light_direction}</p>
                <p>Fill: {analysis.lightingMap.fill_light_strength}</p>
                <p>Shadows: {analysis.lightingMap.shadow_character}</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-warm">
            <button
              type="button"
              onClick={handleExportXMP}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-3 text-white text-sm font-semibold hover:bg-surface-3 border border-warm"
            >
              <Download className="w-4 h-4" />
              Export XMP for Lightroom
            </button>
            <button
              type="button"
              onClick={onReset}
              className="px-4 py-2.5 rounded-xl border-2 border-brand-500 text-brand-500 text-sm font-semibold hover:bg-brand-500/10"
            >
              Upload another photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudioAnalysisResults;
