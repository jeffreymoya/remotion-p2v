/**
 * Script Builder Service Layer
 *
 * Business logic for multi-phase script generation:
 * - Blueprint generation
 * - Beat execution with checkpoints
 * - Script segmentation
 */

import { execFile } from "child_process";
import { randomUUID } from "crypto";
import { promisify } from "util";
import { z } from "zod";
import { getSettings } from "./settings";
import { parseGeminiOutput, stripMarkdownBlocks } from "./gemini-parser";
import {
  blueprintPrompt,
  blueprintRegeneratePrompt,
  hookPrompt,
  middleBeatPrompt,
  turnPrompt,
  segmentPrompt,
} from "../../../config/prompts";
import { WORDS_PER_MINUTE, countWords } from "../constants";

const execFileAsync = promisify(execFile);

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

function calculateTargetWordCount(durationMs: number): number {
  return Math.round((durationMs / MS_PER_MINUTE) * SCRIPT_WPM);
}

/**
 * Calculate beat count based on target duration
 * Formula: max(4, ceil(targetDurationMs / 120000))
 */
export function calculateBeatCount(targetDurationMs: number): number {
  return Math.max(4, Math.ceil(targetDurationMs / 120000));
}

/**
 * Execute Gemini CLI command and return raw stdout for further parsing
 */
async function executeGeminiRaw(prompt: string): Promise<string> {
  const settings = await getSettings();
  const model = settings.ai.model || "gemini-2.5-pro";

  const args = [
    "--yolo",
    "--model",
    model,
    "--output-format",
    "json",
    prompt,
  ];

  try {
    const { stdout } = await execFileAsync("gemini", args, {
      maxBuffer: 2_000_000,
      timeout: 300_000, // 5 minutes
    });

    return stdout;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Gemini error";
    console.error("[script-builder] Gemini execution failed:", message);
    throw error;
  }
}

/**
 * Execute Gemini CLI command for text output (extracts response string)
 */
async function executeGeminiText(prompt: string): Promise<string> {
  const stdout = await executeGeminiRaw(prompt);

  // Use robust parser to handle wrapper format
  const parsed = parseGeminiOutput<{ response?: string }>(stdout);

  // If we got a string directly, return it
  if (typeof parsed === "string") {
    return stripMarkdownBlocks(parsed);
  }

  // If we got an object with response, extract it
  if (parsed && typeof parsed === "object" && "response" in parsed && typeof parsed.response === "string") {
    return stripMarkdownBlocks(parsed.response);
  }

  // Return stringified if it's something else
  return typeof parsed === "string" ? parsed : JSON.stringify(parsed);
}

/**
 * Generate a new blueprint
 */
export async function generateBlueprint(
  topic: string,
  targetDurationMs: number
): Promise<{ beats: Beat[] }> {
  const beatCount = calculateBeatCount(targetDurationMs);

  const prompt = blueprintPrompt({
    topic,
    targetDurationMs,
    beatCount,
  });

  const stdout = await executeGeminiRaw(prompt);
  const parsed = parseGeminiOutput(stdout);
  const validated = blueprintResponseSchema.parse(parsed);
  return validated;
}

/**
 * Regenerate blueprint with feedback
 */
export async function regenerateBlueprint(
  topic: string,
  targetDurationMs: number,
  rejectionNotes: string
): Promise<{ beats: Beat[] }> {
  const beatCount = calculateBeatCount(targetDurationMs);

  const prompt = blueprintRegeneratePrompt({
    topic,
    targetDurationMs,
    beatCount,
    rejectionNotes,
  });

  const stdout = await executeGeminiRaw(prompt);
  const parsed = parseGeminiOutput(stdout);
  const validated = blueprintResponseSchema.parse(parsed);
  return validated;
}

/**
 * Execute a single beat based on its position
 */
export async function executeBeat(
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

  const text = await executeGeminiText(prompt);
  const wordCount = estimateWordCount(text);

  return {
    id: opts?.regenerateFromId
      ? `${opts.regenerateFromId}-r-${randomUUID()}`
      : buildBeatDraftId(opts?.scriptDraftId ?? "draft", beat.index),
    beatIndex: beat.index,
    text,
    wordCount,
    styleModifiersUsed: styleModifiers,
    checkpoint: new Date(),
    guidanceApplied: opts?.guidance,
    regeneratedFromId: opts?.regenerateFromId ?? null,
  };
}

/**
 * Segment a polished script into TTS-optimized segments
 */
export async function segmentScript(
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

  const stdout = await executeGeminiRaw(prompt);
  const parsed = parseGeminiOutput(stdout);
  const validated = segmentResponseSchema.parse(parsed);
  return validated;
}
