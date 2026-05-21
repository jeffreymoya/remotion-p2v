import type { InspirationScript, Clip, Sentence } from "./inspire-schema";
import type { ArtDirection, ClipDirective, SentenceDirective } from "./art-direction-schema";
import { GOOGLE_TTS_SAMPLE_RATE } from "../config";

const CHANNELS = 1;
const BITS = 16;

// Valid only for WAV files produced by our own pcmToWav (standard 44-byte RIFF/PCM header, no extra chunks).
const WAV_HEADER_BYTES = 44;

export function concatWavBuffers(wavBuffers: Buffer[]): Buffer {
  const pcmChunks = wavBuffers.map((wav) => wav.subarray(WAV_HEADER_BYTES));
  const totalPcm = Buffer.concat(pcmChunks);

  const dataSize = totalPcm.length;
  const header = Buffer.alloc(WAV_HEADER_BYTES);
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

  return Buffer.concat([header, totalPcm]);
}

export function combineSegments(
  rootSlug: string,
  rootTopic: string,
  segments: InspirationScript[],
): InspirationScript {
  if (segments.length === 0) {
    throw new Error("combineSegments: segments array is empty");
  }

  const allWordTimings: InspirationScript["wordTimings"] = [];
  const allSentences: Sentence[] = [];
  const allClips: Clip[] = [];
  const allArtSentences: SentenceDirective[] = [];
  const allArtClips: ClipDirective[] = [];

  let frameOffset = 0;
  let secondsOffset = 0;
  let sentenceOffset = 0;
  let clipOffset = 0;
  let wordTimingOffset = 0;

  for (const seg of segments) {
    const segDurationSeconds = seg.durationInFrames / seg.fps;

    for (const wt of seg.wordTimings) {
      allWordTimings.push({
        word: wt.word,
        startSeconds: wt.startSeconds + secondsOffset,
        endSeconds: wt.endSeconds + secondsOffset,
      });
    }

    for (const s of seg.sentences) {
      allSentences.push({
        ...s,
        sentenceIndex: s.sentenceIndex + sentenceOffset,
        startSeconds: s.startSeconds + secondsOffset,
        endSeconds: s.endSeconds + secondsOffset,
        startFrame: s.startFrame + frameOffset,
        endFrame: s.endFrame + frameOffset,
        clipIndex: s.clipIndex + clipOffset,
        tokenWordIndexes: s.tokenWordIndexes.map((idx) => idx + wordTimingOffset),
      });
    }

    for (const c of seg.clips) {
      allClips.push({
        ...c,
        clipIndex: c.clipIndex + clipOffset,
        startFrame: c.startFrame + frameOffset,
        endFrame: c.endFrame + frameOffset,
        shots: c.shots.map((s) => ({
          ...s,
          startFrame: s.startFrame + frameOffset,
          endFrame: s.endFrame + frameOffset,
        })),
      });
    }

    for (const s of seg.artDirection.sentences) {
      allArtSentences.push({
        ...s,
        sentenceIndex: s.sentenceIndex + sentenceOffset,
      });
    }

    for (const c of seg.artDirection.clips) {
      allArtClips.push({
        ...c,
        clipIndex: c.clipIndex + clipOffset,
      });
    }

    frameOffset += seg.durationInFrames;
    secondsOffset += segDurationSeconds;
    sentenceOffset += seg.sentences.length;
    clipOffset += seg.clips.length;
    wordTimingOffset += seg.wordTimings.length;
  }

  const combinedArtDirection: ArtDirection = {
    schemaVersion: 1,
    clips: allArtClips,
    sentences: allArtSentences,
  };

  return {
    schemaVersion: 2,
    slug: rootSlug,
    topic: rootTopic,
    narration: segments.map((s) => s.narration).join("\n\n"),
    audioPath: `audio/inspire/${rootSlug}.wav`,
    wordTimings: allWordTimings,
    sentences: allSentences,
    clips: allClips,
    strategy: "multi",
    durationInFrames: frameOffset,
    fps: 30,
    width: 1920,
    height: 1080,
    artDirection: combinedArtDirection,
  };
}
