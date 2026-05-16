export interface GateContext {
  topic: string;
  slug: string;
  chapterIndex: number;
  chapterCount: number;
  chapterRole: "open" | "build" | "complicate" | "turn" | "land";
  priorChapters: string[];
  allowWords?: string[];
}

export interface GateNote {
  gate: string;
  severity: "block" | "warn";
  evidence: string;
  message: string;
  suggestion: string;
}

export interface GateResult {
  gate: string;
  pass: boolean;
  notes: GateNote[];
  metrics?: Record<string, number | string>;
}

export interface Gate {
  name: string;
  kind: "deterministic" | "llm";
  run(narration: string, ctx: GateContext): Promise<GateResult>;
}

export interface AggregateGateResult {
  pass: boolean;
  results: GateResult[];
  blockingNotes: GateNote[];
  warnNotes: GateNote[];
}
