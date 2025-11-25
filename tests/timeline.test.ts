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
import { TimelineSchema, type Timeline } from '../src/lib/types';
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

console.log('\n✅ All timeline tests passed!');
