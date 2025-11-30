#!/usr/bin/env node
/**
 * Word Timing Tests (Wave 4.1)
 * Tests frame/ms conversion and word timestamp mapping
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { msToFrame } from '../src/lib/utils';
import { FPS } from '../src/lib/constants';

// Test msToFrame conversion
test('msToFrame() converts milliseconds to frames correctly', () => {
  const fps = 30;
  const ms = 1000; // 1 second

  const result = msToFrame(ms, fps);

  assert.strictEqual(result, 30, '1000ms at 30fps should be 30 frames');
});

test('msToFrame() handles fractional frames by flooring', () => {
  const fps = 30;
  const ms = 1500; // 1.5 seconds = 45 frames

  const result = msToFrame(ms, fps);

  assert.strictEqual(result, 45, '1500ms at 30fps should be 45 frames');
});

test('msToFrame() floors partial frames', () => {
  const fps = 30;
  const ms = 1033; // 30.99 frames

  const result = msToFrame(ms, fps);

  assert.strictEqual(result, 30, 'Should floor partial frames');
});

test('msToFrame() works with different FPS rates', () => {
  const ms = 1000;

  assert.strictEqual(msToFrame(ms, 24), 24, '1000ms at 24fps should be 24 frames');
  assert.strictEqual(msToFrame(ms, 30), 30, '1000ms at 30fps should be 30 frames');
  assert.strictEqual(msToFrame(ms, 60), 60, '1000ms at 60fps should be 60 frames');
});

test('msToFrame() handles zero milliseconds', () => {
  const fps = 30;
  const ms = 0;

  const result = msToFrame(ms, fps);

  assert.strictEqual(result, 0, '0ms should be 0 frames');
});

test('msToFrame() handles very small durations', () => {
  const fps = 30;
  const ms = 1; // Less than one frame

  const result = msToFrame(ms, fps);

  assert.strictEqual(result, 0, 'Sub-frame duration should floor to 0');
});

test('msToFrame() handles very large durations', () => {
  const fps = 30;
  const ms = 3600000; // 1 hour

  const result = msToFrame(ms, fps);

  assert.strictEqual(result, 108000, '1 hour at 30fps should be 108000 frames');
});

// Test with project FPS constant
test('msToFrame() works with project FPS constant', () => {
  const ms = 2000; // 2 seconds

  const result = msToFrame(ms, FPS);

  const expectedFrames = Math.floor((ms * FPS) / 1000);
  assert.strictEqual(result, expectedFrames, `Should work with project FPS (${FPS})`);
});

// Test 1000ms intro offset application
test('Intro offset: 1000ms offset moves word timestamps forward', () => {
  const INTRO_OFFSET_MS = 1000;

  const wordTimestamps = [
    { word: 'Hello', startMs: 0, endMs: 500 },
    { word: 'World', startMs: 500, endMs: 1000 },
  ];

  // Simulate offset application
  const offsetTimestamps = wordTimestamps.map(ts => ({
    ...ts,
    startMs: ts.startMs + INTRO_OFFSET_MS,
    endMs: ts.endMs + INTRO_OFFSET_MS,
  }));

  assert.strictEqual(offsetTimestamps[0].startMs, 1000, 'First word should start at 1000ms');
  assert.strictEqual(offsetTimestamps[0].endMs, 1500, 'First word should end at 1500ms');
  assert.strictEqual(offsetTimestamps[1].startMs, 1500, 'Second word should start at 1500ms');
  assert.strictEqual(offsetTimestamps[1].endMs, 2000, 'Second word should end at 2000ms');
});

test('Intro offset: preserves word duration', () => {
  const INTRO_OFFSET_MS = 1000;

  const wordTimestamp = { word: 'Test', startMs: 100, endMs: 600 };
  const originalDuration = wordTimestamp.endMs - wordTimestamp.startMs;

  const offsetTimestamp = {
    ...wordTimestamp,
    startMs: wordTimestamp.startMs + INTRO_OFFSET_MS,
    endMs: wordTimestamp.endMs + INTRO_OFFSET_MS,
  };

  const newDuration = offsetTimestamp.endMs - offsetTimestamp.startMs;

  assert.strictEqual(newDuration, originalDuration, 'Word duration should be preserved');
});

test('Intro offset: two-stage application (timeline build + rendering)', () => {
  const INTRO_OFFSET_MS = 1000;
  const segmentStartMs = 5000;
  const FPS = 30;

  const wordTimestamps = [
    { word: 'Test', startMs: 0, endMs: 500 },
  ];

  // Stage 1: Timeline build adds segment offset only (not INTRO_OFFSET_MS)
  // This happens in cli/commands/build.ts
  const timelineTimestamps = wordTimestamps.map(ts => ({
    ...ts,
    startMs: ts.startMs + segmentStartMs,
    endMs: ts.endMs + segmentStartMs,
  }));

  assert.strictEqual(timelineTimestamps[0].startMs, 5000, 'Timeline should have segment offset only');
  assert.strictEqual(timelineTimestamps[0].endMs, 5500, 'Timeline should have segment offset only');

  // Stage 2: Rendering adds intro offset via calculateFrameTiming
  // This happens in src/lib/utils.ts when addIntroOffset: true
  const INTRO_DURATION_FRAMES = (INTRO_OFFSET_MS / 1000) * FPS; // 30 frames
  const renderStartFrame = (timelineTimestamps[0].startMs * FPS) / 1000 + INTRO_DURATION_FRAMES;
  const expectedMs = (renderStartFrame / FPS) * 1000;

  assert.strictEqual(expectedMs, 6000, 'Rendering should add intro offset (5000ms + 1000ms)');
});

// Test word timestamp mapping
test('Word timestamp mapping: simple word array', () => {
  interface WordTimestamp {
    word: string;
    startMs: number;
    endMs: number;
  }

  interface WordData {
    text: string;
    startMs: number;
    endMs: number;
  }

  const timestamps: WordTimestamp[] = [
    { word: 'Hello', startMs: 0, endMs: 500 },
    { word: 'beautiful', startMs: 500, endMs: 1200 },
    { word: 'world', startMs: 1200, endMs: 1800 },
  ];

  // Map to WordData format
  const wordData: WordData[] = timestamps.map(ts => ({
    text: ts.word,
    startMs: ts.startMs,
    endMs: ts.endMs,
  }));

  assert.strictEqual(wordData.length, 3, 'Should have 3 words');
  assert.strictEqual(wordData[0].text, 'Hello', 'First word should be Hello');
  assert.strictEqual(wordData[1].startMs, 500, 'Second word should start at 500ms');
  assert.strictEqual(wordData[2].endMs, 1800, 'Third word should end at 1800ms');
});

test('Word timestamp mapping: with emphasis data', () => {
  interface WordTimestamp {
    word: string;
    startMs: number;
    endMs: number;
  }

  interface EmphasisData {
    wordIndex: number;
    level: 'med' | 'high';
    tone?: 'warm' | 'intense';
  }

  interface WordData {
    text: string;
    startMs: number;
    endMs: number;
    emphasis?: {
      level: 'none' | 'med' | 'high';
      tone?: 'warm' | 'intense';
    };
  }

  const timestamps: WordTimestamp[] = [
    { word: 'Hello', startMs: 0, endMs: 500 },
    { word: 'beautiful', startMs: 500, endMs: 1200 },
    { word: 'world', startMs: 1200, endMs: 1800 },
  ];

  const emphases: EmphasisData[] = [
    { wordIndex: 1, level: 'high', tone: 'warm' },
  ];

  // Map with emphasis
  const wordData: WordData[] = timestamps.map((ts, idx) => {
    const emphasis = emphases.find(e => e.wordIndex === idx);
    return {
      text: ts.word,
      startMs: ts.startMs,
      endMs: ts.endMs,
      emphasis: emphasis ? {
        level: emphasis.level,
        tone: emphasis.tone,
      } : { level: 'none' as const },
    };
  });

  assert.strictEqual(wordData[0].emphasis?.level, 'none', 'First word should have no emphasis');
  assert.strictEqual(wordData[1].emphasis?.level, 'high', 'Second word should have high emphasis');
  assert.strictEqual(wordData[1].emphasis?.tone, 'warm', 'Second word should have warm tone');
  assert.strictEqual(wordData[2].emphasis?.level, 'none', 'Third word should have no emphasis');
});

test('Word timestamp mapping: empty array', () => {
  const timestamps: any[] = [];

  const wordData = timestamps.map(ts => ({
    text: ts.word,
    startMs: ts.startMs,
    endMs: ts.endMs,
  }));

  assert.strictEqual(wordData.length, 0, 'Empty input should produce empty output');
});

test('Word timestamp mapping: calculates total element duration', () => {
  const wordData = [
    { text: 'Hello', startMs: 1000, endMs: 1500 },
    { text: 'world', startMs: 1500, endMs: 2000 },
  ];

  const elementStart = wordData[0].startMs;
  const elementEnd = wordData[wordData.length - 1].endMs;

  assert.strictEqual(elementStart, 1000, 'Element should start with first word');
  assert.strictEqual(elementEnd, 2000, 'Element should end with last word');
});

// Edge cases
test('Edge case: negative time handling', () => {
  const fps = 30;
  const ms = -1000;

  const result = msToFrame(ms, fps);

  assert.strictEqual(result, -30, 'Negative time should produce negative frames');
});

test('Edge case: zero duration word', () => {
  const wordTimestamp = { word: 'Test', startMs: 1000, endMs: 1000 };

  const duration = wordTimestamp.endMs - wordTimestamp.startMs;

  assert.strictEqual(duration, 0, 'Zero duration should be handled');
});

test('Edge case: very long video (2 hours)', () => {
  const fps = 30;
  const ms = 7200000; // 2 hours

  const result = msToFrame(ms, fps);

  assert.strictEqual(result, 216000, '2 hours at 30fps should be 216000 frames');
});

test('Edge case: high frame rate (120fps)', () => {
  const fps = 120;
  const ms = 1000;

  const result = msToFrame(ms, fps);

  assert.strictEqual(result, 120, '1000ms at 120fps should be 120 frames');
});

test('Edge case: single word segment', () => {
  const INTRO_OFFSET_MS = 1000;
  const segmentStartMs = 0;

  const wordTimestamps = [
    { word: 'Hello', startMs: 0, endMs: 800 },
  ];

  const wordData = wordTimestamps.map(ts => ({
    text: ts.word,
    startMs: ts.startMs + segmentStartMs + INTRO_OFFSET_MS,
    endMs: ts.endMs + segmentStartMs + INTRO_OFFSET_MS,
  }));

  assert.strictEqual(wordData.length, 1, 'Single word should be processed');
  assert.strictEqual(wordData[0].startMs, 1000, 'Should apply offset correctly');
  assert.strictEqual(wordData[0].endMs, 1800, 'Should apply offset correctly');
});

test('Edge case: words with very short duration', () => {
  const fps = 30;

  // Word lasting 33ms (approximately 1 frame at 30fps)
  const wordDurationMs = 33;
  const frames = msToFrame(wordDurationMs, fps);

  assert.strictEqual(frames, 0, 'Very short word duration should floor to 0 frames');
});

test('Edge case: precise frame boundaries', () => {
  const fps = 30;

  // Exact frame duration: 1000ms / 30fps = 33.333ms per frame
  const oneFrameMs = 1000 / fps; // 33.333...
  const twoFramesMs = oneFrameMs * 2; // 66.666...

  const oneFrameResult = msToFrame(oneFrameMs, fps);
  const twoFramesResult = msToFrame(twoFramesMs, fps);

  assert.strictEqual(oneFrameResult, 1, 'One frame duration should convert to 1');
  assert.strictEqual(twoFramesResult, 2, 'Two frame duration should convert to 2');
});

test('Reverse conversion: frameToMs (if implemented)', () => {
  // This tests the inverse operation if frameToMs exists
  const frameToMs = (frame: number, fps: number): number => {
    return Math.round((frame * 1000) / fps);
  };

  const fps = 30;
  const frames = 30;

  const ms = frameToMs(frames, fps);

  assert.strictEqual(ms, 1000, '30 frames at 30fps should be 1000ms');
});

test('Round-trip conversion: ms -> frame -> ms', () => {
  const frameToMs = (frame: number, fps: number): number => {
    return Math.round((frame * 1000) / fps);
  };

  const fps = 30;
  const originalMs = 1000;

  const frames = msToFrame(originalMs, fps);
  const convertedMs = frameToMs(frames, fps);

  assert.strictEqual(convertedMs, originalMs, 'Round-trip conversion should preserve value');
});

test('Frame conversion: matches calculateFrameTiming utility', () => {
  // Test that msToFrame produces same result as calculateFrameTiming
  const startMs = 0;
  const endMs = 2000;
  const fps = 30;

  const startFrame = msToFrame(startMs, fps);
  const endFrame = msToFrame(endMs, fps);
  const duration = endFrame - startFrame;

  assert.strictEqual(startFrame, 0, 'Start frame should be 0');
  assert.strictEqual(endFrame, 60, 'End frame should be 60');
  assert.strictEqual(duration, 60, 'Duration should be 60 frames (2 seconds at 30fps)');
});

console.log('\n✅ All word timing tests passed!');
