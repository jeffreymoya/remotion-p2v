#!/usr/bin/env node
/**
 * Viewport Types Validation Tests
 *
 * Tests for:
 * 1. GeminiResponseSchema - Zod validation for structure, bounds, salience, tone, group length, region count
 * 2. validateGeminiResponseBusinessLogic - Business logic validation for 6 rules:
 *    - IoU overlap threshold
 *    - RegionId reference validation
 *    - Contiguous segment coverage
 *    - Chronological ordering
 *    - Bounds on-canvas validation
 *    - No consecutive same regions
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  GeminiResponseSchema,
  validateGeminiResponseBusinessLogic,
  calculateOverlap,
  type GeminiResponse,
} from '../../lib/viewport-types';

// ============================================================================
// Part 1: GeminiResponseSchema - Zod Structural Validation
// ============================================================================

test('GeminiResponseSchema - rejects bounds outside 0-1 range (x < 0)', () => {
  const response = {
    regions: [
      {
        id: 'r1',
        label: 'Region 1',
        bounds: { x: -0.1, y: 0.1, width: 0.2, height: 0.2 },
        salience: 0.9,
      },
      {
        id: 'r2',
        label: 'Region 2',
        bounds: { x: 0.5, y: 0.5, width: 0.2, height: 0.2 },
        salience: 0.8,
      },
      {
        id: 'r3',
        label: 'Region 3',
        bounds: { x: 0.8, y: 0.1, width: 0.1, height: 0.1 },
        salience: 0.7,
      },
    ],
    segmentGroups: [
      { segmentIndices: [0], regionId: 'r1', tone: 'dramatic', focusReason: 'test' },
    ],
  };

  const result = GeminiResponseSchema.safeParse(response);
  assert.ok(!result.success, 'Should reject x < 0');
});

test('GeminiResponseSchema - rejects bounds outside 0-1 range (y > 1)', () => {
  const response = {
    regions: [
      {
        id: 'r1',
        label: 'Region 1',
        bounds: { x: 0.1, y: 1.5, width: 0.2, height: 0.2 },
        salience: 0.9,
      },
      {
        id: 'r2',
        label: 'Region 2',
        bounds: { x: 0.5, y: 0.5, width: 0.2, height: 0.2 },
        salience: 0.8,
      },
      {
        id: 'r3',
        label: 'Region 3',
        bounds: { x: 0.8, y: 0.1, width: 0.1, height: 0.1 },
        salience: 0.7,
      },
    ],
    segmentGroups: [
      { segmentIndices: [0], regionId: 'r1', tone: 'dramatic', focusReason: 'test' },
    ],
  };

  const result = GeminiResponseSchema.safeParse(response);
  assert.ok(!result.success, 'Should reject y > 1');
});

test('GeminiResponseSchema - rejects non-positive width', () => {
  const response = {
    regions: [
      {
        id: 'r1',
        label: 'Region 1',
        bounds: { x: 0.1, y: 0.1, width: 0, height: 0.2 },
        salience: 0.9,
      },
      {
        id: 'r2',
        label: 'Region 2',
        bounds: { x: 0.5, y: 0.5, width: 0.2, height: 0.2 },
        salience: 0.8,
      },
      {
        id: 'r3',
        label: 'Region 3',
        bounds: { x: 0.8, y: 0.1, width: 0.1, height: 0.1 },
        salience: 0.7,
      },
    ],
    segmentGroups: [
      { segmentIndices: [0], regionId: 'r1', tone: 'dramatic', focusReason: 'test' },
    ],
  };

  const result = GeminiResponseSchema.safeParse(response);
  assert.ok(!result.success, 'Should reject width ≤ 0');
});

test('GeminiResponseSchema - rejects non-positive height', () => {
  const response = {
    regions: [
      {
        id: 'r1',
        label: 'Region 1',
        bounds: { x: 0.1, y: 0.1, width: 0.2, height: -0.1 },
        salience: 0.9,
      },
      {
        id: 'r2',
        label: 'Region 2',
        bounds: { x: 0.5, y: 0.5, width: 0.2, height: 0.2 },
        salience: 0.8,
      },
      {
        id: 'r3',
        label: 'Region 3',
        bounds: { x: 0.8, y: 0.1, width: 0.1, height: 0.1 },
        salience: 0.7,
      },
    ],
    segmentGroups: [
      { segmentIndices: [0], regionId: 'r1', tone: 'dramatic', focusReason: 'test' },
    ],
  };

  const result = GeminiResponseSchema.safeParse(response);
  assert.ok(!result.success, 'Should reject height ≤ 0');
});

test('GeminiResponseSchema - rejects salience outside 0-1 (too high)', () => {
  const response = {
    regions: [
      {
        id: 'r1',
        label: 'Region 1',
        bounds: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
        salience: 1.5,
      },
      {
        id: 'r2',
        label: 'Region 2',
        bounds: { x: 0.5, y: 0.5, width: 0.2, height: 0.2 },
        salience: 0.8,
      },
      {
        id: 'r3',
        label: 'Region 3',
        bounds: { x: 0.8, y: 0.1, width: 0.1, height: 0.1 },
        salience: 0.7,
      },
    ],
    segmentGroups: [
      { segmentIndices: [0], regionId: 'r1', tone: 'dramatic', focusReason: 'test' },
    ],
  };

  const result = GeminiResponseSchema.safeParse(response);
  assert.ok(!result.success, 'Should reject salience > 1');
});

test('GeminiResponseSchema - rejects salience outside 0-1 (negative)', () => {
  const response = {
    regions: [
      {
        id: 'r1',
        label: 'Region 1',
        bounds: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
        salience: -0.5,
      },
      {
        id: 'r2',
        label: 'Region 2',
        bounds: { x: 0.5, y: 0.5, width: 0.2, height: 0.2 },
        salience: 0.8,
      },
      {
        id: 'r3',
        label: 'Region 3',
        bounds: { x: 0.8, y: 0.1, width: 0.1, height: 0.1 },
        salience: 0.7,
      },
    ],
    segmentGroups: [
      { segmentIndices: [0], regionId: 'r1', tone: 'dramatic', focusReason: 'test' },
    ],
  };

  const result = GeminiResponseSchema.safeParse(response);
  assert.ok(!result.success, 'Should reject salience < 0');
});

test('GeminiResponseSchema - rejects invalid tone values', () => {
  const response = {
    regions: [
      {
        id: 'r1',
        label: 'Region 1',
        bounds: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
        salience: 0.9,
      },
      {
        id: 'r2',
        label: 'Region 2',
        bounds: { x: 0.5, y: 0.5, width: 0.2, height: 0.2 },
        salience: 0.8,
      },
      {
        id: 'r3',
        label: 'Region 3',
        bounds: { x: 0.8, y: 0.1, width: 0.1, height: 0.1 },
        salience: 0.7,
      },
    ],
    segmentGroups: [
      { segmentIndices: [0], regionId: 'r1', tone: 'invalid_tone', focusReason: 'test' },
    ],
  };

  const result = GeminiResponseSchema.safeParse(response);
  assert.ok(!result.success, 'Should reject invalid tone');
});

test('GeminiResponseSchema - accepts all valid tone values', () => {
  const validTones = ['dramatic', 'narrative', 'action', 'contemplative', 'energetic'];

  for (const tone of validTones) {
    const response = {
      regions: [
        {
          id: 'r1',
          label: 'Region 1',
          bounds: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
          salience: 0.9,
        },
        {
          id: 'r2',
          label: 'Region 2',
          bounds: { x: 0.5, y: 0.5, width: 0.2, height: 0.2 },
          salience: 0.8,
        },
        {
          id: 'r3',
          label: 'Region 3',
          bounds: { x: 0.8, y: 0.1, width: 0.1, height: 0.1 },
          salience: 0.7,
        },
      ],
      segmentGroups: [
        { segmentIndices: [0], regionId: 'r1', tone: tone as 'dramatic' | 'narrative' | 'action' | 'contemplative' | 'energetic', focusReason: 'test' },
      ],
    };

    const result = GeminiResponseSchema.safeParse(response);
    assert.ok(result.success, `Should accept tone: ${tone}`);
  }
});

test('GeminiResponseSchema - rejects group with 0 segments', () => {
  const response = {
    regions: [
      {
        id: 'r1',
        label: 'Region 1',
        bounds: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
        salience: 0.9,
      },
      {
        id: 'r2',
        label: 'Region 2',
        bounds: { x: 0.5, y: 0.5, width: 0.2, height: 0.2 },
        salience: 0.8,
      },
      {
        id: 'r3',
        label: 'Region 3',
        bounds: { x: 0.8, y: 0.1, width: 0.1, height: 0.1 },
        salience: 0.7,
      },
    ],
    segmentGroups: [
      { segmentIndices: [], regionId: 'r1', tone: 'dramatic', focusReason: 'test' },
    ],
  };

  const result = GeminiResponseSchema.safeParse(response);
  assert.ok(!result.success, 'Should reject group with 0 segments');
});

test('GeminiResponseSchema - rejects group with more than 4 segments', () => {
  const response = {
    regions: [
      {
        id: 'r1',
        label: 'Region 1',
        bounds: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
        salience: 0.9,
      },
      {
        id: 'r2',
        label: 'Region 2',
        bounds: { x: 0.5, y: 0.5, width: 0.2, height: 0.2 },
        salience: 0.8,
      },
      {
        id: 'r3',
        label: 'Region 3',
        bounds: { x: 0.8, y: 0.1, width: 0.1, height: 0.1 },
        salience: 0.7,
      },
    ],
    segmentGroups: [
      { segmentIndices: [0, 1, 2, 3, 4], regionId: 'r1', tone: 'dramatic', focusReason: 'test' },
    ],
  };

  const result = GeminiResponseSchema.safeParse(response);
  assert.ok(!result.success, 'Should reject group with > 4 segments');
});

test('GeminiResponseSchema - accepts group with exactly 1 segment', () => {
  const response = {
    regions: [
      {
        id: 'r1',
        label: 'Region 1',
        bounds: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
        salience: 0.9,
      },
      {
        id: 'r2',
        label: 'Region 2',
        bounds: { x: 0.5, y: 0.5, width: 0.2, height: 0.2 },
        salience: 0.8,
      },
      {
        id: 'r3',
        label: 'Region 3',
        bounds: { x: 0.8, y: 0.1, width: 0.1, height: 0.1 },
        salience: 0.7,
      },
    ],
    segmentGroups: [
      { segmentIndices: [0], regionId: 'r1', tone: 'dramatic', focusReason: 'test' },
    ],
  };

  const result = GeminiResponseSchema.safeParse(response);
  assert.ok(result.success, 'Should accept group with 1 segment');
});

test('GeminiResponseSchema - accepts group with exactly 4 segments', () => {
  const response = {
    regions: [
      {
        id: 'r1',
        label: 'Region 1',
        bounds: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
        salience: 0.9,
      },
      {
        id: 'r2',
        label: 'Region 2',
        bounds: { x: 0.5, y: 0.5, width: 0.2, height: 0.2 },
        salience: 0.8,
      },
      {
        id: 'r3',
        label: 'Region 3',
        bounds: { x: 0.8, y: 0.1, width: 0.1, height: 0.1 },
        salience: 0.7,
      },
    ],
    segmentGroups: [
      { segmentIndices: [0, 1, 2, 3], regionId: 'r1', tone: 'dramatic', focusReason: 'test' },
    ],
  };

  const result = GeminiResponseSchema.safeParse(response);
  assert.ok(result.success, 'Should accept group with 4 segments');
});

test('GeminiResponseSchema - rejects fewer than 3 regions', () => {
  const response = {
    regions: [
      {
        id: 'r1',
        label: 'Region 1',
        bounds: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
        salience: 0.9,
      },
      {
        id: 'r2',
        label: 'Region 2',
        bounds: { x: 0.5, y: 0.5, width: 0.2, height: 0.2 },
        salience: 0.8,
      },
    ],
    segmentGroups: [
      { segmentIndices: [0], regionId: 'r1', tone: 'dramatic', focusReason: 'test' },
    ],
  };

  const result = GeminiResponseSchema.safeParse(response);
  assert.ok(!result.success, 'Should reject < 3 regions');
});

test('GeminiResponseSchema - accepts exactly 3 regions', () => {
  const response = {
    regions: [
      {
        id: 'r1',
        label: 'Region 1',
        bounds: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
        salience: 0.9,
      },
      {
        id: 'r2',
        label: 'Region 2',
        bounds: { x: 0.5, y: 0.5, width: 0.2, height: 0.2 },
        salience: 0.8,
      },
      {
        id: 'r3',
        label: 'Region 3',
        bounds: { x: 0.8, y: 0.1, width: 0.1, height: 0.1 },
        salience: 0.7,
      },
    ],
    segmentGroups: [
      { segmentIndices: [0, 1, 2], regionId: 'r1', tone: 'dramatic', focusReason: 'test' },
    ],
  };

  const result = GeminiResponseSchema.safeParse(response);
  assert.ok(result.success, 'Should accept 3 regions');
});

test('GeminiResponseSchema - rejects more than 8 regions', () => {
  const regions = Array.from({ length: 9 }, (_, i) => ({
    id: `r${i + 1}`,
    label: `Region ${i + 1}`,
    bounds: { x: (i * 0.1) % 1, y: 0.1, width: 0.05, height: 0.05 },
    salience: 0.7,
  }));

  const response = {
    regions,
    segmentGroups: [
      { segmentIndices: [0], regionId: 'r1', tone: 'dramatic', focusReason: 'test' },
    ],
  };

  const result = GeminiResponseSchema.safeParse(response);
  assert.ok(!result.success, 'Should reject > 8 regions');
});

test('GeminiResponseSchema - accepts exactly 8 regions', () => {
  const regions = Array.from({ length: 8 }, (_, i) => ({
    id: `r${i + 1}`,
    label: `Region ${i + 1}`,
    bounds: { x: (i * 0.1) % 1, y: 0.1, width: 0.05, height: 0.05 },
    salience: 0.7,
  }));

  const response = {
    regions,
    segmentGroups: [
      { segmentIndices: [0], regionId: 'r1', tone: 'dramatic', focusReason: 'test' },
    ],
  };

  const result = GeminiResponseSchema.safeParse(response);
  assert.ok(result.success, 'Should accept 8 regions');
});

// ============================================================================
// Part 2: validateGeminiResponseBusinessLogic - Business Logic Validation
// ============================================================================

test('validateGeminiResponseBusinessLogic - rejects IoU overlap > 0.2', () => {
  const response: GeminiResponse = {
    regions: [
      {
        id: 'r1',
        label: 'Region 1',
        bounds: { x: 0.1, y: 0.1, width: 0.3, height: 0.3 },
        salience: 0.9,
      },
      {
        id: 'r2',
        label: 'Region 2',
        bounds: { x: 0.2, y: 0.2, width: 0.3, height: 0.3 },
        salience: 0.8,
      },
      {
        id: 'r3',
        label: 'Region 3',
        bounds: { x: 0.8, y: 0.1, width: 0.1, height: 0.1 },
        salience: 0.7,
      },
    ],
    segmentGroups: [
      { segmentIndices: [0], regionId: 'r1', tone: 'dramatic', focusReason: 'test' },
      { segmentIndices: [1], regionId: 'r2', tone: 'narrative', focusReason: 'test' },
    ],
  };

  assert.throws(
    () => validateGeminiResponseBusinessLogic(response, 2),
    /overlap/,
    'Should throw error mentioning overlap'
  );
});

test('validateGeminiResponseBusinessLogic - accepts IoU overlap <= 0.2', () => {
  const response: GeminiResponse = {
    regions: [
      {
        id: 'r1',
        label: 'Region 1',
        bounds: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
        salience: 0.9,
      },
      {
        id: 'r2',
        label: 'Region 2',
        bounds: { x: 0.5, y: 0.5, width: 0.2, height: 0.2 },
        salience: 0.8,
      },
      {
        id: 'r3',
        label: 'Region 3',
        bounds: { x: 0.8, y: 0.1, width: 0.1, height: 0.1 },
        salience: 0.7,
      },
    ],
    segmentGroups: [
      { segmentIndices: [0], regionId: 'r1', tone: 'dramatic', focusReason: 'test' },
      { segmentIndices: [1], regionId: 'r2', tone: 'narrative', focusReason: 'test' },
    ],
  };

  // Should not throw
  validateGeminiResponseBusinessLogic(response, 2);
});

test('validateGeminiResponseBusinessLogic - rejects regionId reference to non-existent region', () => {
  const response: GeminiResponse = {
    regions: [
      {
        id: 'r1',
        label: 'Region 1',
        bounds: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
        salience: 0.9,
      },
      {
        id: 'r2',
        label: 'Region 2',
        bounds: { x: 0.5, y: 0.5, width: 0.2, height: 0.2 },
        salience: 0.8,
      },
      {
        id: 'r3',
        label: 'Region 3',
        bounds: { x: 0.8, y: 0.1, width: 0.1, height: 0.1 },
        salience: 0.7,
      },
    ],
    segmentGroups: [
      { segmentIndices: [0], regionId: 'r1', tone: 'dramatic', focusReason: 'test' },
      { segmentIndices: [1], regionId: 'r99', tone: 'narrative', focusReason: 'test' },
    ],
  };

  assert.throws(
    () => validateGeminiResponseBusinessLogic(response, 2),
    /non-existent region: r99/,
    'Should throw error about non-existent region'
  );
});

test('validateGeminiResponseBusinessLogic - rejects non-contiguous segments (missing segment)', () => {
  const response: GeminiResponse = {
    regions: [
      {
        id: 'r1',
        label: 'Region 1',
        bounds: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
        salience: 0.9,
      },
      {
        id: 'r2',
        label: 'Region 2',
        bounds: { x: 0.5, y: 0.5, width: 0.2, height: 0.2 },
        salience: 0.8,
      },
      {
        id: 'r3',
        label: 'Region 3',
        bounds: { x: 0.8, y: 0.1, width: 0.1, height: 0.1 },
        salience: 0.7,
      },
    ],
    segmentGroups: [
      { segmentIndices: [0, 1], regionId: 'r1', tone: 'dramatic', focusReason: 'test' },
      { segmentIndices: [3, 4], regionId: 'r2', tone: 'narrative', focusReason: 'test' },
    ],
  };

  assert.throws(
    () => validateGeminiResponseBusinessLogic(response, 5),
    /Missing/,
    'Should throw error mentioning missing segments'
  );
});

test('validateGeminiResponseBusinessLogic - rejects duplicate segment indices', () => {
  // Test case with segment index appearing in two different groups
  // Groups [0,1] and [2,1] have '1' appearing in both, violating contiguity
  const response: GeminiResponse = {
    regions: [
      {
        id: 'r1',
        label: 'Region 1',
        bounds: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
        salience: 0.9,
      },
      {
        id: 'r2',
        label: 'Region 2',
        bounds: { x: 0.5, y: 0.5, width: 0.2, height: 0.2 },
        salience: 0.8,
      },
      {
        id: 'r3',
        label: 'Region 3',
        bounds: { x: 0.8, y: 0.1, width: 0.1, height: 0.1 },
        salience: 0.7,
      },
    ],
    segmentGroups: [
      { segmentIndices: [0, 1], regionId: 'r1', tone: 'dramatic', focusReason: 'test' },
      { segmentIndices: [2, 1], regionId: 'r2', tone: 'narrative', focusReason: 'test' },
    ],
  };

  assert.throws(
    () => validateGeminiResponseBusinessLogic(response, 3),
    /not contiguous|chronological|Duplicates/,
    'Should throw error for segment coverage issues'
  );
});

test('validateGeminiResponseBusinessLogic - rejects non-chronological group ordering', () => {
  const response: GeminiResponse = {
    regions: [
      {
        id: 'r1',
        label: 'Region 1',
        bounds: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
        salience: 0.9,
      },
      {
        id: 'r2',
        label: 'Region 2',
        bounds: { x: 0.5, y: 0.5, width: 0.2, height: 0.2 },
        salience: 0.8,
      },
      {
        id: 'r3',
        label: 'Region 3',
        bounds: { x: 0.8, y: 0.1, width: 0.1, height: 0.1 },
        salience: 0.7,
      },
    ],
    segmentGroups: [
      { segmentIndices: [2, 3], regionId: 'r1', tone: 'dramatic', focusReason: 'test' },
      { segmentIndices: [0, 1], regionId: 'r2', tone: 'narrative', focusReason: 'test' },
    ],
  };

  assert.throws(
    () => validateGeminiResponseBusinessLogic(response, 4),
    /chronological order/,
    'Should throw error about chronological order'
  );
});

test('validateGeminiResponseBusinessLogic - rejects bounds exceeding image bounds (x + width > 1)', () => {
  const response: GeminiResponse = {
    regions: [
      {
        id: 'r1',
        label: 'Region 1',
        bounds: { x: 0.8, y: 0.1, width: 0.5, height: 0.2 },
        salience: 0.9,
      },
      {
        id: 'r2',
        label: 'Region 2',
        bounds: { x: 0.5, y: 0.5, width: 0.2, height: 0.2 },
        salience: 0.8,
      },
      {
        id: 'r3',
        label: 'Region 3',
        bounds: { x: 0.1, y: 0.1, width: 0.1, height: 0.1 },
        salience: 0.7,
      },
    ],
    segmentGroups: [
      { segmentIndices: [0], regionId: 'r1', tone: 'dramatic', focusReason: 'test' },
    ],
  };

  assert.throws(
    () => validateGeminiResponseBusinessLogic(response, 1),
    /exceeds image bounds/,
    'Should throw error about bounds exceeding image'
  );
});

test('validateGeminiResponseBusinessLogic - rejects bounds exceeding image bounds (y + height > 1)', () => {
  const response: GeminiResponse = {
    regions: [
      {
        id: 'r1',
        label: 'Region 1',
        bounds: { x: 0.1, y: 0.8, width: 0.2, height: 0.5 },
        salience: 0.9,
      },
      {
        id: 'r2',
        label: 'Region 2',
        bounds: { x: 0.5, y: 0.5, width: 0.2, height: 0.2 },
        salience: 0.8,
      },
      {
        id: 'r3',
        label: 'Region 3',
        bounds: { x: 0.1, y: 0.1, width: 0.1, height: 0.1 },
        salience: 0.7,
      },
    ],
    segmentGroups: [
      { segmentIndices: [0], regionId: 'r1', tone: 'dramatic', focusReason: 'test' },
    ],
  };

  assert.throws(
    () => validateGeminiResponseBusinessLogic(response, 1),
    /exceeds image bounds/,
    'Should throw error about bounds exceeding image'
  );
});

test('validateGeminiResponseBusinessLogic - rejects consecutive groups targeting same region', () => {
  const response: GeminiResponse = {
    regions: [
      {
        id: 'r1',
        label: 'Region 1',
        bounds: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
        salience: 0.9,
      },
      {
        id: 'r2',
        label: 'Region 2',
        bounds: { x: 0.5, y: 0.5, width: 0.2, height: 0.2 },
        salience: 0.8,
      },
      {
        id: 'r3',
        label: 'Region 3',
        bounds: { x: 0.8, y: 0.1, width: 0.1, height: 0.1 },
        salience: 0.7,
      },
    ],
    segmentGroups: [
      { segmentIndices: [0], regionId: 'r1', tone: 'dramatic', focusReason: 'test' },
      { segmentIndices: [1], regionId: 'r1', tone: 'narrative', focusReason: 'test' },
    ],
  };

  assert.throws(
    () => validateGeminiResponseBusinessLogic(response, 2),
    /would not move/,
    'Should throw error about consecutive same region'
  );
});

test('validateGeminiResponseBusinessLogic - accepts valid response', () => {
  const response: GeminiResponse = {
    regions: [
      {
        id: 'r1',
        label: 'Region 1',
        bounds: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
        salience: 0.9,
      },
      {
        id: 'r2',
        label: 'Region 2',
        bounds: { x: 0.5, y: 0.5, width: 0.2, height: 0.2 },
        salience: 0.8,
      },
      {
        id: 'r3',
        label: 'Region 3',
        bounds: { x: 0.8, y: 0.1, width: 0.1, height: 0.1 },
        salience: 0.7,
      },
    ],
    segmentGroups: [
      { segmentIndices: [0, 1], regionId: 'r1', tone: 'dramatic', focusReason: 'intro' },
      { segmentIndices: [2], regionId: 'r2', tone: 'narrative', focusReason: 'middle' },
    ],
  };

  // Should not throw
  validateGeminiResponseBusinessLogic(response, 3);
});

test('validateGeminiResponseBusinessLogic - accepts valid response with all 8 regions', () => {
  const regions = Array.from({ length: 8 }, (_, i) => ({
    id: `r${i + 1}`,
    label: `Region ${i + 1}`,
    bounds: {
      x: (i * 0.11) % 0.9,
      y: Math.floor(i / 4) * 0.45 + 0.05,
      width: 0.08,
      height: 0.15,
    },
    salience: 0.9 - i * 0.05,
  }));

  const response: GeminiResponse = {
    regions,
    segmentGroups: [
      { segmentIndices: [0, 1], regionId: 'r1', tone: 'dramatic', focusReason: 'intro' },
      { segmentIndices: [2], regionId: 'r2', tone: 'narrative', focusReason: 'part2' },
      { segmentIndices: [3], regionId: 'r3', tone: 'action', focusReason: 'part3' },
      { segmentIndices: [4], regionId: 'r4', tone: 'contemplative', focusReason: 'part4' },
    ],
  };

  // Should not throw
  validateGeminiResponseBusinessLogic(response, 5);
});

// ============================================================================
// Part 3: Helper Function Tests
// ============================================================================

test('calculateOverlap - no overlap', () => {
  const boundsA = { x: 0.1, y: 0.1, width: 0.2, height: 0.2 };
  const boundsB = { x: 0.5, y: 0.5, width: 0.2, height: 0.2 };

  const overlap = calculateOverlap(boundsA, boundsB);
  assert.strictEqual(overlap, 0, 'Non-overlapping regions should have 0 overlap');
});

test('calculateOverlap - 100% overlap (identical bounds)', () => {
  const boundsA = { x: 0.1, y: 0.1, width: 0.2, height: 0.2 };
  const boundsB = { x: 0.1, y: 0.1, width: 0.2, height: 0.2 };

  const overlap = calculateOverlap(boundsA, boundsB);
  assert.ok(Math.abs(overlap - 1) < 1e-10, 'Identical regions should have ~1.0 overlap');
});

test('calculateOverlap - partial overlap (25%)', () => {
  // Region A: 0.1-0.3, 0.1-0.3 (area 0.04)
  // Region B: 0.2-0.4, 0.2-0.4 (area 0.04)
  // Intersection: 0.2-0.3, 0.2-0.3 (area 0.01)
  // Union: 0.04 + 0.04 - 0.01 = 0.07
  // IoU: 0.01 / 0.07 ≈ 0.143 (14.3%)
  const boundsA = { x: 0.1, y: 0.1, width: 0.2, height: 0.2 };
  const boundsB = { x: 0.2, y: 0.2, width: 0.2, height: 0.2 };

  const overlap = calculateOverlap(boundsA, boundsB);
  assert.ok(overlap > 0 && overlap < 1, 'Partially overlapping regions should have 0 < overlap < 1');
  assert.ok(overlap < 0.2, 'Should be less than 20% (0.2) for this overlap');
});

test('calculateOverlap - one region contains another', () => {
  const boundsA = { x: 0.2, y: 0.2, width: 0.1, height: 0.1 };
  const boundsB = { x: 0.1, y: 0.1, width: 0.3, height: 0.3 };

  const overlap = calculateOverlap(boundsA, boundsB);
  // Intersection: 0.1 * 0.1 = 0.01 (all of A)
  // Union: 0.09 + 0.01 = 0.10 (B's area + 0 additional)
  // IoU: 0.01 / 0.09 ≈ 0.111 (11.1%)
  assert.ok(overlap > 0 && overlap < 0.2, 'Contained region should have significant overlap');
});

test('calculateOverlap - edge touching (no overlap)', () => {
  const boundsA = { x: 0.1, y: 0.1, width: 0.2, height: 0.2 };
  const boundsB = { x: 0.3, y: 0.1, width: 0.2, height: 0.2 };

  const overlap = calculateOverlap(boundsA, boundsB);
  assert.ok(Math.abs(overlap) < 1e-10, 'Edge-touching regions should have ~0 overlap');
});
