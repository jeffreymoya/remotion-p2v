/**
 * Viewport Utilities Tests
 * Tests viewport state calculation, transform math, and easing functions
 *
 * Migrated from src/lib/__tests__/viewport-utils.test.ts (node:test → Vitest)
 */

import { describe, it, expect } from 'vitest';
import {
  calculateViewportState,
  viewportToTransform,
  EASING_FUNCTIONS,
  lerp,
  clamp,
  type ViewportKeyframe,
  type ViewportState,
} from '@/src/lib/viewport-utils';

// ============================================================================
// Section 1: Helper Function Tests
// ============================================================================

describe('Helper Functions', () => {
  describe('lerp', () => {
    it('interpolates between two values', () => {
      expect(lerp(0, 10, 0)).toBe(0);
      expect(lerp(0, 10, 1)).toBe(10);
      expect(lerp(0, 10, 0.5)).toBe(5);
      expect(lerp(100, 200, 0.25)).toBe(125);
      expect(lerp(-10, 10, 0.5)).toBe(0);
    });
  });

  describe('clamp', () => {
    it('restricts value to min/max bounds', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(-100, -50, -10)).toBe(-50);
    });
  });
});

// ============================================================================
// Section 2: Easing Functions Tests
// ============================================================================

describe('Easing Functions', () => {
  describe('linear', () => {
    it('returns progress unchanged', () => {
      for (let t = 0; t <= 1; t += 0.1) {
        const result = EASING_FUNCTIONS.linear(t);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(1);
        expect(result).toBe(t);
      }
    });
  });

  describe('easeIn', () => {
    it('accelerates from zero velocity', () => {
      expect(EASING_FUNCTIONS.easeIn(0)).toBe(0);
      expect(EASING_FUNCTIONS.easeIn(1)).toBe(1);
      expect(EASING_FUNCTIONS.easeIn(0.5)).toBe(0.25);

      for (let t = 0; t <= 1; t += 0.1) {
        const result = EASING_FUNCTIONS.easeIn(t);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('easeOut', () => {
    it('decelerates to zero velocity', () => {
      expect(EASING_FUNCTIONS.easeOut(0)).toBe(0);
      expect(EASING_FUNCTIONS.easeOut(1)).toBe(1);
      expect(EASING_FUNCTIONS.easeOut(0.5)).toBe(0.75);

      for (let t = 0; t <= 1; t += 0.1) {
        const result = EASING_FUNCTIONS.easeOut(t);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('easeInOut', () => {
    it('provides smooth acceleration then deceleration', () => {
      expect(EASING_FUNCTIONS.easeInOut(0)).toBe(0);
      expect(EASING_FUNCTIONS.easeInOut(1)).toBe(1);

      for (let t = 0; t <= 1; t += 0.05) {
        const result = EASING_FUNCTIONS.easeInOut(t);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('slowDramatic', () => {
    it('is an alias for easeInOut', () => {
      for (let t = 0; t <= 1; t += 0.1) {
        const slowResult = EASING_FUNCTIONS.slowDramatic(t);
        const easeInOutResult = EASING_FUNCTIONS.easeInOut(t);
        expect(slowResult).toBe(easeInOutResult);
      }
    });
  });

  describe('fastAction', () => {
    it('uses cubic ease-out', () => {
      expect(EASING_FUNCTIONS.fastAction(0)).toBe(0);
      expect(EASING_FUNCTIONS.fastAction(1)).toBe(1);

      for (let t = 0; t <= 1; t += 0.1) {
        const result = EASING_FUNCTIONS.fastAction(t);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(1);
      }
    });
  });

  it('all functions return 0-1 range for valid inputs', () => {
    const testValues = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1];
    const functions = Object.entries(EASING_FUNCTIONS);

    for (const [name, fn] of functions) {
      for (const t of testValues) {
        const result = fn(t);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(1);
      }
    }
  });
});

// ============================================================================
// Section 3: calculateViewportState Tests
// ============================================================================

describe('calculateViewportState', () => {
  it('first keyframe displays immediately', () => {
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

    expect(result.centerX).toBe(0.5);
    expect(result.centerY).toBe(0.5);
    expect(result.zoom).toBe(1.0);
  });

  it('mid-transition interpolation', () => {
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
        frameEnd: 90,
        viewport: { centerX: 0.8, centerY: 0.8, zoom: 2.0 },
        easing: 'linear',
        transitionDurationMs: 2000,
      },
    ];

    const result = calculateViewportState(60, keyframes, 30);

    const expectedCenterX = lerp(0.2, 0.8, 0.5);
    const expectedCenterY = lerp(0.2, 0.8, 0.5);
    const expectedZoom = lerp(1.0, 2.0, 0.5);

    expect(result.centerX).toBe(expectedCenterX);
    expect(result.centerY).toBe(expectedCenterY);
    expect(result.zoom).toBe(expectedZoom);
  });

  it('overflow clamp prevents progress > 1.0', () => {
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
        frameEnd: 30,
        viewport: { centerX: 1.0, centerY: 1.0, zoom: 3.0 },
        easing: 'linear',
        transitionDurationMs: 2000,
      },
    ];

    const result = calculateViewportState(30, keyframes, 30);

    expect(result.centerX).toBe(1.0);
    expect(result.centerY).toBe(1.0);
    expect(result.zoom).toBe(3.0);
  });

  it('static viewport when not transitioning', () => {
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

    expect(result.centerX).toBe(0.5);
    expect(result.centerY).toBe(0.5);
    expect(result.zoom).toBe(1.5);
  });

  it('frame before first keyframe uses first keyframe', () => {
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

    expect(result.centerX).toBe(0.3);
    expect(result.centerY).toBe(0.4);
    expect(result.zoom).toBe(1.2);
  });

  it('frame after last keyframe uses last keyframe', () => {
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

    expect(result.centerX).toBe(0.6);
    expect(result.centerY).toBe(0.7);
    expect(result.zoom).toBe(1.8);
  });

  it('easing applied correctly during transition', () => {
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
        easing: 'linear',
        transitionDurationMs: 900,
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
        easing: 'easeIn',
        transitionDurationMs: 900,
      },
    ];

    const linearResult = calculateViewportState(45, keyframesLinear, 30);
    const easeInResult = calculateViewportState(45, keyframesEaseIn, 30);

    expect(easeInResult.centerX).toBeLessThan(linearResult.centerX);
  });

  it('handles multiple keyframes in sequence', () => {
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

    let result = calculateViewportState(15, keyframes, 30);
    expect(result.centerX).toBe(0.2);

    result = calculateViewportState(60, keyframes, 30);
    expect(result.centerX).toBe(0.5);

    result = calculateViewportState(90, keyframes, 30);
    expect(result.centerX).toBe(0.8);
  });

  it('keyframes are sorted regardless of input order', () => {
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

    const result = calculateViewportState(15, keyframes, 30);
    expect(result.centerX).toBe(0.2);
  });
});

// ============================================================================
// Section 4: viewportToTransform Tests
// ============================================================================

describe('viewportToTransform', () => {
  it('centered region at zoom 1.0', () => {
    const viewport: ViewportState = { centerX: 0.5, centerY: 0.5, zoom: 1.0 };

    const transform = viewportToTransform(viewport, 3840, 2160, 1920, 1080);

    expect(transform.scale).toBe(0.5);
    expect(transform.translateX).toBeLessThanOrEqual(0);
    expect(transform.translateY).toBeLessThanOrEqual(0);
  });

  it('zoom level 2.0 magnifies image', () => {
    const viewport: ViewportState = { centerX: 0.5, centerY: 0.5, zoom: 2.0 };

    const transform = viewportToTransform(viewport, 3840, 2160, 1920, 1080);

    expect(transform.scale).toBe(1.0);
  });

  it('zoom level 0.5 zooms out', () => {
    const viewport: ViewportState = { centerX: 0.5, centerY: 0.5, zoom: 0.5 };

    const transform = viewportToTransform(viewport, 3840, 2160, 1920, 1080);

    expect(transform.scale).toBe(0.25);
  });

  it('off-center viewport pans correctly', () => {
    const centerViewport: ViewportState = { centerX: 0.5, centerY: 0.5, zoom: 2.0 };
    const edgeViewport: ViewportState = { centerX: 0.0, centerY: 0.0, zoom: 2.0 };

    const centerTransform = viewportToTransform(centerViewport, 3840, 2160, 1920, 1080);
    const edgeTransform = viewportToTransform(edgeViewport, 3840, 2160, 1920, 1080);

    expect(centerTransform.translateX).not.toBe(edgeTransform.translateX);
    expect(centerTransform.translateY).not.toBe(edgeTransform.translateY);
  });

  it('clamping prevents black bars', () => {
    const viewport: ViewportState = { centerX: 0.9, centerY: 0.9, zoom: 3.0 };

    const transform = viewportToTransform(viewport, 3840, 2160, 1920, 1080);

    const scaledW = 3840 * 1.5;
    const scaledH = 2160 * 1.5;

    const minX = 1920 - scaledW;
    const maxX = 0;
    expect(transform.translateX).toBeGreaterThanOrEqual(minX);
    expect(transform.translateX).toBeLessThanOrEqual(maxX);

    const minY = 1080 - scaledH;
    const maxY = 0;
    expect(transform.translateY).toBeGreaterThanOrEqual(minY);
    expect(transform.translateY).toBeLessThanOrEqual(maxY);
  });

  it('square aspect ratio handling', () => {
    const viewport: ViewportState = { centerX: 0.5, centerY: 0.5, zoom: 1.5 };

    const transform = viewportToTransform(viewport, 2000, 2000, 1000, 1000);

    expect(transform.scale).toBe(0.75);
  });

  it('portrait image on landscape canvas', () => {
    const viewport: ViewportState = { centerX: 0.5, centerY: 0.5, zoom: 1.0 };

    const transform = viewportToTransform(viewport, 1920, 3840, 3840, 2160);

    expect(transform.scale).toBe(2.0);
  });

  it('landscape image on portrait canvas', () => {
    const viewport: ViewportState = { centerX: 0.5, centerY: 0.5, zoom: 1.0 };

    const transform = viewportToTransform(viewport, 3840, 2160, 1920, 3840);

    const baseScale = Math.max(1920 / 3840, 3840 / 2160);
    expect(transform.scale).toBe(baseScale);
  });

  it('returns all required transform properties', () => {
    const viewport: ViewportState = { centerX: 0.3, centerY: 0.4, zoom: 1.2 };

    const transform = viewportToTransform(viewport, 3840, 2160, 1920, 1080);

    expect(typeof transform.scale).toBe('number');
    expect(typeof transform.translateX).toBe('number');
    expect(typeof transform.translateY).toBe('number');
    expect(transform.scale).toBeGreaterThan(0);
  });
});

// ============================================================================
// Section 5: Integration Tests
// ============================================================================

describe('Integration', () => {
  it('calculateViewportState and viewportToTransform integration', () => {
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

    expect(transform.scale).toBeGreaterThan(0);
    expect(Number.isFinite(transform.translateX)).toBe(true);
    expect(Number.isFinite(transform.translateY)).toBe(true);
  });

  it('complex animation sequence with varying zoom and pan', () => {
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
        transitionDurationMs: 1800,
      },
      {
        frameStart: 90,
        frameEnd: 120,
        viewport: { centerX: 0.9, centerY: 0.9, zoom: 1.5 },
        easing: 'fastAction',
        transitionDurationMs: 600,
      },
    ];

    const states = [
      { frame: 0, expectedX: 0.1 },
      { frame: 30, expectedX: 0.1 },
      { frame: 60, expectedX: 0.3 },
      { frame: 90, expectedX: 0.5 },
      { frame: 100, expectedX: 0.8 },
      { frame: 120, expectedX: 0.9 },
    ];

    for (const { frame, expectedX } of states) {
      const state = calculateViewportState(frame, keyframes, 30);
      expect(Math.abs(state.centerX - expectedX)).toBeLessThan(0.15);
    }
  });
});
