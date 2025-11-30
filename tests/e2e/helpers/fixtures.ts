/**
 * Test Fixtures for E2E Tests
 *
 * Standard mock data for predictable testing scenarios
 * All fixtures pass schema validation and represent realistic data
 */

import type { Timeline, TextElement, BackgroundElement, AudioElement } from '../../../src/lib/types';
import type { AssetTag, EmphasisData, AssetManifest } from '../../../cli/commands/gather';

// ============================================================================
// STAGE 1: DISCOVER - Trending Topics
// ============================================================================

export const mockDiscoveredTopics = {
  topics: [
    {
      title: 'The Future of Artificial Intelligence',
      description: 'Exploring the latest developments in AI and machine learning',
      trendScore: 95,
      keywords: ['AI', 'machine learning', 'technology', 'future'],
      category: 'Technology',
    },
    {
      title: 'Sustainable Energy Revolution',
      description: 'How renewable energy is transforming our world',
      trendScore: 88,
      keywords: ['renewable energy', 'solar', 'wind', 'sustainability'],
      category: 'Environment',
    },
    {
      title: 'Space Exploration Milestones',
      description: 'Recent achievements in space travel and discovery',
      trendScore: 82,
      keywords: ['space', 'NASA', 'Mars', 'exploration'],
      category: 'Science',
    },
    {
      title: 'The Evolution of Remote Work',
      description: 'How work culture has changed in the digital age',
      trendScore: 76,
      keywords: ['remote work', 'digital nomad', 'productivity', 'work-life balance'],
      category: 'Business',
    },
    {
      title: 'Breakthrough Medical Innovations',
      description: 'Revolutionary advances in healthcare and medicine',
      trendScore: 71,
      keywords: ['healthcare', 'medicine', 'innovation', 'biotech'],
      category: 'Health',
    },
  ],
  discoveredAt: '2025-11-29T10:00:00.000Z',
};

// ============================================================================
// STAGE 2: CURATE - Selected Topic
// ============================================================================

export const mockSelectedTopic = {
  selectedTopic: mockDiscoveredTopics.topics[0],
  selectedAt: '2025-11-29T10:05:00.000Z',
};

// ============================================================================
// STAGE 3: REFINE - Enhanced Topic
// ============================================================================

export const mockRefinedTopic = {
  topic: 'The Future of Artificial Intelligence',
  description:
    'Artificial Intelligence is revolutionizing every aspect of our lives. From healthcare to transportation, AI systems are becoming more sophisticated and capable. This exploration delves into the latest breakthroughs in machine learning, neural networks, and how AI is shaping our future.',
  targetAudience: 'Tech enthusiasts, students, and professionals interested in AI and emerging technologies',
  keyPoints: [
    'Recent breakthroughs in large language models and generative AI',
    'Practical applications of AI in healthcare, education, and business',
    'Ethical considerations and responsible AI development',
    'The future landscape of human-AI collaboration',
  ],
  estimatedDuration: 720,
  visualStyle: 'Modern, tech-focused with dynamic imagery',
  refinedAt: '2025-11-29T10:10:00.000Z',
};

// ============================================================================
// STAGE 4: SCRIPT - Generated Script
// ============================================================================

export const mockScript = {
  segments: [
    {
      id: 'seg-1',
      narrative:
        'Artificial intelligence has evolved from science fiction to everyday reality. Today, AI systems power our smartphones, assist doctors in diagnosing diseases, and even help create art. But what does the future hold for this transformative technology?',
      estimatedDuration: 150,
      visualHints: ['AI technology', 'futuristic interface', 'neural network', 'innovation'],
    },
    {
      id: 'seg-2',
      narrative:
        'Recent breakthroughs in large language models have demonstrated capabilities we once thought impossible. These systems can write code, compose music, and engage in complex reasoning. The pace of innovation is accelerating, with new models pushing boundaries every month.',
      estimatedDuration: 160,
      visualHints: ['language models', 'coding', 'music composition', 'data processing'],
    },
    {
      id: 'seg-3',
      narrative:
        'Healthcare is being revolutionized by AI. Machine learning algorithms can detect diseases earlier than human doctors, predict patient outcomes, and even discover new drugs. AI-powered diagnostic tools are making healthcare more accessible and accurate worldwide.',
      estimatedDuration: 155,
      visualHints: ['medical AI', 'healthcare technology', 'diagnosis', 'hospital'],
    },
    {
      id: 'seg-4',
      narrative:
        'But with great power comes great responsibility. As AI systems become more capable, questions of ethics, bias, and accountability become critical. How do we ensure AI benefits all of humanity? How do we prevent misuse? These are the challenges we must address.',
      estimatedDuration: 145,
      visualHints: ['ethics', 'responsibility', 'balance', 'human collaboration'],
    },
    {
      id: 'seg-5',
      narrative:
        'The future of AI is not about replacing humans, but augmenting our capabilities. By combining human creativity with machine intelligence, we can solve problems once thought unsolvable. The AI revolution is just beginning, and its potential is limitless.',
      estimatedDuration: 140,
      visualHints: ['collaboration', 'future technology', 'innovation', 'human-AI partnership'],
    },
  ],
  generatedAt: '2025-11-29T10:15:00.000Z',
};

// ============================================================================
// STAGE 5: GATHER - Tags and Manifest
// ============================================================================

export const mockTags: AssetTag[] = [
  { tag: 'AI technology', segmentId: 'seg-1', confidence: 0.95 },
  { tag: 'futuristic interface', segmentId: 'seg-1', confidence: 0.88 },
  { tag: 'neural network', segmentId: 'seg-1', confidence: 0.92 },
  { tag: 'language models', segmentId: 'seg-2', confidence: 0.9 },
  { tag: 'coding', segmentId: 'seg-2', confidence: 0.85 },
  { tag: 'medical AI', segmentId: 'seg-3', confidence: 0.93 },
  { tag: 'healthcare technology', segmentId: 'seg-3', confidence: 0.89 },
  { tag: 'ethics', segmentId: 'seg-4', confidence: 0.87 },
  { tag: 'collaboration', segmentId: 'seg-5', confidence: 0.91 },
  { tag: 'future technology', segmentId: 'seg-5', confidence: 0.94 },
];

export const mockManifest: AssetManifest = {
  images: [
    {
      id: 'img-1',
      path: 'assets/images/ai-technology-1.jpg',
      source: 'pexels',
      tags: ['AI technology', 'futuristic interface'],
      metadata: { width: 1920, height: 1080, qualityScore: 0.85 },
    },
    {
      id: 'img-2',
      path: 'assets/images/neural-network-2.jpg',
      source: 'pixabay',
      tags: ['neural network'],
      metadata: { width: 1920, height: 1080, qualityScore: 0.78 },
    },
  ],
  videos: [
    {
      id: 'vid-1',
      path: 'assets/videos/ai-tech-1.mp4',
      source: 'pexels',
      tags: ['AI technology', 'innovation'],
      width: 1920,
      height: 1080,
      duration: 12.5,
      metadata: { qualityScore: 0.92, fps: 30 },
    },
    {
      id: 'vid-2',
      path: 'assets/videos/healthcare-ai-2.mp4',
      source: 'pexels',
      tags: ['medical AI', 'healthcare technology'],
      width: 1920,
      height: 1080,
      duration: 15.2,
      metadata: { qualityScore: 0.88, fps: 30 },
    },
  ],
  audio: [
    {
      id: 'audio-seg-1',
      path: 'assets/audio/segment-1.mp3',
      segmentId: 'seg-1',
      durationMs: 25000,
      wordTimestamps: mockWordTimestamps,
      emphasis: mockEmphasisData,
    },
    {
      id: 'audio-seg-2',
      path: 'assets/audio/segment-2.mp3',
      segmentId: 'seg-2',
      durationMs: 27000,
      wordTimestamps: [],
      emphasis: [],
    },
  ],
  music: [
    {
      id: 'music-1',
      path: 'assets/music/background-music.mp3',
      source: 'incompetech',
      genre: 'ambient',
    },
  ],
};

// ============================================================================
// WORD TIMESTAMPS - Realistic TTS Output
// ============================================================================

export const mockWordTimestamps = [
  { word: 'Artificial', startMs: 0, endMs: 320 },
  { word: 'intelligence', startMs: 320, endMs: 720 },
  { word: 'has', startMs: 720, endMs: 850 },
  { word: 'evolved', startMs: 850, endMs: 1180 },
  { word: 'from', startMs: 1180, endMs: 1350 },
  { word: 'science', startMs: 1350, endMs: 1650 },
  { word: 'fiction', startMs: 1650, endMs: 1950 },
  { word: 'to', startMs: 1950, endMs: 2050 },
  { word: 'everyday', startMs: 2050, endMs: 2480 },
  { word: 'reality', startMs: 2480, endMs: 2880 },
  { word: 'Today', startMs: 3000, endMs: 3350 },
  { word: 'AI', startMs: 3350, endMs: 3600 },
  { word: 'systems', startMs: 3600, endMs: 4000 },
  { word: 'power', startMs: 4000, endMs: 4280 },
  { word: 'our', startMs: 4280, endMs: 4400 },
  { word: 'smartphones', startMs: 4400, endMs: 5000 },
  { word: 'assist', startMs: 5100, endMs: 5450 },
  { word: 'doctors', startMs: 5450, endMs: 5850 },
  { word: 'in', startMs: 5850, endMs: 5950 },
  { word: 'diagnosing', startMs: 5950, endMs: 6550 },
  { word: 'diseases', startMs: 6550, endMs: 7100 },
];

// ============================================================================
// EMPHASIS DATA - Meets All Constraints
// ============================================================================

export const mockEmphasisData: EmphasisData[] = [
  { wordIndex: 1, level: 'high', tone: 'intense' }, // "intelligence"
  { wordIndex: 9, level: 'med', tone: 'warm' },     // "reality"
  { wordIndex: 15, level: 'med' },                  // "smartphones"
  { wordIndex: 20, level: 'high', tone: 'warm' },   // "diseases"
];

// ============================================================================
// STAGE 6: BUILD - Timeline
// ============================================================================

export const mockTimeline: Timeline = {
  shortTitle: 'The Future of AI',
  aspectRatio: '16:9',
  durationSeconds: 750,
  elements: [
    {
      startMs: 1000,
      endMs: 26000,
      videoUrl: 'assets/videos/ai-tech-1.mp4',
      mediaMetadata: {
        width: 1920,
        height: 1080,
        duration: 12.5,
        mode: 'crop',
        scale: 1.2,
      },
    },
    {
      startMs: 26000,
      endMs: 53000,
      videoUrl: 'assets/videos/healthcare-ai-2.mp4',
      mediaMetadata: {
        width: 1920,
        height: 1080,
        duration: 15.2,
        mode: 'letterbox',
        scale: 1.0,
      },
    },
  ],
  text: [
    {
      startMs: 1000,
      endMs: 26000,
      text: 'Artificial intelligence has evolved from science fiction to everyday reality',
      position: 'bottom',
      words: mockWordTimestamps.map(w => ({
        text: w.word,
        startMs: w.startMs + 1000, // Offset by intro duration
        endMs: w.endMs + 1000,
        emphasis: mockEmphasisData.find(e => e.wordIndex === mockWordTimestamps.indexOf(w))
          ? {
              level: mockEmphasisData.find(e => e.wordIndex === mockWordTimestamps.indexOf(w))!.level,
              tone: mockEmphasisData.find(e => e.wordIndex === mockWordTimestamps.indexOf(w))!.tone,
            }
          : { level: 'none' },
      })),
    },
  ],
  audio: [
    {
      startMs: 1000,
      endMs: 26000,
      audioUrl: 'assets/audio/segment-1.mp3',
    },
  ],
  backgroundMusic: [
    {
      startMs: 0,
      endMs: 750000,
      musicUrl: 'assets/music/background-music.mp3',
      volume: 0.2,
    },
  ],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate mock word timestamps for a given text
 */
export function generateMockWordTimestamps(
  text: string,
  averageWordDurationMs: number = 300
): Array<{ word: string; startMs: number; endMs: number }> {
  const words = text.split(/\s+/);
  const timestamps = [];
  let currentTimeMs = 0;

  for (const word of words) {
    const duration = Math.max(
      150,
      averageWordDurationMs + (Math.random() - 0.5) * 100
    );

    timestamps.push({
      word,
      startMs: currentTimeMs,
      endMs: currentTimeMs + duration,
    });

    currentTimeMs += duration + Math.random() * 50; // Small gap between words
  }

  return timestamps;
}

/**
 * Generate mock emphasis data that meets all constraints
 */
export function generateMockEmphasisData(
  wordCount: number
): EmphasisData[] {
  const maxTotal = Math.ceil(wordCount * 0.2); // 20%
  const maxHigh = Math.ceil(wordCount * 0.05); // 5%

  const emphases: EmphasisData[] = [];

  // Add high-emphasis words with proper spacing (≥3 indices apart)
  for (let i = 0; i < maxHigh; i++) {
    emphases.push({
      wordIndex: i * 4, // Ensures ≥3 word gap
      level: 'high',
      tone: i % 2 === 0 ? 'intense' : 'warm',
    });
  }

  // Add medium-emphasis words
  const medCount = Math.min(maxTotal - maxHigh, maxTotal);
  for (let i = 0; i < medCount; i++) {
    const wordIndex = maxHigh * 4 + i * 2; // Avoid high-emphasis indices
    if (wordIndex < wordCount) {
      emphases.push({
        wordIndex,
        level: 'med',
        tone: i % 3 === 0 ? 'warm' : undefined,
      });
    }
  }

  return emphases.sort((a, b) => a.wordIndex - b.wordIndex);
}

/**
 * Create a minimal valid timeline for testing
 */
export function createMinimalTimeline(): Timeline {
  return {
    shortTitle: 'Test Video',
    aspectRatio: '16:9',
    elements: [
      {
        startMs: 0,
        endMs: 5000,
        imageUrl: 'assets/images/test.jpg',
        mediaMetadata: {
          width: 1920,
          height: 1080,
        },
      },
    ],
    text: [
      {
        startMs: 0,
        endMs: 5000,
        text: 'Test',
        position: 'bottom',
      },
    ],
    audio: [
      {
        startMs: 0,
        endMs: 5000,
        audioUrl: 'assets/audio/test.mp3',
      },
    ],
  };
}

/**
 * Create edge case: maximum complexity timeline
 */
export function createMaximalTimeline(): Timeline {
  const segments = 5;
  const segmentDuration = 150000; // 150 seconds per segment

  const elements: BackgroundElement[] = [];
  const text: TextElement[] = [];
  const audio: AudioElement[] = [];

  for (let i = 0; i < segments; i++) {
    const startMs = i * segmentDuration;
    const endMs = (i + 1) * segmentDuration;

    elements.push({
      startMs,
      endMs,
      videoUrl: `assets/videos/segment-${i + 1}.mp4`,
      mediaMetadata: {
        width: 1920,
        height: 1080,
        duration: segmentDuration / 1000,
        mode: i % 2 === 0 ? 'crop' : 'letterbox',
      },
    });

    const mockText = 'This is a test segment with multiple words for testing purposes';
    const words = generateMockWordTimestamps(mockText);

    text.push({
      startMs,
      endMs,
      text: mockText,
      position: 'bottom',
      words: words.map((w, idx) => ({
        text: w.word,
        startMs: w.startMs + startMs,
        endMs: w.endMs + startMs,
        emphasis: { level: 'none' },
      })),
    });

    audio.push({
      startMs,
      endMs,
      audioUrl: `assets/audio/segment-${i + 1}.mp3`,
    });
  }

  return {
    shortTitle: 'Maximal Test Video',
    aspectRatio: '16:9',
    durationSeconds: (segments * segmentDuration) / 1000,
    elements,
    text,
    audio,
    backgroundMusic: [
      {
        startMs: 0,
        endMs: segments * segmentDuration,
        musicUrl: 'assets/music/background.mp3',
        volume: 0.2,
      },
    ],
  };
}
