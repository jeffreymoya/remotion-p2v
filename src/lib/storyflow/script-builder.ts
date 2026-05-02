/**
 * Script Builder Service Layer
 *
 * Business logic for multi-phase script generation:
 * - Blueprint generation
 * - Beat execution with checkpoints
 * - Script segmentation
 */

import { randomUUID } from "crypto";
import { z } from "zod";
import { getSettings } from "./settings";
import { stripMarkdownBlocks } from "./gemini-parser";
import {
  blueprintPrompt,
  hookPrompt,
  middleBeatPrompt,
  turnPrompt,
  segmentPrompt,
} from "../../../config/prompts";
import { WORDS_PER_MINUTE, countWords } from "../constants";
import { aiGenerate } from "@/src/lib/services/ai";
import type { Milliseconds } from "@/src/lib/types/units";

// Constants
const MS_PER_MINUTE = 60000;
const SCRIPT_WPM = WORDS_PER_MINUTE.SCRIPT_GENERATION;

// Zod schemas
const targetEmotionSchema = z.enum([
  "curiosity",
  "anger",
  "dread",
  "hope",
  "surprise",
  "validation",
  "urgency",
  "reflection",
]);

export type TargetEmotion = z.infer<typeof targetEmotionSchema>;

const beatSchema = z.object({
  index: z.number().int().positive(),
  title: z.string().min(1),
  coreArgument: z.string().min(1),
  targetEmotion: targetEmotionSchema,
  microHook: z.string().min(1),
  estimatedDurationMs: z.number().int().positive(),
  mediaSuggestions: z.array(z.string()).optional().default([]),
});

export type Beat = z.infer<typeof beatSchema>;

const blueprintResponseSchema = z.object({
  beats: z.array(beatSchema),
});

const segmentResponseSchema = z.object({
  segments: z.array(
    z.object({
      index: z.number().int().positive(),
      text: z.string().min(1),
      wordCount: z.number().int().positive(),
      sourceBeatIds: z.array(z.string()).optional().default([]),
    })
  ),
});

export type SegmentResponse = z.infer<typeof segmentResponseSchema>;

export interface BeatDraft {
  id: string;
  beatIndex: number;
  text: string;
  wordCount: number;
  styleModifiersUsed: string[];
  checkpoint: Date;
  guidanceApplied?: string | null;
  regeneratedFromId?: string | null;
}

export const buildBeatDraftId = (scriptDraftId: string, beatIndex: number) =>
  `${scriptDraftId}-beat-${beatIndex}`;

export const extractScriptDraftId = (beatDraftId: string): string | null => {
  const token = "-beat-";
  const idx = beatDraftId.lastIndexOf(token);
  if (idx === -1) return null;
  return beatDraftId.slice(0, idx);
};

// Helper functions
function estimateWordCount(text: string): number {
  return countWords(text);
}

function calculateTargetWordCount(durationMs: Milliseconds): number {
  return Math.round((durationMs / MS_PER_MINUTE) * SCRIPT_WPM);
}

/**
 * Calculate beat count based on target duration
 * Formula: max(4, ceil(targetDurationMs / 120000))
 */
export function calculateBeatCount(targetDurationMs: Milliseconds): number {
  return Math.max(4, Math.ceil(targetDurationMs / 120000));
}

async function aiCallJson<T>(
  projectId: string,
  operation: string,
  modelTier: "PRO" | "FLASH",
  prompt: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  const settings = await getSettings();
  const model = modelTier === "PRO" ? settings.ai.proModel : settings.ai.model;

  const { data } = await aiGenerate<T>({
    projectId,
    operation,
    prompt,
    model,
    outputFormat: "json",
    schema,
  });

  return data;
}

async function aiCallText(
  projectId: string,
  operation: string,
  modelTier: "PRO" | "FLASH",
  prompt: string
): Promise<string> {
  const settings = await getSettings();
  const model = modelTier === "PRO" ? settings.ai.proModel : settings.ai.model;

  const { data } = await aiGenerate<string>({
    projectId,
    operation,
    prompt,
    model,
    outputFormat: "text",
  });

  return stripMarkdownBlocks(data);
}

/**
 * Generate a new blueprint
 */
export async function generateBlueprint(
  projectId: string,
  topic: string,
  targetDurationMs: number
): Promise<{ beats: Beat[] }> {
  const beatCount = calculateBeatCount(targetDurationMs);

  const prompt = blueprintPrompt({
    topic,
    targetDurationMs,
    beatCount,
  });

  return aiCallJson(projectId, "blueprint-generate", "PRO", prompt, blueprintResponseSchema);
}

/**
 * Regenerate blueprint with feedback
 */
export async function regenerateBlueprint(
  projectId: string,
  topic: string,
  targetDurationMs: number,
  rejectionNotes: string
): Promise<{ beats: Beat[] }> {
  const beatCount = calculateBeatCount(targetDurationMs);

  const prompt = blueprintPrompt({
    topic,
    targetDurationMs,
    beatCount,
    rejectionNotes,
  });

  return aiCallJson(projectId, "blueprint-regenerate", "PRO", prompt, blueprintResponseSchema);
}

/**
 * Execute a single beat based on its position
 */
export async function executeBeat(
  projectId: string,
  beat: Beat,
  previousContent: string,
  isFirst: boolean,
  isLast: boolean,
  totalBeats: number,
  opts?: { guidance?: string; regenerateFromId?: string; scriptDraftId?: string }
): Promise<BeatDraft> {
  const targetWordCount = calculateTargetWordCount(beat.estimatedDurationMs);

  let prompt: string;

  if (isFirst) {
    // Use hook prompt
    prompt = hookPrompt({
      beatTitle: beat.title,
      coreArgument: beat.coreArgument,
      targetEmotion: beat.targetEmotion,
      microHook: beat.microHook,
      estimatedDurationMs: beat.estimatedDurationMs,
      targetWordCount,
    });
  } else if (isLast) {
    // Use turn prompt
    prompt = turnPrompt({
      beatTitle: beat.title,
      coreArgument: beat.coreArgument,
      targetEmotion: beat.targetEmotion,
      microHook: beat.microHook,
      estimatedDurationMs: beat.estimatedDurationMs,
      targetWordCount,
      allPreviousBeatText: previousContent,
    });
  } else {
    // Use middle prompt
    const lastParagraph = previousContent.split('\n\n').slice(-2).join('\n\n');
    prompt = middleBeatPrompt({
      beatIndex: beat.index,
      totalBeats,
      beatTitle: beat.title,
      coreArgument: beat.coreArgument,
      targetEmotion: beat.targetEmotion,
      microHook: beat.microHook,
      estimatedDurationMs: beat.estimatedDurationMs,
      targetWordCount,
      previousBeatText: lastParagraph,
    });
  }

  if (opts?.guidance) {
    prompt += `\n\n**Reviewer Guidance:** ${opts.guidance}`;
  }

  const text = await aiCallText(projectId, "beat-draft", "FLASH", prompt);
  const wordCount = estimateWordCount(text);

  return {
    id: opts?.regenerateFromId
      ? `${opts.regenerateFromId}-r-${randomUUID()}`
      : buildBeatDraftId(opts?.scriptDraftId ?? "draft", beat.index),
    beatIndex: beat.index,
    text,
    wordCount,
    styleModifiersUsed: [],
    checkpoint: new Date(),
    guidanceApplied: opts?.guidance,
    regeneratedFromId: opts?.regenerateFromId ?? null,
  };
}

/**
 * Segment a polished script into TTS-optimized segments
 */
export async function segmentScript(
  projectId: string,
  polishedText: string,
  beats: Beat[]
): Promise<SegmentResponse> {
  // Calculate beat boundaries based on character positions
  const beatBoundaries = beats.map((beat, idx) => {
    // This is a rough approximation - in practice you'd track actual positions
    const avgCharsPerBeat = polishedText.length / beats.length;
    return {
      index: beat.index,
      start: Math.floor(idx * avgCharsPerBeat),
      end: Math.floor((idx + 1) * avgCharsPerBeat),
    };
  });

  const targetSegmentCount = Math.ceil(estimateWordCount(polishedText) / 125); // 125 words per segment

  const prompt = segmentPrompt({
    polishedText,
    beatBoundaries,
    targetSegmentCount,
  });

  return aiCallJson(projectId, "segment-script", "FLASH", prompt, segmentResponseSchema);
}
