#!/usr/bin/env node
/**
 * Stage 1: Discover E2E Test
 *
 * Tests the Discover stage:
 * Google Trends → discovered.json
 *
 * Validates:
 * 1. discovered.json is created with correct structure
 * 2. Contains 5-10 unique topics
 * 3. Topics have required fields
 * 4. Topics sorted by trendScore descending
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

// Test constants
const TEST_TIMEOUT = 300000; // 5 minutes

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

describe('Stage 1: Discover E2E Test', { timeout: TEST_TIMEOUT }, () => {
  let testProject: TestProject;
  let apiValidation: any;

  before(async () => {
    console.log('\n🚀 Starting Stage 1: Discover E2E Test...\n');

    // Validate API keys (not strictly required for Discover, but good practice)
    console.log('🔑 Validating API keys...');
    apiValidation = await APIKeyValidator.validateAll();

    // Note: Discover stage only needs Google Trends (no API key required)
    // But we validate AI provider keys since discover uses AI for filtering
    console.log('✅ API validation complete\n');

    // Create test project
    console.log('📁 Creating test project...');
    testProject = await TestProjectManager.createTestProject('test-stage-discover');
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

  it('should discover trending topics and create discovered.json', async () => {
    const projectRoot = testProject.paths.root;

    try {
      console.log('📊 Running discover stage...');

      // Execute discover command
      // Note: Discover command creates its own projectId, so we run it without one
      // and then copy the discovered.json to our test project
      const discoverResult = await executeCommand(
        'tsx',
        ['cli/commands/discover.ts', '--geo', 'US', '--limit', '10'],
        process.cwd()
      );

      assert.strictEqual(
        discoverResult.exitCode,
        0,
        `Discover stage failed: ${discoverResult.stderr}`
      );

      // Extract project ID from output
      const projectIdMatch = discoverResult.stdout.match(/Project ID: (project-\d+)/);

      if (!projectIdMatch) {
        throw new Error('Could not extract project ID from discover output');
      }

      const discoveredProjectId = projectIdMatch[1];
      console.log(`✅ Discover created project: ${discoveredProjectId}`);

      // Read the discovered.json from the auto-generated project
      const discoveredPath = path.join(
        process.cwd(),
        'public',
        'projects',
        discoveredProjectId,
        'discovered.json'
      );

      const discoveredData = JSON.parse(await fs.readFile(discoveredPath, 'utf-8'));

      // ==========================================
      // Validation 1: Schema/Structure
      // ==========================================
      console.log('\n✓ Validating schema and structure...');

      assert.ok(discoveredData, 'discovered.json should exist and be parseable');
      assert.ok(discoveredData.topics, 'discovered.json should have topics array');
      assert.ok(Array.isArray(discoveredData.topics), 'topics should be an array');
      assert.ok(discoveredData.discoveredAt, 'discovered.json should have discoveredAt timestamp');
      assert.ok(discoveredData.totalCount, 'discovered.json should have totalCount');

      console.log(`  - Found ${discoveredData.topics.length} topics`);

      // ==========================================
      // Validation 2: Topic Count (5-10 topics)
      // ==========================================
      console.log('\n✓ Validating topic count...');

      assert.ok(
        discoveredData.topics.length >= 5,
        `Should have at least 5 topics, got ${discoveredData.topics.length}`
      );

      assert.ok(
        discoveredData.topics.length <= 10,
        `Should have at most 10 topics, got ${discoveredData.topics.length}`
      );

      assert.strictEqual(
        discoveredData.totalCount,
        discoveredData.topics.length,
        'totalCount should match topics array length'
      );

      console.log(`  - Topic count: ${discoveredData.topics.length} (valid range: 5-10)`);

      // ==========================================
      // Validation 3: Topic Required Fields
      // ==========================================
      console.log('\n✓ Validating topic fields...');

      for (let i = 0; i < discoveredData.topics.length; i++) {
        const topic = discoveredData.topics[i];

        assert.ok(topic.id, `Topic ${i} should have id`);
        assert.ok(typeof topic.id === 'string', `Topic ${i} id should be string`);

        assert.ok(topic.title, `Topic ${i} should have title`);
        assert.ok(typeof topic.title === 'string', `Topic ${i} title should be string`);
        assert.ok(topic.title.length > 0, `Topic ${i} title should not be empty`);

        assert.ok(topic.description, `Topic ${i} should have description`);
        assert.ok(typeof topic.description === 'string', `Topic ${i} description should be string`);
        assert.ok(topic.description.length > 0, `Topic ${i} description should not be empty`);

        assert.ok(topic.source, `Topic ${i} should have source`);
        assert.strictEqual(topic.source, 'google-trends', `Topic ${i} source should be 'google-trends'`);

        assert.ok(topic.trendScore !== undefined, `Topic ${i} should have trendScore`);
        assert.ok(typeof topic.trendScore === 'number', `Topic ${i} trendScore should be number`);
        assert.ok(
          topic.trendScore >= 0 && topic.trendScore <= 100,
          `Topic ${i} trendScore should be 0-100, got ${topic.trendScore}`
        );

        assert.ok(topic.category, `Topic ${i} should have category`);
        assert.ok(typeof topic.category === 'string', `Topic ${i} category should be string`);

        assert.ok(topic.discoveredAt, `Topic ${i} should have discoveredAt timestamp`);
        assert.ok(typeof topic.discoveredAt === 'string', `Topic ${i} discoveredAt should be string`);
      }

      console.log(`  - All ${discoveredData.topics.length} topics have required fields`);

      // ==========================================
      // Validation 4: Topics Sorted by Score
      // ==========================================
      console.log('\n✓ Validating topic sorting...');

      for (let i = 0; i < discoveredData.topics.length - 1; i++) {
        const current = discoveredData.topics[i];
        const next = discoveredData.topics[i + 1];

        assert.ok(
          current.trendScore >= next.trendScore,
          `Topics should be sorted by trendScore descending (topic ${i}: ${current.trendScore}, topic ${i + 1}: ${next.trendScore})`
        );
      }

      console.log('  - Topics correctly sorted by trendScore (descending)');

      // ==========================================
      // Validation 5: Topic Uniqueness
      // ==========================================
      console.log('\n✓ Validating topic uniqueness...');

      const titles = new Set<string>();
      const ids = new Set<string>();

      for (const topic of discoveredData.topics) {
        assert.ok(!titles.has(topic.title), `Duplicate topic title found: ${topic.title}`);
        assert.ok(!ids.has(topic.id), `Duplicate topic ID found: ${topic.id}`);

        titles.add(topic.title);
        ids.add(topic.id);
      }

      console.log(`  - All ${discoveredData.topics.length} topics are unique`);

      // ==========================================
      // Validation 6: Project Structure
      // ==========================================
      console.log('\n✓ Validating project structure...');

      // Copy discovered.json to our test project for validation
      await fs.copyFile(
        discoveredPath,
        path.join(projectRoot, 'discovered.json')
      );

      await TestProjectManager.validateProjectStructure(testProject.id, 'discover');

      console.log('  - Project structure validated');

      // ==========================================
      // Success Summary
      // ==========================================
      console.log('\n✅ STAGE 1: DISCOVER TEST PASSED!');
      console.log(`   Topics discovered: ${discoveredData.topics.length}`);
      console.log(`   Top 3 topics:`);
      discoveredData.topics.slice(0, 3).forEach((topic: any, idx: number) => {
        console.log(`     ${idx + 1}. [${topic.category}] ${topic.title} (score: ${topic.trendScore})`);
      });
      console.log(`   discovered.json: ${path.join(projectRoot, 'discovered.json')}\n`);

      // Cleanup the auto-generated project
      const autoProjectRoot = path.join(process.cwd(), 'public', 'projects', discoveredProjectId);
      await fs.rm(autoProjectRoot, { recursive: true, force: true });
      console.log(`✅ Cleaned up auto-generated project: ${discoveredProjectId}\n`);

    } catch (error: any) {
      // Preserve artifacts on failure
      console.error('\n❌ Discover test failed:', error.message);

      const preservedPath = await TestProjectManager.preserveTestProject(
        testProject.id,
        `stage-discover-failure-${Date.now()}`
      );

      console.log(`\n📦 Test artifacts preserved at: ${preservedPath}`);

      throw error;
    }
  });
});

// Run the test if executed directly
if (require.main === module) {
  console.log('Running Stage 1: Discover E2E Test...');
}
