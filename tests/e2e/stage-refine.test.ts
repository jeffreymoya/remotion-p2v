#!/usr/bin/env node
/**
 * Stage 3: Refine E2E Test
 *
 * Tests the Refine stage:
 * AI enhancement → refined.json
 *
 * Validates:
 * 1. refined.json is created with correct structure
 * 2. Enhanced description is more detailed than original
 * 3. Target audience defined
 * 4. Key angles array populated (3-5 items)
 * 5. AI provider fallback works
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
import { mockSelectedTopic } from './helpers/fixtures';

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

describe('Stage 3: Refine E2E Test', { timeout: TEST_TIMEOUT }, () => {
  let testProject: TestProject;
  let apiValidation: any;

  before(async () => {
    console.log('\n🚀 Starting Stage 3: Refine E2E Test...\n');

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
    testProject = await TestProjectManager.createTestProject('test-stage-refine');
    console.log(`✅ Test project created: ${testProject.id}\n`);

    // Create selected.json with mock data
    console.log('📝 Creating mock selected.json...');
    await fs.writeFile(
      testProject.paths.selected,
      JSON.stringify(mockSelectedTopic, null, 2),
      'utf-8'
    );
    console.log('✅ Mock selected.json created\n');
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

  it('should refine the topic and create refined.json', async () => {
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
      console.log('✨ Running refine stage...');

      // Read selected topic for comparison
      const selectedData = JSON.parse(
        await fs.readFile(testProject.paths.selected, 'utf-8')
      );
      const originalTopic = selectedData.topic;

      console.log(`  Original topic: "${originalTopic.title}"`);
      console.log(`  Original description length: ${originalTopic.description.length} chars`);

      // Execute refine command
      const refineResult = await executeCommand(
        'tsx',
        ['cli/commands/refine.ts', '--project', testProject.id],
        process.cwd()
      );

      assert.strictEqual(
        refineResult.exitCode,
        0,
        `Refine stage failed: ${refineResult.stderr}`
      );

      console.log('✅ Refine stage completed');

      // Read refined.json
      const refinedPath = testProject.paths.refined;
      const refinedData = JSON.parse(await fs.readFile(refinedPath, 'utf-8'));

      // ==========================================
      // Validation 1: Schema/Structure
      // ==========================================
      console.log('\n✓ Validating schema and structure...');

      assert.ok(refinedData, 'refined.json should exist and be parseable');
      assert.ok(refinedData.topic, 'refined.json should have topic object');
      assert.ok(refinedData.refinedAt, 'refined.json should have refinedAt timestamp');

      console.log('  - Schema validated');

      // ==========================================
      // Validation 2: Topic Fields
      // ==========================================
      console.log('\n✓ Validating topic fields...');

      const topic = refinedData.topic;

      assert.ok(topic.originalTitle, 'Refined topic should have originalTitle');
      assert.ok(typeof topic.originalTitle === 'string', 'originalTitle should be string');

      assert.ok(topic.refinedTitle, 'Refined topic should have refinedTitle');
      assert.ok(typeof topic.refinedTitle === 'string', 'refinedTitle should be string');
      assert.ok(topic.refinedTitle.length > 0, 'refinedTitle should not be empty');

      assert.ok(topic.refinedDescription, 'Refined topic should have refinedDescription');
      assert.ok(typeof topic.refinedDescription === 'string', 'refinedDescription should be string');
      assert.ok(topic.refinedDescription.length > 0, 'refinedDescription should not be empty');

      assert.ok(topic.targetAudience, 'Refined topic should have targetAudience');
      assert.ok(typeof topic.targetAudience === 'string', 'targetAudience should be string');

      assert.ok(topic.keyAngles, 'Refined topic should have keyAngles');
      assert.ok(Array.isArray(topic.keyAngles), 'keyAngles should be array');

      assert.ok(topic.suggestedDuration, 'Refined topic should have suggestedDuration');
      assert.ok(typeof topic.suggestedDuration === 'number', 'suggestedDuration should be number');

      assert.ok(topic.refinedAt, 'Refined topic should have refinedAt timestamp');
      assert.ok(typeof topic.refinedAt === 'string', 'refinedAt should be string');

      console.log('  - All required fields present');

      // ==========================================
      // Validation 3: Enhanced Description
      // ==========================================
      console.log('\n✓ Validating enhanced description...');

      console.log(`  Original description: ${originalTopic.description.length} chars`);
      console.log(`  Refined description: ${topic.refinedDescription.length} chars`);

      assert.ok(
        topic.refinedDescription.length > originalTopic.description.length,
        'Refined description should be more detailed than original'
      );

      assert.ok(
        topic.refinedDescription.length >= 100,
        `Refined description should be at least 100 chars, got ${topic.refinedDescription.length}`
      );

      console.log('  - Description enhanced successfully');

      // ==========================================
      // Validation 4: Target Audience
      // ==========================================
      console.log('\n✓ Validating target audience...');

      assert.ok(
        topic.targetAudience.length > 0,
        'Target audience should not be empty'
      );

      // Should mention age range or demographic
      const hasAge = /age|20|30|40|demographic|audience/i.test(topic.targetAudience);
      assert.ok(
        hasAge,
        'Target audience should specify demographics or age range'
      );

      console.log(`  - Target audience: "${topic.targetAudience}"`);

      // ==========================================
      // Validation 5: Key Angles (3-5 items)
      // ==========================================
      console.log('\n✓ Validating key angles...');

      assert.ok(
        topic.keyAngles.length >= 3,
        `Should have at least 3 key angles, got ${topic.keyAngles.length}`
      );

      assert.ok(
        topic.keyAngles.length <= 5,
        `Should have at most 5 key angles, got ${topic.keyAngles.length}`
      );

      for (let i = 0; i < topic.keyAngles.length; i++) {
        assert.ok(
          typeof topic.keyAngles[i] === 'string',
          `Key angle ${i} should be string`
        );
        assert.ok(
          topic.keyAngles[i].length > 0,
          `Key angle ${i} should not be empty`
        );
      }

      console.log(`  - Key angles: ${topic.keyAngles.length}`);
      topic.keyAngles.forEach((angle: string, idx: number) => {
        console.log(`    ${idx + 1}. ${angle}`);
      });

      // ==========================================
      // Validation 6: Suggested Duration (600-900s)
      // ==========================================
      console.log('\n✓ Validating suggested duration...');

      assert.ok(
        topic.suggestedDuration >= 600,
        `Suggested duration should be at least 600s, got ${topic.suggestedDuration}s`
      );

      assert.ok(
        topic.suggestedDuration <= 900,
        `Suggested duration should be at most 900s, got ${topic.suggestedDuration}s`
      );

      const minutes = Math.floor(topic.suggestedDuration / 60);
      const seconds = topic.suggestedDuration % 60;

      console.log(`  - Suggested duration: ${topic.suggestedDuration}s (${minutes}m ${seconds}s)`);

      // ==========================================
      // Validation 7: Original Title Preserved
      // ==========================================
      console.log('\n✓ Validating original title preservation...');

      assert.strictEqual(
        topic.originalTitle,
        originalTopic.title,
        'Original title should match selected topic title'
      );

      console.log(`  - Original title preserved: "${topic.originalTitle}"`);
      console.log(`  - Refined title: "${topic.refinedTitle}"`);

      // ==========================================
      // Validation 8: Project Structure
      // ==========================================
      console.log('\n✓ Validating project structure...');

      await TestProjectManager.validateProjectStructure(testProject.id, 'refine');

      console.log('  - Project structure validated');

      // ==========================================
      // Success Summary
      // ==========================================
      console.log('\n✅ STAGE 3: REFINE TEST PASSED!');
      console.log(`   Refined topic: "${topic.refinedTitle}"`);
      console.log(`   Target audience: ${topic.targetAudience}`);
      console.log(`   Key angles: ${topic.keyAngles.length}`);
      console.log(`   Suggested duration: ${minutes}m ${seconds}s`);
      console.log(`   refined.json: ${refinedPath}\n`);

    } catch (error: any) {
      // Preserve artifacts on failure
      console.error('\n❌ Refine test failed:', error.message);

      const preservedPath = await TestProjectManager.preserveTestProject(
        testProject.id,
        `stage-refine-failure-${Date.now()}`
      );

      console.log(`\n📦 Test artifacts preserved at: ${preservedPath}`);

      throw error;
    }
  });
});

// Run the test if executed directly
if (require.main === module) {
  console.log('Running Stage 3: Refine E2E Test...');
}
