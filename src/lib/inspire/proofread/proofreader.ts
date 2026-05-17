import { traceable } from "langsmith/traceable";
import type { LongformPlan } from "../longform-narration-prompt";
import type { ResearchBundle } from "../research/research-schema";
import type { ProofreadFindings, ChapterProofreadResult, CrossChapterGateResult } from "./proofread-types";
import type { GateNote } from "../gates/gate-types";
import { runCitationFidelityGate } from "./citation-fidelity-gate";
import { runInternalConsistencyGate } from "./internal-consistency-gate";
import { runSeedPayoffGate } from "./seed-payoff-gate";
import { runEmotionalArcGate } from "./emotional-arc-gate";
import { runThroughLineGate } from "./through-line-gate";
import { runOpenerDiversityCheck } from "./opener-diversity-gate";
import { enrichCurrentRun } from "../../tracing";

export interface ProofreadOptions {
  verbose?: boolean;
}

/**
 * Run the cross-chapter proofread pass.
 * Returns findings indicating which chapters need re-drafts.
 */
async function proofreadScriptImpl(
  chapters: readonly string[],
  plan: LongformPlan,
  research: ResearchBundle,
  opts?: ProofreadOptions,
): Promise<ProofreadFindings> {
  enrichCurrentRun({ phase: "proofread" });
  const verbose = opts?.verbose ?? false;

  if (verbose) {
    console.log(`  [proofread] running cross-chapter gates on ${chapters.length} chapters...`);
  }

  // Deterministic gate: opener diversity (sync, no async needed)
  const openerDiversityResult = runOpenerDiversityCheck(chapters);

  // Gate 1: Citation fidelity (deterministic)
  const citationResults = runCitationFidelityGate(chapters, research);

  // Gates 2-5: LLM judges (run in parallel)
  const [consistencyResults, seedResults, emotionalArcResults, throughLineResult] =
    await Promise.all([
      runInternalConsistencyGate(chapters, { verbose }),
      runSeedPayoffGate(chapters, { verbose }),
      runEmotionalArcGate(chapters, plan, { verbose }),
      runThroughLineGate(chapters, { verbose }),
    ]);

  // Assemble per-chapter results
  const perChapter: ChapterProofreadResult[] = chapters.map((_, idx) => ({
    chapterIndex: idx,
    citationFidelity: citationResults[idx],
    internalConsistency: consistencyResults[idx],
    seedPayoff: seedResults[idx],
    emotionalArc: emotionalArcResults.perChapter[idx],
  }));

  // Determine which chapters need re-drafts
  const redrafts: Array<{ chapterIndex: number; notes: GateNote[] }> = [];

  for (const ch of perChapter) {
    const allNotes = collectBlockingNotes(ch);
    if (allNotes.length > 0) {
      redrafts.push({ chapterIndex: ch.chapterIndex, notes: allNotes });
    }
  }

  // Attach through-line blocking notes to the break chapter (or last chapter as fallback)
  if (!throughLineResult.overall.pass) {
    const targetIdx = throughLineResult.breakChapterIndex ?? chapters.length - 1;
    const existing = redrafts.find((r) => r.chapterIndex === targetIdx);
    if (existing) {
      existing.notes = [...existing.notes, ...throughLineResult.overall.notes];
    } else {
      redrafts.push({ chapterIndex: targetIdx, notes: throughLineResult.overall.notes });
    }
  }

  // Attach opener-diversity blocking notes to the later chapter in each conflict pair
  if (!openerDiversityResult.result.pass) {
    for (const pair of openerDiversityResult.conflictPairs) {
      const targetIdx = pair.laterIdx;
      const pairNotes = openerDiversityResult.result.notes.filter(
        (n) => n.evidence.includes(`Chapter ${pair.laterIdx + 1}`),
      );
      const existing = redrafts.find((r) => r.chapterIndex === targetIdx);
      if (existing) {
        existing.notes = [...existing.notes, ...pairNotes];
      } else if (pairNotes.length > 0) {
        redrafts.push({ chapterIndex: targetIdx, notes: pairNotes });
      }
    }
  }

  const pass = redrafts.length === 0;

  if (verbose) {
    console.log(`  [proofread] ${pass ? "PASS" : "FAIL"} — ${redrafts.length} chapter(s) need redrafts`);
    for (const r of redrafts) {
      console.log(`    ch ${r.chapterIndex + 1}: ${r.notes.length} blocking note(s)`);
    }
  }

  return {
    pass,
    perChapter,
    emotionalArc: emotionalArcResults.overall,
    throughLine: throughLineResult.overall,
    openerDiversity: openerDiversityResult.result,
    redrafts,
  };
}

function collectBlockingNotes(ch: ChapterProofreadResult): GateNote[] {
  const gates: CrossChapterGateResult[] = [
    ch.citationFidelity,
    ch.internalConsistency,
    ch.seedPayoff,
    ch.emotionalArc,
  ];
  return gates.flatMap((g) => g.notes.filter((n) => n.severity === "block"));
}

export const proofreadScript = traceable(proofreadScriptImpl, {
  name: "proofreadScript",
  run_type: "chain",
}) as typeof proofreadScriptImpl;
