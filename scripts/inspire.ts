import fs from "node:fs";
import path from "node:path";
import { topicToSlug } from "../src/lib/inspire/slug";
import { runLongformPipeline } from "../src/lib/inspire/longform-pipeline";
import type { InspirePhase } from "../src/lib/inspire/inspire-pipeline";

process.loadEnvFile();

const VALID_PHASES = ["narration", "tts", "videos", "artdirect", "compose"] as const;

function parsePhase(value: string): InspirePhase | undefined {
  return VALID_PHASES.includes(value as InspirePhase)
    ? (value as InspirePhase)
    : undefined;
}

function printHelp(): void {
  console.log(`
Usage: tsx scripts/inspire.ts "<topic>" [options]

Options:
  --segments=N    Total segments to generate via DeepSeek (default: 5, each ~2–3 min)
  --limit=N       Process only the first N segments (default: all; useful for testing)
  --from=<phase>  Resume from a specific phase (uses cached artifacts for earlier phases)
  --clean         Delete all cached artifacts for this topic before running
  --verbose       Enable verbose logging

Phases: narration, tts, videos, artdirect, compose

Examples:
  tsx scripts/inspire.ts "the power of showing up every day"
  tsx scripts/inspire.ts "resilience" --segments=6
  tsx scripts/inspire.ts "resilience" --segments=6 --limit=2
  tsx scripts/inspire.ts "resilience" --from=tts
  tsx scripts/inspire.ts "resilience" --from=videos --limit=3
  tsx scripts/inspire.ts "resilience" --clean

Note: --limit produces a shorter combined video (first N segments only) — useful
for testing the pipeline end-to-end without downloading all video clips.
`);
}

function cleanArtifacts(slug: string): void {
  const PROMPTS_DIR = "prompts/inspire";
  const AUDIO_DIR = "public/audio/inspire";
  const VIDEO_BASE = "public/videos/inspire";
  let removed = 0;

  if (fs.existsSync(PROMPTS_DIR)) {
    for (const entry of fs.readdirSync(PROMPTS_DIR)) {
      if (!entry.endsWith(".json") && !entry.endsWith(".txt")) continue;
      if (entry === `${slug}.json` || entry.startsWith(`${slug}-`)) {
        const p = path.join(PROMPTS_DIR, entry);
        fs.unlinkSync(p);
        console.log(`  [clean] removed: ${p}`);
        removed++;
      }
    }
  }

  if (fs.existsSync(AUDIO_DIR)) {
    for (const entry of fs.readdirSync(AUDIO_DIR)) {
      if (!entry.endsWith(".wav")) continue;
      if (entry === `${slug}.wav` || entry.startsWith(`${slug}-`)) {
        const p = path.join(AUDIO_DIR, entry);
        fs.unlinkSync(p);
        console.log(`  [clean] removed: ${p}`);
        removed++;
      }
    }
  }

  if (fs.existsSync(VIDEO_BASE)) {
    for (const entry of fs.readdirSync(VIDEO_BASE)) {
      if (entry !== slug && !entry.startsWith(`${slug}-`)) continue;
      const dirPath = path.join(VIDEO_BASE, entry);
      if (fs.statSync(dirPath).isDirectory()) {
        fs.rmSync(dirPath, { recursive: true, force: true });
        console.log(`  [clean] removed: ${dirPath}/`);
        removed++;
      }
    }
  }

  if (removed === 0) {
    console.log(`  [clean] no artifacts found for slug: ${slug}`);
  } else {
    console.log(`  [clean] ${removed} artifact(s) removed`);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    printHelp();
    process.exit(0);
  }

  let topic: string | undefined;
  let from: InspirePhase | undefined;
  let clean = false;
  let verbose = false;
  let segmentCount = 5;
  let limit: number | undefined;

  for (const arg of args) {
    if (arg.startsWith("--from=")) {
      const phase = parsePhase(arg.split("=")[1]);
      if (!phase) {
        console.error(
          `Unknown phase: ${arg.split("=")[1]}. Use --from=narration|tts|videos|artdirect|compose`,
        );
        process.exit(1);
      }
      from = phase;
    } else if (arg.startsWith("--segments=")) {
      const n = parseInt(arg.split("=")[1], 10);
      if (isNaN(n) || n < 1 || n > 8) {
        console.error("--segments must be an integer between 1 and 8");
        process.exit(1);
      }
      segmentCount = n;
    } else if (arg.startsWith("--limit=")) {
      const n = parseInt(arg.split("=")[1], 10);
      if (isNaN(n) || n < 1) {
        console.error("--limit must be a positive integer");
        process.exit(1);
      }
      limit = n;
    } else if (arg === "--clean") {
      clean = true;
    } else if (arg === "--verbose") {
      verbose = true;
    } else if (!arg.startsWith("--")) {
      topic = arg;
    }
  }

  if (!topic) {
    console.error('Error: topic is required. Usage: tsx scripts/inspire.ts "<topic>"');
    process.exit(1);
  }

  const slug = topicToSlug(topic);
  if (!slug) {
    console.error("Error: topic produced an empty slug");
    process.exit(1);
  }

  if (clean) {
    cleanArtifacts(slug);
  }

  if (limit !== undefined && limit > segmentCount) {
    console.warn(
      `  [warn] --limit=${limit} exceeds --segments=${segmentCount}; clamped to ${segmentCount}`,
    );
    limit = segmentCount;
  }

  await runLongformPipeline({ topic, slug, segmentCount, limit, from, verbose });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
