#!/usr/bin/env node
/**
 * Aspect Processor Tests (Wave 4.1)
 * Tests aspect ratio processing with crop and letterbox logic
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  shouldCrop,
  calculateCrop,
  calculateLetterbox,
  CropConfig,
} from '../cli/services/media/aspect-processor';

// Default test configuration
const DEFAULT_CONFIG: CropConfig = {
  safePaddingPercent: 10,
  maxAspectDelta: 0.3,
  targetWidth: 1920,
  targetHeight: 1080,
};

// Test shouldCrop() logic with maxAspectDelta threshold
test('shouldCrop() returns true when aspect delta is within threshold', () => {
  const sourceAspect = 16 / 9; // 1.778
  const targetAspect = 16 / 9; // 1.778

  const result = shouldCrop(sourceAspect, targetAspect, 0.3);
  assert.strictEqual(result, true, 'Identical aspect ratios should crop');
});

test('shouldCrop() returns true when aspect delta is at threshold boundary', () => {
  const targetAspect = 16 / 9; // 1.778
  const sourceAspect = targetAspect * 1.3; // Exactly 30% more (at threshold)

  const result = shouldCrop(sourceAspect, targetAspect, 0.3);
  assert.strictEqual(result, true, 'Aspect delta at 30% should crop');
});

test('shouldCrop() returns false when aspect delta exceeds threshold', () => {
  const targetAspect = 16 / 9; // 1.778
  const sourceAspect = targetAspect * 1.31; // 31% more (over threshold)

  const result = shouldCrop(sourceAspect, targetAspect, 0.3);
  assert.strictEqual(result, false, 'Aspect delta over 30% should letterbox');
});

test('shouldCrop() handles negative delta (taller aspect)', () => {
  const sourceAspect = 9 / 16; // 0.5625 (portrait)
  const targetAspect = 16 / 9; // 1.778 (landscape)

  const result = shouldCrop(sourceAspect, targetAspect, 0.3);
  assert.strictEqual(result, false, '9:16 to 16:9 should letterbox (delta > 30%)');
});

test('shouldCrop() with custom maxAspectDelta', () => {
  const sourceAspect = 16 / 9;
  const targetAspect = 16 / 9;

  const result = shouldCrop(sourceAspect, targetAspect * 1.1, 0.05); // 10% delta, 5% threshold
  assert.strictEqual(result, false, 'Should respect custom threshold');
});

// Test calculateCrop() with safe padding
test('calculateCrop() applies safe padding correctly', () => {
  const config = { ...DEFAULT_CONFIG, safePaddingPercent: 10 };
  const sourceW = 1920;
  const sourceH = 1080;

  const result = calculateCrop(sourceW, sourceH, config);

  assert.strictEqual(result.mode, 'crop', 'Should use crop mode');

  // With 10% padding, dimensions should be 90% of source
  const expectedWidth = Math.round(sourceW * 0.9);
  const expectedHeight = Math.round(sourceH * 0.9);

  assert.strictEqual(result.width, expectedWidth, 'Width should include padding');
  assert.strictEqual(result.height, expectedHeight, 'Height should include padding');
});

test('calculateCrop() centers the crop region', () => {
  const config = DEFAULT_CONFIG;
  const sourceW = 2000;
  const sourceH = 1000;

  const result = calculateCrop(sourceW, sourceH, config);

  // Crop should be centered
  const expectedX = (sourceW - result.width) / 2;
  const expectedY = (sourceH - result.height) / 2;

  assert.strictEqual(result.x, Math.round(expectedX), 'X should be centered');
  assert.strictEqual(result.y, Math.round(expectedY), 'Y should be centered');
});

test('calculateCrop() handles wider source (crop width)', () => {
  const config = DEFAULT_CONFIG;
  const sourceW = 2200; // Slightly wider than 16:9 but within 30% delta
  const sourceH = 1080;

  const result = calculateCrop(sourceW, sourceH, config);

  assert.strictEqual(result.mode, 'crop', 'Should crop wider source');

  // Source is wider, so height stays same, width gets cropped
  const targetAspect = config.targetWidth / config.targetHeight;
  const expectedCropWidth = sourceH * targetAspect * 0.9; // With 10% padding

  assert.ok(result.width < sourceW, 'Width should be cropped');
  assert.strictEqual(result.height, Math.round(sourceH * 0.9), 'Height should match source (with padding)');
});

test('calculateCrop() handles taller source (crop height)', () => {
  const config = DEFAULT_CONFIG;
  const sourceW = 1920;
  const sourceH = 1200; // Slightly taller than 16:9 but within 30% delta

  const result = calculateCrop(sourceW, sourceH, config);

  assert.strictEqual(result.mode, 'crop', 'Should crop taller source');

  // Source is taller, so width stays same, height gets cropped
  const targetAspect = config.targetWidth / config.targetHeight;
  const expectedCropHeight = sourceW / targetAspect * 0.9; // With 10% padding

  assert.strictEqual(result.width, Math.round(sourceW * 0.9), 'Width should match source (with padding)');
  assert.ok(result.height < sourceH, 'Height should be cropped');
});

test('calculateCrop() calculates correct scale factor', () => {
  const config = DEFAULT_CONFIG;
  const sourceW = 3840; // 4K
  const sourceH = 2160;

  const result = calculateCrop(sourceW, sourceH, config);

  // Scale should be targetWidth / cropWidth
  const expectedScale = config.targetWidth / result.width;

  assert.strictEqual(result.scale, expectedScale, 'Scale should match expected ratio');
});

test('calculateCrop() falls back to letterbox when aspect delta too large', () => {
  const config = DEFAULT_CONFIG;
  const sourceW = 1080; // 9:16 portrait
  const sourceH = 1920;

  const result = calculateCrop(sourceW, sourceH, config);

  // 9:16 to 16:9 has aspect delta > 0.3, should letterbox
  assert.strictEqual(result.mode, 'letterbox', 'Should fall back to letterbox mode');
});

// Test calculateLetterbox() for different aspect ratios
test('calculateLetterbox() fits wider source to width', () => {
  const config = DEFAULT_CONFIG;
  const sourceW = 2560; // Ultrawide
  const sourceH = 1080;

  const result = calculateLetterbox(sourceW, sourceH, config);

  assert.strictEqual(result.mode, 'letterbox', 'Should use letterbox mode');
  assert.strictEqual(result.width, config.targetWidth, 'Should fit to target width');

  // Height should scale proportionally
  const sourceAspect = sourceW / sourceH;
  const expectedHeight = config.targetWidth / sourceAspect;

  assert.strictEqual(result.height, Math.round(expectedHeight), 'Height should scale proportionally');
  assert.ok(result.height <= config.targetHeight, 'Height should fit within target');
});

test('calculateLetterbox() fits taller source to height', () => {
  const config = DEFAULT_CONFIG;
  const sourceW = 1080; // Portrait
  const sourceH = 1920;

  const result = calculateLetterbox(sourceW, sourceH, config);

  assert.strictEqual(result.mode, 'letterbox', 'Should use letterbox mode');
  assert.strictEqual(result.height, config.targetHeight, 'Should fit to target height');

  // Width should scale proportionally
  const sourceAspect = sourceW / sourceH;
  const expectedWidth = config.targetHeight * sourceAspect;

  assert.strictEqual(result.width, Math.round(expectedWidth), 'Width should scale proportionally');
  assert.ok(result.width <= config.targetWidth, 'Width should fit within target');
});

test('calculateLetterbox() centers the content horizontally', () => {
  const config = DEFAULT_CONFIG;
  const sourceW = 1080; // Portrait - will have horizontal letterboxing
  const sourceH = 1920;

  const result = calculateLetterbox(sourceW, sourceH, config);

  const expectedX = (config.targetWidth - result.width) / 2;

  assert.strictEqual(result.x, Math.round(expectedX), 'Should center horizontally');
  assert.strictEqual(result.y, 0, 'Y should be 0 (fits to height)');
});

test('calculateLetterbox() centers the content vertically', () => {
  const config = DEFAULT_CONFIG;
  const sourceW = 2560; // Ultrawide - will have vertical letterboxing
  const sourceH = 1080;

  const result = calculateLetterbox(sourceW, sourceH, config);

  const expectedY = (config.targetHeight - result.height) / 2;

  assert.strictEqual(result.x, 0, 'X should be 0 (fits to width)');
  assert.strictEqual(result.y, Math.round(expectedY), 'Should center vertically');
});

test('calculateLetterbox() calculates correct scale factor', () => {
  const config = DEFAULT_CONFIG;
  const sourceW = 1080;
  const sourceH = 1920;

  const result = calculateLetterbox(sourceW, sourceH, config);

  // For taller source, scale is targetHeight / sourceH
  const expectedScale = config.targetHeight / sourceH;

  assert.strictEqual(result.scale, expectedScale, 'Scale should match expected ratio');
});

// Edge cases
test('Edge case: square source (1:1) to 16:9 target', () => {
  const config = DEFAULT_CONFIG;
  const sourceW = 1000;
  const sourceH = 1000;

  const result = calculateCrop(sourceW, sourceH, config);

  // 1:1 to 16:9 aspect delta = |1 - 1.778| / 1.778 = 0.437 > 0.3
  assert.strictEqual(result.mode, 'letterbox', 'Square to 16:9 should letterbox');
});

test('Edge case: 9:16 portrait to 16:9 landscape', () => {
  const config = DEFAULT_CONFIG;
  const sourceW = 1080;
  const sourceH = 1920;

  const result = calculateCrop(sourceW, sourceH, config);

  // 9:16 to 16:9 aspect delta > 0.3
  assert.strictEqual(result.mode, 'letterbox', '9:16 to 16:9 should letterbox');
  assert.strictEqual(result.height, config.targetHeight, 'Should fit to target height');
});

test('Edge case: very wide source (32:9) to 16:9 target', () => {
  const config = DEFAULT_CONFIG;
  const sourceW = 3840; // 32:9
  const sourceH = 1080;

  const result = calculateCrop(sourceW, sourceH, config);

  // 32:9 to 16:9 aspect delta = |3.556 - 1.778| / 1.778 = 1.0 > 0.3
  assert.strictEqual(result.mode, 'letterbox', 'Very wide source should letterbox');
});

test('Edge case: very tall source (9:21) to 16:9 target', () => {
  const config = DEFAULT_CONFIG;
  const sourceW = 1080;
  const sourceH = 2520; // Approximately 9:21

  const result = calculateCrop(sourceW, sourceH, config);

  assert.strictEqual(result.mode, 'letterbox', 'Very tall source should letterbox');
});

test('Edge case: zero padding (safePaddingPercent = 0)', () => {
  const config = { ...DEFAULT_CONFIG, safePaddingPercent: 0 };
  const sourceW = 1920;
  const sourceH = 1080;

  const result = calculateCrop(sourceW, sourceH, config);

  assert.strictEqual(result.width, sourceW, 'Width should not be reduced with 0% padding');
  assert.strictEqual(result.height, sourceH, 'Height should not be reduced with 0% padding');
});

test('Edge case: high padding (safePaddingPercent = 20)', () => {
  const config = { ...DEFAULT_CONFIG, safePaddingPercent: 20 };
  const sourceW = 1920;
  const sourceH = 1080;

  const result = calculateCrop(sourceW, sourceH, config);

  const expectedWidth = Math.round(sourceW * 0.8); // 80% of source
  const expectedHeight = Math.round(sourceH * 0.8);

  assert.strictEqual(result.width, expectedWidth, 'Width should be reduced by 20%');
  assert.strictEqual(result.height, expectedHeight, 'Height should be reduced by 20%');
});

test('Edge case: identical aspect ratios (no crop needed)', () => {
  const config = DEFAULT_CONFIG;
  const sourceW = 1920;
  const sourceH = 1080;

  const result = calculateCrop(sourceW, sourceH, config);

  assert.strictEqual(result.mode, 'crop', 'Should use crop mode for identical aspects');

  // With 10% padding
  const expectedWidth = Math.round(sourceW * 0.9);
  const expectedHeight = Math.round(sourceH * 0.9);

  assert.strictEqual(result.width, expectedWidth, 'Dimensions should only be affected by padding');
  assert.strictEqual(result.height, expectedHeight, 'Dimensions should only be affected by padding');
});

console.log('\n✅ All aspect processor tests passed!');
