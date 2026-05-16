import type { LongformPlan } from "../longform-narration-prompt";
import type { ResearchBundle } from "../research/research-schema";
import type { ProofreadFindings, ChapterProofreadResult, CrossChapterGateResult } from "./proofread-types";
import type { GateNote } from "../gates/gate-types";
import { runCitationFidelityGate } from "./citation-fidelity-gate";
import { runInternalConsistencyGate } from "./internal-consistency-gate";
import { runSeedPayoffGate } from "./seed-payoff-gate";
import { runThroughLineGate } from "./through-line-gate";
import { runEscalationGate } from "./escalation-gate";

export interface ProofreadOptions {
  verbose?: boolean;
}

/**
 * Run the cross-chapter proofread pass: five judgments over all chapters.
 * Returns findings indicating which chapters need re-drafts.
 */
export async function proofreadScript(
  chapters: readonly string[],
  plan: LongformPlan,
  research: ResearchBundle,
  opts?: ProofreadOptions,
): Promise<ProofreadFindings> {
  const verbose = opts?.verbose ?? false;

  if (verbose) {
    console.log(`  [proofread] running 5 cross-chapter gates on ${chapters.length} chapters...`);
  }

  // Gate 1: Citation fidelity (deterministic)
  const citationResults = runCitationFidelityGate(chapters, research);

  // Gates 2-5: LLM judges (run in parallel)
  const [consistencyResults, seedResults, throughLineResult, escalationResults] =
    await Promise.all([
      runInternalConsistencyGate(chapters, { verbose }),
      runSeedPayoffGate(chapters, { verbose }),
      runThroughLineGate(chapters, { verbose }),
      runEscalationGate(chapters, { verbose }),
    ]);

  // Assemble per-chapter results
  const perChapter: ChapterProofreadResult[] = chapters.map((_, idx) => ({
    chapterIndex: idx,
    citationFidelity: citationResults[idx],
    internalConsistency: consistencyResults[idx],
    seedPayoff: seedResults[idx],
    throughLine: throughLineResult, // Same result applies to all chapters
    escalation: escalationResults[idx],
  }));

  // Determine which chapters need re-drafts
  const redrafts: Array<{ chapterIndex: number; notes: GateNote[] }> = [];

  for (const ch of perChapter) {
    const allNotes = collectBlockingNotes(ch);
    if (allNotes.length > 0) {
      redrafts.push({ chapterIndex: ch.chapterIndex, notes: allNotes });
    }
  }

  const pass = redrafts.length === 0;

  if (verbose) {
    console.log(`  [proofread] ${pass ? "PASS" : "FAIL"} — ${redrafts.length} chapter(s) need redrafts`);
    for (const r of redrafts) {
      console.log(`    ch ${r.chapterIndex + 1}: ${r.notes.length} blocking note(s)`);
    }
  }

  return { pass, perChapter, redrafts };
}

function collectBlockingNotes(ch: ChapterProofreadResult): GateNote[] {
  const gates: CrossChapterGateResult[] = [
    ch.citationFidelity,
    ch.internalConsistency,
    ch.seedPayoff,
    ch.throughLine,
    ch.escalation,
  ];
  return gates.flatMap((g) => g.notes.filter((n) => n.severity === "block"));
}
