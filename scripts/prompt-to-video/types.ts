import type { TrendingTopic, TopicSuggestion } from "@/src/lib/storyflow/discovery";

export interface PipelineConfig {
  count: number;
  geo: string;
  outDir: string;
  verbose: boolean;
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


export type ReasoningEffort = "low" | "medium" | "high";

export interface DeepSeekCallOptions {
  effort: ReasoningEffort;
}

export interface DeepSeekMessage {
  role: "system" | "user";
  content: string;
}
