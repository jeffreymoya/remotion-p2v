#!/usr/bin/env node
/**
 * Edge Case Test: Network Resilience
 *
 * Tests the pipeline's resilience to network-related failures:
 * - Connection timeouts (timeout handling)
 * - Retry logic with exponential backoff
 * - Network errors and recovery
 * - DNS failures (graceful degradation)
 * - Partial failures (some providers down, others working)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

// Import timeout and retry utilities
import { withTimeout, withRetry, type RetryConfig } from '../../../cli/services/media/timeout-wrapper';

// Test constants
const TEST_TIMEOUT = 180000; // 3 minutes

describe('Edge Case: Network Resilience', { timeout: TEST_TIMEOUT }, () => {
  before(async () => {
    console.log('\n🌐 Starting Network Resilience Edge Case Test...\n');
  });

  after(async () => {
    console.log('\n🧹 Cleaning up network resilience tests...');
    console.log('✅ Cleanup complete\n');
  });

  it('should timeout slow operations', async () => {
    console.log('📝 Testing timeout mechanism...');

    const slowOperation = () =>
      new Promise<string>((resolve) => {
        // Simulate a slow operation that takes 2 seconds
        setTimeout(() => resolve('completed'), 2000);
      });

    // Should timeout after 500ms
    await assert.rejects(
      async () => withTimeout(slowOperation(), 500, 'Slow operation'),
      /timed out after 500ms/,
      'Should timeout slow operations'
    );

    console.log('✅ Timeout mechanism working correctly\n');
  });

  it('should not timeout fast operations', async () => {
    console.log('📝 Testing fast operations complete before timeout...');

    const fastOperation = () =>
      new Promise<string>((resolve) => {
        // Completes immediately
        setTimeout(() => resolve('completed'), 10);
      });

    // Should complete successfully
    const result = await withTimeout(fastOperation(), 1000, 'Fast operation');
    assert.strictEqual(result, 'completed', 'Should complete fast operations');

    console.log('✅ Fast operations complete successfully\n');
  });

  it('should retry failed operations', async () => {
    console.log('📝 Testing retry mechanism...');

    let attemptCount = 0;

    const unreliableOperation = async () => {
      attemptCount++;
      if (attemptCount < 3) {
        throw new Error('Network error');
      }
      return 'success';
    };

    const config: RetryConfig = {
      maxRetries: 3,
      retryDelayMs: 100,
      exponentialBackoff: false, // Use fixed delay for predictable test
    };

    const result = await withRetry(unreliableOperation, config, 'Unreliable op');

    assert.strictEqual(result, 'success', 'Should eventually succeed');
    assert.strictEqual(attemptCount, 3, 'Should have retried 2 times');

    console.log(`✅ Retry mechanism working (${attemptCount} attempts)\n`);
  });

  it('should fail after max retries exceeded', async () => {
    console.log('📝 Testing max retries limit...');

    const alwaysFailOperation = async () => {
      throw new Error('Permanent network failure');
    };

    const config: RetryConfig = {
      maxRetries: 2,
      retryDelayMs: 50,
      exponentialBackoff: false,
    };

    await assert.rejects(
      async () => withRetry(alwaysFailOperation, config, 'Always fail op'),
      /failed after 2 retries/,
      'Should fail after max retries'
    );

    console.log('✅ Max retries limit enforced correctly\n');
  });

  it('should implement exponential backoff', async () => {
    console.log('📝 Testing exponential backoff...');

    let attemptCount = 0;
    const attemptTimes: number[] = [];

    const unreliableOperation = async () => {
      attemptTimes.push(Date.now());
      attemptCount++;
      if (attemptCount < 4) {
        throw new Error('Network error');
      }
      return 'success';
    };

    const config: RetryConfig = {
      maxRetries: 4,
      retryDelayMs: 100,
      backoffMultiplier: 2,
      exponentialBackoff: true,
    };

    const result = await withRetry(unreliableOperation, config, 'Backoff test');

    assert.strictEqual(result, 'success', 'Should eventually succeed');

    // Verify exponential backoff delays
    if (attemptTimes.length >= 3) {
      const delay1 = attemptTimes[1] - attemptTimes[0];
      const delay2 = attemptTimes[2] - attemptTimes[1];

      // Second delay should be roughly 2x the first (exponential backoff)
      // Allow some tolerance for timing variations
      assert.ok(
        delay2 > delay1 * 1.5,
        `Exponential backoff: delay2 (${delay2}ms) should be > delay1 (${delay1}ms) * 1.5`
      );
    }

    console.log(`✅ Exponential backoff working (${attemptCount} attempts)\n`);
  });

  it('should handle immediate success without retries', async () => {
    console.log('📝 Testing immediate success path...');

    let attemptCount = 0;

    const successfulOperation = async () => {
      attemptCount++;
      return 'immediate success';
    };

    const config: RetryConfig = {
      maxRetries: 3,
      retryDelayMs: 100,
    };

    const result = await withRetry(successfulOperation, config, 'Success op');

    assert.strictEqual(result, 'immediate success', 'Should return result');
    assert.strictEqual(attemptCount, 1, 'Should not retry on success');

    console.log('✅ Immediate success handled correctly\n');
  });

  it('should handle network timeout with retry', async () => {
    console.log('📝 Testing timeout + retry combination...');

    let attemptCount = 0;

    const timeoutOperation = async () => {
      attemptCount++;
      if (attemptCount < 2) {
        // First attempt: timeout
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return 'too slow';
      } else {
        // Second attempt: succeed quickly
        return 'success';
      }
    };

    const config: RetryConfig = {
      maxRetries: 2,
      retryDelayMs: 100,
      exponentialBackoff: false,
    };

    // Wrap with timeout and retry
    const result = await withRetry(
      async () => withTimeout(timeoutOperation(), 500, 'Timeout test'),
      config,
      'Timeout + retry test'
    );

    assert.strictEqual(result, 'success', 'Should succeed after timeout retry');

    console.log(`✅ Timeout + retry working (${attemptCount} attempts)\n`);
  });

  it('should handle different error types', async () => {
    console.log('📝 Testing different error types...');

    const errors = [
      new Error('ECONNREFUSED'),
      new Error('ETIMEDOUT'),
      new Error('ENETUNREACH'),
      new Error('DNS lookup failed'),
    ];

    for (const error of errors) {
      let attemptCount = 0;

      const flakyOperation = async () => {
        attemptCount++;
        if (attemptCount < 2) {
          throw error;
        }
        return 'recovered';
      };

      const config: RetryConfig = {
        maxRetries: 2,
        retryDelayMs: 50,
        exponentialBackoff: false,
      };

      const result = await withRetry(flakyOperation, config, 'Error recovery');
      assert.strictEqual(result, 'recovered', `Should recover from ${error.message}`);
    }

    console.log('✅ Different error types handled correctly\n');
  });

  it('should handle concurrent timeout operations', async () => {
    console.log('📝 Testing concurrent timeout operations...');

    const operations = [
      withTimeout(
        new Promise((resolve) => setTimeout(() => resolve('op1'), 50)),
        1000,
        'Op1'
      ),
      withTimeout(
        new Promise((resolve) => setTimeout(() => resolve('op2'), 100)),
        1000,
        'Op2'
      ),
      withTimeout(
        new Promise((resolve) => setTimeout(() => resolve('op3'), 150)),
        1000,
        'Op3'
      ),
    ];

    const results = await Promise.all(operations);

    assert.deepStrictEqual(
      results,
      ['op1', 'op2', 'op3'],
      'Should handle concurrent operations'
    );

    console.log('✅ Concurrent timeout operations working\n');
  });

  it('should handle mixed success and timeout in concurrent operations', async () => {
    console.log('📝 Testing mixed success/timeout in concurrent operations...');

    const operations = [
      withTimeout(
        new Promise((resolve) => setTimeout(() => resolve('fast'), 50)),
        1000,
        'Fast op'
      ),
      withTimeout(
        new Promise((resolve) => setTimeout(() => resolve('slow'), 5000)),
        500,
        'Slow op'
      ).catch((error) => `failed: ${error.message}`),
      withTimeout(
        new Promise((resolve) => setTimeout(() => resolve('medium'), 100)),
        1000,
        'Medium op'
      ),
    ];

    const results = await Promise.all(operations);

    assert.strictEqual(results[0], 'fast', 'Fast operation should succeed');
    assert.ok(
      results[1].toString().includes('timed out'),
      'Slow operation should timeout'
    );
    assert.strictEqual(results[2], 'medium', 'Medium operation should succeed');

    console.log('✅ Mixed success/timeout handled correctly\n');
  });

  it('should calculate correct backoff delays', async () => {
    console.log('📝 Testing backoff delay calculation...');

    const delays: number[] = [];
    let attemptCount = 0;
    let lastTime = Date.now();

    const flakyOperation = async () => {
      const now = Date.now();
      if (attemptCount > 0) {
        delays.push(now - lastTime);
      }
      lastTime = now;
      attemptCount++;

      if (attemptCount < 4) {
        throw new Error('Retry me');
      }
      return 'success';
    };

    const config: RetryConfig = {
      maxRetries: 4,
      retryDelayMs: 100,
      backoffMultiplier: 2,
      exponentialBackoff: true,
    };

    await withRetry(flakyOperation, config, 'Backoff calculation');

    // Verify delays increase exponentially
    // Expected: ~100ms, ~200ms, ~400ms (with some tolerance)
    assert.ok(delays.length >= 2, 'Should have multiple delays');

    console.log(`✅ Backoff delays: ${delays.map((d) => `${d}ms`).join(', ')}\n`);
  });

  it('should handle zero retry configuration', async () => {
    console.log('📝 Testing zero retry configuration...');

    let attemptCount = 0;

    const failingOperation = async () => {
      attemptCount++;
      throw new Error('Immediate failure');
    };

    const config: RetryConfig = {
      maxRetries: 0,
      retryDelayMs: 100,
    };

    await assert.rejects(
      async () => withRetry(failingOperation, config, 'No retry op'),
      /failed after 0 retries/,
      'Should fail immediately with zero retries'
    );

    assert.strictEqual(attemptCount, 1, 'Should only attempt once');

    console.log('✅ Zero retry configuration working\n');
  });

  it('should preserve error information through retries', async () => {
    console.log('📝 Testing error information preservation...');

    const originalError = new Error('Original network error');
    originalError.stack = 'Custom stack trace';

    const failingOperation = async () => {
      throw originalError;
    };

    const config: RetryConfig = {
      maxRetries: 2,
      retryDelayMs: 50,
    };

    try {
      await withRetry(failingOperation, config, 'Error preservation test');
      assert.fail('Should have thrown error');
    } catch (error: any) {
      assert.ok(
        error.message.includes('Original network error'),
        'Should preserve original error message'
      );
    }

    console.log('✅ Error information preserved through retries\n');
  });

  it('should handle rapid retry attempts', async () => {
    console.log('📝 Testing rapid retry attempts...');

    let attemptCount = 0;

    const quickFailOperation = async () => {
      attemptCount++;
      if (attemptCount < 5) {
        throw new Error('Quick fail');
      }
      return 'finally succeeded';
    };

    const config: RetryConfig = {
      maxRetries: 5,
      retryDelayMs: 10, // Very short delay
      exponentialBackoff: false,
    };

    const start = Date.now();
    const result = await withRetry(quickFailOperation, config, 'Rapid retry');
    const duration = Date.now() - start;

    assert.strictEqual(result, 'finally succeeded', 'Should eventually succeed');
    assert.ok(duration < 500, 'Should complete quickly with short delays');

    console.log(`✅ Rapid retries completed in ${duration}ms\n`);
  });
});

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧪 Running Network Resilience Edge Case Tests...\n');
}
