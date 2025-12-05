# Phase 2: Web Scraper Service Specification

## Overview
Build the core web scraping service that orchestrates image search, download, validation, and selection using Gemini AI.

## Deliverable

### Web Scraper Service (`cli/services/media/web-scraper.ts`)

#### Purpose
Coordinate all web scraping operations including query generation, image search, candidate download, validation, and AI-powered selection.

## Requirements

### Required Type Definitions

The following types must be defined (see Phase 1 for complete definitions):

```typescript
// From Phase 1: cli/types/web-scraper.ts
interface WebScrapeConfig {
  enabled: boolean;
  candidateCount: {
    min: number; // e.g., 5
    max: number; // e.g., 10
  };
  quality: ImageQualityConfig;
  download: {
    maxConcurrent: number; // e.g., 5
    timeoutMs: number; // e.g., 30000
    retryAttempts: number; // e.g., 3
    retryDelayMs: number; // e.g., 1000
    userAgent: string;
    cacheDir: string; // e.g., 'cache/scrape-temp'
  };
  selection: {
    weights: {
      sceneRelevance: number;
      technicalQuality: number;
      aestheticAppeal: number;
      aspectRatioMatch: number;
    };
  };
}

interface ImageSearchOptions {
  orientation?: '16:9' | '9:16';
  minWidth?: number;
  minHeight?: number;
}

interface ScrapedImage {
  id: string;
  url: string;
  sourceUrl: string;
  width: number;
  height: number;
  format: ImageFormat;
  sizeBytes: number;
  tags: string[];
  metadata?: {
    description?: string;
    aspectRatio?: number;
    qualityScore?: number;
    selectionScores?: {
      sceneRelevance: number;
      technicalQuality: number;
      aestheticAppeal: number;
      aspectRatioMatch: number;
    };
    selectionReasoning?: string;
    [key: string]: any;
  };
  downloadedPath: string;
}

interface ImageUrl {
  url: string;
  source?: string;
  description?: string;
}

interface SelectionCriteria {
  sceneRelevance: number;
  technicalQuality: number;
  aestheticAppeal: number;
  aspectRatioMatch: number;
}

interface ImageRequirements {
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
  allowedFormats: string[];
  minSizeBytes: number;
  maxSizeBytes: number;
  desiredAspectRatio?: number;
  aspectRatioTolerance?: number;
}

type ImageFormat = 'jpg' | 'png' | 'webp';

// Gemini AI structured output types
interface SearchQueryType {
  queries: Array<{
    query: string;
    priority: number;
    expectedResults: number;
  }>;
}

interface SearchResultType {
  urls: ImageUrl[];
}

interface ImageSelectionType {
  selectedIndex: number;
  reasoning: string;
  scores: {
    sceneRelevance: number;
    technicalQuality: number;
    aestheticAppeal: number;
    aspectRatioMatch: number;
  };
}

// Validation response types (from ImageQualityValidator)
interface ValidationResult {
  valid: boolean;
  errors: string[];
  metadata?: {
    width: number;
    height: number;
    format: string;
    aspectRatio?: number;
    [key: string]: any;
  };
  qualityScore?: number;
}

interface PreValidationResult {
  valid: boolean;
  errors: string[];
}
```

**Note**: These types should already exist from Phase 1. This section is for reference only.

### Required Utility Functions

The following utility must be available:

```typescript
// From cli/lib/timeout-wrapper.ts or similar
async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries: number;
    retryDelayMs: number;
    backoffMultiplier?: number;
    exponentialBackoff?: boolean;
  },
  operationName: string
): Promise<T>;
```

### Required Prompts

The following prompt generators must be implemented (see Phase 1 prompts):

- `generateSearchQueriesPrompt(params)` - Returns prompt for query generation
- `searchWebForImagesPrompt(params)` - Returns prompt for web search
- `selectBestImagePrompt(params)` - Returns prompt for image selection

### Required Schemas

The following Zod schemas must be defined for structured outputs:

- `SearchQuerySchema` - Validates SearchQueryType
- `SearchResultSchema` - Validates SearchResultType
- `ImageSelectionSchema` - Validates ImageSelectionType

### Class Structure

```typescript
export class WebScraperService {
  private aiProvider: AIProvider;
  private downloader: MediaDownloader;
  private validator: ImageQualityValidator;
  private config: WebScrapeConfig;
  private logger: Logger;
  private downloadedUrls: Set<string>; // Track URLs to prevent duplicates

  constructor(
    aiProvider: AIProvider,
    config: WebScrapeConfig,
    logger: Logger,
    downloader?: MediaDownloader,
    validator?: ImageQualityValidator
  );

  // Public API
  async searchImagesForScene(
    sceneDescription: string,
    tags: string[],
    options: ImageSearchOptions
  ): Promise<ScrapedImage[]>;

  async selectBestImage(
    candidates: ScrapedImage[],
    sceneDescription: string,
    criteria?: SelectionCriteria
  ): Promise<ScrapedImage>;

  async cleanupCandidates(
    candidates: ScrapedImage[],
    selectedImage: ScrapedImage
  ): Promise<void>;

  // Private orchestration methods
  private async generateSearchQueries(
    sceneDescription: string,
    tags: string[]
  ): Promise<SearchQueryType>;

  private async searchForImageUrls(query: string): Promise<ImageUrl[]>;

  private async downloadAndValidateCandidates(
    urls: ImageUrl[],
    requirements: ImageRequirements
  ): Promise<ScrapedImage[]>;

  private async downloadSingleImage(
    imageUrl: ImageUrl,
    requirements: ImageRequirements
  ): Promise<ScrapedImage | null>;

  private buildImageRequirements(options: ImageSearchOptions): ImageRequirements;

  private buildSelectionCriteria(options?: Partial<SelectionCriteria>): SelectionCriteria;

  private getExtensionFromUrl(url: string): string | null;

  private normalizeUrl(url: string): string;

  private isUrlSafe(url: string): boolean;
}
```

### Constructor

```typescript
/**
 * Create a new WebScraperService
 *
 * @param aiProvider - AI provider for Gemini operations
 * @param config - Web scraping configuration
 * @param logger - Logger instance for operation tracking
 * @param downloader - Optional media downloader (defaults to new instance)
 * @param validator - Optional image validator (defaults to new instance)
 * @throws Error if config validation fails
 */
constructor(
  aiProvider: AIProvider,
  config: WebScrapeConfig,
  logger: Logger,
  downloader?: MediaDownloader,
  validator?: ImageQualityValidator
) {
  // Validate configuration
  if (config.candidateCount.min < 1) {
    throw new Error('config.candidateCount.min must be at least 1');
  }
  if (config.candidateCount.max < config.candidateCount.min) {
    throw new Error('config.candidateCount.max must be >= min');
  }
  if (config.download.maxConcurrent < 1) {
    throw new Error('config.download.maxConcurrent must be at least 1');
  }
  if (!config.download.cacheDir) {
    throw new Error('config.download.cacheDir must be specified');
  }

  this.aiProvider = aiProvider;
  this.config = config;
  this.logger = logger;
  this.downloadedUrls = new Set();

  // Use provided or create new instances
  this.downloader = downloader || new MediaDownloader();
  this.validator = validator || new ImageQualityValidator(config.quality);
}
```

### Public Methods

#### searchImagesForScene

```typescript
/**
 * Search for images for a scene using web scraping
 *
 * Workflow:
 * 1. Generate optimized search queries from scene description
 * 2. Search web for image URLs using Gemini
 * 3. Pre-validate URLs
 * 4. Download candidate images
 * 5. Validate downloaded images
 * 6. Return valid candidates
 *
 * @param sceneDescription - Full scene text
 * @param tags - Visual tags extracted from scene
 * @param options - Image search options (orientation, dimensions)
 * @returns Array of 5-10 validated candidate images
 * @throws WebScraperError if insufficient valid images found
 */
async searchImagesForScene(
  sceneDescription: string,
  tags: string[],
  options: ImageSearchOptions
): Promise<ScrapedImage[]> {
  this.logger.info('[SCRAPER] Starting image search for scene');
  this.logger.debug(`[SCRAPER] Scene: "${sceneDescription.substring(0, 100)}..."`);
  this.logger.debug(`[SCRAPER] Tags: ${tags.join(', ')}`);

  try {
    // Step 1: Generate search queries
    this.logger.info('[SCRAPER] → Generating search queries with Gemini...');
    const queryResult = await this.generateSearchQueries(sceneDescription, tags);

    this.logger.info(
      `[SCRAPER] → Generated ${queryResult.queries.length} queries: ` +
      queryResult.queries.map(q => `"${q.query}"`).join(', ')
    );

    // Step 2: Search for image URLs (try queries in priority order)
    const allUrls: ImageUrl[] = [];
    const seenUrls = new Set<string>();

    for (const queryInfo of queryResult.queries.sort((a, b) => b.priority - a.priority)) {
      this.logger.info(`[SCRAPER] → Searching web for: "${queryInfo.query}"`);

      try {
        const urls = await this.searchForImageUrls(queryInfo.query);

        // Deduplicate URLs
        const uniqueUrls = urls.filter(urlObj => {
          const normalized = this.normalizeUrl(urlObj.url);
          if (seenUrls.has(normalized)) {
            return false;
          }
          seenUrls.add(normalized);
          return true;
        });

        this.logger.info(
          `[SCRAPER] → Found ${urls.length} URLs (${uniqueUrls.length} unique) for query "${queryInfo.query}"`
        );
        allUrls.push(...uniqueUrls);

        // Stop if we have enough URLs (2x target for filtering margin)
        if (allUrls.length >= this.config.candidateCount.max * 2) {
          this.logger.info(`[SCRAPER] → Collected ${allUrls.length} URLs, stopping search`);
          break;
        }
      } catch (error: any) {
        this.logger.warn(`[SCRAPER] ⚠ Search failed for query "${queryInfo.query}": ${error.message}`);
        // Continue with next query
      }
    }

    if (allUrls.length === 0) {
      throw new WebScraperError('No image URLs found for any query', 'searchForImageUrls');
    }

    this.logger.info(`[SCRAPER] → Total URLs collected: ${allUrls.length}`);

    // Step 3: Download and validate candidates
    this.logger.info('[SCRAPER] → Downloading and validating candidates...');
    const requirements = this.buildImageRequirements(options);
    const validCandidates = await this.downloadAndValidateCandidates(allUrls, requirements);

    this.logger.info(`[SCRAPER] ✓ Found ${validCandidates.length} valid candidates`);

    // Check if we have enough candidates
    if (validCandidates.length < this.config.candidateCount.min) {
      throw new WebScraperError(
        `Insufficient valid images: found ${validCandidates.length}, need ${this.config.candidateCount.min}`,
        'downloadAndValidateCandidates'
      );
    }

    // Return top N candidates
    const topCandidates = validCandidates.slice(0, this.config.candidateCount.max);
    this.logger.info(`[SCRAPER] → Returning top ${topCandidates.length} candidates`);

    return topCandidates;

  } catch (error: any) {
    if (error instanceof WebScraperError) {
      throw error;
    }
    throw new WebScraperError(
      `Image search failed: ${error.message}`,
      'searchImagesForScene',
      error
    );
  }
}
```

**Error Handling**:
- No queries generated: Throw WebScraperError
- No URLs found: Throw WebScraperError
- Insufficient valid images: Throw WebScraperError
- Network errors: Log warning, continue with next query
- Validation errors: Log warning, skip image

**Performance Considerations**:
- Stop searching when enough URLs collected (2x max candidates)
- Download candidates in parallel (respect maxConcurrent config)
- Skip remaining downloads if enough valid images found

#### selectBestImage

```typescript
/**
 * Select the best image from candidates using Gemini AI
 *
 * Workflow:
 * 1. Prepare candidate data with metadata
 * 2. Generate selection prompt
 * 3. Call Gemini with structured output
 * 4. Validate selection response
 * 5. Return selected image
 *
 * @param candidates - Array of validated candidate images
 * @param sceneDescription - Scene description for context
 * @param criteria - Optional selection criteria (uses config defaults if not provided)
 * @returns The best candidate image
 * @throws WebScraperError if selection fails
 */
async selectBestImage(
  candidates: ScrapedImage[],
  sceneDescription: string,
  criteria?: SelectionCriteria
): Promise<ScrapedImage> {
  this.logger.info(`[SCRAPER] Selecting best image from ${candidates.length} candidates`);

  if (candidates.length === 0) {
    throw new WebScraperError('No candidates provided for selection', 'selectBestImage');
  }

  if (candidates.length === 1) {
    this.logger.info('[SCRAPER] → Only one candidate, returning it');
    // Ensure metadata is initialized even for single candidate
    candidates[0].metadata = candidates[0].metadata || {};
    return candidates[0];
  }

  try {
    // Build selection criteria
    const selectionCriteria = this.buildSelectionCriteria(criteria);

    // Prepare candidate data for prompt
    const candidateData = candidates.map((img, index) => ({
      index,
      url: img.url,
      description: img.metadata?.description,
      metadata: {
        width: img.width,
        height: img.height,
        format: img.format,
        aspectRatio: img.metadata?.aspectRatio || (img.width / img.height),
      },
    }));

    // Generate prompt
    const prompt = selectBestImagePrompt({
      sceneDescription,
      candidates: candidateData,
      criteria: selectionCriteria,
    });

    // Call Gemini for selection
    this.logger.info('[SCRAPER] → Asking Gemini to select best image...');
    const selection = await this.aiProvider.structuredComplete<ImageSelectionType>(
      prompt,
      ImageSelectionSchema
    );

    // Validate selected index
    if (selection.selectedIndex < 0 || selection.selectedIndex >= candidates.length) {
      throw new Error(
        `Invalid selection index ${selection.selectedIndex} (valid range: 0-${candidates.length - 1})`
      );
    }

    const selectedImage = candidates[selection.selectedIndex];

    this.logger.info(
      `[SCRAPER] ✓ Selected image ${selection.selectedIndex}: ${selectedImage.url}`
    );
    this.logger.debug(`[SCRAPER] → Selection reasoning: ${selection.reasoning}`);
    this.logger.debug(
      `[SCRAPER] → Scores: ` +
      `relevance=${selection.scores.sceneRelevance.toFixed(2)}, ` +
      `quality=${selection.scores.technicalQuality.toFixed(2)}, ` +
      `aesthetic=${selection.scores.aestheticAppeal.toFixed(2)}, ` +
      `aspect=${selection.scores.aspectRatioMatch.toFixed(2)}`
    );

    // Store selection metadata
    selectedImage.metadata = {
      ...selectedImage.metadata,
      selectionScores: selection.scores,
      selectionReasoning: selection.reasoning,
    };

    return selectedImage;

  } catch (error: any) {
    // Fallback: return first candidate (highest quality score from validation sorting)
    this.logger.warn(`[SCRAPER] ⚠ Selection failed: ${error.message}, using fallback`);
    this.logger.info('[SCRAPER] → Returning first candidate as fallback (highest quality score)');

    // Ensure metadata exists for fallback candidate
    candidates[0].metadata = candidates[0].metadata || {};
    candidates[0].metadata.selectionReasoning = 'Fallback: AI selection failed, using highest quality score';

    return candidates[0];
  }
}
```

**Error Handling**:
- No candidates: Throw WebScraperError
- Single candidate: Return immediately
- AI selection fails: Log warning, return first candidate (fallback)
- Invalid index: Log error, return first candidate (fallback)

**Fallback Strategy**:
The first candidate is the fallback because candidates are already sorted by quality score during validation.

### Private Methods

#### generateSearchQueries

```typescript
/**
 * Generate optimized search queries using Gemini
 *
 * @param sceneDescription - Scene description
 * @param tags - Visual tags
 * @returns Array of search queries with priorities
 */
private async generateSearchQueries(
  sceneDescription: string,
  tags: string[]
): Promise<SearchQueryType> {
  const queryCount = 3; // Generate 3 queries: specific, medium, general

  const prompt = generateSearchQueriesPrompt({
    sceneDescription,
    tags,
    queryCount,
  });

  try {
    const result = await this.aiProvider.structuredComplete<SearchQueryType>(
      prompt,
      SearchQuerySchema
    );

    // Validate result has queries
    if (!result.queries || result.queries.length === 0) {
      throw new Error('No queries returned by AI');
    }

    return result;

  } catch (error: any) {
    // Fallback: create simple queries from tags or scene description
    this.logger.warn(
      `[SCRAPER] ⚠ Query generation failed: ${error.message}, using fallback`
    );

    // Strategy: Use tags if available, otherwise extract keywords from scene
    let fallbackQueries;

    if (tags.length > 0) {
      // Use up to 3 tags to create queries
      fallbackQueries = tags.slice(0, 3).map((tag, index) => ({
        query: `${tag} professional stock photo`,
        priority: 3 - index,
        expectedResults: 10,
      }));
    } else if (sceneDescription.trim().length > 0) {
      // Extract first 3-5 words from scene as emergency fallback
      const words = sceneDescription.trim().split(/\s+/).slice(0, 5).join(' ');
      fallbackQueries = [
        { query: `${words} stock photo`, priority: 1, expectedResults: 10 }
      ];
    } else {
      // Ultimate fallback if both tags and description are empty
      fallbackQueries = [
        { query: 'professional stock photo', priority: 1, expectedResults: 5 }
      ];
    }

    return { queries: fallbackQueries };
  }
}
```

#### searchForImageUrls

```typescript
/**
 * Search web for image URLs using Gemini web search
 *
 * @param query - Search query
 * @returns Array of image URLs with metadata
 */
private async searchForImageUrls(query: string): Promise<ImageUrl[]> {
  const minUrls = this.config.candidateCount.min;
  const maxUrls = this.config.candidateCount.max * 2; // Get 2x for filtering

  const prompt = searchWebForImagesPrompt({
    query,
    minUrls,
    maxUrls,
    requirements: {
      minWidth: this.config.quality.minWidth,
      minHeight: this.config.quality.minHeight,
      formats: this.config.quality.allowedFormats,
    },
  });

  try {
    const result = await this.aiProvider.structuredComplete<SearchResultType>(
      prompt,
      SearchResultSchema
    );

    if (!result.urls || result.urls.length === 0) {
      throw new Error('No URLs returned from web search');
    }

    this.logger.debug(`[SCRAPER] → Got ${result.urls.length} URLs from Gemini web search`);

    return result.urls;

  } catch (error: any) {
    throw new WebScraperError(
      `Web search failed for query "${query}": ${error.message}`,
      'searchForImageUrls',
      error
    );
  }
}
```

#### downloadAndValidateCandidates

```typescript
/**
 * Download and validate multiple candidate images in parallel
 *
 * @param urls - Array of image URLs to try
 * @param requirements - Image quality requirements
 * @returns Array of valid scraped images sorted by quality score
 */
private async downloadAndValidateCandidates(
  urls: ImageUrl[],
  requirements: ImageRequirements
): Promise<ScrapedImage[]> {
  const maxConcurrent = this.config.download.maxConcurrent;
  const validImages: ScrapedImage[] = [];
  const targetCount = this.config.candidateCount.max;

  this.logger.info(
    `[SCRAPER] → Downloading up to ${targetCount} valid images from ${urls.length} URLs`
  );

  // Process URLs in batches
  for (let i = 0; i < urls.length; i += maxConcurrent) {
    // Stop if we have enough valid images
    if (validImages.length >= targetCount) {
      this.logger.info(
        `[SCRAPER] → Reached target of ${targetCount} valid images, stopping downloads`
      );
      break;
    }

    const batch = urls.slice(i, i + maxConcurrent);
    this.logger.debug(
      `[SCRAPER] → Processing batch ${Math.floor(i / maxConcurrent) + 1} ` +
      `(${batch.length} URLs)`
    );

    // Download batch in parallel
    const results = await Promise.allSettled(
      batch.map(url => this.downloadSingleImage(url, requirements))
    );

    // Collect successful downloads
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value !== null) {
        validImages.push(result.value);
      }
    }

    this.logger.debug(
      `[SCRAPER] → Valid images so far: ${validImages.length}/${targetCount}`
    );
  }

  // Sort by quality score (highest first)
  // Note: qualityScore is guaranteed to exist from validation in downloadSingleImage
  validImages.sort((a, b) => {
    const scoreA = a.metadata?.qualityScore ?? 0;
    const scoreB = b.metadata?.qualityScore ?? 0;
    return scoreB - scoreA;
  });

  this.logger.info(
    `[SCRAPER] → Sorted ${validImages.length} images by quality ` +
    `(range: ${validImages[validImages.length - 1]?.metadata?.qualityScore?.toFixed(2)} - ` +
    `${validImages[0]?.metadata?.qualityScore?.toFixed(2)})`
  );

  return validImages;
}
```

**Performance Notes**:
- Process URLs in batches to control concurrency
- Early termination when target count reached
- Parallel downloads within each batch
- Continue on individual failures

#### downloadSingleImage

```typescript
/**
 * Download and validate a single image
 *
 * @param imageUrl - Image URL with metadata
 * @param requirements - Image requirements
 * @returns ScrapedImage if valid, null if invalid
 */
private async downloadSingleImage(
  imageUrl: ImageUrl,
  requirements: ImageRequirements
): Promise<ScrapedImage | null> {
  const url = imageUrl.url;
  let tempPath: string | null = null;

  try {
    // Step 1: Security - Validate URL is safe
    if (!this.isUrlSafe(url)) {
      this.logger.debug(`[SCRAPER] → URL failed safety check: ${url}`);
      return null;
    }

    // Step 2: Pre-validate URL format and extension
    const preValidation = await this.validator.preValidateImage(url);
    if (!preValidation.valid) {
      this.logger.debug(
        `[SCRAPER] → Pre-validation failed for ${url}: ${preValidation.errors.join(', ')}`
      );
      return null;
    }

    // Step 3: Download image with retry logic
    const response = await withRetry(
      async () => {
        const resp = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: this.config.download.timeoutMs,
          maxContentLength: this.config.quality.maxSizeBytes,
          maxBodyLength: this.config.quality.maxSizeBytes,
          maxRedirects: 3, // Prevent infinite redirects
          headers: {
            'User-Agent': this.config.download.userAgent,
          },
          validateStatus: (status) => status === 200, // Only accept 200 OK
        });

        // Validate Content-Type is an image
        const contentType = resp.headers['content-type'];
        if (!contentType || !contentType.startsWith('image/')) {
          throw new Error(`Invalid content-type: ${contentType}`);
        }

        return resp;
      },
      {
        maxRetries: this.config.download.retryAttempts,
        retryDelayMs: this.config.download.retryDelayMs,
        backoffMultiplier: 2,
        exponentialBackoff: true,
      },
      `Download image: ${url}`
    );

    // Step 4: Validate response size
    const dataSize = response.data.byteLength || response.data.length;
    if (dataSize < requirements.minSizeBytes) {
      this.logger.debug(`[SCRAPER] → Image too small: ${dataSize} bytes < ${requirements.minSizeBytes}`);
      return null;
    }
    if (dataSize > requirements.maxSizeBytes) {
      this.logger.debug(`[SCRAPER] → Image too large: ${dataSize} bytes > ${requirements.maxSizeBytes}`);
      return null;
    }

    // Step 5: Save to temporary file with collision-resistant naming
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const urlHash = crypto.createHash('sha256').update(url).digest('hex').substring(0, 16);
    const extension = this.getExtensionFromUrl(url) || '.jpg';
    tempPath = path.join(
      this.config.download.cacheDir,
      `${urlHash}_${timestamp}_${random}${extension}`
    );

    await fs.ensureDir(path.dirname(tempPath));
    await fs.writeFile(tempPath, Buffer.from(response.data));

    // Step 6: Validate downloaded image file
    const validation = await this.validator.validateImage(tempPath, requirements);

    if (!validation.valid) {
      this.logger.debug(
        `[SCRAPER] → Validation failed for ${url}: ${validation.errors.join(', ')}`
      );
      await fs.remove(tempPath); // Clean up
      return null;
    }

    // Step 7: Verify metadata exists
    if (!validation.metadata || !validation.metadata.width || !validation.metadata.height) {
      this.logger.debug(`[SCRAPER] → Missing metadata for ${url}`);
      await fs.remove(tempPath);
      return null;
    }

    // Step 8: Verify format is valid
    const format = validation.metadata.format;
    if (!format || !requirements.allowedFormats.includes(format)) {
      this.logger.debug(`[SCRAPER] → Invalid format '${format}' for ${url}`);
      await fs.remove(tempPath);
      return null;
    }

    // Step 9: Get file stats
    const stats = await fs.stat(tempPath);

    // Step 10: Create ScrapedImage object
    const scrapedImage: ScrapedImage = {
      id: urlHash,
      url,
      sourceUrl: imageUrl.source || new URL(url).hostname,
      width: validation.metadata.width,
      height: validation.metadata.height,
      format: format as ImageFormat,
      sizeBytes: stats.size,
      tags: [],
      metadata: {
        ...validation.metadata,
        qualityScore: validation.qualityScore ?? 0,
        description: imageUrl.description,
      },
      downloadedPath: tempPath,
    };

    this.logger.debug(
      `[SCRAPER] ✓ Valid image: ${url} ` +
      `(${scrapedImage.width}x${scrapedImage.height}, ` +
      `${(scrapedImage.sizeBytes / 1024).toFixed(1)}KB, ` +
      `score: ${scrapedImage.metadata.qualityScore.toFixed(2)})`
    );

    return scrapedImage;

  } catch (error: any) {
    // Clean up temp file on any error
    if (tempPath) {
      try {
        await fs.remove(tempPath);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }

    this.logger.debug(`[SCRAPER] → Download/validation error for ${url}: ${error.message}`);
    return null;
  }
}
```

**Error Handling**:
- All errors return null (skip image)
- Temporary files cleaned up on validation failure and all errors
- Network timeouts handled gracefully with retry logic
- Corrupted images handled by validator
- HTTP errors validated (only 200 OK accepted)
- Content-Type validated before processing
- File size validated before and after download

**Security Measures**:
- URL safety check prevents SSRF attacks
- Content-Type validation prevents non-image downloads
- File size limits prevent memory exhaustion
- Max redirects prevents infinite redirect loops
- Collision-resistant file naming prevents path traversal
- Config-based cache directory prevents hardcoded paths

#### buildImageRequirements

```typescript
/**
 * Build image requirements from search options and config
 *
 * @param options - Image search options
 * @returns Complete image requirements
 */
private buildImageRequirements(options: ImageSearchOptions): ImageRequirements {
  const config = this.config.quality;

  // Determine target aspect ratio from orientation
  let desiredAspectRatio: number | undefined;
  let aspectRatioTolerance: number | undefined;

  if (options.orientation === '16:9') {
    desiredAspectRatio = 16 / 9; // 1.777778
    aspectRatioTolerance = config.aspectRatio.tolerance;
  } else if (options.orientation === '9:16') {
    desiredAspectRatio = 9 / 16; // 0.5625
    aspectRatioTolerance = config.aspectRatio.tolerance;
  }

  return {
    minWidth: options.minWidth || config.minWidth,
    minHeight: options.minHeight || config.minHeight,
    maxWidth: config.maxWidth,
    maxHeight: config.maxHeight,
    allowedFormats: config.allowedFormats,
    minSizeBytes: config.minSizeBytes,
    maxSizeBytes: config.maxSizeBytes,
    desiredAspectRatio,
    aspectRatioTolerance,
  };
}
```

#### buildSelectionCriteria

```typescript
/**
 * Build selection criteria from options or config defaults
 *
 * @param options - Optional partial criteria
 * @returns Complete selection criteria with weights
 */
private buildSelectionCriteria(options?: Partial<SelectionCriteria>): SelectionCriteria {
  const defaults = this.config.selection.weights;

  return {
    sceneRelevance: options?.sceneRelevance ?? defaults.sceneRelevance,
    technicalQuality: options?.technicalQuality ?? defaults.technicalQuality,
    aestheticAppeal: options?.aestheticAppeal ?? defaults.aestheticAppeal,
    aspectRatioMatch: options?.aspectRatioMatch ?? defaults.aspectRatioMatch,
  };
}
```

#### getExtensionFromUrl

```typescript
/**
 * Extract file extension from URL
 *
 * @param url - Image URL
 * @returns File extension with dot (e.g., '.jpg') or null
 */
private getExtensionFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const match = pathname.match(/\.([a-z0-9]+)$/i);

    if (match) {
      const ext = match[1].toLowerCase();
      // Map common variations
      if (ext === 'jpeg') return '.jpg';
      if (['jpg', 'png', 'webp'].includes(ext)) return `.${ext}`;
    }

    return null;
  } catch {
    return null;
  }
}
```

#### normalizeUrl

```typescript
/**
 * Normalize URL for deduplication
 * Removes query parameters and fragments, lowercases domain
 *
 * @param url - Image URL
 * @returns Normalized URL string
 */
private normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Normalize: lowercase host, remove query params and hash
    return `${urlObj.protocol}//${urlObj.host.toLowerCase()}${urlObj.pathname}`;
  } catch {
    // If URL parsing fails, return original (will likely fail other validations)
    return url;
  }
}
```

#### isUrlSafe

```typescript
/**
 * Validate URL is safe to download (prevents SSRF attacks)
 *
 * Security checks:
 * - Protocol must be http or https
 * - Hostname must not be localhost or private IP
 * - Must not use IP address in private ranges
 *
 * @param url - Image URL to validate
 * @returns true if URL is safe to download
 */
private isUrlSafe(url: string): boolean {
  try {
    const urlObj = new URL(url);

    // Only allow http/https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      this.logger.debug(`[SCRAPER] → Rejected protocol: ${urlObj.protocol}`);
      return false;
    }

    const hostname = urlObj.hostname.toLowerCase();

    // Block localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      this.logger.debug(`[SCRAPER] → Rejected localhost: ${hostname}`);
      return false;
    }

    // Block private IP ranges (IPv4)
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const parts = ipv4Match.slice(1).map(Number);

      // 10.0.0.0/8
      if (parts[0] === 10) return false;

      // 172.16.0.0/12
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return false;

      // 192.168.0.0/16
      if (parts[0] === 192 && parts[1] === 168) return false;

      // 169.254.0.0/16 (link-local)
      if (parts[0] === 169 && parts[1] === 254) return false;

      // 127.0.0.0/8 (loopback)
      if (parts[0] === 127) return false;
    }

    // Block link-local IPv6
    if (hostname.startsWith('fe80:') || hostname.startsWith('fc00:') || hostname.startsWith('fd00:')) {
      this.logger.debug(`[SCRAPER] → Rejected IPv6 private range: ${hostname}`);
      return false;
    }

    return true;

  } catch {
    // Invalid URL
    return false;
  }
}
```

### Public Methods (continued)

#### cleanupCandidates

```typescript
/**
 * Clean up temporary files for images that were not selected
 *
 * @param candidates - All candidate images from search
 * @param selectedImage - The selected image to keep
 * @throws Never throws - logs errors but continues cleanup
 */
async cleanupCandidates(
  candidates: ScrapedImage[],
  selectedImage: ScrapedImage
): Promise<void> {
  this.logger.info('[SCRAPER] Cleaning up non-selected candidate files');

  const filesToDelete = candidates
    .filter(img => img.id !== selectedImage.id)
    .map(img => img.downloadedPath);

  if (filesToDelete.length === 0) {
    this.logger.debug('[SCRAPER] → No files to clean up');
    return;
  }

  this.logger.debug(`[SCRAPER] → Removing ${filesToDelete.length} temporary files`);

  const results = await Promise.allSettled(
    filesToDelete.map(async (filePath) => {
      try {
        await fs.remove(filePath);
        this.logger.debug(`[SCRAPER] → Removed: ${filePath}`);
      } catch (error: any) {
        this.logger.warn(`[SCRAPER] ⚠ Failed to remove ${filePath}: ${error.message}`);
      }
    })
  );

  const successCount = results.filter(r => r.status === 'fulfilled').length;
  this.logger.info(`[SCRAPER] ✓ Cleaned up ${successCount}/${filesToDelete.length} files`);
}
```

**Error Handling**:
- Never throws errors (cleanup should not break workflow)
- Logs warnings for individual file removal failures
- Continues cleanup even if some files fail
- Always returns successfully

---

## Configuration Integration

### Load Configuration

```typescript
// In gather.ts or service initialization
import { ConfigManager } from '../lib/config';

const stockConfig = await ConfigManager.loadStockAssetsConfig();
const webScrapeConfig = stockConfig.webScrape;

if (!webScrapeConfig.enabled) {
  throw new Error('Web scraping is disabled in configuration');
}

const webScraper = new WebScraperService(
  aiProvider,
  webScrapeConfig
);
```

---

## Error Handling Strategy

### Error Types and Responses

**WebScraperError**
- Operation: Identifies which operation failed
- Cause: Original error for debugging
- Recovery: Depends on operation:
  - Query generation: Use fallback queries
  - Search: Try next query
  - Download: Skip image, continue with others
  - Selection: Use first candidate as fallback

**Network Errors**
- Timeout: Log and skip image
- DNS failure: Log and skip image
- Connection refused: Log and skip image

**Validation Errors**
- Invalid dimensions: Skip image
- Invalid format: Skip image
- Invalid aspect ratio: Skip image

**AI Errors**
- No queries generated: Use tag-based fallback
- No URLs found: Try next query or fail
- Selection fails: Use first candidate

### Custom Error Class

**WebScraperError**

Must be defined to wrap scraping-specific errors:

```typescript
export class WebScraperError extends Error {
  constructor(
    message: string,
    public operation: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'WebScraperError';

    // Maintain stack trace
    if (cause && cause.stack) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }
}
```

**Usage**: Throw `WebScraperError` for all public method failures that should propagate to callers.

---

## Testing Requirements

### Unit Tests

**web-scraper.test.ts**
```typescript
describe('WebScraperService', () => {
  describe('searchImagesForScene', () => {
    it('returns valid candidates for scene');
    it('throws if no URLs found');
    it('throws if insufficient valid images');
    it('stops searching when enough URLs collected');
    it('handles query generation failure with fallback');
    it('handles search failure for one query');
    it('downloads candidates in parallel');
  });

  describe('selectBestImage', () => {
    it('selects best image using Gemini');
    it('returns only candidate immediately');
    it('throws if no candidates provided');
    it('uses fallback if selection fails');
    it('validates selected index');
    it('stores selection metadata');
  });

  describe('generateSearchQueries', () => {
    it('generates queries using Gemini');
    it('returns 3 queries with priorities');
    it('uses fallback if AI fails');
    it('validates query result schema');
  });

  describe('searchForImageUrls', () => {
    it('searches web using Gemini');
    it('returns image URLs with metadata');
    it('throws if no URLs found');
    it('validates search result schema');
  });

  describe('downloadAndValidateCandidates', () => {
    it('downloads images in batches');
    it('validates each image');
    it('stops when target count reached');
    it('sorts by quality score');
    it('handles download failures gracefully');
  });

  describe('downloadSingleImage', () => {
    it('pre-validates before download');
    it('validates URL safety before download');
    it('downloads image file with retry logic');
    it('validates Content-Type header');
    it('validates response size before saving');
    it('validates downloaded image');
    it('returns null for invalid image');
    it('cleans up temp file on failure');
    it('cleans up temp file on validation error');
    it('extracts metadata correctly');
    it('uses collision-resistant file naming');
    it('respects maxContentLength limit');
    it('blocks non-200 status codes');
    it('limits redirect count');
  });

  describe('isUrlSafe', () => {
    it('allows https URLs to public domains');
    it('allows http URLs to public domains');
    it('blocks localhost');
    it('blocks 127.0.0.1');
    it('blocks ::1');
    it('blocks 10.x.x.x (private range)');
    it('blocks 172.16-31.x.x (private range)');
    it('blocks 192.168.x.x (private range)');
    it('blocks 169.254.x.x (link-local)');
    it('blocks fe80:: (IPv6 link-local)');
    it('blocks fc00::/fd00:: (IPv6 ULA)');
    it('blocks ftp:// protocol');
    it('blocks file:// protocol');
    it('handles invalid URLs gracefully');
  });

  describe('normalizeUrl', () => {
    it('lowercases domain');
    it('removes query parameters');
    it('removes hash fragments');
    it('preserves path');
    it('preserves protocol');
    it('handles invalid URLs');
  });

  describe('getExtensionFromUrl', () => {
    it('extracts .jpg extension');
    it('extracts .png extension');
    it('extracts .webp extension');
    it('normalizes .jpeg to .jpg');
    it('returns null for no extension');
    it('returns null for invalid URLs');
  });

  describe('constructor', () => {
    it('validates config.candidateCount.min >= 1');
    it('validates config.candidateCount.max >= min');
    it('validates config.download.maxConcurrent >= 1');
    it('validates config.download.cacheDir is specified');
    it('initializes downloadedUrls Set');
    it('uses provided downloader');
    it('creates default downloader if not provided');
    it('uses provided validator');
    it('creates default validator if not provided');
  });
});
```

### Integration Tests

**web-scraper-integration.test.ts**
```typescript
describe('WebScraperService Integration', () => {
  it('completes full workflow: search, download, validate, select');
  it('handles real Gemini API calls');
  it('downloads real images from URLs');
  it('validates real image files');
  it('selects appropriate image for scene');
  it('handles various error scenarios');
});
```

### Mock Requirements

**Mock AIProvider**
- Return predefined queries
- Return predefined URLs
- Return predefined selection

**Mock Validator**
- Return success for valid URLs
- Return failure for invalid URLs
- Return consistent quality scores

**Mock Downloader**
- Use test fixture images
- Simulate network delays
- Simulate failures

---

## Performance Requirements

### Timing Targets
- Query generation: < 5 seconds
- URL search per query: < 10 seconds
- Candidate download (10 images): < 30 seconds
- Image selection: < 5 seconds
- **Total per scene: < 60 seconds**

### Resource Limits
- Max concurrent downloads: 5 (configurable)
- Max temporary file size: Controlled by `config.quality.maxSizeBytes`
- Max memory per download: Controlled by axios `maxContentLength`
- Temp file cleanup strategy: See below

### Cache Cleanup Strategy

**During Operation:**
- Failed downloads: Cleaned up immediately in `downloadSingleImage` catch block
- Invalid images: Cleaned up immediately after validation fails
- Temp files use unique names to prevent collisions during concurrent operations

**After Operation:**
- Valid candidate images: Kept in cache until `selectBestImage` completes
- Non-selected images: MUST be cleaned up by the caller after selection
- Selected image: Moved/copied by caller, then cleaned up

**Recommended Cleanup API:**

Add public method for cleanup:

```typescript
/**
 * Clean up temporary files for images that were not selected
 *
 * @param candidates - All candidate images
 * @param selectedImage - The selected image to keep
 */
async cleanupCandidates(
  candidates: ScrapedImage[],
  selectedImage: ScrapedImage
): Promise<void> {
  const filesToDelete = candidates
    .filter(img => img.id !== selectedImage.id)
    .map(img => img.downloadedPath);

  await Promise.allSettled(
    filesToDelete.map(path => fs.remove(path))
  );

  this.logger.info(`[SCRAPER] Cleaned up ${filesToDelete.length} temporary files`);
}
```

**Usage Pattern:**
```typescript
const candidates = await webScraper.searchImagesForScene(...);
const selected = await webScraper.selectBestImage(candidates, ...);
await webScraper.cleanupCandidates(candidates, selected);
// Now move/use the selected image
```

### Optimization Strategies
- Early termination on sufficient candidates
- Parallel downloads with concurrency control
- Pre-validation to skip bad URLs early
- Quality-sorted results for better fallbacks

---

## Acceptance Criteria

### Functionality
- [ ] Generates 3 search queries from scene/tags with fallbacks
- [ ] Searches web and returns 10-20 URLs per query
- [ ] Deduplicates URLs across queries
- [ ] Downloads and validates candidate images with retry logic
- [ ] Returns 5-10 valid candidates per scene
- [ ] Selects best image using Gemini AI
- [ ] Provides cleanup method for non-selected candidates
- [ ] Handles all error cases gracefully
- [ ] Uses fallbacks when AI operations fail
- [ ] Validates URLs for security (prevents SSRF)

### Quality
- [ ] All images meet quality requirements
- [ ] Quality scores calculated correctly
- [ ] Selection reasoning is meaningful
- [ ] Error messages are clear and actionable

### Performance
- [ ] Completes within 60 seconds per scene
- [ ] Respects concurrency limits
- [ ] Stops downloading when target count reached
- [ ] Uses early termination to avoid unnecessary work
- [ ] Validates content size before downloading full file
- [ ] Cleans up temporary files on all error paths
- [ ] Logs progress at appropriate levels with timing info

### Testing
- [ ] All unit tests pass (>85% coverage)
- [ ] Integration tests pass
- [ ] Security tests pass (SSRF prevention, path traversal, etc.)
- [ ] Manual testing with real scenes complete
- [ ] Error scenarios tested and handled
- [ ] Retry logic tested with network failures
- [ ] Concurrent download limits tested
- [ ] Cache cleanup tested for all paths

---

## Dependencies

### Phase 1 Dependencies (Must Exist)
- `cli/types/web-scraper.ts` - All type definitions
- `cli/lib/image-quality-validator.ts` - ImageQualityValidator class
- `cli/prompts/web-scraper/` - All prompt generation functions
- `cli/schemas/web-scraper.ts` - Zod schemas for structured outputs
- `cli/lib/timeout-wrapper.ts` - `withRetry` utility function

### Existing Codebase Dependencies
- `AIProvider` from existing codebase (verify interface compatibility)
- `MediaDownloader` from existing codebase (verify constructor signature)
- `Logger` from existing codebase (verify interface)

### NPM Dependencies
- `axios` (^1.6.0) - HTTP requests with timeout and size limits
- `fs-extra` (^11.0.0) - File operations with promises
- `crypto` (built-in) - Hashing for file naming

### Required Imports

```typescript
import axios from 'axios';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs-extra';
import { AIProvider } from '../ai/provider';
import { Logger } from '../lib/logger';
import { MediaDownloader } from '../services/media-downloader';
import { ImageQualityValidator } from '../lib/image-quality-validator';
import { withRetry } from '../lib/timeout-wrapper';
import {
  WebScrapeConfig,
  ImageSearchOptions,
  ScrapedImage,
  ImageUrl,
  SelectionCriteria,
  ImageRequirements,
  ImageFormat,
  SearchQueryType,
  SearchResultType,
  ImageSelectionType,
} from '../types/web-scraper';
import {
  generateSearchQueriesPrompt,
  searchWebForImagesPrompt,
  selectBestImagePrompt,
} from '../prompts/web-scraper';
import {
  SearchQuerySchema,
  SearchResultSchema,
  ImageSelectionSchema,
} from '../schemas/web-scraper';
```

### Validation Checklist

Before implementing, verify:
- [ ] All Phase 1 files exist and export expected types
- [ ] `AIProvider.structuredComplete<T>()` method exists and accepts schema parameter
- [ ] `MediaDownloader` constructor signature is known
- [ ] `Logger` interface includes `.info()`, `.debug()`, `.warn()` methods
- [ ] `withRetry` utility supports exponential backoff
- [ ] All prompt functions return strings
- [ ] All schemas are Zod schemas compatible with structuredComplete

---

## Estimated Time
**6-8 hours**

---

## Implementation Notes

### Code Style and Patterns
- Follow existing service patterns (PexelsService, UnsplashService)
- Use consistent logging with `[SCRAPER]` prefix
- Include operation timing in logs for performance monitoring
- Provide meaningful progress logs for debugging
- Handle all errors gracefully with fallbacks
- Never throw from cleanup methods

### Security Considerations
- **SSRF Prevention**: `isUrlSafe()` method blocks internal network requests
- **Path Traversal**: Collision-resistant file naming prevents path attacks
- **Resource Exhaustion**: Size limits enforced before and during download
- **Content Validation**: Content-Type headers validated
- **Input Sanitization**: All URLs parsed and validated before use

### Known Limitations and Assumptions

1. **DNS Rebinding**: The spec does not prevent DNS rebinding attacks where a domain initially resolves to a public IP but later resolves to a private IP. Consider adding IP re-validation after DNS resolution if this is a concern.

2. **Rate Limiting**: No rate limiting is implemented for Gemini API calls. If multiple queries are processed in parallel, this could exceed API quotas. Consider adding rate limiting at the service level.

3. **Disk Space**: No check for available disk space before downloads. If disk is full, downloads will fail with file system errors. Consider adding a disk space check in constructor or before batch downloads.

4. **Concurrent AI Calls**: The spec allows unlimited concurrent `structuredComplete` calls during query generation and URL search phases. This could hit API rate limits. Consider adding concurrency control.

5. **URL Normalization Edge Cases**: The `normalizeUrl` method removes query parameters, but some image CDNs use query parameters for image transformations (e.g., `?w=800&h=600`). This could cause different image sizes to be treated as duplicates.

6. **IPv6 Private Range**: The SSRF check only covers common IPv6 private ranges. Consider using a comprehensive IP library for production.

7. **Partial Success**: If `searchImagesForScene` finds 3 valid images but config requires 5, it throws an error. Consider making this configurable with a "minimum acceptable" threshold separate from the target.

8. **Selected Image Cleanup**: The caller is responsible for cleaning up the selected image after using it. This should be documented in the usage examples.

9. **Temporary Directory Creation**: The spec assumes `config.download.cacheDir` exists or can be created. Add error handling if directory creation fails.

10. **File Extension Fallback**: Uses `.jpg` as fallback extension if none is detected. This could cause issues if the actual format is PNG or WebP. Consider validating extension against actual file format after download.

### Recommendations for Future Improvements

1. Add a `maxConcurrentAICalls` config parameter
2. Add disk space validation before downloads
3. Add rate limiting for API calls
4. Consider making URL normalization configurable
5. Add telemetry for success/failure rates
6. Add cache TTL and automatic cleanup of old files
7. Consider adding support for image transformation URL parameters
8. Add circuit breaker pattern for failing domains
9. Add metrics for download speeds and success rates
10. Consider adding image similarity detection to avoid near-duplicates

### Pre-Implementation Checklist

Before starting implementation, verify:
- [ ] Phase 1 is complete and all dependencies exist
- [ ] `AIProvider` interface documented and understood
- [ ] `MediaDownloader` constructor signature is known
- [ ] `Logger` interface is compatible
- [ ] `withRetry` utility exists and works as expected
- [ ] Config structure matches `WebScrapeConfig` interface
- [ ] Cache directory can be created with proper permissions
- [ ] Test fixtures are available for unit tests
- [ ] Mock strategy is clear for all dependencies
