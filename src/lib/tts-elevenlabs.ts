import { traceable } from "langsmith/traceable";
import {
  ELEVENLABS_BASE_URL,
  ELEVENLABS_VOICE_ID,
  ELEVENLABS_MODEL_ID,
} from "./config";

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

interface ElevenLabsAlignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

interface ElevenLabsResponse {
  audio_base64: string;
  normalized_alignment: ElevenLabsAlignment;
}

function groupCharactersIntoWords(
  alignment: ElevenLabsAlignment,
): WordTiming[] {
  const { characters, character_start_times_seconds, character_end_times_seconds } = alignment;
  const timings: WordTiming[] = [];
  let currentWord = "";
  let wordStart = 0;
  let wordEnd = 0;

  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];
    const charStart = character_start_times_seconds[i];
    const charEnd = character_end_times_seconds[i];

    if (char === " " || char === "\n" || char === "\t") {
      if (currentWord.length > 0) {
        timings.push({
          word: currentWord,
          startSeconds: wordStart,
          endSeconds: wordEnd,
        });
        currentWord = "";
      }
      continue;
    }

    if (currentWord.length === 0) {
      wordStart = charStart;
    }
    currentWord += char;
    wordEnd = charEnd;
  }

  if (currentWord.length > 0) {
    timings.push({
      word: currentWord,
      startSeconds: wordStart,
      endSeconds: wordEnd,
    });
  }

  return timings;
}

async function generateSpeechImpl(
  text: string,
  options?: { voiceId?: string; modelId?: string },
): Promise<TtsResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY environment variable is not set");
  }

  const voiceId = options?.voiceId ?? ELEVENLABS_VOICE_ID;
  const modelId = options?.modelId ?? ELEVENLABS_MODEL_ID;
  const url = `${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}/with-timestamps`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `ElevenLabs API error (${response.status}): ${errorText.slice(0, 500)}`,
    );
  }

  const data = (await response.json()) as ElevenLabsResponse;

  if (!data.audio_base64) {
    throw new Error("ElevenLabs returned no audio data");
  }

  const audioBuffer = Buffer.from(data.audio_base64, "base64");
  const wordTimings = data.normalized_alignment
    ? groupCharactersIntoWords(data.normalized_alignment)
    : [];

  const durationSeconds =
    wordTimings.length > 0
      ? wordTimings[wordTimings.length - 1].endSeconds
      : 0;

  return { audioBuffer, wordTimings, durationSeconds };
}

export const generateSpeech = traceable(generateSpeechImpl, {
  name: "generateSpeech",
  run_type: "llm",
});
