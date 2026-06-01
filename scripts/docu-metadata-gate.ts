#!/usr/bin/env tsx
// scripts/docu-metadata-gate.ts — metadata review gate (Step 3 / report P1 §8).
//
// Lints the human-authored YouTube metadata for a video — title, description,
// tags, and any claim text baked into the thumbnail — against the video's own
// narration (`prompts/docu/<slug>-topic.json`) and provenance (the publish
// manifest's research `sources`). It catches mechanical red flags before
// publish: fabricated figures in the title, fake-footage thumbnail language,
// certainty overstatement, and keyword stuffing.
//
// Metadata is read from `prompts/docu/<slug>-metadata.json` (shape:
// { title, description?, tags?, thumbnailText? }) when present, and any field
// may be overridden by a flag:
//
//   --title <text>           video title
//   --description <text>     video description
//   --tag <text>             a tag (repeatable; replaces file tags when given)
//   --thumbnail <text>       claim text shown on the thumbnail
//   --metadata-file <path>   read metadata JSON from an alternate path
//   --publish                strict mode: warnings also fail the gate
//
// The review (findings + verdict) is written to
// `prompts/docu/<slug>-metadata-review.json`. Exit code is non-zero when the
// gate blocks (always) or, in --publish mode, when any warning is present.
// This is an automated lint, not editorial sign-off.
//
// Usage:
//   npx tsx scripts/docu-metadata-gate.ts <slug> [--title "..."] [--description "..."]
//     [--tag "..."]... [--thumbnail "..."] [--metadata-file <path>] [--publish]

import fs from "node:fs";

import {
  NOT_EDITORIAL_SIGNOFF,
  runMetadataGate,
  type MetadataFinding,
  type VideoMetadata,
} from "../src/lib/docu/metadata-gate";
import { readCachedJson, writeCachedJson } from "../src/lib/docu/pipeline";
import { publishManifestPath, type PublishManifest } from "../src/lib/docu/publish-manifest";

const PROMPTS_DIR = "prompts/docu";

function metadataPath(slug: string): string {
  return `${PROMPTS_DIR}/${slug}-metadata.json`;
}

function reviewPath(slug: string): string {
  return `${PROMPTS_DIR}/${slug}-metadata-review.json`;
}

function topicPath(slug: string): string {
  return `${PROMPTS_DIR}/${slug}-topic.json`;
}

interface ParsedArgs {
  slug?: string;
  publishMode: boolean;
  overrides: Partial<VideoMetadata>;
  tags: string[];
  tagsGiven: boolean;
  metadataFile?: string;
}

function parseArgs(argv: string[]): ParsedArgs {
  const out: ParsedArgs = { publishMode: false, overrides: {}, tags: [], tagsGiven: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--publish") {
      out.publishMode = true;
    } else if (arg === "--title") {
      out.overrides.title = argv[++i] ?? "";
    } else if (arg === "--description") {
      out.overrides.description = argv[++i] ?? "";
    } else if (arg === "--thumbnail") {
      out.overrides.thumbnailText = argv[++i] ?? "";
    } else if (arg === "--tag") {
      out.tags.push(argv[++i] ?? "");
      out.tagsGiven = true;
    } else if (arg === "--metadata-file") {
      out.metadataFile = argv[++i];
    } else if (arg.startsWith("--")) {
      console.error(`Unknown flag: ${arg}`);
      process.exit(1);
    } else if (out.slug === undefined) {
      out.slug = arg;
    } else {
      console.error(`Unexpected argument: ${arg}`);
      process.exit(1);
    }
  }
  return out;
}

interface RawTopic {
  sentences?: Array<{ text?: string }>;
}

function loadNarration(slug: string): string[] {
  const topic = readCachedJson<RawTopic>(topicPath(slug));
  return (topic?.sentences ?? [])
    .map((s) => s.text)
    .filter((t): t is string => typeof t === "string" && t.trim().length > 0);
}

function resolveMetadata(args: ParsedArgs): VideoMetadata {
  const filePath = args.metadataFile ?? metadataPath(args.slug!);
  const fromFile = readCachedJson<Partial<VideoMetadata>>(filePath) ?? {};
  return {
    title: args.overrides.title ?? fromFile.title ?? "",
    description: args.overrides.description ?? fromFile.description,
    thumbnailText: args.overrides.thumbnailText ?? fromFile.thumbnailText,
    tags: args.tagsGiven ? args.tags : fromFile.tags,
  };
}

function printFinding(f: MetadataFinding): void {
  const tag = f.severity === "block" ? "BLOCK" : "warn ";
  console.log(`  [${tag}] ${f.check}: ${f.message}`);
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  if (!args.slug) {
    console.error(
      "Usage: npx tsx scripts/docu-metadata-gate.ts <slug> " +
        '[--title "..."] [--description "..."] [--tag "..."]... [--thumbnail "..."] ' +
        "[--metadata-file <path>] [--publish]",
    );
    process.exit(1);
  }

  const narration = loadNarration(args.slug);
  if (narration.length === 0) {
    console.error(
      `[docu] no narration at ${topicPath(args.slug)} — ` +
        `run the docu pipeline (topic phase) for "${args.slug}" first.`,
    );
    process.exit(1);
  }

  const manifest = readCachedJson<PublishManifest>(publishManifestPath(args.slug));
  const hasSources = (manifest?.sources?.length ?? 0) > 0;

  const meta = resolveMetadata(args);
  if (!meta.title && !meta.description && (!meta.tags || meta.tags.length === 0) && !meta.thumbnailText) {
    console.error(
      `[docu] no metadata supplied — provide ${metadataPath(args.slug)} or pass ` +
        "--title/--description/--tag/--thumbnail flags.",
    );
    process.exit(1);
  }

  const result = runMetadataGate(meta, { narration, hasSources });
  const blocks = result.findings.filter((f) => f.severity === "block").length;
  const warns = result.findings.filter((f) => f.severity === "warn").length;
  const failed = result.blocked || (args.publishMode && warns > 0);

  const review = {
    slug: args.slug,
    reviewedAt: new Date().toISOString(),
    publishMode: args.publishMode,
    hasSources,
    metadata: meta,
    findings: result.findings,
    blocked: result.blocked,
    clean: result.clean,
    passed: !failed,
    note: NOT_EDITORIAL_SIGNOFF,
  };
  const out = reviewPath(args.slug);
  writeCachedJson(out, review);

  if (result.clean) {
    console.log(`[docu] metadata-gate: CLEAN — no findings.`);
  } else {
    console.log(`[docu] metadata-gate: ${blocks} block(s), ${warns} warning(s).`);
    for (const f of result.findings) printFinding(f);
  }
  console.log(`[docu] ${NOT_EDITORIAL_SIGNOFF}`);
  console.log(`[docu] review written: ${out} — ${failed ? "NOT READY" : "OK"}`);

  if (failed) process.exit(1);
}

main();
