#!/usr/bin/env node
/**
 * Stage 2: Curate E2E Test
 *
 * Tests the Curate stage:
 * Topic selection → selected.json
 *
 * Validates:
 * 1. selected.json is created with correct structure
 * 2. Exactly 1 topic selected
 * 3. Selected topic exists in discovered topics
 * 4. Auto-selection mode works correctly
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
import { mockDiscoveredTopics } from './helpers/fixtures';

// Test constants
const TEST_TIMEOUT = 60000; // 1 minute

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

describe('Stage 2: Curate E2E Test', { timeout: TEST_TIMEOUT }, () => {
  let testProject: TestProject;
  let apiValidation: any;

  before(async () => {
    console.log('\n🚀 Starting Stage 2: Curate E2E Test...\n');

    // Validate API keys
    console.log('🔑 Validating API keys...');
    apiValidation = await APIKeyValidator.validateAll();
    console.log('✅ API validation complete\n');

    // Create test project
    console.log('📁 Creating test project...');
    testProject = await TestProjectManager.createTestProject('test-stage-curate');
    console.log(`✅ Test project created: ${testProject.id}\n`);

    // Create discovered.json with mock data
    console.log('📝 Creating mock discovered.json...');
    await fs.writeFile(
      testProject.paths.discovered,
      JSON.stringify(mockDiscoveredTopics, null, 2),
      'utf-8'
    );
    console.log('✅ Mock discovered.json created\n');
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

  it('should select a topic and create selected.json', async () => {
    const projectRoot = testProject.paths.root;

    try {
      console.log('🎯 Running curate stage (auto-selection mode)...');

      // Execute curate command with auto-selection
      const curateResult = await executeCommand(
        'tsx',
        [
          'cli/commands/curate.ts',
          '--project', testProject.id,
          '--auto',
          '--index', '0', // Select first (highest scored) topic
        ],
        process.cwd()
      );

      assert.strictEqual(
        curateResult.exitCode,
        0,
        `Curate stage failed: ${curateResult.stderr}`
      );

      console.log('✅ Curate stage completed');

      // Read selected.json
      const selectedPath = testProject.paths.selected;
      const selectedData = JSON.parse(await fs.readFile(selectedPath, 'utf-8'));

      // ==========================================
      // Validation 1: Schema/Structure
      // ==========================================
      console.log('\n✓ Validating schema and structure...');

      assert.ok(selectedData, 'selected.json should exist and be parseable');
      assert.ok(selectedData.topic, 'selected.json should have topic object');
      assert.ok(selectedData.selectedAt, 'selected.json should have selectedAt timestamp');

      console.log('  - Schema validated');

      // ==========================================
      // Validation 2: Topic Fields
      // ==========================================
      console.log('\n✓ Validating topic fields...');

      const topic = selectedData.topic;

      assert.ok(topic.id, 'Selected topic should have id');
      assert.ok(typeof topic.id === 'string', 'Selected topic id should be string');

      assert.ok(topic.title, 'Selected topic should have title');
      assert.ok(typeof topic.title === 'string', 'Selected topic title should be string');
      assert.ok(topic.title.length > 0, 'Selected topic title should not be empty');

      assert.ok(topic.description, 'Selected topic should have description');
      assert.ok(typeof topic.description === 'string', 'Selected topic description should be string');
      assert.ok(topic.description.length > 0, 'Selected topic description should not be empty');

      assert.ok(topic.category, 'Selected topic should have category');
      assert.ok(typeof topic.category === 'string', 'Selected topic category should be string');

      assert.ok(topic.selectedAt, 'Selected topic should have selectedAt timestamp');
      assert.ok(typeof topic.selectedAt === 'string', 'Selected topic selectedAt should be string');

      console.log('  - All required fields present');

      // ==========================================
      // Validation 3: Selected Topic Exists in Discovered
      // ==========================================
      console.log('\n✓ Validating topic selection...');

      // Read discovered topics
      const discoveredPath = testProject.paths.discovered;
      const discoveredData = JSON.parse(await fs.readFile(discoveredPath, 'utf-8'));

      // Find selected topic in discovered topics
      const matchingTopic = discoveredData.topics.find((t: any) => t.id === topic.id);

      assert.ok(
        matchingTopic,
        `Selected topic ID ${topic.id} should exist in discovered topics`
      );

      assert.strictEqual(
        topic.title,
        matchingTopic.title,
        'Selected topic title should match discovered topic'
      );

      assert.strictEqual(
        topic.description,
        matchingTopic.description,
        'Selected topic description should match discovered topic'
      );

      assert.strictEqual(
        topic.category,
        matchingTopic.category,
        'Selected topic category should match discovered topic'
      );

      console.log(`  - Selected topic: "${topic.title}"`);
      console.log(`  - Category: ${topic.category}`);
      console.log(`  - Matches discovered topic: ${matchingTopic.id}`);

      // ==========================================
      // Validation 4: Auto-Selection by Index
      // ==========================================
      console.log('\n✓ Validating auto-selection logic...');

      // Since we selected index 0, it should be the highest scored topic
      const sortedTopics = [...discoveredData.topics].sort(
        (a: any, b: any) => (b.trendScore || 0) - (a.trendScore || 0)
      );

      assert.strictEqual(
        topic.id,
        sortedTopics[0].id,
        'Auto-selected topic (index 0) should be the highest scored topic'
      );

      console.log(`  - Auto-selection correctly chose highest scored topic`);
      console.log(`  - Trend score: ${matchingTopic.trendScore}`);

      // ==========================================
      // Validation 5: Project Structure
      // ==========================================
      console.log('\n✓ Validating project structure...');

      await TestProjectManager.validateProjectStructure(testProject.id, 'curate');

      console.log('  - Project structure validated');

      // ==========================================
      // Success Summary
      // ==========================================
      console.log('\n✅ STAGE 2: CURATE TEST PASSED!');
      console.log(`   Selected topic: "${topic.title}"`);
      console.log(`   Category: ${topic.category}`);
      console.log(`   selected.json: ${selectedPath}\n`);

    } catch (error: any) {
      // Preserve artifacts on failure
      console.error('\n❌ Curate test failed:', error.message);

      const preservedPath = await TestProjectManager.preserveTestProject(
        testProject.id,
        `stage-curate-failure-${Date.now()}`
      );

      console.log(`\n📦 Test artifacts preserved at: ${preservedPath}`);

      throw error;
    }
  });

  it('should allow selecting different topics by index', async () => {
    const projectRoot = testProject.paths.root;

    try {
      console.log('\n🎯 Testing topic selection by index...');

      // Read discovered topics
      const discoveredPath = testProject.paths.discovered;
      const discoveredData = JSON.parse(await fs.readFile(discoveredPath, 'utf-8'));

      // Select second topic (index 1)
      const curateResult = await executeCommand(
        'tsx',
        [
          'cli/commands/curate.ts',
          '--project', testProject.id,
          '--auto',
          '--index', '1',
        ],
        process.cwd()
      );

      assert.strictEqual(
        curateResult.exitCode,
        0,
        `Curate stage failed: ${curateResult.stderr}`
      );

      // Read selected.json
      const selectedPath = testProject.paths.selected;
      const selectedData = JSON.parse(await fs.readFile(selectedPath, 'utf-8'));

      // Verify correct topic selected
      const sortedTopics = [...discoveredData.topics].sort(
        (a: any, b: any) => (b.trendScore || 0) - (a.trendScore || 0)
      );

      assert.strictEqual(
        selectedData.topic.id,
        sortedTopics[1].id,
        'Should select topic at index 1'
      );

      console.log(`✅ Successfully selected topic at index 1: "${selectedData.topic.title}"`);

    } catch (error: any) {
      console.error('\n❌ Index selection test failed:', error.message);
      throw error;
    }
  });
});

// Run the test if executed directly
if (require.main === module) {
  console.log('Running Stage 2: Curate E2E Test...');
}
