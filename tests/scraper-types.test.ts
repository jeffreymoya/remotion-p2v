#!/usr/bin/env node
/**
 * Scraper Types Tests
 * Tests all Zod schemas and error classes from cli/lib/scraper-types.ts
 * Phase 4: Web Scraping Implementation
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ImageUrlSchema,
  ImageSelectionSchema,
  ImageValidationError,
  ImageDownloadError,
  WebScraperError,
} from '../cli/lib/scraper-types';

// ===========================
// ImageUrlSchema Tests
// ===========================

test('ImageUrlSchema validates valid image URL with all fields', () => {
  const valid = {
    urls: [
      {
        url: 'https://example.com/image.jpg',
        description: 'Test image',
        source: 'example.com',
      },
    ],
  };
  const result = ImageUrlSchema.safeParse(valid);
  assert.ok(result.success, 'Valid image URL with all fields should validate');
});

test('ImageUrlSchema validates valid image URL without optional fields', () => {
  const minimal = {
    urls: [
      {
        url: 'https://example.com/image.jpg',
      },
    ],
  };
  const result = ImageUrlSchema.safeParse(minimal);
  assert.ok(result.success, 'Valid image URL without optional fields should validate');
});

test('ImageUrlSchema validates multiple URLs', () => {
  const multiple = {
    urls: [
      { url: 'https://example.com/1.jpg' },
      { url: 'https://example.com/2.jpg', description: 'Second image' },
      { url: 'https://example.com/3.jpg', source: 'example.com' },
    ],
  };
  const result = ImageUrlSchema.safeParse(multiple);
  assert.ok(result.success, 'Multiple URLs should validate');
});

test('ImageUrlSchema rejects invalid URL format', () => {
  const invalid = {
    urls: [
      { url: 'not-a-url' },
    ],
  };
  const result = ImageUrlSchema.safeParse(invalid);
  assert.ok(!result.success, 'Invalid URL format should be rejected');
});

test('ImageUrlSchema rejects HTTP URLs (requires HTTPS)', () => {
  const httpUrl = {
    urls: [
      { url: 'http://example.com/image.jpg' },
    ],
  };
  const result = ImageUrlSchema.safeParse(httpUrl);
  assert.ok(!result.success, 'HTTP URLs should be rejected (HTTPS required)');
});

test('ImageUrlSchema rejects URLs with private IPs (10.x.x.x)', () => {
  const privateIp = {
    urls: [
      { url: 'https://10.0.0.1/image.jpg' },
    ],
  };
  const result = ImageUrlSchema.safeParse(privateIp);
  assert.ok(!result.success, 'Private IP addresses (10.x.x.x) should be rejected for SSRF protection');
});

test('ImageUrlSchema rejects URLs with private IPs (192.168.x.x)', () => {
  const privateIp = {
    urls: [
      { url: 'https://192.168.1.1/image.jpg' },
    ],
  };
  const result = ImageUrlSchema.safeParse(privateIp);
  assert.ok(!result.success, 'Private IP addresses (192.168.x.x) should be rejected for SSRF protection');
});

test('ImageUrlSchema rejects URLs with private IPs (172.16-31.x.x)', () => {
  const privateIp = {
    urls: [
      { url: 'https://172.16.0.1/image.jpg' },
    ],
  };
  const result = ImageUrlSchema.safeParse(privateIp);
  assert.ok(!result.success, 'Private IP addresses (172.16-31.x.x) should be rejected for SSRF protection');
});

test('ImageUrlSchema rejects localhost URLs', () => {
  const localhost = {
    urls: [
      { url: 'https://localhost/image.jpg' },
    ],
  };
  const result = ImageUrlSchema.safeParse(localhost);
  assert.ok(!result.success, 'Localhost URLs should be rejected for SSRF protection');
});

test('ImageUrlSchema rejects 127.x.x.x addresses', () => {
  const loopback = {
    urls: [
      { url: 'https://127.0.0.1/image.jpg' },
    ],
  };
  const result = ImageUrlSchema.safeParse(loopback);
  assert.ok(!result.success, 'Loopback addresses (127.x.x.x) should be rejected for SSRF protection');
});

test('ImageUrlSchema rejects link-local addresses (169.254.x.x)', () => {
  const linkLocal = {
    urls: [
      { url: 'https://169.254.0.1/image.jpg' },
    ],
  };
  const result = ImageUrlSchema.safeParse(linkLocal);
  assert.ok(!result.success, 'Link-local addresses (169.254.x.x) should be rejected for SSRF protection');
});

test('ImageUrlSchema rejects blocked TLDs (.local)', () => {
  const blockedTld = {
    urls: [
      { url: 'https://server.local/image.jpg' },
    ],
  };
  const result = ImageUrlSchema.safeParse(blockedTld);
  assert.ok(!result.success, 'URLs with .local TLD should be rejected');
});

test('ImageUrlSchema rejects blocked TLDs (.internal)', () => {
  const blockedTld = {
    urls: [
      { url: 'https://server.internal/image.jpg' },
    ],
  };
  const result = ImageUrlSchema.safeParse(blockedTld);
  assert.ok(!result.success, 'URLs with .internal TLD should be rejected');
});

test('ImageUrlSchema rejects blocked TLDs (.corp)', () => {
  const blockedTld = {
    urls: [
      { url: 'https://server.corp/image.jpg' },
    ],
  };
  const result = ImageUrlSchema.safeParse(blockedTld);
  assert.ok(!result.success, 'URLs with .corp TLD should be rejected');
});

test('ImageUrlSchema rejects URLs exceeding 2048 characters', () => {
  const longUrl = 'https://example.com/' + 'a'.repeat(2100);
  const tooLong = {
    urls: [
      { url: longUrl },
    ],
  };
  const result = ImageUrlSchema.safeParse(tooLong);
  assert.ok(!result.success, 'URLs exceeding 2048 characters should be rejected');
});

test('ImageUrlSchema accepts URLs at exactly 2048 characters', () => {
  // Create URL that's exactly 2048 chars: https://example.com/ (20 chars) + 2028 chars
  const exactLengthUrl = 'https://example.com/' + 'a'.repeat(2028);
  const exactLength = {
    urls: [
      { url: exactLengthUrl },
    ],
  };
  assert.strictEqual(exactLengthUrl.length, 2048, 'URL should be exactly 2048 characters');
  const result = ImageUrlSchema.safeParse(exactLength);
  assert.ok(result.success, 'URLs at exactly 2048 characters should validate');
});

test('ImageUrlSchema accepts empty URLs array', () => {
  const empty = {
    urls: [],
  };
  const result = ImageUrlSchema.safeParse(empty);
  assert.ok(result.success, 'Empty URLs array is valid per the schema (no minimum length constraint)');
});

test('ImageUrlSchema rejects missing urls field', () => {
  const missing = {};
  const result = ImageUrlSchema.safeParse(missing);
  assert.ok(!result.success, 'Missing urls field should be rejected');
});

test('ImageUrlSchema rejects FTP protocol', () => {
  const ftpUrl = {
    urls: [
      { url: 'ftp://example.com/image.jpg' },
    ],
  };
  const result = ImageUrlSchema.safeParse(ftpUrl);
  assert.ok(!result.success, 'FTP protocol should be rejected (only HTTPS allowed)');
});

// ===========================
// ImageSelectionSchema Tests
// ===========================

test('ImageSelectionSchema validates valid selection with all fields', () => {
  const valid = {
    selectedIndex: 2,
    reasoning: 'This image has the best composition and matches the scene perfectly with excellent lighting',
    scores: {
      sceneRelevance: 0.95,
      technicalQuality: 0.88,
      aestheticAppeal: 0.92,
      aspectRatioMatch: 0.85,
    },
  };
  const result = ImageSelectionSchema.safeParse(valid);
  assert.ok(result.success, 'Valid selection with all fields should validate');
});

test('ImageSelectionSchema validates selectedIndex at 0', () => {
  const zeroIndex = {
    selectedIndex: 0,
    reasoning: 'First image is the best choice for this particular scene due to its composition',
    scores: {
      sceneRelevance: 0.9,
      technicalQuality: 0.85,
      aestheticAppeal: 0.88,
      aspectRatioMatch: 0.92,
    },
  };
  const result = ImageSelectionSchema.safeParse(zeroIndex);
  assert.ok(result.success, 'selectedIndex of 0 should validate');
});

test('ImageSelectionSchema rejects negative selectedIndex', () => {
  const negative = {
    selectedIndex: -1,
    reasoning: 'This should fail because negative index is invalid',
    scores: {
      sceneRelevance: 0.9,
      technicalQuality: 0.8,
      aestheticAppeal: 0.9,
      aspectRatioMatch: 0.85,
    },
  };
  const result = ImageSelectionSchema.safeParse(negative);
  assert.ok(!result.success, 'Negative selectedIndex should be rejected');
});

test('ImageSelectionSchema rejects float selectedIndex', () => {
  const floatIndex = {
    selectedIndex: 1.5,
    reasoning: 'This should fail because index must be an integer',
    scores: {
      sceneRelevance: 0.9,
      technicalQuality: 0.8,
      aestheticAppeal: 0.9,
      aspectRatioMatch: 0.85,
    },
  };
  const result = ImageSelectionSchema.safeParse(floatIndex);
  assert.ok(!result.success, 'Float selectedIndex should be rejected (must be integer)');
});

test('ImageSelectionSchema accepts boundary score values (0.0)', () => {
  const minScores = {
    selectedIndex: 0,
    reasoning: 'Testing minimum boundary values for all scores in the selection schema',
    scores: {
      sceneRelevance: 0.0,
      technicalQuality: 0.0,
      aestheticAppeal: 0.0,
      aspectRatioMatch: 0.0,
    },
  };
  const result = ImageSelectionSchema.safeParse(minScores);
  assert.ok(result.success, 'Score values of 0.0 should validate');
});

test('ImageSelectionSchema accepts boundary score values (1.0)', () => {
  const maxScores = {
    selectedIndex: 0,
    reasoning: 'Testing maximum boundary values for all scores in the selection schema',
    scores: {
      sceneRelevance: 1.0,
      technicalQuality: 1.0,
      aestheticAppeal: 1.0,
      aspectRatioMatch: 1.0,
    },
  };
  const result = ImageSelectionSchema.safeParse(maxScores);
  assert.ok(result.success, 'Score values of 1.0 should validate');
});

test('ImageSelectionSchema rejects sceneRelevance > 1.0', () => {
  const invalid = {
    selectedIndex: 0,
    reasoning: 'This should fail because scene relevance exceeds maximum',
    scores: {
      sceneRelevance: 1.5,
      technicalQuality: 0.8,
      aestheticAppeal: 0.9,
      aspectRatioMatch: 0.85,
    },
  };
  const result = ImageSelectionSchema.safeParse(invalid);
  assert.ok(!result.success, 'sceneRelevance > 1.0 should be rejected');
});

test('ImageSelectionSchema rejects sceneRelevance < 0', () => {
  const invalid = {
    selectedIndex: 0,
    reasoning: 'This should fail because scene relevance is negative',
    scores: {
      sceneRelevance: -0.1,
      technicalQuality: 0.8,
      aestheticAppeal: 0.9,
      aspectRatioMatch: 0.85,
    },
  };
  const result = ImageSelectionSchema.safeParse(invalid);
  assert.ok(!result.success, 'sceneRelevance < 0 should be rejected');
});

test('ImageSelectionSchema rejects technicalQuality > 1.0', () => {
  const invalid = {
    selectedIndex: 0,
    reasoning: 'This should fail because technical quality exceeds maximum',
    scores: {
      sceneRelevance: 0.9,
      technicalQuality: 1.2,
      aestheticAppeal: 0.9,
      aspectRatioMatch: 0.85,
    },
  };
  const result = ImageSelectionSchema.safeParse(invalid);
  assert.ok(!result.success, 'technicalQuality > 1.0 should be rejected');
});

test('ImageSelectionSchema rejects technicalQuality < 0', () => {
  const invalid = {
    selectedIndex: 0,
    reasoning: 'This should fail because technical quality is negative',
    scores: {
      sceneRelevance: 0.9,
      technicalQuality: -0.2,
      aestheticAppeal: 0.9,
      aspectRatioMatch: 0.85,
    },
  };
  const result = ImageSelectionSchema.safeParse(invalid);
  assert.ok(!result.success, 'technicalQuality < 0 should be rejected');
});

test('ImageSelectionSchema rejects aestheticAppeal > 1.0', () => {
  const invalid = {
    selectedIndex: 0,
    reasoning: 'This should fail because aesthetic appeal exceeds maximum',
    scores: {
      sceneRelevance: 0.9,
      technicalQuality: 0.8,
      aestheticAppeal: 1.8,
      aspectRatioMatch: 0.85,
    },
  };
  const result = ImageSelectionSchema.safeParse(invalid);
  assert.ok(!result.success, 'aestheticAppeal > 1.0 should be rejected');
});

test('ImageSelectionSchema rejects aestheticAppeal < 0', () => {
  const invalid = {
    selectedIndex: 0,
    reasoning: 'This should fail because aesthetic appeal is negative',
    scores: {
      sceneRelevance: 0.9,
      technicalQuality: 0.8,
      aestheticAppeal: -0.5,
      aspectRatioMatch: 0.85,
    },
  };
  const result = ImageSelectionSchema.safeParse(invalid);
  assert.ok(!result.success, 'aestheticAppeal < 0 should be rejected');
});

test('ImageSelectionSchema rejects aspectRatioMatch > 1.0', () => {
  const invalid = {
    selectedIndex: 0,
    reasoning: 'This should fail because aspect ratio match exceeds maximum',
    scores: {
      sceneRelevance: 0.9,
      technicalQuality: 0.8,
      aestheticAppeal: 0.9,
      aspectRatioMatch: 1.3,
    },
  };
  const result = ImageSelectionSchema.safeParse(invalid);
  assert.ok(!result.success, 'aspectRatioMatch > 1.0 should be rejected');
});

test('ImageSelectionSchema rejects aspectRatioMatch < 0', () => {
  const invalid = {
    selectedIndex: 0,
    reasoning: 'This should fail because aspect ratio match is negative',
    scores: {
      sceneRelevance: 0.9,
      technicalQuality: 0.8,
      aestheticAppeal: 0.9,
      aspectRatioMatch: -0.1,
    },
  };
  const result = ImageSelectionSchema.safeParse(invalid);
  assert.ok(!result.success, 'aspectRatioMatch < 0 should be rejected');
});

test('ImageSelectionSchema rejects missing selectedIndex', () => {
  const missing = {
    reasoning: 'Missing the selectedIndex field entirely',
    scores: {
      sceneRelevance: 0.9,
      technicalQuality: 0.8,
      aestheticAppeal: 0.9,
      aspectRatioMatch: 0.85,
    },
  };
  const result = ImageSelectionSchema.safeParse(missing);
  assert.ok(!result.success, 'Missing selectedIndex should be rejected');
});

test('ImageSelectionSchema rejects missing reasoning', () => {
  const missing = {
    selectedIndex: 0,
    scores: {
      sceneRelevance: 0.9,
      technicalQuality: 0.8,
      aestheticAppeal: 0.9,
      aspectRatioMatch: 0.85,
    },
  };
  const result = ImageSelectionSchema.safeParse(missing);
  assert.ok(!result.success, 'Missing reasoning should be rejected');
});

test('ImageSelectionSchema rejects missing scores', () => {
  const missing = {
    selectedIndex: 0,
    reasoning: 'This should fail because scores object is missing',
  };
  const result = ImageSelectionSchema.safeParse(missing);
  assert.ok(!result.success, 'Missing scores object should be rejected');
});

test('ImageSelectionSchema rejects incomplete scores object', () => {
  const incomplete = {
    selectedIndex: 0,
    reasoning: 'This should fail because scores object is incomplete',
    scores: {
      sceneRelevance: 0.9,
      technicalQuality: 0.8,
      // Missing aestheticAppeal and aspectRatioMatch
    },
  };
  const result = ImageSelectionSchema.safeParse(incomplete);
  assert.ok(!result.success, 'Incomplete scores object should be rejected');
});

test('ImageSelectionSchema validates with mixed score values', () => {
  const mixed = {
    selectedIndex: 5,
    reasoning: 'This image provides a good balance of all quality metrics for the scene',
    scores: {
      sceneRelevance: 0.75,
      technicalQuality: 0.42,
      aestheticAppeal: 0.91,
      aspectRatioMatch: 0.33,
    },
  };
  const result = ImageSelectionSchema.safeParse(mixed);
  assert.ok(result.success, 'Mixed valid score values should validate');
});

// ===========================
// Error Class Tests
// ===========================

test('ImageValidationError creates instance with correct properties', () => {
  const error = new ImageValidationError(
    'Validation failed',
    'https://example.com/image.jpg',
    ['Width too small', 'Invalid format']
  );

  assert.strictEqual(error.name, 'ImageValidationError', 'Error name should be ImageValidationError');
  assert.strictEqual(error.message, 'Validation failed', 'Error message should match');
  assert.strictEqual(error.url, 'https://example.com/image.jpg', 'URL should match');
  assert.deepStrictEqual(error.validationErrors, ['Width too small', 'Invalid format'], 'Validation errors should match');
  assert.ok(error instanceof Error, 'Should be instance of Error');
  assert.ok(error instanceof ImageValidationError, 'Should be instance of ImageValidationError');
});

test('ImageValidationError with empty validation errors array', () => {
  const error = new ImageValidationError(
    'No specific errors',
    'https://example.com/image.jpg',
    []
  );

  assert.strictEqual(error.validationErrors.length, 0, 'Validation errors should be empty array');
  assert.ok(Array.isArray(error.validationErrors), 'Validation errors should be an array');
});

test('ImageValidationError with single validation error', () => {
  const error = new ImageValidationError(
    'Single error',
    'https://example.com/image.jpg',
    ['File size exceeds maximum']
  );

  assert.strictEqual(error.validationErrors.length, 1, 'Should have exactly one validation error');
  assert.strictEqual(error.validationErrors[0], 'File size exceeds maximum', 'Error message should match');
});

test('ImageValidationError with multiple validation errors', () => {
  const errors = [
    'Width too small: 500px (minimum 1920px)',
    'Height too small: 300px (minimum 1080px)',
    'Invalid format: bmp (allowed: jpeg, png, webp)',
    'File size too small: 1000 bytes (minimum 10000 bytes)',
  ];
  const error = new ImageValidationError(
    'Multiple validation failures',
    'https://example.com/bad-image.jpg',
    errors
  );

  assert.strictEqual(error.validationErrors.length, 4, 'Should have four validation errors');
  assert.deepStrictEqual(error.validationErrors, errors, 'All errors should be preserved');
});

test('ImageDownloadError creates instance with status code', () => {
  const error = new ImageDownloadError(
    'Download failed',
    'https://example.com/image.jpg',
    404
  );

  assert.strictEqual(error.name, 'ImageDownloadError', 'Error name should be ImageDownloadError');
  assert.strictEqual(error.message, 'Download failed', 'Error message should match');
  assert.strictEqual(error.url, 'https://example.com/image.jpg', 'URL should match');
  assert.strictEqual(error.statusCode, 404, 'Status code should be 404');
  assert.strictEqual(error.cause, undefined, 'Cause should be undefined when not provided');
  assert.ok(error instanceof Error, 'Should be instance of Error');
  assert.ok(error instanceof ImageDownloadError, 'Should be instance of ImageDownloadError');
});

test('ImageDownloadError without status code', () => {
  const error = new ImageDownloadError(
    'Network error',
    'https://example.com/image.jpg'
  );

  assert.strictEqual(error.statusCode, undefined, 'Status code should be undefined when not provided');
  assert.strictEqual(error.cause, undefined, 'Cause should be undefined when not provided');
});

test('ImageDownloadError with cause error', () => {
  const originalError = new Error('Network timeout');
  const error = new ImageDownloadError(
    'Download failed due to timeout',
    'https://example.com/image.jpg',
    undefined,
    originalError
  );

  assert.strictEqual(error.cause, originalError, 'Cause should be the original error');
  assert.strictEqual(error.cause?.message, 'Network timeout', 'Cause message should match');
  assert.strictEqual(error.statusCode, undefined, 'Status code should be undefined');
});

test('ImageDownloadError with both status code and cause', () => {
  const originalError = new Error('Server error details');
  const error = new ImageDownloadError(
    'Server returned error',
    'https://example.com/image.jpg',
    500,
    originalError
  );

  assert.strictEqual(error.statusCode, 500, 'Status code should be 500');
  assert.strictEqual(error.cause, originalError, 'Cause should be the original error');
  assert.strictEqual(error.cause?.message, 'Server error details', 'Cause message should match');
});

test('ImageDownloadError with various HTTP status codes', () => {
  const statusCodes = [400, 401, 403, 404, 429, 500, 502, 503];

  for (const code of statusCodes) {
    const error = new ImageDownloadError(
      `HTTP ${code}`,
      'https://example.com/image.jpg',
      code
    );
    assert.strictEqual(error.statusCode, code, `Status code should be ${code}`);
  }
});

test('WebScraperError creates instance with operation', () => {
  const error = new WebScraperError(
    'Scraping failed',
    'searchForImageUrls'
  );

  assert.strictEqual(error.name, 'WebScraperError', 'Error name should be WebScraperError');
  assert.strictEqual(error.message, 'Scraping failed', 'Error message should match');
  assert.strictEqual(error.operation, 'searchForImageUrls', 'Operation should match');
  assert.strictEqual(error.cause, undefined, 'Cause should be undefined when not provided');
  assert.ok(error instanceof Error, 'Should be instance of Error');
  assert.ok(error instanceof WebScraperError, 'Should be instance of WebScraperError');
});

test('WebScraperError without cause', () => {
  const error = new WebScraperError(
    'Operation failed',
    'validateImage'
  );

  assert.strictEqual(error.operation, 'validateImage', 'Operation should match');
  assert.strictEqual(error.cause, undefined, 'Cause should be undefined when not provided');
});

test('WebScraperError with cause error', () => {
  const originalError = new Error('Invalid response format');
  const error = new WebScraperError(
    'Failed to parse response',
    'parseSearchResults',
    originalError
  );

  assert.strictEqual(error.cause, originalError, 'Cause should be the original error');
  assert.strictEqual(error.cause?.message, 'Invalid response format', 'Cause message should match');
  assert.strictEqual(error.operation, 'parseSearchResults', 'Operation should match');
});

test('WebScraperError with various operation types', () => {
  const operations = [
    'searchForImageUrls',
    'selectBestImage',
    'validateImage',
    'downloadImage',
    'extractImageMetadata',
    'preValidateUrl',
  ];

  for (const operation of operations) {
    const error = new WebScraperError(
      `Failed during ${operation}`,
      operation
    );
    assert.strictEqual(error.operation, operation, `Operation should be ${operation}`);
  }
});

test('WebScraperError with nested error chain', () => {
  const rootError = new Error('Network connection failed');
  const middleError = new ImageDownloadError('Download timeout', 'https://example.com/image.jpg', undefined, rootError);
  const topError = new WebScraperError('Image acquisition failed', 'downloadImage', middleError);

  assert.strictEqual(topError.operation, 'downloadImage', 'Operation should match');
  assert.ok(topError.cause instanceof ImageDownloadError, 'Cause should be ImageDownloadError');
  assert.ok(topError.cause?.cause instanceof Error, 'Nested cause should be Error');
  assert.strictEqual(topError.cause?.cause?.message, 'Network connection failed', 'Root error message should match');
});

console.log('\n✅ All scraper types tests passed!');
