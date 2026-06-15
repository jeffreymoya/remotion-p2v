import { z } from "zod";
import { SLOT_NAMES, type SlotName } from "../layout/grid";

const TIMING_KEY = /(?:^from$)|(?:^delay$)|(?:durationinframes)|(?:frames?$)|(?:seconds?$)/i;

/** A named layout slot, validated against the slot catalogue. */
export const zSlotName = z.enum(SLOT_NAMES as [SlotName, ...SlotName[]]);

/** A resolved pixel rectangle for a placed layer. */
export const zBox = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
});
export type LayerBox = z.infer<typeof zBox>;

/** Scene-level chrome (numbered label rail) rendered once per scene. */
export const zChrome = z.object({
  num: z.string(),
  name: z.string(),
  meta: z.string(),
  accent: z.string().optional(),
  theme: z.enum(["dark", "light"]).optional(),
});
export type ChromePlan = z.infer<typeof zChrome>;

export const zEvidenceItem = z.object({
  id: z.string(),
  kind: z.string(),
  label: z.string(),
  source: z.string().optional(),
  assetRef: z.string().optional(),
});
export type EvidenceItem = z.infer<typeof zEvidenceItem>;

export const zWordTiming = z.object({
  word: z.string(),
  startSeconds: z.number(),
  endSeconds: z.number(),
});
export type WordTiming = z.infer<typeof zWordTiming>;

export const zScriptScene = z.object({
  id: z.string(),
  visual: z.string(),
  narration: z.string(),
  emphasisHints: z.array(z.string()).optional(),
  evidenceRefs: z.array(z.string()).optional(),
  componentHint: z.string().optional(),
  transitionHint: z.string().optional(),
});
export type ScriptScene = z.infer<typeof zScriptScene>;

export const zScriptAct = z.object({
  title: z.string(),
  role: z.string().optional(),
  mood: z.string().optional(),
  scenes: z.array(zScriptScene),
});

export const zScriptModel = z.object({
  meta: z.object({
    title: z.string(),
    voice: z.string(),
    mood: z.string().optional(),
    width: z.number(),
    height: z.number(),
  }),
  evidencePool: z.record(z.string(), zEvidenceItem),
  acts: z.array(zScriptAct),
});
export type ScriptModel = z.infer<typeof zScriptModel>;

export const zTimedScene = z.object({
  id: z.string(),
  startSeconds: z.number(),
  endSeconds: z.number(),
  wordTimings: z.array(zWordTiming),
});
export const zTimedTranscript = z.object({
  audioPath: z.string(),
  durationSeconds: z.number(),
  scenes: z.array(zTimedScene),
});
export type TimedTranscript = z.infer<typeof zTimedTranscript>;
export type TimedScene = z.infer<typeof zTimedScene>;

export const zAnchor = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("word"), text: z.string() }),
  z.object({ kind: z.literal("wordIndex"), index: z.number().int().nonnegative() }),
  z.object({ kind: z.literal("sceneStart") }),
  z.object({ kind: z.literal("sceneEnd") }),
]);
export type Anchor = z.infer<typeof zAnchor>;

export const zSceneRole = z.enum([
  "hook", "context", "evidence", "data", "turn", "payoff", "cta", "custom",
]);
export type SceneRole = z.infer<typeof zSceneRole>;

export const zFocalOwner = z.enum([
  "title", "evidence", "chart", "map", "person", "object", "metric", "custom",
]);
export type FocalOwner = z.infer<typeof zFocalOwner>;

export const zBackgroundPlan = z.object({
  assetRef: z.string(),
  motionIntent: z.string().optional(),
});
export type BackgroundPlan = z.infer<typeof zBackgroundPlan>;

export const zProps = z
  .record(z.string(), z.unknown())
  .refine((p) => !Object.keys(p).some((k) => TIMING_KEY.test(k)), {
    message: "props must not contain timing fields (from/delay/*Frames/*Seconds)",
  });

export const zPlannedLayer = z.object({
  component: z.string(),
  layerRole: z.enum(["primary", "supporting"]),
  props: zProps,
  anchors: z.array(z.object({ target: z.string(), at: zAnchor })),
  slot: zSlotName.optional(),
  z: z.number().int().optional(),
});
export type PlannedLayer = z.infer<typeof zPlannedLayer>;

export const zPlannedScene = z
  .object({
    id: z.string(),
    role: zSceneRole,
    focalOwner: zFocalOwner,
    background: zBackgroundPlan,
    layers: z.array(zPlannedLayer),
    chrome: zChrome.optional(),
    emphasisWordRefs: z.array(z.string()),
    evidenceRefs: z.array(z.string()),
    transition: z.object({ type: z.string().optional() }).optional().nullable(),
  })
  .superRefine((s, ctx) => {
    const primaries = s.layers.filter((l) => l.layerRole === "primary").length;
    if (primaries !== 1) {
      ctx.addIssue({ code: "custom", message: `scene ${s.id} must have exactly one primary layer (found ${primaries})` });
    }
    const supporting = s.layers.length - primaries;
    if (supporting > 3) {
      ctx.addIssue({ code: "custom", message: `scene ${s.id} has ${supporting} supporting layers (max 3)` });
    }
  });
export type PlannedScene = z.infer<typeof zPlannedScene>;

export const zScenePlan = z.object({ scenes: z.array(zPlannedScene) });
export type ScenePlan = z.infer<typeof zScenePlan>;

export const zResolvedLayer = z.object({
  component: z.string(),
  layerRole: z.enum(["primary", "supporting"]),
  props: z.record(z.string(), z.unknown()),
  resolvedAnchors: z.array(z.object({ target: z.string(), delayFrames: z.number().int().nonnegative() })),
  slot: zSlotName,
  z: z.number().int(),
  box: zBox,
});
export type ResolvedLayer = z.infer<typeof zResolvedLayer>;

export const zResolvedScene = z.object({
  id: z.string(),
  role: zSceneRole,
  focalOwner: zFocalOwner,
  fromFrame: z.number().int().nonnegative(),
  durationInFrames: z.number().int().positive(),
  background: zBackgroundPlan,
  layers: z.array(zResolvedLayer),
  chrome: zChrome.optional(),
  wordTimings: z.array(zWordTiming),
  emphasisWordIndexes: z.array(z.number().int().nonnegative()),
  evidenceRefs: z.array(z.string()),
  transition: z.object({ type: z.string().optional(), durationInFrames: z.number().int().nonnegative().optional() }).optional().nullable(),
});
export type ResolvedScene = z.infer<typeof zResolvedScene>;

export const zCompositionPlan = z.object({
  fps: z.number().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  durationInFrames: z.number().int().positive(),
  audioPath: z.string(),
  scenes: z.array(zResolvedScene),
  captionsEnabled: z.boolean().optional().default(false),
});
export type CompositionPlan = z.infer<typeof zCompositionPlan>;

export const zActPlan = z.object({
  actTitle: z.string(),
  roleArc: z.array(zSceneRole),
  grammarTargets: z.object({
    focalOwners: z.record(zFocalOwner, z.number()),
    minDistinctFamilies: z.number().int().nonnegative(),
  }),
});
export type ActPlan = z.infer<typeof zActPlan>;

export const zVisualLedger = z.object({
  recentFocalOwners: z.array(zFocalOwner),
  recentComponents: z.array(z.string()),
  componentUseCounts: z.record(z.string(), z.number()),
});
export type VisualLedger = z.infer<typeof zVisualLedger>;
