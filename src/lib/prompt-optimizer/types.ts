export type DimensionName =
  | "speakability"
  | "rhythm_variation"
  | "conversational_authenticity"
  | "hook_strength"
  | "emotional_arc"
  | "audience_retention"
  | "coherence_flow"
  | "memorability";

export type JudgeName = "codex" | "claude";

export type DimensionScore = {
  score: number;
  rationale: string;
};

export type JudgeResult = {
  judge: JudgeName;
  dimensions?: Record<DimensionName, DimensionScore>;
  failed: boolean;
  error?: string;
  rawResponse?: string;
  attempts: number;
};

export type VariationResult = {
  loop: number;
  variation: number;
  prompt: string;
  script: string | null;
  scriptError?: string;
  judgeResults: JudgeResult[];
  aggregated?: Record<DimensionName, number>;
  overall?: number;
  validJudgeCount: number;
  skipped: boolean;
  skipReason?: string;
};

export type WinnerResult = VariationResult & {
  aggregated: Record<DimensionName, number>;
  overall: number;
};

export type LoopResult = {
  loop: number;
  variations: VariationResult[];
  winnerIndex: number | null;
};

export type ShortlistEntry = {
  rank: number;
  loop: number;
  variation: number;
  overall: number;
  scriptPath: string;
  promptPath: string;
  audioPath?: string;
  audioError?: string;
};

export type SynthesisResult = {
  inputPath: string;
  outputPath: string;
  success: boolean;
  error?: string;
};

export type OptimizerModelConfig = {
  claudeMetaModel: "opus";
  codexJudgeModel: "gpt-5.4";
  geminiScriptModel: string;
  claudeJudgeModel: string;
};

export type OptimizerConfig = {
  variationCount: number;
  loopCount: number;
  scriptSamplesPerVariation: number;
  geo: "US";
  topic: string;
  topicContext: string;
  maxContextHeadlines: number;
  dimensionWeights: Record<DimensionName, number>;
  modelConfig: OptimizerModelConfig;
  synthesize: boolean;
  empirical: boolean;
};

export type CliVersions = {
  claude: string;
  codex: string;
  gemini: string;
};

export type CliRuntimeContext = {
  addRuntimeNote: (note: string) => void | Promise<void>;
};

export type CliJsonResult<T> = {
  data: T;
  rawResponse: string;
  stderr?: string;
  attempts: number;
};

export type CliTextResult = {
  text: string;
  stderr?: string;
  attempts: number;
};

export const DEFAULT_DIMENSION_WEIGHTS: Record<DimensionName, number> = {
  speakability: 2.0,
  rhythm_variation: 2.0,
  conversational_authenticity: 1.5,
  hook_strength: 1.5,
  emotional_arc: 1.0,
  audience_retention: 1.0,
  coherence_flow: 1.0,
  memorability: 0.5,
};

export function getDefaultModelConfig(): OptimizerModelConfig {
  return {
    claudeMetaModel: "opus",
    codexJudgeModel: "gpt-5.4",
    geminiScriptModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    claudeJudgeModel: process.env.CLAUDE_JUDGE_MODEL ?? "opus",
  };
}

export const DIMENSION_NAMES = Object.keys(DEFAULT_DIMENSION_WEIGHTS) as DimensionName[];
