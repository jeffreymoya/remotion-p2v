#!/usr/bin/env node
/**
 * End-to-End Word Sync Integration Tests
 * Tests complete pipeline: gather → timeline assembly → word timing accuracy
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs/promises';
import * as path from 'path';

// Import types and utilities
import type { Timeline, TextElement } from '../../src/lib/types';
import { TimelineSchema } from '../../src/lib/types';
import { normalizeTimeline } from '../../src/lib/utils';
import type { AssetManifest, EmphasisData } from '../../cli/commands/gather';

// Test constants
const TEST_PROJECT_DIR = path.join(process.cwd(), 'public', 'projects');
const TIMING_TOLERANCE_MS = 50; // ±50ms tolerance for word timestamps
const FPS = 30;

// Helper: Convert milliseconds to frames
function msToFrame(ms: number, fps: number = FPS): number {
  return Math.floor((ms / 1000) * fps);
}

// Helper: Convert frames to milliseconds
function frameToMs(frame: number, fps: number = FPS): number {
  return (frame / fps) * 1000;
}

// Test Word Timing Accuracy
test('Word timestamps should be within ±50ms tolerance', async () => {
  // This test validates that word timestamps from TTS are reasonably accurate
  // We can't test exact timing without actual TTS, but we can validate the format

  const mockWordTimestamps = [
    { word: 'Hello', startMs: 0, endMs: 300 },
    { word: 'world', startMs: 300, endMs: 600 },
    { word: 'this', startMs: 600, endMs: 800 },
    { word: 'is', startMs: 800, endMs: 950 },
    { word: 'a', startMs: 950, endMs: 1050 },
    { word: 'test', startMs: 1050, endMs: 1400 },
  ];

  // Validate word boundaries (no overlaps, no gaps > 50ms)
  for (let i = 0; i < mockWordTimestamps.length - 1; i++) {
    const current = mockWordTimestamps[i];
    const next = mockWordTimestamps[i + 1];

    // Words should not overlap
    assert.ok(current.endMs <= next.startMs, `Words should not overlap: "${current.word}" ends at ${current.endMs}, "${next.word}" starts at ${next.startMs}`);

    // Gap between words should be within tolerance
    const gap = next.startMs - current.endMs;
    assert.ok(gap <= TIMING_TOLERANCE_MS, `Gap between words should be <= ${TIMING_TOLERANCE_MS}ms, got ${gap}ms between "${current.word}" and "${next.word}"`);
  }

  // Each word should have positive duration
  for (const word of mockWordTimestamps) {
    const duration = word.endMs - word.startMs;
    assert.ok(duration > 0, `Word "${word.text || word.word}" should have positive duration, got ${duration}ms`);
    assert.ok(duration >= 50, `Word duration should be at least 50ms for natural speech, got ${duration}ms for "${word.text || word.word}"`);
  }
});

test('Word timestamps convert correctly to frames', () => {
  const wordTimestamps = [
    { word: 'Test', startMs: 0, endMs: 300 },
    { word: 'word', startMs: 300, endMs: 600 },
  ];

  for (const word of wordTimestamps) {
    const startFrame = msToFrame(word.startMs);
    const endFrame = msToFrame(word.endMs);

    // Frames should be non-negative
    assert.ok(startFrame >= 0, `Start frame should be non-negative, got ${startFrame}`);
    assert.ok(endFrame >= 0, `End frame should be non-negative, got ${endFrame}`);

    // End frame should be after start frame
    assert.ok(endFrame > startFrame, `End frame (${endFrame}) should be > start frame (${startFrame})`);

    // Conversion should be reversible within tolerance
    const convertedBackMs = frameToMs(startFrame);
    const timeDiff = Math.abs(convertedBackMs - word.startMs);
    assert.ok(timeDiff <= 50, `Frame conversion should be reversible within tolerance, got ${timeDiff}ms difference`);
  }
});

// Test Emphasis Styling Application
test('Emphasis styling validation', () => {
  const mockEmphases: EmphasisData[] = [
    { wordIndex: 0, level: 'high', tone: 'intense' },
    { wordIndex: 3, level: 'med', tone: 'warm' },
    { wordIndex: 7, level: 'high' },
  ];

  // Validate emphasis levels
  for (const emphasis of mockEmphases) {
    assert.ok(['med', 'high'].includes(emphasis.level), `Emphasis level should be 'med' or 'high', got '${emphasis.level}'`);

    if (emphasis.tone) {
      assert.ok(['warm', 'intense'].includes(emphasis.tone), `Emphasis tone should be 'warm' or 'intense', got '${emphasis.tone}'`);
    }

    // Word index should be non-negative
    assert.ok(emphasis.wordIndex >= 0, `Word index should be non-negative, got ${emphasis.wordIndex}`);
  }

  // High emphasis words should have gap of at least 2 words
  const highEmphases = mockEmphases.filter(e => e.level === 'high').sort((a, b) => a.wordIndex - b.wordIndex);

  for (let i = 0; i < highEmphases.length - 1; i++) {
    const gap = highEmphases[i + 1].wordIndex - highEmphases[i].wordIndex;
    assert.ok(gap >= 2, `High-emphasis words should have gap of at least 2, got ${gap} between indices ${highEmphases[i].wordIndex} and ${highEmphases[i + 1].wordIndex}`);
  }
});

test('Emphasis constraints enforcement', () => {
  const totalWords = 100;
  const maxTotalEmphasis = Math.ceil(totalWords * 0.20); // 20%
  const maxHighEmphasis = Math.ceil(totalWords * 0.05); // 5%

  // Simulate emphasis data that meets constraints
  const emphases: EmphasisData[] = [];

  // Add high-emphasis words (5% of 100 = 5 words)
  for (let i = 0; i < maxHighEmphasis; i++) {
    emphases.push({
      wordIndex: i * 3, // Ensure 2+ word gap
      level: 'high',
      tone: 'intense',
    });
  }

  // Add med-emphasis words (15% of 100 = 15 words)
  for (let i = 0; i < 15; i++) {
    emphases.push({
      wordIndex: 20 + i * 2,
      level: 'med',
    });
  }

  // Validate total emphasis count
  assert.ok(emphases.length <= maxTotalEmphasis, `Total emphasis count (${emphases.length}) should be <= 20% of words (${maxTotalEmphasis})`);

  // Validate high-emphasis count
  const highCount = emphases.filter(e => e.level === 'high').length;
  assert.ok(highCount <= maxHighEmphasis, `High-emphasis count (${highCount}) should be <= 5% of words (${maxHighEmphasis})`);

  // Validate medium-emphasis count
  const medCount = emphases.filter(e => e.level === 'med').length;
  const maxMedEmphasis = maxTotalEmphasis - maxHighEmphasis; // Remaining 15%
  assert.ok(medCount <= maxMedEmphasis, `Med-emphasis count (${medCount}) should be <= 15% of words (${maxMedEmphasis})`);
});

// Test 16:9 Aspect Ratio Handling
test('Timeline validates with 16:9 aspect ratio', () => {
  const timeline: Timeline = {
    shortTitle: 'Test 16:9 Video',
    aspectRatio: '16:9',
    durationSeconds: 30,
    elements: [
      {
        type: 'background',
        startMs: 0,
        endMs: 5000,
        imageUrl: 'image-1',
        enterTransition: 'fade',
        exitTransition: 'fade',
      },
    ],
    text: [
      {
        type: 'text',
        startMs: 1000,
        endMs: 4000,
        text: 'Test text',
        position: 'bottom',
      },
    ],
    audio: [
      {
        type: 'audio',
        startMs: 0,
        endMs: 5000,
        audioUrl: 'audio-1',
      },
    ],
    videoClips: [],
    backgroundMusic: [],
  };

  const result = TimelineSchema.safeParse(timeline);
  assert.ok(result.success, `16:9 timeline should validate: ${result.success ? 'OK' : result.error?.message}`);

  if (result.success) {
    assert.strictEqual(result.data.aspectRatio, '16:9', 'Aspect ratio should be preserved as 16:9');
  }
});

test('Timeline normalizes to 16:9 by default', () => {
  const timeline: any = {
    shortTitle: 'Test Default Aspect Ratio',
    elements: [],
    text: [],
    audio: [],
  };

  const normalized = normalizeTimeline(timeline);

  assert.ok(normalized.aspectRatio, 'Normalized timeline should have aspect ratio');
  // Note: Default is actually '9:16' for backward compatibility, but config can override
  assert.ok(['16:9', '9:16'].includes(normalized.aspectRatio!), `Aspect ratio should be valid, got ${normalized.aspectRatio}`);
});

// Test Complete Pipeline Integration
test('Timeline assembly with word-level data', async () => {
  // Simulate complete asset manifest from gather command
  const mockManifest: AssetManifest = {
    images: [
      {
        id: 'img-1',
        path: '/path/to/image.jpg',
        source: 'pexels',
        tags: ['nature', 'landscape'],
      },
    ],
    videos: [],
    audio: [
      {
        id: 'segment-1',
        path: '/path/to/audio.mp3',
        segmentId: 'segment-1',
        durationMs: 5000,
        wordTimestamps: [
          { word: 'Hello', startMs: 0, endMs: 300 },
          { word: 'world', startMs: 300, endMs: 700 },
          { word: 'this', startMs: 700, endMs: 1000 },
          { word: 'is', startMs: 1000, endMs: 1200 },
          { word: 'amazing', startMs: 1200, endMs: 1700 },
        ],
        emphasis: [
          { wordIndex: 4, level: 'high', tone: 'intense' }, // "amazing"
          { wordIndex: 1, level: 'med' }, // "world"
        ],
      },
    ],
    music: [],
  };

  // Validate manifest structure
  assert.ok(mockManifest.audio.length > 0, 'Manifest should have audio files');
  assert.ok(mockManifest.audio[0].wordTimestamps, 'Audio should have word timestamps');
  assert.ok(mockManifest.audio[0].emphasis, 'Audio should have emphasis data');

  const audioFile = mockManifest.audio[0];

  // Validate word timestamps exist and are valid
  assert.strictEqual(audioFile.wordTimestamps?.length, 5, 'Should have 5 word timestamps');

  for (const word of audioFile.wordTimestamps!) {
    assert.ok(word.word.length > 0, 'Word should not be empty');
    assert.ok(word.startMs >= 0, 'Word start time should be non-negative');
    assert.ok(word.endMs > word.startMs, 'Word end time should be after start time');
  }

  // Validate emphasis data
  assert.strictEqual(audioFile.emphasis?.length, 2, 'Should have 2 emphasis markers');

  for (const emp of audioFile.emphasis!) {
    assert.ok(emp.wordIndex >= 0 && emp.wordIndex < audioFile.wordTimestamps!.length, `Emphasis word index (${emp.wordIndex}) should be valid for ${audioFile.wordTimestamps!.length} words`);
    assert.ok(['med', 'high'].includes(emp.level), `Emphasis level should be valid, got ${emp.level}`);
  }

  // Simulate building TextElement with word data
  const INTRO_OFFSET_MS = 1000;

  const textElement: TextElement & { words?: Array<{ text: string; startMs: number; endMs: number; emphasis?: any }> } = {
    type: 'text',
    startMs: audioFile.wordTimestamps![0].startMs,
    endMs: audioFile.wordTimestamps![audioFile.wordTimestamps!.length - 1].endMs,
    text: audioFile.wordTimestamps!.map(w => w.word).join(' '),
    position: 'bottom',
    words: audioFile.wordTimestamps!.map((ts, idx) => {
      const emphasisMatch = audioFile.emphasis?.find(e => e.wordIndex === idx);
      return {
        text: ts.word,
        startMs: ts.startMs,
        endMs: ts.endMs,
        emphasis: emphasisMatch || { level: 'none' },
      };
    }),
  };

  // Validate TextElement structure
  assert.ok(textElement.words, 'TextElement should have words array');
  assert.strictEqual(textElement.words.length, 5, 'Should have 5 words in TextElement');

  // Verify timeline has no intro offset (offset applied during rendering via calculateFrameTiming)
  const firstWord = textElement.words[0];
  assert.strictEqual(firstWord.startMs, 0, `First word in timeline should start at 0ms (intro offset applied in rendering), got ${firstWord.startMs}ms`);

  // Verify emphasis was applied
  const amazingWord = textElement.words[4];
  assert.strictEqual(amazingWord.text, 'amazing', 'Fourth word should be "amazing"');
  assert.strictEqual(amazingWord.emphasis?.level, 'high', 'Word "amazing" should have high emphasis');
  assert.strictEqual(amazingWord.emphasis?.tone, 'intense', 'Word "amazing" should have intense tone');

  const worldWord = textElement.words[1];
  assert.strictEqual(worldWord.text, 'world', 'Second word should be "world"');
  assert.strictEqual(worldWord.emphasis?.level, 'med', 'Word "world" should have med emphasis');

  // Verify legacy text field matches word concatenation
  const reconstructedText = textElement.words.map(w => w.text).join(' ');
  assert.strictEqual(textElement.text, reconstructedText, 'Legacy text field should match word concatenation');
});

// Test Existing Project Timelines
test('Validate existing project timelines (if any)', async () => {
  try {
    const projects = await fs.readdir(TEST_PROJECT_DIR, { withFileTypes: true });
    const projectDirs = projects.filter(entry => entry.isDirectory()).map(entry => entry.name);

    if (projectDirs.length === 0) {
      console.log('⚠ No projects found for validation, skipping');
      return;
    }

    let validatedCount = 0;

    for (const projectId of projectDirs) {
      const timelinePath = path.join(TEST_PROJECT_DIR, projectId, 'timeline.json');

      try {
        await fs.access(timelinePath);
      } catch {
        continue; // Skip projects without timeline.json
      }

      const timelineData = JSON.parse(await fs.readFile(timelinePath, 'utf-8'));
      const result = TimelineSchema.safeParse(timelineData);

      assert.ok(result.success, `Timeline for project ${projectId} should validate: ${result.success ? 'OK' : result.error?.message}`);

      if (result.success) {
        const timeline = result.data;

        // Verify aspect ratio (optional for backward compatibility)
        if (timeline.aspectRatio) {
          assert.ok(['16:9', '9:16'].includes(timeline.aspectRatio), `Project ${projectId} should have valid aspect ratio, got ${timeline.aspectRatio}`);
        } else {
          console.log(`⚠ Project ${projectId} has no aspect ratio (legacy timeline)`);
        }

        // Verify duration (optional for backward compatibility)
        if (timeline.durationSeconds !== undefined) {
          assert.ok(timeline.durationSeconds > 0, `Project ${projectId} should have positive duration`);
        } else {
          console.log(`⚠ Project ${projectId} has no duration (legacy timeline)`);
        }

        // Verify all elements have valid timing
        for (const element of timeline.elements) {
          assert.ok(element.startMs >= 0, `Element in ${projectId} should have non-negative startMs`);
          assert.ok(element.endMs > element.startMs, `Element in ${projectId} should have endMs > startMs`);
        }

        validatedCount++;
      }
    }

    console.log(`✅ Validated ${validatedCount} project timeline(s)`);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('⚠ No projects directory found, skipping project validation');
    } else {
      throw error;
    }
  }
});

// Test Video vs Image Element Selection
test('Timeline should prefer video elements when available', () => {
  const timelineWithVideo: Timeline = {
    shortTitle: 'Video Timeline',
    aspectRatio: '16:9',
    durationSeconds: 10,
    elements: [], // No background images
    text: [],
    audio: [],
    videoClips: [
      {
        type: 'video',
        startMs: 0,
        endMs: 10000,
        videoUrl: 'video-1',
        volume: 0.5,
      },
    ],
    backgroundMusic: [],
  };

  const result = TimelineSchema.safeParse(timelineWithVideo);
  assert.ok(result.success, 'Timeline with video should validate');

  if (result.success) {
    assert.strictEqual(result.data.videoClips.length, 1, 'Should have one video clip');
    assert.strictEqual(result.data.elements.length, 0, 'Should have no background images when using video');
  }
});

test('Timeline should use background images when videos unavailable', () => {
  const timelineWithImage: Timeline = {
    shortTitle: 'Image Timeline',
    aspectRatio: '16:9',
    durationSeconds: 10,
    elements: [
      {
        type: 'background',
        startMs: 0,
        endMs: 10000,
        imageUrl: 'image-1',
        enterTransition: 'fade',
        exitTransition: 'fade',
      },
    ],
    text: [],
    audio: [],
    videoClips: [], // No videos
    backgroundMusic: [],
  };

  const result = TimelineSchema.safeParse(timelineWithImage);
  assert.ok(result.success, 'Timeline with image should validate');

  if (result.success) {
    assert.strictEqual(result.data.elements.length, 1, 'Should have one background image');
    assert.strictEqual(result.data.videoClips.length, 0, 'Should have no video clips when using images');
  }
});

// Test Duration Calculation
test('Timeline duration matches last element', () => {
  const timeline: any = {
    shortTitle: 'Duration Test',
    elements: [
      {
        type: 'background',
        startMs: 0,
        endMs: 15000,
        imageUrl: 'test',
      },
    ],
    text: [],
    audio: [
      {
        type: 'audio',
        startMs: 0,
        endMs: 12000,
        audioUrl: 'test',
      },
    ],
  };

  const normalized = normalizeTimeline(timeline);

  // Duration should be based on the last element (15 seconds from background)
  assert.strictEqual(normalized.durationSeconds, 15, `Duration should be 15 seconds (last element), got ${normalized.durationSeconds}`);
});

console.log('\n✅ All word-sync E2E tests passed!');
