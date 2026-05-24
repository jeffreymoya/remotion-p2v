// Per-sentence pipeline that generates TTS audio, word timings, and
// sentence frame ranges for the documentary composition.
//
// Extracted from scripts/tts-docu.ts. Produces the audio file and
// timing metadata; script codegen lives in script-codegen.ts.

import fs from "node:fs";
import path from "node:path";
import { generateSpeech as generateSpeechGoogle } from "../tts-google";
import { commandingVoice } from "../shared/audio-postprocess";
import { pcmToWav } from "../audio-wav";
import { GOOGLE_TTS_SAMPLE_RATE, FPS, INTER_SENTENCE_GAP_SECONDS } from "../config";
import { DOCU_TTS_VOICE, DOCU_TTS_SPEAKING_RATE } from "../config";
import type { WordTiming } from "../audio-wav";
import type { DocuPalette } from "../../components/docu/docu-tokens";

export interface SentenceDef {
  text: string;
  emphasis: string[];
  palette: DocuPalette;
}

const AUDIO_DIR = "public/audio/docu";
const PROMPTS_DIR = "prompts/docu";
const BYTES_PER_SAMPLE = 2; // 16-bit mono

const AUDITION_VOICES = [
  "en-US-Chirp3-HD-Charon",
  "en-US-Chirp3-HD-Fenrir",
  "en-US-Chirp3-HD-Orus",
];

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "it's", "are", "was", "were", "be", "been",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "can", "shall", "i", "you", "he", "she",
  "we", "they", "me", "him", "her", "us", "them", "my", "your", "his",
  "its", "our", "their", "mine", "yours", "hers", "ours", "theirs",
  "and", "but", "or", "nor", "so", "yet", "for", "of", "to", "in",
  "on", "at", "by", "from", "with", "about", "as", "into", "through",
  "during", "before", "after", "above", "below", "between", "out",
  "off", "over", "under", "again", "further", "then", "once", "here",
  "there", "when", "where", "why", "how", "all", "both", "each", "few",
  "more", "most", "other", "some", "such", "no", "nor", "not", "only",
  "own", "same", "than", "too", "very", "just", "because", "now",
  "this", "that", "these", "those", "up", "down", "also", "every",
  "—",
]);

export interface SentenceFrameRange {
  startFrame: number;
  endFrame: number;
  palette: DocuPalette;
}

export interface SentenceData {
  wordTimings: WordTiming[];
  startSeconds: number;
  endSeconds: number;
  startFrame: number;
  endFrame: number;
  emphasisIndices: number[];
  tokenWordIndexes: number[];
}

export interface TtsPipelineResult {
  audioPath: string;
  wordTimings: WordTiming[];
  sentenceData: SentenceData[];
  sentenceFrameRanges: SentenceFrameRange[];
  durationSeconds: number;
  timingsJsonPath: string;
}

function normalizeWord(w: string): string {
  return w.toLowerCase().replace(/[^a-z0-9%$]/g, "");
}

function isContentWord(w: string): boolean {
  const clean = normalizeWord(w);
  if (clean.length === 0) return false;
  if (STOP_WORDS.has(clean)) return false;
  return true;
}

function findEmphasisIndices(sttWords: WordTiming[], emphasisTexts: string[]): number[] {
  const indices: number[] = [];
  const lowerStt = sttWords.map((w) => normalizeWord(w.word));
  for (const emph of emphasisTexts) {
    const normEmph = normalizeWord(emph);
    if (normEmph.length === 0) continue;
    const idx = lowerStt.findIndex((sw) => sw === normEmph);
    if (idx >= 0 && !indices.includes(idx)) {
      indices.push(idx);
    }
  }
  if (indices.length === 0) {
    for (let i = 0; i < sttWords.length; i++) {
      if (isContentWord(sttWords[i].word)) {
        indices.push(i);
        if (indices.length >= 3) break;
      }
    }
  }
  return indices;
}

function extractPcm(wavBuffer: Buffer): Buffer {
  return wavBuffer.subarray(44);
}

function makeSilencePcm(seconds: number): Buffer {
  const samples = Math.round(seconds * GOOGLE_TTS_SAMPLE_RATE);
  return Buffer.alloc(samples * BYTES_PER_SAMPLE);
}

function shortName(full: string): string {
  return full.split("-").pop() ?? full;
}

function s(secs: number): number { return Math.floor(secs * FPS); }
function e(secs: number): number { return Math.ceil(secs * FPS); }

export async function runTtsAudition(
  slug: string,
  sentences: SentenceDef[],
): Promise<void> {
  const first3Text = sentences.slice(0, 3).map((s) => s.text).join(" ");
  fs.mkdirSync(AUDIO_DIR, { recursive: true });

  for (const voice of AUDITION_VOICES) {
    const name = shortName(voice);
    const outPath = path.join(AUDIO_DIR, `audition-${name}.wav`);
    console.log(`[audition] Generating with ${voice}...`);
    const result = await generateSpeechGoogle(first3Text, {
      speakingRate: DOCU_TTS_SPEAKING_RATE,
      voiceName: voice,
    });
    const processed = commandingVoice(result.audioBuffer, `audition-${name}`);
    fs.writeFileSync(outPath, processed);
    console.log(`[audition] Wrote ${outPath}`);
  }

  console.log(
    "\nListen to all three, then set DOCU_TTS_VOICE=en-US-Chirp3-HD-{name} and re-run",
  );
}

export async function runTtsPipeline(
  slug: string,
  sentences: SentenceDef[],
): Promise<TtsPipelineResult> {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  fs.mkdirSync(PROMPTS_DIR, { recursive: true });

  const silencePcm = makeSilencePcm(INTER_SENTENCE_GAP_SECONDS);

  console.log(`[tts:docu] Generating ${sentences.length} sentences with ${DOCU_TTS_VOICE} at rate ${DOCU_TTS_SPEAKING_RATE}...`);

  const pcmParts: Buffer[] = [];
  const allWordTimings: WordTiming[] = [];
  let offsetSeconds = 0;
  let wordIndexOffset = 0;
  const sentenceData: SentenceData[] = [];
  const sentenceFrameRanges: SentenceFrameRange[] = [];

  for (let i = 0; i < sentences.length; i++) {
    const sent = sentences[i];
    console.log(`  [tts:docu] Sentence ${i + 1}/${sentences.length}: "${sent.text.slice(0, 40)}..."`);
    const result = await generateSpeechGoogle(sent.text, {
      speakingRate: DOCU_TTS_SPEAKING_RATE,
      voiceName: DOCU_TTS_VOICE,
    });

    const sentPcm = extractPcm(result.audioBuffer);
    pcmParts.push(sentPcm);

    const adjustedTimings: WordTiming[] = result.wordTimings.map((w) => ({
      word: w.word,
      startSeconds: w.startSeconds + offsetSeconds,
      endSeconds: w.endSeconds + offsetSeconds,
    }));

    const sentStart = offsetSeconds;
    const sentEnd = offsetSeconds + result.durationSeconds;

    const emphasisIndices = findEmphasisIndices(result.wordTimings, sent.emphasis);

    const sentWordCount = result.wordTimings.length;
    const tokenWordIndexes = Array.from(
      { length: sentWordCount },
      (_, j) => wordIndexOffset + j,
    );

    sentenceData.push({
      wordTimings: adjustedTimings,
      startSeconds: sentStart,
      endSeconds: sentEnd,
      startFrame: s(sentStart),
      endFrame: e(sentEnd),
      emphasisIndices,
      tokenWordIndexes,
    });

    sentenceFrameRanges.push({
      startFrame: s(sentStart),
      endFrame: e(sentEnd),
      palette: sent.palette,
    });

    allWordTimings.push(...adjustedTimings);
    wordIndexOffset += sentWordCount;

    offsetSeconds += result.durationSeconds;

    if (i < sentences.length - 1) {
      pcmParts.push(silencePcm);
      offsetSeconds += INTER_SENTENCE_GAP_SECONDS;
    }
  }

  const totalPcm = Buffer.concat(pcmParts);
  const wavBuffer = pcmToWav(totalPcm, GOOGLE_TTS_SAMPLE_RATE);
  const totalDurationSeconds = offsetSeconds;

  console.log(`[tts:docu] Post-processing audio...`);
  const processed = commandingVoice(wavBuffer, slug);

  const wavPath = path.join(AUDIO_DIR, `${slug}.wav`);
  fs.writeFileSync(wavPath, processed);
  console.log(`[tts:docu] Wrote ${wavPath}`);

  const timingsPath = path.join(PROMPTS_DIR, `${slug}-timings.json`);
  fs.writeFileSync(
    timingsPath,
    JSON.stringify(
      {
        wordTimings: allWordTimings,
        sentences: sentenceData.map((sd, i) => ({
          text: sentences[i].text,
          startSeconds: sd.startSeconds,
          endSeconds: sd.endSeconds,
          emphasisIndices: sd.emphasisIndices,
        })),
        durationSeconds: totalDurationSeconds,
        voice: DOCU_TTS_VOICE,
      },
      null,
      2,
    ),
  );
  console.log(`[tts:docu] Wrote ${timingsPath}`);

  return {
    audioPath: wavPath,
    wordTimings: allWordTimings,
    sentenceData,
    sentenceFrameRanges,
    durationSeconds: totalDurationSeconds,
    timingsJsonPath: timingsPath,
  };
}
