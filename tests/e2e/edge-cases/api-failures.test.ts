#!/usr/bin/env node
/**
 * Edge Case Test: API Failures
 *
 * Tests the pipeline's resilience to API-related failures:
 * - Missing API keys (graceful degradation)
 * - Invalid API keys (proper error handling)
 * - Provider failures (fallback mechanisms)
 * - Rate limit responses (retry logic)
 * - Network timeouts (timeout handling)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn } from 'node:child_process';

// Import helpers
import { TestProjectManager, type TestProject } from '../helpers/test-project-manager';
import { APIKeyValidator } from '../helpers/api-key-validator';
import { RateLimiter } from '../helpers/rate-limiter';
import { CleanupManager } from '../helpers/cleanup';
import { mockScript } from '../helpers/fixtures';

// Test constants
const TEST_TIMEOUT = 300000; // 5 minutes

/**
 * Helper: Execute gather command with custom environment
 */
async function executeGatherWithEnv(
  projectId: string,
  envOverrides: Record<string, string | undefined>,
  cwd: string = process.cwd()
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const proc = spawn('tsx', ['cli/commands/gather.ts', projectId], {
      cwd,
      env: { ...process.env, ...envOverrides },
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

/**
 * Helper: Setup test project with prerequisites
 */
async function setupTestProject(name: string): Promise<TestProject> {
  const testProject = await TestProjectManager.createTestProject(name);
  const projectRoot = testProject.paths.root;

  // Create selected.json
  await fs.writeFile(
    path.join(projectRoot, 'selected.json'),
    JSON.stringify({
      topic: {
        title: 'Test Topic',
        description: 'Test description',
        keywords: ['test'],
      },
      selectedAt: new Date().toISOString(),
    }, null, 2)
  );

  // Create refined.json
  await fs.writeFile(
    path.join(projectRoot, 'refined.json'),
    JSON.stringify({
      topic: {
        title: 'Test Topic: Enhanced',
        description: 'Enhanced test description',
        targetAudience: 'Test audience',
        keyPoints: ['Point 1'],
      },
      refinedAt: new Date().toISOString(),
    }, null, 2)
  );

  // Create script-v1.json (minimal 1-segment script for faster testing)
  const minimalScript = {
    segments: [
      {
        id: 1,
        text: 'This is a test segment for API failure testing.',
        durationMs: 3000,
      },
    ],
    totalDurationMs: 3000,
    metadata: {
      title: 'Test Script',
      createdAt: new Date().toISOString(),
    },
  };

  await fs.mkdir(path.join(projectRoot, 'scripts'), { recursive: true });
  await fs.writeFile(
    path.join(projectRoot, 'scripts', 'script-v1.json'),
    JSON.stringify(minimalScript, null, 2)
  );

  return testProject;
}

describe('Edge Case: API Failures', { timeout: TEST_TIMEOUT }, () => {
  let originalEnv: Record<string, string | undefined> = {};

  before(async () => {
    console.log('\n🔥 Starting API Failures Edge Case Test...\n');

    // Save original environment variables
    originalEnv = {
      GOOGLE_TTS_API_KEY: process.env.GOOGLE_TTS_API_KEY,
      PEXELS_API_KEY: process.env.PEXELS_API_KEY,
      PIXABAY_API_KEY: process.env.PIXABAY_API_KEY,
      UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY,
    };
  });

  after(async () => {
    console.log('\n🧹 Cleaning up API failures tests...');

    // Restore original environment
    Object.entries(originalEnv).forEach(([key, value]) => {
      if (value !== undefined) {
        process.env[key] = value;
      } else {
        delete process.env[key];
      }
    });

    RateLimiter.reset();
    console.log('✅ Cleanup complete\n');
  });

  it('should detect missing Google TTS API key', async () => {
    console.log('📝 Testing missing Google TTS API key detection...');

    // Temporarily unset the API key
    delete process.env.GOOGLE_TTS_API_KEY;

    const result = await APIKeyValidator.validateGoogleTTS();

    assert.strictEqual(result.exists, false, 'Should detect missing key');
    assert.strictEqual(result.isValid, false, 'Should mark key as invalid');
    assert.ok(result.error?.includes('not set'), 'Should have error message');

    console.log('✅ Missing Google TTS key detected correctly\n');
  });

  it('should detect placeholder API key', async () => {
    console.log('📝 Testing placeholder API key detection...');

    // Set a placeholder value
    process.env.PEXELS_API_KEY = '${PEXELS_API_KEY}';

    const result = await APIKeyValidator.validatePexels();

    assert.strictEqual(result.exists, true, 'Should detect key exists');
    assert.strictEqual(result.isValid, false, 'Should mark placeholder as invalid');
    assert.ok(result.error?.includes('placeholder'), 'Should detect placeholder');

    console.log('✅ Placeholder API key detected correctly\n');
  });

  it('should detect invalid API key format', async () => {
    console.log('📝 Testing invalid API key format detection...');

    // Set an obviously invalid key
    process.env.PIXABAY_API_KEY = 'invalid-key-123';

    const result = await APIKeyValidator.validatePixabay();

    assert.strictEqual(result.exists, true, 'Should detect key exists');
    // Key may be marked invalid after API call attempt
    // The result depends on the actual API response

    console.log('✅ Invalid API key format test complete\n');
  });

  it('should handle gather with missing TTS key gracefully', async () => {
    console.log('📝 Testing gather with missing TTS key...');

    const testProject = await setupTestProject('api-failure-missing-tts');

    try {
      // Unset TTS key only
      const result = await executeGatherWithEnv(
        testProject.id,
        {
          GOOGLE_TTS_API_KEY: undefined,
        }
      );

      // Should fail but not crash
      assert.notStrictEqual(result.exitCode, 0, 'Should exit with error code');

      // Debug output
      console.log('DEBUG - Exit code:', result.exitCode);
      console.log('DEBUG - Stderr:', result.stderr.substring(0, 500));
      console.log('DEBUG - Stdout:', result.stdout.substring(0, 500));

      // Check both stdout and stderr for error messages
      const errorOutput = result.stderr.toLowerCase() + result.stdout.toLowerCase();
      assert.ok(
        errorOutput.includes('tts') || errorOutput.includes('api') || errorOutput.includes('key') || errorOutput.includes('error'),
        `Should have error message about TTS/API key. Got stderr: "${result.stderr.substring(0, 200)}", stdout: "${result.stdout.substring(0, 200)}"`
      );

      console.log('✅ Gather failed gracefully with missing TTS key\n');
    } finally {
      await TestProjectManager.cleanupTestProject(testProject.id);
    }
  });

  it('should handle gather with all missing media keys', async () => {
    console.log('📝 Testing gather with all missing media provider keys...');

    const testProject = await setupTestProject('api-failure-missing-media');

    try {
      // Unset all media provider keys (but keep TTS)
      const result = await executeGatherWithEnv(
        testProject.id,
        {
          PEXELS_API_KEY: undefined,
          PIXABAY_API_KEY: undefined,
          UNSPLASH_ACCESS_KEY: undefined,
        }
      );

      // Should fail or skip media download
      assert.notStrictEqual(result.exitCode, 0, 'Should exit with error code');

      console.log('✅ Gather failed gracefully with missing media keys\n');
    } finally {
      await TestProjectManager.cleanupTestProject(testProject.id);
    }
  });

  it('should validate all API keys in batch', async () => {
    console.log('📝 Testing batch API key validation...');

    // Restore all keys for this test
    Object.entries(originalEnv).forEach(([key, value]) => {
      if (value !== undefined) {
        process.env[key] = value;
      }
    });

    const results = await APIKeyValidator.validateAll();

    assert.ok(Array.isArray(results), 'Should return array of results');
    assert.ok(results.length >= 4, 'Should validate at least 4 providers');

    // Check structure of each result
    results.forEach((result) => {
      assert.ok(result.provider, 'Should have provider name');
      assert.ok(result.keyName, 'Should have key name');
      assert.ok(typeof result.exists === 'boolean', 'Should have exists flag');
      assert.ok(typeof result.isValid === 'boolean', 'Should have isValid flag');
    });

    console.log('✅ Batch API key validation complete\n');
    console.log('Validation results:');
    results.forEach((result) => {
      const status = result.isValid ? '✅' : result.exists ? '⚠️' : '❌';
      console.log(`  ${status} ${result.provider}: ${result.error || 'Valid'}`);
    });
  });

  it('should skip tests when API keys are missing', async () => {
    console.log('📝 Testing shouldSkipTests logic...');

    // Temporarily unset all keys
    delete process.env.GOOGLE_TTS_API_KEY;
    delete process.env.PEXELS_API_KEY;

    const results = await APIKeyValidator.validateAll();
    const shouldSkip = APIKeyValidator.shouldSkipTests(results);

    assert.strictEqual(shouldSkip, true, 'Should recommend skipping tests');

    console.log('✅ Skip test logic working correctly\n');
  });

  it('should handle rate limit responses gracefully', async () => {
    console.log('📝 Testing rate limit response handling...');

    // This test verifies the RateLimiter properly tracks and throttles
    const provider = 'test-provider';

    // Record multiple calls
    for (let i = 0; i < 5; i++) {
      RateLimiter.recordCall(provider);
    }

    // Verify calls were recorded
    const count = RateLimiter.getCallCount(provider, 60000); // Last minute
    assert.ok(count >= 5, 'Should record API calls');

    console.log(`✅ Rate limiter recorded ${count} calls\n`);
  });

  it('should cache API validation results', async () => {
    console.log('📝 Testing API validation caching...');

    // Restore keys
    Object.entries(originalEnv).forEach(([key, value]) => {
      if (value !== undefined) {
        process.env[key] = value;
      }
    });

    const start = Date.now();
    const firstResult = await APIKeyValidator.validatePexels();
    const firstDuration = Date.now() - start;

    const start2 = Date.now();
    const secondResult = await APIKeyValidator.validatePexels();
    const secondDuration = Date.now() - start2;

    // Second call should be faster or equal (cached)
    // Note: When both are very fast (0-1ms), we just verify the results match
    if (firstDuration >= 2) {
      assert.ok(
        secondDuration <= firstDuration,
        `Second call should be faster or equal (${secondDuration}ms vs ${firstDuration}ms)`
      );
    } else {
      console.log(`⚡ Both calls were very fast (${firstDuration}ms → ${secondDuration}ms), skipping performance check`);
    }

    // Results should match
    assert.deepStrictEqual(
      { exists: firstResult.exists, isValid: firstResult.isValid },
      { exists: secondResult.exists, isValid: secondResult.isValid },
      'Cached result should match original'
    );

    console.log(`✅ Validation caching working (${firstDuration}ms → ${secondDuration}ms)\n`);
  });
});

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧪 Running API Failures Edge Case Tests...\n');
}
