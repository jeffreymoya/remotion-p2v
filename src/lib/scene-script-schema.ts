import { z } from "zod";

// ── Shared ──────────────────────────────────────────────────────────────
const FrameRange = z.tuple([z.number().int(), z.number().int()]);

const AssetRef = z.object({
  label: z.string(),
  role: z.enum(["background", "animated_object", "static_overlay", "screen_mockup"]),
  path: z.string().optional(),
  cutoutPath: z.string().optional(),
});

// ── Hook blocks ─────────────────────────────────────────────────────────
const ContradictionHookBlock = z.object({
  type: z.literal("ContradictionHook"),
  frameRange: FrameRange,
  setup: z.string(),
  reveal: z.string(),
  style: z.enum(["stark", "split"]).default("stark"),
});

const CostOfIgnoranceHookBlock = z.object({
  type: z.literal("CostOfIgnoranceHook"),
  frameRange: FrameRange,
  cost: z.string(),
  who: z.string().optional(),
});

const HiddenMechanismHookBlock = z.object({
  type: z.literal("HiddenMechanismHook"),
  frameRange: FrameRange,
  headline: z.string(),
  teaser: z.string(),
});

const MythVsEvidenceHookBlock = z.object({
  type: z.literal("MythVsEvidenceHook"),
  frameRange: FrameRange,
  myth: z.string(),
  evidence: z.string(),
});

// ── Structure blocks ────────────────────────────────────────────────────
const PromiseCardBlock = z.object({
  type: z.literal("PromiseCard"),
  frameRange: FrameRange,
  promise: z.string(),
  bullets: z.array(z.string()).optional(),
});

const ContextCardBlock = z.object({
  type: z.literal("ContextCard"),
  frameRange: FrameRange,
  body: z.string(),
});

// ── Visual-role blocks ──────────────────────────────────────────────────
const DiagramSceneBlock = z.object({
  type: z.literal("DiagramScene"),
  frameRange: FrameRange,
  title: z.string().optional(),
  nodes: z.array(z.object({ label: z.string(), x: z.number(), y: z.number() })),
  edges: z.array(z.object({ from: z.string(), to: z.string(), label: z.string().optional() })).optional(),
  annotation: z.string().optional(),
});

const ComparisonSplitBlock = z.object({
  type: z.literal("ComparisonSplit"),
  frameRange: FrameRange,
  leftLabel: z.string(),
  rightLabel: z.string(),
  rows: z.array(z.object({ label: z.string(), left: z.string(), right: z.string() })),
  verdict: z.string().optional(),
});

const BRollBlock = z.object({
  type: z.literal("BRoll"),
  frameRange: FrameRange,
  backgroundAsset: z.string(),
  overlayAssets: z.array(z.object({
    label: z.string(),
    x: z.number(),
    y: z.number(),
    scale: z.number().default(1),
    entrance: z.enum(["fadeIn", "slideUp", "slideLeft", "springPop"]).default("fadeIn"),
    entranceFrame: z.number().int(),
  })).optional(),
  caption: z.string().optional(),
});

const CalloutBlock = z.object({
  type: z.literal("Callout"),
  frameRange: FrameRange,
  phrase: z.string(),
  style: z.enum(["fullscreen", "overlay", "card"]).default("card"),
  backgroundAsset: z.string().optional(),
  lines: z.array(z.object({
    text: z.string(),
    icon: z.string().optional(),
    color: z.string().optional(),
  })).optional(),
});

// ── Retention beat blocks ───────────────────────────────────────────────
const MicroQuestionBlock = z.object({
  type: z.literal("MicroQuestion"),
  frameRange: FrameRange,
  question: z.string(),
  questions: z.array(z.string()).optional(),
  style: z.enum(["typewriter", "fade"]).default("typewriter"),
});

const ContrastRevealBlock = z.object({
  type: z.literal("ContrastReveal"),
  frameRange: FrameRange,
  setup: z.string(),
  reveal: z.string(),
});

const RevealBlock = z.object({
  type: z.literal("Reveal"),
  frameRange: FrameRange,
  headline: z.string(),
  body: z.string().optional(),
});

const ReframeBlock = z.object({
  type: z.literal("Reframe"),
  frameRange: FrameRange,
  oldFrame: z.string(),
  newFrame: z.string(),
});

const MiniPayoffBlock = z.object({
  type: z.literal("MiniPayoff"),
  frameRange: FrameRange,
  rule: z.string(),
  bullets: z.array(z.string()).optional(),
});

const ForeshadowBlock = z.object({
  type: z.literal("Foreshadow"),
  frameRange: FrameRange,
  tease: z.string(),
});

// ── Escape hatch ────────────────────────────────────────────────────────
const CustomSceneBlock = z.object({
  type: z.literal("CustomScene"),
  frameRange: FrameRange,
  description: z.string(),
  config: z.record(z.string(), z.unknown()),
});

// ── Root schema ─────────────────────────────────────────────────────────
export const SceneBlock = z.discriminatedUnion("type", [
  ContradictionHookBlock,
  CostOfIgnoranceHookBlock,
  HiddenMechanismHookBlock,
  MythVsEvidenceHookBlock,
  PromiseCardBlock,
  ContextCardBlock,
  DiagramSceneBlock,
  ComparisonSplitBlock,
  BRollBlock,
  CalloutBlock,
  MicroQuestionBlock,
  ContrastRevealBlock,
  RevealBlock,
  ReframeBlock,
  MiniPayoffBlock,
  ForeshadowBlock,
  CustomSceneBlock,
]);

export const SceneScriptSchema = z.object({
  schemaVersion: z.literal(1),
  title: z.string(),
  slug: z.string(),
  durationInFrames: z.number().int().positive(),
  fps: z.literal(30),
  width: z.literal(1920),
  height: z.literal(1080),
  crossFadeFrames: z.number().int().nonnegative().default(15),
  assets: z.array(AssetRef),
  scenes: z.array(SceneBlock),
});

export type SceneScript = z.infer<typeof SceneScriptSchema>;
export type SceneBlockType = z.infer<typeof SceneBlock>;
export type AssetRefType = z.infer<typeof AssetRef>;
