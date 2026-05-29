export interface DocuSegmentPlan {
  index: number;
  title: string;
  role?: "hook" | "context" | "data" | "consequence" | "cta" | "build" | "turn";
  intent: string;
  targetSentenceCount: number;
  assignedAnchorIds: string[];
}

export type ArcRole = "hook" | "baseline" | "escalation" | "turn" | "payoff";

export type PrimaryStructure =
  | "scenario-escalation"
  | "disaster-simulation"
  | "case-file-autopsy"
  | "countdown"
  | "comparison-gauntlet"
  | "inside-the-machine"
  | "experiment-challenge"
  | "reveal-ladder";

export type FlipType =
  | "safety-to-danger"
  | "complexity-to-lever"
  | "profit-to-loss"
  | "cheap-to-expensive"
  | "expert-answer-to-fail"
  | "random-to-incentive"
  | "personal-mistake-to-structural-trap";

export type SceneDevice =
  | "what-if-scenario"
  | "countdown"
  | "scale-compression"
  | "contrast"
  | "failed-obvious-answer"
  | "callback-object"
  | "rhetorical-question"
  | "tricolon"
  | "none";

export interface SceneSpec extends DocuSegmentPlan {
  arcRole: ArcRole;
  scenarioPressure: string;
  flipType?: FlipType;
  retentionLoop: string;
  visualBeat: string;
  device: SceneDevice;
  pronoun: "you" | "we" | "they" | "it";
  palette: "cool-tech" | "warm-real";
  emotionalRegister: string;
  flipFromPrior: boolean;
}

export interface StorySpine {
  schemaVersion: 2;
  primaryStructure: PrimaryStructure;
  viewerRole: string;
  caseStudyAgent?: string;
  caseStudyAnchorId?: string;
  scenarioPressure: string;
  hiddenSystem: string;
  centralFlip: string;
  viewerStake: string;
  retentionQuestion: string;
  quoteSceneIndex: number | null;
  segments: SceneSpec[];
}

export interface DocuSegmentMeta {
  index: number;
  title: string;
  role: ArcRole;
  firstSentenceIndex: number;
  lastSentenceIndex: number;
  startFrame: number;
  endFrame: number;
}
