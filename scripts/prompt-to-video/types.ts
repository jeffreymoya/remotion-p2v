import type { TrendingTopic, TopicSuggestion } from "@/src/lib/storyflow/discovery";

export interface PipelineConfig {
  count: number;
  geo: string;
  outDir: string;
  verbose: boolean;
  studio: boolean;
  runId: string | null;
}

export interface Stage1Output {
  topic: TrendingTopic;
  suggestions: TopicSuggestion[];
}

export type ScriptFormat =
  | "myth-vs-reality"
  | "investigation"
  | "explainer"
  | "decision-framework";

export interface Stage2Output {
  topic: TrendingTopic;
  angle: TopicSuggestion;
  script: string;
  format: ScriptFormat;
}

export interface ScriptSegment {
  label: string;
  beat: string;
  text: string;
  durationSec: number;
}

export interface Stage3Output {
  script: Stage2Output;
  groups: ScriptSegment[];
}

export interface Stage4Output {
  script: Stage2Output;
  groups: ScriptSegment[];
  remotionPrompt: string;
}

export type GeneratedSceneVisualRole =
  | "hook-card"
  | "mechanism-diagram"
  | "evidence-comparison"
  | "tradeoff-split"
  | "payoff-callout";

export type GeneratedSceneTransition = "fade" | "wipe" | "push" | "none";

export interface GeneratedScenePalette {
  background: string;
  foreground: string;
  accent: string;
  muted: string;
}

export interface GeneratedSceneVisual {
  role: GeneratedSceneVisualRole;
  headline: string;
  callouts: string[];
}

export interface GeneratedScene {
  id: string;
  title: string;
  narrationSummary: string;
  visual: GeneratedSceneVisual;
  durationFrames: number;
  palette: GeneratedScenePalette;
  transition: GeneratedSceneTransition;
}

export interface GeneratedVideoRun {
  runId: string;
  title: string;
  fps: number;
  width: number;
  height: number;
  totalDurationFrames: number;
  generatedAt: string;
  scenes: GeneratedScene[];
}

export interface CompositionWriteResult {
  run: GeneratedVideoRun;
  compositionPath: string;
  pointerPath: string;
}

export type ReasoningEffort = "low" | "medium" | "high";

export interface DeepSeekCallOptions {
  effort: ReasoningEffort;
}

export interface DeepSeekMessage {
  role: "system" | "user";
  content: string;
}
