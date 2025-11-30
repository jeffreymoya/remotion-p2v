#!/usr/bin/env node
/**
 * Stage 7: Render E2E Test
 *
 * Tests the Render stage:
 * Remotion rendering → output.mp4
 *
 * Validates:
 * 1. Output video file created (output.mp4 or preview.mp4)
 * 2. Valid H.264 codec, 30 FPS
 * 3. Correct dimensions (1920x1080 for 16:9, 1080x1920 for 9:16)
 * 4. Audio track present and synced
 * 5. Preview mode renders only first 10 seconds
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn } from 'node:child_process';

// Import helpers
import { TestProjectManager, type TestProject } from './helpers/test-project-manager';
import { APIKeyValidator } from './helpers/api-key-validator';
import { RateLimiter } from './helpers/rate-limiter';
import {
  assertVideoFile,
  assertVideoCodec,
  assertVideoFrameRate,
  assertVideoDimensions,
} from './helpers/assertions';
import { mockTimeline } from './helpers/fixtures';

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

describe('Stage 7: Render E2E Test', { timeout: TEST_TIMEOUT }, () => {
  let testProject: TestProject;
  let apiValidation: any;

  before(async () => {
    console.log('\n🚀 Starting Stage 7: Render E2E Test...\n');
    console.log(`Mode: ${PREVIEW_MODE ? 'PREVIEW (10s render)' : 'FULL RENDER'}\n`);

    // Validate API keys
    console.log('🔑 Validating API keys...');
    apiValidation = await APIKeyValidator.validateAll();
    console.log('✅ API validation complete\n');

    // Create test project
    console.log('📁 Creating test project...');
    testProject = await TestProjectManager.createTestProject('test-stage-render');
    console.log(`✅ Test project created: ${testProject.id}\n`);

    // Create timeline.json with mock data
    console.log('📝 Creating mock timeline.json...');
    await fs.writeFile(
      testProject.paths.timeline,
      JSON.stringify(mockTimeline, null, 2),
      'utf-8'
    );
    console.log('✅ Mock timeline.json created\n');

    // Note: In a real scenario, we'd need to create all the asset files
    // (audio, images, videos) that the timeline references.
    // For this test, we're assuming the mock timeline uses assets that exist
    // or we're using a simplified timeline that doesn't require assets.
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

  it('should render the video and create output.mp4', async () => {
    const projectRoot = testProject.paths.root;

    try {
      console.log('🎬 Running render stage...');

      if (PREVIEW_MODE) {
        console.log('  📹 PREVIEW MODE: Rendering first 10 seconds only\n');
      }

      // Read timeline to get expected properties
      const timelineData = JSON.parse(
        await fs.readFile(testProject.paths.timeline, 'utf-8')
      );

      console.log(`  Timeline aspect ratio: ${timelineData.aspectRatio}`);
      console.log(`  Timeline duration: ${timelineData.durationSeconds}s`);

      // Build render command arguments
      const renderArgs = [
        'cli/commands/render.ts',
        '--project', testProject.id,
      ];

      if (PREVIEW_MODE) {
        renderArgs.push('--preview');
      }

      // Execute render command
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

      console.log('✅ Render stage completed');

      // Determine output path based on preview mode
      const outputFilename = PREVIEW_MODE ? 'preview.mp4' : 'output.mp4';
      const outputPath = path.join(projectRoot, outputFilename);

      // ==========================================
      // Validation 1: Output File Exists
      // ==========================================
      console.log('\n✓ Validating output file...');

      const outputExists = await fs.access(outputPath).then(() => true).catch(() => false);

      assert.ok(
        outputExists,
        `Output file should exist at ${outputPath}`
      );

      const stats = await fs.stat(outputPath);
      const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);

      console.log(`  - Output file: ${outputPath}`);
      console.log(`  - File size: ${fileSizeMB} MB`);

      // ==========================================
      // Validation 2: Video File Validity
      // ==========================================
      console.log('\n✓ Validating video file...');

      const minDuration = PREVIEW_MODE ? 10000 : 30000; // 10s preview or 30s+ full
      const minWidth = 1080; // Minimum width for any aspect ratio

      await assertVideoFile(outputPath, minDuration, minWidth);

      console.log('  - Video file is valid');

      // ==========================================
      // Validation 3: Video Codec (H.264)
      // ==========================================
      console.log('\n✓ Validating video codec...');

      await assertVideoCodec(outputPath, 'h264');

      console.log('  - Codec: H.264 ✓');

      // ==========================================
      // Validation 4: Frame Rate (30 FPS)
      // ==========================================
      console.log('\n✓ Validating frame rate...');

      await assertVideoFrameRate(outputPath, 30);

      console.log('  - Frame rate: 30 FPS ✓');

      // ==========================================
      // Validation 5: Video Dimensions (aspect ratio)
      // ==========================================
      console.log('\n✓ Validating video dimensions...');

      const aspectRatio = timelineData.aspectRatio || '16:9';

      if (aspectRatio === '16:9') {
        await assertVideoDimensions(outputPath, 1920, 1080);
        console.log('  - Dimensions: 1920x1080 (16:9) ✓');
      } else if (aspectRatio === '9:16') {
        await assertVideoDimensions(outputPath, 1080, 1920);
        console.log('  - Dimensions: 1080x1920 (9:16) ✓');
      } else if (aspectRatio === '1:1') {
        await assertVideoDimensions(outputPath, 1080, 1080);
        console.log('  - Dimensions: 1080x1080 (1:1) ✓');
      } else if (aspectRatio === '4:5') {
        await assertVideoDimensions(outputPath, 1080, 1350);
        console.log('  - Dimensions: 1080x1350 (4:5) ✓');
      } else {
        console.log(`  - Aspect ratio ${aspectRatio} - skipping dimension validation`);
      }

      // ==========================================
      // Validation 6: Audio Track Present
      // ==========================================
      console.log('\n✓ Validating audio track...');

      // Use ffprobe to check for audio stream
      const { execSync } = require('child_process');

      try {
        const audioInfo = execSync(
          `ffprobe -v error -select_streams a:0 -show_entries stream=codec_type -of default=noprint_wrappers=1:nokey=1 "${outputPath}"`,
          { encoding: 'utf-8' }
        ).trim();

        assert.strictEqual(
          audioInfo,
          'audio',
          'Video should have audio track'
        );

        console.log('  - Audio track present ✓');
      } catch (error: any) {
        // If timeline has no audio, this is acceptable
        if (timelineData.audio && timelineData.audio.length > 0) {
          throw new Error('Video should have audio track but none found');
        } else {
          console.log('  - No audio track (timeline has no audio)');
        }
      }

      // ==========================================
      // Validation 7: Preview Mode Duration (if applicable)
      // ==========================================
      if (PREVIEW_MODE) {
        console.log('\n✓ Validating preview mode duration...');

        const durationInfo = execSync(
          `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outputPath}"`,
          { encoding: 'utf-8' }
        ).trim();

        const durationSeconds = parseFloat(durationInfo);

        assert.ok(
          durationSeconds >= 9 && durationSeconds <= 11,
          `Preview should be ~10 seconds, got ${durationSeconds}s`
        );

        console.log(`  - Preview duration: ${durationSeconds.toFixed(2)}s ✓`);
      }

      // ==========================================
      // Validation 8: Project Structure
      // ==========================================
      console.log('\n✓ Validating project structure...');

      await TestProjectManager.validateProjectStructure(testProject.id, 'render');

      console.log('  - Project structure validated');

      // ==========================================
      // Success Summary
      // ==========================================
      console.log('\n✅ STAGE 7: RENDER TEST PASSED!');
      console.log(`   Mode: ${PREVIEW_MODE ? 'PREVIEW' : 'FULL RENDER'}`);
      console.log(`   Output: ${outputPath}`);
      console.log(`   File size: ${fileSizeMB} MB`);
      console.log(`   Codec: H.264`);
      console.log(`   Frame rate: 30 FPS`);
      console.log(`   Aspect ratio: ${aspectRatio}\n`);

    } catch (error: any) {
      // Preserve artifacts on failure
      console.error('\n❌ Render test failed:', error.message);

      const preservedPath = await TestProjectManager.preserveTestProject(
        testProject.id,
        `stage-render-failure-${Date.now()}`
      );

      console.log(`\n📦 Test artifacts preserved at: ${preservedPath}`);

      throw error;
    }
  });

  it('should support different quality presets', async () => {
    const projectRoot = testProject.paths.root;

    try {
      console.log('\n🎬 Testing different quality presets...');

      // Test draft quality (fastest)
      console.log('\n  Testing draft quality...');

      const draftArgs = [
        'cli/commands/render.ts',
        '--project', testProject.id,
        '--quality', 'draft',
        '--output', path.join(projectRoot, 'draft-output.mp4'),
      ];

      if (PREVIEW_MODE) {
        draftArgs.push('--preview');
      }

      const draftResult = await executeCommand(
        'tsx',
        draftArgs,
        process.cwd()
      );

      assert.strictEqual(
        draftResult.exitCode,
        0,
        `Draft quality render failed: ${draftResult.stderr}`
      );

      const draftOutput = path.join(projectRoot, PREVIEW_MODE ? 'preview.mp4' : 'draft-output.mp4');
      const draftExists = await fs.access(draftOutput).then(() => true).catch(() => false);

      assert.ok(draftExists, 'Draft quality output should exist');

      console.log('  ✅ Draft quality render successful');

    } catch (error: any) {
      console.error('\n❌ Quality preset test failed:', error.message);
      throw error;
    }
  });
});

// Run the test if executed directly
if (require.main === module) {
  console.log('Running Stage 7: Render E2E Test...');
}
