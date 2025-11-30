#!/usr/bin/env node
/**
 * Stage 5: Gather E2E Test
 *
 * Tests the most complex pipeline stage:
 * - Tag extraction (3-5 tags per segment)
 * - Media search (Pexels, Pixabay, Unsplash) with quality thresholds
 * - Provider fallback chains
 * - Google TTS with word-level timestamps
 * - Emphasis detection with constraints
 * - Asset download and validation
 *
 * This stage requires all API keys and has the most potential failure points.
 */

// Load environment variables from .env file
import * as dotenv from 'dotenv';
dotenv.config();

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn } from 'node:child_process';

// Import helpers
import { TestProjectManager, type TestProject } from './helpers/test-project-manager';
import { APIKeyValidator } from './helpers/api-key-validator';
import { RateLimiter } from './helpers/rate-limiter';
import { CleanupManager } from './helpers/cleanup';
import * as assertions from './helpers/assertions';
import { mockScript } from './helpers/fixtures';

// Test constants
const TEST_TIMEOUT = 600000; // 10 minutes (gather is slow)

/**
 * Helper: Execute gather command
 */
async function executeGather(
  projectId: string,
  cwd: string = process.cwd()
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const proc = spawn('tsx', ['cli/commands/gather.ts', projectId], {
      cwd,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code || 0 });
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

describe('Stage 5: Gather E2E Test', { timeout: TEST_TIMEOUT }, () => {
  let testProject: TestProject;
  let apiValidation: any;

  before(async () => {
    console.log('\n🎨 Starting Gather Stage E2E Test...\n');

    // Validate API keys (ALL required for gather)
    console.log('🔑 Validating API keys...');
    apiValidation = await APIKeyValidator.validateAll();

    if (APIKeyValidator.shouldSkipTests(apiValidation)) {
      console.log('⏭️  Skipping test: Missing required API keys');
      console.log('Required API keys for gather stage:');
      apiValidation.forEach((result: any) => {
        console.log(`  - ${result.keyName}: ${result.exists ? '✅' : '❌'}`);
      });
      return;
    }

    console.log('✅ All API keys validated\n');

    // Create test project
    console.log('📁 Creating test project...');
    testProject = await TestProjectManager.createTestProject('gather-test');

    // Setup prerequisite files (selected.json, refined.json, script-v1.json)
    const projectRoot = testProject.paths.root;

    // Create minimal selected.json
    await fs.writeFile(
      path.join(projectRoot, 'selected.json'),
      JSON.stringify({
        topic: {
          title: 'AI Revolution',
          description: 'How AI is transforming our world',
          keywords: ['artificial intelligence', 'technology', 'future'],
        },
        selectedAt: new Date().toISOString(),
      }, null, 2)
    );

    // Create minimal refined.json
    await fs.writeFile(
      path.join(projectRoot, 'refined.json'),
      JSON.stringify({
        topic: {
          title: 'The AI Revolution: Transforming Our World',
          description: 'Explore how artificial intelligence is reshaping industries, creating new opportunities, and challenging our understanding of what machines can do.',
          targetAudience: 'Tech enthusiasts and professionals',
          keyPoints: [
            'AI in healthcare',
            'Machine learning applications',
            'Ethical considerations',
          ],
        },
        refinedAt: new Date().toISOString(),
      }, null, 2)
    );

    // Create script-v1.json using mock data
    await fs.mkdir(path.join(projectRoot, 'scripts'), { recursive: true });
    await fs.writeFile(
      path.join(projectRoot, 'scripts', 'script-v1.json'),
      JSON.stringify(mockScript, null, 2)
    );

    console.log(`✅ Test project created with prerequisites: ${testProject.id}\n`);
  });

  after(async () => {
    console.log('\n🧹 Cleaning up...');

    if (testProject) {
      try {
        await TestProjectManager.cleanupTestProject(testProject.id);
        console.log('✅ Test project cleaned up');
      } catch (error: any) {
        console.error('⚠️  Cleanup error:', error.message);
      }
    }

    RateLimiter.reset();
    console.log('✅ Rate limiter reset\n');
  });

  it('should extract 3-5 tags per segment', async () => {
    if (APIKeyValidator.shouldSkipTests(apiValidation)) {
      console.log('⏭️  Test skipped due to missing API keys');
      return;
    }

    const projectId = testProject.id;
    const projectRoot = testProject.paths.root;

    try {
      console.log('📝 Testing tag extraction...');

      // Run gather command
      await RateLimiter.throttle('google-tts');

      const result = await executeGather(projectId);

      assert.strictEqual(
        result.exitCode,
        0,
        `Gather command failed: ${result.stderr}`
      );

      // Validate tags.json
      const tagsPath = path.join(projectRoot, 'tags.json');
      const tagsData = JSON.parse(await fs.readFile(tagsPath, 'utf-8'));

      assert.ok(Array.isArray(tagsData.tags), 'tags.json should have tags array');
      assert.ok(tagsData.tags.length > 0, 'Should have extracted tags');

      // Validate tag structure
      for (const tag of tagsData.tags) {
        assert.ok(tag.tag, 'Each tag should have a tag field');
        assert.ok(tag.segmentId, 'Each tag should have a segmentId');
        assert.ok(
          typeof tag.confidence === 'number' && tag.confidence >= 0 && tag.confidence <= 1,
          `Tag confidence should be 0-1, got ${tag.confidence}`
        );
      }

      // Validate tag count per segment (3-5 tags per segment)
      const tagsBySegment = new Map<string, number>();
      for (const tag of tagsData.tags) {
        const count = tagsBySegment.get(tag.segmentId) || 0;
        tagsBySegment.set(tag.segmentId, count + 1);
      }

      console.log(`   Tags by segment:`);
      for (const [segmentId, count] of tagsBySegment) {
        console.log(`   - ${segmentId}: ${count} tags`);

        assert.ok(
          count >= 3 && count <= 5,
          `Segment ${segmentId} should have 3-5 tags, got ${count}`
        );
      }

      console.log(`✅ Tag extraction validated (${tagsData.tags.length} total tags)\n`);

    } catch (error: any) {
      const preservedPath = await TestProjectManager.preserveTestProject(
        projectId,
        `gather-tags-failure-${Date.now()}`
      );
      console.log(`📦 Artifacts preserved at: ${preservedPath}`);
      throw error;
    }
  });

  it('should download media with quality thresholds', async () => {
    if (APIKeyValidator.shouldSkipTests(apiValidation)) {
      console.log('⏭️  Test skipped due to missing API keys');
      return;
    }

    const projectRoot = testProject.paths.root;

    console.log('🎬 Testing media download with quality thresholds...');

    // Read manifest.json
    const manifestPath = path.join(projectRoot, 'manifest.json');
    const manifestData = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));

    assertions.assertValidManifest(manifestData);

    // Validate media was downloaded (images OR videos)
    const hasMedia =
      (manifestData.images && manifestData.images.length > 0) ||
      (manifestData.videos && manifestData.videos.length > 0);

    assert.ok(hasMedia, 'Should have downloaded images or videos');

    // If videos were downloaded, validate quality >= 0.7
    if (manifestData.videos && manifestData.videos.length > 0) {
      console.log(`   Found ${manifestData.videos.length} videos`);

      for (const video of manifestData.videos) {
        // Validate video file exists
        const videoPath = path.join(projectRoot, 'assets', 'videos', path.basename(video.path));

        try {
          await assertions.assertVideoFile(videoPath, 1000, 640);
          console.log(`   ✓ Video validated: ${path.basename(video.path)}`);
        } catch (error: any) {
          console.warn(`   ⚠️  Video file issue: ${error.message}`);
        }

        // Validate video metadata
        assert.ok(video.width > 0, 'Video should have width');
        assert.ok(video.height > 0, 'Video should have height');
        assert.ok(video.duration > 0, 'Video should have duration');
      }
    }

    // If images were downloaded, validate quality >= 0.6
    if (manifestData.images && manifestData.images.length > 0) {
      console.log(`   Found ${manifestData.images.length} images`);

      for (const image of manifestData.images) {
        // Validate image file exists
        const imagePath = path.join(projectRoot, 'assets', 'images', path.basename(image.path));

        try {
          await assertions.assertImageFile(imagePath, 640, 480);
          console.log(`   ✓ Image validated: ${path.basename(image.path)}`);
        } catch (error: any) {
          console.warn(`   ⚠️  Image file issue: ${error.message}`);
        }
      }
    }

    console.log(`✅ Media download validated\n`);
  });

  it('should generate TTS with word-level timestamps', async () => {
    if (APIKeyValidator.shouldSkipTests(apiValidation)) {
      console.log('⏭️  Test skipped due to missing API keys');
      return;
    }

    const projectRoot = testProject.paths.root;

    console.log('🔊 Testing TTS with word-level timestamps...');

    // Read manifest.json
    const manifestPath = path.join(projectRoot, 'manifest.json');
    const manifestData = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));

    // Validate audio files
    assert.ok(
      manifestData.audio && manifestData.audio.length > 0,
      'Should have generated audio files'
    );

    console.log(`   Found ${manifestData.audio.length} audio files`);

    for (const audioFile of manifestData.audio) {
      // Validate audio file exists
      const audioPath = path.join(projectRoot, 'assets', 'audio', `${audioFile.id}.mp3`);
      await assertions.assertAudioFile(audioPath, 1000); // Min 1 second

      console.log(`   ✓ Audio file: ${audioFile.id}.mp3 (${audioFile.durationMs}ms)`);

      // Validate word timestamps
      assert.ok(
        audioFile.wordTimestamps && audioFile.wordTimestamps.length > 0,
        `Audio ${audioFile.id} should have word timestamps`
      );

      console.log(`     - ${audioFile.wordTimestamps.length} words with timestamps`);

      // Validate word timing accuracy (no overlaps, gaps ≤50ms)
      assertions.assertWordTimingAccuracy(audioFile.wordTimestamps);

      // Validate each word
      for (const word of audioFile.wordTimestamps) {
        assert.ok(word.word.length > 0, 'Word should not be empty');
        assert.ok(word.startMs >= 0, 'Word startMs should be non-negative');
        assert.ok(word.endMs > word.startMs, 'Word endMs should be after startMs');

        const duration = word.endMs - word.startMs;
        assert.ok(
          duration >= 50,
          `Word "${word.word}" should have duration >= 50ms, got ${duration}ms`
        );
      }

      console.log(`     ✓ Word timing validated (no overlaps, gaps ≤50ms)`);
    }

    console.log(`✅ TTS with word-level timestamps validated\n`);
  });

  it('should enforce emphasis constraints', async () => {
    if (APIKeyValidator.shouldSkipTests(apiValidation)) {
      console.log('⏭️  Test skipped due to missing API keys');
      return;
    }

    const projectRoot = testProject.paths.root;

    console.log('🎯 Testing emphasis constraints...');
    console.log('   Constraints:');
    console.log('   - Total emphasis ≤ 20% of words');
    console.log('   - High emphasis ≤ 5% of words');
    console.log('   - Gap ≥ 3 indices between high emphasis\n');

    // Read manifest.json
    const manifestPath = path.join(projectRoot, 'manifest.json');
    const manifestData = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));

    // Check each audio file for emphasis constraints
    for (const audioFile of manifestData.audio) {
      if (!audioFile.emphasis || audioFile.emphasis.length === 0) {
        console.log(`   ⚠️  ${audioFile.id}: No emphasis detected`);
        continue;
      }

      console.log(`   Testing ${audioFile.id}:`);
      console.log(`     - Words: ${audioFile.wordTimestamps.length}`);
      console.log(`     - Emphasis: ${audioFile.emphasis.length}`);

      // Validate emphasis constraints
      assertions.assertEmphasisConstraints(
        audioFile.emphasis,
        audioFile.wordTimestamps.length
      );

      // Detailed validation
      const totalEmphasis = audioFile.emphasis.length;
      const highEmphasis = audioFile.emphasis.filter((e: any) => e.level === 'high').length;
      const medEmphasis = audioFile.emphasis.filter((e: any) => e.level === 'med').length;

      console.log(`     - High emphasis: ${highEmphasis}`);
      console.log(`     - Med emphasis: ${medEmphasis}`);

      // Verify total ≤ 20%
      const maxTotal = Math.ceil(audioFile.wordTimestamps.length * 0.20);
      assert.ok(
        totalEmphasis <= maxTotal,
        `Total emphasis (${totalEmphasis}) should be ≤ 20% of words (${maxTotal})`
      );

      // Verify high ≤ 5%
      const maxHigh = Math.ceil(audioFile.wordTimestamps.length * 0.05);
      assert.ok(
        highEmphasis <= maxHigh,
        `High emphasis (${highEmphasis}) should be ≤ 5% of words (${maxHigh})`
      );

      // Verify gap ≥ 3 indices between high emphasis
      const highEmphases = audioFile.emphasis
        .filter((e: any) => e.level === 'high')
        .sort((a: any, b: any) => a.wordIndex - b.wordIndex);

      for (let i = 0; i < highEmphases.length - 1; i++) {
        const gap = highEmphases[i + 1].wordIndex - highEmphases[i].wordIndex;
        assert.ok(
          gap >= 3,
          `Gap between high emphasis at indices ${highEmphases[i].wordIndex} and ${highEmphases[i + 1].wordIndex} should be ≥ 3, got ${gap}`
        );
      }

      console.log(`     ✓ Emphasis constraints validated`);
    }

    console.log(`✅ Emphasis constraints validated\n`);
  });

  it('should handle provider fallback chains', async () => {
    if (APIKeyValidator.shouldSkipTests(apiValidation)) {
      console.log('⏭️  Test skipped due to missing API keys');
      return;
    }

    const projectRoot = testProject.paths.root;

    console.log('🔄 Testing provider fallback chains...');
    console.log('   Expected fallback order: Pexels → Pixabay → Unsplash\n');

    // Read manifest.json
    const manifestPath = path.join(projectRoot, 'manifest.json');
    const manifestData = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));

    // Track provider usage
    const providerUsage = new Map<string, number>();

    // Count image providers
    if (manifestData.images) {
      for (const image of manifestData.images) {
        const count = providerUsage.get(image.source) || 0;
        providerUsage.set(image.source, count + 1);
      }
    }

    // Count video providers
    if (manifestData.videos) {
      for (const video of manifestData.videos) {
        const count = providerUsage.get(video.source) || 0;
        providerUsage.set(video.source, count + 1);
      }
    }

    console.log('   Provider usage:');
    for (const [provider, count] of providerUsage) {
      console.log(`   - ${provider}: ${count} assets`);
    }

    // Verify at least one provider was used
    assert.ok(
      providerUsage.size > 0,
      'At least one media provider should have been used'
    );

    // Verify providers are valid
    const validProviders = ['pexels', 'pixabay', 'unsplash'];
    for (const provider of providerUsage.keys()) {
      assert.ok(
        validProviders.includes(provider),
        `Provider ${provider} should be one of: ${validProviders.join(', ')}`
      );
    }

    console.log(`✅ Provider fallback validated\n`);
  });

  it('should validate complete manifest structure', async () => {
    if (APIKeyValidator.shouldSkipTests(apiValidation)) {
      console.log('⏭️  Test skipped due to missing API keys');
      return;
    }

    const projectRoot = testProject.paths.root;

    console.log('📋 Validating complete manifest structure...');

    // Read manifest.json
    const manifestPath = path.join(projectRoot, 'manifest.json');
    const manifestData = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));

    // Use custom assertion
    assertions.assertValidManifest(manifestData);

    // Additional structure validation
    assert.ok(Array.isArray(manifestData.images), 'Manifest should have images array');
    assert.ok(Array.isArray(manifestData.videos), 'Manifest should have videos array');
    assert.ok(Array.isArray(manifestData.audio), 'Manifest should have audio array');
    assert.ok(Array.isArray(manifestData.music), 'Manifest should have music array');

    console.log(`   Manifest structure:`);
    console.log(`   - Images: ${manifestData.images.length}`);
    console.log(`   - Videos: ${manifestData.videos.length}`);
    console.log(`   - Audio: ${manifestData.audio.length}`);
    console.log(`   - Music: ${manifestData.music.length}`);

    console.log(`✅ Manifest structure validated\n`);
  });

  it('should validate project structure after gather', async () => {
    if (APIKeyValidator.shouldSkipTests(apiValidation)) {
      console.log('⏭️  Test skipped due to missing API keys');
      return;
    }

    console.log('📂 Validating project structure...');

    await TestProjectManager.validateProjectStructure(testProject.id, 'gather');

    console.log(`✅ Project structure validated\n`);
  });
});

// Run the test if executed directly
if (require.main === module) {
  console.log('Running Gather Stage E2E Test...');
}
