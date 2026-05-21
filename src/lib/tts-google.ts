import { traceable } from "langsmith/traceable";
import {
  GOOGLE_TTS_BASE_URL,
  GOOGLE_STT_BASE_URL,
  GOOGLE_TTS_VOICE_NAME,
  GOOGLE_TTS_LANGUAGE_CODE,
  GOOGLE_TTS_SAMPLE_RATE,
  GOOGLE_TTS_TIMEOUT_MS,
} from "./config";
import { pcmToWav } from "./audio-wav";
import { injectPausesForGoogle } from "./inspire/tts-pause-injector";
import type { WordTiming, TtsResult } from "./audio-wav";
import { enrichCurrentRun } from "./tracing";
export type { WordTiming, TtsResult } from "./audio-wav";

const CHANNELS = 1;
const BITS = 16;
const BYTES_PER_SAMPLE = (BITS / 8) * CHANNELS;

// Google TTS sync API (`text:synthesize`) enforces a 5000-byte limit on
// `input.text`. We split above this threshold with a 200-byte safety margin.
const GOOGLE_TTS_MAX_BYTES = 4800;

// Duration of the paragraph-break pause (`... ... ...`) that \n\n produces
// via `injectPausesForGoogle`. Synthetic silence is inserted between PCM
// chunks so the paragraph boundary pause is not lost when text is split
// across multiple TTS requests.
const INTER_CHUNK_SILENCE_SECONDS = 1.5;

// Google sync STT (`speech:recognize`) caps inline audio at ~60s.
// We chunk to under that limit and prefer cutting on silences so no
// spoken word straddles a chunk boundary.
const STT_MAX_CHUNK_SECONDS = 55;
const STT_MIN_CHUNK_SECONDS = 30;
const SILENCE_AMPLITUDE_THRESHOLD = 500; // int16; TTS pauses sit near 0
const SILENCE_MIN_DURATION_MS = 80;

function splitTextIntoTtsChunks(text: string): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let group: string[] = [];

  function flushGroup() {
    if (group.length > 0) {
      chunks.push(group.join("\n\n"));
      group = [];
    }
  }

  function pushSentenceChunks(para: string) {
    const sentences = para.match(/[^.!?]*[.!?]+(?:\s|$)/g) ?? [para];
    let sentGroup: string[] = [];
    for (const sent of sentences) {
      const candidate = [...sentGroup, sent].join(" ");
      if (
        Buffer.byteLength(injectPausesForGoogle(candidate), "utf8") >
        GOOGLE_TTS_MAX_BYTES
      ) {
        if (sentGroup.length > 0) chunks.push(sentGroup.join(" "));
        sentGroup = [sent];
        if (Buffer.byteLength(injectPausesForGoogle(sent), "utf8") > GOOGLE_TTS_MAX_BYTES) {
          console.warn(`[tts] sentence exceeds ${GOOGLE_TTS_MAX_BYTES} bytes after injection; TTS may fail`);
        }
      } else {
        sentGroup.push(sent);
      }
    }
    if (sentGroup.length > 0) chunks.push(sentGroup.join(" "));
  }

  for (const para of paragraphs) {
    const candidate = [...group, para].join("\n\n");
    if (
      Buffer.byteLength(injectPausesForGoogle(candidate), "utf8") >
      GOOGLE_TTS_MAX_BYTES
    ) {
      flushGroup();
      if (
        Buffer.byteLength(injectPausesForGoogle(para), "utf8") >
        GOOGLE_TTS_MAX_BYTES
      ) {
        pushSentenceChunks(para);
      } else {
        group = [para];
      }
    } else {
      group.push(para);
    }
  }

  flushGroup();
  return chunks.filter((c) => c.trim().length > 0);
}

function parseDuration(s: string): number {
  return parseFloat(s.replace("s", ""));
}

interface SttWord {
  word: string;
  startTime: string;
  endTime: string;
}

interface SttResponse {
  results: Array<{ alternatives: Array<{ words: SttWord[] }> }>;
}

interface PcmChunk {
  buffer: Buffer;
  offsetSeconds: number;
}

/**
 * Find a silence cut-point (byte offset, sample-aligned) inside [fromByte, toByte).
 * A cut-point is the end of the latest qualifying silence run. Returns null when
 * no silence of `SILENCE_MIN_DURATION_MS` is found in the window.
 */
function findSilenceCutPoint(
  pcm: Buffer,
  fromByte: number,
  toByte: number,
): number | null {
  const minRunSamples = Math.floor(
    (SILENCE_MIN_DURATION_MS / 1000) * GOOGLE_TTS_SAMPLE_RATE,
  );
  let runStart = -1;
  let bestCut: number | null = null;

  const start = fromByte + (fromByte % BYTES_PER_SAMPLE);
  const end = Math.min(toByte, pcm.length) - BYTES_PER_SAMPLE;

  for (let i = start; i <= end; i += BYTES_PER_SAMPLE) {
    const sample = Math.abs(pcm.readInt16LE(i));
    if (sample < SILENCE_AMPLITUDE_THRESHOLD) {
      if (runStart < 0) runStart = i;
      const runSamples = (i - runStart) / BYTES_PER_SAMPLE;
      if (runSamples >= minRunSamples) {
        // Update best cut to the middle of the current run.
        const mid = runStart + Math.floor((i - runStart) / 2);
        bestCut = mid - (mid % BYTES_PER_SAMPLE);
      }
    } else {
      runStart = -1;
    }
  }

  return bestCut;
}

function chunkPcm(pcm: Buffer): PcmChunk[] {
  const bytesPerSec = GOOGLE_TTS_SAMPLE_RATE * BYTES_PER_SAMPLE;
  const maxChunkBytes = STT_MAX_CHUNK_SECONDS * bytesPerSec;
  const minChunkBytes = STT_MIN_CHUNK_SECONDS * bytesPerSec;

  const chunks: PcmChunk[] = [];
  let cursor = 0;

  while (cursor < pcm.length) {
    const remaining = pcm.length - cursor;
    if (remaining <= maxChunkBytes) {
      chunks.push({
        buffer: pcm.subarray(cursor),
        offsetSeconds: cursor / bytesPerSec,
      });
      break;
    }

    const searchFrom = cursor + minChunkBytes;
    const searchTo = cursor + maxChunkBytes;
    const silenceCut = findSilenceCutPoint(pcm, searchFrom, searchTo);
    const cutByte = silenceCut ?? searchTo;
    const alignedCut = cutByte - (cutByte % BYTES_PER_SAMPLE);

    chunks.push({
      buffer: pcm.subarray(cursor, alignedCut),
      offsetSeconds: cursor / bytesPerSec,
    });
    cursor = alignedCut;
  }

  return chunks;
}

async function recognizeChunk(
  apiKey: string,
  audioContent: string,
): Promise<SttResponse> {
  const res = await fetch(
    `${GOOGLE_STT_BASE_URL}/speech:recognize?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config: {
          encoding: "LINEAR16",
          sampleRateHertz: GOOGLE_TTS_SAMPLE_RATE,
          languageCode: GOOGLE_TTS_LANGUAGE_CODE,
          enableWordTimeOffsets: true,
        },
        audio: { content: audioContent },
      }),
      signal: AbortSignal.timeout(GOOGLE_TTS_TIMEOUT_MS),
    },
  );

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(
      `Google STT error (${res.status}): ${errorText.slice(0, 500)}`,
    );
  }

  return (await res.json()) as SttResponse;
}

async function recognizePcm(
  apiKey: string,
  pcm: Buffer,
): Promise<WordTiming[]> {
  const chunks = chunkPcm(pcm);
  const wordTimings: WordTiming[] = [];

  for (const chunk of chunks) {
    const audioContent = chunk.buffer.toString("base64");
    const data = await recognizeChunk(apiKey, audioContent);

    for (const result of data.results ?? []) {
      for (const word of result.alternatives[0]?.words ?? []) {
        wordTimings.push({
          word: word.word,
          startSeconds:
            parseDuration(word.startTime ?? "0s") + chunk.offsetSeconds,
          endSeconds:
            parseDuration(word.endTime ?? "0s") + chunk.offsetSeconds,
        });
      }
    }
  }

  return wordTimings;
}

async function generateSpeechImpl(
  text: string,
  options?: { voiceName?: string },
): Promise<TtsResult> {
  enrichCurrentRun({ phase: "tts", provider: "google-tts" });
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_CLOUD_API_KEY environment variable is not set");
  }

  const voiceName = options?.voiceName ?? GOOGLE_TTS_VOICE_NAME;
  const textChunks = splitTextIntoTtsChunks(text);

  const silenceBytes =
    Math.round(INTER_CHUNK_SILENCE_SECONDS * GOOGLE_TTS_SAMPLE_RATE) * BYTES_PER_SAMPLE;
  const silencePad = Buffer.alloc(silenceBytes);

  const pcmParts: Buffer[] = [];
  for (let i = 0; i < textChunks.length; i++) {
    const ttsText = injectPausesForGoogle(textChunks[i]);
    const ttsRes = await fetch(
      `${GOOGLE_TTS_BASE_URL}/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text: ttsText },
          voice: { languageCode: GOOGLE_TTS_LANGUAGE_CODE, name: voiceName },
          audioConfig: {
            audioEncoding: "LINEAR16",
            sampleRateHertz: GOOGLE_TTS_SAMPLE_RATE,
            speakingRate: 0.85,
          },
        }),
        signal: AbortSignal.timeout(GOOGLE_TTS_TIMEOUT_MS),
      },
    );
    if (!ttsRes.ok) {
      const errorText = await ttsRes.text().catch(() => "");
      throw new Error(`Google TTS error (${ttsRes.status}): ${errorText.slice(0, 500)}`);
    }
    const { audioContent } = (await ttsRes.json()) as { audioContent: string };
    pcmParts.push(Buffer.from(audioContent, "base64"));
    if (i < textChunks.length - 1) pcmParts.push(silencePad);
  }

  const pcm = Buffer.concat(pcmParts);
  const audioBuffer = pcmToWav(pcm, GOOGLE_TTS_SAMPLE_RATE);
  const durationSeconds = pcm.length / (GOOGLE_TTS_SAMPLE_RATE * CHANNELS * (BITS / 8));

  const wordTimings = await recognizePcm(apiKey, pcm);
  if (wordTimings.length === 0) {
    throw new Error("Google STT returned no word timings");
  }

  return { audioBuffer, wordTimings, durationSeconds };
}

export const generateSpeech = traceable(generateSpeechImpl, {
  name: "generateSpeech",
  run_type: "tool",
});

export {
  splitTextIntoTtsChunks as _splitTextIntoTtsChunks,
  INTER_CHUNK_SILENCE_SECONDS as _INTER_CHUNK_SILENCE_SECONDS,
};
