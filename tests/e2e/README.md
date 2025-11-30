# Remotion P2V E2E Test Suite

Comprehensive end-to-end test suite for the Remotion P2V pipeline, covering all 7 stages from topic discovery to video rendering.

## 📁 Test Structure

```
tests/e2e/
├── helpers/                      # Test infrastructure (6 files)
│   ├── test-project-manager.ts  # Isolated test project management
│   ├── api-key-validator.ts     # API key validation
│   ├── rate-limiter.ts          # API rate limiting
│   ├── assertions.ts            # Custom validation helpers
│   ├── fixtures.ts              # Mock data for tests
│   └── cleanup.ts               # Artifact cleanup utilities
├── edge-cases/                   # Edge case tests (6 files)
│   ├── api-failures.test.ts     # API failure scenarios
│   ├── rate-limiting.test.ts    # Rate limit handling
│   ├── network-resilience.test.ts # Network errors & retries
│   ├── media-edge-cases.test.ts  # Media processing edge cases
│   ├── emphasis-constraints.test.ts # Emphasis validation
│   └── malformed-data.test.ts   # Invalid data handling
├── full-pipeline.test.ts        # Complete 7-stage pipeline test
├── stage-discover.test.ts       # Stage 1: Google Trends
├── stage-curate.test.ts         # Stage 2: Topic selection
├── stage-refine.test.ts         # Stage 3: AI enhancement
├── stage-script.test.ts         # Stage 4: Script generation
├── stage-gather.test.ts         # Stage 5: Asset collection (complex)
├── stage-build.test.ts          # Stage 6: Timeline assembly
└── stage-render.test.ts         # Stage 7: Video rendering
```

## 🚀 Quick Start

### 1. Set Up API Keys

Create a `.env` file or set environment variables:

```bash
export GOOGLE_TTS_API_KEY="your-google-tts-key"
export PEXELS_API_KEY="your-pexels-key"
export PIXABAY_API_KEY="your-pixabay-key"
export UNSPLASH_ACCESS_KEY="your-unsplash-key"
```

### 2. Validate API Keys

```bash
npm run check:api-keys
```

### 3. Run Tests

```bash
# Run all unit tests
npm run test

# Run edge case tests (no API calls, fast)
npm run test:edge-cases

# Run full E2E pipeline (preview mode, ~10min)
npm run test:e2e:fast

# Run full E2E pipeline (full render, ~30min)
npm run test:e2e

# Run everything
npm run test:all
```

## 📋 Available Test Scripts

### Unit & Integration Tests
```bash
npm run test:schema          # Zod schema validation
npm run test:paths           # Path configuration tests
npm run test:timeline        # Timeline assembly tests
npm run test:media-fallback  # Media provider fallback
npm run test:word-sync       # Word-level timing sync
npm run test:aspect          # Aspect ratio processing
npm run test:emphasis-validator # Emphasis constraint validation
npm run test:word-timing     # Frame/timing conversion
```

### E2E Tests - Individual Stages
```bash
npm run test:e2e:stage:discover  # Google Trends → discovered.json
npm run test:e2e:stage:curate    # Selection → selected.json
npm run test:e2e:stage:refine    # AI enhance → refined.json
npm run test:e2e:stage:script    # Script gen → script-v1.json
npm run test:e2e:stage:gather    # Assets → tags.json + media
npm run test:e2e:stage:build     # Timeline → timeline.json
npm run test:e2e:stage:render    # Render → output.mp4
```

### Edge Case Tests
```bash
npm run test:edge-cases      # Run all edge case tests
npm run test:edge:api        # API failures
npm run test:edge:rate       # Rate limiting
npm run test:edge:network    # Network resilience
npm run test:edge:media      # Media edge cases
npm run test:edge:emphasis   # Emphasis constraints
npm run test:edge:malformed  # Malformed data
```

### Full Pipeline Tests
```bash
npm run test:e2e             # Full pipeline (full render)
npm run test:e2e:fast        # Full pipeline (preview mode)
```

## 🔍 Test Coverage

### Validation Levels

1. **Schema Validation** - Zod schema compliance
   - JSON structure correctness
   - Required field validation
   - Type checking

2. **Content Correctness** - Data quality validation
   - Word timing accuracy (±50ms tolerance)
   - Emphasis constraints (≤20% density, ≥2-word gaps)
   - Media quality scoring
   - Aspect ratio processing

3. **Rendered Output** - Video quality validation
   - Frame rate (30 FPS)
   - Audio sync (±100ms tolerance)
   - Video codec (H.264)
   - Dimensions (1920x1080 or 1080x1920)

### Edge Cases Covered

- **API Failures**: Missing keys, invalid keys, provider failures
- **Rate Limiting**: Quota management, throttling, backoff
- **Network Issues**: Timeouts, retries, DNS failures
- **Media Problems**: Empty results, low quality, corrupted files
- **Emphasis Issues**: Density violations, gap violations
- **Data Corruption**: Invalid JSON, missing fields, type errors

## ⚙️ Configuration

### Environment Variables

#### Required for E2E Tests
- `GOOGLE_TTS_API_KEY` - Google Cloud TTS API key
- `PEXELS_API_KEY` - Pexels API key
- `PIXABAY_API_KEY` - Pixabay API key
- `UNSPLASH_ACCESS_KEY` - Unsplash API key

#### Optional Test Configuration
- `TEST_MODE=development|ci` - Test environment mode
- `TEST_PREVIEW_ONLY=true` - Use 10s preview for faster tests (default in fast mode)
- `TEST_IGNORE_RATE_LIMITS=true` - Bypass rate limiting (CI only)
- `TEST_PRESERVE_ARTIFACTS=true` - Keep test artifacts on success
- `SKIP_API_KEY_CHECK=true` - Skip API key validation (not recommended)

### Test Timeouts

- Unit tests: 5 seconds
- Integration tests: 30 seconds
- E2E stage tests: 10 minutes
- E2E full pipeline: 30 minutes (preview) / 60 minutes (full)
- Render tests: 20 minutes

## 🔧 CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Pull requests to `main`
- Pushes to `main`
- Manual workflow dispatch

The workflow includes:
1. API key validation
2. Unit & integration tests
3. Edge case tests
4. E2E tests (preview mode)
5. Individual stage tests (parallel)
6. Test result summary

### Setting Up Secrets

In GitHub repository settings, add these secrets:
- `GOOGLE_TTS_API_KEY`
- `PEXELS_API_KEY`
- `PIXABAY_API_KEY`
- `UNSPLASH_ACCESS_KEY`

### Running Tests Manually

Trigger the workflow manually with:
- **Preview mode**: Fast tests with 10s previews (~30min total)
- **Full mode**: Full renders with complete validation (~60min total)

## 📊 Test Reports

### Artifacts Preserved

On test failure, the following artifacts are preserved:
- Test project directories
- Downloaded media assets
- Generated JSON files
- Rendered video outputs
- Error logs and stack traces

Artifacts location: `tests/reports/e2e/failures/<test-name>-<timestamp>/`

### Cleanup

Test artifacts are automatically cleaned up on success. To preserve artifacts:

```bash
TEST_PRESERVE_ARTIFACTS=true npm run test:e2e:fast
```

## 🛠️ Development

### Adding New Tests

1. Create test file in appropriate directory
2. Import required helpers from `tests/e2e/helpers/`
3. Follow existing test patterns (see examples below)
4. Add test script to `package.json`
5. Update this README

### Example Test Structure

```typescript
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { TestProjectManager } from './helpers/test-project-manager';
import { APIKeyValidator } from './helpers/api-key-validator';
import { RateLimiter } from './helpers/rate-limiter';

describe('My Test Suite', { timeout: 300000 }, () => {
  let testProject;

  before(async () => {
    // Validate API keys
    const validation = await APIKeyValidator.validateAll();
    if (APIKeyValidator.shouldSkipTests(validation)) {
      console.log('⏭️  Skipping test: Missing API keys');
      return;
    }

    // Create test project
    testProject = await TestProjectManager.createTestProject('my-test');
  });

  after(async () => {
    // Cleanup
    if (testProject) {
      await TestProjectManager.cleanupTestProject(testProject.id);
    }
    RateLimiter.reset();
  });

  it('should do something', async () => {
    // Test implementation
  });
});
```

## 📚 Helper Utilities

### TestProjectManager
- `createTestProject(name)` - Create isolated test project
- `cleanupTestProject(id)` - Remove test artifacts
- `preserveTestProject(id, reason)` - Save failed test artifacts
- `validateProjectStructure(id, stage)` - Verify stage outputs

### APIKeyValidator
- `validateGoogleTTS()` - Validate Google TTS key
- `validatePexels()` - Validate Pexels key
- `validatePixabay()` - Validate Pixabay key
- `validateUnsplash()` - Validate Unsplash key
- `validateAll()` - Batch validate all keys
- `shouldSkipTests(results)` - Check if tests should be skipped

### RateLimiter
- `throttle(provider)` - Wait if rate limit approached
- `recordCall(provider)` - Record API call
- `canMakeCall(provider)` - Check if call is allowed
- `getCallCount(provider, windowMs)` - Get call count in time window
- `reset()` - Clear call history
- `setIgnoreRateLimits(ignore)` - Enable/disable rate limiting

### Assertions
- `assertValidTimeline(timeline)` - Validate timeline schema
- `assertValidManifest(manifest)` - Validate manifest schema
- `assertValidScript(script)` - Validate script schema
- `assertWordTimingAccuracy(words, tolerance)` - Verify word timing
- `assertEmphasisConstraints(emphases, wordCount)` - Check emphasis rules
- `assertAudioFile(path, minDuration)` - Validate audio file
- `assertVideoFile(path, minDuration, minWidth)` - Validate video file
- `assertVideoFrameRate(path, fps)` - Check frame rate
- `assertAudioSync(videoPath, timeline, tolerance)` - Verify audio sync

## 🐛 Troubleshooting

### Tests Failing Due to Missing API Keys
```bash
npm run check:api-keys
```
Ensure all required API keys are set and valid.

### Tests Timing Out
- Use preview mode for faster tests: `npm run test:e2e:fast`
- Increase timeout in test file: `{ timeout: 600000 }`
- Check network connectivity and API availability

### Rate Limit Errors
- Use rate limiter: `await RateLimiter.throttle('provider')`
- Increase delays between tests
- Use `TEST_IGNORE_RATE_LIMITS=true` in CI (use sparingly)

### Cleanup Issues
- Check `/tmp` directory for orphaned test projects
- Manually run: `rm -rf /tmp/remotion-p2v-test-*`
- Verify symlinks in `/public/projects/`

### CI/CD Issues
- Verify GitHub secrets are set correctly
- Check workflow logs for API key validation failures
- Ensure ffmpeg is installed (required for render tests)

## 📖 Additional Resources

- **Handoff Document**: `docs/E2E_TEST_IMPLEMENTATION_HANDOFF.md`
- **Detailed Plan**: `.claude/plans/imperative-strolling-bubble.md`
- **Type Definitions**: `src/lib/types.ts`
- **Pipeline Commands**: `cli/commands/`
- **Service Layer**: `cli/services/`

## ✅ Success Criteria

### All Priorities Complete
- ✅ Priority 1: Test Infrastructure (6/6 files)
- ✅ Priority 2: Core E2E Tests (3/3 files)
- ✅ Priority 3: Individual Stage Tests (5/5 files)
- ✅ Priority 4: Edge Case Tests (6/6 files)
- ✅ Priority 5: Configuration (3/3 files)

**Total: 23/23 files (100%) 🎉**

---

**Last Updated**: 2025-11-30
**Status**: ✅ Complete and ready for use
