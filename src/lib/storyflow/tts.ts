import { writeFile, mkdir, stat } from "fs/promises";
import path from "path";
import { v1beta1 } from "@google-cloud/text-to-speech";
import type { protos } from "@google-cloud/text-to-speech";
import { ScriptSegment, TTSSettings, WordTimestamp } from "./types";
import { getSettings } from "./settings";
import { WORDS_PER_MINUTE } from "../constants";
import { aiLogger } from "@/src/lib/services/ai";

// Pre-generated 1s silent MP3 (base64) for offline/dev fallback
const SILENT_MP3_BASE64 =
  "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAoAAAQ9gAQEBYWHR0dIyMpKSkvLzU1NTs7QUFBSEhOTk5UVFpaWmBgZmZmbGxycnJ5eX9/f4WFi4uLkZGXl5ednaSkpKqqsLCwtra8vLzCwsjIyM7O1dXV29vh4eHn5+3t7fPz+fn5//8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAV8AAAAAAAAEPYp+BPjAAAAAAD/+xDEAAPAAAGkAAAAIAAANIAAAARMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVf/7EMQpg8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVV//sQxFMDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVX/+xDEfIPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVf/7EMSmA8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVV//sQxM+DwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVX/+xDE1gPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVf/7EMTWA8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVV//sQxNYDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVX/+xDE1gPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVf/7EMTWA8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVV//sQxNYDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVX/+xDE1gPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVf/7EMTWA8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVV//sQxNYDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVX/+xDE1gPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVf/7EMTWA8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVV//sQxNYDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVX/+xDE1gPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVf/7EMTWA8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVV//sQxNYDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVX/+xDE1gPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVf/7EMTWA8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVV//sQxNYDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVX/+xDE1gPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVf/7EMTWA8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVV//sQxNYDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVX/+xDE1gPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVf/7EMTWA8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQxNYDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+xDE1gPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7EMTWA8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQxNYDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+xDE1gPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==";

type GoogleClient = v1beta1.TextToSpeechClient;

let cachedClient: GoogleClient | null = null;

function getGoogleClient(): GoogleClient | null {
  if (cachedClient) return cachedClient;
  try {
    cachedClient = new v1beta1.TextToSpeechClient();
    return cachedClient;
  } catch (error) {
    console.warn("Google TTS client unavailable, falling back to mock:", error);
    return null;
  }
}

function wordsFromText(text: string): string[] {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function buildSSML(text: string): string {
  const words = wordsFromText(text);
  const markedWords = words.map((word, i) => `<mark name="w${i}"/>${word}`);
  return `<speak>${markedWords.join(" ")}</speak>`;
}

function timestampsFromTimepoints(
  words: string[],
  timepoints: protos.google.cloud.texttospeech.v1beta1.ITimepoint[]
): WordTimestamp[] {
  const items: WordTimestamp[] = [];
  for (let i = 0; i < timepoints.length; i++) {
    const startMs = (timepoints[i].timeSeconds ?? 0) * 1000;
    const endMs = i < timepoints.length - 1
      ? (timepoints[i + 1].timeSeconds ?? 0) * 1000
      : startMs + 500;
    items.push({
      word: words[i] ?? "",
      startMs,
      endMs,
    });
  }

  // If we have fewer timepoints than words, estimate the rest evenly
  if (words.length > items.length) {
    const avg =
      items.length > 1
        ? (items[items.length - 1].endMs - items[0].startMs) / items.length
        : 500;
    let lastEnd = items.length ? items[items.length - 1].endMs : 0;
    for (let i = items.length; i < words.length; i++) {
      const startMs = lastEnd;
      const endMs = startMs + avg;
      items.push({ word: words[i], startMs, endMs });
      lastEnd = endMs;
    }
  }

  return items;
}

function estimatedTimestamps(words: string[], speakingRate: number): WordTimestamp[] {
  const wordsPerMinute = WORDS_PER_MINUTE.TTS_BASE * (speakingRate || 1);
  const msPerWord = 60000 / wordsPerMinute;
  let cursor = 0;
  return words.map((word) => {
    const startMs = cursor;
    const endMs = cursor + msPerWord;
    cursor = endMs;
    return { word, startMs, endMs };
  });
}

async function synthesizeWithGoogle(
  text: string,
  settings: TTSSettings
): Promise<{ buffer: Buffer; timestamps: WordTimestamp[] }> {
  const client = getGoogleClient();
  if (!client) {
    throw new Error("Google TTS client not configured");
  }

  const [response] = await client.synthesizeSpeech({
    input: { ssml: buildSSML(text) },
    voice: {
      languageCode: "en-US",
      name: settings.voice,
    },
    audioConfig: {
      audioEncoding: "MP3" as const,
      speakingRate: settings.speakingRate,
      pitch: settings.pitch,
    },
    enableTimePointing: ["SSML_MARK"] as const,
  });

  const audioContent = response.audioContent;
  if (!audioContent) {
    throw new Error("No audio content returned by Google TTS");
  }

  let buffer: Buffer;
  if (audioContent instanceof Uint8Array) {
    buffer = Buffer.from(audioContent);
  } else if (typeof audioContent === "string") {
    buffer = Buffer.from(audioContent, "base64");
  } else if (typeof audioContent === "object" && audioContent !== null && "data" in audioContent) {
    const contentWithData = audioContent as { data: string | Uint8Array };
    buffer = Buffer.from(contentWithData.data);
  } else {
    throw new Error("Unknown audio buffer format");
  }

  const words = wordsFromText(text);
  const timestamps = timestampsFromTimepoints(words, response.timepoints ?? []);

  return { buffer, timestamps };
}

function synthesizeMock(
  text: string,
  settings: TTSSettings
): { buffer: Buffer; timestamps: WordTimestamp[] } {
  const words = wordsFromText(text);
  const timestamps = estimatedTimestamps(words, settings.speakingRate);
  const buffer = Buffer.from(SILENT_MP3_BASE64, "base64");
  return { buffer, timestamps };
}

async function ensureAudioDirectory(projectId: string) {
  const audioDir = path.join(process.cwd(), "public", "projects", projectId, "assets", "audio");
  await mkdir(audioDir, { recursive: true });
  return audioDir;
}

export type SegmentAudioResult = {
  audioUrl: string;
  durationMs: number;
  timestamps: WordTimestamp[];
};

export async function generateAudioForSegment(
  projectId: string,
  segment: ScriptSegment
): Promise<SegmentAudioResult> {
  if (!segment.text?.trim()) {
    throw new Error("Segment text is required for TTS generation");
  }

  const { tts: ttsSettings } = await getSettings();
  const audioDir = await ensureAudioDirectory(projectId);

  let buffer: Buffer;
  let timestamps: WordTimestamp[];

  try {
    const { data } = await aiLogger.wrap<{ buffer: Buffer; timestamps: WordTimestamp[] }>(
      {
        projectId,
        provider: "google-tts",
        operation: "tts-generate",
        metadata: { voice: ttsSettings.voice, speakingRate: ttsSettings.speakingRate },
      },
      segment.text,
      async () => {
        const result = await synthesizeWithGoogle(segment.text, ttsSettings);
        return {
          result,
          rawResponse: JSON.stringify({ timepoints: result.timestamps.length }),
        };
      }
    );
    ({ buffer, timestamps } = data);
  } catch (error) {
    console.warn(
      `Google TTS failed for segment ${segment.index}, using mock audio. Reason:`,
      (error as Error).message
    );
    ({ buffer, timestamps } = synthesizeMock(segment.text, ttsSettings));
  }

  const filename = `segment-${segment.index}.mp3`;
  const filePath = path.join(audioDir, filename);

  await writeFile(filePath, buffer);

  const durationMs =
    timestamps.length > 0 ? timestamps[timestamps.length - 1].endMs : 1000;

  return {
    audioUrl: `/projects/${projectId}/assets/audio/${filename}`,
    durationMs,
    timestamps,
  };
}

export async function audioFileExists(projectId: string, segmentIndex: number): Promise<boolean> {
  const filePath = path.join(
    process.cwd(),
    "public",
    "projects",
    projectId,
    "assets",
    "audio",
    `segment-${segmentIndex}.mp3`
  );
  try {
    const stats = await stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}
