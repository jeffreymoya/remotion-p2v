import type { Gate, GateContext, AggregateGateResult } from "./gate-types";
import { genreTellsGate } from "./deterministic/genre-tells-gate";
import { sermonRatioGate } from "./deterministic/sermon-ratio-gate";
import { specificityGate } from "./deterministic/specificity-gate";
import { simplicityGate } from "./deterministic/simplicity-gate";
import { prosodyMarksGate } from "./deterministic/prosody-marks-gate";
import { cohesionGate } from "./llm/cohesion-gate";
import { attentionCurveGate } from "./llm/attention-curve-gate";
import { freshnessGate } from "./llm/freshness-gate";

export const ALL_DETERMINISTIC_GATES: readonly Gate[] = [
  genreTellsGate,
  sermonRatioGate,
  specificityGate,
  simplicityGate,
  prosodyMarksGate,
] as const;

export const ALL_LLM_GATES: readonly Gate[] = [
  cohesionGate,
  attentionCurveGate,
  freshnessGate,
] as const;

export async function runGates(
  narration: string,
  ctx: GateContext,
  gates: readonly Gate[] = ALL_DETERMINISTIC_GATES,
): Promise<AggregateGateResult> {
  const results = await Promise.all(
    gates.map((gate) => gate.run(narration, ctx)),
  );

  const blockingNotes = results.flatMap((r) =>
    r.notes.filter((n) => n.severity === "block"),
  );
  const warnNotes = results.flatMap((r) =>
    r.notes.filter((n) => n.severity === "warn"),
  );

  return {
    pass: blockingNotes.length === 0,
    results,
    blockingNotes,
    warnNotes,
  };
}
