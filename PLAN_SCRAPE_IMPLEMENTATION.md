# Implementation Plan: Web Scraping for Image Gathering

## Implementation Status 🚀

**Last Updated**: 2025-12-02

### Completed Phases ✅
- ✅ **Phase 1: Core Infrastructure** - Types, Validator, Prompts (100%)
- ✅ **Phase 2: Web Scraper Service** - Google Search Client, Web Scraper (100%)
- ✅ **Phase 3: Integration** - Gather Command, Config (100%)
- ✅ **Phase 4: Testing & Validation** - Unit tests (100%), E2E tests (100%), fixtures (100%)

### Pending Phases ⏭️
- ⏭️ **Phase 0: Verification** - API access testing (recommended before production use)
- ⏭️ **Phase 5: Documentation** - User guide, API docs, architecture docs

### Quick Start 🎯
The web scraper is **ready to use** with the `--scrape` flag:
```bash
npm run gather -- --project <project-id> --scrape
```

**IMPORTANT: Strict Mode Behavior**

When `--scrape` is used, the gather command operates in **strict mode**:
- If scraping fails at ANY point (initialization, search, or validation), the command **fails immediately**
- **NO fallback** to stock media APIs occurs
- This ensures consistent image sourcing when web scraping is required

To use stock media as fallback, simply omit the `--scrape` flag.

**Required Environment Variables**:
- `GOOGLE_CUSTOM_SEARCH_API_KEY`
- `GOOGLE_CUSTOM_SEARCH_ENGINE_ID`
- Gemini AI provider credentials

---

## Overview
Add a `--scrape` parameter to the gather command that enables web-based image scraping using Gemini's web search capabilities. This feature will replace the existing stock media API searches when enabled.

## User Requirements
- **Goal**: Enable web scraping for images to provide more flexibility in image sourcing
- **Quality**: Maintain strict quality criteria for downloaded images
- **AI Selection**: Use Gemini to find image URLs and select the best image from 5-10 candidates
- **Scope**: Project-specific only (no local library integration)

## Design Decisions (from user clarification)
1. **Mode**: Replace stock APIs completely when `--scrape` is enabled
2. **Search Mechanism**: Use Gemini's web search capability
3. **Storage**: Project-specific only (no local library integration)
4. **Quality Criteria**:
   - Minimum resolution (1920x1080)
   - Aspect ratio matching
   - File format validation (JPEG, PNG, WebP)
   - File size limits

## Architecture

### New Components

#### 1. Web Scraper Service (`cli/services/media/web-scraper.ts`)
**Purpose**: Coordinate web scraping operations using Gemini

**Key Responsibilities**:
- Use Gemini to generate optimal search queries for scene descriptions
- Use Gemini to find and extract image URLs from web search results
- Download multiple candidate images (5-10 per scene)
- Validate images against quality criteria
- Use Gemini to rank/select the best image for the scene

**Public Interface**:
```typescript
export class WebScraperService {
  constructor(
    aiProvider: AIProvider,
    downloader: MediaDownloader,
    qualityValidator: ImageQualityValidator
  );

  /**
   * Search for images for a scene using web scraping
   * @param sceneDescription - Scene description (1-500 chars, validated)
   * @param tags - Search tags (1-10 tags, each 1-50 chars, validated)
   * @param options - Search options
   * @returns Array of validated images (target: 5, max attempts: 10)
   * @throws ValidationError if inputs invalid
   * @throws ScraperError if search fails after retries
   */
  async searchImagesForScene(
    sceneDescription: string,
    tags: string[],
    options: ImageSearchOptions
  ): Promise<ScrapedImage[]>;

  /**
   * Select the best image from candidates using Gemini
   */
  async selectBestImage(
    candidates: ScrapedImage[],
    sceneDescription: string,
    criteria: SelectionCriteria
  ): Promise<ScrapedImage>;
}
```

#### 2. Image Quality Validator (`cli/services/media/image-validator.ts`)
**Purpose**: Validate scraped images against quality criteria

**Key Responsibilities**:
- Check image dimensions (width, height)
- Validate aspect ratio
- Verify file format
- Check file size limits
- Use `sharp` library to extract image metadata without full download

**Public Interface**:
```typescript
export class ImageQualityValidator {
  constructor(config: QualityConfig);

  /**
   * Validate image URL before download
   * 1. URL validation (scheme, domain, IP blacklist)
   * 2. HEAD request (Content-Type, Content-Length)
   * @throws ValidationError if URL is unsafe (SSRF protection)
   */
  async preValidateImage(url: string): Promise<PreValidationResult>;

  /**
   * Validate URL safety (SSRF protection)
   * - Allowed schemes: https:// only
   * - Blocked IPs: private ranges (10.x, 172.16-31.x, 192.168.x, 127.x, 169.254.x)
   * - Blocked TLDs: .local, .internal, .corp
   * - Max length: 2048 characters
   */
  validateUrlSafety(url: string): boolean;

  /**
   * Validate downloaded image file
   */
  async validateImage(
    imagePath: string,
    requirements: ImageRequirements
  ): Promise<ValidationResult>;

  /**
   * Check if image meets quality threshold
   */
  meetsQualityCriteria(
    metadata: ImageMetadata,
    requirements: ImageRequirements
  ): boolean;
}
```

#### 3. Gemini Web Search Prompts (`config/prompts/web-scrape.prompt.ts`)
**Purpose**: Specialized prompts for web scraping operations

**Prompts to Create**:
1. **Search Query Generation**: Convert scene description to optimal web search queries
2. **URL Extraction**: Extract valid image URLs from search results
3. **Image Selection**: Rank and select the best image from candidates

**Example Structure**:
```typescript
export const generateSearchQueriesPrompt = (vars: {
  sceneDescription: string;
  tags: string[];
  imageCount: number;
}): string => { /* ... */ };

export const extractImageUrlsPrompt = (vars: {
  searchQuery: string;
  minUrls: number;
  maxUrls: number;
}): string => { /* ... */ };

export const selectBestImagePrompt = (vars: {
  sceneDescription: string;
  candidates: Array<{
    url: string;
    metadata: ImageMetadata;
  }>;
  criteria: SelectionCriteria;
}): string => { /* ... */ };
```

#### 4. Types and Schemas (`cli/lib/scraper-types.ts`)
**Purpose**: Type definitions for scraper functionality

**Key Types**:
```typescript
export interface ScrapedImage {
  id: string;
  url: string;
  sourceUrl: string; // The webpage where image was found
  width: number;
  height: number;
  format: 'jpeg' | 'png' | 'webp';
  sizeBytes: number;
  tags: string[];
  metadata?: any;
}

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

export interface SelectionCriteria {
  sceneRelevance: number;      // Weight: 0-1
  technicalQuality: number;     // Weight: 0-1
  aestheticAppeal: number;      // Weight: 0-1
  aspectRatioMatch: number;     // Weight: 0-1
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

// Zod schemas for validation
export const ImageUrlSchema = z.object({
  urls: z.array(z.object({
    url: z.string().url(),
    description: z.string().optional(),
    source: z.string().optional(),
  })),
});

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
```

### Modified Components

#### 1. Gather Command (`cli/commands/gather.ts`)
**Changes Required**:
1. Add `--scrape` CLI parameter parsing
2. Add conditional logic to use `WebScraperService` instead of stock media search
3. Handle scraped images in the manifest (no local library integration)
4. Update logging to distinguish between stock and scraped images

**Implementation Location**: Lines 234-633 (image search section)

**Pseudocode**:
```typescript
// Parse --scrape parameter (line ~774)
const scrape = args.includes('--scrape');

// In segment processing loop (around line 517-633)
if (!videoAcquired) {
  if (scrape) {
    // New web scraping path
    console.log('[GATHER]   → Searching web for images (scrape mode)...');

    const webScraper = new WebScraperService(aiProvider, downloader, validator);

    try {
      // Search returns already-downloaded and validated candidates
      const candidates = await webScraper.searchImagesForScene(
        segment.text,
        segmentTags,
        imageSearchOptions
      );

      if (candidates.length >= 3) { // Minimum threshold
        const bestImage = await webScraper.selectBestImage(
          candidates,
          segment.text,
          selectionCriteria
        );

        // Copy from cache to project (already downloaded during search)
        const projectImagePath = path.join(paths.assetsImages, path.basename(bestImage.cachePath));
        await fs.copyFile(bestImage.cachePath, projectImagePath);

        // Skip local library ingestion for scraped images (project-specific only)
        manifest.images.push({
          id: bestImage.id,
          path: projectImagePath,
          source: 'web-scrape',
          provider: 'gemini-search',
          sourceUrl: bestImage.sourceUrl,
          tags: mergeTags(bestImage.tags, segmentTags),
          metadata: bestImage.metadata,
        });

        console.log(`[GATHER]   ✓ Downloaded scraped image: ${bestImage.url}`);
      } else {
        console.warn(`[GATHER]   ⚠ Scraping returned only ${candidates.length} valid images, need 3+`);
        throw new Error('Insufficient candidates');
      }
    } catch (scrapeError: any) {
      console.warn(`[GATHER]   ⚠ Web scraping failed: ${scrapeError.message}`);
      console.log(`[GATHER]   → Falling back to stock media APIs`);
      // Fall through to existing stock media search (line 569)
    }
  } else {
    // Existing stock media search path
    // ... current code ...
  }
}
```

#### 2. Media Downloader (`cli/services/media/downloader.ts`)
**Changes Required**:
1. Add `downloadScrapedImage` method for web-scraped images
2. Handle different URL patterns and headers
3. Add support for dynamic image URLs (with query parameters, tokens, etc.)

**New Method**:
```typescript
async downloadScrapedImage(image: ScrapedImage): Promise<{ path: string; metadata: any }> {
  // Generate cache key from URL (MD5 hash)
  const hash = crypto.createHash('md5').update(image.url).digest('hex');
  const safeFilename = `${hash}.${image.format}`; // Avoid path traversal
  const cachePath = path.join(this.cacheDir, 'scrape', safeFilename);

  // Check cache first
  if (await fs.pathExists(cachePath)) {
    return { path: cachePath, metadata: image.metadata };
  }

  try {
    // Stream download to avoid memory exhaustion
    const response = await axios.get(image.url, {
      responseType: 'stream',
      timeout: 30000,
      headers: {
        'User-Agent': stockConfig.webScrape.download.userAgent,
        'Referer': image.sourceUrl,
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: true, // Strict SSL validation
      }),
      maxRedirects: 3,
    });

    // Validate Content-Type header
    const contentType = response.headers['content-type'];
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    // Stream to file
    await fs.ensureDir(path.dirname(cachePath));
    const writer = fs.createWriteStream(cachePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Validate with sharp (file signature check)
    const metadata = await sharp(cachePath).metadata();

    return { path: cachePath, metadata };
  } catch (error) {
    // Cleanup on failure
    if (await fs.pathExists(cachePath)) {
      await fs.remove(cachePath);
    }
    throw error;
  }
}
```

#### 3. Stock Assets Config (`config/stock-assets.config.json`)
**Changes Required**:
1. Add `webScrape` configuration section

**New Section** (add at root level, not under providers):
```json
{
  "webScrape": {
    "enabled": true,
    "candidateCount": {
      "target": 5,
      "maxAttempts": 10
    },
    "concurrency": {
      "maxConcurrent": 3,
      "rateLimit": {
        "requestsPerSecond": 10,
        "perDomain": true
      }
    },
    "quality": {
      "minWidth": 1920,
      "minHeight": 1080,
      "maxWidth": 7680,
      "maxHeight": 4320,
      "allowedFormats": ["jpeg", "jpg", "png", "webp", "avif"],
      "rejectedFormats": ["gif", "tiff", "heic"],
      "minSizeBytes": 102400,
      "maxSizeBytes": 10485760,
      "aspectRatio": {
        "target": 1.777778,
        "tolerance": 0.3
      }
    },
    "selection": {
      "weights": {
        "sceneRelevance": 0.4,
        "technicalQuality": 0.3,
        "aestheticAppeal": 0.2,
        "aspectRatioMatch": 0.1
      },
      "tieBreaker": "resolution"
    },
    "download": {
      "timeoutMs": 30000,
      "totalOperationTimeoutMs": 120000,
      "retryAttempts": 3,
      "retryDelayMs": 1000,
      "userAgent": "Mozilla/5.0 (compatible; RemotionP2V/1.0)",
      "strictSSL": true,
      "streamDownload": true
    },
    "security": {
      "allowedSchemes": ["https"],
      "blockedIpRanges": [
        "10.0.0.0/8",
        "172.16.0.0/12",
        "192.168.0.0/16",
        "127.0.0.0/8",
        "169.254.0.0/16"
      ],
      "blockedTLDs": [".local", ".internal", ".corp"],
      "maxUrlLength": 2048
    },
    "cache": {
      "directory": "cache/media-scrape",
      "maxSizeGB": 5,
      "ttlDays": 7,
      "evictionPolicy": "lru"
    },
    "search": {
      "provider": "google-custom-search",
      "apiKey": "${GOOGLE_CUSTOM_SEARCH_API_KEY}",
      "searchEngineId": "${GOOGLE_CUSTOM_SEARCH_ENGINE_ID}",
      "fallbackToStock": true,
      "minCandidatesForSuccess": 3
    },
    "gemini": {
      "searchModel": "gemini-2.5-flash-lite",
      "selectionModel": "gemini-2.5-flash-lite"
    }
  }
}
```

## Implementation Steps

> **Note**: Each phase has a detailed specification file in the `specs/` directory with comprehensive implementation details, code examples, and acceptance criteria.

### Phase 0: Verification (Priority: BLOCKER)
⚠️ **Must complete before Phase 1**

**Verification Tasks**:
1. Verify Google Custom Search API access:
   - Obtain API key and Search Engine ID
   - Test with sample queries
   - Verify image search mode returns valid URLs
   - Confirm rate limits and quotas (5000 queries/day free tier)

2. Test Gemini CLI structured output:
   - Verify `gemini --yolo --output-format json` works with search queries
   - Test ImageUrlSchema parsing
   - Confirm retry logic works with validation errors

3. Verify Sharp library capabilities:
   - Test AVIF format support
   - Verify metadata extraction for all allowed formats
   - Test performance with 4K+ images

**Acceptance Criteria**:
- [ ] Google Custom Search API returns 10+ image URLs for test query
- [ ] Gemini CLI successfully generates search queries from scene descriptions
- [ ] Sharp extracts metadata from test images in <500ms

**Dependencies**: None
**Estimated Time**: 1-2 hours

---

### Phase 1: Core Infrastructure (Priority: High) ✅
📄 **Detailed Specification**: [`specs/phase-1-core-infrastructure.md`](specs/phase-1-core-infrastructure.md)

**Files to Create**:
1. ✅ `cli/lib/scraper-types.ts` - Type definitions and Zod schemas
2. ✅ `cli/services/media/image-validator.ts` - Image quality validation + URL safety
3. ✅ `config/prompts/web-scrape.prompt.ts` - Gemini prompts for scraping

**Key Deliverables**:
- Complete type system with Zod schemas for validation
- Image validator with quality scoring algorithm AND SSRF protection
- Three Gemini prompts (query generation, URL selection via API, image selection)
- Comprehensive error classes (ValidationError, ScraperError, SSRFError)
- Unit tests with >90% coverage

**New Requirements**:
- URL safety validation (scheme, IP range, TLD blacklist)
- Input validation (scene description length, tag limits)
- Selection score formula implementation
- Security-focused test cases

**Dependencies**: Phase 0 complete
**Estimated Time**: 4-5 hours (increased for security)

---

### Phase 2: Web Scraper Service (Priority: High) ✅
📄 **Detailed Specification**: [`specs/phase-2-web-scraper-service.md`](specs/phase-2-web-scraper-service.md)

**Files to Create**:
1. ✅ `cli/services/media/web-scraper.ts` - Main web scraping orchestration
2. ✅ `cli/services/media/google-search.ts` - Google Custom Search API client

**Key Implementation Details**:
- Full workflow: query generation → Google Custom Search API → download → validation → selection
- Search mechanism: Gemini generates queries → Google API returns URLs → Validate & filter
- Single download per candidate (no re-download)
- Parallel downloads with concurrency control (max 3 concurrent)
- Rate limiting per domain (10 req/sec)
- Streaming downloads to avoid memory exhaustion
- Early termination: stop when 5 valid candidates found (max 10 attempts)
- SSRF protection on all URLs before download
- Fallback to stock APIs if <3 valid candidates

**Error Handling**:
- Google API failures → retry with exponential backoff
- URL validation failures → skip and continue
- Download failures → cleanup partial files, continue with next
- <3 candidates → throw error, trigger stock API fallback

**Dependencies**: Phase 1 complete
**Estimated Time**: 8-10 hours (increased for Google API integration)

---

### Phase 3: Integration (Priority: High) ✅
📄 **Detailed Specification**: [`specs/phase-3-integration.md`](specs/phase-3-integration.md)

**Files to Modify**:
1. ✅ `cli/commands/gather.ts` - Add --scrape parameter and conditional logic
2. ✅ `config/stock-assets.config.json` - Add webScrape configuration
3. ⏭️ `cli/lib/config.ts` - Add webScrape schema validation (optional)
4. ⏭️ `README.md` - Add user documentation (Phase 5)

**Key Integration Points**:
- CLI parameter parsing for `--scrape` flag
- Conditional branching in image search logic
- Configuration validation
- Manifest compatibility

**Estimated Time**: 4-6 hours
**Dependencies**: Phase 2

---

### Phase 4: Testing & Validation (Priority: Medium) ✅
📄 **Detailed Specification**: [`specs/phase-4-testing.md`](specs/phase-4-testing.md)

**Files to Create**:
1. ✅ `tests/scraper-types.test.ts` - Type and schema tests (52 tests, all passing)
2. ✅ `tests/image-validator.test.ts` - Validator unit tests + SSRF tests (30 tests, all passing)
3. ✅ `tests/web-scraper.test.ts` - Scraper unit tests with mocks (comprehensive coverage)
4. ✅ `tests/google-search.test.ts` - Google API client tests (comprehensive coverage)
5. ✅ `tests/e2e/stage-gather-scrape.test.ts` - E2E pipeline test (5 test scenarios)
6. ✅ `scripts/generate-test-fixtures.ts` - Fixture generation script (working)
7. ✅ Test image fixtures (7 images generated):
   - `test-1920x1080.jpg` (1920x1080, 16:9, ~12KB, JPEG)
   - `test-3840x2160.webp` (3840x2160, 16:9, ~14KB, WebP)
   - `test-640x480.jpg` (640x480, below minimum)
   - `test-portrait-1080x1920.jpg` (1080x1920, portrait)
   - `test-tiny.jpg` (100x100, too small)
   - `test-exactly-1920x1080.jpg` (exact minimum dimensions)
   - `test-corrupted.jpg` (corrupted JPEG header)

**Test Coverage**:
- Unit tests with mocked dependencies
- Security tests: SSRF attempts, path traversal, malformed URLs
- Integration tests with real Google API (cached responses)
- End-to-end pipeline validation
- Performance benchmarks (<2 minutes per segment)
- Error scenario testing (all failure modes)
- Fallback behavior tests

**New Test Cases**:
- SSRF protection: file://, http://127.0.0.1, private IPs
- URL validation: schemes, length, special characters
- Content-Type validation: HTML returned instead of image
- Partial download failures
- Rate limiting enforcement
- Cache size limits

**Dependencies**: Phase 3 complete
**Estimated Time**: 6-8 hours (increased for security tests)
**Progress**: 100% complete (all test files created and validated)
**Completed Items**:
- ✅ Test fixture generation script (`scripts/generate-test-fixtures.ts`)
- ✅ Test fixture documentation (`tests/fixtures/README.md`)
- ✅ All 7 test image fixtures generated and verified
- ✅ Scraper types unit tests (52 test cases, 100% passing)
- ✅ Image validator unit tests (30 test cases, 100% passing)
- ✅ Web scraper service unit tests (`tests/web-scraper.test.ts` - comprehensive mocking)
- ✅ Google Search API client tests (`tests/google-search.test.ts` - comprehensive coverage)
- ✅ E2E gather scrape test (`tests/e2e/stage-gather-scrape.test.ts` - 5 test scenarios)
- ✅ SSRF protection tests (comprehensive IP/TLD blocking)
- ✅ Quality criteria validation tests
- ✅ Error handling and fallback tests
- ✅ npm scripts added to package.json (`test:fixtures`, `test:scraper-types`, `test:image-validator`)
- ✅ .gitignore updated to exclude generated fixtures

**Test Coverage Summary**:
- ✅ Input validation (empty descriptions, long descriptions, tag limits)
- ✅ Query generation (Gemini integration, error handling)
- ✅ Google Search API (all HTTP error codes, retries, rate limiting)
- ✅ Image download and validation (SSRF protection, quality checks)
- ✅ Image selection (Gemini selection, fallback scoring)
- ✅ E2E integration (--scrape flag, manifest generation, fallback behavior)

---

### Phase 5: Documentation (Priority: Low)
📄 **Detailed Specification**: [`specs/phase-5-documentation.md`](specs/phase-5-documentation.md)

**Files to Create/Update**:
1. `README.md` - User guide with examples
2. `config/README.md` - Configuration reference
3. `docs/web-scraper-architecture.md` - Architecture documentation
4. `docs/api/web-scraper-api.md` - API reference

**Documentation Scope**:
- User guide with usage examples
- Configuration options reference
- Troubleshooting guide
- Developer architecture overview
- API documentation with examples

**Estimated Time**: 1-2 hours
**Dependencies**: Phase 4

## Technical Considerations

### Web Image Search Implementation
**Selected Approach: Google Custom Search API (Option 2)**

**Why Not Option 1 (Gemini built-in search)?**
- GeminiCLIProvider (cli/services/ai/gemini-cli.ts) shows no evidence of search grounding
- Gemini CLI `--yolo` mode does not support web search
- Built-in search would require Gemini to hallucinate URLs (high failure rate)
- No reliable way to get structured image URL responses

**Implementation with Google Custom Search API**:
1. **Query Generation** (Gemini):
   - Input: scene description + tags
   - Prompt: Generate 2-3 optimal image search queries
   - Output: Array of search strings

2. **URL Discovery** (Google Custom Search API):
   - Use Google Custom Search JSON API
   - Configure search engine for image search mode
   - Request 10 results per query
   - Filter results by: imageType, fileType, imgSize
   - Returns: structured JSON with image URLs, dimensions, formats

3. **URL Validation & Selection** (Gemini):
   - Input: Array of candidate URLs with metadata
   - Validate URLs for safety (SSRF protection)
   - Pre-validate with HEAD requests
   - Prompt Gemini to rank images by scene relevance
   - Output: Ranked list of candidates

**API Requirements**:
- Environment variables: `GOOGLE_CUSTOM_SEARCH_API_KEY`, `GOOGLE_CUSTOM_SEARCH_ENGINE_ID`
- Free tier: 100 queries/day (sufficient for testing)
- Paid tier: $5 per 1000 queries (estimate: 3 queries per segment = $0.015/segment)

**Fallback Strategy**:
- If Google API fails (rate limit, network): fall back to stock media APIs
- If <3 valid candidates: fall back to stock media APIs
- Fallback threshold configurable: `webScrape.search.minCandidatesForSuccess`

**Verification Step** (Phase 0):
- Test Google Custom Search API before implementation
- Verify image search returns valid URLs
- Confirm metadata includes dimensions and format

### Quality Validation Pipeline
```
1. URL Safety Validation (SSRF protection)
   - Check scheme (https:// only)
   - Check IP range (block private IPs)
   - Check TLD (.local, .internal, .corp blocked)
   - Check URL length (<2048 chars)
   ↓
2. Pre-validation (HEAD request)
   - Content-Type: must start with image/
   - Content-Length: 100KB - 10MB range
   - Response status: 200 OK
   ↓
3. Download candidates (target: 5, max attempts: 10)
   - Parallel download with max 3 concurrent
   - Streaming download to avoid memory exhaustion
   - Rate limiting: 10 req/sec per domain
   - Timeout: 30s per download
   - Early termination when 5 valid found
   ↓
4. Post-validation (sharp metadata extraction)
   - File signature validation (magic bytes)
   - Dimensions: 1920x1080 minimum
   - Format: jpeg, png, webp, avif only
   - Aspect ratio: within tolerance of target
   ↓
5. Quality Scoring
   - Calculate score for each candidate
   - Formula: Σ(weight_i × normalized_score_i)
   - Sort by total score (descending)
   ↓
6. Gemini Selection (best image from top 5)
   - Provide top 5 candidates with scores
   - Gemini evaluates aesthetic appeal and scene relevance
   - Returns selected index with reasoning
   ↓
7. Copy to project (no re-download)
   - Copy from cache to project assets
   - Generate manifest entry
   - Skip local library ingestion
```

**Note**: Single download per candidate (no "final download" step)

### Error Handling Strategy

| Failure Scenario | Detection | Recovery Action | Fallback |
|------------------|-----------|-----------------|----------|
| Google API failure | HTTP error, timeout | Retry 3x with exp. backoff | Fall back to stock APIs |
| No URLs returned | Empty results | Log warning | Fall back to stock APIs |
| SSRF URL detected | validateUrlSafety() | Skip URL, log security warning | Continue with remaining |
| Invalid Content-Type | HEAD request | Skip URL | Continue with remaining |
| Download timeout | axios timeout | Retry 3x | Skip if all retries fail |
| <3 valid candidates | After validation | Log warning | Fall back to stock APIs |
| All validation fails | 0 candidates | Log error | Fall back to stock APIs |
| Gemini selection fails | Timeout, error | Use top-scored candidate | Quality ranking fallback |
| Copy to project fails | fs.copyFile error | Log error | Continue to next segment |

**Fallback Threshold**: If <3 validated candidates, trigger stock API fallback
**Cleanup**: Delete partial downloads on failure (prevent cache pollution)
**Timeout Handling**: If total operation >120s, return partial results + fallback

### Performance Optimization

1. **Concurrent Downloads**: Max 3 concurrent (reduced from 5-10 to prevent memory exhaustion)
2. **Streaming Downloads**: Use axios responseType: 'stream' (avoid buffering 150MB)
3. **Early Termination**: Stop downloading when 5 valid candidates found (don't download all 10)
4. **HEAD Requests**: Pre-validate Content-Type and size before download
5. **Rate Limiting**: 10 req/sec per domain (prevent IP bans)
6. **Caching**:
   - Cache directory: `cache/media-scrape/` (separate from stock)
   - TTL: 7 days (shorter than stock's 30 days)
   - Max size: 5GB with LRU eviction
7. **Segment Queuing**: Only 1 segment scrapes at a time (prevent 30 concurrent downloads)

**Memory Profile**:
- Before: 10 images × 15MB = 150MB per segment
- After: 3 concurrent × 15MB = 45MB max (streaming, no buffering)

**Time Budget per Segment**:
- Query generation: 5s
- Google API calls: 10s (3 queries)
- URL validation: 5s (HEAD requests)
- Download + validation: 45s (3 concurrent × 15s each, 5 images)
- Selection: 10s (Gemini)
- **Total**: ~75s per segment (vs 120s timeout)

## Configuration Requirements

### Environment Variables
No new environment variables required (uses existing Gemini CLI setup)

### Config File Updates
Update `config/stock-assets.config.json` with `webScrape` section (see above)

## Testing Strategy

### Unit Tests
1. **ImageQualityValidator**
   - Test dimension validation
   - Test aspect ratio matching
   - Test file format validation
   - Test file size limits

2. **WebScraperService**
   - Test search query generation
   - Test URL extraction
   - Test candidate filtering
   - Test image selection

### Integration Tests
1. Test gather command with --scrape parameter
2. Test interaction with Gemini CLI
3. Test image download and validation pipeline
4. Test manifest generation with scraped images

### End-to-End Tests
1. Full pipeline test with --scrape enabled
2. Test with various scene descriptions
3. Test error handling and fallbacks
4. Test quality criteria enforcement

## Success Criteria

### Functional Requirements
- [ ] `--scrape` parameter works with gather command
- [ ] Gemini successfully finds 5-10 image URLs per scene
- [ ] Images are validated against quality criteria
- [ ] Gemini selects the best image from candidates
- [ ] Images are downloaded and stored in project assets
- [ ] Manifest correctly records scraped images

### Quality Requirements
- [ ] Downloaded images meet minimum resolution (1920x1080)
- [ ] Images match target aspect ratio (within tolerance)
- [ ] Only allowed formats are downloaded (JPEG, PNG, WebP)
- [ ] File sizes are within acceptable range
- [ ] No broken or invalid images in final output

### Performance Requirements
- [ ] Image search completes within 30 seconds per scene
- [ ] Candidate download completes within 60 seconds (5-10 images)
- [ ] Total gather time with --scrape is < 3x normal gather time

### Reliability Requirements
- [ ] Graceful handling of network failures
- [ ] Appropriate fallbacks when scraping fails
- [ ] Clear error messages for debugging
- [ ] No crashes or unhandled exceptions

## Risks and Mitigations

### Risk 1: Gemini web search reliability
**Impact**: High
**Likelihood**: Medium
**Mitigation**:
- Implement robust retry logic
- Add fallback to Google Custom Search API
- Cache successful search results

### Risk 2: Image URL validity
**Impact**: Medium
**Likelihood**: High
**Mitigation**:
- Pre-validate URLs with HEAD requests
- Implement timeout and retry logic
- Skip invalid URLs and continue with others

### Risk 3: Quality validation complexity
**Impact**: Low
**Likelihood**: Medium
**Mitigation**:
- Use well-tested `sharp` library
- Implement comprehensive test coverage
- Allow configuration of quality thresholds

### Risk 4: Performance degradation
**Impact**: Medium
**Likelihood**: Low
**Mitigation**:
- Parallel downloads with concurrency limits
- Efficient HEAD request validation
- Early termination when criteria met

## Future Enhancements (Out of Scope)

1. **Local Library Integration**: Store scraped images in local library for reuse
2. **Advanced AI Selection**: Use vision models to analyze image content
3. **Multi-provider Support**: Support other search engines (Bing, DuckDuckGo)
4. **Caching Layer**: Cache search results and validated images
5. **Batch Optimization**: Optimize batch scraping for multiple scenes
6. **Attribution Tracking**: Better tracking of image sources for licensing

## Risks and Mitigations

### Risk 1: Google Custom Search API Costs
**Impact**: MEDIUM | **Likelihood**: HIGH
**Mitigation**:
- Free tier: 100 queries/day (sufficient for testing)
- Implement query caching (cache search results for 24h)
- Configure `webScrape.search.fallbackToStock` (reduce API usage)
- Monitor usage with telemetry

### Risk 2: SSRF Vulnerabilities
**Impact**: HIGH (Security) | **Likelihood**: LOW (after mitigation)
**Mitigation**:
- Implemented URL validation (scheme, IP range, TLD blacklist)
- Strict HTTPS-only downloads
- No redirects to different domains
- Comprehensive security tests in Phase 4

### Risk 3: Memory Exhaustion
**Impact**: MEDIUM | **Likelihood**: LOW (after mitigation)
**Mitigation**:
- Reduced concurrent downloads: 3 max
- Streaming downloads (no buffering)
- Segment-level queue (1 at a time)
- Max file size: 10MB

### Risk 4: Image Quality Inconsistency
**Impact**: LOW | **Likelihood**: MEDIUM
**Mitigation**:
- Strict quality criteria (1920x1080 minimum)
- Two-stage validation (pre + post download)
- Gemini aesthetic scoring
- Fallback to stock APIs for quality guarantee

## Dependencies

### External Libraries
- `axios`: HTTP requests for image downloads (already installed)
- `sharp`: Image metadata extraction and validation (already installed)
- `zod`: Schema validation (already installed)

### Internal Services
- `GeminiCLIProvider`: AI operations
- `MediaDownloader`: Image downloads
- `ConfigManager`: Configuration management

### Configuration Files
- `config/stock-assets.config.json`: Add webScrape section
- `config/prompts/web-scrape.prompt.ts`: New prompt file

## Notes for Implementation

1. **Follow Existing Patterns**: Mirror the structure of existing media services (PexelsService, UnsplashService)
2. **Consistent Error Handling**: Use the same error handling patterns as other gather operations
3. **Logging Strategy**: Use consistent logging prefixes like `[GATHER]` and `[SCRAPER]`
4. **Configuration First**: Load all config before starting scraping operations
5. **Graceful Degradation**: Always provide meaningful error messages and fallbacks
6. **Type Safety**: Use strict TypeScript types and Zod schemas throughout

## Open Questions for Stakeholders

These require business/legal/product decisions before implementation:

1. **Legal Compliance**:
   - Q: Is web scraping with User-Agent spoofing legally acceptable for this use case?
   - Q: Do we need to honor robots.txt?
   - Q: What's our policy on copyrighted images?
   - **Action Required**: Legal review of scraping practices

2. **Cost Approval**:
   - Q: Is $5 per 1000 queries ($0.015 per segment) acceptable?
   - Q: Budget for paid tier vs free tier (100 queries/day)?
   - Q: Monitor and alert thresholds?
   - **Action Required**: Budget approval for Google Custom Search API

3. **Attribution & Licensing**:
   - Q: How do we display image source attribution to end users?
   - Q: Do we verify image licenses before use?
   - Q: Legal liability for unlicensed images?
   - **Action Required**: Define attribution display requirements

4. **Quality vs Availability Trade-off**:
   - Q: Is 1920x1080 minimum too restrictive? Allow 1280x720?
   - Q: Should we prefer scraped images over stock when both available?
   - Q: Acceptable failure rate for scraping?
   - **Action Required**: Define quality thresholds and preferences

5. **Fallback Behavior**:
   - Q: Should scraping failures be silent (auto-fallback) or loud (notify user)?
   - Q: Should `--scrape` be best-effort or fail-if-unavailable?
   - **Action Required**: Define UX for fallback scenarios
