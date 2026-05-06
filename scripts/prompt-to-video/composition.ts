/* eslint-disable @remotion/non-pure-animation */
import fs from "node:fs/promises";
import path from "node:path";

import {
  generatedVideoRunSchema,
  type GeneratedSceneVisualRole,
  type GeneratedVideoRun,
} from "@/src/components/prompt-to-video/schema";

import type {
  CompositionWriteResult,
  GeneratedScene,
  GeneratedScenePalette,
  GeneratedSceneTransition,
  Stage4Output,
} from "./types";

const DEFAULT_FPS = 30;
const DEFAULT_WIDTH = 1920;
const DEFAULT_HEIGHT = 1080;
const DEFAULT_SCENE_DURATION_FRAMES = 180;
const PUBLIC_GENERATED_ROOT = path.join(
  "public",
  "generated",
  "prompt-to-video"
);
const SAFE_ID_PATTERN = /[^a-z0-9-]/g;
const ROLE_BY_INDEX: GeneratedSceneVisualRole[] = [
  "hook-card",
  "mechanism-diagram",
  "evidence-comparison",
  "tradeoff-split",
  "payoff-callout",
];
const DEFAULT_PALETTES: GeneratedScenePalette[] = [
  {
    background: "#111827",
    foreground: "#F9FAFB",
    accent: "#38BDF8",
    muted: "#CBD5E1",
  },
  {
    background: "#1F2937",
    foreground: "#F8FAFC",
    accent: "#F97316",
    muted: "#D1D5DB",
  },
  {
    background: "#0F172A",
    foreground: "#F8FAFC",
    accent: "#A3E635",
    muted: "#C7D2FE",
  },
];
const TRANSITIONS: GeneratedSceneTransition[] = ["fade", "wipe", "push", "none"];

interface RawCompositionScene {
  title?: unknown;
  narrationSummary?: unknown;
  visualRole?: unknown;
  headline?: unknown;
  callouts?: unknown;
  durationFrames?: unknown;
  palette?: unknown;
  transition?: unknown;
}

interface RawCompositionSpec {
  title?: unknown;
  fps?: unknown;
  width?: unknown;
  height?: unknown;
  scenes?: unknown;
}

export function normalizeRunId(runId: string | null): string {
  const raw = runId?.trim() || `run-${Date.now()}`;
  const normalized = raw.toLowerCase().replace(SAFE_ID_PATTERN, "-");
  return normalized.replace(/-+/g, "-").replace(/^-|-$/g, "") || "run";
}

export function stripJsonFences(raw: string): string {
  return raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
}

function assertRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function toPositiveInteger(
  value: unknown,
  fallback: number,
  fieldName: string
): number {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (value === undefined || value === null) return fallback;
  throw new Error(`${fieldName} must be a positive integer`);
}

function toStringList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  return cleaned.length > 0 ? cleaned.slice(0, 6) : fallback;
}

function toRole(value: unknown, index: number): GeneratedSceneVisualRole {
  if (
    value === "hook-card" ||
    value === "mechanism-diagram" ||
    value === "evidence-comparison" ||
    value === "tradeoff-split" ||
    value === "payoff-callout"
  ) {
    return value;
  }
  return ROLE_BY_INDEX[index % ROLE_BY_INDEX.length];
}

function toTransition(value: unknown, index: number): GeneratedSceneTransition {
  if (TRANSITIONS.includes(value as GeneratedSceneTransition)) {
    return value as GeneratedSceneTransition;
  }
  return index === 0 ? "none" : "fade";
}

function toPalette(value: unknown, index: number): GeneratedScenePalette {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const palette = value as Partial<GeneratedScenePalette>;
    if (
      typeof palette.background === "string" &&
      typeof palette.foreground === "string" &&
      typeof palette.accent === "string" &&
      typeof palette.muted === "string"
    ) {
      return {
        background: palette.background,
        foreground: palette.foreground,
        accent: palette.accent,
        muted: palette.muted,
      };
    }
  }
  return DEFAULT_PALETTES[index % DEFAULT_PALETTES.length];
}

function fromRawScene(
  scene: RawCompositionScene,
  source: Stage4Output,
  index: number
): GeneratedScene {
  const fallbackTitle = source.script.angle.title || `Scene ${index + 1}`;
  const fallbackCallouts = source.groups
    .slice(0, 4)
    .map((group) => group.label || group.beat)
    .filter(Boolean);
  const durationFrames = toPositiveInteger(
    scene.durationFrames,
    Math.max(
      DEFAULT_SCENE_DURATION_FRAMES,
      Math.round(
        source.groups.reduce((total, group) => total + group.durationSec, 0) *
          DEFAULT_FPS
      )
    ),
    `scenes[${index}].durationFrames`
  );

  return {
    id: `scene-${String(index + 1).padStart(2, "0")}`,
    title: typeof scene.title === "string" ? scene.title : fallbackTitle,
    narrationSummary:
      typeof scene.narrationSummary === "string"
        ? scene.narrationSummary
        : source.groups.map((group) => group.text).join(" ").slice(0, 220),
    visual: {
      role: toRole(scene.visualRole, index),
      headline:
        typeof scene.headline === "string"
          ? scene.headline
          : source.script.angle.title,
      callouts: toStringList(scene.callouts, fallbackCallouts),
    },
    durationFrames,
    palette: toPalette(scene.palette, index),
    transition: toTransition(scene.transition, index),
  };
}

export function parseCompositionSpec(
  raw: string,
  runId: string,
  sources: Stage4Output[]
): GeneratedVideoRun {
  const parsed = JSON.parse(stripJsonFences(raw)) as RawCompositionSpec;
  const spec = assertRecord(parsed, "Stage 5 composition spec");
  const rawScenes = spec.scenes;
  if (!Array.isArray(rawScenes) || rawScenes.length === 0) {
    throw new Error("Stage 5 composition spec must include a non-empty scenes array");
  }

  const scenes = sources.map((source, index) =>
    fromRawScene((rawScenes[index] ?? {}) as RawCompositionScene, source, index)
  );
  const totalDurationFrames = scenes.reduce(
    (total, scene) => total + scene.durationFrames,
    0
  );
  const run = {
    runId,
    title:
      typeof spec.title === "string" && spec.title.trim()
        ? spec.title.trim()
        : "Generated prompt-to-video composition",
    fps: toPositiveInteger(spec.fps, DEFAULT_FPS, "fps"),
    width: toPositiveInteger(spec.width, DEFAULT_WIDTH, "width"),
    height: toPositiveInteger(spec.height, DEFAULT_HEIGHT, "height"),
    totalDurationFrames,
    generatedAt: new Date().toISOString(),
    scenes,
  };

  return generatedVideoRunSchema.parse(run);
}

export async function writeCompositionArtifacts(
  run: GeneratedVideoRun,
  outDir: string
): Promise<CompositionWriteResult> {
  const runDir = path.join(PUBLIC_GENERATED_ROOT, run.runId);
  await fs.mkdir(runDir, { recursive: true });

  const compositionPath = path.join(runDir, "composition.json");
  await fs.writeFile(compositionPath, `${JSON.stringify(run, null, 2)}\n`, "utf-8");

  await fs.mkdir(outDir, { recursive: true });
  const pointerPath = path.join(outDir, `${run.runId}-studio-run.json`);
  await fs.writeFile(
    pointerPath,
    `${JSON.stringify(
      {
        runId: run.runId,
        compositionId: `prompt-to-video-${run.runId}`,
        compositionPath,
      },
      null,
      2
    )}\n`,
    "utf-8"
  );

  return { run, compositionPath, pointerPath };
}
