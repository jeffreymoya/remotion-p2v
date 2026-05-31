import type { WordTiming } from "../tts-google";
import { toSpokenForm } from "./numeric-normalize";

/** How many tokens to look ahead in either stream when reconciling drift. */
const ALIGN_LOOKAHEAD = 3;
/** Resync search window radius around the current cursor. */
const RESYNC_BACK = 8;
const RESYNC_FORWARD = 8;
/** Implausible single-sentence duration bounds for the sanity post-pass. */
const MIN_SENTENCE_SEC = 0.3;
const MAX_SENTENCE_SEC = 30;

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
 * Opening-quote characters used for secondary quote-boundary splitting.
 */
const OPENING_QUOTE_CHARS = `""\u201C\u201F\u2033`;

/**
 * Split narration into sentences:
 * 1. Split on `\n\n` into paragraphs.
 * 2. Within each paragraph, split on sentence terminators: . ? ! ...
 *    (accounting for optional closing quotes after punctuation).
 * 3. Separate lead-in text from embedded quotes (split at `: "`).
 * 4. Trim, drop empties.
 */
function splitIntoSentences(narration: string): string[] {
  const paragraphs = narration.split(/\n\n+/);
  const sentences: string[] = [];

  for (const para of paragraphs) {
    // Split on sentence-ending punctuation, allowing optional closing quotes.
    // Negative lookahead prevents splitting compound pauses like "... ..." or "... ... ..."
    const parts = para.split(/(?<=[.?!](?:\.{2})?["""''‟″]*)\s+(?!\.{3})/);
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.length > 0) {
        // Secondary split: separate lead-in from embedded opening quote
        const quoteIntroIdx = trimmed.search(
          /[:,]\s+["""\u201C\u201F\u2033]/,
        );
        if (quoteIntroIdx !== -1) {
          const matchResult = trimmed
            .slice(quoteIntroIdx)
            .match(/^[,:]\s+/);
          if (matchResult) {
            const splitPos = quoteIntroIdx + matchResult[0].length;
            const leading = trimmed.slice(0, quoteIntroIdx + 1).trim();
            const quoted = trimmed.slice(splitPos).trim();
            if (leading.length > 0) sentences.push(leading);
            if (quoted.length > 0) sentences.push(quoted);
            continue;
          }
        }
        sentences.push(trimmed);
      }
    }
  }

  return sentences;
}

/**
 * Tokenize a sentence the same way STT output would be tokenized.
 *
 * Numbers and currency/percent markers are first expanded to spoken tokens
 * (`"$2.5T"` → `"two point five trillion dollars"`) so the text token stream
 * matches the STT engine's spelled-out words instead of drifting the cursor.
 * Spoken-form runs BEFORE symbol stripping so `$`/`%`/scale suffixes survive.
 */
function tokenize(sentence: string): string[] {
  return toSpokenForm(sentence)
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Greedy two-pointer alignment of text tokens against STT word timings.
 *
 * Handles insertions (extra STT words not in text) and deletions (text tokens
 * the STT missed) so that minor tokenization differences between the text
 * tokenizer and the STT engine do not cause permanent cursor drift.
 *
 * Returns the indexes into `wordTimings` that were matched and the new cursor
 * position (one past the last consumed STT word).
 */
function alignTokens(
  tokens: string[],
  wordTimings: WordTiming[],
  cursor: number,
): { tokenWordIndexes: number[]; newCursor: number; mismatches: Array<{ tokenIdx: number; expected: string; got: string }> } {
  const tokenWordIndexes: number[] = [];
  const mismatches: Array<{ tokenIdx: number; expected: string; got: string }> = [];

  let ti = 0; // text pointer
  let wi = cursor; // word-timings pointer

  while (ti < tokens.length && wi < wordTimings.length) {
    const expected = tokens[ti];
    const actual = normalizeToken(wordTimings[wi].word);

    if (expected === actual) {
      // Perfect match — consume both
      tokenWordIndexes.push(wi);
      ti++;
      wi++;
    } else {
      // Look ahead up to ALIGN_LOOKAHEAD in the STT stream: how far until the
      // expected text token reappears (i.e. extra STT words were inserted)?
      let insertDistance = -1;
      for (let k = 1; k <= ALIGN_LOOKAHEAD && wi + k < wordTimings.length; k++) {
        if (normalizeToken(wordTimings[wi + k].word) === expected) {
          insertDistance = k;
          break;
        }
      }
      // Look ahead up to ALIGN_LOOKAHEAD in the text: how far until the current
      // STT word reappears (i.e. text tokens the STT skipped)?
      let deleteDistance = -1;
      for (let k = 1; k <= ALIGN_LOOKAHEAD && ti + k < tokens.length; k++) {
        if (tokens[ti + k] === actual) {
          deleteDistance = k;
          break;
        }
      }

      if (insertDistance !== -1 && (deleteDistance === -1 || insertDistance <= deleteDistance)) {
        // STT inserted `insertDistance` extra words before the expected token — skip them.
        wi += insertDistance;
      } else if (deleteDistance !== -1) {
        // Text has `deleteDistance` tokens the STT skipped — map them to the
        // current word index and advance the text pointer past them.
        for (let k = 0; k < deleteDistance; k++) {
          tokenWordIndexes.push(wi);
          ti++;
        }
      } else {
        // Irreconcilable at this position — consume both, record mismatch
        mismatches.push({ tokenIdx: ti, expected, got: actual });
        tokenWordIndexes.push(wi);
        ti++;
        wi++;
      }
    }
  }

  // If text tokens remain but STT is exhausted, map them to last known index
  while (ti < tokens.length) {
    tokenWordIndexes.push(Math.max(0, wi - 1));
    ti++;
  }

  return { tokenWordIndexes, newCursor: wi, mismatches };
}

/**
 * Resync the cursor by searching for the next sentence's leading tokens in
 * the STT stream. Looks in a window around the current cursor position.
 */
function resyncCursor(
  nextTokens: string[],
  wordTimings: WordTiming[],
  currentCursor: number,
): number {
  if (nextTokens.length === 0) return currentCursor;

  const probeLen = Math.min(3, nextTokens.length);
  const windowStart = Math.max(0, currentCursor - RESYNC_BACK);
  const windowEnd = Math.min(wordTimings.length - probeLen, currentCursor + RESYNC_FORWARD);

  let bestPos = currentCursor;
  let bestScore = -1;

  for (let pos = windowStart; pos <= windowEnd; pos++) {
    let score = 0;
    for (let k = 0; k < probeLen; k++) {
      if (nextTokens[k] === normalizeToken(wordTimings[pos + k].word)) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestPos = pos;
    }
  }

  // Only accept resync if we matched at least 2 tokens (or all if fewer)
  const threshold = Math.min(2, probeLen);
  return bestScore >= threshold ? bestPos : currentCursor;
}

/**
 * Segment narration into sentences aligned to word timings from STT.
 *
 * Uses greedy two-pointer alignment per sentence with inter-sentence
 * resynchronization to prevent cursor drift from tokenization differences
 * between the text tokenizer and the STT engine.
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

    const { tokenWordIndexes, newCursor, mismatches } = alignTokens(
      tokens,
      wordTimings,
      wordCursor,
    );

    for (const m of mismatches) {
      warnings.push(
        `Sentence ${i}, token ${m.tokenIdx}: expected "${m.expected}" got "${m.got}" (aligned)`,
      );
    }

    if (newCursor > wordTimings.length) {
      warnings.push(
        `Sentence ${i}: ran out of word timings at token index ${newCursor}`,
      );
    }

    wordCursor = newCursor;

    // Resync cursor using next sentence's leading tokens
    if (i + 1 < rawSentences.length) {
      const nextTokens = tokenize(rawSentences[i + 1]);
      wordCursor = resyncCursor(nextTokens, wordTimings, wordCursor);
    }

    const lastWordIdx = Math.min(
      tokenWordIndexes.length > 0
        ? tokenWordIndexes[tokenWordIndexes.length - 1]
        : firstWordIdx,
      wordTimings.length - 1,
    );

    const effectiveStart =
      tokenWordIndexes.length > 0
        ? Math.min(tokenWordIndexes[0], wordTimings.length - 1)
        : firstWordIdx;

    let startSeconds =
      effectiveStart < wordTimings.length
        ? wordTimings[effectiveStart].startSeconds
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

    if (text.includes("... ... ...")) {
      const maxExtend = nextSentenceStart
        ? Math.min(nextSentenceStart, endSeconds + 1.2)
        : Math.min(durationSeconds, endSeconds + 1.2);
      endSeconds = maxExtend;
    } else if (text.includes("... ...")) {
      const maxExtend = nextSentenceStart
        ? Math.min(nextSentenceStart, endSeconds + 0.8)
        : Math.min(durationSeconds, endSeconds + 0.8);
      endSeconds = maxExtend;
    } else if (text.includes("...") || text.includes("—")) {
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

  // ── Sanity post-pass ─────────────────────────────────────────────────
  // Last-resort repair for sentences whose frame range is inverted or whose
  // duration is implausible (alignment drift). Interpolate from neighbors.
  // Each repair WARNS — a silent fix would hide the very drift this catches.
  const repaired = repairImplausibleRanges(sentences, durationSeconds, warnings);

  return { sentences: repaired, warnings };
}

function repairImplausibleRanges(
  sentences: SentenceTiming[],
  durationSeconds: number,
  warnings: string[],
): SentenceTiming[] {
  const repaired: SentenceTiming[] = [];

  for (let i = 0; i < sentences.length; i++) {
    const sent = sentences[i];
    const dur = sent.endSeconds - sent.startSeconds;
    const inverted = sent.startFrame >= sent.endFrame || sent.endSeconds <= sent.startSeconds;
    const implausible = dur < MIN_SENTENCE_SEC || dur > MAX_SENTENCE_SEC;

    if (!inverted && !implausible) {
      repaired.push(sent);
      continue;
    }

    const prevEnd = i > 0 ? repaired[i - 1].endSeconds : 0;
    const nextStart =
      i < sentences.length - 1 ? sentences[i + 1].startSeconds : durationSeconds;

    let newStart = Math.max(sent.startSeconds, prevEnd);
    let newEnd = nextStart;
    if (newEnd <= newStart) {
      newStart = prevEnd;
      newEnd = Math.min(durationSeconds, newStart + MIN_SENTENCE_SEC);
    }

    const fixed: SentenceTiming = {
      ...sent,
      startSeconds: newStart,
      endSeconds: newEnd,
      startFrame: Math.floor(newStart * 30),
      endFrame: Math.ceil(newEnd * 30),
    };
    repaired.push(fixed);

    const msg =
      `Sentence ${i}: implausible frame range ` +
      `(start=${sent.startFrame}, end=${sent.endFrame}, dur=${dur.toFixed(2)}s) ` +
      `repaired to [${fixed.startFrame}, ${fixed.endFrame}]`;
    warnings.push(msg);
    console.warn(`[sentence-segmenter] ${msg}`);
  }

  return repaired;
}
