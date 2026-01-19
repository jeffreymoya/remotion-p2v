#!/usr/bin/env node
/**
 * Viewport Utilities Tests
 * Tests viewport state calculation, transform math, and easing functions
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateViewportState,
  viewportToTransform,
  EASING_FUNCTIONS,
  lerp,
  clamp,
  type ViewportKeyframe,
  type ViewportState,
} from '../viewport-utils';

// ============================================================================
// Section 1: Helper Function Tests
// ============================================================================

test('lerp - interpolates between two values', () => {
  assert.strictEqual(lerp(0, 10, 0), 0, 'At t=0, should return start value');
  assert.strictEqual(lerp(0, 10, 1), 10, 'At t=1, should return end value');
  assert.strictEqual(lerp(0, 10, 0.5), 5, 'At t=0.5, should return midpoint');
  assert.strictEqual(lerp(100, 200, 0.25), 125, 'Should correctly interpolate at 0.25');
  assert.strictEqual(lerp(-10, 10, 0.5), 0, 'Should work with negative values');
});

test('clamp - restricts value to min/max bounds', () => {
  assert.strictEqual(clamp(5, 0, 10), 5, 'Should pass through values within range');
  assert.strictEqual(clamp(-5, 0, 10), 0, 'Should clamp to minimum');
  assert.strictEqual(clamp(15, 0, 10), 10, 'Should clamp to maximum');
  assert.strictEqual(clamp(0, 0, 10), 0, 'Should handle exact boundaries');
  assert.strictEqual(clamp(-100, -50, -10), -50, 'Should work with negative ranges');
});

// ============================================================================
// Section 2: Easing Functions Tests
// ============================================================================

test('EASING_FUNCTIONS.linear - returns progress unchanged', () => {
  for (let t = 0; t <= 1; t += 0.1) {
    const result = EASING_FUNCTIONS.linear(t);
    assert.ok(result >= 0 && result <= 1, `linear(${t}) should be 0-1, got ${result}`);
    assert.strictEqual(result, t, `linear(${t}) should equal input`);
  }
});

test('EASING_FUNCTIONS.easeIn - accelerates from zero velocity', () => {
  assert.strictEqual(EASING_FUNCTIONS.easeIn(0), 0, 'easeIn(0) should be 0');
  assert.strictEqual(EASING_FUNCTIONS.easeIn(1), 1, 'easeIn(1) should be 1');
  assert.strictEqual(EASING_FUNCTIONS.easeIn(0.5), 0.25, 'easeIn(0.5) should be 0.25 (t²)');

  // All intermediate values should be in 0-1 range
  for (let t = 0; t <= 1; t += 0.1) {
    const result = EASING_FUNCTIONS.easeIn(t);
    assert.ok(result >= 0 && result <= 1, `easeIn(${t}) out of range: ${result}`);
  }
});

test('EASING_FUNCTIONS.easeOut - decelerates to zero velocity', () => {
  assert.strictEqual(EASING_FUNCTIONS.easeOut(0), 0, 'easeOut(0) should be 0');
  assert.strictEqual(EASING_FUNCTIONS.easeOut(1), 1, 'easeOut(1) should be 1');
  assert.strictEqual(EASING_FUNCTIONS.easeOut(0.5), 0.75, 'easeOut(0.5) should be 0.75');

  // All intermediate values should be in 0-1 range
  for (let t = 0; t <= 1; t += 0.1) {
    const result = EASING_FUNCTIONS.easeOut(t);
    assert.ok(result >= 0 && result <= 1, `easeOut(${t}) out of range: ${result}`);
  }
});

test('EASING_FUNCTIONS.easeInOut - smooth acceleration then deceleration', () => {
  assert.strictEqual(EASING_FUNCTIONS.easeInOut(0), 0, 'easeInOut(0) should be 0');
  assert.strictEqual(EASING_FUNCTIONS.easeInOut(1), 1, 'easeInOut(1) should be 1');

  // All intermediate values should be in 0-1 range
  for (let t = 0; t <= 1; t += 0.05) {
    const result = EASING_FUNCTIONS.easeInOut(t);
    assert.ok(result >= 0 && result <= 1, `easeInOut(${t}) out of range: ${result}`);
  }
});

test('EASING_FUNCTIONS.slowDramatic - alias for easeInOut', () => {
  for (let t = 0; t <= 1; t += 0.1) {
    const slowResult = EASING_FUNCTIONS.slowDramatic(t);
    const easeInOutResult = EASING_FUNCTIONS.easeInOut(t);
    assert.strictEqual(slowResult, easeInOutResult, `slowDramatic and easeInOut should match at t=${t}`);
  }
});

test('EASING_FUNCTIONS.fastAction - cubic ease-out', () => {
  assert.strictEqual(EASING_FUNCTIONS.fastAction(0), 0, 'fastAction(0) should be 0');
  assert.strictEqual(EASING_FUNCTIONS.fastAction(1), 1, 'fastAction(1) should be 1');

  // All intermediate values should be in 0-1 range
  for (let t = 0; t <= 1; t += 0.1) {
    const result = EASING_FUNCTIONS.fastAction(t);
    assert.ok(result >= 0 && result <= 1, `fastAction(${t}) out of range: ${result}`);
  }
});

test('EASING_FUNCTIONS - all functions return 0-1 range for valid inputs', () => {
  const testValues = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1];
  const functions = Object.entries(EASING_FUNCTIONS);

  for (const [name, fn] of functions) {
    for (const t of testValues) {
      const result = fn(t);
      assert.ok(
        result >= 0 && result <= 1,
        `${name}(${t}) should return 0-1 range, got ${result}`
      );
    }
  }
});

// ============================================================================
// Section 3: calculateViewportState Tests
// ============================================================================

test('calculateViewportState - first keyframe displays immediately', () => {
  const keyframes: ViewportKeyframe[] = [
    {
      frameStart: 0,
      frameEnd: 100,
      viewport: { centerX: 0.5, centerY: 0.5, zoom: 1.0 },
      easing: 'linear',
      transitionDurationMs: 1000,
    },
  ];

  const result = calculateViewportState(0, keyframes, 30);

  assert.strictEqual(result.centerX, 0.5, 'First keyframe centerX should be exact');
  assert.strictEqual(result.centerY, 0.5, 'First keyframe centerY should be exact');
  assert.strictEqual(result.zoom, 1.0, 'First keyframe zoom should be exact');
});

test('calculateViewportState - mid-transition interpolation', () => {
  // Frame 45 is between keyframe 30-165 with 2000ms transition
  // At 30fps: 2000ms = 60 frames, so transition spans frames 30-90 (clamped to keyframe duration)
  const keyframes: ViewportKeyframe[] = [
    {
      frameStart: 0,
      frameEnd: 30,
      viewport: { centerX: 0.2, centerY: 0.2, zoom: 1.0 },
      easing: 'linear',
      transitionDurationMs: 0, // No transition into first keyframe
    },
    {
      frameStart: 30,
      frameEnd: 90,
      viewport: { centerX: 0.8, centerY: 0.8, zoom: 2.0 },
      easing: 'linear',
      transitionDurationMs: 2000, // 2 second transition
    },
  ];

  const result = calculateViewportState(60, keyframes, 30);

  // At frame 60: 30 frames into the second keyframe
  // Keyframe lasts 60 frames (30-90), transition is clamped to 60 frames
  // So at frame 60 (30 frames in), progress = 30/60 = 0.5
  // With linear easing: 0.5 should be the midpoint between 0.2 and 0.8
  const expectedCenterX = lerp(0.2, 0.8, 0.5); // 0.5
  const expectedCenterY = lerp(0.2, 0.8, 0.5); // 0.5
  const expectedZoom = lerp(1.0, 2.0, 0.5); // 1.5

  assert.strictEqual(result.centerX, expectedCenterX, 'Should interpolate centerX');
  assert.strictEqual(result.centerY, expectedCenterY, 'Should interpolate centerY');
  assert.strictEqual(result.zoom, expectedZoom, 'Should interpolate zoom');
});

test('calculateViewportState - overflow clamp prevents progress > 1.0', () => {
  // Transition duration (2000ms = 60 frames at 30fps) exceeds keyframe duration (30 frames)
  // Should clamp to keyframe duration to prevent progress overflow
  const keyframes: ViewportKeyframe[] = [
    {
      frameStart: 0,
      frameEnd: 10,
      viewport: { centerX: 0.0, centerY: 0.0, zoom: 1.0 },
      easing: 'linear',
      transitionDurationMs: 0,
    },
    {
      frameStart: 10,
      frameEnd: 30, // 20 frame duration
      viewport: { centerX: 1.0, centerY: 1.0, zoom: 3.0 },
      easing: 'linear',
      transitionDurationMs: 2000, // 60 frames at 30fps - exceeds keyframe duration!
    },
  ];

  // Even though transition wants 60 frames, keyframe only lasts 20 frames
  // At the end of keyframe (frame 30), we should have full viewport (1.0, 1.0, 3.0)
  const result = calculateViewportState(30, keyframes, 30);

  assert.strictEqual(result.centerX, 1.0, 'Should reach target centerX despite overflow clamp');
  assert.strictEqual(result.centerY, 1.0, 'Should reach target centerY despite overflow clamp');
  assert.strictEqual(result.zoom, 3.0, 'Should reach target zoom despite overflow clamp');
});

test('calculateViewportState - static viewport when not transitioning', () => {
  const keyframes: ViewportKeyframe[] = [
    {
      frameStart: 0,
      frameEnd: 100,
      viewport: { centerX: 0.5, centerY: 0.5, zoom: 1.5 },
      easing: 'linear',
      transitionDurationMs: 0,
    },
  ];

  const result = calculateViewportState(50, keyframes, 30);

  assert.strictEqual(result.centerX, 0.5, 'Should return static centerX');
  assert.strictEqual(result.centerY, 0.5, 'Should return static centerY');
  assert.strictEqual(result.zoom, 1.5, 'Should return static zoom');
});

test('calculateViewportState - frame before first keyframe uses first keyframe', () => {
  const keyframes: ViewportKeyframe[] = [
    {
      frameStart: 100,
      frameEnd: 200,
      viewport: { centerX: 0.3, centerY: 0.4, zoom: 1.2 },
      easing: 'linear',
      transitionDurationMs: 1000,
    },
  ];

  const result = calculateViewportState(50, keyframes, 30);

  assert.strictEqual(result.centerX, 0.3, 'Should fallback to first keyframe centerX');
  assert.strictEqual(result.centerY, 0.4, 'Should fallback to first keyframe centerY');
  assert.strictEqual(result.zoom, 1.2, 'Should fallback to first keyframe zoom');
});

test('calculateViewportState - frame after last keyframe uses last keyframe', () => {
  const keyframes: ViewportKeyframe[] = [
    {
      frameStart: 0,
      frameEnd: 100,
      viewport: { centerX: 0.6, centerY: 0.7, zoom: 1.8 },
      easing: 'linear',
      transitionDurationMs: 0,
    },
  ];

  const result = calculateViewportState(150, keyframes, 30);

  assert.strictEqual(result.centerX, 0.6, 'Should fallback to last keyframe centerX');
  assert.strictEqual(result.centerY, 0.7, 'Should fallback to last keyframe centerY');
  assert.strictEqual(result.zoom, 1.8, 'Should fallback to last keyframe zoom');
});

test('calculateViewportState - easing applied correctly during transition', () => {
  // Compare linear vs easeIn easing at same progress point
  const keyframesLinear: ViewportKeyframe[] = [
    {
      frameStart: 0,
      frameEnd: 30,
      viewport: { centerX: 0.0, centerY: 0.0, zoom: 1.0 },
      easing: 'linear',
      transitionDurationMs: 0,
    },
    {
      frameStart: 30,
      frameEnd: 90,
      viewport: { centerX: 1.0, centerY: 1.0, zoom: 2.0 },
      easing: 'linear', // Linear easing
      transitionDurationMs: 900, // 30 frames
    },
  ];

  const keyframesEaseIn: ViewportKeyframe[] = [
    {
      frameStart: 0,
      frameEnd: 30,
      viewport: { centerX: 0.0, centerY: 0.0, zoom: 1.0 },
      easing: 'linear',
      transitionDurationMs: 0,
    },
    {
      frameStart: 30,
      frameEnd: 90,
      viewport: { centerX: 1.0, centerY: 1.0, zoom: 2.0 },
      easing: 'easeIn', // EaseIn easing - should accelerate
      transitionDurationMs: 900, // 30 frames
    },
  ];

  // At frame 45: 15 frames into transition (halfway), progress = 0.5
  const linearResult = calculateViewportState(45, keyframesLinear, 30);
  const easeInResult = calculateViewportState(45, keyframesEaseIn, 30);

  // Linear at 0.5 should be 0.5 (halfway)
  // EaseIn at 0.5 should be 0.25 (accelerating, so slower at start)
  // So easeInResult.centerX should be less than linearResult.centerX
  assert.ok(
    easeInResult.centerX < linearResult.centerX,
    `EaseIn should produce less progress than linear at same point: easeIn=${easeInResult.centerX}, linear=${linearResult.centerX}`
  );
});

test('calculateViewportState - handles multiple keyframes in sequence', () => {
  const keyframes: ViewportKeyframe[] = [
    {
      frameStart: 0,
      frameEnd: 30,
      viewport: { centerX: 0.2, centerY: 0.2, zoom: 1.0 },
      easing: 'linear',
      transitionDurationMs: 0,
    },
    {
      frameStart: 30,
      frameEnd: 60,
      viewport: { centerX: 0.5, centerY: 0.5, zoom: 1.5 },
      easing: 'linear',
      transitionDurationMs: 900,
    },
    {
      frameStart: 60,
      frameEnd: 90,
      viewport: { centerX: 0.8, centerY: 0.8, zoom: 2.0 },
      easing: 'linear',
      transitionDurationMs: 900,
    },
  ];

  // Check first keyframe (no transition before it)
  let result = calculateViewportState(15, keyframes, 30);
  assert.strictEqual(result.centerX, 0.2, 'First keyframe should be active');

  // Check second keyframe - frame 60 is at the end of transition (30 frames into 30-frame keyframe)
  // Transition is 900ms = 30 frames, fully completes
  result = calculateViewportState(60, keyframes, 30);
  assert.strictEqual(result.centerX, 0.5, 'Second keyframe center should be fully transitioned');

  // Check third keyframe - frame 90 is at the end of the third keyframe
  result = calculateViewportState(90, keyframes, 30);
  assert.strictEqual(result.centerX, 0.8, 'Third keyframe should be active at end');
});

test('calculateViewportState - keyframes are sorted regardless of input order', () => {
  // Input keyframes in wrong order
  const keyframes: ViewportKeyframe[] = [
    {
      frameStart: 60,
      frameEnd: 90,
      viewport: { centerX: 0.8, centerY: 0.8, zoom: 2.0 },
      easing: 'linear',
      transitionDurationMs: 0,
    },
    {
      frameStart: 0,
      frameEnd: 30,
      viewport: { centerX: 0.2, centerY: 0.2, zoom: 1.0 },
      easing: 'linear',
      transitionDurationMs: 0,
    },
    {
      frameStart: 30,
      frameEnd: 60,
      viewport: { centerX: 0.5, centerY: 0.5, zoom: 1.5 },
      easing: 'linear',
      transitionDurationMs: 900,
    },
  ];

  // Should still get correct viewport at frame 15
  const result = calculateViewportState(15, keyframes, 30);
  assert.strictEqual(result.centerX, 0.2, 'Should find correct keyframe despite input order');
});

// ============================================================================
// Section 4: viewportToTransform Tests
// ============================================================================

test('viewportToTransform - centered region at zoom 1.0', () => {
  // Viewport centered on image at zoom 1.0 (full image)
  const viewport: ViewportState = { centerX: 0.5, centerY: 0.5, zoom: 1.0 };

  const transform = viewportToTransform(
    viewport,
    3840, // image width
    2160, // image height
    1920, // canvas width
    1080  // canvas height
  );

  // Base scale = max(1920/3840, 1080/2160) = max(0.5, 0.5) = 0.5
  // Final scale = 0.5 * 1.0 = 0.5
  assert.strictEqual(transform.scale, 0.5, 'Should calculate correct base scale');

  // With viewport centered and zoom=1.0, translations should be neutral
  // (image fills canvas after scale)
  assert.ok(transform.translateX <= 0, 'translateX should be non-positive');
  assert.ok(transform.translateY <= 0, 'translateY should be non-positive');
});

test('viewportToTransform - zoom level 2.0 magnifies image', () => {
  const viewport: ViewportState = { centerX: 0.5, centerY: 0.5, zoom: 2.0 };

  const transform = viewportToTransform(viewport, 3840, 2160, 1920, 1080);

  // Base scale = 0.5, zoom scale = 0.5 * 2.0 = 1.0
  assert.strictEqual(transform.scale, 1.0, 'Should apply zoom multiplier to base scale');
});

test('viewportToTransform - zoom level 0.5 zooms out', () => {
  const viewport: ViewportState = { centerX: 0.5, centerY: 0.5, zoom: 0.5 };

  const transform = viewportToTransform(viewport, 3840, 2160, 1920, 1080);

  // Base scale = 0.5, zoom scale = 0.5 * 0.5 = 0.25
  assert.strictEqual(transform.scale, 0.25, 'Should reduce scale for zoom < 1.0');
});

test('viewportToTransform - off-center viewport pans correctly', () => {
  // Viewport at center (0.5, 0.5) at zoom 1.0 vs off-center (0.0, 0.0)
  // Compare translations to verify panning effect
  const centerViewport: ViewportState = { centerX: 0.5, centerY: 0.5, zoom: 2.0 };
  const edgeViewport: ViewportState = { centerX: 0.0, centerY: 0.0, zoom: 2.0 };

  const centerTransform = viewportToTransform(centerViewport, 3840, 2160, 1920, 1080);
  const edgeTransform = viewportToTransform(edgeViewport, 3840, 2160, 1920, 1080);

  // When viewport moves from center to edge, translations should differ
  // Edge viewport should have more positive translation (different pan)
  assert.notStrictEqual(
    centerTransform.translateX,
    edgeTransform.translateX,
    'Should pan horizontally for different centerX'
  );
  assert.notStrictEqual(
    centerTransform.translateY,
    edgeTransform.translateY,
    'Should pan vertically for different centerY'
  );
});

test('viewportToTransform - clamping prevents black bars', () => {
  const viewport: ViewportState = { centerX: 0.9, centerY: 0.9, zoom: 3.0 };

  const transform = viewportToTransform(viewport, 3840, 2160, 1920, 1080);

  // Base scale = 0.5, final scale = 0.5 * 3.0 = 1.5
  const scaledW = 3840 * 1.5; // 5760
  const scaledH = 2160 * 1.5; // 3240

  // Check that translations are clamped to prevent black bars
  const minX = 1920 - scaledW; // 1920 - 5760 = -3840
  const maxX = 0;
  assert.ok(
    transform.translateX >= minX && transform.translateX <= maxX,
    `translateX should be clamped to [${minX}, ${maxX}], got ${transform.translateX}`
  );

  const minY = 1080 - scaledH; // 1080 - 3240 = -2160
  const maxY = 0;
  assert.ok(
    transform.translateY >= minY && transform.translateY <= maxY,
    `translateY should be clamped to [${minY}, ${maxY}], got ${transform.translateY}`
  );
});

test('viewportToTransform - square aspect ratio handling', () => {
  // Square image and canvas
  const viewport: ViewportState = { centerX: 0.5, centerY: 0.5, zoom: 1.5 };

  const transform = viewportToTransform(viewport, 2000, 2000, 1000, 1000);

  // Base scale = max(1000/2000, 1000/2000) = 0.5
  assert.strictEqual(transform.scale, 0.75, 'Should handle square dimensions');
});

test('viewportToTransform - portrait image on landscape canvas', () => {
  const viewport: ViewportState = { centerX: 0.5, centerY: 0.5, zoom: 1.0 };

  // Portrait image (height > width)
  const transform = viewportToTransform(viewport, 1920, 3840, 3840, 2160);

  // Base scale = max(3840/1920, 2160/3840) = max(2.0, 0.5625) = 2.0
  assert.strictEqual(transform.scale, 2.0, 'Should fit portrait image to landscape canvas');
});

test('viewportToTransform - landscape image on portrait canvas', () => {
  const viewport: ViewportState = { centerX: 0.5, centerY: 0.5, zoom: 1.0 };

  // Landscape image (width > height)
  const transform = viewportToTransform(viewport, 3840, 2160, 1920, 3840);

  // Base scale = max(1920/3840, 3840/2160) = max(0.5, 1.777) = 1.777...
  const baseScale = Math.max(1920 / 3840, 3840 / 2160);
  assert.strictEqual(transform.scale, baseScale, 'Should fit landscape image to portrait canvas');
});

test('viewportToTransform - returns all required transform properties', () => {
  const viewport: ViewportState = { centerX: 0.3, centerY: 0.4, zoom: 1.2 };

  const transform = viewportToTransform(viewport, 3840, 2160, 1920, 1080);

  assert.ok(typeof transform.scale === 'number', 'Should have scale property');
  assert.ok(typeof transform.translateX === 'number', 'Should have translateX property');
  assert.ok(typeof transform.translateY === 'number', 'Should have translateY property');
  assert.ok(transform.scale > 0, 'Scale should be positive');
});

// ============================================================================
// Section 5: Integration Tests
// ============================================================================

test('calculateViewportState and viewportToTransform integration', () => {
  const keyframes: ViewportKeyframe[] = [
    {
      frameStart: 0,
      frameEnd: 60,
      viewport: { centerX: 0.5, centerY: 0.5, zoom: 1.0 },
      easing: 'linear',
      transitionDurationMs: 0,
    },
  ];

  const viewportState = calculateViewportState(30, keyframes, 30);
  const transform = viewportToTransform(viewportState, 3840, 2160, 1920, 1080);

  assert.ok(transform.scale > 0, 'Integration should produce valid scale');
  assert.ok(Number.isFinite(transform.translateX), 'Integration should produce valid translateX');
  assert.ok(Number.isFinite(transform.translateY), 'Integration should produce valid translateY');
});

test('complex animation sequence with varying zoom and pan', () => {
  const keyframes: ViewportKeyframe[] = [
    {
      frameStart: 0,
      frameEnd: 30,
      viewport: { centerX: 0.1, centerY: 0.1, zoom: 1.0 },
      easing: 'linear',
      transitionDurationMs: 0,
    },
    {
      frameStart: 30,
      frameEnd: 90,
      viewport: { centerX: 0.5, centerY: 0.5, zoom: 2.0 },
      easing: 'easeInOut',
      transitionDurationMs: 1800, // 60 frames
    },
    {
      frameStart: 90,
      frameEnd: 120,
      viewport: { centerX: 0.9, centerY: 0.9, zoom: 1.5 },
      easing: 'fastAction',
      transitionDurationMs: 600, // 20 frames
    },
  ];

  // Verify sequence of states
  const states = [
    { frame: 0, expectedX: 0.1 },
    { frame: 30, expectedX: 0.1 }, // Transition starting
    { frame: 60, expectedX: 0.3 }, // Mid-transition (easeInOut)
    { frame: 90, expectedX: 0.5 }, // Fully transitioned
    { frame: 100, expectedX: 0.8 }, // Mid-second-transition
    { frame: 120, expectedX: 0.9 }, // Final position
  ];

  for (const { frame, expectedX } of states) {
    const state = calculateViewportState(frame, keyframes, 30);
    assert.ok(
      Math.abs(state.centerX - expectedX) < 0.15,
      `Frame ${frame} centerX should be near ${expectedX}, got ${state.centerX}`
    );
  }
});
