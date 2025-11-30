#!/usr/bin/env node
/**
 * Stage 4: Script E2E Test
 *
 * Tests the Script stage:
 * AI script generation → script-v1.json
 *
 * Validates:
 * 1. scripts/script-v1.json is created with correct structure
 * 2. 4-5 segments generated
 * 3. Total duration: 600-840 seconds (target ~720s)
 * 4. Each segment has: id, narrative, estimatedDurationMs, visualHints
 * 5. Segment durations: 10-300 seconds each
 * 6. Visual hints: 3-5 keywords per segment
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
import { assertValidScript } from './helpers/assertions';
import { mockRefinedTopic } from './helpers/fixtures';

// Test constants
const TEST_TIMEOUT = 300000; // 5 minutes (AI calls can be slow)

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

describe('Stage 4: Script E2E Test', { timeout: TEST_TIMEOUT }, () => {
  let testProject: TestProject;
  let apiValidation: any;

  before(async () => {
    console.log('\n🚀 Starting Stage 4: Script E2E Test...\n');

    // Validate API keys (AI provider required)
    console.log('🔑 Validating API keys...');
    apiValidation = await APIKeyValidator.validateAll();

    // Check if AI provider is available
    const hasAIProvider = process.env.GEMINI_API_KEY ||
                          process.env.OPENAI_API_KEY ||
                          process.env.ANTHROPIC_API_KEY;

    if (!hasAIProvider) {
      console.log('⏭️  Skipping test: No AI provider API key found');
      console.log('Required: GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY');
      return;
    }

    console.log('✅ API validation complete\n');

    // Create test project
    console.log('📁 Creating test project...');
    testProject = await TestProjectManager.createTestProject('test-stage-script');
    console.log(`✅ Test project created: ${testProject.id}\n`);

    // Create refined.json with mock data
    console.log('📝 Creating mock refined.json...');
    await fs.writeFile(
      testProject.paths.refined,
      JSON.stringify(mockRefinedTopic, null, 2),
      'utf-8'
    );
    console.log('✅ Mock refined.json created\n');
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

  it('should generate a script and create script-v1.json', async () => {
    // Check if AI provider is available
    const hasAIProvider = process.env.GEMINI_API_KEY ||
                          process.env.OPENAI_API_KEY ||
                          process.env.ANTHROPIC_API_KEY;

    if (!hasAIProvider) {
      console.log('⏭️  Test skipped due to missing AI provider keys');
      return;
    }

    const projectRoot = testProject.paths.root;

    try {
      console.log('📝 Running script stage...');

      // Execute script command
      const scriptResult = await executeCommand(
        'tsx',
        ['cli/commands/script.ts', '--project', testProject.id],
        process.cwd()
      );

      assert.strictEqual(
        scriptResult.exitCode,
        0,
        `Script stage failed: ${scriptResult.stderr}`
      );

      console.log('✅ Script stage completed');

      // Read script-v1.json
      const scriptPath = path.join(testProject.paths.scripts, 'script-v1.json');
      const scriptData = JSON.parse(await fs.readFile(scriptPath, 'utf-8'));

      // ==========================================
      // Validation 1: Schema/Structure (using assertion helper)
      // ==========================================
      console.log('\n✓ Validating schema and structure...');

      assertValidScript(scriptData);

      console.log('  - Schema validated');

      // ==========================================
      // Validation 2: Script Metadata
      // ==========================================
      console.log('\n✓ Validating script metadata...');

      assert.ok(scriptData.title, 'Script should have title');
      assert.ok(typeof scriptData.title === 'string', 'Script title should be string');

      assert.ok(scriptData.version !== undefined, 'Script should have version');
      assert.strictEqual(scriptData.version, 1, 'Script version should be 1');

      assert.ok(
        scriptData.totalEstimatedDurationMs !== undefined,
        'Script should have totalEstimatedDurationMs'
      );
      assert.ok(
        typeof scriptData.totalEstimatedDurationMs === 'number',
        'totalEstimatedDurationMs should be number'
      );

      assert.ok(scriptData.generatedAt, 'Script should have generatedAt timestamp');
      assert.ok(typeof scriptData.generatedAt === 'string', 'generatedAt should be string');

      console.log(`  - Title: "${scriptData.title}"`);
      console.log(`  - Version: ${scriptData.version}`);

      // ==========================================
      // Validation 3: Segment Count (4-5 segments)
      // ==========================================
      console.log('\n✓ Validating segment count...');

      assert.ok(Array.isArray(scriptData.segments), 'Script should have segments array');

      assert.ok(
        scriptData.segments.length >= 4,
        `Should have at least 4 segments, got ${scriptData.segments.length}`
      );

      assert.ok(
        scriptData.segments.length <= 5,
        `Should have at most 5 segments, got ${scriptData.segments.length}`
      );

      console.log(`  - Segment count: ${scriptData.segments.length} (valid range: 4-5)`);

      // ==========================================
      // Validation 4: Segment Fields
      // ==========================================
      console.log('\n✓ Validating segment fields...');

      for (let i = 0; i < scriptData.segments.length; i++) {
        const segment = scriptData.segments[i];

        assert.ok(segment.id, `Segment ${i} should have id`);
        assert.ok(typeof segment.id === 'string', `Segment ${i} id should be string`);

        assert.ok(segment.order !== undefined, `Segment ${i} should have order`);
        assert.strictEqual(segment.order, i + 1, `Segment ${i} order should be ${i + 1}`);

        assert.ok(segment.text, `Segment ${i} should have text (narrative)`);
        assert.ok(typeof segment.text === 'string', `Segment ${i} text should be string`);
        assert.ok(segment.text.length > 0, `Segment ${i} text should not be empty`);

        assert.ok(
          segment.estimatedDurationMs !== undefined,
          `Segment ${i} should have estimatedDurationMs`
        );
        assert.ok(
          typeof segment.estimatedDurationMs === 'number',
          `Segment ${i} estimatedDurationMs should be number`
        );
      }

      console.log(`  - All ${scriptData.segments.length} segments have required fields`);

      // ==========================================
      // Validation 5: Segment Durations (10-300s each)
      // ==========================================
      console.log('\n✓ Validating segment durations...');

      for (let i = 0; i < scriptData.segments.length; i++) {
        const segment = scriptData.segments[i];
        const durationSeconds = segment.estimatedDurationMs / 1000;

        assert.ok(
          durationSeconds >= 10,
          `Segment ${i} duration should be at least 10s, got ${durationSeconds}s`
        );

        assert.ok(
          durationSeconds <= 300,
          `Segment ${i} duration should be at most 300s, got ${durationSeconds}s`
        );

        console.log(`  - Segment ${i + 1}: ${durationSeconds}s`);
      }

      // ==========================================
      // Validation 6: Total Duration (600-840s)
      // ==========================================
      console.log('\n✓ Validating total duration...');

      const totalSeconds = scriptData.totalEstimatedDurationMs / 1000;
      const totalMinutes = Math.floor(totalSeconds / 60);
      const remainingSeconds = Math.floor(totalSeconds % 60);

      assert.ok(
        totalSeconds >= 600,
        `Total duration should be at least 600s, got ${totalSeconds}s`
      );

      assert.ok(
        totalSeconds <= 840,
        `Total duration should be at most 840s, got ${totalSeconds}s`
      );

      console.log(`  - Total duration: ${totalSeconds}s (${totalMinutes}m ${remainingSeconds}s)`);
      console.log(`  - Target range: 600-840s (10-14 minutes)`);

      // ==========================================
      // Validation 7: Duration Consistency
      // ==========================================
      console.log('\n✓ Validating duration consistency...');

      const calculatedTotal = scriptData.segments.reduce(
        (sum: number, seg: any) => sum + seg.estimatedDurationMs,
        0
      );

      assert.strictEqual(
        scriptData.totalEstimatedDurationMs,
        calculatedTotal,
        'totalEstimatedDurationMs should match sum of segment durations'
      );

      console.log('  - Duration calculation verified');

      // ==========================================
      // Validation 8: Project Structure
      // ==========================================
      console.log('\n✓ Validating project structure...');

      await TestProjectManager.validateProjectStructure(testProject.id, 'script');

      console.log('  - Project structure validated');

      // ==========================================
      // Success Summary
      // ==========================================
      console.log('\n✅ STAGE 4: SCRIPT TEST PASSED!');
      console.log(`   Script title: "${scriptData.title}"`);
      console.log(`   Segments: ${scriptData.segments.length}`);
      console.log(`   Total duration: ${totalMinutes}m ${remainingSeconds}s`);
      console.log(`   script-v1.json: ${scriptPath}\n`);

      // Display segment summary
      console.log('   Segment breakdown:');
      scriptData.segments.forEach((seg: any, idx: number) => {
        const segSeconds = Math.floor(seg.estimatedDurationMs / 1000);
        const segMinutes = Math.floor(segSeconds / 60);
        const segRemaining = segSeconds % 60;
        console.log(`     ${idx + 1}. ${seg.id} - ${segMinutes}m ${segRemaining}s`);
      });
      console.log('');

    } catch (error: any) {
      // Preserve artifacts on failure
      console.error('\n❌ Script test failed:', error.message);

      const preservedPath = await TestProjectManager.preserveTestProject(
        testProject.id,
        `stage-script-failure-${Date.now()}`
      );

      console.log(`\n📦 Test artifacts preserved at: ${preservedPath}`);

      throw error;
    }
  });
});

// Run the test if executed directly
if (require.main === module) {
  console.log('Running Stage 4: Script E2E Test...');
}
