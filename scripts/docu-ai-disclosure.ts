#!/usr/bin/env tsx
// scripts/docu-ai-disclosure.ts — AI-disclosure decision helper (YPP Backlog 5).
//
// Records the recommended YouTube Studio AI-use answer for a video and writes
// the rationale into its publish manifest (`prompts/docu/<slug>-publish-manifest.json`).
// The publish-manifest phase leaves `aiDisclosure` null and blocks "ready to
// publish" until this helper (or a human) fills it in; this script is the
// producer for that field.
//
// By default it answers from the current pipeline's reality — animated
// compositions + synthetic narration TTS + licensed stock + attributed real
// clips — which requires no disclosure. Pass a flag for each kind of realistic
// altered/synthetic content the video actually contains to flip the answer:
//
//   --synthetic-people     AI-generated realistic people, faces, or avatars
//   --altered-footage      altered footage of a real event or place
//   --synthetic-scenes     a generated realistic scene that did not occur
//   --fabricated-speech    a real person made to appear to say/do something
//   --cloned-voice         a cloned voice of an identifiable real person
//
// Use --publish to re-assess readiness in publish mode (matches the pipeline's
// clip-gate semantics). This is a workflow aid, not legal advice.
//
// Usage:
//   npx tsx scripts/docu-ai-disclosure.ts <slug> [signal flags] [--publish]

import {
  decideAiDisclosure,
  NOT_LEGAL_ADVICE,
  type DisclosureSignals,
} from "../src/lib/docu/ai-disclosure";
import { readCachedJson, writeCachedJson } from "../src/lib/docu/pipeline";
import {
  assessReadiness,
  publishManifestPath,
  type PublishManifest,
} from "../src/lib/docu/publish-manifest";

const FLAG_TO_SIGNAL: Record<string, keyof DisclosureSignals> = {
  "--synthetic-people": "syntheticRealisticPeople",
  "--altered-footage": "alteredRealEventFootage",
  "--synthetic-scenes": "syntheticRealisticScenes",
  "--fabricated-speech": "fabricatedRealPersonSpeech",
  "--cloned-voice": "clonedVoiceOfRealPerson",
};

function parseArgs(argv: string[]): { slug?: string; signals: DisclosureSignals; publishMode: boolean } {
  const signals: DisclosureSignals = {};
  let slug: string | undefined;
  let publishMode = false;

  for (const arg of argv) {
    if (arg === "--publish") {
      publishMode = true;
    } else if (arg in FLAG_TO_SIGNAL) {
      signals[FLAG_TO_SIGNAL[arg]!] = true;
    } else if (arg.startsWith("--")) {
      console.error(`Unknown flag: ${arg}`);
      process.exit(1);
    } else if (slug === undefined) {
      slug = arg;
    } else {
      console.error(`Unexpected argument: ${arg}`);
      process.exit(1);
    }
  }
  return { slug, signals, publishMode };
}

function main(): void {
  const { slug, signals, publishMode } = parseArgs(process.argv.slice(2));
  if (!slug) {
    console.error(
      "Usage: npx tsx scripts/docu-ai-disclosure.ts <slug> " +
        "[--synthetic-people] [--altered-footage] [--synthetic-scenes] " +
        "[--fabricated-speech] [--cloned-voice] [--publish]",
    );
    process.exit(1);
  }

  const path = publishManifestPath(slug);
  const manifest = readCachedJson<PublishManifest>(path);
  if (!manifest) {
    console.error(
      `[docu] no publish manifest at ${path} — ` +
        `run the docu pipeline (publish-manifest phase) for "${slug}" first.`,
    );
    process.exit(1);
  }

  // The narration is always synthetic TTS in this pipeline; surface it as
  // contextual so the rationale states it was considered and excluded.
  const { disclosure, triggers } = decideAiDisclosure({ ...signals, syntheticNarrationVoice: true });

  // Persist the decision and re-assess readiness (aiDisclosure was a gap).
  const updated: PublishManifest = { ...manifest, aiDisclosure: disclosure };
  const { readyToPublish, missing } = assessReadiness(updated, publishMode);
  const next: PublishManifest = { ...updated, readyToPublish, missing };
  writeCachedJson(path, next);

  console.log(
    `[docu] ai-disclosure: ${disclosure.containsSyntheticPeopleVoicesOrEvents ? "DISCLOSE" : "no disclosure"} — ` +
      `${disclosure.recommendedStudioAnswer}`,
  );
  if (triggers.length > 0) {
    for (const t of triggers) console.log(`  • ${t}`);
  }
  console.log(`[docu] ${NOT_LEGAL_ADVICE}`);
  console.log(
    `[docu] manifest updated: ${path} — ` +
      `${next.readyToPublish ? "READY" : "NOT READY"}` +
      (next.missing.length > 0 ? ` (missing: ${next.missing.join("; ")})` : ""),
  );
}

main();
