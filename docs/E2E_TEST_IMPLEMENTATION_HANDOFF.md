# E2E Test Implementation Handoff Document

## Document Purpose

This document provides everything needed to continue implementing the comprehensive E2E test suite for the Remotion P2V pipeline across multiple work sessions. Use this as your guide to pick up where you left off.

---

## Quick Start for New Session

1. **Read this entire document** to understand the context
2. **Check the Implementation Status** section to see what's been completed
3. **Review the Current Priority** section to know what to work on next
4. **Reference the Detailed Plan** at `/home/jeffreymoya/.claude/plans/imperative-strolling-bubble.md`
5. **Start implementing** following the priority order

---

## Project Context

### What is Remotion P2V?

Remotion P2V is a 7-stage pipeline that generates videos from topics:

**Pipeline Stages:**
1. **Discover** → Google Trends → `discovered.json` (trending topics)
2. **Curate** → User selection → `selected.json` (chosen topic)
3. **Refine** → AI enhancement → `refined.json` (enriched context)
4. **Script** → AI script generation → `scripts/script-v1.json` (4-5 segments, ~720s)
5. **Gather** → Multi-process asset collection → `tags.json` + assets/* (MOST COMPLEX)
   - Tag extraction (3-5 per segment)
   - Media search (Pexels, Pixabay, Unsplash)
   - Google TTS with word-level timestamps
   - Emphasis detection with constraints
   - Background music (optional)
6. **Build** → Timeline assembly → `timeline.json` (word-level text, aspect-fit media)
7. **Render** → Remotion rendering → `output.mp4` (H.264, 30 FPS)

### Test Requirements

- **Scope:** Full pipeline (all 7 stages)
- **API Strategy:** Real APIs with rate limiting (Google TTS, Pexels, Pixabay, Unsplash)
- **Validation Levels:**
  1. Schema/structure validation
  2. Content correctness (timing, emphasis, media matching)
  3. Rendered output quality (frame accuracy, audio sync)
- **Priority:** Comprehensive edge case coverage

### Existing Test Infrastructure

**Current Tests:**
- ✅ `tests/schema.test.ts` - Zod schema validation
- ✅ `tests/timeline.test.ts` - Timeline assembly
- ✅ `tests/aspect-processor.test.ts` - Aspect ratio processing
- ✅ `tests/word-timing.test.ts` - Frame/timing conversion
- ✅ `tests/e2e/word-sync.test.ts` - Word-level timing E2E
- ✅ `tests/integration/phase3-aspect-fit.test.ts` - Aspect fit integration

**Test Framework:** Node.js built-in `node:test` module with `assert/strict`

---

## Implementation Status

### ✅ Completed
- [x] Planning phase (approved plan at `/home/jeffreymoya/.claude/plans/imperative-strolling-bubble.md`)
- [x] User requirements gathered
- [x] Todo list created
- [x] **Priority 1: Test Infrastructure (6/6 files)** ✨
  - [x] `tests/e2e/helpers/test-project-manager.ts`
  - [x] `tests/e2e/helpers/api-key-validator.ts`
  - [x] `tests/e2e/helpers/rate-limiter.ts`
  - [x] `tests/e2e/helpers/assertions.ts`
  - [x] `tests/e2e/helpers/fixtures.ts`
  - [x] `tests/e2e/helpers/cleanup.ts`
- [x] **Priority 2: Core E2E Tests (3/3 files)** ✨
  - [x] `tests/e2e/full-pipeline.test.ts`
  - [x] `tests/e2e/stage-gather.test.ts`
  - [x] `tests/e2e/stage-build.test.ts`

### ✅ Completed (continued)
- [x] **Priority 3: Individual Stage Tests (5/5 files)** ✨
  - [x] `tests/e2e/stage-discover.test.ts`
  - [x] `tests/e2e/stage-curate.test.ts`
  - [x] `tests/e2e/stage-refine.test.ts`
  - [x] `tests/e2e/stage-script.test.ts`
  - [x] `tests/e2e/stage-render.test.ts`
- [x] **Priority 4: Edge Case Tests (6/6 files)** ✨
  - [x] `tests/e2e/edge-cases/api-failures.test.ts`
  - [x] `tests/e2e/edge-cases/rate-limiting.test.ts`
  - [x] `tests/e2e/edge-cases/network-resilience.test.ts`
  - [x] `tests/e2e/edge-cases/media-edge-cases.test.ts`
  - [x] `tests/e2e/edge-cases/emphasis-constraints.test.ts`
  - [x] `tests/e2e/edge-cases/malformed-data.test.ts`
- [x] **Priority 5: Configuration (3/3 files)** ✨
  - [x] `tests/scripts/check-api-keys.sh`
  - [x] `.github/workflows/e2e-tests.yml`
  - [x] `package.json` (test scripts added)

**Total Progress:** 23/23 files completed (100%) 🎉

---

## Current Status: ALL PRIORITIES COMPLETE! 🎉

**Status:** All 23 files across 5 priorities have been successfully implemented! ✨

The comprehensive E2E test suite for Remotion P2V is now complete and ready for use.

## Implementation Summary

### 1. `tests/e2e/helpers/test-project-manager.ts` (START HERE)

**Purpose:** Manage isolated test project lifecycle

**Key Requirements:**
- Create test projects in OS temp directory (use `os.tmpdir()`)
- Symlink into `/public/projects/` during test execution
- Clean up after tests complete
- Preserve artifacts on failure for debugging
- Validate project structure per pipeline stage

**Interface to Implement:**
```typescript
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs-extra';

export type PipelineStage = 'discover' | 'curate' | 'refine' | 'script' | 'gather' | 'build' | 'render';

export interface TestProject {
  id: string;
  paths: {
    root: string;
    discovered: string;
    selected: string;
    refined: string;
    scripts: string;
    assets: string;
    images: string;
    videos: string;
    audio: string;
    music: string;
    timeline: string;
  };
  createdAt: Date;
  stage: PipelineStage;
}

export class TestProjectManager {
  private static testProjects: Map<string, TestProject> = new Map();

  static async createTestProject(name: string): Promise<TestProject>;
  static async cleanupTestProject(projectId: string): Promise<void>;
  static async preserveTestProject(projectId: string, reason: string): Promise<string>;
  static async validateProjectStructure(projectId: string, stage: PipelineStage): Promise<void>;
  static async cleanupAllTestProjects(): Promise<void>;
}
```

**Implementation Notes:**
- Use `fs-extra` for file operations (already in dependencies)
- Temp directory pattern: `${os.tmpdir()}/remotion-p2v-test-${Date.now()}-${randomId}`
- Symlink from temp to `/public/projects/${projectId}`
- Create all necessary subdirectories: assets/{images,videos,audio,music}, scripts/
- Validation should check for required files per stage:
  - `discover`: discovered.json
  - `curate`: selected.json
  - `refine`: refined.json
  - `script`: scripts/script-v1.json
  - `gather`: tags.json + assets/*
  - `build`: timeline.json
  - `render`: output.mp4

**Dependencies:** None (this is the foundation)

---

### 2. `tests/e2e/helpers/api-key-validator.ts`

**Purpose:** Validate API keys before running expensive tests

**Key Requirements:**
- Check environment variables exist
- Validate format (not placeholder like `${VAR_NAME}`)
- Make minimal test API call to verify connectivity
- Skip tests gracefully if keys missing (don't fail)
- Cache validation results for session

**Interface to Implement:**
```typescript
export interface APIKeyValidationResult {
  provider: string;
  keyName: string;
  exists: boolean;
  isValid: boolean;
  error?: string;
}

export class APIKeyValidator {
  static async validateGoogleTTS(): Promise<APIKeyValidationResult>;
  static async validatePexels(): Promise<APIKeyValidationResult>;
  static async validatePixabay(): Promise<APIKeyValidationResult>;
  static async validateUnsplash(): Promise<APIKeyValidationResult>;
  static async validateAll(): Promise<APIKeyValidationResult[]>;
  static shouldSkipTests(results: APIKeyValidationResult[]): boolean;
}
```

**Required Keys:**
- `GOOGLE_TTS_API_KEY` - Required for TTS
- `PEXELS_API_KEY` - Primary media provider
- `PIXABAY_API_KEY` - Fallback media provider
- `UNSPLASH_ACCESS_KEY` - Fallback media provider

**Implementation Notes:**
- For Google TTS: Check if key exists and is not a placeholder
- For media providers: Make minimal API call (e.g., search for "test" with limit=1)
- Cache results in memory for the test session
- Return detailed error messages for debugging

**Dependencies:** None

---

### 3. `tests/e2e/helpers/rate-limiter.ts`

**Purpose:** Prevent API rate limit violations during tests

**Key Requirements:**
- Track API calls in-memory during test run
- Implement exponential backoff if limits approached
- Support different limits per provider
- Provide CLI flag to bypass for CI

**Interface to Implement:**
```typescript
export interface RateLimitConfig {
  provider: string;
  requestsPerMinute?: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
}

export class RateLimiter {
  private static callLog: Map<string, number[]> = new Map();

  static async throttle(provider: string): Promise<void>;
  static recordCall(provider: string): void;
  static canMakeCall(provider: string): boolean;
  static getCallCount(provider: string, windowMs: number): number;
  static reset(): void;
  static setIgnoreRateLimits(ignore: boolean): void;
}
```

**Rate Limits:**
- Pexels: 200 req/min, 20,000 req/month
- Unsplash: 50 req/hour
- Pixabay: 100 req/min
- Google TTS: 60 req/min (conservative)

**Implementation Notes:**
- Store timestamps of API calls in array per provider
- Before each call, check if limit would be exceeded
- If yes, calculate wait time and delay
- Respect `--ignore-rate-limits` env var for CI
- Clean up old timestamps outside the window

**Dependencies:** None

---

### 4. `tests/e2e/helpers/assertions.ts`

**Purpose:** Custom assertion helpers for all validation levels

**Key Requirements:**
- Schema validation using existing Zod schemas
- Content correctness (timing, emphasis, quality)
- File validation (audio, video, images)
- Rendered output validation (using ffmpeg)

**Interface to Implement:**
```typescript
import { Timeline } from '../../../src/lib/types';

// Schema Validation
export function assertValidTimeline(timeline: unknown): void;
export function assertValidManifest(manifest: unknown): void;
export function assertValidScript(script: unknown): void;

// Content Correctness
export interface WordData {
  word: string;
  startMs: number;
  endMs: number;
}

export interface EmphasisData {
  wordIndex: number;
  level: 'high' | 'med' | 'none';
  tone?: 'warm' | 'intense';
}

export function assertWordTimingAccuracy(words: WordData[], toleranceMs?: number): void;
export function assertEmphasisConstraints(emphases: EmphasisData[], wordCount: number): void;
export function assertMediaQuality(media: any, minScore: number): void;

// File Validation
export async function assertAudioFile(path: string, minDurationMs: number): Promise<void>;
export async function assertVideoFile(path: string, minDurationMs: number, minWidth: number): Promise<void>;
export async function assertImageFile(path: string, minWidth: number, minHeight: number): Promise<void>;

// Rendered Output
export async function assertVideoFrameRate(videoPath: string, expectedFPS?: number): Promise<void>;
export async function assertAudioSync(videoPath: string, timeline: Timeline, toleranceMs?: number): Promise<void>;
export async function assertVideoCodec(videoPath: string, expectedCodec: string): Promise<void>;
export async function assertVideoDimensions(videoPath: string, width: number, height: number): Promise<void>;
```

**Implementation Notes:**
- Use existing Zod schemas from `src/lib/types.ts`
- Word timing: check no overlaps, gaps ≤50ms tolerance
- Emphasis constraints:
  - Total ≤20% of words
  - High ≤5% of words
  - Gap ≥3 indices between high emphasis
- Use `ffprobe` (from ffmpeg) to inspect video files
- Use file size + magic bytes to validate audio/video/image files

**Dependencies:**
- Requires Zod schemas from `src/lib/types.ts`
- Requires `ffmpeg/ffprobe` installed on system

---

### 5. `tests/e2e/helpers/fixtures.ts`

**Purpose:** Standard mock data for predictable testing

**Key Requirements:**
- Mock data for each pipeline stage
- Realistic data structures matching schemas
- Reusable across all tests
- Easy to modify for specific test scenarios

**Interface to Implement:**
```typescript
export const mockDiscoveredTopics = { /* ... */ };
export const mockSelectedTopic = { /* ... */ };
export const mockRefinedTopic = { /* ... */ };
export const mockScript = { /* ... */ };
export const mockTags = { /* ... */ };
export const mockManifest = { /* ... */ };
export const mockTimeline = { /* ... */ };
export const mockWordTimestamps = [ /* ... */ ];
export const mockEmphasisData = [ /* ... */ ];
```

**Implementation Notes:**
- Base fixtures on existing test data from `tests/e2e/word-sync.test.ts`
- Ensure all fixtures pass schema validation
- Include edge cases: empty arrays, minimal data, maximal data
- Add helper functions to generate fixtures with variations

**Dependencies:**
- Requires Zod schemas from `src/lib/types.ts`

---

### 6. `tests/e2e/helpers/cleanup.ts`

**Purpose:** Artifact cleanup utilities

**Key Requirements:**
- Clean up test projects
- Remove downloaded media
- Clear caches
- Preserve artifacts on failure

**Interface to Implement:**
```typescript
export class CleanupManager {
  static async cleanupTestArtifacts(projectId: string): Promise<void>;
  static async preserveArtifacts(projectId: string, testName: string): Promise<string>;
  static async cleanupAllTestArtifacts(): Promise<void>;
  static async clearProviderCaches(): Promise<void>;
}
```

**Implementation Notes:**
- Use `TestProjectManager` for project cleanup
- Move preserved artifacts to `tests/reports/e2e/failures/${testName}-${timestamp}/`
- Clear TTS and media provider caches between tests
- Log all cleanup actions for debugging

**Dependencies:**
- Requires `TestProjectManager`

---

## Priority 2: Core E2E Tests (After Priority 1)

### Files to Create:

1. **`tests/e2e/full-pipeline.test.ts`** - Complete 7-stage integration test
2. **`tests/e2e/stage-gather.test.ts`** - Most complex stage (media + TTS + emphasis)
3. **`tests/e2e/stage-build.test.ts`** - Timeline assembly validation

**Note:** These tests will use ALL the helpers from Priority 1, so Priority 1 must be complete first.

---

## Priority 3: Individual Stage Tests (After Priority 2)

### Files to Create:

1. **`tests/e2e/stage-discover.test.ts`** - Google Trends → discovered.json
2. **`tests/e2e/stage-curate.test.ts`** - Topic selection → selected.json
3. **`tests/e2e/stage-refine.test.ts`** - AI enhancement → refined.json
4. **`tests/e2e/stage-script.test.ts`** - AI script generation → script-v1.json
5. **`tests/e2e/stage-render.test.ts`** - Remotion rendering → output.mp4

---

## Priority 4: Edge Case Tests (After Priority 3)

### Files to Create:

Create directory: `tests/e2e/edge-cases/`

1. **`api-failures.test.ts`** - Missing keys, provider failures, rate limits
2. **`rate-limiting.test.ts`** - Respect limits, quota exhaustion
3. **`network-resilience.test.ts`** - Retries, timeouts, DNS failures
4. **`media-edge-cases.test.ts`** - Empty results, low quality, corrupted downloads
5. **`emphasis-constraints.test.ts`** - Density caps, gap enforcement
6. **`malformed-data.test.ts`** - Invalid JSON, missing fields, backward compatibility

---

## Priority 5: Configuration (Final Step)

### Files to Create/Modify:

1. **`tests/scripts/check-api-keys.sh`** - API validation script for CI
2. **`.github/workflows/e2e-tests.yml`** - GitHub Actions workflow
3. **`package.json`** - Add test scripts

**Test Scripts to Add:**
```json
{
  "scripts": {
    "test:e2e": "tsx tests/e2e/full-pipeline.test.ts",
    "test:e2e:fast": "TEST_PREVIEW_ONLY=true npm run test:e2e",
    "test:e2e:stage:discover": "tsx tests/e2e/stage-discover.test.ts",
    "test:e2e:stage:curate": "tsx tests/e2e/stage-curate.test.ts",
    "test:e2e:stage:refine": "tsx tests/e2e/stage-refine.test.ts",
    "test:e2e:stage:script": "tsx tests/e2e/stage-script.test.ts",
    "test:e2e:stage:gather": "tsx tests/e2e/stage-gather.test.ts",
    "test:e2e:stage:build": "tsx tests/e2e/stage-build.test.ts",
    "test:e2e:stage:render": "tsx tests/e2e/stage-render.test.ts",
    "test:edge-cases": "tsx tests/e2e/edge-cases/*.test.ts"
  }
}
```

---

## Implementation Guidelines

### Test Structure Pattern

All E2E tests should follow this pattern:

```typescript
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { TestProjectManager } from './helpers/test-project-manager';
import { APIKeyValidator } from './helpers/api-key-validator';
import { RateLimiter } from './helpers/rate-limiter';
import * as assertions from './helpers/assertions';

describe('Stage Name E2E Test', { timeout: 600000 }, () => {
  let testProject;

  beforeEach(async () => {
    // Validate API keys
    const apiValidation = await APIKeyValidator.validateAll();
    if (APIKeyValidator.shouldSkipTests(apiValidation)) {
      console.log('⏭️  Skipping test: Missing required API keys');
      return;
    }

    // Create test project
    testProject = await TestProjectManager.createTestProject('test-stage-name');
  });

  afterEach(async () => {
    // Cleanup
    if (testProject) {
      await TestProjectManager.cleanupTestProject(testProject.id);
    }
    RateLimiter.reset();
  });

  it('should validate stage output', async () => {
    // Test implementation
  });
});
```

### Key Coding Standards

1. **Use Node.js built-in test framework:** `node:test` module
2. **Use strict assertions:** `assert/strict`
3. **Set appropriate timeouts:**
   - Unit tests: 5s
   - Integration tests: 30s
   - E2E tests: 10 min (600000ms)
   - Render tests: 20 min (1200000ms)
4. **Always clean up:** Use `beforeEach`/`afterEach` for setup/teardown
5. **Handle API failures gracefully:** Skip tests if API keys missing
6. **Use rate limiting:** Call `RateLimiter.throttle()` before API calls
7. **Preserve artifacts on failure:** Use `TestProjectManager.preserveTestProject()`
8. **Use existing utilities:** Leverage helpers from `cli/services/`, `src/lib/`

---

## Testing the Tests

After implementing each helper or test file:

1. **Run the test:** `tsx tests/e2e/[filename].test.ts`
2. **Check for errors:** Fix any TypeScript or runtime errors
3. **Verify cleanup:** Ensure no artifacts left in `/public/projects/` or temp dirs
4. **Test edge cases:** Try with missing API keys, network issues, etc.
5. **Update this document:** Mark the file as completed in Implementation Status

---

## Reference Files

### Key Existing Files to Reference:

**Pipeline Commands:**
- `cli/commands/discover.ts` - Stage 1
- `cli/commands/curate.ts` - Stage 2
- `cli/commands/refine.ts` - Stage 3
- `cli/commands/script.ts` - Stage 4
- `cli/commands/gather.ts` - Stage 5 (MOST COMPLEX)
- `cli/commands/build.ts` - Stage 6
- `cli/commands/render.ts` - Stage 7

**Services:**
- `cli/services/tts/google-tts.ts` - TTS with word timestamps
- `cli/services/media/stock-search.ts` - Media search across providers
- `cli/services/media/downloader.ts` - Media download
- `cli/services/media/quality.ts` - Quality scoring
- `cli/services/ai/` - AI providers

**Types & Schemas:**
- `src/lib/types.ts` - All Zod schemas and TypeScript types

**Existing Tests:**
- `tests/e2e/word-sync.test.ts` - Good example of E2E test structure
- `tests/schema.test.ts` - Schema validation examples
- `tests/timeline.test.ts` - Timeline validation examples

**Config:**
- `config/video.config.json` - Video settings
- `config/tts.config.json` - TTS settings
- `config/stock-assets.config.json` - Media provider settings

---

## Environment Variables Required

```bash
# Required for E2E tests
GOOGLE_TTS_API_KEY=your_key_here
PEXELS_API_KEY=your_key_here
PIXABAY_API_KEY=your_key_here
UNSPLASH_ACCESS_KEY=your_key_here

# Optional test configuration
TEST_MODE=development|ci
TEST_PREVIEW_ONLY=true|false  # Use 10s preview for faster tests
TEST_IGNORE_RATE_LIMITS=true|false  # For CI environments
TEST_PRESERVE_ARTIFACTS=true|false  # Keep artifacts even on success
```

---

## Common Pitfalls to Avoid

1. **Don't pollute `/public/projects/`** - Always use temp directories
2. **Don't forget cleanup** - Always implement `afterEach` cleanup
3. **Don't skip API validation** - Check keys before expensive operations
4. **Don't ignore rate limits** - Use RateLimiter for all API calls
5. **Don't hardcode paths** - Use `path.join()` for cross-platform compatibility
6. **Don't assume API success** - Always handle errors and retries
7. **Don't test without schemas** - Validate all JSON outputs against Zod schemas
8. **Don't forget edge cases** - Test failures, empty results, timeouts
9. **Don't use placeholders** - Use real data structures from fixtures
10. **Don't skip documentation** - Comment complex logic and edge cases

---

## Success Criteria Per Phase

### Priority 1 (Infrastructure) Success:
- All 6 helper files created and working
- `TestProjectManager` can create/cleanup projects
- `APIKeyValidator` can validate all providers
- `RateLimiter` prevents quota violations
- Custom assertions work for all validation levels
- Fixtures available for all pipeline stages
- No test pollution in `/public/projects/`

### Priority 2 (Core E2E) Success:
- Full pipeline test runs end-to-end
- Stage-gather test validates all sub-processes
- Stage-build test validates timeline assembly
- All tests use real APIs with rate limiting
- All three validation levels working
- Artifacts preserved on failure

### Priority 3 (Individual Stages) Success:
- Each stage has dedicated E2E test
- Each test validates stage-specific outputs
- Tests run independently
- Clear error messages on failures

### Priority 4 (Edge Cases) Success:
- All failure scenarios covered
- Graceful handling of API issues
- Network resilience validated
- Malformed data handled correctly

### Priority 5 (Configuration) Success:
- CI/CD workflow working in GitHub Actions
- Test scripts available in package.json
- API key validation script works
- Tests run in <30 min (preview mode)

---

## How to Use This Document in a New Session

1. **Start with:** "I'm implementing the E2E test suite for Remotion P2V. I have a handoff document at `docs/E2E_TEST_IMPLEMENTATION_HANDOFF.md`. Please read it and continue where we left off."

2. **Check the detailed plan:** Refer to `/home/jeffreymoya/.claude/plans/imperative-strolling-bubble.md` for comprehensive details.

3. **Update status:** As you complete files, update the "Implementation Status" section in this document.

4. **Ask questions:** If anything is unclear, ask for clarification based on the context in this document.

5. **Test incrementally:** Don't wait until all files are done - test each helper as you build it.

---

## ✅ IMPLEMENTATION COMPLETE!

**All priorities have been successfully completed!**

### What's Been Delivered:

1. **Priority 1: Test Infrastructure (6 files)** - All helper utilities for test management
2. **Priority 2: Core E2E Tests (3 files)** - Full pipeline and critical stage tests
3. **Priority 3: Individual Stage Tests (5 files)** - Dedicated tests for each pipeline stage
4. **Priority 4: Edge Case Tests (6 files)** - Comprehensive edge case coverage
5. **Priority 5: Configuration (3 files)** - CI/CD setup and test scripts

### Next Steps for Usage:

1. **Set up API keys** in your environment or CI secrets
2. **Run tests locally** using the new npm scripts
3. **Configure GitHub Actions** secrets for CI/CD
4. **Review test results** and adjust as needed

---

## Document Metadata

- **Created:** 2025-11-29
- **Last Updated:** 2025-11-30
- **Completed:** 2025-11-30
- **Plan Location:** `/home/jeffreymoya/.claude/plans/imperative-strolling-bubble.md`
- **Total Files:** 23 (across 5 priorities)
- **Completion Status:** ✅ ALL COMPLETE (23/23 files, 100%)
- **Implementation Time:** 1 session (all priorities completed)

---

## Questions or Issues?

If you encounter issues or have questions:
1. Check the detailed plan at `/home/jeffreymoya/.claude/plans/imperative-strolling-bubble.md`
2. Review existing test files in `tests/` for patterns
3. Consult the pipeline command files in `cli/commands/`
4. Check service implementations in `cli/services/`
5. Review schemas in `src/lib/types.ts`
