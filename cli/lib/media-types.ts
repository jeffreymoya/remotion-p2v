/**
 * Media service types for Phase 4: Asset & Provider Expansion
 */

import { z } from 'zod';

/**
 * Stock image from Pexels, Unsplash, or Pixabay
 */
export interface StockImage {
  id: string;
  url: string; // Display URL
  downloadUrl: string; // Full resolution download URL
  source: 'pexels' | 'unsplash' | 'pixabay';
  tags: string[];
  width: number;
  height: number;
  photographer?: string;
  creator?: string;
  licenseUrl: string;
  attribution: string;
}

/**
 * Stock video from Pexels or Pixabay
 */
export interface StockVideo {
  id: string;
  url: string; // Display URL
  downloadUrl: string; // Download URL
  source: 'pexels' | 'pixabay';
  tags: string[];
  width: number;
  height: number;
  duration: number; // seconds
  fps: number;
  creator: string;
  licenseUrl: string;
  attribution: string;
}

/**
 * Music track from Pixabay Music API or local library
 */
export interface MusicTrack {
  id: string;
  url: string;
  source: 'pixabay' | 'local';
  title: string;
  duration: number; // seconds
  mood?: string;
  licenseUrl?: string;
  attribution?: string;
}

/**
 * Combined media asset type
 */
export type MediaAsset = StockImage | StockVideo;

/**
 * Search options for images
 */
export interface ImageSearchOptions {
  perTag?: number;
  orientation: '16:9' | '9:16';
  minWidth?: number;
  minHeight?: number;
}

/**
 * Search options for videos
 */
export interface VideoSearchOptions {
  perTag?: number;
  orientation: '16:9' | '9:16';
  minDuration?: number;
  maxDuration?: number;
}

/**
 * Music mood categories
 */
export type MusicMood = 'uplifting' | 'dramatic' | 'calm' | 'energetic' | 'inspiring' | 'mysterious' | 'sad' | 'happy';

/**
 * Quality score breakdown
 */
export interface QualityScore {
  total: number; // 0-1
  resolution: number; // 0-1
  aspectRatio: number; // 0-1
  relevance: number; // 0-1
}

/**
 * TTS provider interface
 */
export interface TTSProvider {
  name: string;
  generateAudio(text: string, options?: TTSOptions): Promise<TTSResult>;
}

/**
 * TTS generation options
 */
export interface TTSOptions {
  voice?: string;
  speed?: number;
  pitch?: number;
}

/**
 * TTS result with timestamps
 */
export interface TTSResult {
  audioBuffer: Buffer;
  format: 'mp3';
  durationMs: number;
  timestamps: WordTimestamp[];
}

/**
 * Word-level timestamp with character-level data
 */
export interface WordTimestamp {
  word: string;
  startMs: number;
  endMs: number;
  characters?: CharacterTimestamp[];
}

/**
 * Character-level timestamp
 */
export interface CharacterTimestamp {
  char: string;
  startMs: number;
  endMs: number;
}

/**
 * Video metadata from ffprobe
 */
export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
}

/**
 * Downloaded media cache entry
 */
export interface MediaCacheEntry {
  id: string;
  source: string;
  url: string;
  downloadUrl: string;
  tags: string[];
  width: number;
  height: number;
  attribution: string;
  licenseUrl: string;
  downloadedAt: string;
  expiresAt: string;
  localPath: string;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  requests: number;
  per: 'second' | 'minute' | 'hour' | 'day';
}

/**
 * Error thrown when stock API fails
 */
export class StockAPIError extends Error {
  constructor(
    message: string,
    public readonly service: string,
    public readonly statusCode?: number,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'StockAPIError';
  }
}

/**
 * Error thrown when TTS generation fails
 */
export class TTSError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'TTSError';
  }
}

/**
 * Error thrown when media download fails
 */
export class MediaDownloadError extends Error {
  constructor(
    message: string,
    public readonly url: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'MediaDownloadError';
  }
}
