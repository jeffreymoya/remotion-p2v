import fs from "node:fs";
import path from "node:path";
import type { Segment } from "./parse-script";
import { deepseekChat, DeepSeekError } from "./deepseek";
import {
  buildNarrativeCheckPrompt,
  parseNarrativeCheckResponse,
} from "./build-narrative-check-prompt";
import { makeDeepSeekRecorders } from "./deepseek-recorders";
import {
  NARRATIVE_CHECK_TEMPERATURE,
  NARRATIVE_CHECK_REASONING,
} from "./config";

export async function runNarrativePhase(
  segment: Segment,
  narrativePath: string,
  runDir: string,
  args: { verbose: boolean },
): Promise<void> {
  console.log("Phase 0: Scoring and enhancing segment narrative...");
  const { system: narSystem, user: narUser } =
    buildNarrativeCheckPrompt(segment);

  let narResponse: string;
  try {
    narResponse = await deepseekChat(
      [
        { role: "system", content: narSystem },
        { role: "user", content: narUser },
      ],
      NARRATIVE_CHECK_TEMPERATURE,
      NARRATIVE_CHECK_REASONING,
      {
        verbose: args.verbose,
        ...makeDeepSeekRecorders(
          "narrative",
          path.join(runDir, "00-narrative.response.txt"),
          path.join(runDir, "00-narrative.thinking.txt"),
          args.verbose,
        ),
      },
    );
  } catch (err) {
    if (err instanceof DeepSeekError) {
      console.error(`DeepSeek API error (narrative check): ${err.message}`);
      process.exit(1);
    }
    throw err;
  }

  if (args.verbose) process.stdout.write("\n");

  const { totalScore, enhancedNarrative } =
    parseNarrativeCheckResponse(narResponse);
  console.log(`  Narrative rubric score: ${totalScore}/20`);

  if (totalScore < 14) {
    console.warn(
      `  ⚠ Score below 14/20 — narrative may produce a weak composition.`,
    );
  }

  fs.writeFileSync(narrativePath, narResponse, "utf-8");
  console.log(`  Saved narrative check: ${narrativePath}`);

  if (enhancedNarrative) {
    console.log(
      `  Enhanced narrative length: ${enhancedNarrative.length} chars\n`,
    );
  } else {
    console.warn("  Could not extract enhanced narrative from response.\n");
  }
}

export function loadEnhancedNarrative(
  segment: Segment,
  narrativePath: string,
  logUsage: boolean,
): Segment {
  if (!fs.existsSync(narrativePath)) {
    return segment;
  }
  const narRaw = fs.readFileSync(narrativePath, "utf-8");
  const { enhancedNarrative } = parseNarrativeCheckResponse(narRaw);
  if (enhancedNarrative) {
    if (logUsage) {
      console.log(`Using enhanced narrative from: ${narrativePath}\n`);
    }
    return { ...segment, narrative: enhancedNarrative };
  }
  return segment;
}
