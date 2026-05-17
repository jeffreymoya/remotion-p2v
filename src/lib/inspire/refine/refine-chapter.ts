import type { Gate, GateContext, AggregateGateResult, GateNote } from "../gates/gate-types";
import {
  runGates,
  ALL_DETERMINISTIC_GATES,
  ALL_LLM_GATES,
  FINAL_LINT_GATES,
} from "../gates/run-gates";
import { LlmBudgetTracker } from "../gates/llm/llm-gate-runner";
import { reviseChapter } from "./revise-chapter-prompt";
import { traceable } from "langsmith/traceable";
import fs from "node:fs";
import type { PolarityArc, TargetFeeling } from "../longform-narration-prompt";
import { enrichCurrentRun } from "../../tracing";

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
  targetFeeling?: TargetFeeling;
  recognitionMoment?: string;
  polarityArc?: PolarityArc;
  /** Slug for writing refine-log artifacts */
  slug?: string;
  /** Extra notes injected before the first revision (e.g. from proofreader). Forces at least one revision. */
  additionalNotes?: GateNote[];
  /** Prior chapter texts for continuity context in revisions */
  priorChapters?: readonly string[];
}

export interface RefineResult {
  final: string;
  revisions: number;
  lastResult: AggregateGateResult;
}

export async function refineChapterImpl(
  ctx: GateContext,
  initialDraft: string,
  opts: RefineChapterOptions,
): Promise<RefineResult> {
  enrichCurrentRun({ slug: ctx.slug, topic: opts.topic, phase: "refine", chapterRole: ctx.chapterRole });
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

  // If additional notes are injected (e.g. from proofreader), prepend them as blocking
  // and force at least one revision regardless of gate outcome.
  const injectedNotes: GateNote[] = opts.additionalNotes ?? [];
  if (injectedNotes.length > 0) {
    detResult = {
      ...detResult,
      pass: false,
      blockingNotes: [...injectedNotes, ...detResult.blockingNotes],
    };
    bestBlockCount = detResult.blockingNotes.length;
  }

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
        targetFeeling: opts.targetFeeling,
        recognitionMoment: opts.recognitionMoment,
        polarityArc: opts.polarityArc,
        priorChapters: opts.priorChapters,
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
            targetFeeling: opts.targetFeeling,
            recognitionMoment: opts.recognitionMoment,
            polarityArc: opts.polarityArc,
            priorChapters: opts.priorChapters,
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
        console.log(`  [refine] llm gate budget exhausted — downgrading non-resonance blockers to warn`);
        lastResult = downgradeBlockingToWarn(llmResult, detResult);
      } else {
        lastResult = mergeResults(detResult, llmResult);
      }
    }
  }

  if (detResult.pass && FINAL_LINT_GATES.length > 0) {
    const lintResult = await runGates(draft, ctx, FINAL_LINT_GATES);
    const advisoryLint = downgradeAggregateToWarn(lintResult);

    if (opts.verbose) {
      logGateResult(revision, advisoryLint, "final-lint");
    }

    revisionLog.push({
      revision,
      phase: "final-lint",
      blocking: 0,
      warn: advisoryLint.warnNotes.length,
    });

    lastResult = mergeResults(lastResult, advisoryLint);
  }

  // Write refine-log artifact
  if (opts.slug) {
    const logPath = `prompts/inspire/${opts.slug}-refine-log.json`;
    fs.mkdirSync("prompts/inspire", { recursive: true });
    const unresolved = lastResult.blockingNotes.filter((note) => note.gate === "resonance");
    const finalLintWarnings = lastResult.warnNotes.filter(
      (note) => FINAL_LINT_GATES.some((gate) => gate.name === note.gate),
    );
    fs.writeFileSync(
      logPath,
      JSON.stringify({
        revisionLog,
        finalPass: lastResult.pass,
        unresolved,
        finalLintWarnings,
      }, null, 2),
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
  const unresolvedBlocking = llmResult.blockingNotes.filter((note) => note.gate === "resonance");
  const downgradedNotes: GateNote[] = llmResult.blockingNotes
    .filter((note) => note.gate !== "resonance")
    .map((n) => ({
    ...n,
    severity: "warn" as const,
    }));

  return {
    pass: unresolvedBlocking.length === 0,
    results: [...detResult.results, ...llmResult.results],
    blockingNotes: [...detResult.blockingNotes, ...unresolvedBlocking],
    warnNotes: [...detResult.warnNotes, ...llmResult.warnNotes, ...downgradedNotes],
  };
}

function downgradeAggregateToWarn(result: AggregateGateResult): AggregateGateResult {
  const warnNotes = [
    ...result.warnNotes,
    ...result.blockingNotes.map((note) => ({
      ...note,
      severity: "warn" as const,
    })),
  ];

  return {
    pass: true,
    results: result.results.map((gateResult) => ({
      ...gateResult,
      pass: true,
      notes: gateResult.notes.map((note) => ({
        ...note,
        severity: "warn" as const,
      })),
    })),
    blockingNotes: [],
    warnNotes,
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

export const refineChapter = traceable(refineChapterImpl, {
  name: "refineChapter",
  run_type: "chain",
}) as typeof refineChapterImpl;
