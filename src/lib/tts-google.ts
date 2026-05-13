import { traceable } from "langsmith/traceable";
import {
  GOOGLE_TTS_BASE_URL,
  GOOGLE_STT_BASE_URL,
  GOOGLE_TTS_VOICE_NAME,
  GOOGLE_TTS_LANGUAGE_CODE,
  GOOGLE_TTS_SAMPLE_RATE,
  GOOGLE_TTS_TIMEOUT_MS,
} from "./config";

const CHANNELS = 1;
const BITS = 16;

export interface WordTiming {
  word: string;
  startSeconds: number;
  endSeconds: number;
}

export interface TtsResult {
  audioBuffer: Buffer;
  wordTimings: WordTiming[];
  durationSeconds: number;
}

function pcmToWav(pcm: Buffer): Buffer {
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(CHANNELS, 22);
  header.writeUInt32LE(GOOGLE_TTS_SAMPLE_RATE, 24);
  header.writeUInt32LE(GOOGLE_TTS_SAMPLE_RATE * CHANNELS * (BITS / 8), 28);
  header.writeUInt16LE(CHANNELS * (BITS / 8), 32);
  header.writeUInt16LE(BITS, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcm]);
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

async function generateSpeechImpl(
  text: string,
  options?: { voiceName?: string },
): Promise<TtsResult> {
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_CLOUD_API_KEY environment variable is not set");
  }

  const voiceName = options?.voiceName ?? GOOGLE_TTS_VOICE_NAME;

  // Google TTS plain-text input ignores newlines. Replace \n\n with
  // em-dash to force a dramatic pause that Chirp 3 HD voices honor;
  // single \n is collapsed to a space. The narration source is kept
  // unchanged (sentence segmenter still uses \n\n for paragraph splits).
  const ttsText = text.replace(/\n\n+/g, " — ").replace(/\n/g, " ");

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
        },
      }),
      signal: AbortSignal.timeout(GOOGLE_TTS_TIMEOUT_MS),
    },
  );

  if (!ttsRes.ok) {
    const errorText = await ttsRes.text().catch(() => "");
    throw new Error(
      `Google TTS error (${ttsRes.status}): ${errorText.slice(0, 500)}`,
    );
  }

  const { audioContent } = (await ttsRes.json()) as {
    audioContent: string;
  };
  const pcm = Buffer.from(audioContent, "base64");
  const audioBuffer = pcmToWav(pcm);
  const durationSeconds = pcm.length / (GOOGLE_TTS_SAMPLE_RATE * CHANNELS * (BITS / 8));

  const sttRes = await fetch(
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

  if (!sttRes.ok) {
    const errorText = await sttRes.text().catch(() => "");
    throw new Error(
      `Google STT error (${sttRes.status}): ${errorText.slice(0, 500)}`,
    );
  }

  const sttData = (await sttRes.json()) as SttResponse;

  const wordTimings: WordTiming[] = [];
  for (const result of sttData.results ?? []) {
    for (const word of result.alternatives[0]?.words ?? []) {
      wordTimings.push({
        word: word.word,
        startSeconds: parseDuration(word.startTime ?? "0s"),
        endSeconds: parseDuration(word.endTime ?? "0s"),
      });
    }
  }

  if (wordTimings.length === 0) {
    throw new Error("Google STT returned no word timings");
  }

  return { audioBuffer, wordTimings, durationSeconds };
}

export const generateSpeech = traceable(generateSpeechImpl, {
  name: "generateSpeech",
  run_type: "tool",
});
