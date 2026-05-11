import { STYLE_PRESETS, DEFAULT_STYLE, type StylePreset } from "./config";

export type Phase = "narrative" | "tts" | "images" | "code";
export const PHASES: Phase[] = ["narrative", "tts", "images", "code"];

export function parsePhase(value: string | undefined): Phase | undefined {
  if (
    value === "narrative" ||
    value === "tts" ||
    value === "images" ||
    value === "code"
  ) {
    return value;
  }
  return undefined;
}

function parseStylePreset(value: string | undefined): StylePreset | undefined {
  if (value && value in STYLE_PRESETS) {
    return value as StylePreset;
  }
  return undefined;
}

export function parseArgs(): {
  segmentIndex: number;
  from: Phase;
  only?: Phase;
  verbose: boolean;
  sceneIndex?: number;
  style: StylePreset;
} {
  const args = process.argv.slice(2);
  let segmentIndex = 0;
  let from: Phase = parsePhase(process.env.npm_config_from) ?? "narrative";
  let only = parsePhase(process.env.npm_config_only);
  let verbose = false;
  let sceneIndex: number | undefined;
  let style: StylePreset = DEFAULT_STYLE;

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
          `Unknown phase: ${phase}. Use --from=narrative|tts|images|code`,
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
          `Unknown phase: ${phase}. Use --only=narrative|tts|images|code`,
        );
        process.exit(1);
      }
    } else if (arg.startsWith("--style=")) {
      const preset = arg.split("=")[1];
      const parsedStyle = parseStylePreset(preset);
      if (parsedStyle) {
        style = parsedStyle;
      } else {
        const validStyles = Object.keys(STYLE_PRESETS).join("|");
        console.error(
          `Unknown style: ${preset}. Use --style=${validStyles}`,
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

  return { segmentIndex, from, only, verbose, sceneIndex, style };
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


