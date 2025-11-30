/**
 * Unit tests for timeout and retry utilities (Phase 5)
 */

import { test } from 'node:test';
import * as assert from 'node:assert';
import { withTimeout, withRetry } from '../cli/services/media/timeout-wrapper';

test('withTimeout resolves when promise completes within timeout', async () => {
  const fastOperation = () => new Promise((resolve) => {
    setTimeout(() => resolve('success'), 100);
  });

  const result = await withTimeout(fastOperation(), 500, 'Fast operation');
  assert.strictEqual(result, 'success');
});

test('withTimeout rejects when promise exceeds timeout', async () => {
  const slowOperation = () => new Promise((resolve) => {
    setTimeout(() => resolve('too slow'), 500);
  });

  await assert.rejects(
    () => withTimeout(slowOperation(), 100, 'Slow operation'),
    /Slow operation timed out after 100ms/
  );
});

test('withTimeout rejects with original error if promise fails', async () => {
  const failingOperation = () => Promise.reject(new Error('Operation failed'));

  await assert.rejects(
    () => withTimeout(failingOperation(), 500, 'Failing operation'),
    /Operation failed/
  );
});

test('withRetry succeeds on first attempt', async () => {
  let attempts = 0;
  const operation = async () => {
    attempts++;
    return 'success';
  };

  const result = await withRetry(
    operation,
    { maxRetries: 3, retryDelayMs: 100 },
    'Test operation'
  );

  assert.strictEqual(result, 'success');
  assert.strictEqual(attempts, 1, 'Should only attempt once');
});

test('withRetry retries failing operation and eventually succeeds', async () => {
  let attempts = 0;
  const operation = async () => {
    attempts++;
    if (attempts < 3) {
      throw new Error('Not yet');
    }
    return 'success';
  };

  const result = await withRetry(
    operation,
    { maxRetries: 5, retryDelayMs: 50 },
    'Retry operation'
  );

  assert.strictEqual(result, 'success');
  assert.strictEqual(attempts, 3, 'Should attempt 3 times');
});

test('withRetry fails after max retries exhausted', async () => {
  let attempts = 0;
  const operation = async () => {
    attempts++;
    throw new Error('Always fails');
  };

  await assert.rejects(
    () => withRetry(
      operation,
      { maxRetries: 3, retryDelayMs: 50 },
      'Failing operation'
    ),
    /Failing operation failed after 3 retries/
  );

  assert.strictEqual(attempts, 4, 'Should attempt 1 initial + 3 retries');
});

test('withRetry uses exponential backoff', async () => {
  const delays: number[] = [];
  let lastTime = Date.now();
  let attempts = 0;

  const operation = async () => {
    attempts++;
    if (attempts > 1) {
      const now = Date.now();
      delays.push(now - lastTime);
      lastTime = now;
    }
    if (attempts < 4) {
      throw new Error('Retry me');
    }
    return 'success';
  };

  await withRetry(
    operation,
    {
      maxRetries: 3,
      retryDelayMs: 100,
      backoffMultiplier: 2,
      exponentialBackoff: true,
    },
    'Backoff test'
  );

  // Verify delays are increasing (exponential backoff)
  // First retry: ~100ms, second: ~200ms, third: ~400ms
  assert.ok(delays[0] >= 90 && delays[0] < 150, `First delay should be ~100ms, got ${delays[0]}ms`);
  assert.ok(delays[1] >= 180 && delays[1] < 250, `Second delay should be ~200ms, got ${delays[1]}ms`);
  assert.ok(delays[2] >= 350 && delays[2] < 500, `Third delay should be ~400ms, got ${delays[2]}ms`);
});

test('withRetry without exponential backoff uses constant delay', async () => {
  const delays: number[] = [];
  let lastTime = Date.now();
  let attempts = 0;

  const operation = async () => {
    attempts++;
    if (attempts > 1) {
      const now = Date.now();
      delays.push(now - lastTime);
      lastTime = now;
    }
    if (attempts < 4) {
      throw new Error('Retry me');
    }
    return 'success';
  };

  await withRetry(
    operation,
    {
      maxRetries: 3,
      retryDelayMs: 100,
      exponentialBackoff: false,
    },
    'Constant delay test'
  );

  // Verify all delays are similar (constant)
  delays.forEach((delay, i) => {
    assert.ok(
      delay >= 90 && delay < 150,
      `Delay ${i} should be ~100ms, got ${delay}ms`
    );
  });
});

console.log('\n✅ All timeout and retry utility tests passed!\n');
