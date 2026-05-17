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
  emotionalArc: CrossChapterGateResult;
}

export interface ProofreadFindings {
  pass: boolean;
  perChapter: ChapterProofreadResult[];
  emotionalArc?: CrossChapterGateResult;
  throughLine?: CrossChapterGateResult;
  openerDiversity?: CrossChapterGateResult;
  redrafts: Array<{
    chapterIndex: number;
    notes: GateNote[];
  }>;
}
