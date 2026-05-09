export type Phase = "narrative" | "tts" | "prompt" | "images" | "code";
export const PHASES: Phase[] = ["narrative", "tts", "prompt", "images", "code"];

export function parsePhase(value: string | undefined): Phase | undefined {
  if (
    value === "narrative" ||
    value === "tts" ||
    value === "prompt" ||
    value === "images" ||
    value === "code"
  ) {
    return value;
  }
  return undefined;
}

export function parseArgs(): {
  segmentIndex: number;
  from: Phase;
  only?: Phase;
  verbose: boolean;
  sceneIndex?: number;
} {
  const args = process.argv.slice(2);
  let segmentIndex = 0;
  let from: Phase = parsePhase(process.env.npm_config_from) ?? "narrative";
  let only = parsePhase(process.env.npm_config_only);
  let verbose = false;
  let sceneIndex: number | undefined;

  for (const arg of args) {
    if (arg.startsWith("--scene=")) {
      const n = parseInt(arg.split("=")[1], 10);
      if (!isNaN(n) && n >= 1) {
        sceneIndex = n;
      } else {
        console.error(`Invalid scene index: ${arg}. Use --scene=N with N >= 1.`);
        process.exit(1);
      }
    } else if (arg.startsWith("--from=")) {
      const phase = arg.split("=")[1];
      const parsedPhase = parsePhase(phase);
      if (parsedPhase) {
        from = parsedPhase;
      } else {
        console.error(
          `Unknown phase: ${phase}. Use --from=narrative|tts|prompt|images|code`,
        );
        process.exit(1);
      }
    } else if (arg.startsWith("--only=")) {
      const phase = arg.split("=")[1];
      const parsedPhase = parsePhase(phase);
      if (parsedPhase) {
        only = parsedPhase;
      } else {
        console.error(
          `Unknown phase: ${phase}. Use --only=narrative|tts|prompt|images|code`,
        );
        process.exit(1);
      }
    } else if (arg === "--verbose" || arg === "-v") {
      verbose = true;
    } else if (!arg.startsWith("--")) {
      const n = parseInt(arg, 10);
      if (!isNaN(n) && n >= 0) segmentIndex = n;
    }
  }

  return { segmentIndex, from, only, verbose, sceneIndex };
}

export function shouldRunPhase(
  phase: Phase,
  from: Phase,
  only: Phase | undefined,
): boolean {
  if (only) {
    return phase === only;
  }
  return PHASES.indexOf(phase) >= PHASES.indexOf(from);
}

export function makeRunId(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}
