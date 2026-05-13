import { z } from "zod";

// ── Word timing (mirrors tts-google.ts WordTiming) ──────────────────────
const WordTimingSchema = z.object({
  word: z.string(),
  startSeconds: z.number(),
  endSeconds: z.number(),
});

// ── Sentence ────────────────────────────────────────────────────────────
const SentenceSchema = z.object({
  sentenceIndex: z.number().int().min(0),
  text: z.string().min(1),
  startSeconds: z.number().min(0),
  endSeconds: z.number().min(0),
  startFrame: z.number().int().min(0),
  endFrame: z.number().int().min(0),
  clipIndex: z.number().int().min(0),
  tokenWordIndexes: z.array(z.number().int().min(0)),
});

// ── Clip ────────────────────────────────────────────────────────────────
const ClipSchema = z.object({
  clipIndex: z.number().int().min(0),
  query: z.string().min(1),
  videoPath: z.string().min(1),
  sourceUrl: z.string(),
  loop: z.boolean(),
  startFrame: z.number().int().min(0),
  endFrame: z.number().int().min(0),
});

// ── Root schema ─────────────────────────────────────────────────────────
export const InspirationScriptSchema = z
  .object({
    schemaVersion: z.literal(1),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    topic: z.string().min(1),
    narration: z.string().min(1),
    audioPath: z.string().min(1),
    wordTimings: z.array(WordTimingSchema),
    sentences: z.array(SentenceSchema),
    clips: z.array(ClipSchema).min(1),
    strategy: z.enum(["single", "multi"]),
    durationInFrames: z.number().int().min(1),
    fps: z.literal(30),
    width: z.literal(1920),
    height: z.literal(1080),
  })
  .refine(
    (s) => {
      if (s.strategy === "single") {
        return (
          s.clips.length === 1 &&
          s.sentences.every((sent) => sent.clipIndex === 0)
        );
      }
      return true;
    },
    { message: "single strategy must have exactly 1 clip and all clipIndex=0" },
  )
  .refine(
    (s) => s.sentences.every((sent) => sent.clipIndex < s.clips.length),
    { message: "every sentence clipIndex must reference a valid clip" },
  );

export type InspirationScript = z.infer<typeof InspirationScriptSchema>;
export type Sentence = z.infer<typeof SentenceSchema>;
export type Clip = z.infer<typeof ClipSchema>;
