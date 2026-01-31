/**
 * Timeline build utilities
 * Helper functions for generating timeline elements
 */

import * as path from 'path';
import { AudioElement, TextElement } from './types';
import { INTRO_DURATION_MS } from './constants';
import { removeStageDirections, splitIntoSentences } from './utils';
import type { Milliseconds } from './types/units';

// Intro offset constant (matches INTRO_DURATION in constants.ts)
const INTRO_OFFSET_MS = INTRO_DURATION_MS;

/**
 * Generate audio elements from audio manifest
 */
export function generateAudioElements(
  audioManifest: Array<{
    path: string;
    durationMs: Milliseconds;
  }>,
  projectId: string,
  toFrame: (ms: number) => number,
): AudioElement[] {
  const elements: AudioElement[] = [];
  let currentTimeMs = 0;

  for (const audioFile of audioManifest) {
    // Extract just the segment ID from the audio path
    // From: "/absolute/path/to/segment-1.mp3" or "projects/{id}/assets/audio/segment-1.mp3"
    // To: "segment-1"
    const basename = path.basename(audioFile.path, '.mp3');

    const startMs = currentTimeMs + INTRO_OFFSET_MS;
    const endMs = currentTimeMs + audioFile.durationMs + INTRO_OFFSET_MS;

    elements.push({
      audioUrl: basename,
      startMs,
      endMs,
      startFrame: toFrame(startMs),
      endFrame: toFrame(endMs),
    });
    currentTimeMs += audioFile.durationMs;
  }

  return elements;
}

/**
 * Generate text elements from segments and audio data
 *
 * Note: This is a simplified version for test compatibility.
 * The full implementation requires AI provider for hold buffer calculation.
 */
export async function generateTextElements(
  segments: Array<{ text: string }>,
  audioElements: AudioElement[],
  audioManifest: Array<{
    path: string;
    durationMs: Milliseconds;
    wordTimestamps?: Array<{ word: string; startMs: Milliseconds; endMs: Milliseconds }>;
    emphasis?: Array<{ wordIndex: number; level: 'med' | 'high'; tone?: 'warm' | 'intense' }>;
  }>,
  videoConfig: { text?: { position?: string; maxCharactersPerLine?: number; maxLines?: number; subtitleLeadMs?: number } },
  toFrame: (ms: number) => number,
  subtitleLeadMs: number,
): Promise<TextElement[]> {
  const elements: TextElement[] = [];
  const textConfig = videoConfig.text || {};
  const maxCharsPerLine = textConfig.maxCharactersPerLine || 40;
  const maxLines = textConfig.maxLines || 2;
  const position: "top" | "bottom" | "center" =
    textConfig.position === "top" || textConfig.position === "center"
      ? textConfig.position
      : "bottom";

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    // Match by index - audio and segments generated in same order
    if (i >= audioElements.length || i >= audioManifest.length) continue;
    const audio = audioElements[i];
    const audioData = audioManifest[i];

    // Check if word-level timestamps are available
    if (audioData.wordTimestamps && audioData.wordTimestamps.length > 0) {
      // Clean segment text
      const cleanedSegmentText = removeStageDirections(segment.text);

      // Validate cleaned text isn't empty
      if (!cleanedSegmentText || cleanedSegmentText.trim().length === 0) {
        console.warn(`[BUILD] Segment ${i + 1} has no text after stage direction removal, skipping`);
        continue;
      }

      // Split into sentences
      const sentences = splitIntoSentences(cleanedSegmentText);

      // Validate sentence splitting worked
      if (sentences.length === 0) {
        console.error(`[BUILD] Failed to split text into sentences: "${cleanedSegmentText.substring(0, 100)}..."`);
        // Fallback: treat entire text as one sentence
        sentences.push(cleanedSegmentText);
      }

      // Map word timestamps to cleaned text
      const allWords = audioData.wordTimestamps.map((ts, idx) => {
        const emphasis = audioData.emphasis?.find((e) => e.wordIndex === idx);
        const startMs = ts.startMs + audio.startMs + subtitleLeadMs;
        const endMs = ts.endMs + audio.startMs + subtitleLeadMs;

        return {
          text: ts.word,
          startMs,
          endMs,
          startFrame: toFrame(startMs),
          endFrame: toFrame(endMs),
          emphasis: emphasis ? { level: emphasis.level, tone: emphasis.tone } : { level: 'none' as const },
        };
      });

      // Process sentences and create text elements (simplified - without AI hold buffer)
      let wordIndex = 0;
      for (let sentenceIdx = 0; sentenceIdx < sentences.length; sentenceIdx++) {
        const sentence = sentences[sentenceIdx];
        const sentenceWords = sentence.split(/\s+/).filter(w => w.length > 0);

        // Safety check: ensure we don't exceed available words
        const wordsAvailable = allWords.length - wordIndex;
        const wordsToTake = Math.min(sentenceWords.length, wordsAvailable);

        if (wordsToTake === 0) {
          console.warn(`[BUILD] No words available for sentence ${sentenceIdx + 1}: "${sentence.substring(0, 50)}..."`);
          continue;
        }

        if (wordsToTake < sentenceWords.length) {
          console.warn(`[BUILD] Insufficient words for sentence ${sentenceIdx + 1}: need ${sentenceWords.length}, have ${wordsAvailable}`);
        }

        const sentenceWordData = allWords.slice(wordIndex, wordIndex + wordsToTake);
        const holdFrames = 6; // Default hold frames (simplified without AI)

        elements.push({
          text: sentence,
          position,
          startMs: sentenceWordData[0].startMs,
          endMs: sentenceWordData[sentenceWordData.length - 1].endMs,
          startFrame: toFrame(sentenceWordData[0].startMs),
          endFrame: toFrame(sentenceWordData[sentenceWordData.length - 1].endMs),
          words: sentenceWordData,
          holdFrames,
          maxCharsPerLine,
          maxLines,
        });

        wordIndex += wordsToTake;
      }
    } else {
      // No word-level timestamps - create simple text element
      elements.push({
        text: segment.text,
        position,
        startMs: audio.startMs,
        endMs: audio.endMs,
        startFrame: audio.startFrame,
        endFrame: audio.endFrame,
        maxCharsPerLine,
        maxLines,
      });
    }
  }

  return elements;
}
