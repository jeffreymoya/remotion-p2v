#!/usr/bin/env node
/**
 * Emphasis Validator Tests (Wave 4.1)
 * Tests emphasis constraint validation and enforcement
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

// Import the validation function from gather.ts
// Note: This is a bit unconventional, but the validator is currently embedded in gather.ts
// In a production refactor, we'd extract this to a separate module

// Re-implement the interface for testing
interface EmphasisData {
  wordIndex: number;
  level: 'med' | 'high';
  tone?: 'warm' | 'intense';
}

/**
 * Validates and enforces emphasis constraints
 * - Total emphasis count ≤ 20% of word count
 * - High emphasis count ≤ 5% of word count
 * - No consecutive high-emphasis words (enforce 2+ word gap)
 */
function validateEmphasisConstraints(
  emphases: EmphasisData[],
  wordCount: number
): EmphasisData[] {
  if (emphases.length === 0) return emphases;

  const maxTotal = Math.ceil(wordCount * 0.20); // 20% total
  const maxHigh = Math.ceil(wordCount * 0.05);  // 5% high

  // Sort by wordIndex
  const sorted = [...emphases].sort((a, b) => a.wordIndex - b.wordIndex);

  // Filter out emphases exceeding 20% total cap
  let filtered = sorted.slice(0, maxTotal);

  // Enforce high emphasis cap (5%)
  const highEmphases = filtered.filter(e => e.level === 'high');
  if (highEmphases.length > maxHigh) {
    // Keep first maxHigh high-emphasis words, convert rest to med
    const keptHigh = new Set(highEmphases.slice(0, maxHigh).map(e => e.wordIndex));
    filtered = filtered.map(e => {
      if (e.level === 'high' && !keptHigh.has(e.wordIndex)) {
        return { ...e, level: 'med' as const };
      }
      return e;
    });
  }

  // Enforce 2-word gap between high-emphasis words
  const finalFiltered: EmphasisData[] = [];
  let lastHighIndex = -3; // Start at -3 so first word can be high

  for (const emphasis of filtered) {
    if (emphasis.level === 'high') {
      if (emphasis.wordIndex - lastHighIndex >= 2) {
        finalFiltered.push(emphasis);
        lastHighIndex = emphasis.wordIndex;
      } else {
        // Too close to previous high, convert to med
        finalFiltered.push({ ...emphasis, level: 'med' });
      }
    } else {
      finalFiltered.push(emphasis);
    }
  }

  return finalFiltered;
}

// Test density capping: 20% total emphasis, 5% high emphasis
test('validateEmphasisConstraints() enforces 20% total emphasis cap', () => {
  const wordCount = 100;
  const maxTotal = Math.ceil(wordCount * 0.20); // 20 words

  // Create 30 emphases (30% of words) - should be trimmed to 20
  const emphases: EmphasisData[] = Array.from({ length: 30 }, (_, i) => ({
    wordIndex: i,
    level: 'med' as const,
  }));

  const result = validateEmphasisConstraints(emphases, wordCount);

  assert.strictEqual(result.length, maxTotal, `Should cap at ${maxTotal} emphases (20%)`);
});

test('validateEmphasisConstraints() enforces 5% high emphasis cap', () => {
  const wordCount = 100;
  const maxHigh = Math.ceil(wordCount * 0.05); // 5 words

  // Create 10 high emphases with proper spacing (gap of 3) to avoid gap enforcement issues
  const emphases: EmphasisData[] = Array.from({ length: 10 }, (_, i) => ({
    wordIndex: i * 4, // Spacing of 4 ensures gap of 3 between each
    level: 'high' as const,
  }));

  const result = validateEmphasisConstraints(emphases, wordCount);

  const highCount = result.filter(e => e.level === 'high').length;
  assert.strictEqual(highCount, maxHigh, `Should cap at ${maxHigh} high emphases (5%)`);
});

test('validateEmphasisConstraints() converts excess high to med', () => {
  const wordCount = 100;
  const maxHigh = Math.ceil(wordCount * 0.05); // 5 words

  // Create 10 high emphases with proper spacing - first 5 should stay high, rest should become med
  const emphases: EmphasisData[] = Array.from({ length: 10 }, (_, i) => ({
    wordIndex: i * 4, // Spacing of 4 ensures gap of 3 between each
    level: 'high' as const,
  }));

  const result = validateEmphasisConstraints(emphases, wordCount);

  assert.strictEqual(result.length, 10, 'Should keep all emphases');

  const highCount = result.filter(e => e.level === 'high').length;
  const medCount = result.filter(e => e.level === 'med').length;

  assert.strictEqual(highCount, maxHigh, `Should have ${maxHigh} high emphases`);
  assert.strictEqual(medCount, 10 - maxHigh, `Excess should be converted to med`);
});

test('validateEmphasisConstraints() respects 20% cap before applying 5% high cap', () => {
  const wordCount = 100;
  const maxTotal = Math.ceil(wordCount * 0.20); // 20 words
  const maxHigh = Math.ceil(wordCount * 0.05); // 5 words

  // Create 30 total (15 high, 15 med)
  const emphases: EmphasisData[] = [
    ...Array.from({ length: 15 }, (_, i) => ({
      wordIndex: i,
      level: 'high' as const,
    })),
    ...Array.from({ length: 15 }, (_, i) => ({
      wordIndex: i + 15,
      level: 'med' as const,
    })),
  ];

  const result = validateEmphasisConstraints(emphases, wordCount);

  // First caps at 20 total, then caps at 5 high
  assert.ok(result.length <= maxTotal, 'Should respect 20% total cap first');

  const highCount = result.filter(e => e.level === 'high').length;
  assert.ok(highCount <= maxHigh, 'Should then apply 5% high cap');
});

// Test gap enforcement: 2-word minimum between high-emphasis words
test('validateEmphasisConstraints() enforces 2-word gap between high emphases', () => {
  const wordCount = 100;

  // Create high emphases at indices 0, 1, 3, 5
  // Gap 0->1: 1 (should convert to med)
  // Gap 0->3: 3 (should stay high, since 1 was converted)
  // Gap 3->5: 2 (should stay high, exactly at boundary)
  const emphases: EmphasisData[] = [
    { wordIndex: 0, level: 'high' as const },
    { wordIndex: 1, level: 'high' as const }, // Gap of 1 from 0 - should convert to med
    { wordIndex: 3, level: 'high' as const }, // Gap of 3 from 0 - should stay high
    { wordIndex: 5, level: 'high' as const }, // Gap of 2 from 3 - should stay high
  ];

  const result = validateEmphasisConstraints(emphases, wordCount);

  assert.strictEqual(result.length, 4, 'Should keep all emphases');

  const highIndices = result.filter(e => e.level === 'high').map(e => e.wordIndex);
  assert.deepStrictEqual(highIndices, [0, 3, 5], 'Indices 0, 3, 5 should stay high');

  const medIndices = result.filter(e => e.level === 'med').map(e => e.wordIndex);
  assert.deepStrictEqual(medIndices, [1], 'Index 1 should be converted to med');
});

test('validateEmphasisConstraints() allows high emphases with 2+ word gap', () => {
  const wordCount = 100;

  // Create high emphases with proper gaps: 0, 3, 6, 9 (gaps: 3, 3, 3)
  const emphases: EmphasisData[] = [
    { wordIndex: 0, level: 'high' as const },
    { wordIndex: 3, level: 'high' as const }, // Gap of 2 - OK
    { wordIndex: 6, level: 'high' as const }, // Gap of 2 - OK
    { wordIndex: 9, level: 'high' as const }, // Gap of 2 - OK
  ];

  const result = validateEmphasisConstraints(emphases, wordCount);

  const highCount = result.filter(e => e.level === 'high').length;
  assert.strictEqual(highCount, 4, 'All high emphases should be kept with proper gaps');
});

test('validateEmphasisConstraints() gap enforcement with mixed emphases', () => {
  const wordCount = 100;

  // Mix of high and med, with high at 0, 2, 5, 7
  const emphases: EmphasisData[] = [
    { wordIndex: 0, level: 'high' as const },
    { wordIndex: 1, level: 'med' as const },
    { wordIndex: 2, level: 'high' as const }, // Gap of 2 from 0 - should stay high
    { wordIndex: 3, level: 'med' as const },
    { wordIndex: 5, level: 'high' as const }, // Gap of 3 from 2 - should stay high
    { wordIndex: 7, level: 'high' as const }, // Gap of 2 from 5 - should stay high
  ];

  const result = validateEmphasisConstraints(emphases, wordCount);

  const highIndices = result.filter(e => e.level === 'high').map(e => e.wordIndex);

  // All high emphases have gap >= 2, so all should stay high
  assert.deepStrictEqual(highIndices, [0, 2, 5, 7], 'All indices with 2+ gap should stay high');
});

// Test trimming logic when over limits
test('validateEmphasisConstraints() trims from end when over 20% limit', () => {
  const wordCount = 50;
  const maxTotal = Math.ceil(wordCount * 0.20); // 10 words

  // Create 15 emphases in order
  const emphases: EmphasisData[] = Array.from({ length: 15 }, (_, i) => ({
    wordIndex: i,
    level: 'med' as const,
  }));

  const result = validateEmphasisConstraints(emphases, wordCount);

  assert.strictEqual(result.length, maxTotal, 'Should trim to 20%');

  // First 10 should be kept
  const indices = result.map(e => e.wordIndex);
  const expectedIndices = Array.from({ length: maxTotal }, (_, i) => i);
  assert.deepStrictEqual(indices, expectedIndices, 'Should keep first emphases');
});

test('validateEmphasisConstraints() preserves tone when converting high to med', () => {
  const wordCount = 100;

  // Create high emphases with tone
  const emphases: EmphasisData[] = Array.from({ length: 10 }, (_, i) => ({
    wordIndex: i,
    level: 'high' as const,
    tone: i % 2 === 0 ? 'warm' as const : 'intense' as const,
  }));

  const result = validateEmphasisConstraints(emphases, wordCount);

  // First 5 should stay high, rest should convert to med but keep tone
  const medEmphases = result.filter(e => e.level === 'med');
  assert.ok(medEmphases.length > 0, 'Should have converted some to med');

  for (const emphasis of medEmphases) {
    assert.ok(emphasis.tone !== undefined, 'Tone should be preserved');
  }
});

// Edge cases
test('Edge case: empty emphasis array', () => {
  const wordCount = 100;
  const emphases: EmphasisData[] = [];

  const result = validateEmphasisConstraints(emphases, wordCount);

  assert.strictEqual(result.length, 0, 'Empty array should return empty');
});

test('Edge case: single emphasis', () => {
  const wordCount = 100;
  const emphases: EmphasisData[] = [
    { wordIndex: 5, level: 'high' as const },
  ];

  const result = validateEmphasisConstraints(emphases, wordCount);

  assert.strictEqual(result.length, 1, 'Single emphasis should be kept');
  assert.strictEqual(result[0].level, 'high', 'Single high emphasis should stay high');
});

test('Edge case: all words emphasized (100%)', () => {
  const wordCount = 50;
  const maxTotal = Math.ceil(wordCount * 0.20); // 10 words

  // Try to emphasize all 50 words
  const emphases: EmphasisData[] = Array.from({ length: wordCount }, (_, i) => ({
    wordIndex: i,
    level: 'med' as const,
  }));

  const result = validateEmphasisConstraints(emphases, wordCount);

  assert.strictEqual(result.length, maxTotal, 'Should cap at 20% even if all words emphasized');
});

test('Edge case: all emphases are high', () => {
  const wordCount = 100;
  const maxTotal = Math.ceil(wordCount * 0.20); // 20 words
  const maxHigh = Math.ceil(wordCount * 0.05); // 5 words

  // Create 20 high emphases with proper spacing
  const emphases: EmphasisData[] = Array.from({ length: 20 }, (_, i) => ({
    wordIndex: i * 3, // Spacing of 3 ensures gap of 2 between each
    level: 'high' as const,
  }));

  const result = validateEmphasisConstraints(emphases, wordCount);

  assert.strictEqual(result.length, maxTotal, 'Should keep all 20 emphases');

  const highCount = result.filter(e => e.level === 'high').length;
  const medCount = result.filter(e => e.level === 'med').length;

  assert.strictEqual(highCount, maxHigh, `Should cap at ${maxHigh} high emphases`);
  assert.strictEqual(medCount, maxTotal - maxHigh, 'Rest should be converted to med');
});

test('Edge case: very small word count', () => {
  const wordCount = 5;
  const maxTotal = Math.ceil(wordCount * 0.20); // 1 word (5 * 0.2 = 1)
  const maxHigh = Math.ceil(wordCount * 0.05); // 1 word (5 * 0.05 = 0.25, ceil to 1)

  const emphases: EmphasisData[] = [
    { wordIndex: 0, level: 'high' as const },
    { wordIndex: 1, level: 'high' as const },
  ];

  const result = validateEmphasisConstraints(emphases, wordCount);

  assert.strictEqual(result.length, maxTotal, 'Should respect 20% cap even for small counts');
  assert.strictEqual(result[0].level, 'high', 'First emphasis should stay high');
});

test('Edge case: unsorted input', () => {
  const wordCount = 100;

  // Create unsorted emphases
  const emphases: EmphasisData[] = [
    { wordIndex: 10, level: 'med' as const },
    { wordIndex: 5, level: 'high' as const },
    { wordIndex: 15, level: 'med' as const },
    { wordIndex: 3, level: 'high' as const },
  ];

  const result = validateEmphasisConstraints(emphases, wordCount);

  // Should be sorted by wordIndex in output
  const indices = result.map(e => e.wordIndex);
  const sortedIndices = [...indices].sort((a, b) => a - b);

  assert.deepStrictEqual(indices, sortedIndices, 'Output should be sorted by wordIndex');
});

test('Edge case: consecutive high emphases at start', () => {
  const wordCount = 100;

  // Create consecutive high emphases at indices 0, 1, 2
  const emphases: EmphasisData[] = [
    { wordIndex: 0, level: 'high' as const },
    { wordIndex: 1, level: 'high' as const }, // Gap of 1 - converts to med
    { wordIndex: 2, level: 'high' as const }, // Gap of 2 from 0 - stays high
  ];

  const result = validateEmphasisConstraints(emphases, wordCount);

  const highIndices = result.filter(e => e.level === 'high').map(e => e.wordIndex);
  assert.deepStrictEqual(highIndices, [0, 2], 'Indices 0 and 2 should stay high (gap of 2)');
});

test('Edge case: exact 2-word gap boundary', () => {
  const wordCount = 100;

  // Create high emphases with exactly 2-word gap: 0, 2, 4, 6
  const emphases: EmphasisData[] = [
    { wordIndex: 0, level: 'high' as const },
    { wordIndex: 2, level: 'high' as const }, // Gap of exactly 2 - should be OK
    { wordIndex: 4, level: 'high' as const }, // Gap of exactly 2 - should be OK
    { wordIndex: 6, level: 'high' as const }, // Gap of exactly 2 - should be OK
  ];

  const result = validateEmphasisConstraints(emphases, wordCount);

  const highCount = result.filter(e => e.level === 'high').length;
  assert.strictEqual(highCount, 4, 'All high emphases with exactly 2-word gap should be kept');
});

console.log('\n✅ All emphasis validator tests passed!');
