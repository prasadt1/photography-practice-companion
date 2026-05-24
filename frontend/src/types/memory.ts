import type { AnalysisScores } from './index';

export interface PortfolioListItem {
  id: string;
  userId: string;
  shootId: string;
  imageUrl: string;
  createdAt: string;
  scores: AnalysisScores;
  overallAverage: number;
  aestheticTags: string[];
  sceneDescription?: string;
  colourNotes?: string | null;
  glassBoxSummary: string[];
}

export interface PortfolioListResponse {
  entries: PortfolioListItem[];
  total: number;
}

export interface AestheticProfileSummary {
  photoCount: number;
  dominantTags: string[];
  averageScores: Partial<AnalysisScores>;
  stylisticConsistencyScore: number | null;
  computedAt?: string;
}
