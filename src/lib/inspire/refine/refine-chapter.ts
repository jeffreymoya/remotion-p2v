import type { Gate, GateContext, AggregateGateResult, GateNote } from "../gates/gate-types";
import { runGates, ALL_DETERMINISTIC_GATES, ALL_LLM_GATES } from "../gates/run-gates";
import { LlmBudgetTracker } from "../gates/llm/llm-gate-runner";
import { reviseChapter } from "./revise-chapter-prompt";
import fs from "node:fs";

export interface RefineChapterOptions {
  maxRevisions: number;
  gates?: readonly Gate[];
  llmGates?: readonly Gate[];
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
  const detGates = opts.gates ?? ALL_DETERMINISTIC_GATES;
  const llmGates = opts.llmGates ?? ALL_LLM_GATES;
  const wordBudget = opts.wordBudget ?? { min: 280, max: 420 };
  const revisionLog: Array<{ revision: number; phase: string; blocking: number; warn: number }> = [];
  const budgetTracker = new LlmBudgetTracker();

  let draft = initialDraft;
  let revision = 0;

  // Phase A: deterministic gates
  let detResult = await runGates(draft, ctx, detGates);
  let lastResult = detResult;
  let bestDraft = draft;
  let bestBlockCount = detResult.blockingNotes.length;

  if (opts.verbose) {
    logGateResult(0, detResult, "deterministic");
  }

  revisionLog.push({
    revision: 0,
    phase: "deterministic",
    blocking: detResult.blockingNotes.length,
    warn: detResult.warnNotes.length,
  });

  // Deterministic revision loop
  while (!detResult.pass && revision < opts.maxRevisions) {
    revision++;
    console.log(
      `  [refine] det revision ${revision}/${opts.maxRevisions} — ${detResult.blockingNotes.length} blocking, ${detResult.warnNotes.length} warn`,
    );

    const allNotes = [...detResult.blockingNotes, ...detResult.warnNotes];

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

    detResult = await runGates(draft, ctx, detGates);
    lastResult = detResult;

    if (opts.verbose) {
      logGateResult(revision, detResult, "deterministic");
    }

    revisionLog.push({
      revision,
      phase: "deterministic",
      blocking: detResult.blockingNotes.length,
      warn: detResult.warnNotes.length,
    });

    if (detResult.blockingNotes.length < bestBlockCount) {
      bestDraft = draft;
      bestBlockCount = detResult.blockingNotes.length;
    }
  }

  // Use least-bad draft if deterministic gates still don't pass
  if (!detResult.pass) {
    console.log(
      `  [refine] deterministic revision budget exhausted — using least-bad draft (${bestBlockCount} blocking)`,
    );
    draft = bestDraft;
    detResult = await runGates(draft, ctx, detGates);
    lastResult = detResult;
  }

  // Phase B: LLM judge gates (only if deterministic passed and we have LLM gates)
  if (detResult.pass && llmGates.length > 0) {
    // Filter to gates that still have budget
    const eligibleLlmGates = llmGates.filter((g) => budgetTracker.hasRemaining(g.name));

    if (eligibleLlmGates.length > 0) {
      let llmResult = await runGates(draft, ctx, eligibleLlmGates);
      for (const g of eligibleLlmGates) {
        budgetTracker.record(g.name);
      }

      if (opts.verbose) {
        logGateResult(revision, llmResult, "llm");
      }

      revisionLog.push({
        revision,
        phase: "llm",
        blocking: llmResult.blockingNotes.length,
        warn: llmResult.warnNotes.length,
      });

      // LLM revision loop — revise for LLM failures with remaining budget
      let llmRevision = 0;
      const llmMaxRevisions = opts.maxRevisions - revision;
      while (!llmResult.pass && llmRevision < llmMaxRevisions) {
        llmRevision++;
        revision++;
        console.log(
          `  [refine] llm revision ${llmRevision} — ${llmResult.blockingNotes.length} blocking, ${llmResult.warnNotes.length} warn`,
        );

        const allNotes = [...llmResult.blockingNotes, ...llmResult.warnNotes];

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

        // Re-run deterministic gates first — revision must not regress
        detResult = await runGates(draft, ctx, detGates);
        if (!detResult.pass) {
          // LLM revision broke deterministic — revert to best and stop
          console.log(`  [refine] llm revision regressed deterministic gates — stopping`);
          draft = bestDraft;
          lastResult = await runGates(draft, ctx, detGates);
          break;
        }

        // Re-run LLM gates with budget check
        const stillEligible = llmGates.filter((g) => budgetTracker.hasRemaining(g.name));
        if (stillEligible.length === 0) break;

        llmResult = await runGates(draft, ctx, stillEligible);
        for (const g of stillEligible) {
          budgetTracker.record(g.name);
        }

        if (opts.verbose) {
          logGateResult(revision, llmResult, "llm");
        }

        revisionLog.push({
          revision,
          phase: "llm",
          blocking: llmResult.blockingNotes.length,
          warn: llmResult.warnNotes.length,
        });
      }

      // Downgrade remaining blockers to warn if budget exhausted
      if (!llmResult.pass) {
        console.log(`  [refine] llm gate budget exhausted — downgrading remaining blockers to warn`);
        lastResult = downgradeBlockingToWarn(llmResult, detResult);
      } else {
        lastResult = mergeResults(detResult, llmResult);
      }
    }
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
    final: draft,
    revisions: revision,
    lastResult,
  };
}

/** Downgrade all blocking notes from LLM gates to warn severity. */
function downgradeBlockingToWarn(
  llmResult: AggregateGateResult,
  detResult: AggregateGateResult,
): AggregateGateResult {
  const downgradedNotes: GateNote[] = llmResult.blockingNotes.map((n) => ({
    ...n,
    severity: "warn" as const,
  }));

  return {
    pass: true,
    results: [...detResult.results, ...llmResult.results],
    blockingNotes: [],
    warnNotes: [...detResult.warnNotes, ...llmResult.warnNotes, ...downgradedNotes],
  };
}

/** Merge deterministic and LLM results into one aggregate. */
function mergeResults(
  detResult: AggregateGateResult,
  llmResult: AggregateGateResult,
): AggregateGateResult {
  return {
    pass: detResult.pass && llmResult.pass,
    results: [...detResult.results, ...llmResult.results],
    blockingNotes: [...detResult.blockingNotes, ...llmResult.blockingNotes],
    warnNotes: [...detResult.warnNotes, ...llmResult.warnNotes],
  };
}

function logGateResult(revision: number, result: AggregateGateResult, phase?: string): void {
  const label = revision === 0 ? "initial" : `revision ${revision}`;
  const phaseLabel = phase ? ` [${phase}]` : "";
  console.log(`  [refine] ${label}${phaseLabel}: ${result.pass ? "PASS" : "FAIL"}`);
  for (const r of result.results) {
    const metrics = r.metrics
      ? ` (${Object.entries(r.metrics).map(([k, v]) => `${k}=${v}`).join(", ")})`
      : "";
    console.log(`    ${r.pass ? "✓" : "✗"} ${r.gate}${metrics}`);
  }
}
