/**
 * Asset gathering types
 * Shared types for asset tagging and manifest generation
 */

export interface AssetTag {
  tag: string;
  segmentId: string;
  confidence: number;
}

export interface EmphasisData {
  wordIndex: number;
  level: 'med' | 'high';
  tone?: 'warm' | 'intense';
}

export interface AssetManifest {
  images: Array<{
    id: string;
    libraryId?: string;
    path: string;
    source: string;
    provider?: string;
    sourceUrl?: string;
    tags: string[];
    metadata?: unknown;
  }>;
  videos: Array<{
    id: string;
    libraryId?: string;
    path: string;
    source: string;
    provider?: string;
    sourceUrl?: string;
    tags: string[];
    width: number;
    height: number;
    duration: number;
    metadata?: unknown;
  }>;
  audio: Array<{
    id: string;
    path: string;
    segmentId: string;
    durationMs: number;
    wordTimestamps?: Array<{ word: string; startMs: number; endMs: number }>;
    emphasis?: EmphasisData[];
  }>;
  music: Array<{ id: string; path: string; source: string; genre: string }>;
}

export interface WordData {
  text: string;
  startMs: number;
  endMs: number;
  startFrame?: number;
  endFrame?: number;
  emphasis?: {
    level: 'none' | 'med' | 'high';
    tone?: 'warm' | 'intense';
  };
}
