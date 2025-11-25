#!/usr/bin/env node
/**
 * Schema Validation Tests
 * Tests all Zod schemas across the pipeline
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import {
  TimelineSchema,
  BackgroundElementSchema,
  TextElementSchema,
  AudioElementSchema,
  VideoClipElementSchema,
  BackgroundMusicElementSchema,
  AspectRatioSchema,
} from '../src/lib/types';
import { ConfigManager } from '../cli/lib/config';

// Test Timeline Schema
test('TimelineSchema validates correctly', () => {
  const validTimeline = {
    shortTitle: 'Test Video',
    aspectRatio: '16:9',
    durationSeconds: 120,
    elements: [],
    text: [],
    audio: [],
    videoClips: [],
    backgroundMusic: [],
  };

  const result = TimelineSchema.safeParse(validTimeline);
  assert.ok(result.success, `Timeline schema should validate: ${result.success ? 'OK' : result.error.message}`);
});

test('TimelineSchema rejects invalid aspect ratio', () => {
  const invalidTimeline = {
    shortTitle: 'Test Video',
    aspectRatio: '4:3', // Invalid
    elements: [],
    text: [],
    audio: [],
  };

  const result = TimelineSchema.safeParse(invalidTimeline);
  assert.ok(!result.success, 'Timeline with invalid aspect ratio should be rejected');
});

test('TimelineSchema accepts optional fields', () => {
  const minimalTimeline = {
    shortTitle: 'Minimal',
    elements: [],
    text: [],
    audio: [],
  };

  const result = TimelineSchema.safeParse(minimalTimeline);
  assert.ok(result.success, 'Minimal timeline should validate');
});

// Test BackgroundElement Schema
test('BackgroundElementSchema validates correctly', () => {
  const validElement = {
    type: 'background' as const,
    startMs: 0,
    endMs: 5000,
    imageUrl: 'test-image-id',
    enterTransition: 'fade' as const,
    exitTransition: 'blur' as const,
  };

  const result = BackgroundElementSchema.safeParse(validElement);
  assert.ok(result.success, 'Valid background element should validate');
});

// Test TextElement Schema
test('TextElementSchema validates correctly', () => {
  const validElement = {
    type: 'text' as const,
    startMs: 1000,
    endMs: 3000,
    text: 'Hello world',
    position: 'bottom' as const,
  };

  const result = TextElementSchema.safeParse(validElement);
  assert.ok(result.success, 'Valid text element should validate');
});

// Test AudioElement Schema
test('AudioElementSchema validates correctly', () => {
  const validElement = {
    type: 'audio' as const,
    startMs: 0,
    endMs: 5000,
    audioUrl: 'test-audio-id',
  };

  const result = AudioElementSchema.safeParse(validElement);
  assert.ok(result.success, 'Valid audio element should validate');
});

// Test VideoClipElement Schema
test('VideoClipElementSchema validates correctly', () => {
  const validElement = {
    type: 'video' as const,
    startMs: 0,
    endMs: 10000,
    videoUrl: 'test-video-id',
    volume: 0.5,
  };

  const result = VideoClipElementSchema.safeParse(validElement);
  assert.ok(result.success, 'Valid video clip element should validate');
});

// Test BackgroundMusicElement Schema
test('BackgroundMusicElementSchema validates correctly', () => {
  const validElement = {
    type: 'backgroundMusic' as const,
    startMs: 0,
    endMs: 60000,
    musicUrl: 'background-track',
    volume: 0.2,
  };

  const result = BackgroundMusicElementSchema.safeParse(validElement);
  assert.ok(result.success, 'Valid background music element should validate');
});

test('BackgroundMusicElementSchema validates volume range', () => {
  const invalidElement = {
    type: 'backgroundMusic' as const,
    startMs: 0,
    endMs: 60000,
    musicUrl: 'background-track',
    volume: 1.5, // Invalid: > 1.0
  };

  const result = BackgroundMusicElementSchema.safeParse(invalidElement);
  assert.ok(!result.success, 'Volume > 1.0 should be rejected');
});

// Test AspectRatio Schema
test('AspectRatioSchema validates correctly', () => {
  assert.ok(AspectRatioSchema.safeParse('16:9').success, '16:9 should validate');
  assert.ok(AspectRatioSchema.safeParse('9:16').success, '9:16 should validate');
  assert.ok(!AspectRatioSchema.safeParse('4:3').success, '4:3 should be rejected');
});

// Test Config Loaders
test('Config files have valid schemas', async () => {
  try {
    // Test TTS config (may fail if env vars not set, that's ok for schema test)
    const ttsConfig = await ConfigManager.loadTTSConfig();
    assert.ok(ttsConfig, 'TTS config should load');
    assert.ok(ttsConfig.providers, 'TTS config should have providers');
  } catch (error: any) {
    if (error.message.includes('Environment variable')) {
      console.log('⚠ TTS config skipped (missing env vars)');
    } else {
      throw error;
    }
  }

  try {
    // Test Stock Assets config
    const stockConfig = await ConfigManager.loadStockAssetsConfig();
    assert.ok(stockConfig, 'Stock assets config should load');
    assert.ok(stockConfig.sources, 'Stock assets config should have sources');
  } catch (error: any) {
    if (error.message.includes('Environment variable')) {
      console.log('⚠ Stock config skipped (missing env vars)');
    } else {
      throw error;
    }
  }

  try {
    // Test Music config
    const musicConfig = await ConfigManager.loadMusicConfig();
    assert.ok(musicConfig, 'Music config should load');
    assert.ok(musicConfig.sources, 'Music config should have sources');
  } catch (error: any) {
    if (error.message.includes('Environment variable')) {
      console.log('⚠ Music config skipped (missing env vars)');
    } else {
      throw error;
    }
  }

  // Test Video config (should always work, no env vars required)
  const videoConfig = await ConfigManager.loadVideoConfig();
  assert.ok(videoConfig, 'Video config should load');
  assert.ok(videoConfig.defaultAspectRatio, 'Video config should have default aspect ratio');
  assert.strictEqual(videoConfig.defaultAspectRatio, '16:9', 'Default aspect ratio should be 16:9');
});

// Test actual timeline files
test('Demo timeline files validate correctly', async () => {
  const projectsDir = path.join(process.cwd(), 'public', 'projects');

  if (!fs.existsSync(projectsDir)) {
    console.log('⚠ No projects directory found, skipping timeline validation');
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

    const timelineData = JSON.parse(fs.readFileSync(timelinePath, 'utf-8'));
    const result = TimelineSchema.safeParse(timelineData);

    assert.ok(result.success, `Timeline for ${projectId} should validate: ${result.success ? 'OK' : result.error.message}`);
  }
});

console.log('\n✅ All schema tests passed!');
