# Phase 3: Integration Specification

## Overview
Integrate the web scraper service into the gather command, modify the media downloader to support scraped images, and update configuration files.

**Integration Behavior**: When `--scrape` is enabled, the gather command will:
1. Skip local library checks for images (to avoid mixed-source complexity in Phase 3)
2. Use web scraping exclusively for image acquisition when video fallback occurs
3. **Fallback to stock media search if scraping fails** (preserves existing behavior)
4. Not ingest scraped images into local library (Phase 3 limitation)

**Key Constraint**: This phase introduces scrape mode as an alternative acquisition path, not a replacement. All existing gather functionality must remain unchanged when `--scrape` is not specified.

## Deliverables

### 1. Gather Command Integration (`cli/commands/gather.ts`)

#### Changes Required

##### CLI Parameter Addition

**Location**: Line 770-775 (after preview parameter)

```typescript
// Parse CLI args
const args = process.argv.slice(2);
const projectIdIndex = args.indexOf('--project');
const projectId = projectIdIndex !== -1 ? args[projectIdIndex + 1] : undefined;
const preview = args.includes('--preview');
const scrape = args.includes('--scrape');  // NEW

// Validate scrape mode
if (scrape) {
  console.log('[GATHER] Scrape mode enabled - using web scraping for images');
}
```

##### Import Additions

**Location**: Top of file (after existing imports)

```typescript
// Existing imports
import { deduplicateImages, deduplicateVideos } from '../services/media/deduplication';
import { rankByQuality } from '../services/media/quality';

// NEW IMPORTS
import { WebScraperService } from '../services/media/web-scraper';
import { ImageQualityValidator } from '../services/media/image-validator';
import type { ScrapedImage, ImageRequirements } from '../lib/scraper-types';
```

##### Service Initialization

**Location**: Line 295-317 (after existing service initialization)

```typescript
// Existing services
const aiProvider = isLibraryTestMode ? createMockAIProvider() : await AIProviderFactory.getProviderWithFallback();
const stockSearch = disableOnlineSearch
  ? createOfflineStockSearch()
  : await MediaServiceFactory.getStockMediaSearch();
const downloader = MediaServiceFactory.getMediaDownloader();

// NEW: Initialize web scraper if scrape mode enabled
let webScraper: WebScraperService | null = null;
if (scrape && !isLibraryTestMode) {
  console.log('[GATHER] Initializing web scraper service...');

  if (!stockConfig.webScrape) {
    console.error('[GATHER] ✗ Error: webScrape configuration not found in stock-assets.config.json');
    process.exit(1);
  }

  if (!stockConfig.webScrape.enabled) {
    console.error('[GATHER] ✗ Error: Web scraping is disabled in configuration');
    console.log('[GATHER] Set webScrape.enabled to true in config/stock-assets.config.json');
    process.exit(1);
  }

  // Validate configuration completeness
  const requiredFields = ['quality', 'selection', 'download', 'candidateCount'] as const;
  for (const field of requiredFields) {
    if (!stockConfig.webScrape[field]) {
      console.error(`[GATHER] ✗ Error: webScrape.${field} configuration missing`);
      process.exit(1);
    }
  }

  // Validate selection weights sum to 1.0
  const weights = stockConfig.webScrape.selection.weights;
  const weightSum = weights.sceneRelevance + weights.technicalQuality +
                    weights.aestheticAppeal + weights.aspectRatioMatch;
  if (Math.abs(weightSum - 1.0) > 0.01) {
    console.error(`[GATHER] ✗ Error: webScrape.selection.weights must sum to 1.0 (current: ${weightSum})`);
    process.exit(1);
  }

  webScraper = new WebScraperService(
    aiProvider,
    stockConfig.webScrape,
    downloader,
    new ImageQualityValidator(stockConfig.webScrape.quality)
  );

  console.log('[GATHER] ✓ Web scraper initialized');
}
```

##### Image Search Replacement

**Location**: Line 517-633 (replace entire image search section)

**Current Code Structure**:
```typescript
// 3. Fall back to image search if video acquisition failed
if (!videoAcquired) {
  if (localRepo && localLibraryConfig.enabled) {
    // Check local library...
  }

  if (!imagesAcquired) {
    if (disableOnlineSearch) {
      throw new Error('Online image search disabled via LOCAL_LIBRARY_DISABLE_ONLINE');
    }
    console.log(`[GATHER]   → Searching for images (video fallback)...`);
    const imageResults = await stockSearch.searchImages(/* ... */);
    // Download and process images...
  }
}
```

**New Code**:
```typescript
// 3. Fall back to image search if video acquisition failed
if (!videoAcquired) {
  // Skip local library check in scrape mode
  if (!scrape && localRepo && localLibraryConfig.enabled) {
    try {
      console.log('[GATHER]   → Checking local library for images...');
      const maxImages = preview ? PREVIEW_IMAGE_LIMIT : localLibraryConfig.limit.images;
      const localImages = await localRepo.searchImages(segmentTags, {
        minWidth: stockConfig.providers?.pexels?.searchDefaults?.minWidth,
        minHeight: stockConfig.providers?.pexels?.searchDefaults?.minHeight,
        desiredAspectRatio,
        maxResults: maxImages,
        preferRecencyBoost: localLibraryConfig.preferRecencyBoost,
      });

      const imagesToUse = localImages.slice(0, maxImages);
      if (imagesToUse.length > 0) {
        const usedIds: string[] = [];
        for (const image of imagesToUse) {
          try {
            const destPath = path.join(paths.assetsImages, path.basename(image.path));
            await fs.copyFile(image.path, destPath);
            manifest.images.push({
              id: image.id,
              libraryId: image.id,
              path: destPath,
              source: 'local-library',
              provider: image.provider,
              sourceUrl: image.sourceUrl ?? undefined,
              tags: image.tags,
              metadata: buildImageMetadata(image.width, image.height, cropConfig),
            });
            usedIds.push(image.id);
          } catch (copyError: any) {
            console.warn(`[GATHER]   ⚠ Failed to reuse local image ${image.id}: ${copyError.message}`);
          }
        }

        if (usedIds.length > 0) {
          await localRepo.markUsed(usedIds, 'image');
          if (usedIds.length >= localLibraryConfig.minMatches.images) {
            imagesAcquired = true;
            console.log(`[GATHER]   ✓ Reused ${usedIds.length} image(s) from local library`);
          } else {
            console.log(`[GATHER]   → Reused ${usedIds.length} local image(s); searching online for more`);
          }
        }
      }
    } catch (error: any) {
      console.warn(`[GATHER]   ⚠ Local image search failed: ${error.message}`);
    }
  }

  if (!imagesAcquired) {
    // BRANCH: Scrape mode vs stock media search
    if (scrape && webScraper) {
      // NEW: Web scraping path
      try {
        console.log(`[GATHER]   → Scraping web for images...`);

        // Validate segment has searchable content
        if (!segment.text || segment.text.trim().length === 0) {
          throw new Error('Segment has no text content for scraping');
        }
        if (!segmentTags || segmentTags.length === 0) {
          console.warn(`[GATHER]   ⚠ Segment has no tags, using text description only`);
        }

        // Search for candidate images
        const candidates = await webScraper.searchImagesForScene(
          segment.text,
          segmentTags,
          {
            perTag: stockConfig.providers?.pexels?.searchDefaults?.perPage || 10,
            orientation: videoConfig.defaultAspectRatio as '16:9' | '9:16',
          }
        );

        if (candidates.length === 0) {
          throw new Error('No candidate images found');
        }

        console.log(`[GATHER]   → Found ${candidates.length} candidate images`);

        // Select best image
        const bestImage = await webScraper.selectBestImage(
          candidates,
          segment.text
        );

        console.log(`[GATHER]   → Selected best image: ${bestImage.url}`);

        // Validate downloaded file exists
        if (!bestImage.downloadedPath) {
          throw new Error('Best image has no downloadedPath set');
        }
        if (!await fs.pathExists(bestImage.downloadedPath)) {
          throw new Error(`Downloaded file not found at ${bestImage.downloadedPath}`);
        }

        // Copy to project directory (atomic operation)
        const filename = path.basename(bestImage.downloadedPath);
        const projectImagePath = path.join(paths.assetsImages, filename);
        const tempCopyPath = `${projectImagePath}.tmp`;

        try {
          await fs.copyFile(bestImage.downloadedPath, tempCopyPath);
          await fs.rename(tempCopyPath, projectImagePath);
        } catch (copyError: any) {
          // Clean up partial copy
          await fs.remove(tempCopyPath).catch(() => {});
          throw new Error(`Failed to copy image: ${copyError.message}`);
        }

        // Add to manifest (only after successful copy)
        manifest.images.push({
          id: bestImage.id,
          path: projectImagePath,
          source: 'web-scrape',
          provider: 'gemini-search',
          sourceUrl: bestImage.sourceUrl,
          tags: mergeTags(bestImage.tags, segmentTags),
          metadata: {
            width: bestImage.width,
            height: bestImage.height,
            format: bestImage.format,
            // Spread bestImage.metadata first so explicit fields override
            ...(bestImage.metadata || {}),
          },
        });

        console.log(`[GATHER]   ✓ Scraped and saved image for segment ${segmentId}`);
        imagesAcquired = true;

        // Clean up ALL temp files (best + rejected candidates)
        const cleanupTasks = candidates.map(async (candidate) => {
          if (candidate.downloadedPath && await fs.pathExists(candidate.downloadedPath)) {
            await fs.remove(candidate.downloadedPath).catch((err) => {
              console.warn(`[GATHER]   ⚠ Failed to clean up ${candidate.downloadedPath}: ${err.message}`);
            });
          }
        });
        await Promise.all(cleanupTasks);

      } catch (scrapeError: any) {
        console.error(`[GATHER]   ✗ Web scraping failed: ${scrapeError.message}`);
        console.log(`[GATHER]   → Falling back to stock media search...`);

        // FALLBACK: Use stock media search (preserve existing behavior)
        // This ensures segments always get images even if scraping fails
        // Note: Fall through to stock search block below
      }
    }

    // Stock media search (original path OR fallback from failed scrape)
    if (!imagesAcquired) {
      if (disableOnlineSearch) {
        throw new Error('Online image search disabled via LOCAL_LIBRARY_DISABLE_ONLINE');
      }
      console.log(`[GATHER]   → Searching for images (video fallback)...`);
      const imageResults = await stockSearch.searchImages(
        segmentTags,
        {
          perTag: stockConfig.providers?.pexels?.searchDefaults?.perPage || 10,
          orientation: videoConfig.defaultAspectRatio as '16:9' | '9:16',
        }
      );

      // Deduplicate and rank
      const maxImages = preview ? PREVIEW_IMAGE_LIMIT : 5;
      const uniqueImages = deduplicateImages(imageResults);
      const rankedImages = rankByQuality(uniqueImages, {
        aspectRatio: videoConfig.defaultAspectRatio as '16:9' | '9:16',
        minQuality: stockConfig.qualityScoring?.minQualityScore || 0.6,
      }).slice(0, maxImages);

      console.log(`[GATHER]   → Found ${rankedImages.length} images`);

      // Download images
      for (const image of rankedImages) {
        try {
          const { path: cachePath, metadata } = await downloader.downloadImage(image);
          const filename = path.basename(cachePath);
          const projectImagePath = path.join(paths.assetsImages, filename);
          await fs.copyFile(cachePath, projectImagePath);

          let libraryId: string | undefined;
          if (localRepo && localLibraryConfig.enabled) {
            try {
              const ingested = await localRepo.ingestDownloaded(
                { path: cachePath, type: 'image' },
                mergeTags(image.tags, segmentTags),
                image.source,
                image.url
              );
              libraryId = ingested.id;
              await localRepo.markUsed([ingested.id], 'image');
            } catch (ingestError: any) {
              console.warn(`[GATHER]   ⚠ Failed to ingest image ${image.id} into local library: ${ingestError.message}`);
            }
          }

          manifest.images.push({
            id: image.id,
            libraryId,
            path: projectImagePath,
            source: image.source,
            provider: image.source,
            sourceUrl: image.url,
            tags: mergeTags(image.tags, segmentTags),
            metadata: metadata,
          });
        } catch (downloadError: any) {
          console.warn(`[GATHER]   ⚠ Failed to download image ${image.id}: ${downloadError.message}`);
        }
      }
    }
  }
}
```

##### Usage Help Text

**Location**: Line 241-245 (error messages)

Update usage message to include --scrape:

```typescript
if (!projectId) {
  console.error('[GATHER] ✗ Error: Missing required argument --project <id>');
  console.log('[GATHER] Usage: npm run gather -- --project <project-id> [--preview] [--scrape]');
  console.log('[GATHER] Options:');
  console.log('[GATHER]   --preview  Process only first 3 segments for testing');
  console.log('[GATHER]   --scrape   Use web scraping instead of stock media APIs');
  process.exit(1);
}
```

---

### 2. Configuration Update (`config/stock-assets.config.json`)

#### Add webScrape Section

**Location**: After `localLibrary` section

```json
{
  "defaultProvider": "pexels",
  "providers": { /* existing */ },
  "fallbackOrder": ["pexels", "pixabay", "unsplash"],
  "qualityScoring": { /* existing */ },
  "deduplication": { /* existing */ },
  "download": { /* existing */ },
  "localLibrary": { /* existing */ },
  "aspectRatios": { /* existing */ },
  "cropConfig": { /* existing */ },
  "caching": { /* existing */ },

  "webScrape": {
    "enabled": true,
    "candidateCount": {
      "min": 5,
      "max": 10
    },
    "quality": {
      "minWidth": 1920,
      "minHeight": 1080,
      "maxWidth": 7680,
      "maxHeight": 4320,
      "allowedFormats": ["jpeg", "jpg", "png", "webp"],
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
      }
    },
    "download": {
      "timeoutMs": 30000,
      "retryAttempts": 3,
      "retryDelayMs": 1000,
      "userAgent": "Mozilla/5.0 (compatible; RemotionP2V/1.0; +https://github.com/remotion-dev/remotion)",
      "maxConcurrent": 5
    },
    "gemini": {
      "searchModel": "gemini-2.5-flash-lite",
      "selectionModel": "gemini-2.5-flash-lite"
    }
  }
}
```

#### Update Config Schema

**Location**: `cli/lib/config.ts` (line 50-119)

Add webScrape schema to StockAssetsConfigSchema:

```typescript
const StockAssetsConfigSchema = z.object({
  // ... existing fields ...

  // NEW: Web scraping configuration
  webScrape: z.object({
    enabled: z.boolean().default(true),
    candidateCount: z.object({
      min: z.number().int().min(1).max(20).default(5),
      max: z.number().int().min(1).max(20).default(10),
    }).default({ min: 5, max: 10 }),
    quality: z.object({
      minWidth: z.number().int().positive().default(1920),
      minHeight: z.number().int().positive().default(1080),
      maxWidth: z.number().int().positive().optional(),
      maxHeight: z.number().int().positive().optional(),
      allowedFormats: z.array(z.string()).default(['jpeg', 'jpg', 'png', 'webp']),
      minSizeBytes: z.number().int().positive().default(102400),
      maxSizeBytes: z.number().int().positive().default(10485760),
      aspectRatio: z.object({
        target: z.number().positive().default(1.777778),
        tolerance: z.number().min(0).max(1).default(0.3),
      }).default({ target: 1.777778, tolerance: 0.3 }),
    }),
    selection: z.object({
      weights: z.object({
        sceneRelevance: z.number().min(0).max(1).default(0.4),
        technicalQuality: z.number().min(0).max(1).default(0.3),
        aestheticAppeal: z.number().min(0).max(1).default(0.2),
        aspectRatioMatch: z.number().min(0).max(1).default(0.1),
      }).default({
        sceneRelevance: 0.4,
        technicalQuality: 0.3,
        aestheticAppeal: 0.2,
        aspectRatioMatch: 0.1,
      }),
    }),
    download: z.object({
      timeoutMs: z.number().int().positive().default(30000),
      retryAttempts: z.number().int().min(0).max(10).default(3),
      retryDelayMs: z.number().int().positive().default(1000),
      userAgent: z.string().default('Mozilla/5.0 (compatible; RemotionP2V/1.0)'),
      maxConcurrent: z.number().int().min(1).max(20).default(5),
    }).default({
      timeoutMs: 30000,
      retryAttempts: 3,
      retryDelayMs: 1000,
      userAgent: 'Mozilla/5.0 (compatible; RemotionP2V/1.0)',
      maxConcurrent: 5,
    }),
    gemini: z.object({
      searchModel: z.string().default('gemini-2.5-flash-lite'),
      selectionModel: z.string().default('gemini-2.5-flash-lite'),
    }).default({
      searchModel: 'gemini-2.5-flash-lite',
      selectionModel: 'gemini-2.5-flash-lite',
    }),
  }).optional(),
});
```

---

### 3. Utility Functions Required

#### Location: `cli/commands/gather.ts` (helper functions section)

Add the `mergeTags` utility function used in both scrape and stock paths:

```typescript
/**
 * Merges tags from multiple sources, deduplicating and normalizing
 * @param baseTags - Tags from the scraped/downloaded image
 * @param segmentTags - Tags from the segment description
 * @returns Deduplicated array of normalized tags
 */
function mergeTags(baseTags: string[], segmentTags: string[]): string[] {
  const allTags = [...(baseTags || []), ...(segmentTags || [])];
  const normalized = allTags.map(tag => tag.toLowerCase().trim());
  return Array.from(new Set(normalized)).filter(tag => tag.length > 0);
}
```

#### Implementation Note

This function must be added before the segment processing loop. It handles the tag merging logic referenced in line 256 of the scrape path and line 327 of the stock path.

---

### 4. README Documentation Update

#### Location: Project README

Add section documenting the --scrape feature:

```markdown
### Web Scraping Mode

The gather command supports web scraping for images using Gemini AI:

\`\`\`bash
npm run gather -- --project <project-id> --scrape
\`\`\`

**How it works:**
1. Gemini generates optimal search queries from scene descriptions
2. Web search finds 5-10 candidate image URLs
3. Images are downloaded and validated for quality
4. Gemini selects the best image based on relevance and quality
5. **If scraping fails**, the system automatically falls back to stock media APIs

**Fallback behavior:**
- Scraping errors trigger automatic fallback to stock media search
- Ensures every segment gets an image (scrape is best-effort)
- No manual intervention required on failure

**Configuration:**
Edit `config/stock-assets.config.json` to adjust web scraping settings:
- `candidateCount`: Min/max images to consider per scene
- `quality`: Image quality requirements (resolution, format, size)
- `selection.weights`: Criteria weights for image selection

**Requirements:**
- Gemini CLI must be configured and working
- Sufficient disk space for temporary downloads
- Internet connection for web search

**Limitations:**
- Scraped images are not stored in the local library (Phase 3)
- Local library is bypassed when `--scrape` is used (Phase 3)
- Only images (no videos) are scraped in this mode
- Requires `webScrape.enabled: true` in config
- Selection weights must sum to 1.0 (validated on startup)

**Why local library is skipped in scrape mode:**
To avoid mixed-source complexity in Phase 3. Future phases may support hybrid mode where local library is checked first, then scraping fills gaps.
```

---

## Testing Requirements

### Manual Testing Checklist

**Scrape Mode Enabled**
- [ ] `--scrape` parameter is recognized
- [ ] Web scraper initializes correctly
- [ ] Configuration validation works (required fields, weight sum)
- [ ] Scraper finds candidate images
- [ ] Best image is selected
- [ ] Image is saved to project atomically
- [ ] All temp files are cleaned up (best + rejected)
- [ ] Manifest records scrape source correctly
- [ ] `imagesAcquired` flag set to true after success

**Error Handling**
- [ ] Missing config section shows clear error and exits
- [ ] Disabled config shows clear error and exits
- [ ] Missing config subfields show clear error and exits
- [ ] Invalid weights (not summing to 1.0) show clear error and exits
- [ ] Empty segment text throws error and falls back
- [ ] No candidates found triggers fallback to stock search
- [ ] Download path missing triggers fallback to stock search
- [ ] File copy failure triggers fallback to stock search
- [ ] Scraping failure falls back to stock media search
- [ ] Temp file cleanup failures log warnings but continue

**Integration**
- [ ] Works with `--preview` flag
- [ ] Works with multiple segments
- [ ] Doesn't interfere with TTS/music
- [ ] Output manifest format matches existing schema
- [ ] Manifest metadata fields match expected types
- [ ] Local library is bypassed in scrape mode
- [ ] Stock search still works when `--scrape` not specified

**Fallback Testing**
- [ ] Scraping failure falls back to stock media automatically
- [ ] Fallback produces valid manifest entries
- [ ] Fallback images work in render pipeline
- [ ] No orphaned temp files after fallback

**Edge Cases**
- [ ] Segment with empty text handled correctly
- [ ] Segment with no tags handled correctly
- [ ] All candidates fail quality validation triggers fallback
- [ ] Concurrent segment processing doesn't exceed maxConcurrent
- [ ] Process interruption (Ctrl+C) cleans up temp files

### Integration Tests

**gather-scrape-integration.test.ts**
```typescript
describe('Gather Command with Scrape Mode', () => {
  it('accepts --scrape parameter');
  it('initializes web scraper with correct dependencies');
  it('validates webScrape config exists and fails if missing');
  it('validates webScrape is enabled and fails if disabled');
  it('validates required config subfields and fails if missing');
  it('validates selection weights sum to 1.0 (±0.01 tolerance)');
  it('scrapes images for each segment');
  it('validates segment has text content before scraping');
  it('handles segments with no tags (uses text only)');
  it('validates downloaded file exists before copying');
  it('saves scraped images to project atomically (.tmp + rename)');
  it('sets imagesAcquired flag after successful scrape');
  it('records correct metadata in manifest (source: web-scrape)');
  it('merges tags correctly (deduplicates, normalizes)');
  it('cleans up ALL temporary files (best + rejected)');
  it('falls back to stock search when no candidates found');
  it('falls back to stock search when download fails');
  it('falls back to stock search when copy fails');
  it('produces valid manifest entries after fallback');
  it('works with --preview flag');
  it('bypasses local library in scrape mode');
  it('stock search still works without --scrape flag');
});

describe('Gather Command Scrape Mode Error Handling', () => {
  it('exits with clear message when config missing');
  it('exits with clear message when config disabled');
  it('exits with clear message when weights invalid');
  it('logs warning when temp cleanup fails but continues');
  it('handles concurrent downloads without exceeding maxConcurrent');
});
```

---

## Acceptance Criteria

### CLI Integration
- [ ] `--scrape` parameter recognized and parsed
- [ ] Usage help text updated with --scrape option
- [ ] Configuration validation works (exists, enabled, required fields, weights)
- [ ] Clear error messages for all misconfigurations
- [ ] Exits with non-zero status on config errors

### Service Integration
- [ ] Web scraper initializes correctly with all dependencies
- [ ] Scraper called instead of stock search when enabled
- [ ] Scraper falls back to stock search on any failure
- [ ] Images processed and saved atomically (.tmp + rename)
- [ ] Manifest format matches existing structure exactly
- [ ] Manifest metadata fields have correct types
- [ ] All temp files cleaned up (best + rejected candidates)
- [ ] `imagesAcquired` flag set correctly
- [ ] `mergeTags` function implemented and used

### Configuration
- [ ] webScrape section added to config/stock-assets.config.json
- [ ] Config schema updated in cli/lib/config.ts
- [ ] Schema validates all fields and types
- [ ] Default values are sensible and documented
- [ ] Selection weights default to summing to 1.0
- [ ] All options documented in README

### Error Handling & Edge Cases
- [ ] Empty segment text handled (error + fallback)
- [ ] Missing segment tags handled (warning + continue)
- [ ] No candidates found handled (fallback)
- [ ] Download failures handled (fallback)
- [ ] Copy failures handled (fallback + cleanup)
- [ ] Cleanup failures logged but don't block
- [ ] Config validation comprehensive

### Documentation
- [ ] README updated with --scrape docs
- [ ] Configuration options explained
- [ ] Requirements listed (Gemini CLI, disk space, internet)
- [ ] Limitations noted (no local library, Phase 3 only)
- [ ] Fallback behavior documented
- [ ] Why local library skipped explained

### Testing
- [ ] Manual testing completed (all checklists)
- [ ] Integration tests written and pass
- [ ] Error scenarios tested (all error paths)
- [ ] Fallback scenarios tested
- [ ] Edge cases tested
- [ ] Works end-to-end with render pipeline

---

## Resource Management & Constraints

### Temporary File Management

**Location**: Web scraper service manages temp downloads

**Behavior**:
- Temp files downloaded to system temp directory
- Each candidate image gets unique filename (UUID-based)
- Cleanup occurs in finally block after processing each segment
- Partial downloads removed on error
- `.tmp` files used for atomic copy operations

**Constraints**:
- Max concurrent downloads: 5 (configurable via `download.maxConcurrent`)
- Max temp file size: 10MB per image (configurable via `quality.maxSizeBytes`)
- Worst case temp storage: 5 concurrent × 10MB = 50MB
- All temp files cleaned up before processing next segment

### Process Interruption Handling

**Signal Handlers Required**: None in Phase 3

**Current Behavior**:
- Ctrl+C may leave orphaned temp files
- System temp cleanup will handle eventual removal
- Not critical for Phase 3 (best-effort cleanup)

**Future Enhancement**:
- Add SIGINT/SIGTERM handlers in gather command
- Register temp file paths for cleanup on exit

### Disk Space Validation

**Current**: No pre-flight disk space checks

**Rationale**:
- Temp files are small (max 10MB per image)
- Worst case is handled by system temp cleanup
- Download failures caught and handled gracefully

**Future Enhancement**: Check available disk space before starting gather

### Memory Constraints

**Current**: No explicit memory limits

**Expected Usage**:
- 5 concurrent image downloads × 10MB = 50MB max
- AI model inference (Gemini API, not local memory)
- Acceptable for typical systems

---

## Security Considerations

### Input Validation

**Segment Text**:
- Validated: Must be non-empty string
- Used in: AI prompts (Gemini handles injection)
- Risk: Low (controlled input from project files)

**Segment Tags**:
- Validated: Array of strings
- Normalized: Trimmed, lowercased
- Used in: Search queries, tag merging
- Risk: Low (controlled input from project files)

**Downloaded URLs**:
- Source: Gemini search results
- Validation: Image quality validator checks file format, size, dimensions
- Download: Uses axios with timeout and user-agent
- Risk: Medium (external URLs, but validated before use)

### File System Operations

**Temp File Writes**:
- Location: System temp directory (os.tmpdir())
- Permissions: Default user permissions
- Cleanup: Best-effort removal

**Project File Writes**:
- Location: Project assets/images directory
- Atomic: Uses .tmp + rename pattern
- Validation: File existence checked before copy

### Network Operations

**HTTP Requests**:
- User-Agent: Configurable, defaults to RemotionP2V identifier
- Timeout: 30 seconds (configurable)
- Retries: 3 attempts with 1s delay (configurable)
- Risk: Low (standard HTTP downloads)

**Rate Limiting**:
- Max concurrent: 5 downloads
- No explicit rate limit per domain
- Reliant on Gemini search not returning duplicate domains

### Dependency Trust

**External Dependencies**:
- axios: Trusted, widely used HTTP client
- fs-extra: Trusted, widely used file system utilities
- Gemini API: Trusted, official Google AI service

**Validation**:
- All external URLs validated for image format/size
- No executable files downloaded
- No code execution from downloaded content

---

## Rollback Plan

If integration causes issues:

1. **Revert gather.ts changes**:
   - Remove scrape parameter parsing
   - Remove web scraper initialization
   - Remove scraping branch in image search

2. **Keep infrastructure**:
   - Types, validator, prompts remain
   - Web scraper service remains
   - Can be used separately or fixed later

3. **Disable in config**:
   - Set `webScrape.enabled: false`
   - Document as experimental feature

---

## Dependencies

### Code Dependencies
- **Phase 1**: Types (`scraper-types.ts`), validator (`image-validator.ts`), prompts (`scraper-prompts.ts`)
- **Phase 2**: Web scraper service (`web-scraper.ts`)
- **Existing**: gather command (`cli/commands/gather.ts`)
- **Existing**: Media downloader (`MediaServiceFactory.getMediaDownloader()`)
- **Existing**: Configuration system (`cli/lib/config.ts`)
- **Existing**: `mergeTags` utility (must be added if not present)

### External Dependencies
- Gemini CLI configured and working
- Gemini API key in environment
- Internet connection for web search
- Sufficient disk space in system temp directory

### Validation Steps Before Implementation

**Pre-implementation Checklist**:
1. [ ] Verify Phase 1 types exist: `ScrapedImage`, `ImageRequirements`, `ScraperConfig`
2. [ ] Verify Phase 2 service exists: `WebScraperService` with required methods
3. [ ] Verify `ImageQualityValidator` class exists
4. [ ] Check if `mergeTags` utility exists in gather.ts
5. [ ] Verify AIProvider interface has required methods for scraper
6. [ ] Verify MediaDownloader supports downloading from URLs
7. [ ] Verify manifest schema supports `source: 'web-scrape'`
8. [ ] Test Gemini CLI is working: `gemini --version`

**Dependency Verification Script**:
```bash
# Check required files exist
test -f cli/lib/scraper-types.ts || echo "Missing: scraper-types.ts"
test -f cli/services/media/image-validator.ts || echo "Missing: image-validator.ts"
test -f cli/services/media/web-scraper.ts || echo "Missing: web-scraper.ts"

# Check Gemini CLI
gemini --version || echo "Gemini CLI not installed"

# Check config schema
grep -q "webScrape" cli/lib/config.ts || echo "Config schema needs updating"
```

---

## Implementation Order

**Recommended Sequence**:

1. **Add mergeTags utility** (if not present)
   - Location: cli/commands/gather.ts helper functions
   - Test: Unit test for deduplication and normalization

2. **Update configuration schema**
   - Location: cli/lib/config.ts
   - Test: Validate schema accepts webScrape section

3. **Add configuration JSON**
   - Location: config/stock-assets.config.json
   - Test: Load config and verify validation passes

4. **Add CLI parameter parsing**
   - Location: cli/commands/gather.ts CLI args section
   - Test: Run with --scrape and verify recognition

5. **Add service initialization**
   - Location: cli/commands/gather.ts service setup
   - Test: Initialization succeeds with valid config

6. **Replace image search logic**
   - Location: cli/commands/gather.ts segment processing
   - Test: Manual test with single segment

7. **Test fallback behavior**
   - Test: Force scraping errors and verify fallback works

8. **Update documentation**
   - Location: README.md
   - Test: Review for clarity and completeness

9. **Run integration tests**
   - All manual checklists
   - Automated test suite

---

## Estimated Time
**6-8 hours** (revised from 4-6 to account for comprehensive testing)

**Breakdown**:
- Implementation: 3-4 hours
- Testing (manual + integration): 2-3 hours
- Documentation: 1 hour

---

## Implementation Risks & Mitigations

### Risk: Phase 1/2 incomplete or incompatible
**Mitigation**: Run dependency verification script before starting

### Risk: Manifest schema doesn't support web-scrape source
**Mitigation**: Check existing manifest types, add if needed

### Risk: mergeTags utility doesn't exist
**Mitigation**: Implement utility first (30 min task)

### Risk: Config validation breaks existing projects
**Mitigation**: Make webScrape section optional in schema

### Risk: Fallback path not thoroughly tested
**Mitigation**: Add explicit error injection tests

### Risk: Temp file cleanup incomplete
**Mitigation**: Add logging for all cleanup operations, monitor in tests

---

## Notes
- Make minimal changes to existing gather logic
- Preserve all existing functionality (regression test required)
- Use clear branching for scrape vs stock modes
- Add comprehensive error messages for debugging
- Test thoroughly before committing
- Document all assumptions and future enhancements
- Ensure atomic operations for file writes
- Validate all external inputs (URLs, file paths)
- Log all state transitions for debugging
