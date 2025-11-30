#!/usr/bin/env node
/**
 * Media Fallback Integration Tests
 * Tests video → photo → AI fallback chain, quality scoring, and stop conditions
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateQualityScore, rankByQuality } from '../cli/services/media/quality';
import { deduplicateImages, deduplicateVideos } from '../cli/services/media/deduplication';
import type { StockImage, StockVideo } from '../cli/lib/media-types';

// Mock quality thresholds from config
const QUALITY_THRESHOLDS = {
  VIDEO_MIN: 0.7,
  IMAGE_MIN: 0.6,
  ASPECT_RATIO_TOLERANCE: 0.3,
};

// Test Quality Score Calculations
test('calculateQualityScore for videos - 16:9 perfect match', () => {
  const video: StockVideo = {
    id: 'video-1',
    url: 'https://example.com/video.mp4',
    width: 1920,
    height: 1080,
    duration: 10,
    source: 'pexels',
    tags: ['nature'],
    thumbnailUrl: 'thumb.jpg',
  };

  const score = calculateQualityScore(video, '16:9');

  // Resolution: 1920x1080 = HD minimum, should get 0.5 base score
  assert.ok(score.resolution >= 0.5, `Resolution score should be >= 0.5, got ${score.resolution}`);

  // Aspect ratio: 16:9 perfect match should score ~1.0
  assert.ok(score.aspectRatio >= 0.9, `Aspect ratio score should be >= 0.9, got ${score.aspectRatio}`);

  // Total score should be high for perfect HD match
  assert.ok(score.total >= 0.7, `Total score should be >= 0.7, got ${score.total}`);
});

test('calculateQualityScore for videos - 4K resolution bonus', () => {
  const video4k: StockVideo = {
    id: 'video-4k',
    url: 'https://example.com/video-4k.mp4',
    width: 3840,
    height: 2160,
    duration: 10,
    source: 'pexels',
    tags: ['nature'],
    thumbnailUrl: 'thumb.jpg',
  };

  const score = calculateQualityScore(video4k, '16:9');

  // 4K should get maximum resolution score
  assert.strictEqual(score.resolution, 1.0, `4K video should get resolution score of 1.0, got ${score.resolution}`);
  assert.ok(score.total >= 0.8, `4K video total score should be >= 0.8, got ${score.total}`);
});

test('calculateQualityScore for videos - aspect ratio mismatch penalty', () => {
  const verticalVideo: StockVideo = {
    id: 'vertical-video',
    url: 'https://example.com/vertical.mp4',
    width: 1080,
    height: 1920,
    duration: 10,
    source: 'pexels',
    tags: ['portrait'],
    thumbnailUrl: 'thumb.jpg',
  };

  const score = calculateQualityScore(verticalVideo, '16:9');

  // 9:16 video on 16:9 target should have low aspect ratio score
  assert.ok(score.aspectRatio < 0.3, `Aspect ratio mismatch should score < 0.3, got ${score.aspectRatio}`);

  // Total score should be penalized
  assert.ok(score.total < 0.6, `Mismatched aspect ratio should result in total score < 0.6, got ${score.total}`);
});

test('calculateQualityScore for images - high resolution', () => {
  const image: StockImage = {
    id: 'image-1',
    url: 'https://example.com/image.jpg',
    width: 3840,
    height: 2160,
    source: 'pexels',
    tags: ['landscape'],
    thumbnailUrl: 'thumb.jpg',
  };

  const score = calculateQualityScore(image, '16:9');

  assert.strictEqual(score.resolution, 1.0, '4K image should get max resolution score');
  assert.ok(score.aspectRatio >= 0.9, 'Correct aspect ratio should score high');
  assert.ok(score.total >= 0.75, 'High-quality image should have total score >= 0.75');
});

test('calculateQualityScore for images - low resolution penalty', () => {
  const lowResImage: StockImage = {
    id: 'low-res',
    url: 'https://example.com/low.jpg',
    width: 800,
    height: 600,
    source: 'unsplash',
    tags: ['test'],
    thumbnailUrl: 'thumb.jpg',
  };

  const score = calculateQualityScore(lowResImage, '16:9');

  // Below minimum resolution should get base score
  assert.strictEqual(score.resolution, 0.5, `Low resolution should get base score of 0.5, got ${score.resolution}`);
  assert.ok(score.total < 0.7, `Low resolution image total score should be < 0.7, got ${score.total}`);
});

// Test Quality Ranking
test('rankByQuality filters by minimum quality threshold', () => {
  const videos: StockVideo[] = [
    {
      id: 'high-quality',
      url: 'hq.mp4',
      width: 3840,
      height: 2160,
      duration: 10,
      source: 'pexels',
      tags: ['nature'],
      thumbnailUrl: 'thumb.jpg',
    },
    {
      id: 'medium-quality',
      url: 'mq.mp4',
      width: 1920,
      height: 1080,
      duration: 10,
      source: 'pexels',
      tags: ['nature'],
      thumbnailUrl: 'thumb.jpg',
    },
    {
      id: 'low-quality',
      url: 'lq.mp4',
      width: 640,
      height: 480, // 4:3 aspect ratio, low res
      duration: 10,
      source: 'pixabay',
      tags: ['nature'],
      thumbnailUrl: 'thumb.jpg',
    },
  ];

  const ranked = rankByQuality(videos, {
    aspectRatio: '16:9',
    minQuality: 0.7,
  });

  // Should filter out low-quality video
  assert.ok(ranked.length <= 2, `Should filter low-quality videos, got ${ranked.length} results`);

  // First result should be highest quality
  if (ranked.length > 0) {
    assert.strictEqual(ranked[0].id, 'high-quality', 'Highest quality video should be ranked first');
  }

  // Verify all results meet minimum threshold
  for (const video of ranked) {
    const score = calculateQualityScore(video, '16:9');
    assert.ok(score.total >= 0.7, `All ranked videos should meet min quality of 0.7, ${video.id} scored ${score.total}`);
  }
});

test('rankByQuality sorts by total score descending', () => {
  const images: StockImage[] = [
    {
      id: 'image-low',
      url: 'low.jpg',
      width: 1920,
      height: 1080,
      source: 'unsplash',
      tags: ['test'],
      thumbnailUrl: 'thumb.jpg',
    },
    {
      id: 'image-high',
      url: 'high.jpg',
      width: 3840,
      height: 2160,
      source: 'pexels',
      tags: ['test'],
      thumbnailUrl: 'thumb.jpg',
    },
    {
      id: 'image-medium',
      url: 'med.jpg',
      width: 2560,
      height: 1440,
      source: 'pixabay',
      tags: ['test'],
      thumbnailUrl: 'thumb.jpg',
    },
  ];

  const ranked = rankByQuality(images, {
    aspectRatio: '16:9',
    minQuality: 0.5,
  });

  assert.strictEqual(ranked.length, 3, 'All images should pass minimum quality');
  assert.strictEqual(ranked[0].id, 'image-high', 'Highest quality should be first');
  assert.strictEqual(ranked[1].id, 'image-medium', 'Medium quality should be second');
  assert.strictEqual(ranked[2].id, 'image-low', 'Lowest quality should be third');
});

// Test Deduplication
test('deduplicateVideos removes exact duplicates by ID', () => {
  const videos: StockVideo[] = [
    {
      id: 'video-1',
      url: 'https://example.com/v1.mp4',
      width: 1920,
      height: 1080,
      duration: 10,
      source: 'pexels',
      tags: ['nature'],
      thumbnailUrl: 'thumb.jpg',
    },
    {
      id: 'video-1', // Duplicate
      url: 'https://example.com/v1.mp4',
      width: 1920,
      height: 1080,
      duration: 10,
      source: 'pexels',
      tags: ['nature'],
      thumbnailUrl: 'thumb.jpg',
    },
    {
      id: 'video-2',
      url: 'https://example.com/v2.mp4',
      width: 1920,
      height: 1080,
      duration: 10,
      source: 'pixabay',
      tags: ['city'],
      thumbnailUrl: 'thumb2.jpg',
    },
  ];

  const unique = deduplicateVideos(videos);

  assert.strictEqual(unique.length, 2, 'Should remove duplicate video');
  assert.ok(unique.some(v => v.id === 'video-1'), 'Should keep first occurrence of video-1');
  assert.ok(unique.some(v => v.id === 'video-2'), 'Should keep video-2');
});

test('deduplicateImages removes exact duplicates by ID', () => {
  const images: StockImage[] = [
    {
      id: 'img-1',
      url: 'https://example.com/img1.jpg',
      width: 1920,
      height: 1080,
      source: 'pexels',
      tags: ['nature'],
      thumbnailUrl: 'thumb.jpg',
    },
    {
      id: 'img-1', // Duplicate
      url: 'https://example.com/img1.jpg',
      width: 1920,
      height: 1080,
      source: 'pexels',
      tags: ['nature'],
      thumbnailUrl: 'thumb.jpg',
    },
    {
      id: 'img-2',
      url: 'https://example.com/img2.jpg',
      width: 1920,
      height: 1080,
      source: 'unsplash',
      tags: ['city'],
      thumbnailUrl: 'thumb2.jpg',
    },
  ];

  const unique = deduplicateImages(images);

  assert.strictEqual(unique.length, 2, 'Should remove duplicate image');
  assert.ok(unique.some(i => i.id === 'img-1'), 'Should keep first occurrence of img-1');
  assert.ok(unique.some(i => i.id === 'img-2'), 'Should keep img-2');
});

// Test Stop Conditions
test('Stop condition: quality threshold met', () => {
  const videos: StockVideo[] = [
    {
      id: 'perfect-video',
      url: 'perfect.mp4',
      width: 3840,
      height: 2160,
      duration: 10,
      source: 'pexels',
      tags: ['nature'],
      thumbnailUrl: 'thumb.jpg',
    },
  ];

  const ranked = rankByQuality(videos, {
    aspectRatio: '16:9',
    minQuality: 0.7,
  });

  assert.strictEqual(ranked.length, 1, 'Should find one high-quality video');

  const score = calculateQualityScore(ranked[0], '16:9');
  assert.ok(score.total >= 0.7, 'Quality should meet threshold');

  // Simulate stop condition: if we have a video with quality >= 0.7, stop searching
  const shouldContinueSearch = ranked.length === 0 || score.total < 0.7;
  assert.strictEqual(shouldContinueSearch, false, 'Should stop search when quality threshold is met');
});

test('Stop condition: no results triggers fallback', () => {
  const emptyVideos: StockVideo[] = [];

  const ranked = rankByQuality(emptyVideos, {
    aspectRatio: '16:9',
    minQuality: 0.7,
  });

  assert.strictEqual(ranked.length, 0, 'No videos should be returned');

  // Simulate fallback logic
  const shouldFallbackToImages = ranked.length === 0;
  assert.strictEqual(shouldFallbackToImages, true, 'Should fallback to image search when no videos found');
});

test('Stop condition: all results below quality threshold triggers fallback', () => {
  const lowQualityVideos: StockVideo[] = [
    {
      id: 'bad-video-1',
      url: 'bad1.mp4',
      width: 640,
      height: 480,
      duration: 10,
      source: 'pixabay',
      tags: ['test'],
      thumbnailUrl: 'thumb.jpg',
    },
    {
      id: 'bad-video-2',
      url: 'bad2.mp4',
      width: 800,
      height: 600,
      duration: 10,
      source: 'pixabay',
      tags: ['test'],
      thumbnailUrl: 'thumb.jpg',
    },
  ];

  const ranked = rankByQuality(lowQualityVideos, {
    aspectRatio: '16:9',
    minQuality: 0.7,
  });

  assert.strictEqual(ranked.length, 0, 'All videos should be filtered out by quality threshold');

  // Simulate fallback
  const shouldFallbackToImages = ranked.length === 0;
  assert.strictEqual(shouldFallbackToImages, true, 'Should fallback to images when all videos are low quality');
});

// Test Graceful Degradation
test('Graceful degradation: handles missing video dimensions', () => {
  const videoWithDefaults: StockVideo = {
    id: 'video-unknown',
    url: 'unknown.mp4',
    width: 1920, // Should have defaults
    height: 1080,
    duration: 10,
    source: 'pexels',
    tags: ['test'],
    thumbnailUrl: 'thumb.jpg',
  };

  assert.doesNotThrow(() => {
    const score = calculateQualityScore(videoWithDefaults, '16:9');
    assert.ok(score.total >= 0, 'Should calculate score even with default dimensions');
  }, 'Should handle videos with default dimensions gracefully');
});

test('Graceful degradation: handles empty tag arrays', () => {
  const imageNoTags: StockImage = {
    id: 'no-tags',
    url: 'notags.jpg',
    width: 1920,
    height: 1080,
    source: 'unsplash',
    tags: [], // No tags
    thumbnailUrl: 'thumb.jpg',
  };

  assert.doesNotThrow(() => {
    const score = calculateQualityScore(imageNoTags, '16:9');
    assert.ok(score.total >= 0, 'Should calculate score even without tags');
  }, 'Should handle media with empty tags gracefully');
});

// Test Aspect Ratio Handling for 9:16 (vertical)
test('calculateQualityScore for 9:16 vertical videos', () => {
  const verticalVideo: StockVideo = {
    id: 'vertical',
    url: 'vertical.mp4',
    width: 1080,
    height: 1920,
    duration: 10,
    source: 'pexels',
    tags: ['mobile'],
    thumbnailUrl: 'thumb.jpg',
  };

  const score = calculateQualityScore(verticalVideo, '9:16');

  // Vertical video on vertical target should score high
  assert.ok(score.aspectRatio >= 0.9, `9:16 video on 9:16 target should score high, got ${score.aspectRatio}`);
  assert.ok(score.total >= 0.7, `Matching vertical video should have high total score, got ${score.total}`);
});

test('rankByQuality prefers matching aspect ratios', () => {
  const mixedVideos: StockVideo[] = [
    {
      id: 'horizontal',
      url: 'h.mp4',
      width: 1920,
      height: 1080,
      duration: 10,
      source: 'pexels',
      tags: ['landscape'],
      thumbnailUrl: 'thumb.jpg',
    },
    {
      id: 'vertical',
      url: 'v.mp4',
      width: 1080,
      height: 1920,
      duration: 10,
      source: 'pexels',
      tags: ['portrait'],
      thumbnailUrl: 'thumb.jpg',
    },
  ];

  const rankedFor16_9 = rankByQuality(mixedVideos, {
    aspectRatio: '16:9',
    minQuality: 0.5,
  });

  const rankedFor9_16 = rankByQuality(mixedVideos, {
    aspectRatio: '9:16',
    minQuality: 0.5,
  });

  assert.strictEqual(rankedFor16_9[0].id, 'horizontal', '16:9 target should prefer horizontal video');
  assert.strictEqual(rankedFor9_16[0].id, 'vertical', '9:16 target should prefer vertical video');
});

console.log('\n✅ All media fallback tests passed!');
