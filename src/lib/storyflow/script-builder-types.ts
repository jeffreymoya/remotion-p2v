/**
 * Script Builder Types
 *
 * Types for the engagement-first script building workflow.
 * These extend the existing Script/Segment types with beat-level planning.
 */

import { z } from "zod";

/**
 * Target emotional response for a beat
 */
export enum TargetEmotion {
  CURIOSITY = "curiosity",
  ANGER = "anger",
  DREAD = "dread",
  HOPE = "hope",
  SURPRISE = "surprise",
  VALIDATION = "validation",
  URGENCY = "urgency",
  REFLECTION = "reflection",
}

/**
 * Review status for a beat
 */
export type BeatReviewStatus = "pending" | "approved" | "rejected";

/**
 * Blueprint status from Prisma (must match schema enum)
 */
export type BlueprintStatus =
  | "GENERATING"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED";

/**
 * Script draft status from Prisma (must match schema enum)
 */
export type ScriptDraftStatus =
  | "DRAFTING"
  | "GLUING"
  | "POLISHING"
  | "COMPLETED"
  | "FAILED";

/**
 * A single beat in the blueprint - the atomic unit of narrative structure
 */
export interface Beat {
  id?: string;
  blueprintId?: string;
  index: number;
  title: string;
  coreArgument: string;
  targetEmotion: TargetEmotion;
  microHook: string;
  estimatedDurationMs: number;
  mediaSuggestions: string[];
  reviewStatus: BeatReviewStatus;
  reviewNotes?: string | null;
}

/**
 * A blueprint is the master plan for a script - defines beats and structure
 */
export interface Blueprint {
  id: string;
  projectId: string;
  version: number;
  targetDurationMs: number;
  status: BlueprintStatus;
  beats: Beat[];
  rejectionNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Style modifiers that can be applied to beat text
 */
export type StyleModifier =
  | "casual"
  | "formal"
  | "dramatic"
  | "humorous"
  | "urgent"
  | "reflective";

/**
 * Checkpoint state for a beat draft
 */
export type BeatCheckpoint = "first_draft" | "revised" | "approved";

/**
 * A single beat's text draft
 */
export interface BeatDraft {
  id: string;
  scriptDraftId?: string;
  beatId?: string;
  beatIndex: number;
  text: string;
  wordCount: number;
  styleModifiersUsed: StyleModifier[];
  checkpoint: BeatCheckpoint;
  guidanceApplied?: string | null;
  regeneratedFromId?: string | null;
}

/**
 * Issue detected when gluing beats together
 */
export type GlueIssueType = "seam" | "robot_word" | "repetition" | "pacing";

export interface GlueIssueLocation {
  beatIndex: number;
  charStart: number;
  charEnd: number;
}

export interface GlueIssue {
  id: string;
  type: GlueIssueType;
  location: GlueIssueLocation;
  severity: "warning" | "error";
  suggestion?: string;
  text?: string;
  resolved?: boolean;
}

/**
 * A script draft represents one attempt at writing the full script
 */
export interface ScriptDraft {
  id: string;
  blueprintId: string;
  version: number;
  status: ScriptDraftStatus;
  currentBeatIndex: number;
  beatDrafts: BeatDraft[];
  glueIssues?: GlueIssue[];
  polishedText?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const TargetEmotionSchema = z.nativeEnum(TargetEmotion);

export const BeatReviewStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
]);

export const BlueprintStatusSchema = z.enum([
  "GENERATING",
  "PENDING_REVIEW",
  "APPROVED",
  "REJECTED",
]);

export const ScriptDraftStatusSchema = z.enum([
  "DRAFTING",
  "GLUING",
  "POLISHING",
  "COMPLETED",
  "FAILED",
]);

export const StyleModifierSchema = z.enum([
  "casual",
  "formal",
  "dramatic",
  "humorous",
  "urgent",
  "reflective",
]);

export const BeatCheckpointSchema = z.enum([
  "first_draft",
  "revised",
  "approved",
]);

export const BeatSchema = z.object({
  id: z.string().optional(),
  blueprintId: z.string().optional(),
  index: z.number().int().min(0),
  title: z.string().min(1).max(200),
  coreArgument: z.string().min(1).max(1000),
  targetEmotion: TargetEmotionSchema,
  microHook: z.string().min(1).max(500),
  estimatedDurationMs: z.number().int().positive(),
  mediaSuggestions: z.array(z.string()),
  reviewStatus: BeatReviewStatusSchema.default("pending"),
  reviewNotes: z.string().optional().nullable(),
});

export const BlueprintSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  version: z.number().int().positive(),
  targetDurationMs: z.number().int().positive(),
  status: BlueprintStatusSchema,
  beats: z.array(BeatSchema),
  rejectionNotes: z.string().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const BeatDraftSchema = z.object({
  id: z.string(),
  scriptDraftId: z.string(),
  beatId: z.string(),
  beatIndex: z.number().int().min(0),
  text: z.string().min(1),
  wordCount: z.number().int().positive(),
  styleModifiersUsed: z.array(StyleModifierSchema),
  checkpoint: BeatCheckpointSchema,
  guidanceApplied: z.string().nullable().optional(),
  regeneratedFromId: z.string().nullable().optional(),
});

export const GlueIssueSchema = z.object({
  id: z.string(),
  type: z.enum(["seam", "robot_word", "repetition", "pacing"]),
  location: z.object({
    beatIndex: z.number().int().min(0),
    charStart: z.number().int().min(0),
    charEnd: z.number().int().min(0),
  }),
  severity: z.enum(["warning", "error"]),
  suggestion: z.string().optional(),
  text: z.string().optional(),
  resolved: z.boolean().optional(),
});

export const ScriptDraftSchema = z.object({
  id: z.string(),
  blueprintId: z.string(),
  version: z.number().int().positive(),
  status: ScriptDraftStatusSchema,
  currentBeatIndex: z.number().int().min(0),
  beatDrafts: z.array(BeatDraftSchema),
  glueIssues: z.array(GlueIssueSchema).optional().default([]),
  polishedText: z.string().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ============================================================================
// Helper Types for API Requests
// ============================================================================

/**
 * Request to create a new blueprint
 */
export interface CreateBlueprintRequest {
  projectId: string;
  targetDurationMs: number;
  topic?: string;
  styleGuidelines?: string;
}

/**
 * Request to review a blueprint
 */
export interface ReviewBlueprintRequest {
  blueprintId: string;
  approved: boolean;
  rejectionNotes?: string;
}

/**
 * Request to start drafting a script
 */
export interface StartScriptDraftRequest {
  blueprintId: string;
  stylePreferences?: {
    tone?: StyleModifier[];
    targetWordCount?: number;
  };
}

/**
 * Interface for beat review API calls
 */
export interface BeatReviewInput {
  beatIndex: number; // Use index instead of ID since LLM-generated beats don't have IDs yet
  status: "approved" | "rejected"; // Simplified status for review
  notes?: string;
}

/**
 * Execution status tracking
 */
export interface ExecutionStatus {
  status: ScriptDraftStatus;
  currentBeatIndex: number;
  completedBeats: number;
  totalBeats: number;
  lastCheckpoint: string;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isBeat(value: unknown): value is Beat {
  return BeatSchema.safeParse(value).success;
}

export function isBlueprint(value: unknown): value is Blueprint {
  return BlueprintSchema.safeParse(value).success;
}

export function isBeatDraft(value: unknown): value is BeatDraft {
  return BeatDraftSchema.safeParse(value).success;
}

export function isScriptDraft(value: unknown): value is ScriptDraft {
  return ScriptDraftSchema.safeParse(value).success;
}

// ============================================================================
// UI Helpers
// ============================================================================

// Emotion color mapping for UI
export const EMOTION_COLORS: Record<string, string> = {
  curiosity: "bg-blue-500 text-blue-50",
  anger: "bg-red-500 text-red-50",
  dread: "bg-purple-500 text-purple-50",
  hope: "bg-green-500 text-green-50",
  surprise: "bg-yellow-500 text-yellow-50",
  validation: "bg-teal-500 text-teal-50",
  urgency: "bg-orange-500 text-orange-50",
  reflection: "bg-indigo-500 text-indigo-50",
};

/**
 * Get color classes for a target emotion
 */
export function getEmotionColor(emotion: TargetEmotion): string {
  return EMOTION_COLORS[emotion] ?? "bg-slate-500 text-slate-50";
}
