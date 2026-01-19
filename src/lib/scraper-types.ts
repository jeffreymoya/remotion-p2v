/**
 * Type definitions and Zod schemas for web scraper functionality
 * Phase 4.5: Web Scraping Implementation
 */

import { z } from 'zod';

/**
 * Scraped image from web search with metadata
 */
export interface ScrapedImage {
  id: string;
  url: string;
  sourceUrl: string; // The webpage where image was found
  width: number;
  height: number;
  format: 'jpeg' | 'png' | 'webp';
  sizeBytes: number;
  tags: string[];
  metadata?: ImageMetadata;
  downloadedPath?: string; // Local path after download (relative to project root)
}

/**
 * Detailed image metadata extracted from file
 */
export interface ImageMetadata {
  aspectRatio: number; // width / height (e.g., 1.777778 for 16:9)
  orientation: 'landscape' | 'portrait' | 'square';
  colorSpace?: string; // e.g., 'sRGB', 'RGB' (from sharp.metadata().space)
  hasAlpha: boolean; // Has transparency channel (sharp.metadata().channels === 4)
  quality?: number; // JPEG quality (1-100) if available from EXIF
  downloadedAt?: string; // ISO timestamp of when image was downloaded
}

/**
 * Quality configuration for image validation and selection
 */
export interface QualityConfig {
  minWidth: number;
  minHeight: number;
  maxWidth?: number;
  maxHeight?: number;
  allowedFormats: string[];
  minSizeBytes: number;
  maxSizeBytes: number;
  aspectRatios: {
    target: number;
    tolerance: number;
  };
}

/**
 * Simplified version of QualityConfig for single-image validation
 */
export interface ImageRequirements {
  minWidth: number; // Minimum width in pixels
  minHeight: number; // Minimum height in pixels
  maxWidth?: number; // Maximum width in pixels (optional)
  maxHeight?: number; // Maximum height in pixels (optional)
  allowedFormats: string[]; // Allowed formats (normalized lowercase: 'jpeg', 'png', 'webp')
  minSizeBytes: number; // Minimum file size in bytes
  maxSizeBytes: number; // Maximum file size in bytes
  maxUncompressedBytes?: number; // Maximum uncompressed size for decompression bomb protection
  desiredAspectRatio?: number; // Target aspect ratio (e.g., 1.777778)
  aspectRatioTolerance?: number; // Absolute tolerance (e.g., 0.3)
}

/**
 * Selection criteria weights for image ranking
 * All weights should sum to 1.0
 */
export interface SelectionCriteria {
  sceneRelevance: number; // Weight: 0-1
  technicalQuality: number; // Weight: 0-1
  aestheticAppeal: number; // Weight: 0-1
  aspectRatioMatch: number; // Weight: 0-1
}

/**
 * Result of image validation with detailed errors and warnings
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[]; // List of validation errors
  warnings: string[]; // List of validation warnings
  metadata?: ImageMetadata; // Extracted metadata if valid
  qualityScore?: number; // Overall quality score (0-1)
}

/**
 * Result of pre-validation (HEAD request) before download
 */
export interface PreValidationResult {
  valid: boolean;
  contentType?: string; // MIME type from headers
  contentLength?: number; // Size from headers
  errors: string[];
}

/**
 * Selection score calculation:
 *
 * totalScore = Σ(weight_i × normalized_score_i)
 *
 * Where normalized scores are:
 * - sceneRelevance: Gemini confidence score (0-1, from prompt response)
 * - technicalQuality: (actualPixels / targetPixels) × formatMultiplier
 *     - formatMultiplier: webp=1.1, avif=1.15, png=1.0, jpeg=0.95
 *     - targetPixels: 1920×1080 = 2,073,600
 *     - Capped at 1.0 for images exceeding target
 * - aestheticAppeal: Gemini aesthetic score (0-1, from prompt response)
 * - aspectRatioMatch: 1 - (|targetRatio - actualRatio| / tolerance)
 *     - targetRatio: 16/9 = 1.7778
 *     - tolerance: 0.3 (from config)
 *     - Clamped to [0, 1]
 *
 * Tie-breaking: If scores within 0.01, select higher resolution
 *
 * Example:
 * - Image: 3840×2160 (4K), webp, aspect 1.7778
 * - sceneRelevance: 0.9 (from Gemini)
 * - technicalQuality: 1.0 × 1.1 = 1.1 (exceeds target, capped at 1.0) → 1.0
 * - aestheticAppeal: 0.85 (from Gemini)
 * - aspectRatioMatch: 1 - |1.7778 - 1.7778| / 0.3 = 1.0
 * - totalScore = 0.4×0.9 + 0.3×1.0 + 0.2×0.85 + 0.1×1.0 = 0.9
 */

// ===========================
// Zod Schemas for Validation
// ===========================

/**
 * Custom validator for safe URLs (SSRF protection)
 * Validates URL scheme, prevents private IPs, and enforces length limits
 */
const safeUrlValidator = (url: string) => {
  try {
    const parsed = new URL(url);

    // Only allow HTTPS
    if (parsed.protocol !== 'https:') {
      return false;
    }

    // Check max length
    if (url.length > 2048) {
      return false;
    }

    // Block private IP ranges and localhost
    const hostname = parsed.hostname.toLowerCase();
    const privatePatterns = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^169\.254\./,
      /^localhost$/i,
    ];

    for (const pattern of privatePatterns) {
      if (pattern.test(hostname)) {
        return false;
      }
    }

    // Block certain TLDs
    const blockedTLDs = ['.local', '.internal', '.corp'];
    for (const tld of blockedTLDs) {
      if (hostname.endsWith(tld)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Schema for image URL extraction from search results
 * Used by Gemini prompt to return structured image URLs
 */
export const ImageUrlSchema = z.object({
  urls: z.array(z.object({
    url: z.string().url().refine(safeUrlValidator, {
      message: 'URL must be HTTPS and not target private networks'
    }),
    description: z.string().optional(),
    source: z.string().optional(),
  })),
});

/**
 * Schema for image selection response from Gemini
 * Includes selected index, reasoning, and component scores
 */
export const ImageSelectionSchema = z.object({
  selectedIndex: z.number().int().min(0),
  reasoning: z.string(),
  scores: z.object({
    sceneRelevance: z.number().min(0).max(1),
    technicalQuality: z.number().min(0).max(1),
    aestheticAppeal: z.number().min(0).max(1),
    aspectRatioMatch: z.number().min(0).max(1),
  }),
});

// ================
// Error Classes
// ================

/**
 * Error thrown when image validation fails
 * Contains detailed validation errors for debugging
 */
export class ImageValidationError extends Error {
  constructor(
    message: string,
    public readonly url: string,
    public readonly validationErrors: string[]
  ) {
    super(message);
    this.name = 'ImageValidationError';
  }
}

/**
 * Error thrown when image download fails
 * Includes status code and original error for diagnostics
 */
export class ImageDownloadError extends Error {
  constructor(
    message: string,
    public readonly url: string,
    public readonly statusCode?: number,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'ImageDownloadError';
  }
}

/**
 * Error thrown when web scraper operations fail
 * Tracks the operation that failed and underlying cause
 */
export class WebScraperError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'WebScraperError';
  }
}

// =============
// Type Exports
// =============

/**
 * Type derived from ImageUrlSchema for type-safe parsing
 */
export type ImageUrlType = z.infer<typeof ImageUrlSchema>;

/**
 * Type derived from ImageSelectionSchema for type-safe parsing
 */
export type ImageSelectionType = z.infer<typeof ImageSelectionSchema>;

/**
 * Utility type for image formats
 */
export type ImageFormat = 'jpeg' | 'png' | 'webp';

/**
 * Utility type for image orientations
 */
export type ImageOrientation = 'landscape' | 'portrait' | 'square';
