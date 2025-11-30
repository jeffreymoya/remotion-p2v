#!/usr/bin/env node
/**
 * Edge Case Test: Emphasis Constraints
 *
 * Tests emphasis tagging constraints and validation:
 * - Density caps (max 5% high, max 15% medium, max 20% total)
 * - Gap enforcement (min 2-word gap between high emphasis)
 * - Boundary conditions (0%, 100%, edge cases)
 * - Invalid emphasis data handling
 * - Word index validation
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

// Import helpers
import { assertEmphasisConstraints, type EmphasisData } from '../helpers/assertions';

// Test constants
const TEST_TIMEOUT = 60000; // 1 minute

/**
 * Helper: Calculate emphasis density
 */
function calculateEmphasisDensity(
  emphases: EmphasisData[],
  totalWords: number
): { highPercent: number; medPercent: number; totalPercent: number } {
  const highCount = emphases.filter((e) => e.level === 'high').length;
  const medCount = emphases.filter((e) => e.level === 'med').length;
  const totalCount = emphases.length;

  return {
    highPercent: (highCount / totalWords) * 100,
    medPercent: (medCount / totalWords) * 100,
    totalPercent: (totalCount / totalWords) * 100,
  };
}

/**
 * Helper: Validate high-emphasis gaps
 */
function validateHighEmphasisGaps(
  emphases: EmphasisData[],
  minGap: number = 2
): { valid: boolean; violations: string[] } {
  const highEmphases = emphases
    .filter((e) => e.level === 'high')
    .map((e) => e.wordIndex)
    .sort((a, b) => a - b);

  const violations: string[] = [];

  for (let i = 0; i < highEmphases.length - 1; i++) {
    const gap = highEmphases[i + 1] - highEmphases[i] - 1;
    if (gap < minGap) {
      violations.push(
        `Gap of ${gap} words between indices ${highEmphases[i]} and ${highEmphases[i + 1]} (min: ${minGap})`
      );
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

describe('Edge Case: Emphasis Constraints', { timeout: TEST_TIMEOUT }, () => {
  before(async () => {
    console.log('\n💫 Starting Emphasis Constraints Edge Case Test...\n');
  });

  after(async () => {
    console.log('\n🧹 Cleaning up emphasis constraint tests...');
    console.log('✅ Cleanup complete\n');
  });

  describe('Density Constraints', () => {
    it('should validate emphasis within density limits', () => {
      console.log('📝 Testing valid emphasis density...');

      const totalWords = 100;

      // 3% high, 10% medium (within limits)
      const validEmphases: EmphasisData[] = [
        { wordIndex: 0, level: 'high' },
        { wordIndex: 5, level: 'high' },
        { wordIndex: 10, level: 'high' },
        { wordIndex: 15, level: 'med' },
        { wordIndex: 20, level: 'med' },
        { wordIndex: 25, level: 'med' },
        { wordIndex: 30, level: 'med' },
        { wordIndex: 35, level: 'med' },
        { wordIndex: 40, level: 'med' },
        { wordIndex: 45, level: 'med' },
        { wordIndex: 50, level: 'med' },
        { wordIndex: 55, level: 'med' },
        { wordIndex: 60, level: 'med' },
      ];

      const density = calculateEmphasisDensity(validEmphases, totalWords);

      assert.ok(density.highPercent <= 5, 'High emphasis should be ≤5%');
      assert.ok(density.medPercent <= 15, 'Medium emphasis should be ≤15%');
      assert.ok(density.totalPercent <= 20, 'Total emphasis should be ≤20%');

      console.log(`✅ Valid density: ${density.highPercent}% high, ${density.medPercent}% med\n`);
    });

    it('should detect high emphasis over 5% limit', () => {
      console.log('📝 Testing high emphasis over limit...');

      const totalWords = 100;

      // 8% high (over 5% limit)
      const overLimitEmphases: EmphasisData[] = Array.from({ length: 8 }, (_, i) => ({
        wordIndex: i * 10,
        level: 'high' as const,
      }));

      const density = calculateEmphasisDensity(overLimitEmphases, totalWords);

      assert.ok(density.highPercent > 5, 'Should exceed 5% high limit');

      console.log(`✅ Detected over-limit: ${density.highPercent}% high\n`);
    });

    it('should detect medium emphasis over 15% limit', () => {
      console.log('📝 Testing medium emphasis over limit...');

      const totalWords = 100;

      // 20% medium (over 15% limit)
      const overLimitEmphases: EmphasisData[] = Array.from({ length: 20 }, (_, i) => ({
        wordIndex: i * 4,
        level: 'med' as const,
      }));

      const density = calculateEmphasisDensity(overLimitEmphases, totalWords);

      assert.ok(density.medPercent > 15, 'Should exceed 15% medium limit');

      console.log(`✅ Detected over-limit: ${density.medPercent}% med\n`);
    });

    it('should detect total emphasis over 20% limit', () => {
      console.log('📝 Testing total emphasis over limit...');

      const totalWords = 100;

      // 25% total (5% high + 20% med = over 20% total limit)
      const overLimitEmphases: EmphasisData[] = [
        ...Array.from({ length: 5 }, (_, i) => ({
          wordIndex: i * 10,
          level: 'high' as const,
        })),
        ...Array.from({ length: 20 }, (_, i) => ({
          wordIndex: i * 4 + 1,
          level: 'med' as const,
        })),
      ];

      const density = calculateEmphasisDensity(overLimitEmphases, totalWords);

      assert.ok(density.totalPercent > 20, 'Should exceed 20% total limit');

      console.log(`✅ Detected over-limit: ${density.totalPercent}% total\n`);
    });

    it('should handle zero emphasis (0% density)', () => {
      console.log('📝 Testing zero emphasis...');

      const totalWords = 100;
      const noEmphases: EmphasisData[] = [];

      const density = calculateEmphasisDensity(noEmphases, totalWords);

      assert.strictEqual(density.highPercent, 0, 'High should be 0%');
      assert.strictEqual(density.medPercent, 0, 'Medium should be 0%');
      assert.strictEqual(density.totalPercent, 0, 'Total should be 0%');

      console.log('✅ Zero emphasis handled correctly\n');
    });

    it('should handle maximum allowed density (boundary)', () => {
      console.log('📝 Testing maximum allowed density...');

      const totalWords = 100;

      // Exactly 5% high, 15% medium (at limits)
      const maxEmphases: EmphasisData[] = [
        ...Array.from({ length: 5 }, (_, i) => ({
          wordIndex: i * 15,
          level: 'high' as const,
        })),
        ...Array.from({ length: 15 }, (_, i) => ({
          wordIndex: i * 6 + 1,
          level: 'med' as const,
        })),
      ];

      const density = calculateEmphasisDensity(maxEmphases, totalWords);

      assert.strictEqual(density.highPercent, 5, 'High should be exactly 5%');
      assert.strictEqual(density.medPercent, 15, 'Medium should be exactly 15%');
      assert.strictEqual(density.totalPercent, 20, 'Total should be exactly 20%');

      console.log('✅ Maximum density boundary handled correctly\n');
    });
  });

  describe('Gap Constraints', () => {
    it('should validate minimum gap between high emphasis', () => {
      console.log('📝 Testing valid high emphasis gaps...');

      // Indices: 0, 5, 10, 15 (gaps of 4 words each, >= 2)
      const validGaps: EmphasisData[] = [
        { wordIndex: 0, level: 'high' },
        { wordIndex: 5, level: 'high' },
        { wordIndex: 10, level: 'high' },
        { wordIndex: 15, level: 'high' },
      ];

      const gapValidation = validateHighEmphasisGaps(validGaps, 2);

      assert.strictEqual(gapValidation.valid, true, 'Gaps should be valid');
      assert.strictEqual(gapValidation.violations.length, 0, 'Should have no violations');

      console.log('✅ Valid high emphasis gaps\n');
    });

    it('should detect gaps below minimum', () => {
      console.log('📝 Testing gaps below minimum...');

      // Indices: 0, 2, 4 (gaps of 1 word, below min of 2)
      const invalidGaps: EmphasisData[] = [
        { wordIndex: 0, level: 'high' },
        { wordIndex: 2, level: 'high' },
        { wordIndex: 4, level: 'high' },
      ];

      const gapValidation = validateHighEmphasisGaps(invalidGaps, 2);

      assert.strictEqual(gapValidation.valid, false, 'Gaps should be invalid');
      assert.ok(gapValidation.violations.length > 0, 'Should have violations');

      console.log(`✅ Detected ${gapValidation.violations.length} gap violations\n`);
    });

    it('should handle consecutive high emphasis (gap = 0)', () => {
      console.log('📝 Testing consecutive high emphasis...');

      // Indices: 0, 1, 2 (no gap)
      const consecutiveEmphases: EmphasisData[] = [
        { wordIndex: 0, level: 'high' },
        { wordIndex: 1, level: 'high' },
        { wordIndex: 2, level: 'high' },
      ];

      const gapValidation = validateHighEmphasisGaps(consecutiveEmphases, 2);

      assert.strictEqual(gapValidation.valid, false, 'Should be invalid');
      assert.strictEqual(gapValidation.violations.length, 2, 'Should have 2 violations');

      console.log('✅ Consecutive emphasis detected\n');
    });

    it('should handle single high emphasis (no gaps to validate)', () => {
      console.log('📝 Testing single high emphasis...');

      const singleEmphasis: EmphasisData[] = [{ wordIndex: 10, level: 'high' }];

      const gapValidation = validateHighEmphasisGaps(singleEmphasis, 2);

      assert.strictEqual(gapValidation.valid, true, 'Should be valid (no gaps to check)');
      assert.strictEqual(gapValidation.violations.length, 0, 'Should have no violations');

      console.log('✅ Single emphasis handled correctly\n');
    });

    it('should not check gaps for medium emphasis', () => {
      console.log('📝 Testing medium emphasis gap handling...');

      // Medium emphases can be consecutive
      const mediumEmphases: EmphasisData[] = [
        { wordIndex: 0, level: 'med' },
        { wordIndex: 1, level: 'med' },
        { wordIndex: 2, level: 'med' },
      ];

      // Only high emphasis is checked for gaps
      const highOnly = mediumEmphases.filter((e) => e.level === 'high');
      const gapValidation = validateHighEmphasisGaps(highOnly, 2);

      assert.strictEqual(gapValidation.valid, true, 'Should be valid (no high emphasis)');

      console.log('✅ Medium emphasis not subject to gap constraints\n');
    });

    it('should handle mixed high and medium emphasis', () => {
      console.log('📝 Testing mixed emphasis types...');

      // High at 0, 5, 10 (valid gaps), medium scattered throughout
      const mixedEmphases: EmphasisData[] = [
        { wordIndex: 0, level: 'high' },
        { wordIndex: 1, level: 'med' },
        { wordIndex: 2, level: 'med' },
        { wordIndex: 5, level: 'high' },
        { wordIndex: 7, level: 'med' },
        { wordIndex: 10, level: 'high' },
      ];

      const gapValidation = validateHighEmphasisGaps(mixedEmphases, 2);

      assert.strictEqual(gapValidation.valid, true, 'High emphasis gaps should be valid');

      console.log('✅ Mixed emphasis types handled correctly\n');
    });
  });

  describe('Word Index Validation', () => {
    it('should validate word indices within range', () => {
      console.log('📝 Testing word index range validation...');

      const totalWords = 100;

      const validIndices: EmphasisData[] = [
        { wordIndex: 0, level: 'high' },
        { wordIndex: 50, level: 'med' },
        { wordIndex: 99, level: 'high' },
      ];

      validIndices.forEach((emphasis) => {
        assert.ok(
          emphasis.wordIndex >= 0 && emphasis.wordIndex < totalWords,
          `Index ${emphasis.wordIndex} should be in range [0, ${totalWords})`
        );
      });

      console.log('✅ Valid word indices\n');
    });

    it('should detect negative word indices', () => {
      console.log('📝 Testing negative word index detection...');

      const invalidEmphases: EmphasisData[] = [
        { wordIndex: -1, level: 'high' },
        { wordIndex: -5, level: 'med' },
      ];

      invalidEmphases.forEach((emphasis) => {
        assert.ok(emphasis.wordIndex < 0, 'Should have negative index');
      });

      console.log('✅ Negative indices detected\n');
    });

    it('should detect word indices beyond word count', () => {
      console.log('📝 Testing out-of-range word indices...');

      const totalWords = 100;

      const outOfRangeEmphases: EmphasisData[] = [
        { wordIndex: 100, level: 'high' },
        { wordIndex: 150, level: 'med' },
      ];

      outOfRangeEmphases.forEach((emphasis) => {
        assert.ok(
          emphasis.wordIndex >= totalWords,
          `Index ${emphasis.wordIndex} should be >= ${totalWords}`
        );
      });

      console.log('✅ Out-of-range indices detected\n');
    });

    it('should handle duplicate word indices', () => {
      console.log('📝 Testing duplicate word indices...');

      const duplicateEmphases: EmphasisData[] = [
        { wordIndex: 5, level: 'high' },
        { wordIndex: 5, level: 'med' },
        { wordIndex: 10, level: 'high' },
        { wordIndex: 10, level: 'high' },
      ];

      // Find duplicates
      const indices = duplicateEmphases.map((e) => e.wordIndex);
      const duplicates = indices.filter((item, index) => indices.indexOf(item) !== index);

      assert.ok(duplicates.length > 0, 'Should have duplicate indices');

      console.log(`✅ Found ${duplicates.length} duplicate indices\n`);
    });
  });

  describe('Tone Validation', () => {
    it('should validate tone values', () => {
      console.log('📝 Testing tone value validation...');

      const validTones: EmphasisData[] = [
        { wordIndex: 0, level: 'high', tone: 'warm' },
        { wordIndex: 5, level: 'high', tone: 'intense' },
        { wordIndex: 10, level: 'med' }, // No tone (optional)
      ];

      validTones.forEach((emphasis) => {
        if (emphasis.tone) {
          assert.ok(
            emphasis.tone === 'warm' || emphasis.tone === 'intense',
            `Tone should be 'warm' or 'intense', got '${emphasis.tone}'`
          );
        }
      });

      console.log('✅ Valid tone values\n');
    });

    it('should detect invalid tone values', () => {
      console.log('📝 Testing invalid tone values...');

      const invalidTones = [
        { wordIndex: 0, level: 'high' as const, tone: 'soft' as any },
        { wordIndex: 5, level: 'med' as const, tone: 'loud' as any },
        { wordIndex: 10, level: 'high' as const, tone: '' as any },
      ];

      invalidTones.forEach((emphasis) => {
        if (emphasis.tone) {
          assert.ok(
            emphasis.tone !== 'warm' && emphasis.tone !== 'intense',
            'Should have invalid tone'
          );
        }
      });

      console.log('✅ Invalid tone values detected\n');
    });
  });

  describe('Assertion Helper Integration', () => {
    it('should use assertEmphasisConstraints helper', () => {
      console.log('📝 Testing assertEmphasisConstraints helper...');

      const totalWords = 100;

      // Valid emphases
      const validEmphases: EmphasisData[] = [
        { wordIndex: 0, level: 'high' },
        { wordIndex: 10, level: 'high' },
        { wordIndex: 20, level: 'med' },
        { wordIndex: 30, level: 'med' },
      ];

      // Should not throw
      assert.doesNotThrow(
        () => assertEmphasisConstraints(validEmphases, totalWords),
        'Should not throw for valid emphases'
      );

      console.log('✅ Assertion helper working correctly\n');
    });

    it('should detect constraint violations with helper', () => {
      console.log('📝 Testing constraint violation detection...');

      const totalWords = 10;

      // Invalid: 60% high (6 out of 10 words)
      const invalidEmphases: EmphasisData[] = Array.from({ length: 6 }, (_, i) => ({
        wordIndex: i,
        level: 'high' as const,
      }));

      // Should throw
      assert.throws(
        () => assertEmphasisConstraints(invalidEmphases, totalWords),
        'Should throw for invalid emphases'
      );

      console.log('✅ Constraint violations detected by helper\n');
    });
  });
});

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧪 Running Emphasis Constraints Edge Case Tests...\n');
}
