import { z } from 'zod';

export const HoldBufferSchema = z.object({
  holdFrames: z.number().min(0).max(30).describe('Number of frames to hold text after last word ends'),
  reasoning: z.string().describe('Brief explanation of why this hold duration is appropriate'),
});

export type HoldBufferData = z.infer<typeof HoldBufferSchema>;

export const holdBufferPrompt = (
  wordsPerMinute: number,
  avgGapMs: number,
  hasPauseAtEnd: boolean,
  sentenceLength: number,
): string => {
  return `Analyze the speaking pattern and determine appropriate text hold duration.

Speaking Metrics:
- Words per minute: ${wordsPerMinute.toFixed(1)} WPM
- Average gap between words: ${avgGapMs.toFixed(0)}ms
- Pause after last word: ${hasPauseAtEnd ? 'Yes' : 'No'}
- Sentence word count: ${sentenceLength} words

Guidelines:
- Fast speaking (>160 WPM): Shorter hold (0-3 frames = 0-100ms)
- Normal speaking (120-160 WPM): Medium hold (3-6 frames = 100-200ms)
- Slow speaking (<120 WPM): Longer hold (6-12 frames = 200-400ms)
- If pause detected at end: Add 3-6 extra frames
- Longer sentences may need slightly longer holds for readability

Return the optimal hold duration in frames (30 fps) and brief reasoning.`;
};
