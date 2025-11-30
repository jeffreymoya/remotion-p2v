#!/usr/bin/env node
/**
 * Full Pipeline E2E Test
 *
 * Tests complete 7-stage integration:
 * Discover → Curate → Refine → Script → Gather → Build → Render
 *
 * Uses real APIs with rate limiting and validates:
 * 1. Schema/structure validation
 * 2. Content correctness
 * 3. Rendered output quality
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

// Import types and schemas
import { TimelineSchema } from '../../src/lib/types';

// Test constants
const PREVIEW_MODE = process.env.TEST_PREVIEW_ONLY === 'true';
const TEST_TIMEOUT = PREVIEW_MODE ? 600000 : 1200000; // 10min preview, 20min full

/**
 * Helper: Execute a CLI command and return output
 */
async function executeCommand(
  command: string,
  args: string[],
  cwd: string = process.cwd()
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
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

describe('Full Pipeline E2E Test', { timeout: TEST_TIMEOUT }, () => {
  let testProject: TestProject;
  let apiValidation: any;

  before(async () => {
    console.log('\n🚀 Starting Full Pipeline E2E Test...');
    console.log(`Mode: ${PREVIEW_MODE ? 'PREVIEW (10s render)' : 'FULL RENDER'}\n`);

    // Validate API keys
    console.log('🔑 Validating API keys...');
    apiValidation = await APIKeyValidator.validateAll();

    if (APIKeyValidator.shouldSkipTests(apiValidation)) {
      console.log('⏭️  Skipping test: Missing required API keys');
      console.log('Required API keys:');
      apiValidation.forEach((result: any) => {
        console.log(`  - ${result.keyName}: ${result.exists ? '✅' : '❌'}`);
      });
      return;
    }

    console.log('✅ All API keys validated\n');

    // Create test project
    console.log('📁 Creating test project...');
    testProject = await TestProjectManager.createTestProject('full-pipeline-test');
    console.log(`✅ Test project created: ${testProject.id}\n`);
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

  it('should complete full 7-stage pipeline', async () => {
    if (APIKeyValidator.shouldSkipTests(apiValidation)) {
      console.log('⏭️  Test skipped due to missing API keys');
      return;
    }

    const projectId = testProject.id;
    const projectRoot = testProject.paths.root;

    try {
      // ==========================================
      // Stage 1: Discover
      // ==========================================
      console.log('\n📊 Stage 1: Discover (Google Trends → discovered.json)');

      const discoverResult = await executeCommand(
        'tsx',
        ['cli/commands/discover.ts', projectId],
        process.cwd()
      );

      assert.strictEqual(
        discoverResult.exitCode,
        0,
        `Discover stage failed: ${discoverResult.stderr}`
      );

      // Validate discovered.json
      const discoveredPath = path.join(projectRoot, 'discovered.json');
      const discoveredData = JSON.parse(await fs.readFile(discoveredPath, 'utf-8'));

      assert.ok(discoveredData.topics, 'discovered.json should have topics array');
      assert.ok(
        discoveredData.topics.length >= 1,
        `Should have at least 1 topic, got ${discoveredData.topics.length}`
      );

      console.log(`✅ Discovered ${discoveredData.topics.length} topics`);
      await TestProjectManager.validateProjectStructure(projectId, 'discover');

      // ==========================================
      // Stage 2: Curate
      // ==========================================
      console.log('\n🎯 Stage 2: Curate (Topic selection → selected.json)');

      const curateResult = await executeCommand(
        'tsx',
        ['cli/commands/curate.ts', projectId, '0'], // Select first topic
        process.cwd()
      );

      assert.strictEqual(
        curateResult.exitCode,
        0,
        `Curate stage failed: ${curateResult.stderr}`
      );

      // Validate selected.json
      const selectedPath = path.join(projectRoot, 'selected.json');
      const selectedData = JSON.parse(await fs.readFile(selectedPath, 'utf-8'));

      assert.ok(selectedData.topic, 'selected.json should have topic object');
      assert.strictEqual(
        selectedData.topic.title,
        discoveredData.topics[0].title,
        'Selected topic should match first discovered topic'
      );

      console.log(`✅ Selected topic: "${selectedData.topic.title}"`);
      await TestProjectManager.validateProjectStructure(projectId, 'curate');

      // ==========================================
      // Stage 3: Refine
      // ==========================================
      console.log('\n✨ Stage 3: Refine (AI enhancement → refined.json)');

      const refineResult = await executeCommand(
        'tsx',
        ['cli/commands/refine.ts', projectId],
        process.cwd()
      );

      assert.strictEqual(
        refineResult.exitCode,
        0,
        `Refine stage failed: ${refineResult.stderr}`
      );

      // Validate refined.json
      const refinedPath = path.join(projectRoot, 'refined.json');
      const refinedData = JSON.parse(await fs.readFile(refinedPath, 'utf-8'));

      assert.ok(refinedData.topic, 'refined.json should have topic object');

      // Check for either description or refinedDescription field
      const refinedDesc = refinedData.topic.refinedDescription || refinedData.topic.description;
      assert.ok(refinedDesc, 'Should have description field');
      assert.ok(
        refinedDesc.length > selectedData.topic.description.length,
        'Refined description should be more detailed'
      );
      assert.ok(refinedData.topic.targetAudience, 'Should have targetAudience');
      assert.ok(
        Array.isArray(refinedData.topic.keyPoints || refinedData.topic.keyAngles),
        'Should have keyPoints or keyAngles array'
      );

      const keyItems = refinedData.topic.keyPoints || refinedData.topic.keyAngles || [];
      console.log(`✅ Refined topic with ${keyItems.length} key points/angles`);
      await TestProjectManager.validateProjectStructure(projectId, 'refine');

      // ==========================================
      // Stage 4: Script
      // ==========================================
      console.log('\n📝 Stage 4: Script (AI script generation → script-v1.json)');

      const scriptResult = await executeCommand(
        'tsx',
        ['cli/commands/script.ts', projectId],
        process.cwd()
      );

      assert.strictEqual(
        scriptResult.exitCode,
        0,
        `Script stage failed: ${scriptResult.stderr}`
      );

      // Validate script-v1.json
      const scriptPath = path.join(projectRoot, 'scripts', 'script-v1.json');
      const scriptData = JSON.parse(await fs.readFile(scriptPath, 'utf-8'));

      assertions.assertValidScript(scriptData);

      assert.ok(
        scriptData.segments.length >= 4 && scriptData.segments.length <= 5,
        `Should have 4-5 segments, got ${scriptData.segments.length}`
      );

      const totalDuration = scriptData.segments.reduce(
        (sum: number, seg: any) => sum + seg.estimatedDuration,
        0
      );

      assert.ok(
        totalDuration >= 600 && totalDuration <= 840,
        `Total duration should be 600-840s, got ${totalDuration}s`
      );

      console.log(`✅ Generated ${scriptData.segments.length} segments (~${totalDuration}s)`);
      await TestProjectManager.validateProjectStructure(projectId, 'script');

      // ==========================================
      // Stage 5: Gather (MOST COMPLEX)
      // ==========================================
      console.log('\n🎨 Stage 5: Gather (Asset collection → tags.json + assets/*)');
      console.log('  This stage includes:');
      console.log('  - Tag extraction (3-5 per segment)');
      console.log('  - Media search (Pexels, Pixabay, Unsplash)');
      console.log('  - Google TTS with word-level timestamps');
      console.log('  - Emphasis detection with constraints');
      console.log('  ⏳ This may take several minutes...\n');

      await RateLimiter.throttle('google-tts');

      const gatherResult = await executeCommand(
        'tsx',
        ['cli/commands/gather.ts', projectId],
        process.cwd()
      );

      assert.strictEqual(
        gatherResult.exitCode,
        0,
        `Gather stage failed: ${gatherResult.stderr}`
      );

      // Validate tags.json
      const tagsPath = path.join(projectRoot, 'tags.json');
      const tagsData = JSON.parse(await fs.readFile(tagsPath, 'utf-8'));

      assert.ok(Array.isArray(tagsData.tags), 'tags.json should have tags array');

      // Validate tag count per segment (3-5 tags per segment)
      const tagsBySegment = new Map<string, number>();
      for (const tag of tagsData.tags) {
        const count = tagsBySegment.get(tag.segmentId) || 0;
        tagsBySegment.set(tag.segmentId, count + 1);
      }

      for (const [segmentId, count] of tagsBySegment) {
        assert.ok(
          count >= 3 && count <= 5,
          `Segment ${segmentId} should have 3-5 tags, got ${count}`
        );
      }

      // Validate manifest.json
      const manifestPath = path.join(projectRoot, 'manifest.json');
      const manifestData = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));

      assertions.assertValidManifest(manifestData);

      // Validate audio files with word timestamps
      assert.ok(
        manifestData.audio.length === scriptData.segments.length,
        `Should have audio for all segments`
      );

      for (const audioFile of manifestData.audio) {
        // Validate audio file exists
        await assertions.assertAudioFile(
          path.join(projectRoot, 'assets', 'audio', `${audioFile.id}.mp3`),
          1000 // Min 1 second
        );

        // Validate word timestamps
        assert.ok(
          audioFile.wordTimestamps && audioFile.wordTimestamps.length > 0,
          `Audio ${audioFile.id} should have word timestamps`
        );

        assertions.assertWordTimingAccuracy(audioFile.wordTimestamps);

        // Validate emphasis constraints if present
        if (audioFile.emphasis && audioFile.emphasis.length > 0) {
          assertions.assertEmphasisConstraints(
            audioFile.emphasis,
            audioFile.wordTimestamps.length
          );
        }
      }

      // Validate media assets (images or videos)
      const hasMedia =
        (manifestData.images && manifestData.images.length > 0) ||
        (manifestData.videos && manifestData.videos.length > 0);

      assert.ok(hasMedia, 'Should have downloaded images or videos');

      console.log(`✅ Gathered assets:`);
      console.log(`   - Tags: ${tagsData.tags.length}`);
      console.log(`   - Audio files: ${manifestData.audio.length}`);
      console.log(`   - Images: ${manifestData.images?.length || 0}`);
      console.log(`   - Videos: ${manifestData.videos?.length || 0}`);

      await TestProjectManager.validateProjectStructure(projectId, 'gather');

      // ==========================================
      // Stage 6: Build
      // ==========================================
      console.log('\n🔧 Stage 6: Build (Timeline assembly → timeline.json)');

      const buildResult = await executeCommand(
        'tsx',
        ['cli/commands/build.ts', projectId],
        process.cwd()
      );

      assert.strictEqual(
        buildResult.exitCode,
        0,
        `Build stage failed: ${buildResult.stderr}`
      );

      // Validate timeline.json
      const timelinePath = path.join(projectRoot, 'timeline.json');
      const timelineData = JSON.parse(await fs.readFile(timelinePath, 'utf-8'));

      assertions.assertValidTimeline(timelineData);

      // Validate timeline structure
      const timeline = TimelineSchema.parse(timelineData);

      assert.ok(timeline.shortTitle, 'Timeline should have shortTitle');
      assert.ok(timeline.aspectRatio, 'Timeline should have aspectRatio');
      assert.ok(timeline.durationSeconds && timeline.durationSeconds > 0, 'Timeline should have positive duration');

      // Validate audio elements
      assert.strictEqual(
        timeline.audio.length,
        scriptData.segments.length,
        'Should have audio element for each segment'
      );

      // Validate text elements with word-level data
      assert.ok(timeline.text.length > 0, 'Should have text elements');

      for (const textElement of timeline.text) {
        assert.ok(textElement.words, 'Text element should have words array');
        assert.ok(
          textElement.words!.length > 0,
          'Text element should have at least one word'
        );
      }

      // Validate background elements (video or image)
      const hasBackgrounds =
        timeline.elements.length > 0 ||
        (timeline.videoClips && timeline.videoClips.length > 0);

      assert.ok(hasBackgrounds, 'Timeline should have background elements');

      console.log(`✅ Built timeline:`);
      console.log(`   - Duration: ${timeline.durationSeconds}s`);
      console.log(`   - Audio elements: ${timeline.audio.length}`);
      console.log(`   - Text elements: ${timeline.text.length}`);
      console.log(`   - Background elements: ${timeline.elements.length}`);
      console.log(`   - Video clips: ${timeline.videoClips?.length || 0}`);

      await TestProjectManager.validateProjectStructure(projectId, 'build');

      // ==========================================
      // Stage 7: Render
      // ==========================================
      console.log('\n🎬 Stage 7: Render (Remotion rendering → output.mp4)');

      if (PREVIEW_MODE) {
        console.log('  📹 PREVIEW MODE: Rendering first 10 seconds only\n');
      }

      const renderArgs = ['cli/commands/render.ts', projectId];
      if (PREVIEW_MODE) {
        renderArgs.push('--preview');
      }

      const renderResult = await executeCommand(
        'tsx',
        renderArgs,
        process.cwd()
      );

      assert.strictEqual(
        renderResult.exitCode,
        0,
        `Render stage failed: ${renderResult.stderr}`
      );

      // Validate output video
      const outputPath = path.join(projectRoot, 'output.mp4');

      await assertions.assertVideoFile(
        outputPath,
        PREVIEW_MODE ? 10000 : 30000, // 10s preview or 30s+ full
        1280 // Min width
      );

      // Validate video codec and frame rate
      await assertions.assertVideoCodec(outputPath, 'h264');
      await assertions.assertVideoFrameRate(outputPath, 30);

      // Validate video dimensions match aspect ratio
      if (timeline.aspectRatio === '16:9') {
        await assertions.assertVideoDimensions(outputPath, 1920, 1080);
      } else if (timeline.aspectRatio === '9:16') {
        await assertions.assertVideoDimensions(outputPath, 1080, 1920);
      }

      console.log(`✅ Rendered video: ${outputPath}`);

      await TestProjectManager.validateProjectStructure(projectId, 'render');

      // ==========================================
      // Final Success
      // ==========================================
      console.log('\n✅ FULL PIPELINE TEST PASSED!');
      console.log(`   Project ID: ${projectId}`);
      console.log(`   Mode: ${PREVIEW_MODE ? 'PREVIEW' : 'FULL RENDER'}`);
      console.log(`   Final video: ${outputPath}\n`);

    } catch (error: any) {
      // Preserve artifacts on failure
      console.error('\n❌ Pipeline test failed:', error.message);

      const preservedPath = await TestProjectManager.preserveTestProject(
        projectId,
        `full-pipeline-failure-${Date.now()}`
      );

      console.log(`\n📦 Test artifacts preserved at: ${preservedPath}`);

      throw error;
    }
  });
});

// Run the test if executed directly
if (require.main === module) {
  console.log('Running Full Pipeline E2E Test...');
}
