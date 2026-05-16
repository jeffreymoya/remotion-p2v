import type { GateNote } from "../gates/gate-types";

export interface CrossChapterGateResult {
  gate: string;
  pass: boolean;
  notes: GateNote[];
}

export interface ChapterProofreadResult {
  chapterIndex: number;
  citationFidelity: CrossChapterGateResult;
  internalConsistency: CrossChapterGateResult;
  seedPayoff: CrossChapterGateResult;
  throughLine: CrossChapterGateResult;
  escalation: CrossChapterGateResult;
}

export interface ProofreadFindings {
  pass: boolean;
  perChapter: ChapterProofreadResult[];
  redrafts: Array<{
    chapterIndex: number;
    notes: GateNote[];
  }>;
}
