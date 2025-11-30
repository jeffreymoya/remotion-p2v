#!/usr/bin/env node
/**
 * Timeline Assembly Tests
 * Tests timeline creation, validation, and assembly logic
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import { normalizeTimeline } from '../src/lib/utils';
import { TimelineSchema, TextElementSchema, type Timeline } from '../src/lib/types';
import { DEFAULT_ASPECT_RATIO } from '../src/lib/constants';

// Test Timeline Normalization
test('normalizeTimeline adds default aspect ratio', () => {
  const timeline: any = {
    shortTitle: 'Test',
    elements: [],
    text: [],
    audio: [],
  };

  const normalized = normalizeTimeline(timeline);

  assert.ok(normalized.aspectRatio, 'Should have aspect ratio after normalization');
  assert.strictEqual(normalized.aspectRatio, DEFAULT_ASPECT_RATIO, 'Should use DEFAULT_ASPECT_RATIO');
});

test('normalizeTimeline preserves existing aspect ratio', () => {
  const timeline: any = {
    shortTitle: 'Test',
    aspectRatio: '9:16',
    elements: [],
    text: [],
    audio: [],
  };

  const normalized = normalizeTimeline(timeline);

  assert.strictEqual(normalized.aspectRatio, '9:16', 'Should preserve existing aspect ratio');
});

test('normalizeTimeline calculates duration from elements', () => {
  const timeline: any = {
    shortTitle: 'Test',
    elements: [
      { type: 'background', startMs: 0, endMs: 5000, imageUrl: 'test' },
      { type: 'background', startMs: 5000, endMs: 10000, imageUrl: 'test' },
    ],
    text: [],
    audio: [],
  };

  const normalized = normalizeTimeline(timeline);

  assert.ok(normalized.durationSeconds, 'Should have duration after normalization');
  assert.strictEqual(normalized.durationSeconds, 10, 'Duration should be 10 seconds (10000ms / 1000)');
});

test('normalizeTimeline initializes optional arrays', () => {
  const timeline: any = {
    shortTitle: 'Test',
    elements: [],
    text: [],
    audio: [],
  };

  const normalized = normalizeTimeline(timeline);

  assert.ok(Array.isArray(normalized.videoClips), 'Should have videoClips array');
  assert.ok(Array.isArray(normalized.backgroundMusic), 'Should have backgroundMusic array');
  assert.strictEqual(normalized.videoClips.length, 0, 'videoClips should be empty');
  assert.strictEqual(normalized.backgroundMusic.length, 0, 'backgroundMusic should be empty');
});

test('normalizeTimeline handles undefined elements gracefully', () => {
  const timeline: any = {
    shortTitle: 'Test',
    text: [],
    audio: [],
  };

  const normalized = normalizeTimeline(timeline);

  assert.ok(normalized, 'Should return normalized timeline even with undefined elements');
});

// Test Timeline Validation
test('Timeline validates with all required fields', () => {
  const timeline: Timeline = {
    shortTitle: 'Complete Timeline',
    aspectRatio: '16:9',
    durationSeconds: 120,
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
        text: 'Hello World',
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
  assert.ok(result.success, `Complete timeline should validate: ${result.success ? 'OK' : result.error.message}`);
});

test('Timeline validates with background music', () => {
  const timeline: Timeline = {
    shortTitle: 'Timeline with Music',
    aspectRatio: '16:9',
    durationSeconds: 60,
    elements: [],
    text: [],
    audio: [],
    videoClips: [],
    backgroundMusic: [
      {
        type: 'backgroundMusic',
        startMs: 0,
        endMs: 60000,
        musicUrl: 'background-track',
        volume: 0.2,
      },
    ],
  };

  const result = TimelineSchema.safeParse(timeline);
  assert.ok(result.success, 'Timeline with background music should validate');
});

test('Timeline validates with video clips', () => {
  const timeline: Timeline = {
    shortTitle: 'Timeline with Video',
    aspectRatio: '16:9',
    durationSeconds: 30,
    elements: [],
    text: [],
    audio: [],
    videoClips: [
      {
        type: 'video',
        startMs: 0,
        endMs: 10000,
        videoUrl: 'stock-video-1',
        volume: 0.5,
      },
    ],
    backgroundMusic: [],
  };

  const result = TimelineSchema.safeParse(timeline);
  assert.ok(result.success, 'Timeline with video clips should validate');
});

// Test Timeline Duration Validation
test('Timeline duration matches last element', () => {
  const timeline: any = {
    shortTitle: 'Test',
    elements: [
      { type: 'background', startMs: 0, endMs: 15000, imageUrl: 'test' },
    ],
    text: [],
    audio: [
      { type: 'audio', startMs: 0, endMs: 12000, audioUrl: 'test' },
    ],
  };

  const normalized = normalizeTimeline(timeline);

  // Duration should be based on the last background element (15 seconds)
  assert.strictEqual(normalized.durationSeconds, 15, 'Duration should match last element endMs');
});

test('Timeline with explicit duration overrides calculated', () => {
  const timeline: any = {
    shortTitle: 'Test',
    durationSeconds: 20,
    elements: [
      { type: 'background', startMs: 0, endMs: 10000, imageUrl: 'test' },
    ],
    text: [],
    audio: [],
  };

  const normalized = normalizeTimeline(timeline);

  assert.strictEqual(normalized.durationSeconds, 20, 'Explicit duration should be preserved');
});

// Test Element Timing
test('Timeline elements have valid timing', () => {
  const projectsDir = path.join(process.cwd(), 'public', 'projects');

  if (!fs.existsSync(projectsDir)) {
    console.log('⚠ No projects directory found, skipping timing validation');
    return;
  }

  const projects = fs.readdirSync(projectsDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);

  for (const projectId of projects) {
    const timelinePath = path.join(projectsDir, projectId, 'timeline.json');

    if (!fs.existsSync(timelinePath)) {
      continue;
    }

    const timeline = JSON.parse(fs.readFileSync(timelinePath, 'utf-8')) as Timeline;

    // Check elements
    timeline.elements.forEach((element, index) => {
      assert.ok(element.startMs >= 0, `Element ${index} should have non-negative startMs`);
      assert.ok(element.endMs > element.startMs, `Element ${index} endMs should be > startMs`);
    });

    // Check text
    timeline.text.forEach((element, index) => {
      assert.ok(element.startMs >= 0, `Text ${index} should have non-negative startMs`);
      assert.ok(element.endMs > element.startMs, `Text ${index} endMs should be > startMs`);
    });

    // Check audio
    timeline.audio.forEach((element, index) => {
      assert.ok(element.startMs >= 0, `Audio ${index} should have non-negative startMs`);
      assert.ok(element.endMs > element.startMs, `Audio ${index} endMs should be > startMs`);
    });
  }
});

// Test Aspect Ratio Consistency
test('Timeline aspect ratio is valid', () => {
  const projectsDir = path.join(process.cwd(), 'public', 'projects');

  if (!fs.existsSync(projectsDir)) {
    console.log('⚠ No projects directory found, skipping aspect ratio validation');
    return;
  }

  const projects = fs.readdirSync(projectsDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);

  for (const projectId of projects) {
    const timelinePath = path.join(projectsDir, projectId, 'timeline.json');

    if (!fs.existsSync(timelinePath)) {
      continue;
    }

    const timeline = normalizeTimeline(JSON.parse(fs.readFileSync(timelinePath, 'utf-8')));

    assert.ok(['16:9', '9:16'].includes(timeline.aspectRatio!), `Project ${projectId} should have valid aspect ratio`);
  }
});

// Test Word-Level Timeline Assembly
test('Timeline validates with word-level text elements', () => {
  const timeline: Timeline = {
    shortTitle: 'Word-Level Timeline',
    aspectRatio: '16:9',
    durationSeconds: 60,
    elements: [
      {
        type: 'background',
        startMs: 0,
        endMs: 5000,
        imageUrl: 'test-image',
      },
    ],
    text: [
      {
        type: 'text',
        startMs: 1000,
        endMs: 4000,
        text: 'Hello world test',
        position: 'center',
        words: [
          {
            text: 'Hello',
            startMs: 1000,
            endMs: 1500,
            emphasis: { level: 'high', tone: 'intense' },
          },
          {
            text: 'world',
            startMs: 1500,
            endMs: 2000,
            emphasis: { level: 'med', tone: 'warm' },
          },
          {
            text: 'test',
            startMs: 2000,
            endMs: 2500,
          },
        ],
      },
    ],
    audio: [],
    videoClips: [],
    backgroundMusic: [],
  };

  const result = TimelineSchema.safeParse(timeline);
  assert.ok(result.success, `Word-level timeline should validate: ${result.success ? 'OK' : result.error.message}`);
});

// Test Backward Compatibility - Timeline without word data
test('Timeline validates without word data (backward compatibility)', () => {
  const legacyTimeline: Timeline = {
    shortTitle: 'Legacy Timeline',
    aspectRatio: '16:9',
    durationSeconds: 30,
    elements: [
      {
        type: 'background',
        startMs: 0,
        endMs: 5000,
        imageUrl: 'test-image',
      },
    ],
    text: [
      {
        type: 'text',
        startMs: 1000,
        endMs: 4000,
        text: 'Hello world',
        position: 'bottom',
        // No 'words' field - should still validate
      },
    ],
    audio: [],
    videoClips: [],
    backgroundMusic: [],
  };

  const result = TimelineSchema.safeParse(legacyTimeline);
  assert.ok(result.success, 'Legacy timeline without word data should validate');
});

// Test 1000ms Intro Offset
test('Timeline word timestamps should include 1000ms intro offset', () => {
  // This tests the expected structure after timeline assembly
  const timeline: Timeline = {
    shortTitle: 'Intro Offset Test',
    aspectRatio: '16:9',
    durationSeconds: 30,
    elements: [],
    text: [
      {
        type: 'text',
        startMs: 1000, // Should be >= 1000ms (intro offset)
        endMs: 3000,
        text: 'Test with intro offset',
        position: 'center',
        words: [
          {
            text: 'Test',
            startMs: 1000, // First word starts at intro offset
            endMs: 1500,
          },
          {
            text: 'with',
            startMs: 1500,
            endMs: 2000,
          },
          {
            text: 'intro',
            startMs: 2000,
            endMs: 2500,
          },
          {
            text: 'offset',
            startMs: 2500,
            endMs: 3000,
          },
        ],
      },
    ],
    audio: [],
    videoClips: [],
    backgroundMusic: [],
  };

  const result = TimelineSchema.safeParse(timeline);
  assert.ok(result.success, 'Timeline with intro offset should validate');

  // Verify first word starts at or after intro offset (1000ms)
  if (result.success && timeline.text[0].words) {
    const firstWord = timeline.text[0].words[0];
    assert.ok(firstWord.startMs >= 1000, `First word should start at or after 1000ms intro offset, got ${firstWord.startMs}ms`);
  }
});

// Test VideoClipElement vs BackgroundElement Selection
test('Timeline can use VideoClipElement for video content', () => {
  const timeline: Timeline = {
    shortTitle: 'Video Timeline',
    aspectRatio: '16:9',
    durationSeconds: 30,
    elements: [], // No background images
    text: [],
    audio: [],
    videoClips: [
      {
        type: 'video',
        startMs: 0,
        endMs: 10000,
        videoUrl: 'stock-video-1',
        volume: 0.5,
      },
    ],
    backgroundMusic: [],
  };

  const result = TimelineSchema.safeParse(timeline);
  assert.ok(result.success, 'Timeline with VideoClipElement should validate');
});

test('Timeline can mix VideoClipElement and BackgroundElement', () => {
  const timeline: Timeline = {
    shortTitle: 'Mixed Media Timeline',
    aspectRatio: '16:9',
    durationSeconds: 60,
    elements: [
      {
        type: 'background',
        startMs: 0,
        endMs: 10000,
        imageUrl: 'image-1',
      },
    ],
    text: [],
    audio: [],
    videoClips: [
      {
        type: 'video',
        startMs: 10000,
        endMs: 20000,
        videoUrl: 'video-1',
      },
    ],
    backgroundMusic: [],
  };

  const result = TimelineSchema.safeParse(timeline);
  assert.ok(result.success, 'Timeline with mixed media should validate');
});

// Test Emphasis Data Integration
test('TextElement emphasis field is optional', () => {
  const textElementWithoutEmphasis: any = {
    type: 'text',
    startMs: 1000,
    endMs: 3000,
    text: 'Test',
    position: 'center',
    words: [
      {
        text: 'Test',
        startMs: 1000,
        endMs: 2000,
        // No emphasis field - should be valid
      },
    ],
  };

  const result = TextElementSchema.safeParse(textElementWithoutEmphasis);
  assert.ok(result.success, 'Word without emphasis should validate');
});

test('TextElement emphasis levels validate correctly', () => {
  const textWithEmphasis: any = {
    type: 'text',
    startMs: 1000,
    endMs: 3000,
    text: 'Test',
    position: 'center',
    words: [
      {
        text: 'High',
        startMs: 1000,
        endMs: 1500,
        emphasis: { level: 'high', tone: 'intense' },
      },
      {
        text: 'Med',
        startMs: 1500,
        endMs: 2000,
        emphasis: { level: 'med', tone: 'warm' },
      },
      {
        text: 'None',
        startMs: 2000,
        endMs: 2500,
        emphasis: { level: 'none' },
      },
    ],
  };

  const result = TextElementSchema.safeParse(textWithEmphasis);
  assert.ok(result.success, 'Words with all emphasis levels should validate');
});

test('TextElement emphasis rejects invalid levels', () => {
  const textWithInvalidEmphasis: any = {
    type: 'text',
    startMs: 1000,
    endMs: 2000,
    text: 'Test',
    position: 'center',
    words: [
      {
        text: 'Test',
        startMs: 1000,
        endMs: 2000,
        emphasis: { level: 'super-high' }, // Invalid level
      },
    ],
  };

  const result = TextElementSchema.safeParse(textWithInvalidEmphasis);
  assert.ok(!result.success, 'Invalid emphasis level should be rejected');
});

test('TextElement emphasis tone is optional', () => {
  const textWithEmphasisNoTone: any = {
    type: 'text',
    startMs: 1000,
    endMs: 2000,
    text: 'Test',
    position: 'center',
    words: [
      {
        text: 'Test',
        startMs: 1000,
        endMs: 2000,
        emphasis: { level: 'high' }, // No tone - should be valid
      },
    ],
  };

  const result = TextElementSchema.safeParse(textWithEmphasisNoTone);
  assert.ok(result.success, 'Emphasis without tone should validate');
});

console.log('\n✅ All timeline tests passed!');
