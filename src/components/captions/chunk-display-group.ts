import type { WordTiming } from "../../lib/tts-google";

export const MAX_CHUNK_WORDS = 10;

const PUNCT_SPLIT_CHARS = new Set([",", ";", "—", "–", ":"]);
const PUNCT_SEARCH_RADIUS = 3;

export interface DisplayGroup {
  text: string;
  sentenceIndexes: number[];
  primarySentenceIndex: number;
  startSeconds: number;
  endSeconds: number;
  startFrame: number;
  endFrame: number;
  tokenWordIndexes: number[];
  isQuote: boolean;
}

function lastNonQuoteChar(word: string): string {
  let i = word.length - 1;
  while (i >= 0 && (word[i] === '"' || word[i] === "'" || word[i] === "'" || word[i] === "‘" || word[i] === "’")) {
    i--;
  }
  return i >= 0 ? word[i] : "";
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function chunkDisplayGroup(
  group: DisplayGroup,
  wordTimings: WordTiming[],
  fps: number,
): DisplayGroup[] {
  const idxCount = group.tokenWordIndexes.length;

  if (idxCount <= MAX_CHUNK_WORDS) {
    return [group];
  }

  const textWords = group.text.split(" ").filter((w) => w.length > 0);

  if (textWords.length === 0) {
    return [group];
  }

  // Step 2: Find text-level split boundaries with punctuation snap
  const sliceEnds: number[] = [];
  let pos = MAX_CHUNK_WORDS;
  while (pos < textWords.length) {
    // Scan for punctuation split within radius
    let best = -1;
    for (let r = -PUNCT_SEARCH_RADIUS; r <= PUNCT_SEARCH_RADIUS; r++) {
      const candidate = pos + r;
      if (candidate <= 0 || candidate >= textWords.length) continue;
      if (sliceEnds.includes(candidate)) continue;
      const lc = lastNonQuoteChar(textWords[candidate]);
      if (PUNCT_SPLIT_CHARS.has(lc)) {
        best = candidate + 1; // exclusive end
        break;
      }
    }
    if (best > 0) {
      sliceEnds.push(best);
      pos = best + MAX_CHUNK_WORDS;
    } else {
      sliceEnds.push(pos);
      pos += MAX_CHUNK_WORDS;
    }
  }
  sliceEnds.push(textWords.length); // sentinel

  // Step 3: Proportional mapping from text positions to tokenWordIndexes
  const ratio = textWords.length > 0 ? idxCount / textWords.length : 0;
  const tokenEnds: number[] = [];
  let prevTokenEnd = 0;
  for (const textEnd of sliceEnds) {
    let tEnd = clamp(Math.round(textEnd * ratio), 0, idxCount);
    if (tEnd <= prevTokenEnd) {
      tEnd = clamp(prevTokenEnd + 1, 0, idxCount);
    }
    tokenEnds.push(tEnd);
    prevTokenEnd = tEnd;
  }

  // Step 4: Build each chunk
  const chunks: DisplayGroup[] = [];
  let textStart = 0;
  let tokenStart = 0;

  for (let i = 0; i < tokenEnds.length; i++) {
    const tokenEnd = tokenEnds[i];
    const textEnd = sliceEnds[i];

    const tokenSlice = group.tokenWordIndexes.slice(tokenStart, tokenEnd);
    if (tokenSlice.length === 0) {
      textStart = textEnd;
      tokenStart = tokenEnd;
      continue;
    }

    const validEntries = tokenSlice
      .map((ti, localIdx) => ({ ti, localIdx }))
      .filter(({ ti }) => ti < wordTimings.length);

    if (validEntries.length === 0) {
      textStart = textEnd;
      tokenStart = tokenEnd;
      continue;
    }

    const firstValid = validEntries[0];
    const lastValid = validEntries[validEntries.length - 1];

    const startSeconds = wordTimings[firstValid.ti].startSeconds;
    const endSeconds = wordTimings[lastValid.ti].endSeconds;
    const startFrame = Math.floor(startSeconds * fps);
    const endFrame = Math.floor(endSeconds * fps);
    const text = textWords.slice(textStart, textEnd).join(" ");

    chunks.push({
      text,
      sentenceIndexes: [...group.sentenceIndexes],
      primarySentenceIndex: group.primarySentenceIndex,
      startSeconds,
      endSeconds,
      startFrame,
      endFrame,
      tokenWordIndexes: [...tokenSlice],
      isQuote: group.isQuote,
    });

    textStart = textEnd;
    tokenStart = tokenEnd;
  }

  // Step 5: Chain boundaries
  for (let k = 0; k < chunks.length; k++) {
    if (k < chunks.length - 1) {
      chunks[k].endSeconds = chunks[k + 1].startSeconds;
      chunks[k].endFrame = chunks[k + 1].startFrame;
    } else {
      chunks[k].endSeconds = group.endSeconds;
      chunks[k].endFrame = group.endFrame;
    }
  }

  // Step 6: Safety fallback
  if (chunks.length === 0) {
    return [group];
  }

  return chunks;
}
