/**
 * Studio analysis UI — layout from gemma4; visual theme from gemini3 (slate + emerald).
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Brain,
  Target,
  Star,
  ScanEye,
  Download,
  Aperture,
  Clock,
  Gauge,
} from 'lucide-react';
import type { StudioAnalysis } from '../../types/studio';
import SpatialOverlay from './SpatialOverlay';
import DimensionOverlay from './DimensionOverlay';
import GlassBoxPanel from './GlassBoxPanel';
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
  const [activeTab, setActiveTab] = useState<TabId>('overview');
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
    badgeClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
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
    { id: 'glass-box', label: 'Glass Box', icon: Brain },
    { id: 'fix', label: 'How to Fix', icon: Target },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto animate-fadeIn mt-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: image */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative rounded-2xl bg-black border border-slate-700 shadow-2xl flex justify-center p-4">
            <div className="relative inline-block max-w-full">
              <img
                src={imageSrc}
                alt={analysis.critique.overall.slice(0, 120)}
                className="block max-w-full max-h-[55vh] rounded-lg"
              />
              <DimensionOverlay
                dimension={hoveredDimension}
                analysis={analysis}
              />
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
                className="absolute top-3 right-3 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-900/90 text-white border border-slate-600 backdrop-blur-md"
              >
                <ScanEye className="w-3.5 h-3.5" />
                {showOverlays ? 'Hide pins' : 'Show pins'}
              </button>
            )}
          </div>

          {(analysis.sceneDescription || analysis.colourNotes) && (
            <div className="space-y-3 rounded-2xl bg-slate-800/50 border border-slate-700 p-4">
              {analysis.sceneDescription && (
                <div>
                  <p className="text-[10px] font-semibold text-brand-400 uppercase tracking-wider mb-1.5">
                    What I see
                  </p>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {analysis.sceneDescription}
                  </p>
                </div>
              )}
              {analysis.colourNotes && (
                <div className="pt-2 border-t border-slate-700">
                  <p className="text-[10px] font-semibold text-amber-400/90 uppercase tracking-wider mb-1.5">
                    Colour &amp; palette
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed">{analysis.colourNotes}</p>
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
                className="bg-slate-800/50 p-2 rounded-xl border border-slate-700 flex flex-col items-center text-center"
              >
                <Icon className="w-4 h-4 text-brand-400 mb-1" />
                <span className="text-[9px] text-slate-400 uppercase">{label}</span>
                <span className="text-xs font-semibold text-slate-100">{value}</span>
              </div>
            ))}
          </div>

          {analysis.aestheticTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {analysis.aestheticTags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700"
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
                    ? 'bg-brand-500 text-slate-900 shadow-lg shadow-brand-500/20'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-slate-800/50 rounded-3xl p-6 border border-slate-700">
                <h2 className="text-xl font-bold text-slate-100 flex items-start gap-2 mb-3">
                  <Star className="w-6 h-6 text-brand-400 fill-brand-400 shrink-0" />
                  {analysis.critique.overall.split(/[.!?]/)[0]}.
                </h2>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${badgeClass}`}>
                    {skillLevel}
                  </span>
                  <span className="text-sm text-slate-400">{avg.toFixed(1)}/10 overall</span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed border-l-2 border-slate-700 pl-4">
                  {analysis.critique.overall}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase mb-4">Score breakdown</h3>
                  <div className="space-y-3">
                    {chartData.map((item) => {
                      const isActive =
                        hoveredDimension === item.subject || selectedDimension === item.subject;
                      const barColor =
                        item.score >= 8 ? 'bg-emerald-500' : item.score >= 5 ? 'bg-amber-500' : 'bg-rose-500';
                      return (
                        <button
                          key={item.subject}
                          type="button"
                          onClick={() => setSelectedDimension(item.subject)}
                          onMouseEnter={() => setHoveredDimension(item.subject)}
                          onMouseLeave={() => setHoveredDimension(null)}
                          onFocus={() => setHoveredDimension(item.subject)}
                          onBlur={() => setHoveredDimension(null)}
                          className={`w-full flex items-center gap-3 text-left p-2 -m-2 rounded-lg transition-all ${
                            isActive ? 'bg-brand-500/10 ring-1 ring-brand-500/30' : 'hover:bg-slate-700/40'
                          }`}
                          title={`Preview ${item.subject} on photo`}
                        >
                          <span
                            className={`w-24 text-xs truncate ${
                              isActive ? 'text-brand-400 font-semibold' : 'text-slate-400'
                            }`}
                          >
                            {item.subject}
                          </span>
                          <div className="flex-1 h-2.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${barColor}`}
                              style={{ width: `${item.score * 10}%` }}
                            />
                          </div>
                          <span className="w-8 text-sm font-bold text-slate-100">
                            {item.score.toFixed(1)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700 min-h-[200px]">
                  {selectedDimension ? (
                    <p className="text-sm text-slate-100 leading-relaxed">
                      {chartData.find((c) => c.subject === selectedDimension)?.critique}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400 text-center mt-12">
                      Hover a score to highlight that area on the photo, or click for detail
                    </p>
                  )}
                </div>
              </div>

              {analysis.learningPath.length > 0 && (
                <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700">
                  <h3 className="text-sm font-bold text-slate-100 mb-3">Next skills to practice</h3>
                  <ul className="space-y-2 text-sm text-slate-100">
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
            <GlassBoxPanel
              rationale={analysis.rationale}
              groundingPrinciples={analysis.groundingPrinciples}
              groundingCitations={analysis.groundingCitations}
              evidence={analysis.evidence}
            />
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
                      : 'border-slate-700 bg-slate-800/50'
                  }`}
                  onMouseEnter={() => setActiveBoxIndex(idx)}
                  onMouseLeave={() => setActiveBoxIndex(null)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold uppercase text-slate-400">
                      #{idx + 1} · {box.severity}
                    </span>
                    <span className="text-[10px] text-slate-400">{box.type}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-100 mb-2">{box.description}</p>
                  <p className="text-sm text-brand-400 flex gap-1">
                    <span>→</span>
                    {box.suggestion}
                  </p>
                </div>
              ))}
              <div className="mt-6 p-4 rounded-xl bg-slate-900/80 text-slate-200 text-sm border border-slate-700">
                <h4 className="font-semibold mb-2">Lighting map</h4>
                <p>Key: {analysis.lightingMap.key_light_direction}</p>
                <p>Fill: {analysis.lightingMap.fill_light_strength}</p>
                <p>Shadows: {analysis.lightingMap.shadow_character}</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-slate-700">
            <button
              type="button"
              onClick={handleExportXMP}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 text-white text-sm font-semibold hover:bg-slate-600 border border-slate-600"
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
