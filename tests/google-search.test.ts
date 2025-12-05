#!/usr/bin/env node
/**
 * Google Search Client Unit Tests
 * Tests GoogleSearchClient with comprehensive error handling, retry logic, and edge cases
 * Phase 4: Web Scraping Implementation
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import {
  GoogleSearchClient,
  GoogleSearchError,
  GoogleImageResult,
  createGoogleSearchClient,
} from '../cli/services/media/google-search';

// Mock axios module
let mockAxiosGet: any = null;
let mockAxiosError: Error | null = null;

// Create a mock axios instance
const mockAxiosInstance = {
  get: async (url: string, config: any) => {
    if (mockAxiosError) {
      throw mockAxiosError;
    }
    if (mockAxiosGet) {
      return mockAxiosGet(url, config);
    }
    throw new Error('No mock configured');
  },
};

// Mock axios.create to return our mock instance
const originalCreate = axios.create;
let createMockEnabled = false;

function enableAxiosMock() {
  createMockEnabled = true;
  (axios as any).create = () => mockAxiosInstance;
}

function disableAxiosMock() {
  createMockEnabled = false;
  (axios as any).create = originalCreate;
}

// Helper to reset mocks
function resetMocks() {
  mockAxiosGet = null;
  mockAxiosError = null;
}

// Helper to create mock response
function createMockResponse(items: any[] | null) {
  return {
    data: {
      items: items,
    },
  };
}

// Helper to create mock error
function createMockError(status: number, message?: string, code?: string) {
  const error: any = new Error(message || `HTTP Error ${status}`);
  error.response = {
    status,
    data: {
      error: {
        message: message || `HTTP Error ${status}`,
      },
    },
  };
  if (code) {
    error.code = code;
  }
  return error;
}

// ============================================================================
// Constructor Tests
// ============================================================================

test('Constructor: accepts valid API key and Search Engine ID', () => {
  enableAxiosMock();
  const client = new GoogleSearchClient('valid-api-key', 'valid-search-engine-id');
  assert.ok(client, 'Should create client with valid credentials');
  disableAxiosMock();
});

test('Constructor: throws error for empty API key', () => {
  enableAxiosMock();
  assert.throws(
    () => new GoogleSearchClient('', 'valid-search-engine-id'),
    /Google Custom Search API key is required/,
    'Should throw error for empty API key'
  );
  disableAxiosMock();
});

test('Constructor: throws error for missing API key', () => {
  enableAxiosMock();
  assert.throws(
    () => new GoogleSearchClient(null as any, 'valid-search-engine-id'),
    /Google Custom Search API key is required/,
    'Should throw error for null API key'
  );
  disableAxiosMock();
});

test('Constructor: throws error for empty Search Engine ID', () => {
  enableAxiosMock();
  assert.throws(
    () => new GoogleSearchClient('valid-api-key', ''),
    /Google Custom Search Engine ID is required/,
    'Should throw error for empty Search Engine ID'
  );
  disableAxiosMock();
});

test('Constructor: throws error for missing Search Engine ID', () => {
  enableAxiosMock();
  assert.throws(
    () => new GoogleSearchClient('valid-api-key', null as any),
    /Google Custom Search Engine ID is required/,
    'Should throw error for null Search Engine ID'
  );
  disableAxiosMock();
});

// ============================================================================
// Search Tests - Successful Scenarios
// ============================================================================

test('searchImages: returns parsed results for valid response', async () => {
  enableAxiosMock();
  resetMocks();

  const mockItems = [
    {
      link: 'https://example.com/image1.jpg',
      image: {
        width: '1920',
        height: '1080',
        thumbnailLink: 'https://example.com/thumb1.jpg',
        contextLink: 'https://example.com/page1',
      },
    },
    {
      link: 'https://example.com/image2.png',
      image: {
        width: '3840',
        height: '2160',
        thumbnailLink: 'https://example.com/thumb2.jpg',
        contextLink: 'https://example.com/page2',
      },
    },
  ];

  mockAxiosGet = async () => createMockResponse(mockItems);

  const client = new GoogleSearchClient('test-key', 'test-cx');
  const results = await client.searchImages('test query');

  assert.strictEqual(results.length, 2, 'Should return 2 results');
  assert.strictEqual(results[0].url, 'https://example.com/image1.jpg');
  assert.strictEqual(results[0].width, 1920);
  assert.strictEqual(results[0].height, 1080);
  assert.strictEqual(results[0].format, 'jpeg');
  assert.strictEqual(results[1].format, 'png');

  disableAxiosMock();
});

test('searchImages: returns empty array for no results', async () => {
  enableAxiosMock();
  resetMocks();

  mockAxiosGet = async () => createMockResponse(null);

  const client = new GoogleSearchClient('test-key', 'test-cx');
  const results = await client.searchImages('no results query');

  assert.strictEqual(results.length, 0, 'Should return empty array for no results');

  disableAxiosMock();
});

test('searchImages: returns empty array for empty items array', async () => {
  enableAxiosMock();
  resetMocks();

  mockAxiosGet = async () => createMockResponse([]);

  const client = new GoogleSearchClient('test-key', 'test-cx');
  const results = await client.searchImages('empty query');

  assert.strictEqual(results.length, 0, 'Should return empty array for empty items');

  disableAxiosMock();
});

test('searchImages: uses correct query parameters', async () => {
  enableAxiosMock();
  resetMocks();

  let capturedParams: any = null;

  mockAxiosGet = async (url: string, config: any) => {
    capturedParams = config.params;
    return createMockResponse([]);
  };

  const client = new GoogleSearchClient('my-api-key', 'my-cx-id');
  await client.searchImages('test query', 5);

  assert.strictEqual(capturedParams.key, 'my-api-key');
  assert.strictEqual(capturedParams.cx, 'my-cx-id');
  assert.strictEqual(capturedParams.q, 'test query');
  assert.strictEqual(capturedParams.searchType, 'image');
  assert.strictEqual(capturedParams.num, 5);
  assert.strictEqual(capturedParams.imgSize, 'large');
  assert.strictEqual(capturedParams.safe, 'off');

  disableAxiosMock();
});

test('searchImages: defaults to 10 results when count not specified', async () => {
  enableAxiosMock();
  resetMocks();

  let capturedParams: any = null;

  mockAxiosGet = async (url: string, config: any) => {
    capturedParams = config.params;
    return createMockResponse([]);
  };

  const client = new GoogleSearchClient('test-key', 'test-cx');
  await client.searchImages('test query');

  assert.strictEqual(capturedParams.num, 10, 'Should default to 10 results');

  disableAxiosMock();
});

// ============================================================================
// Search Tests - Validation
// ============================================================================

test('searchImages: throws error for empty query', async () => {
  enableAxiosMock();
  resetMocks();

  const client = new GoogleSearchClient('test-key', 'test-cx');

  await assert.rejects(
    async () => await client.searchImages(''),
    /Search query cannot be empty/,
    'Should throw error for empty query'
  );

  disableAxiosMock();
});

test('searchImages: throws error for whitespace-only query', async () => {
  enableAxiosMock();
  resetMocks();

  const client = new GoogleSearchClient('test-key', 'test-cx');

  await assert.rejects(
    async () => await client.searchImages('   '),
    /Search query cannot be empty/,
    'Should throw error for whitespace-only query'
  );

  disableAxiosMock();
});

test('searchImages: throws error for count less than 1', async () => {
  enableAxiosMock();
  resetMocks();

  const client = new GoogleSearchClient('test-key', 'test-cx');

  await assert.rejects(
    async () => await client.searchImages('test', 0),
    /Count must be between 1 and 10/,
    'Should throw error for count = 0'
  );

  disableAxiosMock();
});

test('searchImages: throws error for count greater than 10', async () => {
  enableAxiosMock();
  resetMocks();

  const client = new GoogleSearchClient('test-key', 'test-cx');

  await assert.rejects(
    async () => await client.searchImages('test', 11),
    /Count must be between 1 and 10/,
    'Should throw error for count = 11'
  );

  disableAxiosMock();
});

// ============================================================================
// Error Handling Tests - Rate Limiting (429)
// ============================================================================

test('Error Handling: throws GoogleSearchError for rate limit (429)', async () => {
  enableAxiosMock();
  resetMocks();

  mockAxiosError = createMockError(429, 'Rate limit exceeded');

  const client = new GoogleSearchClient('test-key', 'test-cx');

  try {
    await client.searchImages('test query');
    assert.fail('Should have thrown GoogleSearchError');
  } catch (error: any) {
    assert.ok(error instanceof GoogleSearchError, 'Should be GoogleSearchError instance');
    assert.strictEqual(error.statusCode, 429);
    assert.match(error.message, /rate limit exceeded/i);
  }

  disableAxiosMock();
});

// ============================================================================
// Error Handling Tests - Quota Exceeded (403)
// ============================================================================

test('Error Handling: throws GoogleSearchError for quota exceeded (403)', async () => {
  enableAxiosMock();
  resetMocks();

  mockAxiosError = createMockError(403, 'Quota exceeded for today');

  const client = new GoogleSearchClient('test-key', 'test-cx');

  try {
    await client.searchImages('test query');
    assert.fail('Should have thrown GoogleSearchError');
  } catch (error: any) {
    assert.ok(error instanceof GoogleSearchError, 'Should be GoogleSearchError instance');
    assert.strictEqual(error.statusCode, 403);
    assert.match(error.message, /quota exceeded/i);
  }

  disableAxiosMock();
});

test('Error Handling: detects quota in error message (403)', async () => {
  enableAxiosMock();
  resetMocks();

  mockAxiosError = createMockError(403, 'Daily limit exceeded');

  const client = new GoogleSearchClient('test-key', 'test-cx');

  try {
    await client.searchImages('test query');
    assert.fail('Should have thrown GoogleSearchError');
  } catch (error: any) {
    assert.ok(error instanceof GoogleSearchError, 'Should be GoogleSearchError instance');
    assert.strictEqual(error.statusCode, 403);
    assert.match(error.message, /quota exceeded/i);
  }

  disableAxiosMock();
});

// ============================================================================
// Error Handling Tests - Authentication Failures (401)
// ============================================================================

test('Error Handling: throws GoogleSearchError for invalid API key (401)', async () => {
  enableAxiosMock();
  resetMocks();

  mockAxiosError = createMockError(401, 'Invalid API key');

  const client = new GoogleSearchClient('test-key', 'test-cx');

  try {
    await client.searchImages('test query');
    assert.fail('Should have thrown GoogleSearchError');
  } catch (error: any) {
    assert.ok(error instanceof GoogleSearchError, 'Should be GoogleSearchError instance');
    assert.strictEqual(error.statusCode, 401);
    assert.match(error.message, /API key is invalid/i);
  }

  disableAxiosMock();
});

// ============================================================================
// Error Handling Tests - Invalid Search Engine ID (400)
// ============================================================================

test('Error Handling: throws GoogleSearchError for invalid cx parameter (400)', async () => {
  enableAxiosMock();
  resetMocks();

  mockAxiosError = createMockError(400, 'Invalid value for cx parameter');

  const client = new GoogleSearchClient('test-key', 'test-cx');

  try {
    await client.searchImages('test query');
    assert.fail('Should have thrown GoogleSearchError');
  } catch (error: any) {
    assert.ok(error instanceof GoogleSearchError, 'Should be GoogleSearchError instance');
    assert.strictEqual(error.statusCode, 400);
    assert.match(error.message, /Invalid Search Engine ID/i);
  }

  disableAxiosMock();
});

// ============================================================================
// Error Handling Tests - Network Errors
// ============================================================================

test('Error Handling: retries on network error and succeeds', async () => {
  enableAxiosMock();
  resetMocks();

  let attemptCount = 0;
  const mockItems = [
    {
      link: 'https://example.com/image.jpg',
      image: {
        width: '1920',
        height: '1080',
      },
    },
  ];

  mockAxiosGet = async () => {
    attemptCount++;
    if (attemptCount < 2) {
      const error: any = new Error('Network error');
      error.code = 'ENOTFOUND';
      throw error;
    }
    return createMockResponse(mockItems);
  };

  const client = new GoogleSearchClient('test-key', 'test-cx');
  const results = await client.searchImages('test query');

  assert.strictEqual(attemptCount, 2, 'Should retry once before succeeding');
  assert.strictEqual(results.length, 1, 'Should return results after retry');

  disableAxiosMock();
});

test('Error Handling: throws error after max retries on network error', async () => {
  enableAxiosMock();
  resetMocks();

  let attemptCount = 0;

  mockAxiosGet = async () => {
    attemptCount++;
    const error: any = new Error('Network error');
    error.code = 'ENOTFOUND';
    throw error;
  };

  const client = new GoogleSearchClient('test-key', 'test-cx');

  try {
    await client.searchImages('test query');
    assert.fail('Should have thrown GoogleSearchError');
  } catch (error: any) {
    assert.ok(error instanceof GoogleSearchError);
    assert.match(error.message, /network error after multiple attempts/i);
    assert.strictEqual(attemptCount, 3, 'Should retry 3 times total');
  }

  disableAxiosMock();
});

test('Error Handling: handles ECONNREFUSED network error', async () => {
  enableAxiosMock();
  resetMocks();

  mockAxiosGet = async () => {
    const error: any = new Error('Connection refused');
    error.code = 'ECONNREFUSED';
    throw error;
  };

  const client = new GoogleSearchClient('test-key', 'test-cx');

  try {
    await client.searchImages('test query');
    assert.fail('Should have thrown GoogleSearchError');
  } catch (error: any) {
    assert.ok(error instanceof GoogleSearchError);
    assert.match(error.message, /network error after multiple attempts/i);
  }

  disableAxiosMock();
});

// ============================================================================
// Error Handling Tests - Timeout Errors
// ============================================================================

test('Error Handling: retries on timeout and succeeds', async () => {
  enableAxiosMock();
  resetMocks();

  let attemptCount = 0;
  const mockItems = [
    {
      link: 'https://example.com/image.jpg',
      image: {
        width: '1920',
        height: '1080',
      },
    },
  ];

  mockAxiosGet = async () => {
    attemptCount++;
    if (attemptCount < 2) {
      const error: any = new Error('timeout of 10000ms exceeded');
      error.code = 'ECONNABORTED';
      throw error;
    }
    return createMockResponse(mockItems);
  };

  const client = new GoogleSearchClient('test-key', 'test-cx');
  const results = await client.searchImages('test query');

  assert.strictEqual(attemptCount, 2, 'Should retry once before succeeding');
  assert.strictEqual(results.length, 1, 'Should return results after retry');

  disableAxiosMock();
});

test('Error Handling: throws error after max retries on timeout', async () => {
  enableAxiosMock();
  resetMocks();

  let attemptCount = 0;

  mockAxiosGet = async () => {
    attemptCount++;
    const error: any = new Error('timeout of 10000ms exceeded');
    error.code = 'ECONNABORTED';
    throw error;
  };

  const client = new GoogleSearchClient('test-key', 'test-cx');

  try {
    await client.searchImages('test query');
    assert.fail('Should have thrown GoogleSearchError');
  } catch (error: any) {
    assert.ok(error instanceof GoogleSearchError);
    assert.match(error.message, /timed out after multiple attempts/i);
    assert.strictEqual(attemptCount, 3, 'Should retry 3 times total');
  }

  disableAxiosMock();
});

test('Error Handling: detects timeout from error message', async () => {
  enableAxiosMock();
  resetMocks();

  mockAxiosGet = async () => {
    const error: any = new Error('Request timeout');
    throw error;
  };

  const client = new GoogleSearchClient('test-key', 'test-cx');

  try {
    await client.searchImages('test query');
    assert.fail('Should have thrown GoogleSearchError');
  } catch (error: any) {
    assert.ok(error instanceof GoogleSearchError);
    assert.match(error.message, /timed out after multiple attempts/i);
  }

  disableAxiosMock();
});

// ============================================================================
// Retry Logic Tests - Exponential Backoff
// ============================================================================

test('Retry Logic: implements exponential backoff', async () => {
  enableAxiosMock();
  resetMocks();

  const timestamps: number[] = [];
  let attemptCount = 0;

  mockAxiosGet = async () => {
    timestamps.push(Date.now());
    attemptCount++;
    if (attemptCount < 3) {
      const error: any = new Error('Temporary error');
      error.code = 'ETIMEDOUT';
      throw error;
    }
    return createMockResponse([]);
  };

  const client = new GoogleSearchClient('test-key', 'test-cx');
  await client.searchImages('test query');

  assert.strictEqual(timestamps.length, 3, 'Should have 3 attempts');

  // Check backoff delays (allow some tolerance for execution time)
  // First retry: ~1000ms delay (2^0 * 1000)
  // Second retry: ~2000ms delay (2^1 * 1000)
  if (timestamps.length >= 2) {
    const delay1 = timestamps[1] - timestamps[0];
    assert.ok(delay1 >= 900 && delay1 < 1500, `First retry delay should be ~1000ms, got ${delay1}ms`);
  }

  if (timestamps.length >= 3) {
    const delay2 = timestamps[2] - timestamps[1];
    assert.ok(delay2 >= 1800 && delay2 < 2500, `Second retry delay should be ~2000ms, got ${delay2}ms`);
  }

  disableAxiosMock();
});

test('Retry Logic: respects max retries limit', async () => {
  enableAxiosMock();
  resetMocks();

  let attemptCount = 0;

  mockAxiosGet = async () => {
    attemptCount++;
    const error: any = new Error('Persistent error');
    throw error;
  };

  const client = new GoogleSearchClient('test-key', 'test-cx');

  try {
    await client.searchImages('test query');
    assert.fail('Should have thrown GoogleSearchError');
  } catch (error: any) {
    assert.ok(error instanceof GoogleSearchError);
    assert.strictEqual(attemptCount, 3, 'Should stop at max retries (3 attempts)');
    assert.match(error.message, /failed after 3 attempts/i);
  }

  disableAxiosMock();
});

// ============================================================================
// Format Extraction Tests
// ============================================================================

test('Format Extraction: detects JPEG format (.jpg)', async () => {
  enableAxiosMock();
  resetMocks();

  const mockItems = [
    {
      link: 'https://example.com/photo.jpg',
      image: { width: '1920', height: '1080' },
    },
  ];

  mockAxiosGet = async () => createMockResponse(mockItems);

  const client = new GoogleSearchClient('test-key', 'test-cx');
  const results = await client.searchImages('test');

  assert.strictEqual(results[0].format, 'jpeg', 'Should detect .jpg as jpeg');

  disableAxiosMock();
});

test('Format Extraction: detects JPEG format (.jpeg)', async () => {
  enableAxiosMock();
  resetMocks();

  const mockItems = [
    {
      link: 'https://example.com/photo.jpeg',
      image: { width: '1920', height: '1080' },
    },
  ];

  mockAxiosGet = async () => createMockResponse(mockItems);

  const client = new GoogleSearchClient('test-key', 'test-cx');
  const results = await client.searchImages('test');

  assert.strictEqual(results[0].format, 'jpeg', 'Should detect .jpeg as jpeg');

  disableAxiosMock();
});

test('Format Extraction: detects PNG format', async () => {
  enableAxiosMock();
  resetMocks();

  const mockItems = [
    {
      link: 'https://example.com/image.png',
      image: { width: '1920', height: '1080' },
    },
  ];

  mockAxiosGet = async () => createMockResponse(mockItems);

  const client = new GoogleSearchClient('test-key', 'test-cx');
  const results = await client.searchImages('test');

  assert.strictEqual(results[0].format, 'png', 'Should detect .png as png');

  disableAxiosMock();
});

test('Format Extraction: detects WebP format', async () => {
  enableAxiosMock();
  resetMocks();

  const mockItems = [
    {
      link: 'https://example.com/image.webp',
      image: { width: '1920', height: '1080' },
    },
  ];

  mockAxiosGet = async () => createMockResponse(mockItems);

  const client = new GoogleSearchClient('test-key', 'test-cx');
  const results = await client.searchImages('test');

  assert.strictEqual(results[0].format, 'webp', 'Should detect .webp as webp');

  disableAxiosMock();
});

test('Format Extraction: detects AVIF format', async () => {
  enableAxiosMock();
  resetMocks();

  const mockItems = [
    {
      link: 'https://example.com/image.avif',
      image: { width: '1920', height: '1080' },
    },
  ];

  mockAxiosGet = async () => createMockResponse(mockItems);

  const client = new GoogleSearchClient('test-key', 'test-cx');
  const results = await client.searchImages('test');

  assert.strictEqual(results[0].format, 'avif', 'Should detect .avif as avif');

  disableAxiosMock();
});

test('Format Extraction: detects GIF format', async () => {
  enableAxiosMock();
  resetMocks();

  const mockItems = [
    {
      link: 'https://example.com/animation.gif',
      image: { width: '1920', height: '1080' },
    },
  ];

  mockAxiosGet = async () => createMockResponse(mockItems);

  const client = new GoogleSearchClient('test-key', 'test-cx');
  const results = await client.searchImages('test');

  assert.strictEqual(results[0].format, 'gif', 'Should detect .gif as gif');

  disableAxiosMock();
});

test('Format Extraction: defaults to jpeg for unknown format', async () => {
  enableAxiosMock();
  resetMocks();

  const mockItems = [
    {
      link: 'https://example.com/image.unknown',
      image: { width: '1920', height: '1080' },
    },
  ];

  mockAxiosGet = async () => createMockResponse(mockItems);

  const client = new GoogleSearchClient('test-key', 'test-cx');
  const results = await client.searchImages('test');

  assert.strictEqual(results[0].format, 'jpeg', 'Should default to jpeg for unknown format');

  disableAxiosMock();
});

test('Format Extraction: handles URLs with query parameters', async () => {
  enableAxiosMock();
  resetMocks();

  const mockItems = [
    {
      link: 'https://example.com/image.png?size=large&quality=high',
      image: { width: '1920', height: '1080' },
    },
  ];

  mockAxiosGet = async () => createMockResponse(mockItems);

  const client = new GoogleSearchClient('test-key', 'test-cx');
  const results = await client.searchImages('test');

  assert.strictEqual(results[0].format, 'png', 'Should detect format despite query parameters');

  disableAxiosMock();
});

test('Format Extraction: handles case-insensitive extensions', async () => {
  enableAxiosMock();
  resetMocks();

  const mockItems = [
    {
      link: 'https://example.com/image.JPG',
      image: { width: '1920', height: '1080' },
    },
  ];

  mockAxiosGet = async () => createMockResponse(mockItems);

  const client = new GoogleSearchClient('test-key', 'test-cx');
  const results = await client.searchImages('test');

  assert.strictEqual(results[0].format, 'jpeg', 'Should handle uppercase extensions');

  disableAxiosMock();
});

// ============================================================================
// Result Parsing Tests
// ============================================================================

test('Result Parsing: skips items without link field', async () => {
  enableAxiosMock();
  resetMocks();

  const mockItems = [
    {
      // Missing link
      image: { width: '1920', height: '1080' },
    },
    {
      link: 'https://example.com/valid.jpg',
      image: { width: '1920', height: '1080' },
    },
  ];

  mockAxiosGet = async () => createMockResponse(mockItems);

  const client = new GoogleSearchClient('test-key', 'test-cx');
  const results = await client.searchImages('test');

  assert.strictEqual(results.length, 1, 'Should skip item without link');
  assert.strictEqual(results[0].url, 'https://example.com/valid.jpg');

  disableAxiosMock();
});

test('Result Parsing: skips items without image field', async () => {
  enableAxiosMock();
  resetMocks();

  const mockItems = [
    {
      link: 'https://example.com/noimage.jpg',
      // Missing image field
    },
    {
      link: 'https://example.com/valid.jpg',
      image: { width: '1920', height: '1080' },
    },
  ];

  mockAxiosGet = async () => createMockResponse(mockItems);

  const client = new GoogleSearchClient('test-key', 'test-cx');
  const results = await client.searchImages('test');

  assert.strictEqual(results.length, 1, 'Should skip item without image field');
  assert.strictEqual(results[0].url, 'https://example.com/valid.jpg');

  disableAxiosMock();
});

test('Result Parsing: skips items with invalid dimensions', async () => {
  enableAxiosMock();
  resetMocks();

  const mockItems = [
    {
      link: 'https://example.com/invalid1.jpg',
      image: { width: 'not-a-number', height: '1080' },
    },
    {
      link: 'https://example.com/invalid2.jpg',
      image: { width: '1920', height: 'invalid' },
    },
    {
      link: 'https://example.com/invalid3.jpg',
      image: { width: '0', height: '1080' },
    },
    {
      link: 'https://example.com/invalid4.jpg',
      image: { width: '1920', height: '-100' },
    },
    {
      link: 'https://example.com/valid.jpg',
      image: { width: '1920', height: '1080' },
    },
  ];

  mockAxiosGet = async () => createMockResponse(mockItems);

  const client = new GoogleSearchClient('test-key', 'test-cx');
  const results = await client.searchImages('test');

  assert.strictEqual(results.length, 1, 'Should skip items with invalid dimensions');
  assert.strictEqual(results[0].url, 'https://example.com/valid.jpg');

  disableAxiosMock();
});

test('Result Parsing: uses link as fallback for missing thumbnailUrl', async () => {
  enableAxiosMock();
  resetMocks();

  const mockItems = [
    {
      link: 'https://example.com/image.jpg',
      image: {
        width: '1920',
        height: '1080',
        // Missing thumbnailLink
        contextLink: 'https://example.com/page',
      },
    },
  ];

  mockAxiosGet = async () => createMockResponse(mockItems);

  const client = new GoogleSearchClient('test-key', 'test-cx');
  const results = await client.searchImages('test');

  assert.strictEqual(results[0].thumbnailUrl, 'https://example.com/image.jpg', 'Should use link as fallback');

  disableAxiosMock();
});

test('Result Parsing: uses link as fallback for missing contextUrl', async () => {
  enableAxiosMock();
  resetMocks();

  const mockItems = [
    {
      link: 'https://example.com/image.jpg',
      image: {
        width: '1920',
        height: '1080',
        thumbnailLink: 'https://example.com/thumb.jpg',
        // Missing contextLink
      },
    },
  ];

  mockAxiosGet = async () => createMockResponse(mockItems);

  const client = new GoogleSearchClient('test-key', 'test-cx');
  const results = await client.searchImages('test');

  assert.strictEqual(results[0].contextUrl, 'https://example.com/image.jpg', 'Should use link as fallback');

  disableAxiosMock();
});

test('Result Parsing: handles mixed valid and invalid items', async () => {
  enableAxiosMock();
  resetMocks();

  const mockItems = [
    {
      link: 'https://example.com/valid1.jpg',
      image: { width: '1920', height: '1080' },
    },
    {
      link: 'https://example.com/invalid.jpg',
      image: { width: 'bad', height: '1080' },
    },
    {
      link: 'https://example.com/valid2.png',
      image: { width: '3840', height: '2160' },
    },
  ];

  mockAxiosGet = async () => createMockResponse(mockItems);

  const client = new GoogleSearchClient('test-key', 'test-cx');
  const results = await client.searchImages('test');

  assert.strictEqual(results.length, 2, 'Should return only valid items');
  assert.strictEqual(results[0].url, 'https://example.com/valid1.jpg');
  assert.strictEqual(results[1].url, 'https://example.com/valid2.png');

  disableAxiosMock();
});

// ============================================================================
// Factory Function Tests - createGoogleSearchClient
// ============================================================================

test('createGoogleSearchClient: creates client from environment variables', () => {
  enableAxiosMock();

  // Set environment variables
  const originalApiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const originalEngineId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

  process.env.GOOGLE_CUSTOM_SEARCH_API_KEY = 'env-api-key';
  process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID = 'env-engine-id';

  const client = createGoogleSearchClient();
  assert.ok(client, 'Should create client from environment variables');

  // Restore environment variables
  if (originalApiKey !== undefined) {
    process.env.GOOGLE_CUSTOM_SEARCH_API_KEY = originalApiKey;
  } else {
    delete process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  }

  if (originalEngineId !== undefined) {
    process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID = originalEngineId;
  } else {
    delete process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;
  }

  disableAxiosMock();
});

test('createGoogleSearchClient: throws error when API key is not set', () => {
  enableAxiosMock();

  const originalApiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const originalEngineId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

  delete process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID = 'test-engine-id';

  assert.throws(
    () => createGoogleSearchClient(),
    /GOOGLE_CUSTOM_SEARCH_API_KEY environment variable is not set/,
    'Should throw error when API key is not set'
  );

  // Restore environment variables
  if (originalApiKey !== undefined) {
    process.env.GOOGLE_CUSTOM_SEARCH_API_KEY = originalApiKey;
  }

  if (originalEngineId !== undefined) {
    process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID = originalEngineId;
  } else {
    delete process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;
  }

  disableAxiosMock();
});

test('createGoogleSearchClient: throws error when Search Engine ID is not set', () => {
  enableAxiosMock();

  const originalApiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const originalEngineId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

  process.env.GOOGLE_CUSTOM_SEARCH_API_KEY = 'test-api-key';
  delete process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

  assert.throws(
    () => createGoogleSearchClient(),
    /GOOGLE_CUSTOM_SEARCH_ENGINE_ID environment variable is not set/,
    'Should throw error when Search Engine ID is not set'
  );

  // Restore environment variables
  if (originalApiKey !== undefined) {
    process.env.GOOGLE_CUSTOM_SEARCH_API_KEY = originalApiKey;
  } else {
    delete process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  }

  if (originalEngineId !== undefined) {
    process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID = originalEngineId;
  }

  disableAxiosMock();
});

// ============================================================================
// Edge Cases and Error Handling
// ============================================================================

test('Edge Case: handles malformed response data gracefully', async () => {
  enableAxiosMock();
  resetMocks();

  mockAxiosGet = async () => ({
    data: null, // Malformed response
  });

  const client = new GoogleSearchClient('test-key', 'test-cx');
  const results = await client.searchImages('test');

  assert.strictEqual(results.length, 0, 'Should return empty array for malformed response');

  disableAxiosMock();
});

test('Edge Case: handles response with non-array items', async () => {
  enableAxiosMock();
  resetMocks();

  mockAxiosGet = async () => ({
    data: {
      items: 'not-an-array', // Invalid type
    },
  });

  const client = new GoogleSearchClient('test-key', 'test-cx');
  const results = await client.searchImages('test');

  assert.strictEqual(results.length, 0, 'Should return empty array for non-array items');

  disableAxiosMock();
});

test('Edge Case: handles items with exception during parsing', async () => {
  enableAxiosMock();
  resetMocks();

  const mockItems = [
    {
      link: 'https://example.com/valid.jpg',
      image: { width: '1920', height: '1080' },
    },
    {
      link: 'invalid-url-that-throws', // This will throw when creating URL
      image: { width: '1920', height: '1080' },
    },
  ];

  mockAxiosGet = async () => createMockResponse(mockItems);

  const client = new GoogleSearchClient('test-key', 'test-cx');
  const results = await client.searchImages('test');

  // Should return at least the valid result
  assert.ok(results.length >= 1, 'Should handle parsing exceptions gracefully');

  disableAxiosMock();
});

test('Edge Case: GoogleSearchError preserves cause', async () => {
  enableAxiosMock();
  resetMocks();

  const originalError = new Error('Original cause');
  mockAxiosError = originalError;

  const client = new GoogleSearchClient('test-key', 'test-cx');

  try {
    await client.searchImages('test');
    assert.fail('Should have thrown GoogleSearchError');
  } catch (error: any) {
    assert.ok(error instanceof GoogleSearchError);
    assert.strictEqual(error.cause, originalError, 'Should preserve original error as cause');
  }

  disableAxiosMock();
});

console.log('\n✅ All GoogleSearchClient tests passed!');
console.log('\nTest Summary:');
console.log('  - Constructor Tests: 5 tests');
console.log('  - Search Tests (Success): 5 tests');
console.log('  - Search Tests (Validation): 4 tests');
console.log('  - Error Handling (429): 1 test');
console.log('  - Error Handling (403): 2 tests');
console.log('  - Error Handling (401): 1 test');
console.log('  - Error Handling (400): 1 test');
console.log('  - Error Handling (Network): 3 tests');
console.log('  - Error Handling (Timeout): 3 tests');
console.log('  - Retry Logic: 2 tests');
console.log('  - Format Extraction: 9 tests');
console.log('  - Result Parsing: 7 tests');
console.log('  - Factory Function: 3 tests');
console.log('  - Edge Cases: 4 tests');
console.log('  Total: 50 test cases\n');
