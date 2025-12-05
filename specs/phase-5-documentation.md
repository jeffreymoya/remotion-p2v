# Phase 5: Documentation Specification

## Overview
Comprehensive documentation for the web scraping feature, including user guides, configuration references, and developer documentation.

## Prerequisites
- **Code Version**: Applies to implementation following phases 1-4 completion
- **Implementation Verification Required**: Before starting documentation, verify all components exist:
  - `cli/lib/scraper-types.ts` (type definitions)
  - `cli/services/media/web-scraper.ts` (scraper service)
  - `cli/services/media/image-validator.ts` (validator service)
  - `config/prompts/web-scrape.prompt.ts` (Gemini prompts)
  - Updated `cli/commands/gather.ts` with `--scrape` flag
- **Configuration State**: `config/stock-assets.config.json` must have `webScrape` section added (see Configuration Migration below)
- **Testing State**: All Phase 4 tests passing before documentation

## Configuration Migration
Before documenting, add the `webScrape` configuration section to the existing `config/stock-assets.config.json`:

**Location**: After the existing `download` section (line 87-92)

**Action**: Insert the following section:
```json
"webScrape": {
  "enabled": false,
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
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "maxConcurrent": 5
  },
  "gemini": {
    "searchModel": "gemini-2.0-flash-lite",
    "selectionModel": "gemini-2.0-flash-lite"
  },
  "cache": {
    "tempDir": "cache/scrape-temp",
    "cleanupAfterSelection": true,
    "maxTempSizeBytes": 524288000
  }
}
```

**Validation**: After adding, verify JSON validity with `npm run validate:config` (if available) or `node -e "require('./config/stock-assets.config.json')"`

**Note**: The `download` subsection within `webScrape` may duplicate some settings from the main `download` section (lines 87-92). This is intentional - webScrape uses its own download settings.

## Documentation Synchronization Strategy

### Code-to-Docs Verification
Before writing each documentation section:

1. **Read the actual implementation file**
2. **Extract exact type signatures** from TypeScript
3. **Copy actual error messages** from code
4. **Test actual CLI flags** and commands
5. **Verify actual config structure** against JSON

### Preventing Documentation Drift

**Problem**: Documentation can quickly become outdated if code changes.

**Solutions**:
1. **Version Pinning**: Add a note at the top of each doc file indicating which code version it documents
2. **Automated Checks**: Add a test that validates documented examples compile/run
3. **Review Triggers**: Require doc updates as part of any PR that changes web scraper code

**Example Version Note** (add to top of each documentation file):
```markdown
> **Version**: Documents web scraper implementation as of [commit-hash] / [date]
> **Last Verified**: [date]
```

## Critical Issues to Address in Documentation

### 1. Gemini Model Availability
**Issue**: Documentation references "gemini-2.0-flash-lite" but model availability may vary by region/account.

**Remediation in Docs**:
- Add a note to verify available models: `geminipro list-models`
- Provide fallback model options (e.g., "gemini-1.5-flash", "gemini-1.5-pro")
- Document how to check model availability before running

### 2. Error Message Accuracy
**Issue**: Troubleshooting section lists error messages that may not match actual implementation.

**Remediation**:
- Extract actual error strings from code (grep for `throw new Error`, `console.error`)
- Test each error scenario to capture exact error text
- Include error codes if implementation uses them

### 3. Performance Claims
**Issue**: Documentation states "~60 seconds per scene" without benchmarking data.

**Remediation**:
- Replace with "Performance varies based on network speed and candidate count"
- Add note: "First run may be slower due to model loading"
- Remove specific timing claims unless tested

### 4. Cache Directory Documentation
**Issue**: Documents `cache/scrape-temp` but doesn't explain creation/permissions.

**Remediation**:
- Add automatic directory creation note
- Document disk space requirements more precisely
- Explain cleanup behavior (when files are deleted)

### 5. Missing Edge Cases

Document these scenarios:
- What happens if all 10-20 search results fail validation?
- Behavior when network is unavailable (offline mode)
- What if Gemini API rate limits are hit?
- Handling of duplicate URLs across different queries
- Behavior when scene has no tags (empty array case)
- What if aspect ratio tolerance is set to 0.0?

## Security & Safety Considerations

### Documentation Must Include

#### 1. Downloaded Content Safety
**Risk**: Scraped images come from untrusted web sources and could contain:
- Malicious metadata (EXIF exploits)
- Malformed image data (buffer overflow attempts)
- Copyrighted/inappropriate content

**Required Documentation**:
- Warn users that web scraping downloads from untrusted sources
- Document that `sharp` library provides some protection via validation
- Recommend reviewing downloaded images before use in production
- Note that scraped images are NOT added to local library (reducing exposure)

#### 2. Network Security
**Risk**: Making HTTP requests to arbitrary URLs found by Gemini search.

**Required Documentation**:
- HTTPS preference (if implemented)
- Timeout and size limits prevent resource exhaustion
- User-Agent header to identify scraper traffic
- No automatic execution of downloaded content

#### 3. API Key Security
**Risk**: Documentation examples might encourage insecure API key handling.

**Required Documentation**:
- Never hardcode Gemini API keys in config files
- Use environment variables (reference .env.example)
- Document minimum required API permissions

#### 4. Rate Limiting & Costs
**Risk**: Users may trigger expensive API calls or rate limits.

**Required Documentation**:
- Gemini API costs per search operation
- Estimated API calls per scene (query generation + search + selection = 3+ calls minimum)
- Rate limit guidance (how many scenes per hour/day is safe)
- How to monitor API usage

#### 5. Legal & Copyright
**Risk**: Scraped images may violate copyright or terms of service.

**Required Documentation**:
- Add disclaimer: "Users are responsible for ensuring appropriate licensing of scraped images"
- Note that stock APIs (Pexels, Unsplash) provide licensed content, web scraping does not
- Recommend manual review for commercial use
- Consider adding `sourceUrl` to attribution

## Deliverables

### 1. README Update

#### Location: `README.md`

**Insertion Point**: After line 80 (end of individual stages section), before "## Creating a new story"

**Validation Before Editing**:
1. Verify current README.md has the 7-stage pipeline section
2. Backup README.md: `cp README.md README.md.backup`
3. Confirm line 80 ends with the render command example

Add a new section after the existing pipeline documentation:

```markdown
## Web Scraping for Images

The gather command supports web scraping as an alternative to stock media APIs. This allows for more flexible image sourcing using AI-powered web search.

### Basic Usage

```bash
# Enable scrape mode with --scrape flag
npm run gather -- --project <project-id> --scrape

# Combine with preview mode for testing
npm run gather -- --project <project-id> --scrape --preview
```

### How It Works

1. **Query Generation**: Gemini AI analyzes scene descriptions and generates 1-3 optimized search queries
2. **Web Search**: Gemini searches the web and returns 10-20 candidate image URLs per query
3. **Download & Validation**: Images are downloaded and validated against quality criteria:
   - Minimum resolution: 1920x1080
   - Aspect ratio matching (16:9 or 9:16)
   - Format: JPEG, PNG, or WebP
   - File size: 100KB - 10MB
4. **AI Selection**: Gemini evaluates 5-10 candidates and selects the best match based on:
   - Scene relevance (40%)
   - Technical quality (30%)
   - Aesthetic appeal (20%)
   - Aspect ratio match (10%)

### Configuration

Edit `config/stock-assets.config.json` to customize web scraping behavior:

```json
{
  "webScrape": {
    "enabled": true,
    "candidateCount": {
      "min": 5,
      "max": 10
    },
    "quality": {
      "minWidth": 1920,
      "minHeight": 1080,
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
    }
  }
}
```

#### Configuration Options

**candidateCount**
- `min`: Minimum valid images required (default: 5)
- `max`: Maximum candidates to consider (default: 10)

**quality**
- `minWidth`: Minimum image width in pixels (default: 1920)
- `minHeight`: Minimum image height in pixels (default: 1080)
- `maxWidth`: Maximum image width (default: 7680)
- `maxHeight`: Maximum image height (default: 4320)
- `allowedFormats`: Accepted image formats (default: jpeg, jpg, png, webp)
- `minSizeBytes`: Minimum file size in bytes (default: 100KB)
- `maxSizeBytes`: Maximum file size in bytes (default: 10MB)
- `aspectRatio.target`: Target aspect ratio (default: 1.777778 for 16:9)
- `aspectRatio.tolerance`: Acceptable deviation from target (default: 0.3 or 30%)

**selection.weights**
- `sceneRelevance`: Weight for scene matching (0-1, default: 0.4)
- `technicalQuality`: Weight for image quality (0-1, default: 0.3)
- `aestheticAppeal`: Weight for composition (0-1, default: 0.2)
- `aspectRatioMatch`: Weight for aspect ratio (0-1, default: 0.1)

All weights should sum to 1.0.

### Requirements

- **Gemini CLI**: Must be installed and configured
- **Internet Connection**: Required for web search
- **Disk Space**: ~50-100MB for temporary downloads per scene
- **Configuration**: `webScrape.enabled` must be `true` in config

### Limitations

- Only images are scraped (videos still use stock APIs)
- Scraped images are not stored in the local library (project-specific only)
- Search quality depends on Gemini's web search capabilities
- May be slower than stock API searches (~60 seconds per scene)

### Troubleshooting

**Error: "webScrape configuration not found"**
- Add the `webScrape` section to `config/stock-assets.config.json`

**Error: "Web scraping is disabled"**
- Set `webScrape.enabled: true` in configuration

**Warning: "Insufficient valid images"**
- Lower `candidateCount.min` in configuration
- Adjust quality requirements to be less strict
- Check scene descriptions are clear and specific

**Images are low quality**
- Increase `minWidth` and `minHeight`
- Adjust `selection.weights` to prioritize `technicalQuality`
- Check downloaded images in `cache/scrape-temp` for debugging

### Performance Tips

- Use `--preview` for testing to limit segments processed
- Adjust `candidateCount.max` to control download volume
- Monitor `cache/scrape-temp` directory size
- Ensure stable internet connection for reliable results

### Examples

**Portrait videos (9:16)**
```bash
# Adjust aspect ratio in config for portrait orientation
# Edit config/stock-assets.config.json:
# "aspectRatio": { "target": 0.5625, "tolerance": 0.3 }

npm run gather -- --project short-video-123 --scrape
```

**High-resolution requirement**
```bash
# Edit config to require 4K images
# "minWidth": 3840, "minHeight": 2160

npm run gather -- --project 4k-video-456 --scrape
```

**Fast iteration**
```bash
# Lower candidate count for faster processing
# "candidateCount": { "min": 3, "max": 5 }

npm run gather -- --project test-789 --scrape --preview
```
```

---

### 2. Configuration Documentation

#### File: `config/README.md` (CREATE NEW FILE)

**Pre-Check**: Verify this file does not exist: `test ! -f config/README.md && echo "OK to create" || echo "File exists - review before overwriting"`

**Action**: Create new file with the following content

```markdown
# Configuration Guide

## Web Scraping Configuration

### Overview
The `webScrape` section in `config/stock-assets.config.json` controls web scraping behavior for image gathering.

### Configuration Schema

```typescript
interface WebScrapeConfig {
  enabled: boolean;
  candidateCount: {
    min: number;     // 1-20, default: 5
    max: number;     // 1-20, default: 10
  };
  quality: {
    minWidth: number;              // pixels, default: 1920
    minHeight: number;             // pixels, default: 1080
    maxWidth?: number;             // pixels, optional
    maxHeight?: number;            // pixels, optional
    allowedFormats: string[];      // default: ['jpeg', 'jpg', 'png', 'webp']
    minSizeBytes: number;          // bytes, default: 102400 (100KB)
    maxSizeBytes: number;          // bytes, default: 10485760 (10MB)
    aspectRatio: {
      target: number;              // ratio, default: 1.777778 (16:9)
      tolerance: number;           // 0-1, default: 0.3
    };
  };
  selection: {
    weights: {
      sceneRelevance: number;      // 0-1, default: 0.4
      technicalQuality: number;    // 0-1, default: 0.3
      aestheticAppeal: number;     // 0-1, default: 0.2
      aspectRatioMatch: number;    // 0-1, default: 0.1
    };
  };
  download: {
    timeoutMs: number;             // milliseconds, default: 30000
    retryAttempts: number;         // 0-10, default: 3
    retryDelayMs: number;          // milliseconds, default: 1000
    userAgent: string;             // default: 'Mozilla/5.0...'
    maxConcurrent: number;         // 1-20, default: 5
  };
  gemini: {
    searchModel: string;           // default: 'gemini-2.0-flash-lite' (verify availability)
    selectionModel: string;        // default: 'gemini-2.0-flash-lite' (verify availability)
  };
  cache: {
    tempDir: string;               // default: 'cache/scrape-temp'
    cleanupAfterSelection: boolean; // default: true
    maxTempSizeBytes: number;      // default: 524288000 (500MB)
  };
}
```

### Validation Rules

- All weights in `selection.weights` must sum to 1.0
- `candidateCount.max` must be ≥ `candidateCount.min`
- `maxWidth` must be > `minWidth` (if specified)
- `maxHeight` must be > `minHeight` (if specified)
- `maxSizeBytes` must be > `minSizeBytes`
- `aspectRatio.tolerance` must be between 0 and 1

### Common Configurations

#### Strict Quality (4K only)
```json
{
  "quality": {
    "minWidth": 3840,
    "minHeight": 2160,
    "maxSizeBytes": 20971520
  }
}
```

#### Fast Mode (fewer candidates)
```json
{
  "candidateCount": {
    "min": 3,
    "max": 5
  },
  "download": {
    "maxConcurrent": 10
  }
}
```

#### Prioritize Relevance
```json
{
  "selection": {
    "weights": {
      "sceneRelevance": 0.6,
      "technicalQuality": 0.2,
      "aestheticAppeal": 0.15,
      "aspectRatioMatch": 0.05
    }
  }
}
```

### Aspect Ratio Reference

| Format | Ratio | Decimal |
|--------|-------|---------|
| 16:9   | 16/9  | 1.7778  |
| 9:16   | 9/16  | 0.5625  |
| 4:3    | 4/3   | 1.3333  |
| 1:1    | 1/1   | 1.0000  |
| 21:9   | 21/9  | 2.3333  |
```

---

### 3. Developer Documentation

#### File: `docs/web-scraper-architecture.md` (CREATE NEW FILE)

**Pre-Check**:
1. Verify `docs/` directory exists: `mkdir -p docs`
2. Check if file exists: `test ! -f docs/web-scraper-architecture.md && echo "OK to create" || echo "File exists - review before overwriting"`

**Action**: Create new file with the following content

```markdown
# Web Scraper Architecture

## Overview
The web scraper system enables AI-powered image search and selection using Gemini's web search capabilities.

## Components

### 1. Type System (`cli/lib/scraper-types.ts`)
- **ScrapedImage**: Image data structure
- **QualityConfig**: Quality validation criteria
- **ImageRequirements**: Runtime validation requirements
- **ValidationResult**: Validation output
- **SelectionCriteria**: AI selection weights
- **Zod Schemas**: Runtime type validation

### 2. Image Validator (`cli/services/media/image-validator.ts`)
- Pre-validation using HEAD requests
- Full validation using Sharp library
- Quality score calculation
- Aspect ratio checking
- File size validation

### 3. Web Scraper Service (`cli/services/media/web-scraper.ts`)
- Orchestrates search workflow
- Manages concurrent downloads
- Coordinates AI operations
- Handles error scenarios
- Provides fallback mechanisms

### 4. Prompts (`config/prompts/web-scrape.prompt.ts`)
- Query generation prompt
- Web search prompt
- Image selection prompt

## Data Flow

```
Scene Description + Tags
         ↓
   Query Generation (Gemini)
         ↓
   Web Search (Gemini)
         ↓
   Pre-Validation (HEAD requests)
         ↓
   Parallel Downloads
         ↓
   Full Validation (Sharp)
         ↓
   Quality Scoring
         ↓
   AI Selection (Gemini)
         ↓
   Best Image Selected
```

## Error Handling

### Error Types
1. **WebScraperError**: Operation-specific errors
2. **ImageValidationError**: Quality validation failures
3. **ImageDownloadError**: Network/download failures

### Recovery Strategies
- Query generation fails → Use tag-based fallback
- Search fails → Try next query
- Download fails → Skip image, continue with others
- Selection fails → Use highest quality score

## Extension Points

### Custom Validators
```typescript
class CustomValidator extends ImageQualityValidator {
  // Override validation methods
}

const scraper = new WebScraperService(
  aiProvider,
  config,
  downloader,
  new CustomValidator(config.quality)
);
```

### Custom Selection Criteria
```typescript
const customCriteria = {
  sceneRelevance: 0.5,
  technicalQuality: 0.3,
  aestheticAppeal: 0.1,
  aspectRatioMatch: 0.1,
};

scraper.selectBestImage(candidates, scene, customCriteria);
```

## Performance Considerations

- **Parallel Downloads**: Controlled by `maxConcurrent` config
- **Early Termination**: Stops when enough valid images found
- **HEAD Requests**: Avoid downloading invalid images
- **Temp File Cleanup**: Automatic cleanup after selection

## Testing

- Unit tests with mocks
- Integration tests with real AI calls
- E2E tests with full pipeline
- Performance benchmarks

## Future Enhancements

- Local library integration
- Vision model validation
- Custom search providers
- Advanced caching
```

---

### 4. API Documentation

#### File: `docs/api/web-scraper-api.md` (CREATE NEW FILE)

**Pre-Check**:
1. Verify `docs/api/` directory exists: `mkdir -p docs/api`
2. Check if file exists: `test ! -f docs/api/web-scraper-api.md && echo "OK to create" || echo "File exists - review before overwriting"`

**Action**: Create new file with the following content

```markdown
# Web Scraper API Documentation

## WebScraperService

### Constructor

```typescript
constructor(
  aiProvider: AIProvider,
  config: WebScrapeConfig,
  downloader?: MediaDownloader,
  validator?: ImageQualityValidator
)
```

Creates a new web scraper service instance.

**Parameters:**
- `aiProvider` - AI provider for Gemini operations (required)
- `config` - Web scraping configuration (required)
- `downloader` - Media downloader instance (optional, auto-created if not provided)
- `validator` - Image validator instance (optional, auto-created if not provided)

**Example:**
```typescript
const scraper = new WebScraperService(
  geminiProvider,
  stockConfig.webScrape
);
```

---

### searchImagesForScene

```typescript
async searchImagesForScene(
  sceneDescription: string,
  tags: string[],
  options: ImageSearchOptions
): Promise<ScrapedImage[]>
```

Search for images for a scene using web scraping.

**Parameters:**
- `sceneDescription` - Full scene text
- `tags` - Visual tags extracted from scene
- `options` - Image search options (orientation, dimensions)

**Returns:**
- Array of 5-10 validated candidate images

**Throws:**
- `WebScraperError` if insufficient valid images found

**Example:**
```typescript
const candidates = await scraper.searchImagesForScene(
  'A beautiful mountain landscape at sunset',
  ['mountain', 'sunset', 'landscape'],
  { perTag: 10, orientation: '16:9' }
);
```

---

### selectBestImage

```typescript
async selectBestImage(
  candidates: ScrapedImage[],
  sceneDescription: string,
  criteria?: SelectionCriteria
): Promise<ScrapedImage>
```

Select the best image from candidates using Gemini AI.

**Parameters:**
- `candidates` - Array of validated candidate images
- `sceneDescription` - Scene description for context
- `criteria` - Optional selection criteria (uses config defaults if not provided)

**Returns:**
- The best candidate image

**Throws:**
- `WebScraperError` if no candidates provided

**Example:**
```typescript
const bestImage = await scraper.selectBestImage(
  candidates,
  'A mountain landscape at sunset'
);
```

---

## ImageQualityValidator

### Constructor

```typescript
constructor(config: QualityConfig)
```

Creates a new image validator instance.

**Parameters:**
- `config` - Quality validation criteria

---

### preValidateImage

```typescript
async preValidateImage(url: string): Promise<PreValidationResult>
```

Pre-validate image URL using HEAD request.

**Parameters:**
- `url` - Image URL to validate

**Returns:**
- Validation result with errors (if any)

---

### validateImage

```typescript
async validateImage(
  imagePath: string,
  requirements: ImageRequirements
): Promise<ValidationResult>
```

Validate downloaded image file.

**Parameters:**
- `imagePath` - Local path to image
- `requirements` - Image quality requirements

**Returns:**
- Validation result with metadata and quality score

---

## Types

### ScrapedImage
```typescript
interface ScrapedImage {
  id: string;
  url: string;
  sourceUrl: string;
  width: number;
  height: number;
  format: 'jpeg' | 'png' | 'webp';
  sizeBytes: number;
  tags: string[];
  metadata?: ImageMetadata;
  downloadedPath?: string;
}
```

### ValidationResult
```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: ImageMetadata;
  qualityScore?: number;
}
```

### SelectionCriteria
```typescript
interface SelectionCriteria {
  sceneRelevance: number;      // 0-1
  technicalQuality: number;    // 0-1
  aestheticAppeal: number;     // 0-1
  aspectRatioMatch: number;    // 0-1
}
```
```

---

## Acceptance Criteria

### Pre-Implementation Validation
- [ ] All Phase 1-4 code files verified to exist (see Prerequisites section)
- [ ] All Phase 4 tests passing
- [ ] `webScrape` config section added to `config/stock-assets.config.json`
- [ ] Config JSON validation passes
- [ ] Backup of existing README.md created

### README
- [ ] Web scraping section added at correct insertion point (after line 80)
- [ ] All code examples use actual project structure (verified paths)
- [ ] Usage examples tested with real `--scrape` flag
- [ ] Configuration examples match actual config schema
- [ ] Requirements list matches actual dependencies (package.json)
- [ ] Limitations verified against actual implementation
- [ ] Troubleshooting guide covers real error messages from code
- [ ] Line numbers in examples verified against actual files

### Configuration Guide
- [ ] TypeScript schema matches actual `cli/lib/scraper-types.ts` definitions
- [ ] Validation rules match actual Zod schema validation
- [ ] Common configurations tested and verified to work
- [ ] Aspect ratio reference calculations verified
- [ ] All config paths reference actual file locations

### Developer Docs
- [ ] Architecture diagram reflects actual component structure
- [ ] File paths verified to exist in codebase
- [ ] Data flow matches actual implementation
- [ ] Error handling examples reference actual error classes
- [ ] Extension points are actually extensible (code review confirms)
- [ ] Testing approach matches actual test files in `tests/` directory

### API Docs
- [ ] All public methods exist in actual code
- [ ] Method signatures match actual TypeScript definitions
- [ ] Parameters documented with actual required/optional status
- [ ] Return types match actual TypeScript return types
- [ ] Examples use real type imports from actual files
- [ ] All referenced types exist in `cli/lib/scraper-types.ts`

### Documentation Quality
- [ ] No broken internal links between docs
- [ ] All code examples are syntax-valid (linter check)
- [ ] All JSON examples are valid JSON
- [ ] TypeScript examples compile without errors
- [ ] Markdown renders correctly (preview check)
- [ ] No orphaned references to non-existent files

---

## Dependencies

### Code Dependencies (MUST exist before starting)
- Phase 1-4 implementation complete (all files in Prerequisites section)
- All Phase 4 tests passing (`npm test` succeeds)
- `sharp` library available for image metadata extraction examples
- `zod` library available for schema validation examples

### Tool Dependencies
- Markdown linter (e.g., `markdownlint-cli`)
- JSON validator (e.g., `jsonlint` or `jq`)
- TypeScript compiler for code example validation
- Markdown preview tool (e.g., VS Code, Grip, or similar)

### Documentation Standards
- Follow existing README.md formatting style
- Use CommonMark-compliant markdown
- Code blocks must specify language (```typescript, ```json, ```bash)
- Maximum line length: 120 characters for prose, unlimited for code blocks

---

## Estimated Time
**4-6 hours** (revised from 1-2 hours)

**Breakdown**:
- README update: 1.5 hours (writing + validation + testing examples)
- Configuration guide: 1 hour (schema documentation + verification)
- Developer docs: 1.5 hours (architecture + code verification)
- API docs: 1 hour (method documentation + type verification)
- Validation & fixes: 1 hour (link checking, code validation, corrections)

**Factors Affecting Duration**:
- Need to verify all code examples against actual implementation
- Must test all configuration examples
- Requires validation of TypeScript types and signatures
- May need to update examples if code doesn't match spec

---

## Validation Checklist

Before marking documentation complete, run these validation steps:

### 1. File Existence Validation
```bash
# Verify all documented files exist
test -f cli/lib/scraper-types.ts || echo "ERROR: scraper-types.ts missing"
test -f cli/services/media/web-scraper.ts || echo "ERROR: web-scraper.ts missing"
test -f cli/services/media/image-validator.ts || echo "ERROR: image-validator.ts missing"
test -f config/prompts/web-scrape.prompt.ts || echo "ERROR: web-scrape.prompt.ts missing"
```

### 2. Config Validation
```bash
# Validate JSON syntax
node -e "require('./config/stock-assets.config.json')" || echo "ERROR: Invalid JSON"

# Verify webScrape section exists
grep -q '"webScrape"' config/stock-assets.config.json || echo "ERROR: webScrape section missing"
```

### 3. Code Example Validation
```bash
# Extract TypeScript code blocks from docs and validate
# (Manual review or custom script required)

# Verify all import paths in examples exist
# (Manual review required)
```

### 4. Markdown Validation
```bash
# Lint all markdown files
npx markdownlint README.md config/README.md docs/**/*.md

# Check for broken internal links
# (Manual review or tool like markdown-link-check)
```

### 5. Integration Test
```bash
# Test the documented --scrape flag actually works
npm run gather -- --project test-project --scrape --preview
```

---

## Rollback Plan

If documentation introduces errors or inaccuracies:

1. **README.md**: Restore from backup (`mv README.md.backup README.md`)
2. **New files**: Delete created files:
   ```bash
   rm -f config/README.md
   rm -f docs/web-scraper-architecture.md
   rm -f docs/api/web-scraper-api.md
   ```
3. **Config file**: Revert `webScrape` section addition (manual edit or git revert)
4. **Git safety**: Commit each documentation file separately for easy reversion

---

## Notes
- Keep documentation concise and practical
- Provide real-world examples **that have been tested**
- Include troubleshooting for common issues **with actual error messages from implementation**
- Link to related documentation where appropriate
- Keep API docs synchronized with code **using automated validation where possible**
- **CRITICAL**: Verify every code example, file path, and type reference against actual implementation
- **CRITICAL**: Test all configuration examples before documenting them
- Update this spec if implementation differs from original design (Phases 1-4)
