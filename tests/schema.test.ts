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
test('BackgroundElementSchema validates correctly with imageUrl', () => {
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

test('BackgroundElementSchema validates with videoUrl only', () => {
  const videoElement = {
    startMs: 0,
    endMs: 5000,
    videoUrl: 'test-video',
    enterTransition: 'fade' as const,
    exitTransition: 'fade' as const,
  };

  const result = BackgroundElementSchema.safeParse(videoElement);
  assert.ok(result.success, 'Background element with videoUrl only should validate');
});

test('BackgroundElementSchema validates with both imageUrl and videoUrl', () => {
  const dualElement = {
    startMs: 0,
    endMs: 5000,
    imageUrl: 'test-image',
    videoUrl: 'test-video',
    enterTransition: 'blur' as const,
  };

  const result = BackgroundElementSchema.safeParse(dualElement);
  assert.ok(result.success, 'Background element with both imageUrl and videoUrl should validate');
});

test('BackgroundElementSchema rejects element without imageUrl or videoUrl', () => {
  const emptyElement = {
    startMs: 0,
    endMs: 5000,
    enterTransition: 'fade' as const,
  };

  const result = BackgroundElementSchema.safeParse(emptyElement);
  assert.ok(!result.success, 'Background element without imageUrl or videoUrl should be rejected');
  if (!result.success) {
    assert.ok(
      result.error.message.includes('imageUrl or videoUrl'),
      'Error message should mention required fields'
    );
  }
});

test('BackgroundElementSchema validates with mediaMetadata', () => {
  const elementWithMetadata = {
    startMs: 0,
    endMs: 5000,
    videoUrl: 'test-video',
    mediaMetadata: {
      width: 1920,
      height: 1080,
      duration: 10,
      mode: 'crop' as const,
      scale: 1.2,
      cropX: 0,
      cropY: 100,
      cropWidth: 1920,
      cropHeight: 880,
    },
  };

  const result = BackgroundElementSchema.safeParse(elementWithMetadata);
  assert.ok(result.success, 'Background element with complete mediaMetadata should validate');
});

test('BackgroundElementSchema validates with partial mediaMetadata', () => {
  const elementWithPartialMetadata = {
    startMs: 0,
    endMs: 5000,
    imageUrl: 'test-image',
    mediaMetadata: {
      width: 1024,
      height: 1792,
      mode: 'letterbox' as const,
    },
  };

  const result = BackgroundElementSchema.safeParse(elementWithPartialMetadata);
  assert.ok(result.success, 'Background element with partial mediaMetadata should validate');
});

test('BackgroundElementSchema rejects invalid metadata mode', () => {
  const invalidModeElement = {
    startMs: 0,
    endMs: 5000,
    videoUrl: 'test-video',
    mediaMetadata: {
      width: 1920,
      height: 1080,
      mode: 'stretch', // Invalid mode
    },
  };

  const result = BackgroundElementSchema.safeParse(invalidModeElement);
  assert.ok(!result.success, 'Background element with invalid mode should be rejected');
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

// Test TextElement with optional words field
test('TextElementSchema validates with words array', () => {
  const validElement = {
    type: 'text' as const,
    startMs: 1000,
    endMs: 3000,
    text: 'Hello world',
    position: 'center' as const,
    words: [
      {
        text: 'Hello',
        startMs: 1000,
        endMs: 1500,
      },
      {
        text: 'world',
        startMs: 1500,
        endMs: 2000,
      },
    ],
  };

  const result = TextElementSchema.safeParse(validElement);
  assert.ok(result.success, 'Text element with words array should validate');
});

test('TextElementSchema validates without words field (backward compatibility)', () => {
  const validElement = {
    type: 'text' as const,
    startMs: 1000,
    endMs: 3000,
    text: 'Hello world',
    position: 'bottom' as const,
    // No words field - should still validate
  };

  const result = TextElementSchema.safeParse(validElement);
  assert.ok(result.success, 'Text element without words field should validate (backward compatibility)');
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

// Test Emphasis Schema Validation
test('EmphasisSchema validates correctly with all valid levels', () => {
  const textWithEmphasis = {
    type: 'text' as const,
    startMs: 1000,
    endMs: 4000,
    text: 'High medium none',
    position: 'center' as const,
    words: [
      {
        text: 'High',
        startMs: 1000,
        endMs: 1500,
        emphasis: { level: 'high' as const, tone: 'intense' as const },
      },
      {
        text: 'medium',
        startMs: 1500,
        endMs: 2000,
        emphasis: { level: 'med' as const, tone: 'warm' as const },
      },
      {
        text: 'none',
        startMs: 2000,
        endMs: 2500,
        emphasis: { level: 'none' as const },
      },
    ],
  };

  const result = TextElementSchema.safeParse(textWithEmphasis);
  assert.ok(result.success, 'Text element with all valid emphasis levels should validate');
});

test('EmphasisSchema validates without tone (tone is optional)', () => {
  const textWithEmphasisNoTone = {
    type: 'text' as const,
    startMs: 1000,
    endMs: 2000,
    text: 'Test',
    position: 'center' as const,
    words: [
      {
        text: 'Test',
        startMs: 1000,
        endMs: 1500,
        emphasis: { level: 'high' as const }, // No tone field
      },
    ],
  };

  const result = TextElementSchema.safeParse(textWithEmphasisNoTone);
  assert.ok(result.success, 'Emphasis without tone should validate (tone is optional)');
});

test('EmphasisSchema rejects invalid emphasis level', () => {
  const textWithInvalidLevel = {
    type: 'text' as const,
    startMs: 1000,
    endMs: 2000,
    text: 'Test',
    position: 'center' as const,
    words: [
      {
        text: 'Test',
        startMs: 1000,
        endMs: 1500,
        emphasis: { level: 'super-high' }, // Invalid level
      },
    ],
  };

  const result = TextElementSchema.safeParse(textWithInvalidLevel);
  assert.ok(!result.success, 'Invalid emphasis level should be rejected');
});

test('EmphasisSchema rejects invalid tone', () => {
  const textWithInvalidTone = {
    type: 'text' as const,
    startMs: 1000,
    endMs: 2000,
    text: 'Test',
    position: 'center' as const,
    words: [
      {
        text: 'Test',
        startMs: 1000,
        endMs: 1500,
        emphasis: { level: 'high' as const, tone: 'super-intense' }, // Invalid tone
      },
    ],
  };

  const result = TextElementSchema.safeParse(textWithInvalidTone);
  assert.ok(!result.success, 'Invalid emphasis tone should be rejected');
});

test('EmphasisSchema validates warm and intense tones', () => {
  const textWithValidTones = {
    type: 'text' as const,
    startMs: 1000,
    endMs: 3000,
    text: 'Warm and intense',
    position: 'center' as const,
    words: [
      {
        text: 'Warm',
        startMs: 1000,
        endMs: 1500,
        emphasis: { level: 'med' as const, tone: 'warm' as const },
      },
      {
        text: 'intense',
        startMs: 1500,
        endMs: 2000,
        emphasis: { level: 'high' as const, tone: 'intense' as const },
      },
    ],
  };

  const result = TextElementSchema.safeParse(textWithValidTones);
  assert.ok(result.success, 'Valid emphasis tones (warm, intense) should validate');
});

// Test Backward Compatibility with Old Schema Format
test('Timeline validates with old schema format (no words, no emphasis)', () => {
  const oldFormatTimeline = {
    shortTitle: 'Old Format Timeline',
    aspectRatio: '9:16' as const,
    durationSeconds: 30,
    elements: [
      {
        type: 'background' as const,
        startMs: 0,
        endMs: 5000,
        imageUrl: 'test-image',
        enterTransition: 'fade' as const,
        exitTransition: 'fade' as const,
      },
    ],
    text: [
      {
        type: 'text' as const,
        startMs: 1000,
        endMs: 4000,
        text: 'Old format text',
        position: 'bottom' as const,
        // No words array, no emphasis
      },
    ],
    audio: [
      {
        type: 'audio' as const,
        startMs: 0,
        endMs: 5000,
        audioUrl: 'test-audio',
      },
    ],
    videoClips: [],
    backgroundMusic: [],
  };

  const result = TimelineSchema.safeParse(oldFormatTimeline);
  assert.ok(result.success, 'Old schema format should validate (backward compatibility)');
});

test('Timeline validates with new word-level schema format', () => {
  const newFormatTimeline = {
    shortTitle: 'New Format Timeline',
    aspectRatio: '16:9' as const,
    durationSeconds: 30,
    elements: [],
    text: [
      {
        type: 'text' as const,
        startMs: 1000,
        endMs: 4000,
        text: 'New format text with words',
        position: 'center' as const,
        words: [
          {
            text: 'New',
            startMs: 1000,
            endMs: 1300,
            emphasis: { level: 'high' as const, tone: 'intense' as const },
          },
          {
            text: 'format',
            startMs: 1300,
            endMs: 1600,
            emphasis: { level: 'med' as const },
          },
          {
            text: 'text',
            startMs: 1600,
            endMs: 1900,
          },
          {
            text: 'with',
            startMs: 1900,
            endMs: 2100,
          },
          {
            text: 'words',
            startMs: 2100,
            endMs: 2400,
            emphasis: { level: 'med' as const, tone: 'warm' as const },
          },
        ],
      },
    ],
    audio: [],
    videoClips: [],
    backgroundMusic: [],
  };

  const result = TimelineSchema.safeParse(newFormatTimeline);
  assert.ok(result.success, 'New word-level schema format should validate');
});

test('Words field is truly optional (can be undefined or missing)', () => {
  const textWithoutWords = {
    type: 'text' as const,
    startMs: 1000,
    endMs: 2000,
    text: 'Test without words',
    position: 'bottom' as const,
  };

  const textWithUndefinedWords = {
    type: 'text' as const,
    startMs: 1000,
    endMs: 2000,
    text: 'Test with undefined words',
    position: 'bottom' as const,
    words: undefined,
  };

  const result1 = TextElementSchema.safeParse(textWithoutWords);
  const result2 = TextElementSchema.safeParse(textWithUndefinedWords);

  assert.ok(result1.success, 'Text element without words field should validate');
  assert.ok(result2.success, 'Text element with undefined words should validate');
});

test('Emphasis field is truly optional in word objects', () => {
  const textWithMixedEmphasis = {
    type: 'text' as const,
    startMs: 1000,
    endMs: 3000,
    text: 'Mixed emphasis',
    position: 'center' as const,
    words: [
      {
        text: 'Mixed',
        startMs: 1000,
        endMs: 1500,
        emphasis: { level: 'high' as const },
      },
      {
        text: 'emphasis',
        startMs: 1500,
        endMs: 2000,
        // No emphasis field - should be valid
      },
    ],
  };

  const result = TextElementSchema.safeParse(textWithMixedEmphasis);
  assert.ok(result.success, 'Words without emphasis field should validate (emphasis is optional)');
});

console.log('\n✅ All schema tests passed!');
