import type { Gate, GateContext, AggregateGateResult } from "../gates/gate-types";
import { runGates, ALL_DETERMINISTIC_GATES } from "../gates/run-gates";
import { reviseChapter } from "./revise-chapter-prompt";
import fs from "node:fs";

export interface RefineChapterOptions {
  maxRevisions: number;
  gates?: readonly Gate[];
  verbose?: boolean;
  /** Chapter metadata for the revision prompt */
  chapterTitle: string;
  chapterRole: string;
  chapterIntent: string;
  sceneSeed: string;
  topic: string;
  wordBudget?: { min: number; max: number };
  /** Slug for writing refine-log artifacts */
  slug?: string;
}

export interface RefineResult {
  final: string;
  revisions: number;
  lastResult: AggregateGateResult;
}

export async function refineChapter(
  ctx: GateContext,
  initialDraft: string,
  opts: RefineChapterOptions,
): Promise<RefineResult> {
  const gates = opts.gates ?? ALL_DETERMINISTIC_GATES;
  const wordBudget = opts.wordBudget ?? { min: 280, max: 420 };
  const revisionLog: Array<{ revision: number; blocking: number; warn: number }> = [];

  let draft = initialDraft;
  let lastResult = await runGates(draft, ctx, gates);
  let bestDraft = draft;
  let bestBlockCount = lastResult.blockingNotes.length;

  if (opts.verbose) {
    logGateResult(0, lastResult);
  }

  revisionLog.push({
    revision: 0,
    blocking: lastResult.blockingNotes.length,
    warn: lastResult.warnNotes.length,
  });

  let revision = 0;
  while (!lastResult.pass && revision < opts.maxRevisions) {
    revision++;
    console.log(
      `  [refine] revision ${revision}/${opts.maxRevisions} — ${lastResult.blockingNotes.length} blocking, ${lastResult.warnNotes.length} warn`,
    );

    // Collect all notes (blocking first, then warn) for the revision prompt
    const allNotes = [...lastResult.blockingNotes, ...lastResult.warnNotes];

    draft = await reviseChapter(
      {
        chapterTitle: opts.chapterTitle,
        chapterRole: opts.chapterRole,
        chapterIntent: opts.chapterIntent,
        sceneSeed: opts.sceneSeed,
        topic: opts.topic,
        previousDraft: draft,
        gateNotes: allNotes,
        wordBudget,
      },
      { verbose: opts.verbose },
    );

    lastResult = await runGates(draft, ctx, gates);

    if (opts.verbose) {
      logGateResult(revision, lastResult);
    }

    revisionLog.push({
      revision,
      blocking: lastResult.blockingNotes.length,
      warn: lastResult.warnNotes.length,
    });

    // Track least-bad draft
    if (lastResult.blockingNotes.length < bestBlockCount) {
      bestDraft = draft;
      bestBlockCount = lastResult.blockingNotes.length;
    }
  }

  // Use least-bad draft if gates still don't pass
  const finalDraft = lastResult.pass ? draft : bestDraft;
  if (!lastResult.pass) {
    console.log(
      `  [refine] revision budget exhausted — using least-bad draft (${bestBlockCount} blocking notes remaining)`,
    );
    // Re-run gates on the best draft for accurate final result
    lastResult = await runGates(finalDraft, ctx, gates);
  }

  // Write refine-log artifact
  if (opts.slug) {
    const logPath = `prompts/inspire/${opts.slug}-refine-log.json`;
    fs.mkdirSync("prompts/inspire", { recursive: true });
    fs.writeFileSync(
      logPath,
      JSON.stringify({ revisionLog, finalPass: lastResult.pass }, null, 2),
    );
  }

  return {
    final: finalDraft,
    revisions: revision,
    lastResult,
  };
}

function logGateResult(revision: number, result: AggregateGateResult): void {
  const label = revision === 0 ? "initial" : `revision ${revision}`;
  console.log(`  [refine] ${label}: ${result.pass ? "PASS" : "FAIL"}`);
  for (const r of result.results) {
    const metrics = r.metrics
      ? ` (${Object.entries(r.metrics).map(([k, v]) => `${k}=${v}`).join(", ")})`
      : "";
    console.log(`    ${r.pass ? "✓" : "✗"} ${r.gate}${metrics}`);
  }
}
