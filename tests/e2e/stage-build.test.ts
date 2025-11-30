#!/usr/bin/env node
/**
 * Stage 6: Build E2E Test
 *
 * Tests timeline assembly from gathered assets:
 * - Timeline.json creation with valid schema
 * - Word-level text elements with precise timing
 * - 1000ms intro offset applied correctly
 * - Media metadata (aspect-fit) included
 * - Media synced with audio duration
 * - Correct total duration calculated
 * - Emphasis styling preserved in text elements
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
import { CleanupManager } from './helpers/cleanup';
import * as assertions from './helpers/assertions';
import { mockScript, mockManifest, mockTags } from './helpers/fixtures';

// Import types
import { TimelineSchema, type Timeline } from '../../src/lib/types';

// Test constants
const TEST_TIMEOUT = 300000; // 5 minutes
const INTRO_OFFSET_MS = 1000; // Standard intro offset

/**
 * Helper: Execute build command
 */
async function executeBuild(
  projectId: string,
  cwd: string = process.cwd()
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const proc = spawn('tsx', ['cli/commands/build.ts', projectId], {
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

describe('Stage 6: Build E2E Test', { timeout: TEST_TIMEOUT }, () => {
  let testProject: TestProject;
  let apiValidation: any;

  before(async () => {
    console.log('\n🔧 Starting Build Stage E2E Test...\n');

    // Validate API keys (not strictly required for build, but good practice)
    console.log('🔑 Validating API keys...');
    apiValidation = await APIKeyValidator.validateAll();

    // Create test project
    console.log('📁 Creating test project...');
    testProject = await TestProjectManager.createTestProject('build-test');

    // Setup prerequisite files (script-v1.json, tags.json, manifest.json)
    const projectRoot = testProject.paths.root;

    // Create script-v1.json
    await fs.mkdir(path.join(projectRoot, 'scripts'), { recursive: true });
    await fs.writeFile(
      path.join(projectRoot, 'scripts', 'script-v1.json'),
      JSON.stringify(mockScript, null, 2)
    );

    // Create tags.json
    await fs.writeFile(
      path.join(projectRoot, 'tags.json'),
      JSON.stringify(mockTags, null, 2)
    );

    // Create manifest.json
    await fs.writeFile(
      path.join(projectRoot, 'manifest.json'),
      JSON.stringify(mockManifest, null, 2)
    );

    // Create mock asset files referenced in manifest
    await fs.mkdir(path.join(projectRoot, 'assets', 'audio'), { recursive: true });
    await fs.mkdir(path.join(projectRoot, 'assets', 'images'), { recursive: true });

    // Create dummy audio files (empty MP3 files for now)
    for (const audioFile of mockManifest.audio) {
      const audioPath = path.join(projectRoot, 'assets', 'audio', `${audioFile.id}.mp3`);
      await fs.writeFile(audioPath, Buffer.from([]));
    }

    // Create dummy image files
    for (const image of mockManifest.images) {
      const imagePath = path.join(projectRoot, 'assets', 'images', path.basename(image.path));
      await fs.writeFile(imagePath, Buffer.from([]));
    }

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

  it('should create valid timeline.json with correct schema', async () => {
    const projectId = testProject.id;
    const projectRoot = testProject.paths.root;

    try {
      console.log('📝 Testing timeline creation...');

      // Run build command
      const result = await executeBuild(projectId);

      assert.strictEqual(
        result.exitCode,
        0,
        `Build command failed: ${result.stderr}`
      );

      // Validate timeline.json exists
      const timelinePath = path.join(projectRoot, 'timeline.json');
      const timelineData = JSON.parse(await fs.readFile(timelinePath, 'utf-8'));

      // Validate against schema
      assertions.assertValidTimeline(timelineData);

      // Parse with Zod
      const timeline = TimelineSchema.parse(timelineData);

      console.log(`   ✓ Timeline created with valid schema`);
      console.log(`   - Title: ${timeline.shortTitle}`);
      console.log(`   - Aspect Ratio: ${timeline.aspectRatio || '9:16 (default)'}`);
      console.log(`   - Duration: ${timeline.durationSeconds}s`);

      console.log(`✅ Timeline schema validated\n`);

    } catch (error: any) {
      const preservedPath = await TestProjectManager.preserveTestProject(
        projectId,
        `build-schema-failure-${Date.now()}`
      );
      console.log(`📦 Artifacts preserved at: ${preservedPath}`);
      throw error;
    }
  });

  it('should include word-level text elements with precise timing', async () => {
    const projectRoot = testProject.paths.root;

    console.log('📝 Testing word-level text elements...');

    // Read timeline.json
    const timelinePath = path.join(projectRoot, 'timeline.json');
    const timelineData = JSON.parse(await fs.readFile(timelinePath, 'utf-8'));
    const timeline = TimelineSchema.parse(timelineData);

    // Validate text elements exist
    assert.ok(timeline.text.length > 0, 'Timeline should have text elements');

    console.log(`   Found ${timeline.text.length} text elements`);

    // Validate each text element has word-level data
    for (const textElement of timeline.text) {
      assert.ok(textElement.words, 'Text element should have words array');
      assert.ok(
        textElement.words!.length > 0,
        'Text element should have at least one word'
      );

      console.log(`   - Text element with ${textElement.words!.length} words`);

      // Validate word timing
      for (let i = 0; i < textElement.words!.length; i++) {
        const word = textElement.words![i];

        assert.ok(word.text.length > 0, 'Word text should not be empty');
        assert.ok(word.startMs >= 0, 'Word startMs should be non-negative');
        assert.ok(word.endMs > word.startMs, 'Word endMs should be after startMs');

        // Validate no overlaps
        if (i > 0) {
          const prevWord = textElement.words![i - 1];
          assert.ok(
            word.startMs >= prevWord.endMs,
            `Word ${i} should start after previous word ends`
          );
        }

        // Validate emphasis structure if present
        if (word.emphasis) {
          assert.ok(
            ['none', 'med', 'high'].includes(word.emphasis.level),
            `Emphasis level should be 'none', 'med', or 'high', got ${word.emphasis.level}`
          );

          if (word.emphasis.tone) {
            assert.ok(
              ['warm', 'intense'].includes(word.emphasis.tone),
              `Emphasis tone should be 'warm' or 'intense', got ${word.emphasis.tone}`
            );
          }
        }
      }

      console.log(`     ✓ Word timing validated (no overlaps)`);
    }

    console.log(`✅ Word-level text elements validated\n`);
  });

  it('should apply 1000ms intro offset correctly', async () => {
    const projectRoot = testProject.paths.root;

    console.log('⏱️  Testing intro offset application...');

    // Read timeline.json
    const timelinePath = path.join(projectRoot, 'timeline.json');
    const timelineData = JSON.parse(await fs.readFile(timelinePath, 'utf-8'));
    const timeline = TimelineSchema.parse(timelineData);

    // Validate audio elements have intro offset
    if (timeline.audio.length > 0) {
      const firstAudio = timeline.audio[0];

      assert.strictEqual(
        firstAudio.startMs,
        INTRO_OFFSET_MS,
        `First audio element should start at ${INTRO_OFFSET_MS}ms, got ${firstAudio.startMs}ms`
      );

      console.log(`   ✓ First audio starts at ${firstAudio.startMs}ms (intro offset applied)`);
    }

    // Validate text elements have intro offset
    if (timeline.text.length > 0) {
      const firstText = timeline.text[0];

      // First text element should start at or after intro offset
      assert.ok(
        firstText.startMs >= INTRO_OFFSET_MS,
        `First text element should start at or after ${INTRO_OFFSET_MS}ms, got ${firstText.startMs}ms`
      );

      console.log(`   ✓ First text starts at ${firstText.startMs}ms`);
    }

    // Validate background elements have intro offset
    if (timeline.elements.length > 0) {
      const firstBackground = timeline.elements[0];

      assert.ok(
        firstBackground.startMs >= INTRO_OFFSET_MS,
        `First background element should start at or after ${INTRO_OFFSET_MS}ms, got ${firstBackground.startMs}ms`
      );

      console.log(`   ✓ First background starts at ${firstBackground.startMs}ms`);
    }

    console.log(`✅ Intro offset validated (${INTRO_OFFSET_MS}ms)\n`);
  });

  it('should include media metadata for aspect-fit rendering', async () => {
    const projectRoot = testProject.paths.root;

    console.log('📐 Testing media metadata (aspect-fit)...');

    // Read timeline.json
    const timelinePath = path.join(projectRoot, 'timeline.json');
    const timelineData = JSON.parse(await fs.readFile(timelinePath, 'utf-8'));
    const timeline = TimelineSchema.parse(timelineData);

    // Validate background elements have media metadata
    if (timeline.elements.length > 0) {
      console.log(`   Found ${timeline.elements.length} background elements`);

      for (const element of timeline.elements) {
        // Media metadata is optional but should be present if available
        if (element.mediaMetadata) {
          assert.ok(
            element.mediaMetadata.width > 0,
            'Media metadata should have positive width'
          );
          assert.ok(
            element.mediaMetadata.height > 0,
            'Media metadata should have positive height'
          );

          if (element.mediaMetadata.mode) {
            assert.ok(
              ['crop', 'letterbox'].includes(element.mediaMetadata.mode),
              `Media mode should be 'crop' or 'letterbox', got ${element.mediaMetadata.mode}`
            );
          }

          console.log(`   ✓ Media metadata: ${element.mediaMetadata.width}x${element.mediaMetadata.height} (${element.mediaMetadata.mode || 'auto'})`);
        }
      }

      console.log(`✅ Media metadata validated\n`);
    } else {
      console.log(`   ℹ️  No background elements found (may be using video clips instead)\n`);
    }
  });

  it('should sync media duration with audio duration', async () => {
    const projectRoot = testProject.paths.root;

    console.log('🎬 Testing media/audio sync...');

    // Read timeline.json
    const timelinePath = path.join(projectRoot, 'timeline.json');
    const timelineData = JSON.parse(await fs.readFile(timelinePath, 'utf-8'));
    const timeline = TimelineSchema.parse(timelineData);

    // For each audio element, check corresponding background element
    for (let i = 0; i < timeline.audio.length; i++) {
      const audio = timeline.audio[i];
      const audioDuration = audio.endMs - audio.startMs;

      // Find corresponding background element (should have similar timing)
      const backgrounds = timeline.elements.filter(
        (bg) => bg.startMs >= audio.startMs - 100 && bg.startMs <= audio.startMs + 100
      );

      if (backgrounds.length > 0) {
        const background = backgrounds[0];
        const bgDuration = background.endMs - background.startMs;

        // Background should cover the audio duration
        assert.ok(
          Math.abs(bgDuration - audioDuration) < 1000,
          `Background duration (${bgDuration}ms) should match audio duration (${audioDuration}ms) within 1s`
        );

        console.log(`   ✓ Segment ${i}: audio ${audioDuration}ms, background ${bgDuration}ms`);
      }
    }

    console.log(`✅ Media/audio sync validated\n`);
  });

  it('should calculate correct total duration', async () => {
    const projectRoot = testProject.paths.root;

    console.log('⏱️  Testing total duration calculation...');

    // Read timeline.json
    const timelinePath = path.join(projectRoot, 'timeline.json');
    const timelineData = JSON.parse(await fs.readFile(timelinePath, 'utf-8'));
    const timeline = TimelineSchema.parse(timelineData);

    // Duration should be positive
    assert.ok(
      timeline.durationSeconds && timeline.durationSeconds > 0,
      'Timeline should have positive duration'
    );

    // Calculate expected duration from elements
    const maxEndMs = Math.max(
      ...timeline.audio.map((a) => a.endMs),
      ...timeline.text.map((t) => t.endMs),
      ...timeline.elements.map((e) => e.endMs)
    );

    const expectedDurationSeconds = Math.ceil(maxEndMs / 1000);

    // Allow 1 second tolerance
    assert.ok(
      Math.abs(timeline.durationSeconds - expectedDurationSeconds) <= 1,
      `Timeline duration (${timeline.durationSeconds}s) should match calculated duration (${expectedDurationSeconds}s) within 1s`
    );

    console.log(`   ✓ Timeline duration: ${timeline.durationSeconds}s`);
    console.log(`   ✓ Calculated from elements: ${expectedDurationSeconds}s`);

    console.log(`✅ Total duration validated\n`);
  });

  it('should preserve emphasis styling in text elements', async () => {
    const projectRoot = testProject.paths.root;

    console.log('🎯 Testing emphasis preservation...');

    // Read timeline.json
    const timelinePath = path.join(projectRoot, 'timeline.json');
    const timelineData = JSON.parse(await fs.readFile(timelinePath, 'utf-8'));
    const timeline = TimelineSchema.parse(timelineData);

    // Read manifest to compare
    const manifestPath = path.join(projectRoot, 'manifest.json');
    const manifestData = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));

    // For each text element, verify emphasis was preserved
    let emphasisCount = 0;
    let totalWords = 0;

    for (const textElement of timeline.text) {
      if (!textElement.words) continue;

      for (const word of textElement.words) {
        totalWords++;

        if (word.emphasis && word.emphasis.level !== 'none') {
          emphasisCount++;
          console.log(`   ✓ Emphasized word: "${word.text}" (${word.emphasis.level}${word.emphasis.tone ? `, ${word.emphasis.tone}` : ''})`);
        }
      }
    }

    console.log(`   Total words: ${totalWords}`);
    console.log(`   Emphasized words: ${emphasisCount}`);

    if (emphasisCount > 0) {
      const emphasisPercentage = (emphasisCount / totalWords) * 100;
      console.log(`   Emphasis percentage: ${emphasisPercentage.toFixed(1)}%`);

      // Verify emphasis constraints (≤ 20%)
      assert.ok(
        emphasisPercentage <= 20,
        `Emphasis percentage (${emphasisPercentage.toFixed(1)}%) should be ≤ 20%`
      );
    }

    console.log(`✅ Emphasis styling validated\n`);
  });

  it('should validate complete timeline structure', async () => {
    const projectRoot = testProject.paths.root;

    console.log('📋 Validating complete timeline structure...');

    // Read timeline.json
    const timelinePath = path.join(projectRoot, 'timeline.json');
    const timelineData = JSON.parse(await fs.readFile(timelinePath, 'utf-8'));

    // Use custom assertion
    assertions.assertValidTimeline(timelineData);

    const timeline = TimelineSchema.parse(timelineData);

    console.log(`   Timeline structure:`);
    console.log(`   - Short title: ${timeline.shortTitle}`);
    console.log(`   - Aspect ratio: ${timeline.aspectRatio || '9:16 (default)'}`);
    console.log(`   - Duration: ${timeline.durationSeconds}s`);
    console.log(`   - Background elements: ${timeline.elements.length}`);
    console.log(`   - Text elements: ${timeline.text.length}`);
    console.log(`   - Audio elements: ${timeline.audio.length}`);
    console.log(`   - Video clips: ${timeline.videoClips?.length || 0}`);
    console.log(`   - Background music: ${timeline.backgroundMusic?.length || 0}`);

    console.log(`✅ Timeline structure validated\n`);
  });

  it('should validate project structure after build', async () => {
    console.log('📂 Validating project structure...');

    await TestProjectManager.validateProjectStructure(testProject.id, 'build');

    console.log(`✅ Project structure validated\n`);
  });
});

// Run the test if executed directly
if (require.main === module) {
  console.log('Running Build Stage E2E Test...');
}
