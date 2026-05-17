import { traceable } from "langsmith/traceable";
import { pcmToWav } from "./audio-wav";
import type { WordTiming, TtsResult } from "./audio-wav";
import {
  ELEVENLABS_BASE_URL,
  ELEVENLABS_TIMEOUT_MS,
  ELEVENLABS_MODEL_ID,
} from "./config";

export type { WordTiming, TtsResult };

interface ElevenLabsAlignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

function charsToWordTimings(alignment: ElevenLabsAlignment): WordTiming[] {
  const { characters, character_start_times_seconds, character_end_times_seconds } =
    alignment;
  const timings: WordTiming[] = [];
  let wordChars: string[] = [];
  let wordStart = 0;
  let wordEnd = 0;

  for (let i = 0; i < characters.length; i++) {
    const ch = characters[i];
    if (ch === " " || ch === "\n") {
      if (wordChars.length > 0) {
        timings.push({
          word: wordChars.join(""),
          startSeconds: wordStart,
          endSeconds: wordEnd,
        });
        wordChars = [];
      }
    } else {
      if (wordChars.length === 0) {
        wordStart = character_start_times_seconds[i];
      }
      wordChars.push(ch);
      wordEnd = character_end_times_seconds[i];
    }
  }

  if (wordChars.length > 0) {
    timings.push({
      word: wordChars.join(""),
      startSeconds: wordStart,
      endSeconds: wordEnd,
    });
  }

  return timings;
}

const SAMPLE_RATE = 24000;

async function generateSpeechImpl(text: string): Promise<TtsResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not set");
  if (!voiceId) throw new Error("ELEVENLABS_VOICE_ID is not set");

  const ttsText = text.replace(/\n\n+/g, " — ").replace(/\n/g, " ");

  const res = await fetch(
    `${ELEVENLABS_BASE_URL}/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps?output_format=pcm_24000`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: ttsText,
        model_id: ELEVENLABS_MODEL_ID,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0,
          speed: 0.85,
        },
      }),
      signal: AbortSignal.timeout(ELEVENLABS_TIMEOUT_MS),
    },
  );

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(
      `ElevenLabs TTS error (${res.status}): ${errorText.slice(0, 500)}`,
    );
  }

  const body = (await res.json()) as {
    audio_base64: string;
    alignment: ElevenLabsAlignment;
  };

  if (!body.alignment?.characters?.length) {
    throw new Error("ElevenLabs returned no alignment data");
  }

  const pcm = Buffer.from(body.audio_base64, "base64");
  const audioBuffer = pcmToWav(pcm, SAMPLE_RATE);
  const durationSeconds = pcm.length / (SAMPLE_RATE * 2); // 16-bit mono = 2 bytes/sample

  const wordTimings = charsToWordTimings(body.alignment);
  if (wordTimings.length === 0) {
    throw new Error("ElevenLabs alignment produced no word timings");
  }

  return { audioBuffer, wordTimings, durationSeconds };
}

export const generateSpeech = traceable(generateSpeechImpl, {
  name: "generateSpeechElevenLabs",
  run_type: "tool",
});
