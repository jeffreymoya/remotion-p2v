/**
 * Viewport Types Validation Tests
 *
 * Tests for:
 * 1. GeminiResponseSchema - Zod validation for structure, bounds, salience, tone, group length, region count
 * 2. validateGeminiResponseBusinessLogic - Business logic validation for 6 rules
 *
 * Migrated from src/lib/__tests__/viewport-validation.test.ts (node:test → Vitest)
 */

import { describe, it, expect } from 'vitest';
import {
  GeminiResponseSchema,
  validateGeminiResponseBusinessLogic,
  calculateOverlap,
  type GeminiResponse,
} from '@/src/lib/viewport-types';

// ============================================================================
// Part 1: GeminiResponseSchema - Zod Structural Validation
// ============================================================================

describe('GeminiResponseSchema - Bounds Validation', () => {
  const createResponse = (bounds: { x: number; y: number; width: number; height: number }) => ({
    regions: [
      {
        id: 'r1',
        label: 'Region 1',
        bounds,
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
      { segmentIndices: [0], regionId: 'r1', tone: 'dramatic' as const, focusReason: 'test' },
    ],
  });

  it('rejects bounds outside 0-1 range (x < 0)', () => {
    const response = createResponse({ x: -0.1, y: 0.1, width: 0.2, height: 0.2 });
    const result = GeminiResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it('rejects bounds outside 0-1 range (y > 1)', () => {
    const response = createResponse({ x: 0.1, y: 1.5, width: 0.2, height: 0.2 });
    const result = GeminiResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it('rejects non-positive width', () => {
    const response = createResponse({ x: 0.1, y: 0.1, width: 0, height: 0.2 });
    const result = GeminiResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it('rejects non-positive height', () => {
    const response = createResponse({ x: 0.1, y: 0.1, width: 0.2, height: -0.1 });
    const result = GeminiResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });
});

describe('GeminiResponseSchema - Salience Validation', () => {
  const createResponse = (salience: number) => ({
    regions: [
      {
        id: 'r1',
        label: 'Region 1',
        bounds: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
        salience,
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
      { segmentIndices: [0], regionId: 'r1', tone: 'dramatic' as const, focusReason: 'test' },
    ],
  });

  it('rejects salience outside 0-1 (too high)', () => {
    const response = createResponse(1.5);
    const result = GeminiResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it('rejects salience outside 0-1 (negative)', () => {
    const response = createResponse(-0.5);
    const result = GeminiResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });
});

describe('GeminiResponseSchema - Tone Validation', () => {
  const baseResponse = {
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
  };

  it('rejects invalid tone values', () => {
    const response = {
      ...baseResponse,
      segmentGroups: [
        { segmentIndices: [0], regionId: 'r1', tone: 'invalid_tone', focusReason: 'test' },
      ],
    };

    const result = GeminiResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it('accepts all valid tone values', () => {
    const validTones = ['dramatic', 'narrative', 'action', 'contemplative', 'energetic'];

    for (const tone of validTones) {
      const response = {
        ...baseResponse,
        segmentGroups: [
          { segmentIndices: [0], regionId: 'r1', tone: tone as any, focusReason: 'test' },
        ],
      };

      const result = GeminiResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    }
  });
});

describe('GeminiResponseSchema - Group Length Validation', () => {
  const baseResponse = {
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
  };

  it('rejects group with 0 segments', () => {
    const response = {
      ...baseResponse,
      segmentGroups: [
        { segmentIndices: [], regionId: 'r1', tone: 'dramatic' as const, focusReason: 'test' },
      ],
    };

    const result = GeminiResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it('rejects group with more than 4 segments', () => {
    const response = {
      ...baseResponse,
      segmentGroups: [
        { segmentIndices: [0, 1, 2, 3, 4], regionId: 'r1', tone: 'dramatic' as const, focusReason: 'test' },
      ],
    };

    const result = GeminiResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it('accepts group with exactly 1 segment', () => {
    const response = {
      ...baseResponse,
      segmentGroups: [
        { segmentIndices: [0], regionId: 'r1', tone: 'dramatic' as const, focusReason: 'test' },
      ],
    };

    const result = GeminiResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it('accepts group with exactly 4 segments', () => {
    const response = {
      ...baseResponse,
      segmentGroups: [
        { segmentIndices: [0, 1, 2, 3], regionId: 'r1', tone: 'dramatic' as const, focusReason: 'test' },
      ],
    };

    const result = GeminiResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });
});

describe('GeminiResponseSchema - Region Count Validation', () => {
  it('rejects fewer than 3 regions', () => {
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
        { segmentIndices: [0], regionId: 'r1', tone: 'dramatic' as const, focusReason: 'test' },
      ],
    };

    const result = GeminiResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it('accepts exactly 3 regions', () => {
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
        { segmentIndices: [0, 1, 2], regionId: 'r1', tone: 'dramatic' as const, focusReason: 'test' },
      ],
    };

    const result = GeminiResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it('rejects more than 8 regions', () => {
    const regions = Array.from({ length: 9 }, (_, i) => ({
      id: `r${i + 1}`,
      label: `Region ${i + 1}`,
      bounds: { x: (i * 0.1) % 1, y: 0.1, width: 0.05, height: 0.05 },
      salience: 0.7,
    }));

    const response = {
      regions,
      segmentGroups: [
        { segmentIndices: [0], regionId: 'r1', tone: 'dramatic' as const, focusReason: 'test' },
      ],
    };

    const result = GeminiResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it('accepts exactly 8 regions', () => {
    const regions = Array.from({ length: 8 }, (_, i) => ({
      id: `r${i + 1}`,
      label: `Region ${i + 1}`,
      bounds: { x: (i * 0.1) % 1, y: 0.1, width: 0.05, height: 0.05 },
      salience: 0.7,
    }));

    const response = {
      regions,
      segmentGroups: [
        { segmentIndices: [0], regionId: 'r1', tone: 'dramatic' as const, focusReason: 'test' },
      ],
    };

    const result = GeminiResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Part 2: validateGeminiResponseBusinessLogic - Business Logic Validation
// ============================================================================

describe('validateGeminiResponseBusinessLogic', () => {
  const baseRegions = [
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
  ];

  describe('IoU Overlap Validation', () => {
    it('rejects IoU overlap > 0.2', () => {
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

      expect(() => validateGeminiResponseBusinessLogic(response, 2)).toThrow(/overlap/);
    });

    it('accepts IoU overlap <= 0.2', () => {
      const response: GeminiResponse = {
        regions: baseRegions,
        segmentGroups: [
          { segmentIndices: [0], regionId: 'r1', tone: 'dramatic', focusReason: 'test' },
          { segmentIndices: [1], regionId: 'r2', tone: 'narrative', focusReason: 'test' },
        ],
      };

      expect(() => validateGeminiResponseBusinessLogic(response, 2)).not.toThrow();
    });
  });

  describe('RegionId Reference Validation', () => {
    it('rejects regionId reference to non-existent region', () => {
      const response: GeminiResponse = {
        regions: baseRegions,
        segmentGroups: [
          { segmentIndices: [0], regionId: 'r1', tone: 'dramatic', focusReason: 'test' },
          { segmentIndices: [1], regionId: 'r99', tone: 'narrative', focusReason: 'test' },
        ],
      };

      expect(() => validateGeminiResponseBusinessLogic(response, 2)).toThrow(/non-existent region: r99/);
    });
  });

  describe('Contiguous Segment Coverage', () => {
    it('rejects non-contiguous segments (missing segment)', () => {
      const response: GeminiResponse = {
        regions: baseRegions,
        segmentGroups: [
          { segmentIndices: [0, 1], regionId: 'r1', tone: 'dramatic', focusReason: 'test' },
          { segmentIndices: [3, 4], regionId: 'r2', tone: 'narrative', focusReason: 'test' },
        ],
      };

      expect(() => validateGeminiResponseBusinessLogic(response, 5)).toThrow(/Missing/);
    });

    it('rejects duplicate segment indices', () => {
      const response: GeminiResponse = {
        regions: baseRegions,
        segmentGroups: [
          { segmentIndices: [0, 1], regionId: 'r1', tone: 'dramatic', focusReason: 'test' },
          { segmentIndices: [2, 1], regionId: 'r2', tone: 'narrative', focusReason: 'test' },
        ],
      };

      expect(() => validateGeminiResponseBusinessLogic(response, 3)).toThrow(/not contiguous|chronological|Duplicates/);
    });
  });

  describe('Chronological Ordering', () => {
    it('rejects non-chronological group ordering', () => {
      const response: GeminiResponse = {
        regions: baseRegions,
        segmentGroups: [
          { segmentIndices: [2, 3], regionId: 'r1', tone: 'dramatic', focusReason: 'test' },
          { segmentIndices: [0, 1], regionId: 'r2', tone: 'narrative', focusReason: 'test' },
        ],
      };

      expect(() => validateGeminiResponseBusinessLogic(response, 4)).toThrow(/chronological order/);
    });
  });

  describe('Bounds Validation', () => {
    it('rejects bounds exceeding image bounds (x + width > 1)', () => {
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

      expect(() => validateGeminiResponseBusinessLogic(response, 1)).toThrow(/exceeds image bounds/);
    });

    it('rejects bounds exceeding image bounds (y + height > 1)', () => {
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

      expect(() => validateGeminiResponseBusinessLogic(response, 1)).toThrow(/exceeds image bounds/);
    });
  });

  describe('Consecutive Region Validation', () => {
    it('rejects consecutive groups targeting same region', () => {
      const response: GeminiResponse = {
        regions: baseRegions,
        segmentGroups: [
          { segmentIndices: [0], regionId: 'r1', tone: 'dramatic', focusReason: 'test' },
          { segmentIndices: [1], regionId: 'r1', tone: 'narrative', focusReason: 'test' },
        ],
      };

      expect(() => validateGeminiResponseBusinessLogic(response, 2)).toThrow(/would not move/);
    });
  });

  describe('Valid Responses', () => {
    it('accepts valid response', () => {
      const response: GeminiResponse = {
        regions: baseRegions,
        segmentGroups: [
          { segmentIndices: [0, 1], regionId: 'r1', tone: 'dramatic', focusReason: 'intro' },
          { segmentIndices: [2], regionId: 'r2', tone: 'narrative', focusReason: 'middle' },
        ],
      };

      expect(() => validateGeminiResponseBusinessLogic(response, 3)).not.toThrow();
    });

    it('accepts valid response with all 8 regions', () => {
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

      expect(() => validateGeminiResponseBusinessLogic(response, 5)).not.toThrow();
    });
  });
});

// ============================================================================
// Part 3: Helper Function Tests
// ============================================================================

describe('calculateOverlap', () => {
  it('no overlap', () => {
    const boundsA = { x: 0.1, y: 0.1, width: 0.2, height: 0.2 };
    const boundsB = { x: 0.5, y: 0.5, width: 0.2, height: 0.2 };

    const overlap = calculateOverlap(boundsA, boundsB);
    expect(overlap).toBe(0);
  });

  it('100% overlap (identical bounds)', () => {
    const boundsA = { x: 0.1, y: 0.1, width: 0.2, height: 0.2 };
    const boundsB = { x: 0.1, y: 0.1, width: 0.2, height: 0.2 };

    const overlap = calculateOverlap(boundsA, boundsB);
    expect(Math.abs(overlap - 1)).toBeLessThan(1e-10);
  });

  it('partial overlap (25%)', () => {
    const boundsA = { x: 0.1, y: 0.1, width: 0.2, height: 0.2 };
    const boundsB = { x: 0.2, y: 0.2, width: 0.2, height: 0.2 };

    const overlap = calculateOverlap(boundsA, boundsB);
    expect(overlap).toBeGreaterThan(0);
    expect(overlap).toBeLessThan(1);
    expect(overlap).toBeLessThan(0.2);
  });

  it('one region contains another', () => {
    const boundsA = { x: 0.2, y: 0.2, width: 0.1, height: 0.1 };
    const boundsB = { x: 0.1, y: 0.1, width: 0.3, height: 0.3 };

    const overlap = calculateOverlap(boundsA, boundsB);
    expect(overlap).toBeGreaterThan(0);
    expect(overlap).toBeLessThan(0.2);
  });

  it('edge touching (no overlap)', () => {
    const boundsA = { x: 0.1, y: 0.1, width: 0.2, height: 0.2 };
    const boundsB = { x: 0.3, y: 0.1, width: 0.2, height: 0.2 };

    const overlap = calculateOverlap(boundsA, boundsB);
    expect(Math.abs(overlap)).toBeLessThan(1e-10);
  });
});
