# Phase 1: Core Infrastructure Specification

## Overview
Establish the foundational types, schemas, validation logic, and prompts required for web scraping functionality.

## Deliverables

### 1. Type Definitions (`cli/lib/scraper-types.ts`)

#### Purpose
Define all TypeScript interfaces, types, and Zod schemas for the web scraping system.

#### Requirements

**SECURITY NOTE**: All URL validations must include checks against:
- Private IP ranges (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16)
- Loopback addresses
- Local network hostnames
- Non-HTTP/HTTPS protocols

##### Core Interfaces

**ScrapedImage**
```typescript
export interface ScrapedImage {
  id: string;                    // Unique identifier (SHA-256 hash of URL, hex-encoded)
  url: string;                   // Direct image URL (validated HTTPS only)
  sourceUrl: string;             // Webpage where image was found
  width: number;                 // Image width in pixels
  height: number;                // Image height in pixels
  format: 'jpeg' | 'png' | 'webp'; // Image format (normalized to lowercase)
  sizeBytes: number;             // File size in bytes
  tags: string[];                // Associated search tags
  metadata?: ImageMetadata;      // Optional additional metadata
  downloadedPath?: string;       // Local path after download (relative to project root, validated against traversal)
}

export interface ImageMetadata {
  aspectRatio: number;           // width / height (e.g., 1.777778 for 16:9)
  orientation: 'landscape' | 'portrait' | 'square';
  colorSpace?: string;           // e.g., 'sRGB', 'RGB' (from sharp.metadata().space)
  hasAlpha: boolean;             // Has transparency channel (sharp.metadata().channels === 4)
  quality?: number;              // JPEG quality (1-100) if available from EXIF, undefined otherwise
  downloadedAt?: string;         // ISO 8601 timestamp in UTC (e.g., '2025-12-01T10:30:00.000Z')
  fileMagicBytes?: string;       // First 8 bytes in hex for format verification
}
```

**QualityConfig**
```typescript
export interface QualityConfig {
  minWidth: number;              // Minimum width (e.g., 1920)
  minHeight: number;             // Minimum height (e.g., 1080)
  maxWidth?: number;             // Maximum width (optional, e.g., 7680 for 8K)
  maxHeight?: number;            // Maximum height (optional, e.g., 4320 for 8K)
  allowedFormats: string[];      // ['jpeg', 'png', 'webp'] - normalized lowercase only
  minSizeBytes: number;          // Minimum file size (e.g., 102400 = 100KB)
  maxSizeBytes: number;          // Maximum file size (e.g., 10485760 = 10MB)
  maxUncompressedBytes: number;  // Maximum uncompressed size to prevent decompression bombs (e.g., 100MB)
  aspectRatio: {
    target: number;              // Target aspect ratio (e.g., 1.777778 for 16:9)
    tolerance: number;           // Acceptable absolute deviation (e.g., 0.3 means 1.477778 to 2.077778)
  };
}

// Default configuration (loaded from config/web-scrape.config.ts)
export const DEFAULT_QUALITY_CONFIG: QualityConfig = {
  minWidth: 1920,
  minHeight: 1080,
  maxWidth: 7680,
  maxHeight: 4320,
  allowedFormats: ['jpeg', 'png', 'webp'],
  minSizeBytes: 102400,        // 100KB
  maxSizeBytes: 10485760,      // 10MB
  maxUncompressedBytes: 104857600, // 100MB
  aspectRatio: {
    target: 1.777778,          // 16:9
    tolerance: 0.3,
  },
}
```

**ImageRequirements**
```typescript
// Note: This is a simplified version of QualityConfig for single-image validation
export interface ImageRequirements {
  minWidth: number;              // Minimum width in pixels
  minHeight: number;             // Minimum height in pixels
  maxWidth?: number;             // Maximum width in pixels (optional)
  maxHeight?: number;            // Maximum height in pixels (optional)
  allowedFormats: string[];      // Allowed formats (normalized lowercase: 'jpeg', 'png', 'webp')
  minSizeBytes: number;          // Minimum compressed file size
  maxSizeBytes: number;          // Maximum compressed file size
  maxUncompressedBytes: number;  // Maximum uncompressed size
  desiredAspectRatio?: number;   // Target aspect ratio (e.g., 1.777778)
  aspectRatioTolerance?: number; // Absolute tolerance (e.g., 0.3)
}
```

**ValidationResult**
```typescript
export interface ValidationResult {
  valid: boolean;
  errors: string[];              // List of validation errors
  warnings: string[];            // List of validation warnings
  metadata?: ImageMetadata;      // Extracted metadata if valid
  qualityScore?: number;         // Overall quality score (0-1)
}

export interface PreValidationResult {
  valid: boolean;
  contentType?: string;          // MIME type from headers
  contentLength?: number;        // Size from headers
  errors: string[];
}
```

**SelectionCriteria**
```typescript
export interface SelectionCriteria {
  sceneRelevance: number;        // Weight: 0-1 (default: 0.4) - must sum to 1.0 with other weights
  technicalQuality: number;      // Weight: 0-1 (default: 0.3)
  aestheticAppeal: number;       // Weight: 0-1 (default: 0.2)
  aspectRatioMatch: number;      // Weight: 0-1 (default: 0.1)
}

// Helper function to validate and normalize weights
export function normalizeSelectionCriteria(criteria: SelectionCriteria): SelectionCriteria {
  const sum = criteria.sceneRelevance + criteria.technicalQuality +
              criteria.aestheticAppeal + criteria.aspectRatioMatch;

  if (Math.abs(sum - 1.0) > 0.001) {
    // Normalize to sum to 1.0
    return {
      sceneRelevance: criteria.sceneRelevance / sum,
      technicalQuality: criteria.technicalQuality / sum,
      aestheticAppeal: criteria.aestheticAppeal / sum,
      aspectRatioMatch: criteria.aspectRatioMatch / sum,
    };
  }
  return criteria;
}

export const DEFAULT_SELECTION_CRITERIA: SelectionCriteria = {
  sceneRelevance: 0.4,
  technicalQuality: 0.3,
  aestheticAppeal: 0.2,
  aspectRatioMatch: 0.1,
}

export interface ImageScore {
  imageId: string;
  totalScore: number;            // Weighted sum (0-1)
  breakdown: {
    sceneRelevance: number;
    technicalQuality: number;
    aestheticAppeal: number;
    aspectRatioMatch: number;
  };
  reasoning: string;             // AI explanation
}
```

**SearchResult**
```typescript
export interface SearchResult {
  query: string;
  urls: ImageUrl[];              // Deduplicated by URL
  totalFound: number;
  searchedAt: string;            // ISO 8601 timestamp in UTC
}

export interface ImageUrl {
  url: string;                   // Direct image URL (validated, no private IPs)
  description?: string;          // Alt text or description (sanitized)
  source?: string;               // Domain or website name
  thumbnailUrl?: string;         // Thumbnail URL if available (not used in validation)
}
```

##### Zod Schemas

**ImageUrlSchema**
```typescript
// Custom validator for safe URLs (no SSRF)
const safeUrlValidator = (url: string) => {
  try {
    const parsed = new URL(url);
    // Only allow HTTPS
    if (parsed.protocol !== 'https:') return false;
    // Reject private IP ranges
    const hostname = parsed.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return false;
    if (/^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(hostname)) return false;
    return true;
  } catch {
    return false;
  }
};

export const ImageUrlSchema = z.object({
  url: z.string().url().refine(safeUrlValidator, 'URL must be HTTPS and not private IP').describe('Direct URL to the image'),
  description: z.string().max(500).optional().describe('Image description or alt text'),
  source: z.string().max(100).optional().describe('Source website or domain'),
  thumbnailUrl: z.string().url().optional().describe('Thumbnail URL'),
});

export const SearchResultSchema = z.object({
  query: z.string().min(1).max(200).describe('The search query used'),
  urls: z.array(ImageUrlSchema).min(1).max(50).describe('Found image URLs (deduplicated)'),
  totalFound: z.number().int().nonnegative().max(1000).describe('Total results found'),
});

export type SearchResultType = z.infer<typeof SearchResultSchema>;
```

**ImageSelectionSchema**
```typescript
export const ImageSelectionSchema = z.object({
  selectedIndex: z.number().int().min(0).describe('Index of selected image in candidates array'),
  reasoning: z.string().min(20).describe('Detailed explanation of selection'),
  scores: z.object({
    sceneRelevance: z.number().min(0).max(1),
    technicalQuality: z.number().min(0).max(1),
    aestheticAppeal: z.number().min(0).max(1),
    aspectRatioMatch: z.number().min(0).max(1),
  }).describe('Individual score components'),
});

export type ImageSelectionType = z.infer<typeof ImageSelectionSchema>;
```

**SearchQuerySchema**
```typescript
export const SearchQuerySchema = z.object({
  queries: z.array(z.object({
    query: z.string().min(3).max(100).describe('Search query optimized for image search'),
    priority: z.number().min(1).max(5).describe('Query priority (5=highest, determines execution order)'),
    expectedResults: z.number().int().min(1).max(50).describe('Expected number of results'),
  })).min(1).max(3).describe('List of search queries (executed in priority order)'),
});

export type SearchQueryType = z.infer<typeof SearchQuerySchema>;
```

##### Error Classes

```typescript
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
```

##### Utility Types

```typescript
export type ImageFormat = 'jpeg' | 'png' | 'webp';
export type ImageOrientation = 'landscape' | 'portrait' | 'square';

export interface WebScrapeConfig {
  enabled: boolean;
  candidateCount: {
    min: number;                     // Minimum candidates before selection (e.g., 5)
    max: number;                     // Maximum candidates to validate (e.g., 20)
  };
  quality: QualityConfig;
  selection: {
    weights: SelectionCriteria;
  };
  download: {
    timeoutMs: number;               // Timeout per download request (e.g., 10000ms)
    retryAttempts: number;           // Retry attempts for failed downloads (e.g., 3)
    retryDelayMs: number;            // Delay between retries in ms (e.g., 1000ms)
    userAgent: string;               // User-Agent header (e.g., 'Mozilla/5.0 (compatible; P2V/1.0)')
    maxConcurrent: number;           // Max concurrent downloads globally (e.g., 3)
  };
  gemini: {
    searchModel: string;             // Model for search query generation (e.g., 'gemini-2.0-flash-exp')
    selectionModel: string;          // Model for image selection (e.g., 'gemini-2.0-flash-exp')
  };
  cache: {
    enabled: boolean;                // Enable URL caching to avoid re-downloading
    ttlSeconds: number;              // Cache TTL in seconds (e.g., 86400 = 24 hours)
  };
  filesystem: {
    downloadDir: string;             // Download directory relative to project root (e.g., '.cache/scraped-images')
    maxDiskUsageBytes: number;       // Maximum disk space for cached images (e.g., 1GB)
  };
}

// Default configuration
export const DEFAULT_WEB_SCRAPE_CONFIG: WebScrapeConfig = {
  enabled: true,
  candidateCount: {
    min: 5,
    max: 20,
  },
  quality: DEFAULT_QUALITY_CONFIG,
  selection: {
    weights: DEFAULT_SELECTION_CRITERIA,
  },
  download: {
    timeoutMs: 10000,
    retryAttempts: 3,
    retryDelayMs: 1000,
    userAgent: 'Mozilla/5.0 (compatible; RemotionP2V/1.0)',
    maxConcurrent: 3,
  },
  gemini: {
    searchModel: 'gemini-2.0-flash-exp',
    selectionModel: 'gemini-2.0-flash-exp',
  },
  cache: {
    enabled: true,
    ttlSeconds: 86400,
  },
  filesystem: {
    downloadDir: '.cache/scraped-images',
    maxDiskUsageBytes: 1073741824, // 1GB
  },
}
```

#### File Structure

```typescript
// cli/lib/scraper-types.ts

import { z } from 'zod';

// Interfaces
export interface ScrapedImage { /* ... */ }
export interface ImageMetadata { /* ... */ }
export interface QualityConfig { /* ... */ }
export interface ImageRequirements { /* ... */ }
export interface ValidationResult { /* ... */ }
export interface PreValidationResult { /* ... */ }
export interface SelectionCriteria { /* ... */ }
export interface ImageScore { /* ... */ }
export interface SearchResult { /* ... */ }
export interface ImageUrl { /* ... */ }
export interface WebScrapeConfig { /* ... */ }

// Zod Schemas
export const ImageUrlSchema = z.object({ /* ... */ });
export const SearchResultSchema = z.object({ /* ... */ });
export const ImageSelectionSchema = z.object({ /* ... */ });
export const SearchQuerySchema = z.object({ /* ... */ });

// Types from schemas
export type SearchResultType = z.infer<typeof SearchResultSchema>;
export type ImageSelectionType = z.infer<typeof ImageSelectionSchema>;
export type SearchQueryType = z.infer<typeof SearchQuerySchema>;

// Error classes
export class ImageValidationError extends Error { /* ... */ }
export class ImageDownloadError extends Error { /* ... */ }
export class WebScraperError extends Error { /* ... */ }

// Utility types
export type ImageFormat = 'jpeg' | 'png' | 'webp';
export type ImageOrientation = 'landscape' | 'portrait' | 'square';
```

---

### 2. Image Quality Validator (`cli/services/media/image-validator.ts`)

#### Purpose
Validate scraped images against quality criteria before and after download.

#### Requirements

##### Class Structure

```typescript
import { Logger } from 'winston'; // Use winston for structured logging

export class ImageQualityValidator {
  private config: QualityConfig;
  private logger: Logger;

  constructor(
    config: QualityConfig = DEFAULT_QUALITY_CONFIG,
    logger: Logger
  ) {
    this.config = config;
    this.logger = logger;
  }

  // Public methods
  async preValidateImage(url: string): Promise<PreValidationResult>
  async validateImage(imagePath: string, requirements: ImageRequirements): Promise<ValidationResult>
  meetsQualityCriteria(metadata: ImageMetadata, requirements: ImageRequirements): boolean
  calculateQualityScore(metadata: ImageMetadata, requirements: ImageRequirements): number

  // Private methods
  private async extractMetadata(imagePath: string): Promise<ImageMetadata>
  private checkDimensions(metadata: ImageMetadata, requirements: ImageRequirements): string[]
  private checkFormat(format: string, allowedFormats: string[]): string[]
  private checkFileSize(sizeBytes: number, requirements: ImageRequirements): string[]
  private checkAspectRatio(aspectRatio: number, requirements: ImageRequirements): string[]
  private checkUncompressedSize(metadata: ImageMetadata, maxBytes: number): string[]
  private determineOrientation(aspectRatio: number): ImageOrientation
  private validateUrlSafety(url: string): { valid: boolean; errors: string[] }
  private verifyFileMagicBytes(imagePath: string, expectedFormat: string): Promise<boolean>
}
```

##### Method Specifications

**preValidateImage**
```typescript
/**
 * Pre-validate image URL using HEAD request
 * Checks content-type and content-length headers
 * SECURITY: Validates URL is not private IP or unsafe protocol
 *
 * @param url - Image URL to validate
 * @returns PreValidationResult with validation status
 */
async preValidateImage(url: string): Promise<PreValidationResult> {
  // 1. Validate URL safety (no private IPs, HTTPS only)
  // 2. Make HEAD request with timeout (5s)
  // 3. Check Content-Type header (must be image/*)
  // 4. Check Content-Length header (within size limits)
  // 5. Track final URL after redirects for SSRF check
  // 6. Return result with errors if any
}
```

**Implementation Details**:
- Use axios with method: 'HEAD'
- Timeout: 5000ms
- Handle redirects: Follow up to 3, validate each redirect URL for SSRF
- Validate Content-Type: must match /^image\/(jpeg|jpg|png|webp)$/i
- Validate Content-Length: between minSizeBytes and maxSizeBytes
- Log redirect chain for security audit
- Return errors array with specific failure reasons
- **CRITICAL**: Validate final URL after redirects to prevent DNS rebinding

**Error Cases**:
- URL is private IP or localhost → error: 'URL targets private network'
- Protocol is not HTTPS → error: 'Only HTTPS URLs allowed'
- Timeout → error: 'Pre-validation timeout after 5000ms'
- Content-Type invalid → error: 'Invalid content type: {type}'
- Content-Length out of bounds → error: 'File size {size} outside valid range'

**validateImage**
```typescript
/**
 * Validate downloaded image file
 * Extracts metadata and checks all quality criteria
 * SECURITY: Verifies file magic bytes and prevents decompression bombs
 *
 * @param imagePath - Local path to downloaded image
 * @param requirements - Image quality requirements
 * @returns ValidationResult with detailed errors/warnings
 * @throws Error if file doesn't exist or can't be read
 */
async validateImage(
  imagePath: string,
  requirements: ImageRequirements
): Promise<ValidationResult> {
  // 1. Validate path is safe (no directory traversal)
  // 2. Attempt to extract metadata using sharp (with error handling)
  // 3. Verify file magic bytes match expected format
  // 4. Check uncompressed size to prevent decompression bombs
  // 5. Validate dimensions
  // 6. Validate format
  // 7. Validate file size
  // 8. Validate aspect ratio
  // 9. Calculate quality score
  // 10. Return result with errors/warnings
}
```

**Implementation Details**:
- Validate imagePath doesn't contain '..' or absolute path components
- Use `sharp` library to extract metadata with try-catch
- Use `sharp.metadata()` which returns: width, height, format, space, channels, size
- Read first 8 bytes and verify magic bytes match format
- Check `width * height * channels * bytesPerChannel <= maxUncompressedBytes`
- Call private validation methods for each criterion
- Collect all errors and warnings in order
- Calculate quality score (0-1) only if no errors
- Return ValidationResult with all information

**Error Handling**:
- File not found → throw Error with clear message
- Permission denied → throw Error
- Corrupted image (sharp fails) → return ValidationResult with error
- Path traversal detected → throw Error
- Decompression bomb detected → return ValidationResult with error

**extractMetadata**
```typescript
/**
 * Extract image metadata using sharp library
 *
 * @param imagePath - Local path to image
 * @returns ImageMetadata with dimensions, format, etc.
 * @throws Error if sharp cannot parse the image
 */
private async extractMetadata(imagePath: string): Promise<ImageMetadata> {
  // 1. Load image with sharp: const image = sharp(imagePath)
  // 2. Get metadata: const meta = await image.metadata()
  //    - meta.width: number
  //    - meta.height: number
  //    - meta.format: string (normalize to lowercase)
  //    - meta.space: string (colorSpace)
  //    - meta.channels: number (4 = has alpha)
  //    - meta.size: number (file size in bytes)
  // 3. Read first 8 bytes for magic bytes verification
  // 4. Calculate aspect ratio: width / height
  // 5. Determine orientation using determineOrientation()
  // 6. Extract JPEG quality if available from meta.density or EXIF
  // 7. Set downloadedAt to current UTC timestamp
  // 8. Return ImageMetadata object
}
```

**Magic Bytes for Format Verification**:
- JPEG: starts with `FF D8 FF`
- PNG: starts with `89 50 4E 47 0D 0A 1A 0A`
- WebP: starts with `52 49 46 46` followed by `57 45 42 50` at offset 8

**meetsQualityCriteria**
```typescript
/**
 * Check if image meets minimum quality criteria
 *
 * @param metadata - Image metadata
 * @param requirements - Quality requirements
 * @returns true if all criteria met
 */
meetsQualityCriteria(
  metadata: ImageMetadata,
  requirements: ImageRequirements
): boolean {
  // 1. Check all validation methods
  // 2. Return true only if no errors
  // 3. Warnings are acceptable
}
```

**calculateQualityScore**
```typescript
/**
 * Calculate overall quality score (0-1)
 * Based on resolution, aspect ratio match, and format quality
 *
 * @param metadata - Image metadata
 * @param requirements - Quality requirements
 * @returns Quality score between 0 and 1
 */
calculateQualityScore(
  metadata: ImageMetadata,
  requirements: ImageRequirements
): number {
  // Scoring components:
  // 1. Resolution score (40%):
  //    - Base: meets minimum = 0.7
  //    - Bonus: exceeds minimum by 20% = +0.15
  //    - Bonus: exceeds minimum by 50% = +0.15
  //
  // 2. Aspect ratio score (30%):
  //    - Perfect match (±0.01) = 1.0
  //    - Within tolerance = 0.7-0.9 (scaled)
  //    - Outside tolerance = 0.3
  //
  // 3. Format score (20%):
  //    - webp = 1.0
  //    - png = 0.9
  //    - jpeg = 0.8
  //
  // 4. File size score (10%):
  //    - Optimal range (1-5MB) = 1.0
  //    - Too small (<500KB) = 0.6
  //    - Too large (>8MB) = 0.7
  //
  // Return weighted sum
}
```

##### Validation Rules

**Dimension Validation**
```typescript
private checkDimensions(
  metadata: ImageMetadata,
  requirements: ImageRequirements
): string[] {
  const errors: string[] = [];

  if (metadata.width < requirements.minWidth) {
    errors.push(`Width ${metadata.width}px below minimum ${requirements.minWidth}px`);
  }

  if (metadata.height < requirements.minHeight) {
    errors.push(`Height ${metadata.height}px below minimum ${requirements.minHeight}px`);
  }

  if (requirements.maxWidth && metadata.width > requirements.maxWidth) {
    errors.push(`Width ${metadata.width}px exceeds maximum ${requirements.maxWidth}px`);
  }

  if (requirements.maxHeight && metadata.height > requirements.maxHeight) {
    errors.push(`Height ${metadata.height}px exceeds maximum ${requirements.maxHeight}px`);
  }

  return errors;
}
```

**Format Validation**
```typescript
private checkFormat(format: string, allowedFormats: string[]): string[] {
  const normalizedFormat = format.toLowerCase();

  if (!allowedFormats.includes(normalizedFormat)) {
    return [`Format '${format}' not in allowed formats: ${allowedFormats.join(', ')}`];
  }

  return [];
}
```

**File Size Validation**
```typescript
private checkFileSize(
  sizeBytes: number,
  requirements: ImageRequirements
): string[] {
  const errors: string[] = [];

  if (sizeBytes < requirements.minSizeBytes) {
    const minKB = Math.round(requirements.minSizeBytes / 1024);
    const actualKB = Math.round(sizeBytes / 1024);
    errors.push(`File size ${actualKB}KB below minimum ${minKB}KB`);
  }

  if (sizeBytes > requirements.maxSizeBytes) {
    const maxMB = Math.round(requirements.maxSizeBytes / (1024 * 1024));
    const actualMB = Math.round(sizeBytes / (1024 * 1024));
    errors.push(`File size ${actualMB}MB exceeds maximum ${maxMB}MB`);
  }

  return errors;
}
```

**Aspect Ratio Validation**
```typescript
private checkAspectRatio(
  aspectRatio: number,
  requirements: ImageRequirements
): string[] {
  if (!requirements.desiredAspectRatio) {
    return []; // No aspect ratio requirement
  }

  const tolerance = requirements.aspectRatioTolerance || 0.3;
  const delta = Math.abs(aspectRatio - requirements.desiredAspectRatio);

  // Tolerance is ABSOLUTE deviation, not percentage
  // e.g., if target is 1.777778 and tolerance is 0.3:
  //   valid range is 1.477778 to 2.077778

  if (delta > tolerance) {
    return [
      `Aspect ratio ${aspectRatio.toFixed(2)} deviates by ` +
      `${delta.toFixed(2)} from target ` +
      `${requirements.desiredAspectRatio.toFixed(2)} ` +
      `(max allowed: ${tolerance.toFixed(2)})`
    ];
  }

  return [];
}
```

**Uncompressed Size Validation**
```typescript
private checkUncompressedSize(
  metadata: ImageMetadata,
  maxBytes: number
): string[] {
  // Calculate uncompressed size: width * height * channels * bytes per channel
  const bytesPerChannel = 1; // Assume 8-bit per channel
  const uncompressedSize = metadata.width * metadata.height *
                          (metadata.hasAlpha ? 4 : 3) * bytesPerChannel;

  if (uncompressedSize > maxBytes) {
    const maxMB = (maxBytes / (1024 * 1024)).toFixed(1);
    const actualMB = (uncompressedSize / (1024 * 1024)).toFixed(1);
    return [
      `Uncompressed size ${actualMB}MB exceeds maximum ${maxMB}MB ` +
      `(potential decompression bomb)`
    ];
  }

  return [];
}
```

**URL Safety Validation**
```typescript
private validateUrlSafety(url: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    const parsed = new URL(url);

    // Check protocol
    if (parsed.protocol !== 'https:') {
      errors.push(`Protocol ${parsed.protocol} not allowed, only HTTPS permitted`);
    }

    // Check for private IPs and localhost
    const hostname = parsed.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      errors.push('Localhost URLs not permitted');
    }

    // Check for private IP ranges
    const privateIPv4Patterns = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^169\.254\./ // Link-local
    ];

    for (const pattern of privateIPv4Patterns) {
      if (pattern.test(hostname)) {
        errors.push(`Private IP address not permitted: ${hostname}`);
        break;
      }
    }

    // Check for local/internal TLDs
    if (hostname.endsWith('.local') || hostname.endsWith('.internal')) {
      errors.push('Local network domain not permitted');
    }

  } catch (err) {
    errors.push(`Invalid URL format: ${err.message}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

**File Magic Bytes Verification**
```typescript
private async verifyFileMagicBytes(
  imagePath: string,
  expectedFormat: string
): Promise<boolean> {
  const fs = await import('fs/promises');
  const buffer = Buffer.alloc(12); // Read first 12 bytes
  const fd = await fs.open(imagePath, 'r');
  await fd.read(buffer, 0, 12, 0);
  await fd.close();

  const hex = buffer.toString('hex').toUpperCase();

  switch (expectedFormat.toLowerCase()) {
    case 'jpeg':
      return hex.startsWith('FFD8FF');
    case 'png':
      return hex.startsWith('89504E470D0A1A0A');
    case 'webp':
      // RIFF header + WEBP signature at offset 8
      return hex.startsWith('52494646') && hex.substring(16, 24) === '57454250';
    default:
      return false;
  }
}
```

#### Error Handling

**Network Errors**
- Timeout: Return error in PreValidationResult.errors: 'Request timeout after 5000ms'
- DNS failure: Return error: 'DNS resolution failed: {hostname}'
- Connection refused: Return error: 'Connection refused by server'
- SSL/TLS error: Return error: 'SSL certificate validation failed'
- SSRF attempt: Return error: 'URL validation failed: targets private network'

**File System Errors**
- File not found: Throw Error: 'Image file not found: {path}'
- Permission denied: Throw Error: 'Permission denied reading: {path}'
- Disk full: Throw Error: 'Insufficient disk space'
- Path traversal: Throw Error: 'Invalid path: directory traversal detected'

**Sharp Library Errors**
- Invalid format: Return ValidationResult error: 'Unsupported image format'
- Corrupted data: Return ValidationResult error: 'Image file corrupted or unreadable'
- Unsupported feature: Return ValidationResult warning: 'Image uses unsupported feature: {feature}'
- Out of memory: Throw Error: 'Image too large to process (memory limit exceeded)'

**Retry Strategy** (for network operations):
- Attempt 1: Immediate
- Attempt 2: After retryDelayMs (1000ms)
- Attempt 3: After retryDelayMs * 2 (2000ms)
- All attempts failed: Return final error with attempt count

**Logging Strategy**:
- info: Validation started, validation passed
- warn: Validation warnings (e.g., suboptimal format)
- error: Validation errors, network failures, filesystem errors
- debug: Metadata extraction details, quality score breakdown
- Include context: { url, imagePath, operation, duration }

---

### 3. Gemini Web Search Prompts (`config/prompts/web-scrape.prompt.ts`)

#### Purpose
Provide specialized prompts for Gemini to perform web scraping operations.

**SECURITY NOTE**: All prompts must sanitize user input to prevent prompt injection:
- Escape special characters in scene descriptions
- Truncate excessively long inputs
- Remove control characters and null bytes
- Validate tags are alphanumeric with hyphens/underscores only

**JSON PARSING STRATEGY**:
- Gemini may wrap JSON in markdown code blocks (```json...```)
- Strip markdown before parsing: Remove leading/trailing ```json and ```
- Validate with Zod schema after parsing
- Retry with clearer instructions if parsing fails

#### Requirements

##### Utility Functions

**sanitizeTextInput**
```typescript
/**
 * Sanitize user text input to prevent prompt injection
 *
 * @param text - Input text to sanitize
 * @param maxLength - Maximum allowed length
 * @returns Sanitized text
 */
export function sanitizeTextInput(text: string, maxLength: number): string {
  return text
    .slice(0, maxLength)
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/[{}[\]]/g, '') // Remove braces/brackets that could break JSON
    .trim();
}
```

**parseGeminiJSON**
```typescript
/**
 * Parse JSON from Gemini response, handling markdown wrapping
 *
 * @param response - Raw Gemini response string
 * @returns Parsed JSON object
 * @throws Error if JSON is invalid after cleanup
 */
export function parseGeminiJSON<T>(response: string): T {
  // Remove markdown code blocks
  let cleaned = response.trim();

  // Remove ```json and ``` wrappers
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }

  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }

  cleaned = cleaned.trim();

  return JSON.parse(cleaned) as T;
}
```

##### Prompt Functions

**generateSearchQueriesPrompt**
```typescript
/**
 * Generate optimized search queries for image search
 * SECURITY: Sanitizes scene description and tags before injection
 *
 * @param vars.sceneDescription - Full scene text (max 1000 chars, sanitized)
 * @param vars.tags - Extracted visual tags (max 20 tags, alphanumeric only)
 * @param vars.queryCount - Number of queries to generate (1-3)
 * @returns Prompt string for Gemini
 */
export const generateSearchQueriesPrompt = (vars: {
  sceneDescription: string;
  tags: string[];
  queryCount: number;
}): string => {
  // Sanitize inputs
  const sanitizedDescription = sanitizeTextInput(vars.sceneDescription, 1000);
  const sanitizedTags = vars.tags
    .slice(0, 20)
    .filter(tag => /^[a-zA-Z0-9\-_\s]+$/.test(tag))
    .map(tag => tag.trim());

  return `You are an expert at creating optimal image search queries for stock photography and web images.

Given this scene description and visual tags, generate ${vars.queryCount} optimized search queries for finding high-quality images.

SCENE DESCRIPTION:
"${sanitizedDescription}"

VISUAL TAGS:
${sanitizedTags.map(tag => `- ${tag}`).join('\n')}

REQUIREMENTS:
1. Create ${vars.queryCount} distinct search queries (most specific to most general)
2. Each query should be 2-5 words
3. Focus on concrete visual elements, not abstract concepts
4. Prioritize queries likely to return high-quality stock images
5. Avoid overly specific queries that might return no results
6. Consider photographic style: "professional", "high-resolution", "stock photo"

CRITICAL: Return ONLY valid JSON with this exact structure (no markdown, no explanations):
{
  "queries": [
    {
      "query": "professional aerial city skyline sunset",
      "priority": 5,
      "expectedResults": 10
    }
  ]
}

IMPORTANT:
- "query": The actual search query (2-5 words)
- "priority": Importance ranking (1-5, where 5 is highest)
- "expectedResults": How many good results you expect (1-10)`;
};
```

**searchWebForImagesPrompt**
```typescript
/**
 * Search the web for image URLs using Gemini's web search
 *
 * @param vars.query - Search query
 * @param vars.minUrls - Minimum URLs to find (5-10)
 * @param vars.maxUrls - Maximum URLs to return (10-20)
 * @param vars.requirements - Image requirements
 * @returns Prompt string for Gemini
 */
export const searchWebForImagesPrompt = (vars: {
  query: string;
  minUrls: number;
  maxUrls: number;
  requirements: {
    minWidth: number;
    minHeight: number;
    formats: string[];
  };
}): string => {
  return `Search the web for high-quality images matching this query and return direct image URLs.

SEARCH QUERY: "${vars.query}"

IMAGE REQUIREMENTS:
- Minimum resolution: ${vars.requirements.minWidth}x${vars.requirements.minHeight}
- Formats: ${vars.requirements.formats.join(', ')}
- High quality, professional images preferred
- Direct image URLs (not webpage URLs)

INSTRUCTIONS:
1. Use web search to find images matching the query
2. Extract ${vars.minUrls}-${vars.maxUrls} direct image URLs
3. Prefer URLs ending in .jpg, .jpeg, .png, or .webp
4. Prioritize stock photo sites, professional photography sites
5. Avoid social media thumbnails, low-res images
6. Include image source (website/domain)
7. Include image description if available (alt text, title)

CRITICAL: Return ONLY valid JSON with this exact structure (no markdown, no explanations):
{
  "query": "${vars.query}",
  "urls": [
    {
      "url": "https://example.com/image.jpg",
      "description": "Professional cityscape at sunset",
      "source": "example.com"
    }
  ],
  "totalFound": 10
}

IMPORTANT:
- Return ${vars.minUrls}-${vars.maxUrls} URLs
- Each URL must be a direct image URL (not a webpage)
- Include description and source for context`;
};
```

**selectBestImagePrompt**
```typescript
/**
 * Select the best image from candidates
 *
 * @param vars.sceneDescription - Scene description
 * @param vars.candidates - Array of candidate images
 * @param vars.criteria - Selection criteria weights
 * @returns Prompt string for Gemini
 */
export const selectBestImagePrompt = (vars: {
  sceneDescription: string;
  candidates: Array<{
    index: number;
    url: string;
    description?: string;
    metadata: {
      width: number;
      height: number;
      format: string;
      aspectRatio: number;
    };
  }>;
  criteria: SelectionCriteria;
}): string => {
  return `You are an expert at selecting the best images for video content. Analyze these candidate images and select the ONE best match for the scene.

SCENE DESCRIPTION:
"${vars.sceneDescription}"

CANDIDATE IMAGES:
${vars.candidates.map(c => `
[${c.index}] ${c.url}
  Description: ${c.description || 'N/A'}
  Resolution: ${c.metadata.width}x${c.metadata.height}
  Format: ${c.metadata.format}
  Aspect Ratio: ${c.metadata.aspectRatio.toFixed(2)}
`).join('\n')}

SELECTION CRITERIA (weights):
- Scene Relevance: ${(vars.criteria.sceneRelevance * 100).toFixed(0)}%
- Technical Quality: ${(vars.criteria.technicalQuality * 100).toFixed(0)}%
- Aesthetic Appeal: ${(vars.criteria.aestheticAppeal * 100).toFixed(0)}%
- Aspect Ratio Match: ${(vars.criteria.aspectRatioMatch * 100).toFixed(0)}%

EVALUATION FACTORS:
1. Scene Relevance: How well does the image match the scene description?
2. Technical Quality: Resolution, format, file characteristics
3. Aesthetic Appeal: Composition, lighting, professional quality
4. Aspect Ratio: How close to 16:9 (1.78) or desired ratio

CRITICAL: Return ONLY valid JSON with this exact structure (no markdown, no explanations):
{
  "selectedIndex": 0,
  "reasoning": "This image best captures the scene because...",
  "scores": {
    "sceneRelevance": 0.95,
    "technicalQuality": 0.88,
    "aestheticAppeal": 0.92,
    "aspectRatioMatch": 0.85
  }
}

IMPORTANT:
- "selectedIndex": Index of the best image (0-${vars.candidates.length - 1})
- "reasoning": Detailed explanation (minimum 50 characters)
- "scores": Individual scores for each criterion (0.0-1.0)
- Consider ALL criteria with their respective weights`;
};
```

#### Prompt Design Principles

**Clarity**
- Clear, specific instructions
- Explicit output format requirements
- No ambiguity in requirements

**Structure**
- Section headers (SCENE, REQUIREMENTS, INSTRUCTIONS)
- Numbered steps for complex operations
- Clear separation of input and output

**Validation**
- Explicit JSON schema in prompt
- Type specifications (numbers, strings)
- Range constraints where applicable

**Error Prevention**
- "CRITICAL" and "IMPORTANT" markers for key requirements
- "no markdown, no explanations" to prevent wrapping
- Example JSON structure included

---

## Additional Implementation Considerations

### URL Deduplication Strategy
When multiple search queries return the same image URL:
1. Track seen URLs in a Set during candidate collection
2. Skip pre-validation for duplicate URLs
3. Use first occurrence's metadata and description

### Disk Space Management
Before downloading images:
1. Check available disk space using `fs.statfs()`
2. Calculate current cache directory size
3. If approaching `maxDiskUsageBytes`, clean oldest files first (LRU)
4. Reserve 10% buffer for safety

### Download Retry Logic
For each download attempt:
```typescript
async function downloadWithRetry(url: string, config: DownloadConfig): Promise<Buffer> {
  let lastError: Error;

  for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
    try {
      return await downloadImage(url, config.timeoutMs);
    } catch (err) {
      lastError = err;

      // Don't retry on 4xx errors (except 429 rate limit)
      if (err.status >= 400 && err.status < 500 && err.status !== 429) {
        throw err;
      }

      if (attempt < config.retryAttempts) {
        const delay = config.retryDelayMs * attempt; // Linear backoff
        await sleep(delay);
      }
    }
  }

  throw new ImageDownloadError(
    `Download failed after ${config.retryAttempts} attempts`,
    url,
    undefined,
    lastError
  );
}
```

### Concurrency Control
Use a semaphore pattern to limit concurrent downloads:
```typescript
class DownloadSemaphore {
  private running = 0;
  private queue: Array<() => void> = [];

  async acquire(maxConcurrent: number): Promise<void> {
    if (this.running < maxConcurrent) {
      this.running++;
      return;
    }

    return new Promise(resolve => {
      this.queue.push(resolve);
    });
  }

  release(maxConcurrent: number): void {
    this.running--;
    if (this.queue.length > 0 && this.running < maxConcurrent) {
      const next = this.queue.shift();
      this.running++;
      next?.();
    }
  }
}
```

### Cache Implementation
Image caching structure:
```
.cache/scraped-images/
  ├── metadata.json          # URL → {path, timestamp, size, hash}
  └── images/
      ├── abc123.jpg
      ├── def456.png
      └── ...
```

Metadata entry:
```typescript
interface CacheEntry {
  url: string;
  localPath: string;
  cachedAt: string;          // ISO 8601 UTC timestamp
  sizeBytes: number;
  hash: string;              // SHA-256 of URL
  lastAccessed: string;      // For LRU eviction
  validUntil: string;        // cachedAt + ttlSeconds
}
```

---

## Testing Requirements

### Unit Tests

**scraper-types.test.ts**
```typescript
describe('Scraper Types', () => {
  describe('Zod Schemas', () => {
    it('validates ImageUrlSchema correctly');
    it('validates SearchResultSchema correctly');
    it('validates ImageSelectionSchema correctly');
    it('validates SearchQuerySchema correctly');
    it('rejects invalid URLs');
    it('rejects out-of-range scores');
  });

  describe('Error Classes', () => {
    it('creates ImageValidationError with details');
    it('creates ImageDownloadError with status code');
    it('creates WebScraperError with operation name');
  });
});
```

**image-validator.test.ts**
```typescript
describe('ImageQualityValidator', () => {
  describe('preValidateImage', () => {
    it('validates valid image URL');
    it('rejects non-image content type');
    it('rejects oversized files');
    it('rejects undersized files');
    it('handles network timeout');
    it('handles 404 errors');
  });

  describe('validateImage', () => {
    it('validates image meeting all criteria');
    it('rejects image below min dimensions');
    it('rejects image above max dimensions');
    it('rejects invalid format');
    it('rejects file size out of range');
    it('rejects aspect ratio mismatch');
    it('handles corrupted image file');
  });

  describe('calculateQualityScore', () => {
    it('calculates perfect score for ideal image');
    it('reduces score for low resolution');
    it('reduces score for aspect ratio mismatch');
    it('reduces score for suboptimal format');
    it('returns score between 0 and 1');
  });

  describe('meetsQualityCriteria', () => {
    it('returns true for valid image');
    it('returns false for any validation error');
    it('accepts warnings without errors');
  });
});
```

**web-scrape-prompts.test.ts**
```typescript
describe('Web Scrape Prompts', () => {
  describe('generateSearchQueriesPrompt', () => {
    it('includes scene description');
    it('includes all tags');
    it('specifies query count');
    it('includes JSON schema');
  });

  describe('searchWebForImagesPrompt', () => {
    it('includes search query');
    it('includes image requirements');
    it('includes min/max URL counts');
    it('specifies expected JSON structure');
  });

  describe('selectBestImagePrompt', () => {
    it('includes scene description');
    it('lists all candidates with metadata');
    it('includes selection criteria weights');
    it('specifies expected response format');
  });
});
```

### Integration Tests

**validator-integration.test.ts**
```typescript
describe('Image Validator Integration', () => {
  it('validates real image from URL');
  it('handles various image formats');
  it('extracts accurate metadata');
  it('calculates consistent quality scores');
});
```

### Test Data Requirements

**Test Images**
- Create test fixtures with known dimensions/formats:
  - `test-1920x1080.jpg` (valid, perfect)
  - `test-1280x720.jpg` (valid, below target)
  - `test-640x480.jpg` (invalid, too small)
  - `test-3840x2160.webp` (valid, high res)
  - `test-portrait-1080x1920.jpg` (valid, wrong orientation)
  - `test-corrupted.jpg` (invalid, corrupted data)

**Test URLs**
- Mock successful HEAD requests
- Mock failed HEAD requests (404, timeout)
- Mock invalid content types

---

## Acceptance Criteria

### Type Definitions
- [ ] All interfaces defined with complete JSDoc
- [ ] All Zod schemas validate correctly with safe URL validation
- [ ] Error classes have proper inheritance
- [ ] Types export successfully
- [ ] No TypeScript errors
- [ ] Default configurations exported and documented
- [ ] Helper functions (normalize, sanitize) implemented

### Image Validator
- [ ] Pre-validation checks headers correctly
- [ ] Pre-validation validates URL safety (no SSRF)
- [ ] Pre-validation tracks and validates redirect chain
- [ ] Full validation extracts metadata accurately using sharp
- [ ] File magic bytes verified for format validation
- [ ] Uncompressed size check prevents decompression bombs
- [ ] Path traversal validation implemented
- [ ] All validation rules implemented (dimensions, format, size, aspect ratio)
- [ ] Quality score calculation works correctly with all components
- [ ] Error handling is comprehensive with specific messages
- [ ] Retry logic with exponential backoff implemented
- [ ] Logging strategy implemented with structured logs
- [ ] All unit tests pass (>90% coverage)

### Prompts
- [ ] All three prompts generate valid output
- [ ] Input sanitization prevents prompt injection
- [ ] JSON schemas are correct and match Zod schemas
- [ ] Instructions are clear and unambiguous
- [ ] Prompts tested manually with Gemini CLI
- [ ] Output parses correctly with Zod schemas
- [ ] parseGeminiJSON handles markdown-wrapped responses
- [ ] Error handling for malformed JSON responses

### Security
- [ ] SSRF protection validates all URLs before use
- [ ] Private IP ranges blocked (10.x, 192.168.x, 127.x, 169.254.x)
- [ ] Redirect chains validated to prevent DNS rebinding
- [ ] Decompression bomb protection implemented
- [ ] Path traversal validation prevents filesystem attacks
- [ ] Prompt injection prevention through sanitization
- [ ] HTTPS-only enforcement for all image URLs
- [ ] Content-Type and magic bytes both verified

### Performance & Reliability
- [ ] Concurrent download limiting works (semaphore pattern)
- [ ] Retry logic implemented with configurable attempts
- [ ] Timeout enforcement on all network operations
- [ ] Cache implementation with LRU eviction
- [ ] Disk space checking before downloads
- [ ] URL deduplication across search queries

### Documentation
- [ ] All code has JSDoc comments
- [ ] Complex logic has inline comments
- [ ] Security considerations documented
- [ ] Error handling strategies documented
- [ ] Retry and concurrency patterns documented
- [ ] Configuration options fully documented with examples

---

## Dependencies
- `zod` (already installed)
- `sharp` (already installed)
- `axios` (already installed)
- `fs-extra` (already installed)
- `winston` (for logging - may need installation)

---

## Estimated Time
**6-8 hours** (increased from 3-4 hours due to security hardening requirements)

Breakdown:
- Type definitions with defaults: 1.5 hours
- Image validator with security features: 3 hours
- Prompts with sanitization: 1 hour
- Utility functions (cache, concurrency, retry): 1.5 hours
- Unit tests: 1.5-2 hours
- Integration testing and fixes: 0.5-1 hour

---

## Notes

### Code Style
- Follow existing code style from `cli/lib/media-types.ts`
- Use consistent error handling patterns
- Keep types focused and single-purpose
- Validate all external data with Zod
- Use strict TypeScript settings

### Security Requirements
- **CRITICAL**: All URL validations must prevent SSRF attacks
- Validate URLs before AND after redirects
- Never trust Content-Type headers alone - verify magic bytes
- Sanitize all user input before using in prompts
- Implement rate limiting awareness in retry logic

### Testing Strategy
- Mock all network calls in unit tests
- Use real test images for validation tests
- Test SSRF protection with private IP URLs
- Test decompression bomb protection with crafted images
- Test prompt injection with malicious inputs

### Known Edge Cases
1. **Redirect loops**: Axios handles this, but validate redirect count
2. **DNS rebinding**: Validate URL after each redirect
3. **Unicode in URLs**: Ensure proper encoding/decoding
4. **Case sensitivity**: Normalize formats to lowercase everywhere
5. **Timezone handling**: Always use UTC for timestamps
6. **Floating point aspect ratios**: Use tolerance for comparisons

### Future Improvements (Out of Scope for Phase 1)
- Image similarity detection to avoid near-duplicates
- Machine learning-based quality assessment
- Automatic aspect ratio cropping
- CDN integration for faster downloads
- Distributed caching for multi-instance deployments
- Image format conversion (e.g., PNG to JPEG for space savings)
