import type { WordTiming } from "../tts-google";

export interface SentenceTiming {
  sentenceIndex: number;
  text: string;
  tokenWordIndexes: number[];
  startSeconds: number;
  endSeconds: number;
  startFrame: number;
  endFrame: number;
}

export interface SegmenterResult {
  sentences: SentenceTiming[];
  warnings: string[];
}

/**
 * Normalize a word for comparison:
 * lowercase, strip everything except letters, digits, apostrophes, hyphens.
 */
function normalizeToken(w: string): string {
  return w
    .toLowerCase()
    .replace(/[^a-z0-9'-]/g, "")
    .trim();
}

/**
 * Split narration into sentences:
 * 1. Split on `\n\n` into paragraphs.
 * 2. Within each paragraph, split on sentence terminators: . ? ! ...
 * 3. Trim, drop empties.
 */
function splitIntoSentences(narration: string): string[] {
  const paragraphs = narration.split(/\n\n+/);
  const sentences: string[] = [];

  for (const para of paragraphs) {
    // Split on sentence-ending punctuation, keeping the delimiter with the sentence
    const parts = para.split(/(?<=[.?!](?:\.{2})?)\s+/);
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.length > 0) {
        sentences.push(trimmed);
      }
    }
  }

  return sentences;
}

/**
 * Tokenize a sentence the same way STT output would be tokenized.
 */
function tokenize(sentence: string): string[] {
  return sentence
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Segment narration into sentences aligned to word timings from STT.
 *
 * Uses sequential positional alignment: walks a cursor through the global
 * wordTimings array, consuming tokens.length words per sentence.
 */
export function segmentSentences(
  narration: string,
  wordTimings: WordTiming[],
  durationSeconds: number,
): SegmenterResult {
  const rawSentences = splitIntoSentences(narration);
  const warnings: string[] = [];
  const sentences: SentenceTiming[] = [];
  let wordCursor = 0;

  for (let i = 0; i < rawSentences.length; i++) {
    const text = rawSentences[i];
    const tokens = tokenize(text);

    if (tokens.length === 0) continue;

    const firstWordIdx = wordCursor;
    const tokenWordIndexes: number[] = [];

    for (let j = 0; j < tokens.length; j++) {
      const globalIdx = wordCursor + j;
      if (globalIdx >= wordTimings.length) {
        warnings.push(
          `Sentence ${i}: ran out of word timings at token "${tokens[j]}" (index ${globalIdx})`,
        );
        // Still record the index even if out of bounds — caller will clamp
        tokenWordIndexes.push(globalIdx);
        continue;
      }

      const expected = tokens[j];
      const actual = normalizeToken(wordTimings[globalIdx].word);

      if (expected !== actual) {
        warnings.push(
          `Sentence ${i}, token ${j}: expected "${expected}" got "${actual}" (positional alignment continues)`,
        );
      }

      tokenWordIndexes.push(globalIdx);
    }

    wordCursor += tokens.length;

    const lastWordIdx = Math.min(
      firstWordIdx + tokens.length - 1,
      wordTimings.length - 1,
    );

    let startSeconds =
      firstWordIdx < wordTimings.length
        ? wordTimings[firstWordIdx].startSeconds
        : 0;
    let endSeconds =
      lastWordIdx < wordTimings.length
        ? wordTimings[lastWordIdx].endSeconds
        : durationSeconds;

    // Extend endSeconds into trailing silence (e.g. after "...")
    // up to 0.5s or until the next sentence starts
    const nextSentenceStart =
      i + 1 < rawSentences.length && wordCursor < wordTimings.length
        ? wordTimings[wordCursor]?.startSeconds
        : undefined;

    if (text.includes("...") || text.includes("—")) {
      const maxExtend = nextSentenceStart
        ? Math.min(nextSentenceStart, endSeconds + 0.5)
        : Math.min(durationSeconds, endSeconds + 0.5);
      endSeconds = maxExtend;
    }

    // Clamp to total duration for the last sentence
    if (i === rawSentences.length - 1) {
      endSeconds = Math.max(endSeconds, durationSeconds);
    }

    sentences.push({
      sentenceIndex: i,
      text,
      tokenWordIndexes,
      startSeconds,
      endSeconds,
      startFrame: Math.floor(startSeconds * 30),
      endFrame: Math.ceil(endSeconds * 30),
    });
  }

  return { sentences, warnings };
}
