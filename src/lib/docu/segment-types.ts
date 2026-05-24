export interface DocuSegmentPlan {
  index: number;
  title: string;
  role: "hook" | "context" | "data" | "consequence" | "cta" | "build" | "turn";
  intent: string;
  targetSentenceCount: number;
  assignedAnchorIds: string[];
}

export interface DocuSegmentMeta {
  index: number;
  title: string;
  role: string;
  firstSentenceIndex: number;
  lastSentenceIndex: number;
  startFrame: number;
  endFrame: number;
}
