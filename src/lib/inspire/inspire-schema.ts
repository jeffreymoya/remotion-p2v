import { z } from "zod";
import { ArtDirectionSchema } from "./art-direction-schema";

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

// ── Media type ──────────────────────────────────────────────────────────
export const MediaTypeSchema = z.enum(["image", "video"]);
export type MediaType = z.infer<typeof MediaTypeSchema>;

// ── Shot ─────────────────────────────────────────────────────────────────
const ShotSchema = z.object({
  shotIndex: z.number().int().min(0),
  query: z.string().min(1),
  videoPath: z.string().min(1).optional(),
  imagePath: z.string().min(1).optional(),
  mediaType: MediaTypeSchema.optional(),
  sourceUrl: z.string(),
  loop: z.boolean(),
  startFrame: z.number().int().min(0),
  endFrame: z.number().int().min(0),
  videoId: z.number().int().positive().optional(),
  videoSource: z.enum(["pixabay", "pexels"]).optional(),
});
export type Shot = z.infer<typeof ShotSchema>;

// ── Clip ────────────────────────────────────────────────────────────────
const ClipSchema = z.object({
  clipIndex: z.number().int().min(0),
  query: z.string().min(1),
  startFrame: z.number().int().min(0),
  endFrame: z.number().int().min(0),
  shots: z.array(ShotSchema).min(1),
});

const GateNoteSchema = z.object({
  gate: z.string(),
  severity: z.enum(["block", "warn"]),
  evidence: z.string(),
  message: z.string(),
  suggestion: z.string(),
});

const TargetFeelingSchema = z.object({
  dominant: z.string().min(1),
  secondary: z.string().min(1).optional(),
  intensity: z.coerce.number().int().min(1).max(3),
});

const QualityGateSummarySchema = z.object({
  gate: z.string(),
  pass: z.boolean(),
  notes: z.array(GateNoteSchema),
  metrics: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

const QualityChapterReportSchema = z.object({
  chapterIndex: z.number().int().min(0),
  slug: z.string().min(1),
  targetFeeling: TargetFeelingSchema.optional(),
  recognitionMoment: z.string().optional(),
  polarityArc: z.enum([
    "low-to-high",
    "high-to-low",
    "low-mid-high",
    "high-mid-low",
    "flat-deepening",
  ]).optional(),
  unresolved: z.array(GateNoteSchema),
  finalLintWarnings: z.array(GateNoteSchema),
  gates: z.array(QualityGateSummarySchema),
});

const QualityReportSchema = z.object({
  chapters: z.array(QualityChapterReportSchema),
  proofread: z.object({
    emotionalArc: z.object({
      gate: z.string(),
      pass: z.boolean(),
      notes: z.array(GateNoteSchema),
    }).optional(),
  }).optional(),
});

// ── Root schema ─────────────────────────────────────────────────────────
export const InspirationScriptSchema = z
  .object({
    schemaVersion: z.literal(2),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    topic: z.string().min(1),
    narration: z.string().min(1),
    audioPath: z.string().min(1),
    backgroundMusicPath: z.string().optional(),
    wordTimings: z.array(WordTimingSchema),
    sentences: z.array(SentenceSchema),
    clips: z.array(ClipSchema).min(1),
    strategy: z.enum(["single", "multi"]),
    durationInFrames: z.number().int().min(1),
    fps: z.literal(30),
    width: z.literal(1920),
    height: z.literal(1080),
    artDirection: ArtDirectionSchema,
    qualityReport: QualityReportSchema.optional(),
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
