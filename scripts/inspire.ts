import fs from "node:fs";
import path from "node:path";
import { topicToSlug } from "../src/lib/inspire/slug";
import { runInspirePipeline } from "../src/lib/inspire/inspire-pipeline";
import type { InspirePhase } from "../src/lib/inspire/inspire-pipeline";

process.loadEnvFile();

const VALID_PHASES = ["narration", "tts", "videos", "compose"] as const;

function parsePhase(value: string): InspirePhase | undefined {
  return VALID_PHASES.includes(value as InspirePhase)
    ? (value as InspirePhase)
    : undefined;
}

function printHelp(): void {
  console.log(`
Usage: tsx scripts/inspire.ts "<topic>" [--from=<phase>] [--clean] [--verbose]

Phases: narration, tts, videos, compose

Options:
  --from=<phase>  Resume from a specific phase (uses cached artifacts for earlier phases)
  --clean         Delete all cached artifacts for this topic before running
  --verbose       Enable verbose logging

Examples:
  tsx scripts/inspire.ts "the power of showing up every day"
  tsx scripts/inspire.ts "resilience" --from=tts
  tsx scripts/inspire.ts "the power of showing up every day" --clean
  tsx scripts/inspire.ts "the power of showing up every day" --from=compose

Note: The slug is derived from the topic. Identical topics share cached artifacts.
`);
}

function cleanArtifacts(slug: string): void {
  const artifacts = [
    `prompts/inspire/${slug}-narration.txt`,
    `prompts/inspire/${slug}-timings.json`,
    `prompts/inspire/${slug}-clip-plan.json`,
    `prompts/inspire/${slug}.json`,
    `public/audio/inspire/${slug}.wav`,
  ];

  let removed = 0;

  for (const file of artifacts) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`  [clean] removed: ${file}`);
      removed++;
    }
  }

  const videoDir = `public/videos/inspire/${slug}`;
  if (fs.existsSync(videoDir)) {
    fs.rmSync(videoDir, { recursive: true, force: true });
    console.log(`  [clean] removed: ${videoDir}/`);
    removed++;
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

  for (const arg of args) {
    if (arg.startsWith("--from=")) {
      const phase = parsePhase(arg.split("=")[1]);
      if (!phase) {
        console.error(
          `Unknown phase: ${arg.split("=")[1]}. Use --from=narration|tts|videos|compose`,
        );
        process.exit(1);
      }
      from = phase;
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

  await runInspirePipeline({ topic, slug, from, verbose });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
